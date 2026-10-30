import fs from 'fs';
import path from 'path';
import db from '../config/db.js';
import { getModality } from '../middleware/upload.middleware.js';
import { extractAssetMetadata } from '../services/gemini.service.js';
import { uploadToSupabaseStorage, deleteFromSupabaseStorage } from '../services/supabase-storage.service.js';

/**
 * Upload single or multiple multimodal files
 */
export async function uploadAssets(req, res) {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files were uploaded. Please select one or more supported files.'
      });
    }

    const userId = req.user.id;
    const uploadedAssets = [];

    for (const file of files) {
      const modality = getModality(file.mimetype, file.originalname);
      const title = req.body.title || file.originalname.replace(/\.[^/.]+$/, '');
      const filePath = file.path;
      const fileSize = file.size;
      const mimeType = file.mimetype;
      const fileName = file.filename;

      // Read file buffer for Gemini AI analysis and Supabase Storage upload
      let fileBuffer = null;
      try {
        fileBuffer = fs.readFileSync(filePath);
      } catch (readErr) {
        console.error('Error reading file buffer:', readErr);
      }

      // Perform extraction via Gemini AI
      let aiResult = {
        summary: 'Asset processing initiated.',
        key_topics: [modality],
        extracted_entities: [],
        sentiment: 'Neutral',
        extracted_text: ''
      };

      if (fileBuffer) {
        try {
          aiResult = await extractAssetMetadata(fileBuffer, mimeType, file.originalname, modality);
        } catch (aiErr) {
          console.error('[Asset Controller] AI extraction error:', aiErr.message);
        }
      }

      // Upload to Supabase Storage if configured
      let supabaseResult = { storageType: 'local', publicUrl: null, path: null };
      if (fileBuffer) {
        try {
          supabaseResult = await uploadToSupabaseStorage({
            fileBuffer,
            fileName: file.originalname,
            mimeType,
            userId
          });
        } catch (sErr) {
          console.warn('[Asset Controller] Supabase storage upload warning:', sErr.message);
        }
      }

      const metadata = {
        originalName: file.originalname,
        encoding: file.encoding,
        sentiment: aiResult.sentiment,
        keyTopics: aiResult.key_topics,
        extractedEntities: aiResult.extracted_entities,
        storageType: supabaseResult.storageType,
        supabasePath: supabaseResult.path,
        storageUrl: supabaseResult.publicUrl
      };

      // Insert asset record into PostgreSQL / Supabase
      const insertResult = await db.query(
        `INSERT INTO assets (
          user_id, title, file_name, file_path, file_size, mime_type, modality, extracted_text, ai_summary, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          userId,
          title,
          fileName,
          filePath,
          fileSize,
          mimeType,
          modality,
          aiResult.extracted_text || '',
          aiResult.summary || '',
          JSON.stringify(metadata)
        ]
      );

      uploadedAssets.push(insertResult.rows[0]);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully uploaded and processed ${uploadedAssets.length} asset(s).`,
      assets: uploadedAssets
    });
  } catch (err) {
    console.error('[Asset Controller] Upload Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to process and store uploaded asset(s).'
    });
  }
}

/**
 * List all assets for the authenticated user with optional filtering
 */
export async function listAssets(req, res) {
  try {
    const userId = req.user.id;
    const { modality, search } = req.query;

    let sql = 'SELECT * FROM assets WHERE user_id = $1';
    const params = [userId];

    if (modality && modality !== 'all') {
      params.push(modality.toLowerCase());
      sql += ` AND modality = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await db.query(sql, params);
    let assets = result.rows || [];

    // Optional text query filter
    if (search && search.trim().length > 0) {
      const q = search.toLowerCase().trim();
      assets = assets.filter(a => 
        a.title.toLowerCase().includes(q) ||
        (a.file_name && a.file_name.toLowerCase().includes(q)) ||
        (a.ai_summary && a.ai_summary.toLowerCase().includes(q)) ||
        (a.extracted_text && a.extracted_text.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: assets.length,
      assets
    });
  } catch (err) {
    console.error('[Asset Controller] List Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve asset collection.'
    });
  }
}

/**
 * Get detailed asset by ID
 */
export async function getAssetById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM assets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found or unauthorized access.'
      });
    }

    return res.status(200).json({
      success: true,
      asset: result.rows[0]
    });
  } catch (err) {
    console.error('[Asset Controller] GetById Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve asset details.'
    });
  }
}

/**
 * Stream/serve underlying asset media file
 */
export async function streamAssetFile(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'SELECT file_path, mime_type, file_name, title, metadata FROM assets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Asset not found.' });
    }

    const asset = result.rows[0];

    // If Supabase Storage public URL exists, redirect directly
    if (asset.metadata?.storageUrl) {
      return res.redirect(asset.metadata.storageUrl);
    }

    // Fallback to local streaming
    if (!fs.existsSync(asset.file_path)) {
      return res.status(404).json({ success: false, error: 'Underlying file missing from storage.' });
    }

    res.setHeader('Content-Type', asset.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${asset.file_name}"`);
    const stream = fs.createReadStream(asset.file_path);
    stream.pipe(res);
  } catch (err) {
    console.error('[Asset Controller] Stream Error:', err);
    return res.status(500).json({ success: false, error: 'Error streaming file.' });
  }
}

/**
 * Delete asset and remove from filesystem and Supabase Storage
 */
export async function deleteAsset(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'SELECT file_path, metadata FROM assets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found or unauthorized.'
      });
    }

    const asset = result.rows[0];
    const filePath = asset.file_path;
    const supabasePath = asset.metadata?.supabasePath;

    // Delete record from DB
    await db.query('DELETE FROM assets WHERE id = $1 AND user_id = $2', [id, userId]);

    // Unlink physical local file safely
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.warn('Could not remove file from disk:', unlinkErr.message);
      }
    }

    // Delete from Supabase Storage if stored there
    if (supabasePath) {
      try {
        await deleteFromSupabaseStorage(supabasePath);
      } catch (sbErr) {
        console.warn('Could not remove file from Supabase storage:', sbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Asset and storage file deleted successfully.'
    });
  } catch (err) {
    console.error('[Asset Controller] Delete Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete asset.'
    });
  }
}

/**
 * Get aggregated dashboard statistics
 */
export async function getDashboardStats(req, res) {
  try {
    const userId = req.user.id;

    const assetsRes = await db.query('SELECT * FROM assets WHERE user_id = $1', [userId]);
    const assets = assetsRes.rows || [];

    const breakdown = {
      document: 0,
      image: 0,
      audio: 0,
      video: 0,
      text: 0
    };

    let totalSizeBytes = 0;
    assets.forEach(a => {
      const mod = (a.modality || 'document').toLowerCase();
      breakdown[mod] = (breakdown[mod] || 0) + 1;
      totalSizeBytes += parseInt(a.file_size, 10) || 0;
    });

    const sessionsRes = await db.query('SELECT COUNT(*) FROM chat_sessions WHERE user_id = $1', [userId]);
    const reportsRes = await db.query('SELECT COUNT(*) FROM reports WHERE user_id = $1', [userId]);

    return res.status(200).json({
      success: true,
      stats: {
        totalAssets: assets.length,
        modalityBreakdown: breakdown,
        totalStorageBytes: totalSizeBytes,
        totalSessions: parseInt(sessionsRes.rows[0]?.count || 0, 10),
        totalReports: parseInt(reportsRes.rows[0]?.count || 0, 10),
        recentAssets: assets.slice(0, 5)
      }
    });
  } catch (err) {
    console.error('[Asset Controller] Stats Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to load dashboard metrics.'
    });
  }
}
