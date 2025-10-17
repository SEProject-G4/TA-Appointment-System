import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  logout as apiLogout,
  verifyGoogleToken,
  selectRole as apiSelectRole,
} from "../api/authApi";
import type { User, RoleSelectionResponse, AuthResponse } from "../api/authApi";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggingOut: boolean;
  roleSelectionData: RoleSelectionResponse | null;
  logout: () => void;
  loginWithGIS: (idToken: string) => Promise<void>;
  selectRole: (userId: string, role: string) => Promise<void>;
  clearRoleSelection: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [roleSelectionData, setRoleSelectionData] = useState<RoleSelectionResponse | null>(null);
  const navigate = useNavigate();

  // Check for an existing session on initial load
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const loginWithGIS = async (idToken: string) => {
    setLoading(true);
    try {
      const response: AuthResponse = await verifyGoogleToken(idToken);
      
      // Check if role selection is required
      if ('requiresRoleSelection' in response && response.requiresRoleSelection) {
        setRoleSelectionData(response);
        setUser(null);
      } else {
        // Direct login - single role
        setUser(response as User);
        setRoleSelectionData(null);
      }
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      setRoleSelectionData(null);
      throw error; // Re-throw the error so the component can handle it
    } finally {
      setLoading(false);
    }
  };

  const selectRole = async (userId: string, role: string) => {
    setLoading(true);
    try {
      const authenticatedUser = await apiSelectRole(userId, role);
      setUser(authenticatedUser);
      setRoleSelectionData(null);
    } catch (error) {
      console.error("Role selection failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearRoleSelection = () => {
    setRoleSelectionData(null);
  };

  const logout = () => {
    setIsLoggingOut(true);
    apiLogout()
      .then(() => {
        setUser(null);
        navigate("/"); // Navigate to Home page after logout
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      })
      .finally(() => {
        setIsLoggingOut(false);
      });
  };

  const memoizedValue = React.useMemo(
    () => ({
      user,
      loading,
      isLoggingOut,
      roleSelectionData,
      logout,
      loginWithGIS,
      selectRole,
      clearRoleSelection,
    }),
    [user, loading, isLoggingOut, roleSelectionData]
  );

  return (
    <AuthContext.Provider value={memoizedValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
