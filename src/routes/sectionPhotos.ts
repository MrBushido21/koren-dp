import { Router } from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT key, url FROM section_photos').all() as { key: string; url: string }[];
  res.json(rows);
});

router.put('/:key', requireAuth, (req, res) => {
  const { url } = req.body as { url?: string };
  db.prepare('INSERT OR REPLACE INTO section_photos (key, url) VALUES (?, ?)').run(req.params.key, url ?? '');
  res.json({ ok: true });
});

export default router;
