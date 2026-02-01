import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('super_admin'));

router.get('/', (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT id, email, name, role, club_id, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  sql += ' ORDER BY name';
  const users = db.prepare(sql).all(...params);
  res.json(users);
});

router.patch('/:id/role', (req, res) => {
  const { role, club_id } = req.body;
  if (!['student', 'club_admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const updates = ['role = ?'];
  const values = [role];
  if (role === 'club_admin') {
    updates.push('club_id = ?');
    values.push(club_id ?? null);
  } else {
    updates.push('club_id = ?');
    values.push(null);
  }
  values.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT id, email, name, role, club_id FROM users WHERE id = ?').get(req.params.id));
});

router.post('/', (req, res) => {
  const { email, password, name, role, club_id } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'email, password, name, role required' });
  }
  if (!['student', 'club_admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (role === 'club_admin' && !club_id) return res.status(400).json({ error: 'club_id required for club_admin' });
  bcrypt.hash(password, 12).then(hashed => {
    try {
      const r = db.prepare(
        'INSERT INTO users (email, password, name, role, club_id) VALUES (?, ?, ?, ?, ?)'
      ).run(email.toLowerCase().trim(), hashed, name.trim(), role, role === 'club_admin' ? club_id : null);
      const user = db.prepare('SELECT id, email, name, role, club_id FROM users WHERE id = ?').get(r.lastInsertRowid);
      res.status(201).json(user);
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE')) res.status(400).json({ error: 'Email already exists' });
      else res.status(500).json({ error: err.message });
    }
  }).catch(() => res.status(500).json({ error: 'Password hash failed' }));
});

export default router;
