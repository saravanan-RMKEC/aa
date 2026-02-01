import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { users as usersApi, clubs as clubsApi } from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'student', club_id: '' });

  useEffect(() => {
    usersApi.list().then(setUsers).catch(() => toast.error('Failed to load users'));
    clubsApi.list().then(setClubs).catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await usersApi.create({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        club_id: form.role === 'club_admin' ? form.club_id : undefined,
      });
      toast.success('User created');
      setShowForm(false);
      setForm({ email: '', password: '', name: '', role: 'student', club_id: '' });
      usersApi.list().then(setUsers);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function setRole(userId, role, club_id) {
    try {
      await usersApi.setRole(userId, role, club_id);
      toast.success('Role updated');
      usersApi.list().then(setUsers);
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Users & roles</h1>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary">Add user</button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">New user</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input type="text" className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={6} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="student">Student</option>
                  <option value="club_admin">Club Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {form.role === 'club_admin' && (
                <div>
                  <label className="label">Club</label>
                  <select className="input" value={form.club_id} onChange={e => setForm(f => ({ ...f, club_id: e.target.value }))} required>
                    <option value="">Select club</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700">
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Email</th>
              <th className="text-left py-3">Role</th>
              <th className="text-left py-3">Club</th>
              <th className="text-right py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-slate-700/50">
                <td className="py-3 text-slate-200">{u.name}</td>
                <td className="py-3 text-slate-400">{u.email}</td>
                <td className="py-3">
                  <select
                    className="input py-1.5 text-sm w-auto"
                    value={u.role}
                    onChange={e => setRole(u.id, e.target.value, u.club_id)}
                  >
                    <option value="student">Student</option>
                    <option value="club_admin">Club Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="py-3">
                  {u.role === 'club_admin' ? (
                    <select
                      className="input py-1.5 text-sm w-auto"
                      value={u.club_id ?? ''}
                      onChange={e => setRole(u.id, 'club_admin', e.target.value || null)}
                    >
                      <option value="">—</option>
                      {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="py-3 text-right" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
