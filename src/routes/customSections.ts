import { Router } from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM custom_sections WHERE visible = 1 ORDER BY sort_order ASC, id ASC').all();
  res.json(rows);
});

router.get('/all', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM custom_sections ORDER BY sort_order ASC, id ASC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { title, text, photo, photo_side, sort_order, visible } = req.body as {
    title: string; text?: string; photo?: string;
    photo_side?: string; sort_order?: number; visible?: number
  };
  if (!title?.trim()) { res.status(400).json({ error: 'title required' }); return; }
  const result = db.prepare(
    'INSERT INTO custom_sections (title, text, photo, photo_side, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    title.trim(),
    (text ?? '').trim(),
    (photo ?? '').trim(),
    photo_side === 'left' ? 'left' : 'right',
    sort_order ?? 0,
    visible ?? 1
  );
  const newId = result.lastInsertRowid;
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM page_layout').get() as { m: number | null }).m ?? -1;
  db.prepare('INSERT OR IGNORE INTO page_layout (section_key, label, sort_order) VALUES (?, ?, ?)').run(`custom-${newId}`, title.trim(), maxOrder + 1);
  res.status(201).json({ id: newId });
});

router.put('/:id', requireAuth, (req, res) => {
  const { title, text, photo, photo_side, sort_order, visible } = req.body as {
    title: string; text?: string; photo?: string;
    photo_side?: string; sort_order?: number; visible?: number
  };
  if (!title?.trim()) { res.status(400).json({ error: 'title required' }); return; }
  const v = visible ?? 1;
  const result = db.prepare(
    'UPDATE custom_sections SET title=?, text=?, photo=?, photo_side=?, sort_order=?, visible=? WHERE id=?'
  ).run(title.trim(), (text ?? '').trim(), (photo ?? '').trim(), photo_side === 'left' ? 'left' : 'right', sort_order ?? 0, v, req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  // Keep page_layout visibility in sync
  db.prepare('UPDATE page_layout SET visible=?, label=? WHERE section_key=?').run(v, title.trim(), `custom-${req.params.id}`);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM custom_sections WHERE id=?').run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  db.prepare('DELETE FROM page_layout WHERE section_key = ?').run(`custom-${req.params.id}`);
  res.status(204).end();
});

export default router;
