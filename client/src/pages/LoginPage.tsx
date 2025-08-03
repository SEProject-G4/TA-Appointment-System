import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import GoogleLoginButton from "../components/GoogleLoginButton";

const LoginPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();

  // Helper function to get default route based on user role
  const getDefaultRouteForRole = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'lecturer':
        return '/lecturer-dashboard';
      default:
        return '/login'; // fallback to login if role is not recognized
    }
  };

  useEffect(() => {
    // Redirect based on user role if already authenticated
    if (isAuthenticated && !loading && user) {
      const redirectPath = location.state?.from || getDefaultRouteForRole(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, loading, user, navigate, location.state]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get("error");
    if (error) {
      switch (error) {
        case "unauthorized_domain":
          setErrorMsg("Login failed. Please use your cse.mrt.ac.lk account.");
          break;
        case "auth_failed":
          setErrorMsg("Authentication failed. Please contact support.");
          break;
        default:
          setErrorMsg("An unexpected error occurred. Please try again.");
      }
    }
  }, [location.search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page text-text-primary">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page text-text-primary p-4">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-bg-card border border-border-default">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome</h1>
        <p className="text-center text-text-secondary mb-8">
          Sign in to the TA Appointment System with your Google account.
        </p>

        {errorMsg && (
          <div className="bg-error/10 border border-error text-error p-3 rounded-lg text-sm text-center mb-6">
            {errorMsg}
          </div>
        )}

        <GoogleLoginButton />
      </div>
    </div>
  );
};

export default LoginPage;