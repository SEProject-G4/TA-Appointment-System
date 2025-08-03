import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, logout as apiLogout } from "../api/authApi";
import type { User } from "../api/authApi";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for an existing session on initial load
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const isAuthenticated = !!user;

  const memoizedValue = React.useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      logout,
    }),
    [user, loading, isAuthenticated]
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
