import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AffirmationsPage } from './pages/AffirmationsPage'
import { CardsPage } from './pages/CardsPage'
import { CompassPage } from './pages/CompassPage'
import { DiaryPage } from './pages/DiaryPage'
import { HomePage } from './pages/HomePage'
import { ResourcesPage } from './pages/ResourcesPage'
import { SettingsPage } from './pages/SettingsPage'
import { WheelPage } from './pages/WheelPage'
import { WishMapPage } from './pages/WishMapPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="wheel" element={<WheelPage />} />
          <Route path="wish-map" element={<WishMapPage />} />
          <Route path="cards" element={<CardsPage />} />
          <Route path="diary" element={<DiaryPage />} />
          <Route path="compass" element={<CompassPage />} />
          <Route path="affirmations" element={<AffirmationsPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
