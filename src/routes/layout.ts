import { Router } from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM page_layout ORDER BY sort_order ASC').all();
  res.json(rows);
});

// Batch reorder: body = [{ id, sort_order }, ...]
router.put('/reorder', requireAuth, (req, res) => {
  const rows = req.body as { id: number; sort_order: number }[];
  if (!Array.isArray(rows)) { res.status(400).json({ error: 'array expected' }); return; }
  const upd = db.prepare('UPDATE page_layout SET sort_order = ? WHERE id = ?');
  const tx = db.transaction(() => { rows.forEach(r => upd.run(r.sort_order, r.id)); });
  tx();
  res.json({ ok: true });
});

// Toggle visible
router.put('/:id/visible', requireAuth, (req, res) => {
  const v = (req.body as { visible: number }).visible ? 1 : 0;
  const row = db.prepare('SELECT section_key FROM page_layout WHERE id = ?').get(req.params.id) as { section_key: string } | undefined;
  db.prepare('UPDATE page_layout SET visible = ? WHERE id = ?').run(v, req.params.id);
  if (row?.section_key?.startsWith('custom-')) {
    db.prepare('UPDATE custom_sections SET visible = ? WHERE id = ?').run(v, row.section_key.replace('custom-', ''));
  }
  res.json({ ok: true });
});

export default router;
