import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'multimodal-assets';
let bucketVerified = false;

/**
 * Ensures the target Supabase storage bucket exists
 */
export async function ensureBucketExists() {
  if (!isSupabaseConfigured || !supabaseAdmin || bucketVerified) return;

  try {
    const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets();
    if (listErr) {
      console.warn('[Supabase Storage] Failed to list buckets:', listErr.message);
      return;
    }

    const exists = buckets.some(b => b.name === BUCKET_NAME);
    if (!exists) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true, // Enables direct preview & streaming for multimodal assets
        fileSizeLimit: 52428800 // 50MB
      });
      if (createErr) {
        console.warn(`[Supabase Storage] Could not auto-create bucket "${BUCKET_NAME}":`, createErr.message);
      } else {
        console.log(`[Supabase Storage] Bucket "${BUCKET_NAME}" created successfully.`);
        bucketVerified = true;
      }
    } else {
      bucketVerified = true;
    }
  } catch (err) {
    console.warn('[Supabase Storage] Error verifying bucket:', err.message);
  }
}

/**
 * Uploads a file buffer or stream to Supabase Storage
 */
export async function uploadToSupabaseStorage({ fileBuffer, fileName, mimeType, userId }) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return {
      storageType: 'local',
      path: null,
      publicUrl: null
    };
  }

  try {
    await ensureBucketExists();

    const storagePath = `${userId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.warn('[Supabase Storage] Upload error:', error.message);
      return {
        storageType: 'local',
        path: null,
        publicUrl: null,
        error: error.message
      };
    }

    // Retrieve public URL
    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return {
      storageType: 'supabase',
      path: storagePath,
      bucket: BUCKET_NAME,
      publicUrl: publicData?.publicUrl || null
    };
  } catch (err) {
    console.error('[Supabase Storage] Exception during upload:', err.message);
    return {
      storageType: 'local',
      path: null,
      publicUrl: null,
      error: err.message
    };
  }
}

/**
 * Deletes a file from Supabase Storage
 */
export async function deleteFromSupabaseStorage(storagePath) {
  if (!isSupabaseConfigured || !supabaseAdmin || !storagePath) return false;

  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.warn('[Supabase Storage] Delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase Storage] Exception during delete:', err.message);
    return false;
  }
}

/**
 * Generates a temporary signed URL for private assets
 */
export async function getSignedUrl(storagePath, expiresInSeconds = 3600) {
  if (!isSupabaseConfigured || !supabaseAdmin || !storagePath) return null;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      console.warn('[Supabase Storage] Error creating signed URL:', error.message);
      return null;
    }
    return data?.signedUrl || null;
  } catch (err) {
    console.error('[Supabase Storage] Signed URL exception:', err.message);
    return null;
  }
}

