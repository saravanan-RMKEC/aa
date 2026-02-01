/**
 * Add demo Super Admin and Club Admin accounts to an existing database.
 * Run: node seed-demo-users.js
 * Password for both: admin123
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, initDb } from './db.js';

async function seedDemoUsers() {
  await initDb();

  const hashed = await bcrypt.hash('admin123', 12);

  if (!db.prepare('SELECT 1 FROM users WHERE email = ?').get('admin2@college.edu')) {
    db.prepare(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
    ).run('admin2@college.edu', hashed, 'Super Admin Two', 'super_admin');
    console.log('Added: admin2@college.edu (Super Admin)');
  } else {
    console.log('Already exists: admin2@college.edu');
  }

  const codingClub = db.prepare('SELECT id FROM clubs WHERE name = ?').get('Coding Club');
  if (codingClub && !db.prepare('SELECT 1 FROM users WHERE email = ?').get('clubadmin@college.edu')) {
    db.prepare(
      'INSERT INTO users (email, password, name, role, club_id) VALUES (?, ?, ?, ?, ?)'
    ).run('clubadmin@college.edu', hashed, 'Club Admin (Coding)', 'club_admin', codingClub.id);
    console.log('Added: clubadmin@college.edu (Club Admin, Coding Club)');
  } else if (!codingClub) {
    console.log('Skipped club admin: Coding Club not found. Run full seed first.');
  } else {
    console.log('Already exists: clubadmin@college.edu');
  }

  console.log('Demo password for all: admin123');
}

seedDemoUsers().catch(console.error);
