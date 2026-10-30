import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate clean sanitized filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginal}`);
  }
});

// Allowed MIME types mapped to modalities
export const ALLOWED_MIME_TYPES = {
  // Documents
  'application/pdf': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'text/plain': 'document',
  'text/markdown': 'document',
  'text/csv': 'document',
  // Images
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  // Audio
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  // Video
  'video/mp4': 'video',
  'video/avi': 'video',
  'video/x-msvideo': 'video',
  'video/quicktime': 'video'
};

export function getModality(mimeType, originalName = '') {
  if (ALLOWED_MIME_TYPES[mimeType]) {
    return ALLOWED_MIME_TYPES[mimeType];
  }

  // Fallback by extension
  const ext = path.extname(originalName).toLowerCase();
  if (['.pdf', '.docx', '.txt', '.md', '.csv'].includes(ext)) return 'document';
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';
  if (['.mp3', '.wav', '.m4a'].includes(ext)) return 'audio';
  if (['.mp4', '.avi', '.mov'].includes(ext)) return 'video';
  return 'document';
}

// Multer Filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedMime = ALLOWED_MIME_TYPES[file.mimetype];
  const isAllowedExt = ['.pdf', '.docx', '.txt', '.md', '.csv', '.jpg', '.jpeg', '.png', '.webp', '.mp3', '.wav', '.mp4', '.avi', '.mov'].includes(ext);

  if (isAllowedMime || isAllowedExt) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types include PDF, DOCX, TXT, PNG, JPEG, WEBP, MP3, WAV, MP4, AVI.`));
  }
};

const maxSizeBytes = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50) * 1024 * 1024;

export const upload = multer({
  storage,
  limits: {
    fileSize: maxSizeBytes
  },
  fileFilter
});

