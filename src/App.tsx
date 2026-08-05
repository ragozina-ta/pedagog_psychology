import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AppLayout } from './components/AppLayout'
import { AdminPage } from './pages/AdminPage'
import { AffirmationsPage } from './pages/AffirmationsPage'
import { AuthPage } from './pages/AuthPage'
import { CardsPage } from './pages/CardsPage'
import { ChatPage } from './pages/ChatPage'
import { DiaryPage } from './pages/DiaryPage'
import { GardenPage } from './pages/GardenPage'
import { HomePage } from './pages/HomePage'
import { InvitePage, SharePage } from './pages/InviteSharePages'
import { LandingPage } from './pages/LandingPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { SettingsPage } from './pages/SettingsPage'
import { WheelPage } from './pages/WheelPage'
import { WishMapPage } from './pages/WishMapPage'

function Protected({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="panel">Загрузка…</div>
  if (!profile) return <Navigate to="/auth" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/share/:token" element={<SharePage />} />
      <Route
        path="/app"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="garden" element={<GardenPage />} />
        <Route path="diary" element={<DiaryPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="wheel" element={<WheelPage />} />
        <Route path="affirmations" element={<AffirmationsPage />} />
        <Route path="cards" element={<CardsPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="wish-map" element={<WishMapPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="invite/:token" element={<InvitePage />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
