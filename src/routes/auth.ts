import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: SESSION_TTL_MS,
};

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Забагато спроб. Спробуйте через 15 хвилин.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

interface UserRow { id: number; email: string; password_hash: string }
interface ResetTokenRow { id: number; email: string; token: string; expires_at: string }

// GET /api/auth/me — проверка активной сессии
router.get('/me', requireAuth, (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// POST /api/auth/login
router.post('/login', authLimit, async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(sessionToken, user.id, expiresAt);

  res.cookie('admin_session', sessionToken, COOKIE_OPTS);
  res.json({ ok: true });
});

// POST /api/auth/logout — удаляем сессию из БД и очищаем cookie
router.post('/logout', (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string>)?.admin_session;
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.clearCookie('admin_session', COOKIE_OPTS);
  res.json({ ok: true });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimit, async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!user) {
    res.json({ message: 'If the email exists, a reset link has been sent' });
    return;
  }
  db.prepare('DELETE FROM password_reset_tokens WHERE email = ?').run(email);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)').run(email, token, expiresAt);

  const resetLink = `${BASE_URL}/reset-password?token=${token}`;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Скидання пароля',
      html: `
        <p>Ви запросили скидання пароля.</p>
        <p>Перейдіть за посиланням (дійсне 1 годину):</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Якщо ви не запитували скидання — проігноруйте цей лист.</p>
      `,
    });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send reset email' });
    return;
  }
  res.json({ message: 'If the email exists, a reset link has been sent' });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) {
    res.status(400).json({ error: 'token and password are required' });
    return;
  }
  const record = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(token) as ResetTokenRow | undefined;
  if (!record) {
    res.status(400).json({ error: 'Invalid or expired token' });
    return;
  }
  if (new Date(record.expires_at) < new Date()) {
    db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token);
    res.status(400).json({ error: 'Token has expired' });
    return;
  }
  const password_hash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(password_hash, record.email);
  db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token);
  res.json({ message: 'Password updated successfully' });
});

export default router;
