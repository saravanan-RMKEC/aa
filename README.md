# Club Activity Management System

A full-stack college club and event management system with role-based access (Super Admin, Club Admin, Student), event approval workflow, QR attendance, certificates, and analytics.

## Tech Stack

- **Backend:** Node.js, Express, SQLite (sql.js, pure JS—no native build), JWT, bcrypt, PDFKit, QRCode
- **Frontend:** React 18, Vite, React Router, Tailwind CSS, React Hot Toast

## Features

- **User roles:** Super Admin, Club Admin, Student with JWT auth and secure password hashing
- **Clubs:** 11 seeded clubs (Math, Science & Innovation, TEDx, Humor, Astronomy, Photography, Eco, Language, Digital Detox, Coding, Yoga); CRUD for Super Admin; students can join/leave
- **Events:** Create (Club Admin = proposal, Super Admin = approved), approve/reject (Super Admin), categories (Workshop, Seminar, Competition, Awareness), seat limits, registration deadline
- **Registrations:** Students register for approved events; Club Admin/Super Admin see lists per event
- **Attendance:** QR code per event; students scan to mark attendance (must be registered first)
- **Certificates:** PDF participation certificate (events attended); event attendance list PDF for admins
- **Reports:** Semester date-range report (PDF); student activity portfolio (PDF)
- **Analytics:** Dashboard with active clubs, events by category, registration vs attendance

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set JWT_SECRET
npm run seed
npm run dev
```

API runs at **http://localhost:4000**.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:3000** (proxies `/api` and `/uploads` to backend).

### Authentication & role-based workflow

- **Login:** Email + password. After login, redirect by role:
  - **Super Admin** → `/admin/dashboard` (clubs, users, pending events, analytics, reports)
  - **Club Admin** → `/club/dashboard` (assigned club, events, create event, reports)
  - **Student** → `/student/dashboard` (clubs, events, registrations, certificates, portfolio)
- **Register:** Students only; creates account with role `student` and redirects to `/student/dashboard`.
- **Session:** 401 (invalid/expired token) clears session and redirects to login. 403 Forbidden for unauthorized API access.

**Seeded account (after `npm run seed`):**

| Role         | Email               | Password   |
|--------------|---------------------|------------|
| Super Admin  | `admin@college.edu` | `admin123` |

Create **Club Admins** and assign clubs via **Admin → Users & Roles**. Students use **Register** on the login page.

## API Overview

| Area        | Endpoints |
|------------|-----------|
| Auth       | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Clubs      | `GET/POST /api/clubs`, `GET/PATCH/DELETE /api/clubs/:id`, `POST /api/clubs/:id/join`, `POST /api/clubs/:id/leave` |
| Events     | `GET/POST /api/events`, `GET/PATCH /api/events/:id`, `PATCH /api/events/:id/approve`, `GET /api/events/:id/qr`, `POST /api/events/:id/attend` |
| Registrations | `GET /api/registrations/my`, `POST/DELETE /api/registrations/events/:eventId`, `GET /api/registrations/events/:eventId/list` |
| Analytics  | `GET /api/analytics/dashboard`, `GET /api/analytics/participation` |
| Certificates | `GET /api/certificates/participation/:userId`, `GET /api/certificates/event/:eventId` (PDF; support `?token=` for download) |
| Reports    | `GET /api/reports/semester?start=&end=`, `GET /api/reports/student-portfolio/:userId` (PDF; support `?token=`) |
| Users      | `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id/role` (Super Admin only) |
| Uploads    | `POST /api/uploads/:clubId` (file + type: poster|photo|report), `GET /api/uploads/club/:clubId` |

## Project structure

```
aa/
├── backend/
│   ├── data/          # SQLite DB (created on first run)
│   ├── uploads/       # Uploaded files (created on first upload)
│   ├── db.js          # DB init and schema
│   ├── server.js      # Express app
│   ├── seed.js        # Seed super admin + 11 clubs
│   ├── middleware/auth.js
│   └── routes/        # auth, clubs, events, registrations, analytics, certificates, reports, users, uploads
├── frontend/
│   ├── src/
│   │   ├── api.js
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx
│   │   └── pages/     # Login, Register, Dashboard, Clubs, Events, Admin, etc.
│   └── ...
└── README.md
```
