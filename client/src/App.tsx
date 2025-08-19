import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import NewModule from "./pages/NewModule";
import AddUser from "./pages/AddUser";

function App() {
  const navbarRef = useRef<HTMLDivElement>(null);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (navbarRef.current) {
      setNavbarHeight(navbarRef.current.clientHeight);
    }
  }, [navbarRef]);

  const contentHeight = `calc(100vh - ${navbarHeight}px)`;
  let isInLoginPage = location.pathname === '/login';

  return (
    <AuthProvider>
      <div className="w-screen h-screen overflow-hidden">
        <Navbar ref={navbarRef} />
        <div className="overflow-y-auto overflow-x-hidden" style={isInLoginPage? {overflowY: 'hidden', height: '100vh'}:{ height: `${contentHeight}`, marginTop: `${navbarHeight}px` }} >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Outlet />}>
              <Route index element={<HomePage />} />

              {/* Admin Routes */}
              <Route
                path="admin-dashboard"
                element={
                  <ProtectedRoute roles="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="manage-users/add-user" element={
                <ProtectedRoute roles="admin">
                  <AddUser />
                </ProtectedRoute>
              } />

              {/* Lecturer Routes */}
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
                }
              />

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Route>
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
