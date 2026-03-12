import { Routes, Route } from 'react-router-dom';
import Services from './pages/Services';
import Calendar from './pages/Calendar';
import TimeSlots from './pages/TimeSlots';
import Booking from './pages/Booking';
import Confirmation from './pages/Confirmation';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminServices from './pages/admin/AdminServices';
import AdminBookings from './pages/admin/AdminBookings';
import AdminSchedule from './pages/admin/AdminSchedule';

function App() {
  return (
    <div className="min-h-screen bg-tg-bg">
      <Routes>
        {/* Client routes */}
        <Route path="/" element={<Services />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/slots" element={<TimeSlots />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/confirmation" element={<Confirmation />} />
        
        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="schedule" element={<AdminSchedule />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
