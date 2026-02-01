import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel } from '../utils/auth';
import { analytics, events as eventsApi } from '../api';
import toast from 'react-hot-toast';

export default function ClubDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    analytics.dashboard()
      .then(setData)
      .catch(() => toast.error('Failed to load dashboard'));
  }, []);

  useEffect(() => {
    if (user?.clubId) {
      eventsApi.list({ club_id: user.clubId }).then(setRecentEvents).catch(() => {});
    }
  }, [user?.clubId]);

  const clubStats = data?.clubStats;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Club Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome, {user?.name}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30">
          {getRoleLabel(user?.role)}
        </span>
      </div>

      {clubStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-slate-500 text-sm">Club members</p>
            <p className="text-2xl font-semibold text-brand-400">{clubStats.members}</p>
          </div>
          <div className="card">
            <p className="text-slate-500 text-sm">Events</p>
            <p className="text-2xl font-semibold text-brand-400">{clubStats.events}</p>
          </div>
          <div className="card">
            <p className="text-slate-500 text-sm">Registrations</p>
            <p className="text-2xl font-semibold text-brand-400">{clubStats.registrations}</p>
          </div>
          <div className="card">
            <p className="text-slate-500 text-sm">Attendance</p>
            <p className="text-2xl font-semibold text-brand-400">{clubStats.attendance}</p>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Quick actions</h2>
        <ul className="space-y-2">
          <li>
            <Link to={user?.clubId ? `/clubs/${user.clubId}` : '#'} className="text-brand-400 hover:underline font-medium">
              My club
            </Link>
            {user?.clubId ? ' — View and manage your club' : ' — No club assigned'}
          </li>
          <li><Link to="/events/new" className="text-brand-400 hover:underline font-medium">Create event</Link> — Submit event proposal (Super Admin approves)</li>
          <li><Link to="/events" className="text-brand-400 hover:underline font-medium">Events</Link> — View club events, QR codes, registrations</li>
          <li><Link to="/reports" className="text-brand-400 hover:underline font-medium">Reports</Link> — Club-specific reports</li>
        </ul>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Recent club events</h2>
        {recentEvents.length === 0 ? (
          <p className="text-slate-500 text-sm">No events yet. <Link to="/events/new" className="text-brand-400 hover:underline">Create one</Link></p>
        ) : (
          <ul className="space-y-2">
            {recentEvents.slice(0, 8).map(e => (
              <li key={e.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <Link to={`/events/${e.id}`} className="text-slate-300 hover:text-brand-400 font-medium">{e.title}</Link>
                <span className={`text-xs px-2 py-0.5 rounded ${e.status === 'approved' ? 'bg-brand-500/20 text-brand-400' : e.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {e.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
