import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import db from './db';

import authRouter from './routes/auth';
import headerRouter from './routes/header';
import aboutRouter from './routes/about';
import ordersRouter from './routes/orders';
import { createTextTableRouter } from './routes/simpleTextTable';
import customSectionsRouter from './routes/customSections';
import uploadRouter from './routes/upload';
import layoutRouter from './routes/layout';
import sectionPhotosRouter from './routes/sectionPhotos';

// Импорт db нужен для инициализации таблиц при старте
void db;

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '30d',
  immutable: true,
}));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Auth: регистрация, вход, сброс пароля
app.use('/api/auth', authRouter);

// Основные разделы сайта
app.use('/api/header', headerRouter);
app.use('/api/about', aboutRouter);
app.use('/api/orders', ordersRouter);

// Таблицы с одним текстовым полем
app.use('/api/diplomas', createTextTableRouter('diplomas'));
app.use('/api/work-experience', createTextTableRouter('work_experience'));
app.use('/api/services', createTextTableRouter('services'));
app.use('/api/medical-services', createTextTableRouter('medical_services'));
app.use('/api/symptoms', createTextTableRouter('symptoms'));
app.use('/api/patient-information-sheet', createTextTableRouter('patient_information_sheet'));
app.use('/api/custom-sections', customSectionsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/layout', layoutRouter);
app.use('/api/section-photos', sectionPhotosRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
