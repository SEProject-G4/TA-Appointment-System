import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosConfig'
import { FaChevronRight, FaUserGraduate, FaClipboardList } from 'react-icons/fa'

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
  collapsible?: boolean;
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
  processingActions,
  collapsible = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const acceptedCount = appliedTAs.filter(ta => ta.status.toLowerCase() === 'accepted').length;
  const pendingCount = appliedTAs.filter(ta => ta.status.toLowerCase() === 'pending').length;
  const progress = Math.min((acceptedCount / totalRequiredTAs) * 100, 100);

  return (
    <div className="flex w-full flex-col items-center outline-dashed outline-1 rounded-md p-4 bg-bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-row w-full items-center">
        {collapsible ? (
          <FaChevronRight
            className={`p-1 h-6 w-6 rounded-full hover:bg-primary/10 text-text-secondary cursor-pointer transition-transform ease-in-out duration-100 ${
              isExpanded ? "rotate-90" : ""
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        ) : (
          <span className="w-6" />
        )}
        <div className="flex flex-1 flex-col ml-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-text-primary">{moduleCode}</h3>
            <span className="bg-primary/10 text-primary-dark text-xs px-2 py-1 rounded-full font-medium">
              {semester} {year}
            </span>
          </div>
          <p className="text-text-primary text-sm">{moduleName}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-text-secondary">Progress</div>
            <div className="text-lg font-semibold text-text-primary">{acceptedCount}/{totalRequiredTAs}</div>
          </div>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-primary-dark h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      {!collapsible && (<div className="w-full h-px bg-border-default mt-2"></div>)}

      {collapsible ? (
        <div className={`panel ${isExpanded ? 'panel-open' : 'panel-closed'}`}>
          <div className="w-full space-y-3">
            {/* Summary Stats */}
            <div className="flex justify-between items-center bg-bg-page rounded-lg p-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FaUserGraduate className="text-primary-dark h-4 w-4" />
                  <span className="text-sm text-text-secondary">Total Applications:</span>
                  <span className="font-semibold text-text-primary">{appliedTAs.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaClipboardList className="text-primary-dark h-4 w-4" />
                  <span className="text-sm text-text-secondary">Pending:</span>
                  <span className="font-semibold text-text-primary">{pendingCount}</span>
                </div>
        </div>
      </div>

            {/* Applications List */}
          {appliedTAs.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <FaUserGraduate className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No applications yet for this module.</p>
              </div>
          ) : (
              <div className="space-y-2">
                {appliedTAs.map((ta, idx) => {
              const isActionDisabled = ['accepted', 'rejected'].includes(ta.status.toLowerCase());
                  const isProcessing = processingActions.has(ta.applicationId);
                  const isPending = ta.status.toLowerCase() === 'pending';
              return (
                    <div key={idx} className="flex items-center justify-between bg-bg-page rounded-lg p-3 border border-border-default">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-text-primary">{ta.name}</span>
                          <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                        </div>
                        <span className={`badge ${
                          ta.status.toLowerCase() === 'accepted' 
                            ? 'badge-accepted' 
                            : ta.status.toLowerCase() === 'rejected' 
                            ? 'badge-rejected' 
                            : 'badge-pending'
                        }`}>
                          {ta.status.toLowerCase() === 'accepted' ? 'Accepted' : ta.status.toLowerCase() === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                  </div>
                      {isPending && (
                        <div className="flex space-x-2">
                    <button
                            className={`btn btn-primary ${isActionDisabled || isProcessing ? 'btn-disabled' : ''}`}
                            onClick={() => onAccept(ta.applicationId, ta.name)}
                            title={isActionDisabled ? 'Already processed' : isProcessing ? 'Processing...' : 'Accept TA application'}
                            disabled={isActionDisabled || isProcessing}
                          >
                            {isProcessing ? <span>⏳</span> : <span className="text-xs">Accept</span>}
                    </button>
                    <button
                            className={`btn btn-outline ${isActionDisabled || isProcessing ? 'btn-disabled' : ''}`}
                            onClick={() => onReject(ta.applicationId, ta.name)}
                            title={isActionDisabled ? 'Already processed' : isProcessing ? 'Processing...' : 'Reject TA application'}
                            disabled={isActionDisabled || isProcessing}
                          >
                            {isProcessing ? <span>⏳</span> : <span className="text-xs">Reject</span>}
                    </button>
                  </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            </div>
          </div>
      ) : (
        <div className="w-full space-y-3 mt-4">
          <div className="flex justify-between items-center bg-bg-page rounded-lg p-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaUserGraduate className="text-primary-dark h-4 w-4" />
                <span className="text-sm text-text-secondary">Total Applications:</span>
                <span className="font-semibold text-text-primary">{appliedTAs.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaClipboardList className="text-primary-dark h-4 w-4" />
                <span className="text-sm text-text-secondary">Pending:</span>
                <span className="font-semibold text-text-primary">{pendingCount}</span>
        </div>
      </div>
          </div>

          {appliedTAs.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <FaUserGraduate className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No applications yet for this module.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appliedTAs.map((ta, idx) => {
                const isActionDisabled = ['accepted', 'rejected'].includes(ta.status.toLowerCase());
                const isProcessing = processingActions.has(ta.applicationId);
                const isPending = ta.status.toLowerCase() === 'pending';
                return (
                  <div key={idx} className="flex items-center justify-between bg-bg-page rounded-lg p-3 border border-border-default">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">{ta.name}</span>
                        <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                      </div>
                      <span className={`badge ${
                        ta.status.toLowerCase() === 'accepted' 
                          ? 'badge-accepted' 
                          : ta.status.toLowerCase() === 'rejected' 
                          ? 'badge-rejected' 
                          : 'badge-pending'
                      }`}>
                        {ta.status.toLowerCase() === 'accepted' ? 'Accepted' : ta.status.toLowerCase() === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                    {isPending && (
                      <div className="flex space-x-2">
                        <button
                          className={`btn btn-primary ${isActionDisabled || isProcessing ? 'btn-disabled' : ''}`}
                          onClick={() => onAccept(ta.applicationId, ta.name)}
                          title={isActionDisabled ? 'Already processed' : isProcessing ? 'Processing...' : 'Accept TA application'}
                          disabled={isActionDisabled || isProcessing}
                        >
                          {isProcessing ? <span>⏳</span> : <span className="text-xs">Accept</span>}
                        </button>
                        <button
                          className={`btn btn-outline ${isActionDisabled || isProcessing ? 'btn-disabled' : ''}`}
                          onClick={() => onReject(ta.applicationId, ta.name)}
                          title={isActionDisabled ? 'Already processed' : isProcessing ? 'Processing...' : 'Reject TA application'}
                          disabled={isActionDisabled || isProcessing}
                        >
                          {isProcessing ? <span>⏳</span> : <span className="text-xs">Reject</span>}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const HandleTARequests = () => {
  const [modules, setModules] = useState<ModuleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  // Fetch TA applications from backend
  const fetchTAApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get('/lecturer/handle-requests');
      const modulesResponse = response.data.modules || [];

      const mapped: ModuleGroup[] = modulesResponse.map((m: any) => ({
        moduleCode: m.moduleCode,
        moduleName: m.moduleName,
        semester: m.semester,
        year: m.year,
        totalRequiredTAs: m.requiredTACount || 5,
        appliedTAs: (m.applications || []).map((a: any) => ({
          name: a.studentName,
          status: a.status,
          applicationId: a.applicationId,
          indexNumber: a.indexNumber
        }))
      }));

      setModules(mapped);
    } catch (err: any) {
      console.error('Error fetching TA applications:', err);
      setError(err.response?.data?.error || 'Failed to fetch TA applications');
    } finally {
      setLoading(false);
    }
  };

  // Handle accept TA application
  const handleAccept = async (applicationId: string, studentName: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to accept ${studentName} as a TA?\n\nThis action cannot be undone.`
    );
    if (!isConfirmed) return;

    try {
      setProcessingActions(prev => new Set(prev).add(applicationId));
      await axiosInstance.patch(`/lecturer/applications/${applicationId}/accept`);
      alert(`Successfully accepted ${studentName} as a TA!`);
      fetchTAApplications();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Unknown error occurred';
      alert(`Failed to accept ${studentName}: ${errorMessage}`);
    } finally {
      setProcessingActions(prev => { const s = new Set(prev); s.delete(applicationId); return s; });
    }
  };

  // Handle reject TA application
  const handleReject = async (applicationId: string, studentName: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to reject ${studentName}'s TA application?\n\nThis action cannot be undone.`
    );
    if (!isConfirmed) return;

    try {
      setProcessingActions(prev => new Set(prev).add(applicationId));
      await axiosInstance.patch(`/lecturer/applications/${applicationId}/reject`);
      alert(`Successfully rejected ${studentName}'s TA application.`);
      fetchTAApplications();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Unknown error occurred';
      alert(`Failed to reject ${studentName}: ${errorMessage}`);
    } finally {
      setProcessingActions(prev => { const s = new Set(prev); s.delete(applicationId); return s; });
    }
  };

  useEffect(() => { fetchTAApplications(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
        <div className="flex items-center justify-center w-full h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="text-text-primary">Loading TA applications...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
        <div className="bg-error/10 border border-error/20 rounded-lg p-6 w-full">
          <h3 className="text-error font-semibold mb-2">Error Loading Applications</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <button 
            onClick={fetchTAApplications}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
        <div className="text-center w-full py-16">
          <FaUserGraduate className="h-16 w-16 mx-auto mb-4 text-text-secondary opacity-50" />
          <h3 className="text-text-primary text-xl font-semibold mb-2">No TA Applications</h3>
          <p className="text-text-secondary">There are no TA applications for your modules at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
      <div className="mb-8 w-full flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-montserrat mb-2">Handle TA Requests</h1>
          <p className="text-text-secondary font-raleway">Review and manage TA applications for your modules</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('list')}>List view</button>
          <button className={`btn ${viewMode === 'card' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('card')}>Card view</button>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <div className="flex bg-bg-card flex-col items-center rounded-sm p-2 w-full">
          <div className="w-full space-y-4">
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
      ) : (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              collapsible={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HandleTARequests
