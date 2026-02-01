import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { events as eventsApi, clubs as clubsApi } from '../api';

const CATEGORIES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'competition', label: 'Competition' },
  { value: 'awareness', label: 'Awareness' },
];

export default function EventCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState({
    club_id: '',
    title: '',
    description: '',
    category: 'workshop',
    venue: '',
    event_date: '',
    event_time: '',
    seat_limit: '',
    registration_deadline: '',
  });

  useEffect(() => {
    clubsApi.list().then(setClubs).catch(() => toast.error('Failed to load clubs'));
  }, []);

  useEffect(() => {
    if (user?.role === 'club_admin' && user?.clubId && !form.club_id) {
      setForm(f => ({ ...f, club_id: String(user.clubId) }));
    }
  }, [user?.role, user?.clubId]);

  const clubOptions = user?.role === 'super_admin'
    ? clubs
    : clubs.filter(c => c.id === user?.clubId);
  const defaultClub = user?.role === 'club_admin' && user?.clubId ? String(user.clubId) : '';
  const effectiveClubId = form.club_id || defaultClub;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        club_id: Number(effectiveClubId),
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        venue: form.venue || undefined,
        event_date: form.event_date,
        event_time: form.event_time || undefined,
        seat_limit: form.seat_limit ? Number(form.seat_limit) : undefined,
        registration_deadline: form.registration_deadline || undefined,
      };
      const created = await eventsApi.create(payload);
      toast.success(user?.role === 'super_admin' ? 'Event created' : 'Event proposal submitted');
      navigate(`/events/${created.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-100">Create event</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        {user?.role === 'super_admin' && (
          <div>
            <label className="label">Club</label>
            <select
              className="input"
              value={effectiveClubId}
              onChange={e => setForm(f => ({ ...f, club_id: e.target.value }))}
              required
            >
              <option value="">Select club</option>
              {clubOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Title</label>
          <input type="text" className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[100px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Venue</label>
            <input type="text" className="input" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Time</label>
            <input type="time" className="input" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Seat limit (optional)</label>
            <input type="number" min={1} className="input" value={form.seat_limit} onChange={e => setForm(f => ({ ...f, seat_limit: e.target.value }))} />
          </div>
          <div>
            <label className="label">Registration deadline (optional)</label>
            <input type="datetime-local" className="input" value={form.registration_deadline} onChange={e => setForm(f => ({ ...f, registration_deadline: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">Create event</button>
          <button type="button" onClick={() => navigate('/events')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
