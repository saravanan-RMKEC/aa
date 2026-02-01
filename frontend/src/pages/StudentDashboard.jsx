import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel } from '../utils/auth';
import { clubs as clubsApi, events as eventsApi, registrations as regApi } from '../api';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [clubsCount, setClubsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [myRegistrations, setMyRegistrations] = useState([]);

  useEffect(() => {
    clubsApi.list().then(list => setClubsCount(list.length)).catch(() => {});
    eventsApi.list({ status: 'approved' }).then(list => setEventsCount(list.length)).catch(() => {});
    regApi.my().then(setMyRegistrations).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Student Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome, {user?.name}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {getRoleLabel(user?.role)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-slate-500 text-sm">Clubs available</p>
          <p className="text-2xl font-semibold text-brand-400">{clubsCount}</p>
        </div>
        <div className="card">
          <p className="text-slate-500 text-sm">Upcoming events</p>
          <p className="text-2xl font-semibold text-brand-400">{eventsCount}</p>
        </div>
        <div className="card">
          <p className="text-slate-500 text-sm">My registrations</p>
          <p className="text-2xl font-semibold text-brand-400">{myRegistrations.length}</p>
        </div>
        <Link to="/certificates" className="card block hover:border-brand-500/50 transition-colors">
          <p className="text-slate-500 text-sm">Certificates</p>
          <p className="text-lg font-semibold text-brand-400">Download →</p>
        </Link>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Quick actions</h2>
        <ul className="space-y-2">
          <li><Link to="/clubs" className="text-brand-400 hover:underline font-medium">Clubs</Link> — Browse and join clubs</li>
          <li><Link to="/events" className="text-brand-400 hover:underline font-medium">Events</Link> — View and register for events</li>
          <li><Link to="/my-registrations" className="text-brand-400 hover:underline font-medium">My registrations</Link> — View registered events</li>
          <li><Link to="/certificates" className="text-brand-400 hover:underline font-medium">Certificates</Link> — Download participation certificate</li>
          <li><Link to="/reports" className="text-brand-400 hover:underline font-medium">Portfolio</Link> — Download activity portfolio</li>
        </ul>
      </div>

      {myRegistrations.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Recent registrations</h2>
          <ul className="space-y-2">
            {myRegistrations.slice(0, 5).map(r => (
              <li key={r.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <Link to={`/events/${r.event_id}`} className="text-slate-300 hover:text-brand-400 font-medium">{r.title}</Link>
                <span className="text-slate-500 text-sm">{r.event_date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
