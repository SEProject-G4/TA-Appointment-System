import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import NewModule from "./pages/NewModule";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Outlet />}>
          <Route index element={<HomePage />} />

          <Route
            path="admin-dashboard"
            element={
              <ProtectedRoute roles="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="lecturer-dashboard"
            element={
              <ProtectedRoute roles="lecturer">
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
          path="/recruitment-series/:series-id/add-module"
          element={
            <ProtectedRoute roles="admin">
              <NewModule />
            </ProtectedRoute>
          } />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
