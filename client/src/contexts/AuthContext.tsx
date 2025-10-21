import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  logout as apiLogout,
  verifyGoogleToken,
  selectRole,
  switchRole,
} from "../api/authApi";
import type { User, RoleSelectionResponse, AvailableRole } from "../api/authApi";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggingOut: boolean;
  requiresRoleSelection: boolean;
  availableRoles: AvailableRole[];
  pendingLoginToken: string | null;
  logout: () => void;
  loginWithGIS: (idToken: string) => Promise<void>;
  selectUserRole: (selectedRole: string) => Promise<void>;
  switchUserRole: (newRole: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [requiresRoleSelection, setRequiresRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [pendingLoginToken, setPendingLoginToken] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for an existing session on initial load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Fetching current user...');
        const currentUser = await getCurrentUser();
        console.log('Current user:', currentUser);
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const loginWithGIS = async (idToken: string) => {
    setLoading(true);
    try {
      const response = await verifyGoogleToken(idToken);
      console.log('Google verification response:', response);
      
      // Check if role selection is required
      if ('requiresRoleSelection' in response && response.requiresRoleSelection) {
        setRequiresRoleSelection(true);
        setAvailableRoles(response.availableRoles);
        setPendingLoginToken(idToken);
        setLoading(false);
        return;
      }
      
      // Single role login - proceed normally
      const authenticatedUser = response as User;
      setUser(authenticatedUser);
      setRequiresRoleSelection(false);
      setAvailableRoles([]);
      setPendingLoginToken(null);
      console.log('✅ Login successful:', authenticatedUser.email);
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      setRequiresRoleSelection(false);
      setAvailableRoles([]);
      setPendingLoginToken(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const selectUserRole = async (selectedRole: string) => {
    if (!pendingLoginToken) {
      throw new Error('No pending login token available');
    }
    
    setLoading(true);
    try {
      const authenticatedUser = await selectRole(pendingLoginToken, selectedRole);
      setUser(authenticatedUser);
      setRequiresRoleSelection(false);
      setAvailableRoles([]);
      setPendingLoginToken(null);
      console.log('✅ Role selected successfully:', authenticatedUser.email, selectedRole);
    } catch (error) {
      console.error("Role selection failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const switchUserRole = async (newRole: string) => {
    setLoading(true);
    try {
      const updatedUser = await switchRole(newRole);
      setUser(updatedUser);
      console.log('✅ Role switched successfully:', updatedUser.email, newRole);
    } catch (error) {
      console.error("Role switching failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setIsLoggingOut(true);
    apiLogout()
      .then(() => {
        setUser(null);
        setRequiresRoleSelection(false);
        setAvailableRoles([]);
        setPendingLoginToken(null);
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
      requiresRoleSelection,
      availableRoles,
      pendingLoginToken,
      logout,
      loginWithGIS,
      selectUserRole,
      switchUserRole,
    }),
    [user, loading, isLoggingOut, requiresRoleSelection, availableRoles, pendingLoginToken]
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
