import express from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/dashboard', (req, res) => {
  const role = req.user.role;
  const clubId = req.user.clubId;

  const mostActiveClubs = db.prepare(`
    SELECT c.id, c.name, COUNT(DISTINCT cm.user_id) as members, COUNT(DISTINCT e.id) as events
    FROM clubs c
    LEFT JOIN club_members cm ON c.id = cm.club_id
    LEFT JOIN events e ON c.id = e.club_id AND e.status = 'approved'
    GROUP BY c.id
    ORDER BY members DESC
    LIMIT 10
  `).all();

  const totalStudents = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('student').c;
  const totalClubs = db.prepare('SELECT COUNT(*) as c FROM clubs').get().c;
  const totalEvents = db.prepare("SELECT COUNT(*) as c FROM events WHERE status = 'approved'").get().c;
  const totalRegistrations = db.prepare('SELECT COUNT(*) as c FROM event_registrations').get().c;
  const totalAttendance = db.prepare('SELECT COUNT(*) as c FROM attendance').get().c;

  const eventsByCategory = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM events WHERE status = 'approved'
    GROUP BY category
  `).all();

  const attendanceVsRegistration = db.prepare(`
    SELECT e.id, e.title, e.event_date,
      (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registered,
      (SELECT COUNT(*) FROM attendance WHERE event_id = e.id) as attended
    FROM events e
    WHERE e.status = 'approved'
    ORDER BY e.event_date DESC
    LIMIT 20
  `).all();

  let clubStats = null;
  if (role === 'club_admin' && clubId) {
    clubStats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM club_members WHERE club_id = ?) as members,
        (SELECT COUNT(*) FROM events WHERE club_id = ? AND status = 'approved') as events,
        (SELECT COUNT(*) FROM event_registrations er JOIN events e ON er.event_id = e.id WHERE e.club_id = ?) as registrations,
        (SELECT COUNT(*) FROM attendance a JOIN events e ON a.event_id = e.id WHERE e.club_id = ?) as attendance
    `).get(clubId, clubId, clubId, clubId);
  }

  res.json({
    mostActiveClubs,
    summary: { totalStudents, totalClubs, totalEvents, totalRegistrations, totalAttendance },
    eventsByCategory,
    attendanceVsRegistration,
    clubStats,
  });
});

router.get('/participation', requireRole('super_admin'), (req, res) => {
  const students = db.prepare(`
    SELECT u.id, u.name, u.email,
      (SELECT COUNT(*) FROM event_registrations WHERE user_id = u.id) as events_registered,
      (SELECT COUNT(*) FROM attendance WHERE user_id = u.id) as events_attended,
      (SELECT COUNT(*) FROM club_members WHERE user_id = u.id) as clubs_joined
    FROM users u
    WHERE u.role = 'student'
    ORDER BY events_attended DESC
  `).all();
  res.json(students);
});

export default router;
