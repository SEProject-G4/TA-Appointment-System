import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginBgImage from "../assets/images/sumanadasa.jpg";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

type AlertModalProps = {
  message: string;
  onClose: () => void;
};

const AlertModal = ({ message, onClose }: AlertModalProps) => {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="w-full max-w-sm p-6 text-center rounded-lg shadow-xl bg-bg-card">
        <p className="mb-4 text-lg text-text-secondary">{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 transition-colors rounded-lg bg-primary text-text-inverted hover:bg-primary-dark"
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
};

const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, loginWithGIS } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isGisScriptLoaded, setIsGisScriptLoaded] = useState(false);

  const showAlert = (message: string) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      await loginWithGIS(response.credential);
    } catch (error) {
      let errorMessage = "Authentication failed. Please try again.";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response === "object" &&
        (error as any).response !== null &&
        "data" in (error as any).response &&
        typeof (error as any).response.data === "object" &&
        (error as any).response.data !== null &&
        "error" in (error as any).response.data
      ) {
        errorMessage = (error as any).response.data.error || errorMessage;
      }
      showAlert(errorMessage);
      console.error("Login failed:", error);
    }
  };

  // Helper function to get default route based on user role
  const getDefaultRouteForRole = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'lecturer':
        return '/lecturer-dashboard';
      case 'undergraduate':
        return '/ta-dashboard';
      case 'postgraduate':
        return '/ta-dashboard';
      case 'cse office' :
        return '/cse-office-dashboard';
      default:
        return '/login'; // fallback to login if role is not recognized
    }
  };

  useEffect(() => {

    // Redirect based on user role if already authenticated
    if ( user && !loading ) {
      const redirectPath = location.state?.from || getDefaultRouteForRole(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [loading, user, navigate, location.state]);


  useEffect(() => {
    const checkGIS = setInterval(() => {
      if (typeof window.google !== "undefined") {
        setIsGisScriptLoaded(true);
        clearInterval(checkGIS);
      }
    }, 100);

    return () => clearInterval(checkGIS);
  }, []);

  useEffect(() => {
    if (isGisScriptLoaded && GOOGLE_CLIENT_ID && !user && !loading) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: true,
        });

        window.google.accounts.id.prompt();
        
        const buttonDiv = document.getElementById('google-signin-button-div');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(
            buttonDiv,
            { theme: "filled_blue", size: "large", text: "signin_with", shape: "pill" }
          );
        }
      } catch (error) {
        console.error("Error initializing Google Identity Services:", error);
      }
    }
  }, [isGisScriptLoaded, user, loading, GOOGLE_CLIENT_ID]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-page text-text-primary">
        Loading...
      </div>
    );
  }


  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 bg-center bg-cover"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${LoginBgImage})`,
      }}
    >
      <div className="w-full max-w-md p-8 border shadow-xl rounded-2xl bg-bg-card border-border-default">
        <h1 className="mb-2 text-3xl font-bold text-center text-text-primary">
          Welcome
        </h1>
        <p className="mb-8 text-center text-text-secondary">
          Sign in to the TA Appointment System with your Google account.
        </p>

        <div
          id="google-signin-button-div"
          className="flex justify-center"
        ></div>
      </div>
      {showModal && (
        <AlertModal
          message={modalMessage}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default LoginPage;
