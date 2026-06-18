import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import db from '../db';
import { requireAuth } from '../middleware/auth';

function sendOrderNotification(name: string, phone: string, email: string, description: string) {
  const port = Number(process.env.SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    subject: `Нова заявка від ${name}`,
    html: `
      <h2>Нова заявка з сайту</h2>
      <p><b>Ім'я:</b> ${name}</p>
      <p><b>Телефон:</b> ${phone}</p>
      ${email ? `<p><b>Email:</b> ${email}</p>` : ''}
      <p><b>Проблема:</b></p>
      <p>${description}</p>
    `,
  }).catch((err: unknown) => console.error('[orders] email notify error:', err));
}

const router = Router();

// ─── Rate limit ────────────────────────────────────────────────────────────────
const submitLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Забагато запитів. Спробуйте через 10 хвилин.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderRow {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  description: string;
  created_at: string;
}

// ─── Sanitizer ────────────────────────────────────────────────────────────────
// Strips HTML tags and collapses invisible characters.
// SQL injection is already prevented by better-sqlite3 parameterized queries (?).
function stripHtml(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/<[^>]*>/g, '')        // remove HTML tags
    .replace(/[^\S\n\r ]+/g, ' ')  // collapse zero-width / invisible chars
    .trim();
}

// ─── Schemas ──────────────────────────────────────────────────────────────────
// Ukrainian phone after normalizing spaces, dashes, parens:
// +380XXXXXXXXX | 380XXXXXXXXX | 0XXXXXXXXX
const PHONE_RE = /^(\+?38)?0\d{9}$/;

const OrderCreateSchema = z.object({
  name: z.preprocess(
    (v) => stripHtml(v).slice(0, 100),
    z.string().min(1, "Вкажіть ім'я")
  ),

  phone_number: z.preprocess(
    (v) => stripHtml(v).replace(/[\s\-()]/g, '').slice(0, 20),
    z.string()
      .min(1, 'Вкажіть номер телефону')
      .regex(PHONE_RE, 'Невірний формат: +38 (0XX) XXX-XX-XX')
  ),

  // email is optional — empty string or valid address
  email: z.preprocess(
    (v) => stripHtml(v).slice(0, 200),
    z.union([
      z.literal(''),
      z.string().email('Невірний формат email'),
    ])
  ).optional().transform(v => v ?? ''),

  description: z.preprocess(
    (v) => stripHtml(v).slice(0, 1000),
    z.string().min(1, 'Опишіть суть звернення')
  ),
});

// Admin update: same rules (phone already stored in normalized form)
const OrderUpdateSchema = OrderCreateSchema;

type OrderData = z.infer<typeof OrderCreateSchema>;

// ─── Helper ───────────────────────────────────────────────────────────────────
function parseOrReject(
  schema: z.ZodTypeAny,
  body: unknown,
  res: Response
): OrderData | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    if (first) res.status(400).json({ error: first.message });
    return null;
  }
  return result.data as OrderData;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
router.get('/', requireAuth, (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all() as OrderRow[];
  res.json(rows);
});

router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(row);
});

router.post('/', submitLimit, (req: Request, res: Response) => {
  const data = parseOrReject(OrderCreateSchema, req.body, res);
  if (!data) return;

  const result = db
    .prepare('INSERT INTO orders (name, phone_number, email, description) VALUES (?, ?, ?, ?)')
    .run(data.name, data.phone_number, data.email, data.description);

  sendOrderNotification(data.name, data.phone_number, data.email, data.description);

  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, (req: Request, res: Response) => {
  const data = parseOrReject(OrderUpdateSchema, req.body, res);
  if (!data) return;

  const result = db
    .prepare('UPDATE orders SET name = ?, phone_number = ?, email = ?, description = ? WHERE id = ?')
    .run(data.name, data.phone_number, data.email, data.description, req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ updated: true });
});

router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ deleted: true });
});

export default router;
