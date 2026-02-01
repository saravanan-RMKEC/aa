import express from 'express';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

router.use((req, res, next) => {
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      return next();
    } catch (_) {}
  }
  authMiddleware(req, res, next);
});

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

router.get('/semester', (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end dates required (YYYY-MM-DD)' });

  const events = db.prepare(`
    SELECT e.*, c.name as club_name,
      (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registered,
      (SELECT COUNT(*) FROM attendance WHERE event_id = e.id) as attended
    FROM events e
    JOIN clubs c ON e.club_id = c.id
    WHERE e.status = 'approved' AND e.event_date BETWEEN ? AND ?
    ORDER BY e.event_date
  `).all(start, end);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="semester-report-${start}-${end}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text('Semester Activity Report', { align: 'center' });
  doc.fontSize(11).text(`Period: ${formatDate(start)} to ${formatDate(end)}`, { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(12).text(`Total events: ${events.length}`);
  doc.moveDown(0.5);
  events.forEach((e, i) => {
    doc.fontSize(10).text(`${i + 1}. ${e.title} (${e.club_name}) - ${formatDate(e.event_date)} | Reg: ${e.registered} | Att: ${e.attended}`);
  });
  doc.moveDown(1);
  doc.fontSize(10).text('Generated on ' + formatDate(new Date()), { align: 'center' });
  doc.end();
});

router.get('/student-portfolio/:userId', (req, res) => {
  const { userId } = req.params;
  if (req.user.role !== 'super_admin' && req.user.id !== Number(userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const clubs = db.prepare(`
    SELECT c.name, cm.joined_at FROM club_members cm JOIN clubs c ON cm.club_id = c.id WHERE cm.user_id = ?
  `).all(userId);
  const events = db.prepare(`
    SELECT e.title, e.event_date, e.category, c.name as club_name
    FROM attendance a
    JOIN events e ON a.event_id = e.id
    JOIN clubs c ON e.club_id = c.id
    WHERE a.user_id = ?
    ORDER BY e.event_date DESC
  `).all(userId);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="portfolio-${user.name.replace(/\s/g, '-')}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text('Student Activity Portfolio', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).text(user.name, { align: 'center' });
  doc.fontSize(10).text(user.email, { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(12).text('Clubs joined');
  clubs.forEach((c, i) => doc.fontSize(10).text(`${i + 1}. ${c.name} (joined ${formatDate(c.joined_at)})`));
  doc.moveDown(0.5);

  doc.fontSize(12).text('Events attended');
  events.forEach((e, i) => doc.fontSize(10).text(`${i + 1}. ${e.title} - ${e.club_name} (${formatDate(e.event_date)})`));
  doc.moveDown(1);
  doc.fontSize(10).text('Generated on ' + formatDate(new Date()), { align: 'center' });
  doc.end();
});

export default router;
