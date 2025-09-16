import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ModalProvider } from "./contexts/ModalProvider";
import { useState, useRef, useEffect } from "react";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import Navbar from "./components/common/Navbar";
import HomePage from "./pages/HomePage";

import NewModule from "./pages/admin/NewModule";
import EditModule from "./pages/admin/EditModule";
import NewRecruitmentSeries from "./pages/admin/NewRecruitmentSeries";
import AddUser from "./pages/admin/AddUser";
import UndergraduateUsers from "./pages/admin/UndergraduateUsers";

import TADashboardApplied from "./pages/TADashboardApplied";
import TADashboardAccepted from "./pages/TADashboardAccepted";
import TADashboard from "./pages/TADashboard";

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
  let isInLoginPage = location.pathname === "/login";

  return (
    <AuthProvider>
      <ToastProvider>
      <ModalProvider>
      <div className="w-screen h-screen overflow-hidden">
        <Navbar ref={navbarRef} />
        <div
          className="overflow-y-auto overflow-x-hidden"
          style={
            isInLoginPage
              ? { overflowY: "hidden", height: "100vh" }
              : { height: `${contentHeight}`, marginTop: `${navbarHeight}px` }
          }
        >
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

              <Route
                path="manage-users/add-user"
                element={
                  <ProtectedRoute roles="admin">
                    <AddUser />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manage-users/undergraduates"
                element={
                  <ProtectedRoute roles="admin">
                    <UndergraduateUsers />
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

                <Route
                  path="/recruitment-series/create"
                  element={
                    <ProtectedRoute roles="admin">
                      <NewRecruitmentSeries />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/edit-module/:moduleId"
                  element={
                    <ProtectedRoute roles="admin">
                      <EditModule />
                    </ProtectedRoute>
                  }
                />

              {/* TA Routes */}
              <Route path="ta-dashboard" element={<TADashboard />} />
              <Route path="ta-applied" element={<TADashboardApplied />} />
              <Route path="ta-accepted" element={<TADashboardAccepted />} />

              {/* Lecturer Routes */}
              <Route
                path="lecturer-dashboard"
                element={
                  <ProtectedRoute roles="lecturer">
                    <LecturerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Route>
          </Routes>
        </div>
      </div>
      </ModalProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
