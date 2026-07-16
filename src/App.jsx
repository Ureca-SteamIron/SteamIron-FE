import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage'
import LoginPage from './pages/LoginPage'
import GameDetailPage from './pages/GameDetailPage'
import MyPage from './pages/MyPage'
import NotificationsPage from './pages/NotificationsPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/games/:gameId" element={<GameDetailPage />} />
        <Route path="/me" element={<MyPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
