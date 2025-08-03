import React from 'react';


const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page text-text-primary p-4">
      <div className="w-full max-w-2xl p-8 rounded-2xl shadow-xl bg-bg-card border border-border-default">
        <h1 className="text-3xl font-bold text-center mb-4">Admin Dashboard</h1>
        <p className="text-center text-text-secondary mb-8">
          Welcome to the Admin Dashboard. Here you can manage users, view reports, and configure system settings.
        </p>
        {/* Additional content for the admin dashboard can be added here */}
      </div>
    </div>
  );
}

export default AdminDashboard;