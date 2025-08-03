import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null; // Or render a public-facing navbar
  }

  return (
    <nav className="bg-bg-header shadow-sm border-b border-border-default p-4 flex justify-between items-center">
      <div className="text-xl font-bold text-text-primary">TA Appointment System</div>
      <div className="flex items-center space-x-4">
        {user && (
          <span className="text-text-secondary">Welcome, {user.name} ({user.email})</span>
        )}
        <button
          onClick={logout}
          className="bg-error/10 text-error hover:bg-error/20 font-semibold py-2 px-4 rounded-md transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;