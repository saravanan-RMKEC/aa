import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, initDb } from './db.js';

const CLUBS = [
  'Math Club',
  'Science & Innovation Club',
  'TEDx Club',
  'Humor Club',
  'Astronomy Club',
  'Photography Club',
  'Eco Club',
  'Language Club',
  'Digital Detox Club',
  'Coding Club',
  'Yoga Club',
];

async function seed() {
  await initDb();

  const existing = db.prepare('SELECT COUNT(*) as c FROM clubs').get();
  if (existing.c > 0) {
    console.log('Database already seeded.');
    return;
  }

  const hashed = await bcrypt.hash('admin123', 12);
  db.prepare(
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
  ).run('admin@college.edu', hashed, 'Super Admin', 'super_admin');

  for (const name of CLUBS) {
    db.prepare('INSERT INTO clubs (name, description) VALUES (?, ?)').run(
      name,
      `Welcome to ${name}. Join us for events and activities.`
    );
  }

  console.log('Seeded: Super Admin admin@college.edu / admin123. Create Club Admins via Admin → Users & Roles.');
  console.log('11 clubs created.');
}

seed().catch(console.error);
