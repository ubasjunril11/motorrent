const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const fullUploadPath = path.join(__dirname, '../../', uploadDir);

if (!fs.existsSync(fullUploadPath)) {
  fs.mkdirSync(fullUploadPath, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const resolveExtension = (originalname, mimetype) => {
  const ext = path.extname(originalname || '').toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) return ext;
  if (MIME_TO_EXT[mimetype]) return MIME_TO_EXT[mimetype];
  if (mimetype?.startsWith('image/')) return '.jpg';
  return '';
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, fullUploadPath),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = resolveExtension(file.originalname, file.mimetype) || '.jpg';
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const extOk = ALLOWED_EXTENSIONS.has(ext);
  const mimeOk = Boolean(MIME_TO_EXT[file.mimetype]) || file.mimetype?.startsWith('image/');

  // Accept if extension OR mime type looks like an image (web uploads often miss one of these)
  if (extOk || mimeOk) {
    cb(null, true);
    return;
  }

  cb(new Error('Only image files are allowed (jpeg, png, webp, gif).'));
};

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
