import { Router } from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

interface AboutRow {
  id: number;
  photo: string;
  fio: string;
  text_about: string;
  email: string;
}

// GET /api/about
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM about').all() as AboutRow[];
  res.json(rows);
});

// GET /api/about/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM about WHERE id = ?').get(req.params.id) as AboutRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(row);
});

// POST /api/about
router.post('/', requireAuth, (req, res) => {
  const { photo, fio, text_about, email } =
    req.body as { photo?: string; fio?: string; text_about?: string; email?: string };
  if (!photo || !fio || !text_about || !email) {
    res.status(400).json({ error: 'photo, fio, text_about and email are required' });
    return;
  }
  const result = db
    .prepare('INSERT INTO about (photo, fio, text_about, email) VALUES (?, ?, ?, ?)')
    .run(photo, fio, text_about, email);
  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/about/:id
router.put('/:id', requireAuth, (req, res) => {
  const { photo, fio, text_about, email } =
    req.body as { photo?: string; fio?: string; text_about?: string; email?: string };
  if (!photo || !fio || !text_about || !email) {
    res.status(400).json({ error: 'photo, fio, text_about and email are required' });
    return;
  }
  const result = db
    .prepare('UPDATE about SET photo = ?, fio = ?, text_about = ?, email = ? WHERE id = ?')
    .run(photo, fio, text_about, email, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ updated: true });
});

// DELETE /api/about/:id
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM about WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ deleted: true });
});

export default router;
