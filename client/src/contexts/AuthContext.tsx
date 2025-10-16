import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentUser,
  logout as apiLogout,
  verifyGoogleToken,
} from "../api/authApi";
import type { User } from "../api/authApi";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggingOut: boolean;
  logout: () => void;
  loginWithGIS: (idToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      const authenticatedUser = await verifyGoogleToken(idToken);
      setUser(authenticatedUser);
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      throw error; // Re-throw the error so the component can handle it
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setIsLoggingOut(true);
    apiLogout()
      .then(() => {
        setUser(null);
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
      logout,
      loginWithGIS,
    }),
    [user, loading, isLoggingOut]
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
