import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getDefaultRoute } from './utils/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ClubDashboard from './pages/ClubDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import MyRegistrations from './pages/MyRegistrations';
import Certificates from './pages/Certificates';
import Reports from './pages/Reports';
import AdminClubs from './pages/AdminClubs';
import AdminUsers from './pages/AdminUsers';
import AdminEvents from './pages/AdminEvents';
import PendingEvents from './pages/PendingEvents';
import EventCreate from './pages/EventCreate';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: useLocation().pathname }} />;
  if (roles && roles.length && !roles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<RoleRedirect />} />
        {/* Super Admin only */}
        <Route path="admin/dashboard" element={<Protected roles={['super_admin']}><AdminDashboard /></Protected>} />
        <Route path="admin/clubs" element={<Protected roles={['super_admin']}><AdminClubs /></Protected>} />
        <Route path="admin/users" element={<Protected roles={['super_admin']}><AdminUsers /></Protected>} />
        <Route path="admin/events" element={<Protected roles={['super_admin']}><AdminEvents /></Protected>} />
        <Route path="admin/pending-events" element={<Protected roles={['super_admin']}><PendingEvents /></Protected>} />
        {/* Club Admin only */}
        <Route path="club/dashboard" element={<Protected roles={['club_admin']}><ClubDashboard /></Protected>} />
        {/* Student only */}
        <Route path="student/dashboard" element={<Protected roles={['student']}><StudentDashboard /></Protected>} />
        {/* Shared: clubs (student: join; club_admin: view their club; super_admin: view all) */}
        <Route path="clubs" element={<Clubs />} />
        <Route path="clubs/:id" element={<ClubDetail />} />
        {/* Shared: events (student: register; club_admin: create, QR; super_admin: all) */}
        <Route path="events" element={<Events />} />
        <Route path="events/new" element={<Protected roles={['club_admin', 'super_admin']}><EventCreate /></Protected>} />
        <Route path="events/:id" element={<EventDetail />} />
        {/* Student only: registrations, certificates */}
        <Route path="my-registrations" element={<Protected roles={['student']}><MyRegistrations /></Protected>} />
        <Route path="certificates" element={<Protected roles={['student']}><Certificates /></Protected>} />
        {/* Reports: all roles (scope by backend) */}
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  const to = getDefaultRoute(user?.role);
  return <Navigate to={to} replace />;
}
