import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './db.js';

import authRoutes from './routes/auth.js';
import clubsRoutes from './routes/clubs.js';
import eventsRoutes from './routes/events.js';
import registrationsRoutes from './routes/registrations.js';
import analyticsRoutes from './routes/analytics.js';
import certificatesRoutes from './routes/certificates.js';
import reportsRoutes from './routes/reports.js';
import usersRoutes from './routes/users.js';
import uploadsRoutes from './routes/uploads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* -------------------- ROUTES -------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/uploads', uploadsRoutes);

/* -------------------- HEALTH CHECK -------------------- */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'API is running' });
});

/* -------------------- START SERVER -------------------- */
(async () => {
  try {
    await initDb(); // 🔥 initializes & loads club.db correctly
    app.listen(PORT, () => {
      console.log(`✅ API running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  }
})();