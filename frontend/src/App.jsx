import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './ProtectedRoute'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import RoomDetails from './pages/RoomDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BookRoom from './pages/BookRoom'
import MyBookings from './pages/MyBookings'
import Invoice from './pages/Invoice'
import ManageRooms from './pages/ManageRooms'
import Profile from './pages/Profile'
import WriteReview from './pages/WriteReview'
import Guests from './pages/Guests'
import GuestDetail from './pages/GuestDetail'
import Feedback from './pages/Feedback'

const STAFF = ['admin', 'receptionist']

export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/book/:roomId" element={<ProtectedRoute><BookRoom /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/invoice/:id" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/review/:bookingId" element={<ProtectedRoute><WriteReview /></ProtectedRoute>} />
          <Route path="/manage-rooms" element={<ProtectedRoute roles={STAFF}><ManageRooms /></ProtectedRoute>} />
          <Route path="/guests" element={<ProtectedRoute roles={STAFF}><Guests /></ProtectedRoute>} />
          <Route path="/guests/:id" element={<ProtectedRoute roles={STAFF}><GuestDetail /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute roles={STAFF}><Feedback /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
