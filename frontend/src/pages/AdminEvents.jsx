import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { events as eventsApi } from '../api';
import toast from 'react-hot-toast';

const CATEGORY_LABELS = { workshop: 'Workshop', seminar: 'Seminar', competition: 'Competition', awareness: 'Awareness' };
const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

export default function AdminEvents() {
  const [list, setList] = useState([]);

  useEffect(() => {
    eventsApi.list().then(setList).catch(() => toast.error('Failed to load events'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">All events</h1>
      <div className="space-y-4">
        {list.map(e => (
          <Link
            key={e.id}
            to={`/events/${e.id}`}
            className="card block hover:border-brand-500/50 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{e.title}</h2>
                <p className="text-slate-500 text-sm">{e.club_name} · {CATEGORY_LABELS[e.category]} · {e.event_date}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                e.status === 'approved' ? 'bg-brand-500/20 text-brand-400' :
                e.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {STATUS_LABELS[e.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
