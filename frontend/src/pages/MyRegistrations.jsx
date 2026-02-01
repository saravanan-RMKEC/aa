import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { registrations } from '../api';
import toast from 'react-hot-toast';

const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

export default function MyRegistrations() {
  const [list, setList] = useState([]);

  useEffect(() => {
    registrations.my().then(setList).catch(() => toast.error('Failed to load'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">My registrations</h1>
      {list.length === 0 ? (
        <div className="card text-slate-500 text-center py-12">No event registrations yet. <Link to="/events" className="text-brand-400 hover:underline">Browse events</Link></div>
      ) : (
        <div className="space-y-4">
          {list.map(r => (
            <Link
              key={r.id}
              to={`/events/${r.event_id}`}
              className="card block hover:border-brand-500/50 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">{r.title}</h2>
                  <p className="text-slate-500 text-sm">{r.club_name} · {r.event_date} {r.event_time}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  r.event_status === 'approved' ? 'bg-brand-500/20 text-brand-400' :
                  r.event_status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {STATUS_LABELS[r.event_status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
