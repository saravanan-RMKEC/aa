import express from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
  const clubs = db.prepare(`
    SELECT c.*, u.name as faculty_advisor_name
    FROM clubs c
    LEFT JOIN users u ON c.faculty_advisor_id = u.id
    ORDER BY c.name
  `).all();
  res.json(clubs);
});

router.get('/:id', (req, res) => {
  const club = db.prepare(`
    SELECT c.*, u.name as faculty_advisor_name
    FROM clubs c
    LEFT JOIN users u ON c.faculty_advisor_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!club) return res.status(404).json({ error: 'Club not found' });
  const members = db.prepare(`
    SELECT u.id, u.name, u.email, cm.joined_at
    FROM club_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.club_id = ?
  `).all(req.params.id);
  res.json({ ...club, members });
});

router.use(authMiddleware);

router.post('/', requireRole('super_admin'), (req, res) => {
  const { name, description, faculty_advisor_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Club name required' });
  try {
    const r = db.prepare(
      'INSERT INTO clubs (name, description, faculty_advisor_id) VALUES (?, ?, ?)'
    ).run(name.trim(), description?.trim() || null, faculty_advisor_id || null);
    const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json(club);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Club name already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', requireRole('super_admin', 'club_admin'), (req, res) => {
  const { id } = req.params;
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(id);
  if (!club) return res.status(404).json({ error: 'Club not found' });
  if (req.user.role === 'club_admin' && req.user.clubId !== club.id) {
    return res.status(403).json({ error: 'You can only edit your own club' });
  }
  const { name, description, faculty_advisor_id } = req.body;
  const updates = [];
  const values = [];
  if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description?.trim()); }
  if (req.user.role === 'super_admin' && faculty_advisor_id !== undefined) {
    updates.push('faculty_advisor_id = ?');
    values.push(faculty_advisor_id || null);
  }
  if (updates.length === 0) return res.json(club);
  values.push(id);
  db.prepare(`UPDATE clubs SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT * FROM clubs WHERE id = ?').get(id));
});

router.delete('/:id', requireRole('super_admin'), (req, res) => {
  const r = db.prepare('DELETE FROM clubs WHERE id = ?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Club not found' });
  res.status(204).send();
});

router.post('/:id/join', requireRole('student'), (req, res) => {
  try {
    db.prepare('INSERT INTO club_members (club_id, user_id) VALUES (?, ?)').run(req.params.id, req.user.id);
    res.status(201).json({ message: 'Joined club' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Already a member' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/leave', requireRole('student'), (req, res) => {
  const r = db.prepare('DELETE FROM club_members WHERE club_id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (r.changes === 0) return res.status(400).json({ error: 'Not a member' });
  res.json({ message: 'Left club' });
});

export default router;
