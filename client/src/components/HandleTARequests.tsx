import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosConfig'

interface TAApplication {
  applicationId: string;
  userId: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  requiredTACount: number;
  status: string;
  studentName: string;
  indexNumber: string;
  appliedAt: string;
}

interface ModuleGroup {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  totalRequiredTAs: number;
  appliedTAs: { name: string; status: string; applicationId: string; indexNumber: string }[];
}

interface TARequestCardProps {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  appliedTAs: { name: string; status: string; applicationId: string; indexNumber: string }[];
  totalRequiredTAs: number;
  onAccept: (applicationId: string, studentName: string) => void;
  onReject: (applicationId: string, studentName: string) => void;
  processingActions: Set<string>;
}

const TARequestCard: React.FC<TARequestCardProps> = ({
  moduleCode,
  moduleName,
  semester,
  year,
  appliedTAs,
  totalRequiredTAs,
  onAccept,
  onReject,
  processingActions
}) => {
  const acceptedCount = appliedTAs.filter(ta => ta.status.toLowerCase() === 'accepted').length;
  const progress = Math.min((acceptedCount / totalRequiredTAs) * 100, 100);

  return (
    <div className="w-full bg-bg-card rounded-xl shadow-lg overflow-visible border border-border-default mb-6">
      <div className="bg-gradient-to-r from-primary-dark to-primary px-6 py-4 flex items-center justify-between rounded-t-xl">
        <div>
          <div className="flex items-center space-x-4">
            <h2 className="text-text-inverted font-bold text-lg">{moduleCode}</h2>
            <span className="bg-bg-card bg-opacity-20 text-text-inverted text-xs px-2 py-1 rounded-full">
              {semester} {year}
            </span>
          </div>
          <p className="text-text-inverted font-bold text-m mt-1">{moduleName}</p>
        </div>
      </div>
      <div className="px-6 py-4">
        <h3 className="text-xs text-text-primary uppercase tracking-wide mb-2">Applied TAs</h3>
        <ul className="divide-y divide-border-default">
          {appliedTAs.length === 0 ? (
            <li className="py-2 text-text-secondary text-sm">No applications yet.</li>
          ) : (
                         appliedTAs.map((ta, idx) => {
               const isActionDisabled = ['accepted', 'rejected'].includes(ta.status.toLowerCase());
               const isProcessing = processingActions.has(ta.applicationId);
               return (
                <li key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center min-w-0 flex-1 space-x-3">
                    <div className="flex flex-col">
                      <span className="text-text-primary font-medium truncate max-w-[120px]">{ta.name}</span>
                      <span className="text-text-secondary text-xs">{ta.indexNumber}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ta.status.toLowerCase() === 'accepted' ? 'bg-success/10 text-success' : ta.status.toLowerCase() === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>{ta.status}</span>
                  </div>
                  <div className="flex space-x-2 ml-4">
                                         <button
                       className={`bg-success text-text-inverted text-xs px-2 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-success/40 ${isActionDisabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-success/90'}`}
                       onClick={() => onAccept(ta.applicationId, ta.name)}
                       title={isActionDisabled ? 'Already processed' : isProcessing ? 'Processing...' : 'Accept TA application'}
                       disabled={isActionDisabled || isProcessing}
                     >
                       {isProcessing ? '⏳' : '✓'}
                     </button>
                     <button
                       className={`bg-warning text-text-inverted text-xs px-2 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-error/40 ${isActionDisabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-warning/90'}`}
                       onClick={() => onReject(ta.applicationId, ta.name)}
                       title={isActionDisabled ? 'Already processed' : isProcessing ? 'Processing...' : 'Reject TA application'}
                       disabled={isActionDisabled || isProcessing}
                     >
                       {isProcessing ? '⏳' : '✕'}
                     </button>
                  </div>
                </li>
              )
            })
          )}
        </ul>
        {/* Progress Bar Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-primary font-medium">Accepted TAs</span>
            <span className="text-xs text-text-primary font-semibold">{acceptedCount}/{totalRequiredTAs}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Loading shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const HandleTARequests = () => {
  const [modules, setModules] = useState<ModuleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());

  // Fetch TA applications from backend
  const fetchTAApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get('/lecturer/handle-requests');
      const applications: TAApplication[] = response.data.applications;
      
      // Group applications by module
      const moduleGroups: { [key: string]: ModuleGroup } = {};
      
      applications.forEach(app => {
        if (!moduleGroups[app.moduleCode]) {
          moduleGroups[app.moduleCode] = {
            moduleCode: app.moduleCode,
            moduleName: app.moduleName,
            semester: app.semester,
            year: app.year,
            totalRequiredTAs: app.requiredTACount || 5,
            appliedTAs: []
          };
        }
        
        moduleGroups[app.moduleCode].appliedTAs.push({
          name: app.studentName,
          status: app.status,
          applicationId: app.applicationId,
          indexNumber: app.indexNumber
        });
      });
      
      setModules(Object.values(moduleGroups));
    } catch (err: any) {
      console.error('Error fetching TA applications:', err);
      setError(err.response?.data?.error || 'Failed to fetch TA applications');
    } finally {
      setLoading(false);
    }
  };

  // Handle accept TA application
  const handleAccept = async (applicationId: string, studentName: string) => {
    // Show confirmation prompt
    const isConfirmed = window.confirm(
      `Are you sure you want to accept ${studentName} as a TA?\n\nThis action cannot be undone.`
    );
    
    if (!isConfirmed) {
      return; // User cancelled the action
    }

    try {
      setProcessingActions(prev => new Set(prev).add(applicationId));
      const response = await axiosInstance.patch(`/lecturer/applications/${applicationId}/accept`);
      console.log('Application accepted:', response.data);
      alert(`Successfully accepted ${studentName} as a TA!`);
      // Refresh the data
      fetchTAApplications();
    } catch (err: any) {
      console.error('Error accepting application:', err);
      const errorMessage = err.response?.data?.error || 'Unknown error occurred';
      alert(`Failed to accept ${studentName}: ${errorMessage}`);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  // Handle reject TA application
  const handleReject = async (applicationId: string, studentName: string) => {
    // Show confirmation prompt
    const isConfirmed = window.confirm(
      `Are you sure you want to reject ${studentName}'s TA application?\n\nThis action cannot be undone.`
    );
    
    if (!isConfirmed) {
      return; // User cancelled the action
    }

    try {
      setProcessingActions(prev => new Set(prev).add(applicationId));
      const response = await axiosInstance.patch(`/lecturer/applications/${applicationId}/reject`);
      console.log('Application rejected:', response.data);
      alert(`Successfully rejected ${studentName}'s TA application.`);
      // Refresh the data
      fetchTAApplications();
    } catch (err: any) {
      console.error('Error rejecting application:', err);
      const errorMessage = err.response?.data?.error || 'Unknown error occurred';
      alert(`Failed to reject ${studentName}: ${errorMessage}`);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchTAApplications();
  }, []);

  if (loading) {
    return (
      <div className="mt-20 py-8 px-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-text-primary">Loading TA applications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 py-8 px-4">
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <h3 className="text-error font-semibold mb-2">Error Loading Applications</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <button 
            onClick={fetchTAApplications}
            className="bg-primary text-text-inverted px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="mt-20 py-8 px-4">
        <div className="text-center">
          <h3 className="text-text-primary text-lg font-semibold mb-2">No TA Applications</h3>
          <p className="text-text-secondary">There are no TA applications for your modules at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Handle TA Requests</h1>
        <p className="text-text-secondary">Review and manage TA applications for your modules</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {modules.map((m, idx) => (
           <TARequestCard
             key={`${m.moduleCode}-${idx}`}
             moduleCode={m.moduleCode}
             moduleName={m.moduleName}
             semester={m.semester}
             year={m.year}
             totalRequiredTAs={m.totalRequiredTAs}
             appliedTAs={m.appliedTAs}
             onAccept={handleAccept}
             onReject={handleReject}
             processingActions={processingActions}
           />
         ))}
      </div>
    </div>
  )
}

export default HandleTARequests
