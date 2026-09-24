import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Participants from "./pages/Participants";
import Sessions from "./pages/Sessions";
import AttendanceScan from "./pages/AttendanceScan";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman Utama: Scan QR Presensi (Bisa diakses langsung tanpa login) */}
        <Route path="/" element={<AttendanceScan />} />
        <Route path="/scan" element={<AttendanceScan />} />

        {/* Halaman Login Admin (Publik) */}
        <Route path="/login" element={<Login />} />

        {/* Rute Terproteksi Khusus Admin */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/participants" element={<Participants />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/sessions" element={<Sessions />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;