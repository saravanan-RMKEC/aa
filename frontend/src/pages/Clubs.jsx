import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clubs as clubsApi } from '../api';
import toast from 'react-hot-toast';

export default function Clubs() {
  const [list, setList] = useState([]);

  useEffect(() => {
    clubsApi.list().then(setList).catch(() => toast.error('Failed to load clubs'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Clubs</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(c => (
          <Link
            key={c.id}
            to={`/clubs/${c.id}`}
            className="card block hover:border-brand-500/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-slate-100">{c.name}</h2>
            <p className="text-slate-500 text-sm mt-1 line-clamp-2">{c.description}</p>
            {c.faculty_advisor_name && (
              <p className="text-slate-600 text-xs mt-2">Advisor: {c.faculty_advisor_name}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
