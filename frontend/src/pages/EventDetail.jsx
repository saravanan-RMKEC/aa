import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { events as eventsApi, registrations as regApi } from '../api';

const CATEGORY_LABELS = { workshop: 'Workshop', seminar: 'Seminar', competition: 'Competition', awareness: 'Awareness' };

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.get(id).then(setEvent).catch(() => toast.error('Event not found')).finally(() => setLoading(false));
  }, [id]);

  const isRegistered = event?.registrations?.some(r => r.id === user?.id);
  const hasAttended = event?.attendance?.includes(user?.id);
  const canRegister = user?.role === 'student' && event?.status === 'approved' && !isRegistered;
  const isClubAdmin = user?.role === 'club_admin' && user?.clubId === event?.club_id;
  const isSuperAdmin = user?.role === 'super_admin';
  const canShowQr = (isClubAdmin || isSuperAdmin) && event?.status === 'approved';

  async function loadQr() {
    try {
      const { qr: data } = await eventsApi.qr(id);
      setQr(data);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRegister() {
    try {
      await regApi.register(id);
      toast.success('Registered');
      const updated = await eventsApi.get(id);
      setEvent(updated);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleUnregister() {
    try {
      await regApi.unregister(id);
      toast.success('Registration cancelled');
      const updated = await eventsApi.get(id);
      setEvent(updated);
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading || !event) return <div className="flex justify-center py-12"><div className="animate-spin w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <span className="text-slate-500 text-sm">{event.club_name} · {CATEGORY_LABELS[event.category]}</span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">{event.title}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {event.event_date} {event.event_time && `· ${event.event_time}`} {event.venue && `· ${event.venue}`}
        </p>
      </div>
      {event.poster_url && (
        <img src={event.poster_url} alt="" className="rounded-xl border border-slate-700 max-h-64 object-cover w-full" />
      )}
      {event.description && (
        <div className="card">
          <p className="text-slate-300">{event.description}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {event.seat_limit != null && (
          <span className="text-slate-500 text-sm">Seats: {event.registrations?.length || 0} / {event.seat_limit}</span>
        )}
        {event.registration_deadline && (
          <span className="text-slate-500 text-sm">Register by: {event.registration_deadline}</span>
        )}
      </div>
      {user?.role === 'student' && (
        <div className="flex gap-3">
          {isRegistered ? (
            <>
              <span className="text-brand-400 font-medium">You are registered</span>
              {!hasAttended && event.status === 'approved' && (
                <span className="text-slate-500 text-sm">Scan QR at venue to mark attendance</span>
              )}
              {hasAttended && <span className="text-brand-400 text-sm">Attendance marked ✓</span>}
              <button type="button" onClick={handleUnregister} className="btn-ghost text-sm">Cancel registration</button>
            </>
          ) : canRegister && (
            <button type="button" onClick={handleRegister} className="btn-primary">Register for event</button>
          )}
        </div>
      )}
      {canShowQr && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Attendance QR code</h2>
          {qr ? (
            <div className="inline-block p-4 bg-white rounded-lg">
              <img src={qr} alt="QR" className="w-48 h-48" />
            </div>
          ) : (
            <button type="button" onClick={loadQr} className="btn-primary">Show QR code</button>
          )}
          <p className="text-slate-500 text-sm mt-3">Participants scan this at the event to mark attendance.</p>
        </div>
      )}
      {event.registrations?.length > 0 && (isClubAdmin || isSuperAdmin) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Registrations ({event.registrations.length})</h2>
          <ul className="space-y-1 text-sm text-slate-400">
            {event.registrations.map(r => (
              <li key={r.id}>
                {r.name} {event.attendance?.includes(r.id) && <span className="text-brand-400">✓</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
