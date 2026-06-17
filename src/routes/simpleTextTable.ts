import { Router } from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';

interface TextRow {
  id: number;
  text: string;
}

export function createTextTableRouter(tableName: string) {
  const router = Router();

  // GET /api/<table> — список всех записей
  router.get('/', (_req, res) => {
    const rows = db.prepare(`SELECT * FROM "${tableName}"`).all() as TextRow[];
    res.json(rows);
  });

  // GET /api/<table>/:id — одна запись
  router.get('/:id', (req, res) => {
    const row = db.prepare(`SELECT * FROM "${tableName}" WHERE id = ?`).get(req.params.id) as TextRow | undefined;
    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(row);
  });

  // POST /api/<table> — создать запись (требует авторизации)
  router.post('/', requireAuth, (req, res) => {
    const { text } = req.body as { text?: string };
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const result = db.prepare(`INSERT INTO "${tableName}" (text) VALUES (?)`).run(text);
    res.status(201).json({ id: result.lastInsertRowid });
  });

  // PUT /api/<table>/:id — обновить запись (требует авторизации)
  router.put('/:id', requireAuth, (req, res) => {
    const { text } = req.body as { text?: string };
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const result = db.prepare(`UPDATE "${tableName}" SET text = ? WHERE id = ?`).run(text, req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ updated: true });
  });

  // DELETE /api/<table>/:id — удалить запись (требует авторизации)
  router.delete('/:id', requireAuth, (req, res) => {
    const result = db.prepare(`DELETE FROM "${tableName}" WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ deleted: true });
  });

  return router;
}
