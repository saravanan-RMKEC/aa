import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel } from '../utils/auth';
import { analytics } from '../api';
import toast from 'react-hot-toast';

const CATEGORY_LABELS = { workshop: 'Workshop', seminar: 'Seminar', competition: 'Competition', awareness: 'Awareness' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    analytics.dashboard()
      .then(setData)
      .catch(() => toast.error('Failed to load dashboard'));
  }, []);

  if (!data) return <div className="flex justify-center py-12"><div className="animate-spin w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  const { summary, mostActiveClubs, eventsByCategory, attendanceVsRegistration } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome, {user?.name}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
          {getRoleLabel(user?.role)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-slate-500 text-sm">Students</p>
          <p className="text-2xl font-semibold text-brand-400">{summary?.totalStudents ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-500 text-sm">Clubs</p>
          <p className="text-2xl font-semibold text-brand-400">{summary?.totalClubs ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-500 text-sm">Events</p>
          <p className="text-2xl font-semibold text-brand-400">{summary?.totalEvents ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-500 text-sm">Registrations</p>
          <p className="text-2xl font-semibold text-brand-400">{summary?.totalRegistrations ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-500 text-sm">Attendance</p>
          <p className="text-2xl font-semibold text-brand-400">{summary?.totalAttendance ?? 0}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Quick actions</h2>
          <ul className="space-y-2">
            <li><Link to="/admin/clubs" className="text-brand-400 hover:underline font-medium">Manage clubs</Link> — Create, edit, assign advisors</li>
            <li><Link to="/admin/users" className="text-brand-400 hover:underline font-medium">Users & roles</Link> — Assign faculty advisors and club admins</li>
            <li><Link to="/admin/pending-events" className="text-brand-400 hover:underline font-medium">Pending events</Link> — Approve or reject event proposals</li>
            <li><Link to="/admin/events" className="text-brand-400 hover:underline font-medium">All events</Link> — View and manage events</li>
            <li><Link to="/reports" className="text-brand-400 hover:underline font-medium">Reports</Link> — System-wide reports</li>
          </ul>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Events by category</h2>
          <ul className="space-y-2">
            {eventsByCategory?.map(c => (
              <li key={c.category} className="flex justify-between py-2 border-b border-slate-700/50 last:border-0">
                <span className="text-slate-300">{CATEGORY_LABELS[c.category] || c.category}</span>
                <span className="text-brand-400 font-medium">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Most active clubs</h2>
          <ul className="space-y-2">
            {mostActiveClubs?.slice(0, 8).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <Link to={`/clubs/${c.id}`} className="text-slate-300 hover:text-brand-400 font-medium">{c.name}</Link>
                <span className="text-slate-500 text-sm">{c.members} members · {c.events} events</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Registration vs attendance (recent)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="text-left py-2">Event</th>
                  <th className="text-right py-2">Reg</th>
                  <th className="text-right py-2">Att</th>
                </tr>
              </thead>
              <tbody>
                {attendanceVsRegistration?.slice(0, 8).map(e => (
                  <tr key={e.id} className="border-b border-slate-700/50">
                    <td className="py-2 text-slate-300 truncate max-w-[180px]">{e.title}</td>
                    <td className="py-2 text-right text-slate-400">{e.registered}</td>
                    <td className="py-2 text-right text-brand-400">{e.attended}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
