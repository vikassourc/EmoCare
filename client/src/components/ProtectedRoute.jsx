import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold">E</span>
          </div>
          <p className="text-zinc-500 text-sm">Loading EmoCare…</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
