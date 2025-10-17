import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginBgImage from "../assets/images/sumanadasa.jpg";
import { 
  LuUserCog, 
  LuBookOpen, 
  LuGraduationCap, 
  LuBookMarked, 
  LuBuilding2, 
  LuUser 
} from "react-icons/lu";

declare global {
  interface Window {
    google: any;
  }
}

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

type RoleSelectionModalProps = {
  email: string;
  availableRoles: Array<{ userId: string; role: string; groupId: string; firstLogin: boolean }>;
  onSelectRole: (userId: string, role: string) => void;
  onClose: () => void;
};

const RoleSelectionModal = ({ availableRoles, onSelectRole, onClose }: RoleSelectionModalProps) => {
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'lecturer':
        return 'Lecturer';
      default:
        return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Manage system settings and users';
      case 'lecturer':
        return 'View and manage TA applications';
      default:
        return '';
    }
  };

  const getRoleIcon = (role: string) => {
    const iconClass = "w-6 h-6";
    switch (role) {
      case 'admin':
        return <LuUserCog className={iconClass} />;
      case 'lecturer':
        return <LuBookOpen className={iconClass} />;
      case 'undergraduate':
        return <LuGraduationCap className={iconClass} />;
      case 'postgraduate':
        return <LuBookMarked className={iconClass} />;
      case 'cse-office':
        return <LuBuilding2 className={iconClass} />;
      case 'hod':
        return <LuUser className={iconClass} />;
      default:
        return <LuUser className={iconClass} />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="w-full max-w-md p-6 rounded-xl shadow-2xl bg-bg-card">
        <h2 className="mb-2 text-3xl font-extrabold text-center text-text-primary">
          Select Your Role
        </h2>
        <p className="mb-6 text-center text-text-secondary">
          You have access to multiple roles. Please choose which dashboard you'd like to access.
        </p>
        <div className="space-y-3">
          {availableRoles
            .filter((r) => r.role === 'admin' || r.role === 'lecturer')
            .map((roleOption) => (
            <button
              key={roleOption.userId}
              onClick={() => onSelectRole(roleOption.userId, roleOption.role)}
              aria-label={`Continue as ${getRoleDisplayName(roleOption.role)}`}
              className="w-full group relative p-4 text-left transition-all border rounded-xl bg-bg-page border-border-default hover:border-primary hover:bg-bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 text-primary">
                    {getRoleIcon(roleOption.role)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-semibold text-text-primary">
                        {getRoleDisplayName(roleOption.role)}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                        Dashboard
                      </span>
                    </div>
                    <div className="mt-0.5 text-sm text-text-secondary">
                      {getRoleDescription(roleOption.role)}
                    </div>
                  </div>
                </div>
                <div className="ml-3 opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-text-secondary"
                  >
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 transition-colors border rounded-lg text-text-secondary border-border-default hover:bg-bg-page"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, loginWithGIS, roleSelectionData, selectRole, clearRoleSelection } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isGisScriptLoaded, setIsGisScriptLoaded] = useState(false);
  const [autoLoginStatus, setAutoLoginStatus] = useState<string>('');

  const showAlert = (message: string) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const handleRoleSelection = async (userId: string, role: string) => {
    try {
      await selectRole(userId, role);
      console.log('Role selected successfully:', role);
    } catch (error) {
      let errorMessage = "Role selection failed. Please try again.";
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
      console.error("Role selection failed:", error);
    }
  };

  const handleCredentialResponse = async (response: any) => {
    console.log('Google credential received:', {
      selectBy: response.select_by,
      hasCredential: !!response.credential
    });

    try {
      await loginWithGIS(response.credential);
      console.log('Login successful via Google');
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

  // Handle One Tap prompt notifications
  const handlePromptNotification = (notification: any) => {
    console.log('Google One Tap notification:', {
      isDisplayed: notification.isDisplayed?.(),
      isNotDisplayed: notification.isNotDisplayed?.(),
      isSkipped: notification.isSkippedMoment?.(),
      isDismissed: notification.isDismissedMoment?.()
    });

    if (notification.isDisplayed?.()) {
      setAutoLoginStatus('One Tap displayed - waiting for user selection');
    }

    if (notification.isNotDisplayed?.()) {
      const reason = notification.getNotDisplayedReason?.();
      console.log('One Tap not displayed:', reason);
      
      switch (reason) {
        case 'opt_out_or_no_session':
          setAutoLoginStatus('No previous Google session found');
          break;
        case 'suppressed_by_user':
          setAutoLoginStatus('User previously dismissed One Tap');
          break;
        case 'unregistered_origin':
          setAutoLoginStatus('Domain not registered with Google');
          break;
        case 'invalid_client':
          setAutoLoginStatus('Invalid Google Client ID');
          break;
        default:
          setAutoLoginStatus(`One Tap unavailable: ${reason}`);
      }
    }

    if (notification.isSkippedMoment?.()) {
      const reason = notification.getSkippedReason?.();
      setAutoLoginStatus(`One Tap skipped: ${reason}`);
    }

    if (notification.isDismissedMoment?.()) {
      const reason = notification.getDismissedReason?.();
      if (reason === 'credential_returned') {
        setAutoLoginStatus('Auto-login successful!');
      } else {
        setAutoLoginStatus(`One Tap dismissed: ${reason}`);
      }
    }
  };

  // Helper function to get default route based on user role
  const getDefaultRouteForRole = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'lecturer':
        return '/lec-view-module-details';
      default:
        return '/login'; // fallback to login if role is not recognized
    }
  };

  useEffect(() => {

    // Redirect based on user role if already authenticated
    if ( user && !loading ) {
      const redirectPath = (location as any).state?.from || getDefaultRouteForRole(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [loading, user]);


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
        console.log('Initializing Google authentication with auto-login...');
        setAutoLoginStatus('Initializing Google authentication...');

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: true,
          cancel_on_tap_outside: false,
          prompt_parent_id: 'google-signin-container'
        });

        console.log('Google auth initialized, attempting auto-login...');
        setAutoLoginStatus('Checking for existing Google session...');

        // Attempt One Tap auto-login with notification handler
        window.google.accounts.id.prompt(handlePromptNotification);
        
        // Set a timeout to update status if no response
        setTimeout(() => {
          if (!autoLoginStatus.includes('successful') && !autoLoginStatus.includes('displayed')) {
            setAutoLoginStatus('Auto-login timeout - please use manual sign-in');
          }
        }, 5000);
        
        const buttonDiv = document.getElementById('google-signin-button-div');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(
            buttonDiv,
            { 
              theme: "filled_blue", 
              size: "large", 
              text: "signin_with", 
              shape: "pill",
              width: "300",
              type: "standard"
            }
          );
        }
      } catch (error) {
        console.error("Error initializing Google Identity Services:", error);
        setAutoLoginStatus('Failed to initialize Google authentication');
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

        <div className="space-y-4">
          <div id="google-signin-container"></div>
          <div
            id="google-signin-button-div"
            className="flex justify-center"
          ></div>
          
          {/* Loading state while initializing */}
          {!isGisScriptLoaded && (
            <div className="text-center text-base-content/70">
              <div className="loading loading-spinner loading-sm mr-2"></div>
              Loading Google authentication...
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <AlertModal
          message={modalMessage}
          onClose={() => setShowModal(false)}
        />
      )}
      {roleSelectionData && (
        <RoleSelectionModal
          email={roleSelectionData.email}
          availableRoles={roleSelectionData.availableRoles}
          onSelectRole={handleRoleSelection}
          onClose={clearRoleSelection}
        />
      )}
    </div>
  );
};

export default LoginPage;
