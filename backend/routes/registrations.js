import express from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/my', (req, res) => {
  const list = db.prepare(`
    SELECT er.*, e.title, e.event_date, e.event_time, e.venue, e.status as event_status, c.name as club_name
    FROM event_registrations er
    JOIN events e ON er.event_id = e.id
    JOIN clubs c ON e.club_id = c.id
    WHERE er.user_id = ?
    ORDER BY e.event_date DESC
  `).all(req.user.id);
  res.json(list);
});

router.post('/events/:eventId', requireRole('student'), (req, res) => {
  const { eventId } = req.params;
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.status !== 'approved') return res.status(400).json({ error: 'Event is not open for registration' });
  if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
    return res.status(400).json({ error: 'Registration deadline passed' });
  }
  const count = db.prepare('SELECT COUNT(*) as c FROM event_registrations WHERE event_id = ?').get(eventId).c;
  if (event.seat_limit != null && count >= event.seat_limit) {
    return res.status(400).json({ error: 'Event is full' });
  }
  try {
    db.prepare('INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)').run(eventId, req.user.id);
    res.status(201).json({ message: 'Registered for event' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Already registered' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/events/:eventId', requireRole('student'), (req, res) => {
  const r = db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?').run(req.params.eventId, req.user.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Registration not found' });
  res.json({ message: 'Registration cancelled' });
});

router.get('/events/:eventId/list', requireRole('club_admin', 'super_admin'), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (req.user.role === 'club_admin' && req.user.clubId !== event.club_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const list = db.prepare(`
    SELECT u.id, u.name, u.email, er.registered_at,
      (SELECT 1 FROM attendance a WHERE a.event_id = ? AND a.user_id = u.id) as attended
    FROM event_registrations er
    JOIN users u ON er.user_id = u.id
    WHERE er.event_id = ?
  `).all(req.params.eventId, req.params.eventId);
  res.json(list);
});

export default router;
