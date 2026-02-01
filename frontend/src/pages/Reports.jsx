import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reports as reportsApi } from '../api';
import toast from 'react-hot-toast';

export default function Reports() {
  const { user } = useAuth();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  function downloadSemester() {
    if (!start || !end) {
      toast.error('Select start and end dates');
      return;
    }
    reportsApi.semester(start, end);
    toast.success('Report download started');
  }

  function downloadPortfolio() {
    reportsApi.portfolio(user.id);
    toast.success('Portfolio download started');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">My activity portfolio</h2>
          <p className="text-slate-500 text-sm mb-4">
            Download a PDF of your clubs and events attended.
          </p>
          <button type="button" onClick={downloadPortfolio} className="btn-primary">
            Download portfolio
          </button>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Semester report</h2>
          <p className="text-slate-500 text-sm mb-4">
            Download activity report for a date range (admin can use for all events).
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="date"
              className="input flex-1 min-w-[140px]"
              value={start}
              onChange={e => setStart(e.target.value)}
              placeholder="Start"
            />
            <input
              type="date"
              className="input flex-1 min-w-[140px]"
              value={end}
              onChange={e => setEnd(e.target.value)}
              placeholder="End"
            />
          </div>
          <button type="button" onClick={downloadSemester} className="btn-primary">
            Download semester report
          </button>
        </div>
      </div>
    </div>
  );
}
