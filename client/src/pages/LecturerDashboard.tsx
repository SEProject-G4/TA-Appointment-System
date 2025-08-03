import React from 'react';


const LecturerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page text-text-primary p-4">
      <div className="w-full max-w-2xl p-8 rounded-2xl shadow-xl bg-bg-card border border-border-default">
        <h1 className="text-3xl font-bold text-center mb-4">Lecturer Dashboard</h1>
        <p className="text-center text-text-secondary mb-8">
          Welcome to the Lecturer Dashboard. Here you can manage your TA appointments and view relevant information.
        </p>
        {/* Additional content for the lecturer dashboard can be added here */}
      </div>
    </div>
  );
}

export default LecturerDashboard;