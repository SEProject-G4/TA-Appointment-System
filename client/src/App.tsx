import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import Navbar from './components/Navbar';

function App() {

  return (
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* <Route path="/" element={<LoginPage />} /> */}
          
          <Route path="/admin-dashboard" element={
            <ProtectedRoute roles="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/lecturer-dashboard" element={
            <ProtectedRoute roles="lecturer">
              <LecturerDashboard />
            </ProtectedRoute>
          } />

          {/* Define routes for other roles here */}
          
          {/* Redirect to a default login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
  );
}

export default App;