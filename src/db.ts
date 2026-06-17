import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS header (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    phone_number_1 TEXT NOT NULL,
    phone_number_2 TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS about (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo TEXT NOT NULL,
    fio TEXT NOT NULL,
    text_about TEXT NOT NULL,
    email TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS diplomas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS work_experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS medical_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS symptoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS patient_information_sheet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Миграции для существующих БД
try {
  db.exec("ALTER TABLE orders ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'))");
} catch { /* already exists */ }
try {
  db.exec("ALTER TABLE orders ADD COLUMN email TEXT NOT NULL DEFAULT ''");
} catch { /* already exists */ }

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS page_layout (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible INTEGER NOT NULL DEFAULT 1
  )
`);

const layoutCount = (db.prepare('SELECT COUNT(*) as c FROM page_layout').get() as { c: number }).c;
if (layoutCount === 0) {
  const ins = db.prepare('INSERT INTO page_layout (section_key, label, sort_order) VALUES (?, ?, ?)');
  [
    ['about',        'Про лікаря',            0],
    ['education',    'Освіта та дипломи',      1],
    ['specialization','Спеціалізація',         2],
    ['services',     'Послуги',                3],
    ['symptoms',     'Симптоми',               4],
    ['order',        'Форма запису',           5],
    ['contacts',     'Контакти',               6],
    ['map',          'Карта',                  7],
    ['patient-info', "Пам'ятка для пацієнта", 8],
  ].forEach(([k, l, o]) => ins.run(k, l, o));
}

db.exec(`
  CREATE TABLE IF NOT EXISTS section_photos (
    key TEXT PRIMARY KEY,
    url TEXT NOT NULL DEFAULT ''
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS custom_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    photo TEXT NOT NULL DEFAULT '',
    photo_side TEXT NOT NULL DEFAULT 'right',
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible INTEGER NOT NULL DEFAULT 1
  )
`);

export default db;
