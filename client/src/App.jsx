import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';

// Public pages
import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/LoginPage';

// Protected pages — core
import DashboardPage      from './pages/DashboardPage';
import ChatConsole        from './components/ChatConsole';
import ChatHistoryPage    from './pages/ChatHistoryPage';
import JournalPage        from './pages/JournalPage';
import ProfilePage        from './pages/ProfilePage';
import VoiceCompanion     from './pages/VoiceCompanion';
import TherapyPage        from './pages/TherapyPage';

// Protected pages — wellness tools
import MoodTrackerPage    from './pages/MoodTrackerPage';
import BreathePage        from './pages/BreathePage';
import WellnessTrackerPage from './pages/WellnessTrackerPage';
import AffirmationsPage   from './pages/AffirmationsPage';
import AchievementsPage   from './pages/AchievementsPage';
import SoundscapesPage    from './pages/SoundscapesPage';
import CrisisPage         from './pages/CrisisPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
          {/* Public */}
          <Route path="/"      element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all inside AppShell layout */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            {/* Core */}
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/chat"         element={<ChatConsole />} />
            <Route path="/voice"        element={<VoiceCompanion />} />
            <Route path="/history"      element={<ChatHistoryPage />} />
            <Route path="/journal"      element={<JournalPage />} />
            <Route path="/therapy"      element={<TherapyPage />} />
            <Route path="/profile"      element={<ProfilePage />} />

            {/* Wellness Tools */}
            <Route path="/moods"        element={<MoodTrackerPage />} />
            <Route path="/breathe"      element={<BreathePage />} />
            <Route path="/wellness"     element={<WellnessTrackerPage />} />
            <Route path="/affirmations" element={<AffirmationsPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/soundscapes"  element={<SoundscapesPage />} />
            <Route path="/crisis"       element={<CrisisPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
