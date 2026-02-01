import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + (file.originalname || 'file').replace(/\s/g, '-')),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();
router.use(authMiddleware);

router.post('/:clubId', requireRole('club_admin', 'super_admin'), upload.single('file'), (req, res) => {
  const { clubId } = req.params;
  const { type, event_id } = req.body;
  if (!type || !['poster', 'photo', 'report'].includes(type)) {
    return res.status(400).json({ error: 'type must be poster, photo, or report' });
  }
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId);
  if (!club) return res.status(404).json({ error: 'Club not found' });
  if (req.user.role === 'club_admin' && req.user.clubId !== Number(clubId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = '/uploads/' + req.file.filename;
  const r = db.prepare(
    'INSERT INTO uploads (club_id, event_id, type, url, uploaded_by) VALUES (?, ?, ?, ?, ?)'
  ).run(clubId, event_id || null, type, url, req.user.id);
  const row = db.prepare('SELECT * FROM uploads WHERE id = ?').get(r.lastInsertRowid);
  res.status(201).json(row);
});

router.get('/club/:clubId', (req, res) => {
  const list = db.prepare(`
    SELECT u.*, e.title as event_title FROM uploads u
    LEFT JOIN events e ON u.event_id = e.id
    WHERE u.club_id = ?
    ORDER BY u.created_at DESC
  `).all(req.params.clubId);
  res.json(list);
});

export default router;
