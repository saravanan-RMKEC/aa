import initSqlJs from 'sql.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.DB_PATH || path.join(dataDir, 'club.db');

let _db = null;

function save() {
  if (_db && dbPath) {
    try {
      const data = _db.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (e) {
      console.warn('DB save failed:', e.message);
    }
  }
}

function wrapDb(db) {
  return {
    exec(sql) {
      db.run(sql);
      save();
    },
    prepare(sql) {
      return {
        run(...args) {
          const stmt = db.prepare(sql);
          try {
            stmt.bind(args.length ? args : []);
            stmt.step();
            stmt.free();
          } catch (e) {
            stmt.free();
            throw e;
          }
          const s2 = db.prepare('SELECT last_insert_rowid() as id, changes() as c');
          s2.step();
          const row = s2.getAsObject();
          s2.free();
          save();
          return { lastInsertRowid: row.id, changes: row.c };
        },
        get(...args) {
          const stmt = db.prepare(sql);
          try {
            stmt.bind(args.length ? args : []);
            const hasRow = stmt.step();
            const row = hasRow ? stmt.getAsObject() : undefined;
            stmt.free();
            return row;
          } catch (e) {
            stmt.free();
            throw e;
          }
        },
        all(...args) {
          const stmt = db.prepare(sql);
          try {
            stmt.bind(args.length ? args : []);
            const rows = [];
            while (stmt.step()) rows.push(stmt.getAsObject());
            stmt.free();
            return rows;
          } catch (e) {
            stmt.free();
            throw e;
          }
        },
      };
    },
  };
}

const handler = {
  get(_, prop) {
    if (!_db) throw new Error('DB not initialized. Call await initDb() first.');
    if (prop === 'prepare') return (sql) => wrapDb(_db).prepare(sql);
    if (prop === 'exec') return (sql) => { _db.run(sql); save(); };
    return _db[prop];
  },
};
export const db = new Proxy({}, handler);

export async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }
  Object.assign(db, wrapDb(_db));

  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin', 'club_admin', 'student')),
      club_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (club_id) REFERENCES clubs(id)
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      faculty_advisor_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (faculty_advisor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL CHECK(category IN ('workshop', 'seminar', 'competition', 'awareness')),
      venue TEXT,
      event_date TEXT NOT NULL,
      event_time TEXT,
      seat_limit INTEGER,
      registration_deadline TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      poster_url TEXT,
      qr_secret TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (club_id) REFERENCES clubs(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      registered_at TEXT DEFAULT (datetime('now')),
      UNIQUE(event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      marked_at TEXT DEFAULT (datetime('now')),
      UNIQUE(event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS club_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TEXT DEFAULT (datetime('now')),
      UNIQUE(club_id, user_id),
      FOREIGN KEY (club_id) REFERENCES clubs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      event_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('poster', 'photo', 'report')),
      url TEXT NOT NULL,
      uploaded_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (club_id) REFERENCES clubs(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_events_club ON events(club_id);
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
    CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
    CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);
  `);
  save();
}
