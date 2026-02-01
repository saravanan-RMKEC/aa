import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel } from '../utils/auth';

// Super Admin: admin dashboard + manage clubs, users, pending events, all events, reports. No join/register.
const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/clubs', label: 'Manage Clubs' },
  { to: '/admin/users', label: 'Users & Roles' },
  { to: '/admin/pending-events', label: 'Pending Events' },
  { to: '/admin/events', label: 'All Events' },
  { to: '/reports', label: 'Reports' },
];

// Club Admin: club dashboard, my club, create event, events, reports.
const CLUB_NAV_BASE = [
  { to: '/club/dashboard', label: 'Dashboard' },
  { to: '/events/new', label: 'Create Event' },
  { to: '/events', label: 'Events' },
  { to: '/reports', label: 'Reports' },
];

// Student: student dashboard, clubs, events, my registrations, certificates, portfolio/reports.
const STUDENT_NAV = [
  { to: '/student/dashboard', label: 'Dashboard' },
  { to: '/clubs', label: 'Clubs' },
  { to: '/events', label: 'Events' },
  { to: '/my-registrations', label: 'My Registrations' },
  { to: '/certificates', label: 'Certificates' },
  { to: '/reports', label: 'Portfolio & Reports' },
];

function getNavForRole(role, clubId) {
  if (role === 'super_admin') return ADMIN_NAV;
  if (role === 'club_admin') {
    const nav = [...CLUB_NAV_BASE];
    if (clubId) nav.splice(1, 0, { to: `/clubs/${clubId}`, label: 'My Club' });
    return nav;
  }
  return STUDENT_NAV;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = getNavForRole(user?.role, user?.clubId);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-950/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <NavLink to={user?.role === 'super_admin' ? '/admin/dashboard' : user?.role === 'club_admin' ? '/club/dashboard' : '/student/dashboard'} className="text-lg font-semibold text-brand-400 tracking-tight">
            ClubHub
          </NavLink>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label }) => (
              <NavLink
                key={to + label}
                to={to}
                className={({ isActive }) =>
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                  (isActive ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {user?.name}
              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                user?.role === 'super_admin' ? 'bg-amber-500/20 text-amber-400' :
                user?.role === 'club_admin' ? 'bg-brand-500/20 text-brand-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {getRoleLabel(user?.role)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => { logout(); navigate('/login'); }}
              className="btn-ghost text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
