import { useAuth } from '../context/AuthContext';
import { certificates as certApi } from '../api';

export default function Certificates() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  function downloadParticipation() {
    const url = `${window.location.origin}/api/certificates/participation/${user.id}?token=${token}`;
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Certificates</h1>
      <div className="card max-w-md">
        <h2 className="text-lg font-semibold text-slate-100 mb-2">Participation certificate</h2>
        <p className="text-slate-500 text-sm mb-4">
          Download a PDF certificate listing all events you have attended.
        </p>
        <button type="button" onClick={downloadParticipation} className="btn-primary">
          Download my certificate
        </button>
      </div>
    </div>
  );
}
