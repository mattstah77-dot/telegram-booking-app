import { Routes, Route } from 'react-router-dom';
import Services from './pages/Services';
import Calendar from './pages/Calendar';
import TimeSlots from './pages/TimeSlots';
import Booking from './pages/Booking';
import Confirmation from './pages/Confirmation';

function App() {
  return (
    <div className="min-h-screen bg-tg-bg">
      <Routes>
        <Route path="/" element={<Services />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/slots" element={<TimeSlots />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/confirmation" element={<Confirmation />} />
      </Routes>
    </div>
  );
}

export default App;
