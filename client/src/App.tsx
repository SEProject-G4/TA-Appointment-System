import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ModalProvider } from "./contexts/ModalProvider";
import { useState, useRef, useEffect } from "react";

import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Navbar from "./components/common/Navbar";
import HomePage from "./pages/HomePage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import NewModule from "./pages/admin/NewModule";
import EditModule from "./pages/admin/EditModule";
import NewRecruitmentSeries from "./pages/admin/NewRecruitmentSeries";
import AddUser from "./pages/admin/AddUser";
import UndergraduateUsers from "./pages/admin/UndergraduateUsers";
import ModuleDetails from "./pages/admin/ModuleDetails";

import ViewModuleDetails from "./components/ViewModuleDetails";
import EditModuleDetails from "./components/EditModuleDetails";
import HandleTARequests from "./components/HandleTARequests";

import CSEofficeDashboard from "./pages/CSEofficeDashboard";

import TADashboardApplied from "./pages/ta/TADashboardApplied";
import TADashboardAccepted from "./pages/ta/TADashboardAccepted";
import TADashboard from "./pages/ta/TADashboard";

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
              className="overflow-x-hidden overflow-y-auto"
              style={
                isInLoginPage
                  ? { overflowY: "hidden", height: "100vh" }
                  : {
                      height: `${contentHeight}`,
                      marginTop: `${navbarHeight}px`,
                    }
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

                  <Route
                    path="/module-details/:moduleId"
                    element={
                      <ProtectedRoute roles="admin">
                        <ModuleDetails />
                      </ProtectedRoute>
                    }
                  />

                  {/* TA Routes */}
                  <Route
                    path="ta-dashboard"
                    element={
                    //  <ProtectedRoute roles={["undergraduate", "postgraduate"]}>
                        <TADashboard />
                    //  </ProtectedRoute>
                    }
                  />
                  <Route
                    path="ta-applied"
                    element={
                      // <ProtectedRoute roles={["undergraduate", "postgraduate"]}>
                        <TADashboardApplied />
                      // </ProtectedRoute>
                    }
                  />
                  <Route
                    path="ta-accepted"
                    element={
                      // <ProtectedRoute roles={["undergraduate", "postgraduate"]}>
                        <TADashboardAccepted />
                      // </ProtectedRoute>
                    }
                  />

                  {/* Lecturer Routes */}
                  {/* <Route
                path="lecturer-dashboard"
                element={
                  <ProtectedRoute roles="lecturer">
                    <LecturerDashboard />
                  </ProtectedRoute>
                }
              /> */}
                  <Route
                    path="lec-view-module-details"
                    element={<ViewModuleDetails />}
                  />
                  <Route
                    path="lec-edit-module-details"
                    element={<EditModuleDetails />}
                  />
                  <Route
                    path="lec-handle-ta-requests"
                    element={<HandleTARequests />}
                  />

                  {/* CSE Office Routes */}
                  <Route
                    path="cse-office-dashboard"
                    element={<CSEofficeDashboard />}
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
