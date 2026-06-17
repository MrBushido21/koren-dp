import { Router } from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

interface HeaderRow {
  id: number;
  address: string;
  brand_name: string;
  phone_number_1: string;
  phone_number_2: string;
}

// GET /api/header
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM header').all() as HeaderRow[];
  res.json(rows);
});

// GET /api/header/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM header WHERE id = ?').get(req.params.id) as HeaderRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(row);
});

// POST /api/header
router.post('/', requireAuth, (req, res) => {
  const { address, brand_name, phone_number_1, phone_number_2 } =
    req.body as { address?: string; brand_name?: string; phone_number_1?: string; phone_number_2?: string };
  if (!address || !brand_name || !phone_number_1 || !phone_number_2) {
    res.status(400).json({ error: 'address, brand_name, phone_number_1 and phone_number_2 are required' });
    return;
  }
  const result = db
    .prepare('INSERT INTO header (address, brand_name, phone_number_1, phone_number_2) VALUES (?, ?, ?, ?)')
    .run(address, brand_name, phone_number_1, phone_number_2);
  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/header/:id
router.put('/:id', requireAuth, (req, res) => {
  const { address, brand_name, phone_number_1, phone_number_2 } =
    req.body as { address?: string; brand_name?: string; phone_number_1?: string; phone_number_2?: string };
  if (!address || !brand_name || !phone_number_1 || !phone_number_2) {
    res.status(400).json({ error: 'address, brand_name, phone_number_1 and phone_number_2 are required' });
    return;
  }
  const result = db
    .prepare('UPDATE header SET address = ?, brand_name = ?, phone_number_1 = ?, phone_number_2 = ? WHERE id = ?')
    .run(address, brand_name, phone_number_1, phone_number_2, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ updated: true });
});

// DELETE /api/header/:id
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM header WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ deleted: true });
});

export default router;
