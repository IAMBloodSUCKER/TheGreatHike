import { Navigate, Route, Routes } from 'react-router-dom';
import BackgroundMusic from './components/BackgroundMusic';
import PageShell from './components/PageShell';
import { useAuth } from './hooks/useAuth';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import FeedbackPage from './pages/FeedbackPage';
import LandingPage from './pages/LandingPage';

function HomeRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }
  return (
    <PageShell>
      <LandingPage />
    </PageShell>
  );
}
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <BackgroundMusic />
      <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route
        path="/auth"
        element={
          <PageShell>
            <AuthPage />
          </PageShell>
        }
      />
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <PageShell wide showSidebar>
              <DashboardPage />
            </PageShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/feedback"
        element={
          <PrivateRoute>
            <PageShell wide showSidebar>
              <FeedbackPage />
            </PageShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/admin"
        element={
          <AdminRoute>
            <PageShell wide showSidebar>
              <AdminPage />
            </PageShell>
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
