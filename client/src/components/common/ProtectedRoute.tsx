import React from "react";
import { Navigate } from "react-router-dom";
import Loader from "./Loader";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute: React.FC<{
  roles?: string[] | string ;
  children: React.ReactNode;
}> = ({ roles , children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen-minusnav flex items-center justify-center bg-bg-page text-text-primary">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles !== undefined) {
    if (typeof roles === "string") {
      roles = [roles];
    }
    if (roles.length > 0 && !roles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
