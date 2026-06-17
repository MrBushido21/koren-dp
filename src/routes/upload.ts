import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}${ext}`);
  },
});

const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.has(ext) && ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Дозволені лише зображення (jpg, png, webp, gif, avif)'));
    }
  },
});

const router = Router();

router.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'Файл не отримано' }); return; }
  res.json({ url: `/uploads/${req.file.filename}` });
});

router.delete('/:filename', requireAuth, (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename.includes('/') || filename.includes('..') || filename.includes('\\') || Array.isArray(filename)) {
    res.status(400).json({ error: 'invalid filename' }); return;
  }
  const filepath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  res.status(204).end();
});

export default router;
