import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clubs as clubsApi, users as usersApi } from '../api';

export default function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', faculty_advisor_id: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    clubsApi.list().then(setClubs).catch(() => toast.error('Failed to load clubs'));
    usersApi.list().then(setUsers).catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await clubsApi.create({
        name: form.name,
        description: form.description || undefined,
        faculty_advisor_id: form.faculty_advisor_id || undefined,
      });
      toast.success('Club created');
      setShowForm(false);
      setForm({ name: '', description: '', faculty_advisor_id: '' });
      clubsApi.list().then(setClubs);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editing) return;
    try {
      await clubsApi.update(editing.id, {
        name: form.name,
        description: form.description || undefined,
        faculty_advisor_id: form.faculty_advisor_id || undefined,
      });
      toast.success('Club updated');
      setEditing(null);
      setForm({ name: '', description: '', faculty_advisor_id: '' });
      clubsApi.list().then(setClubs);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this club? This cannot be undone.')) return;
    try {
      await clubsApi.delete(id);
      toast.success('Club deleted');
      setClubs(c => c.filter(x => x.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '', faculty_advisor_id: c.faculty_advisor_id ?? '' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Manage clubs</h1>
        <button type="button" onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', description: '', faculty_advisor_id: '' }); }} className="btn-primary">
          Add club
        </button>
      </div>

      {(showForm || editing) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">{editing ? 'Edit club' : 'New club'}</h2>
          <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="label">Faculty advisor (optional)</label>
              <select
                className="input"
                value={form.faculty_advisor_id || ''}
                onChange={e => setForm(f => ({ ...f, faculty_advisor_id: e.target.value || undefined }))}
              >
                <option value="">— None —</option>
                {users.filter(u => u.role !== 'student').map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {clubs.map(c => (
          <div key={c.id} className="card flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link to={`/clubs/${c.id}`} className="font-semibold text-slate-100 hover:text-brand-400">{c.name}</Link>
              {c.faculty_advisor_name && <p className="text-slate-500 text-sm">Advisor: {c.faculty_advisor_name}</p>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => openEdit(c)} className="btn-ghost text-sm">Edit</button>
              <button type="button" onClick={() => handleDelete(c.id)} className="btn-ghost text-sm text-red-400 hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
