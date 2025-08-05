import React, { useState, useEffect, use } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import GoogleLoginButton from "../components/GoogleLoginButton";
import LoginBgImage from "../assets/images/sumanadasa.jpg";

const LoginPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to home if already authenticated
    if (user) {
      const redirectPath = location.state?.from || "/";
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, location.state]);

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

//   if (loading || isAuthenticated) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-bg-page text-text-primary">
//         Loading...
//       </div>
//     );
//   }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${LoginBgImage})`,
      }}
    >
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-bg-card border border-border-default">
        <h1 className="text-3xl font-bold text-center text-text-primary mb-2">Welcome</h1>
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