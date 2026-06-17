import { Request, Response, NextFunction } from 'express';
import db from '../db';

interface SessionRow {
  token: string;
  user_id: number;
  expires_at: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies as Record<string, string>)?.admin_session;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as SessionRow | undefined;
  if (!session) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }
  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    res.status(401).json({ error: 'Session expired' });
    return;
  }
  (req as Request & { userId: number }).userId = session.user_id;
  next();
}
