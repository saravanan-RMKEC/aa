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
  const x = new Date(d);
  return x.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

router.get('/participation/:userId', (req, res) => {
  const { userId } = req.params;
  if (req.user.role !== 'super_admin' && req.user.id !== Number(userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const attended = db.prepare(`
    SELECT e.title, e.event_date, e.category, c.name as club_name
    FROM attendance a
    JOIN events e ON a.event_id = e.id
    JOIN clubs c ON e.club_id = c.id
    WHERE a.user_id = ?
    ORDER BY e.event_date DESC
  `).all(userId);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="participation-${user.name.replace(/\s/g, '-')}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  doc.fontSize(22).text('Certificate of Participation', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text('This is to certify that', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(18).text(user.name, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text('has actively participated in the following club events:', { align: 'center' });
  doc.moveDown(1.5);

  if (attended.length === 0) {
    doc.fontSize(11).text('No events attended yet.', { align: 'center' });
  } else {
    doc.fontSize(11);
    attended.forEach((e, i) => {
      doc.text(`${i + 1}. ${e.title} (${e.club_name}) - ${formatDate(e.event_date)}`);
    });
  }

  doc.moveDown(2);
  doc.fontSize(10).text('Generated on ' + formatDate(new Date()), { align: 'center' });
  doc.end();
});

router.get('/event/:eventId', requireRole('club_admin', 'super_admin'), (req, res) => {
  const event = db.prepare('SELECT * FROM events e JOIN clubs c ON e.club_id = c.id WHERE e.id = ?').get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (req.user.role === 'club_admin' && req.user.clubId !== event.club_id) return res.status(403).json({ error: 'Forbidden' });

  const attended = db.prepare(`
    SELECT u.name FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.event_id = ?
  `).all(req.params.eventId);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="attendance-${event.title.replace(/\s/g, '-')}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).text(`Event: ${event.title}`, { align: 'center' });
  doc.fontSize(12).text(`Club: ${event.name} | Date: ${formatDate(event.event_date)}`, { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(14).text('Attendance List');
  doc.moveDown(0.5);
  attended.forEach((r, i) => doc.fontSize(11).text(`${i + 1}. ${r.name}`));
  doc.moveDown(1);
  doc.fontSize(10).text('Generated on ' + formatDate(new Date()), { align: 'center' });
  doc.end();
});

export default router;
