import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { events as eventsApi } from '../api';

const CATEGORY_LABELS = { workshop: 'Workshop', seminar: 'Seminar', competition: 'Competition', awareness: 'Awareness' };

export default function PendingEvents() {
  const [list, setList] = useState([]);

  useEffect(() => {
    eventsApi.list({ status: 'pending' }).then(setList).catch(() => toast.error('Failed to load'));
  }, []);

  async function approve(id, status) {
    try {
      await eventsApi.approve(id, status);
      toast.success(status === 'approved' ? 'Event approved' : 'Event rejected');
      setList(l => l.filter(e => e.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Pending event approvals</h1>
      {list.length === 0 ? (
        <div className="card text-slate-500 text-center py-12">No pending events.</div>
      ) : (
        <div className="space-y-4">
          {list.map(e => (
            <div key={e.id} className="card flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link to={`/events/${e.id}`} className="font-semibold text-slate-100 hover:text-brand-400">{e.title}</Link>
                <p className="text-slate-500 text-sm mt-1">{e.club_name} · {CATEGORY_LABELS[e.category]} · {e.event_date}</p>
                {e.description && <p className="text-slate-600 text-sm mt-2 line-clamp-2">{e.description}</p>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => approve(e.id, 'approved')} className="btn-primary">Approve</button>
                <button type="button" onClick={() => approve(e.id, 'rejected')} className="btn-secondary text-red-400 hover:bg-red-500/20">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
