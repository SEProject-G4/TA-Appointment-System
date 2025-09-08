import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
// import LecturerDashboard from "./pages/LecturerDashboard";
import ViewModuleDetails from "./components/ViewModuleDetails";
import EditModuleDetails from "./components/EditModuleDetails";
import HandleTARequests from "./components/HandleTARequests";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";

import CSEofficeDashboard from "./pages/CSEofficeDashboard";

import NewModule from "./pages/NewModule";
import AddUser from "./pages/AddUser";

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
                path="/recruitment-series/:series-id/add-module"
                element={
                  <ProtectedRoute roles="admin">
                    <NewModule />
                  </ProtectedRoute>
                }
              />

              {/* TA Routes */}
              <Route path="ta-dashboard" element={<TADashboard />} />
              <Route path="ta-applied" element={<TADashboardApplied />} />
              <Route path="ta-accepted" element={<TADashboardAccepted />} />

              {/* Lecturer Routes */}
              {/* <Route
                path="lecturer-dashboard"
                element={
                  <ProtectedRoute roles="lecturer">
                    <LecturerDashboard />
                  </ProtectedRoute>
                }
              /> */}
              <Route path="lec-view-module-details" element={<ViewModuleDetails />}  />
              <Route path="lec-edit-module-details" element={<EditModuleDetails />} />
              <Route path="lec-handle-ta-requests" element={<HandleTARequests />} />

              {/* CSE Office Routes */}
              <Route path="cse-office-dashboard" element={<CSEofficeDashboard />} />

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
