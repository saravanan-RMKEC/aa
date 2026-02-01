import express from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { club_id, status, category } = req.query;
  let sql = `
    SELECT e.*, c.name as club_name
    FROM events e
    JOIN clubs c ON e.club_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (club_id) { sql += ' AND e.club_id = ?'; params.push(club_id); }
  if (status) { sql += ' AND e.status = ?'; params.push(status); }
  if (category) { sql += ' AND e.category = ?'; params.push(category); }
  sql += ' ORDER BY e.event_date DESC, e.event_time';
  const events = db.prepare(sql).all(...params);
  res.json(events);
});

router.get('/:id', (req, res) => {
  const event = db.prepare(`
    SELECT e.*, c.name as club_name
    FROM events e
    JOIN clubs c ON e.club_id = c.id
    WHERE e.id = ?
  `).get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const registrations = db.prepare(`
    SELECT u.id, u.name, u.email, er.registered_at
    FROM event_registrations er
    JOIN users u ON er.user_id = u.id
    WHERE er.event_id = ?
  `).all(req.params.id);
  const attendance = db.prepare(`
    SELECT user_id FROM attendance WHERE event_id = ?
  `).all(req.params.id).map(r => r.user_id);
  res.json({ ...event, registrations, attendance });
});

router.use(authMiddleware);

router.post('/', requireRole('club_admin', 'super_admin'), (req, res) => {
  const {
    club_id, title, description, category, venue, event_date, event_time,
    seat_limit, registration_deadline, poster_url
  } = req.body;
  if (!club_id || !title || !category || !event_date) {
    return res.status(400).json({ error: 'club_id, title, category, event_date required' });
  }
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(club_id);
  if (!club) return res.status(404).json({ error: 'Club not found' });
  if (req.user.role === 'club_admin' && req.user.clubId !== Number(club_id)) {
    return res.status(403).json({ error: 'You can only create events for your club' });
  }
  const qr_secret = crypto.randomBytes(32).toString('hex');
  try {
    const r = db.prepare(`
      INSERT INTO events (club_id, title, description, category, venue, event_date, event_time, seat_limit, registration_deadline, poster_url, qr_secret, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      club_id, title, description?.trim() || null, category, venue?.trim() || null,
      event_date, event_time?.trim() || null, seat_limit || null, registration_deadline || null,
      poster_url || null, qr_secret, req.user.role === 'super_admin' ? 'approved' : 'pending', req.user.id
    );
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', requireRole('club_admin', 'super_admin'), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (req.user.role === 'club_admin' && req.user.clubId !== event.club_id) {
    return res.status(403).json({ error: 'You can only edit your club events' });
  }
  const allowed = ['title', 'description', 'category', 'venue', 'event_date', 'event_time', 'seat_limit', 'registration_deadline', 'poster_url'];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(req.body[key] === '' ? null : req.body[key]);
    }
  }
  if (updates.length === 0) return res.json(event);
  values.push(req.params.id);
  db.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id));
});

router.patch('/:id/approve', requireRole('super_admin'), (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved or rejected' });
  const r = db.prepare('UPDATE events SET status = ? WHERE id = ?').run(status, req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id));
});

router.get('/:id/qr', requireRole('club_admin', 'super_admin'), async (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (req.user.role === 'club_admin' && req.user.clubId !== event.club_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const payload = JSON.stringify({ eventId: event.id, secret: event.qr_secret });
  try {
    const dataUrl = await QRCode.toDataURL(payload, { width: 300 });
    res.json({ qr: dataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/attend', (req, res) => {
  const { qr_data } = req.body;
  if (!qr_data) return res.status(400).json({ error: 'qr_data required' });
  let data;
  try {
    data = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
  } catch (_) {
    return res.status(400).json({ error: 'Invalid QR data' });
  }
  if (data.eventId !== Number(req.params.id) || !data.secret) {
    return res.status(400).json({ error: 'Invalid QR code for this event' });
  }
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event || event.qr_secret !== data.secret) return res.status(400).json({ error: 'Invalid QR code' });
  const reg = db.prepare('SELECT 1 FROM event_registrations WHERE event_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!reg) return res.status(400).json({ error: 'You must register for this event first' });
  try {
    db.prepare('INSERT INTO attendance (event_id, user_id) VALUES (?, ?)').run(req.params.id, req.user.id);
    res.status(201).json({ message: 'Attendance marked' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Attendance already marked' });
    res.status(500).json({ error: err.message });
  }
});

export default router;
