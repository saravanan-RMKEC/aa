import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { clubs as clubsApi } from '../api';

export default function ClubDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clubsApi.get(id).then(setClub).catch(() => toast.error('Club not found')).finally(() => setLoading(false));
  }, [id]);

  if (loading || !club) return <div className="flex justify-center py-12"><div className="animate-spin w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  const isMember = club.members?.some(m => m.id === user?.id);
  const isClubAdmin = user?.role === 'club_admin' && user?.clubId === Number(id);

  async function handleJoin() {
    try {
      await clubsApi.join(id);
      toast.success('Joined club');
      setClub({ ...club, members: [...(club.members || []), { id: user.id, name: user.name, email: user.email }] });
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleLeave() {
    try {
      await clubsApi.leave(id);
      toast.success('Left club');
      setClub({ ...club, members: club.members?.filter(m => m.id !== user.id) || [] });
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{club.name}</h1>
          {club.faculty_advisor_name && (
            <p className="text-slate-500 text-sm mt-1">Advisor: {club.faculty_advisor_name}</p>
          )}
        </div>
        {user?.role === 'student' && (
          isMember ? (
            <button type="button" onClick={handleLeave} className="btn-secondary">Leave club</button>
          ) : (
            <button type="button" onClick={handleJoin} className="btn-primary">Join club</button>
          )
        )}
      </div>
      {club.description && (
        <div className="card">
          <p className="text-slate-300">{club.description}</p>
        </div>
      )}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Upcoming events</h2>
        <p className="text-slate-500 text-sm">
          <Link to={`/events?club_id=${id}`} className="text-brand-400 hover:underline">View events for this club →</Link>
        </p>
      </div>
      {club.members?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Members ({club.members.length})</h2>
          <ul className="space-y-2">
            {club.members.slice(0, 20).map(m => (
              <li key={m.id} className="text-slate-400 text-sm">{m.name}</li>
            ))}
            {club.members.length > 20 && <li className="text-slate-500 text-sm">+{club.members.length - 20} more</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
