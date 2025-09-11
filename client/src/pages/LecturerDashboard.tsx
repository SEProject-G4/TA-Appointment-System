import React, { useState } from 'react';
import Navbar from '../components/common/Navbar';
import ViewModuleDetails from '../components/ViewModuleDetails';
import EditModuleDetails from '../components/EditModuleDetails';
import HandleTARequests from '../components/HandleTARequests';

const LecturerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'requests'>('view');

  const tabs = [
    { id: 'view', label: 'View Module Details' },
    { id: 'edit', label: 'Edit Module Details' },
    { id: 'requests', label: 'Handle TA Requests' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'view':
        return (
          <div className="space-y-5">
            <ViewModuleDetails />
          </div>
        );
      case 'edit':
        return (
          <div className="space-y-5"> 
            <EditModuleDetails />
          </div>
        );
      case 'requests':
        return (
          <div className="space-y-5">
            <HandleTARequests />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <Navbar />
      <div className="p-4 pt-8">
        <div className="w-full">          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-bg-card rounded-lg p-1 mb-6 border border-border-default max-w-4xl mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'view' | 'edit' | 'requests')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-dark text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-page'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-bg-card rounded-2xl shadow-xl border border-border-default p-6 w-full">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LecturerDashboard;