import React, { useState, useEffect } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { FaChevronRight, FaUserGraduate, FaClipboardList } from 'react-icons/fa'

// removed unused TAApplication interface

interface ModuleGroup {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  requiredUndergraduateTAs?: number;
  requiredPostgraduateTAs?: number;
  appliedTAs: { name: string; status: string; applicationId: string; indexNumber: string; role?: 'undergraduate' | 'postgraduate' }[];
}

interface TARequestCardProps {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  appliedTAs: { name: string; status: string; applicationId: string; indexNumber: string; role?: 'undergraduate' | 'postgraduate' }[];
  requiredUndergraduateTAs?: number;
  requiredPostgraduateTAs?: number;
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
  requiredUndergraduateTAs,
  requiredPostgraduateTAs,
  onAccept,
  onReject,
  processingActions,
  collapsible = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'undergraduate' | 'postgraduate'>('undergraduate');
  // Overall counts kept for header metrics if needed later
  // const acceptedCount = appliedTAs.filter(ta => (ta.status || '').toLowerCase() === 'accepted').length;
  const pendingCount = appliedTAs.filter(ta => (ta.status || '').toLowerCase() === 'pending').length;

  const filteredTAs = appliedTAs.filter(ta => (ta.role || 'undergraduate') === activeTab);
  const acceptedInTab = filteredTAs.filter(ta => (ta.status || '').toLowerCase() === 'accepted').length;
  const appliedInTab = filteredTAs.length;
  const requiredForTab = activeTab === 'undergraduate' ? Number(requiredUndergraduateTAs ?? 0) : Number(requiredPostgraduateTAs ?? 0);
  const progress = Math.min(appliedInTab > 0 ? (acceptedInTab / appliedInTab) * 100 : 0, 100);

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
              Semester {semester} {year}
            </span>
          </div>
          <p className="text-text-primary text-sm">{moduleName}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-text-secondary">Progress</div>
            <div className="text-lg font-semibold text-text-primary">{acceptedInTab}/{appliedInTab}</div>
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

            {/* Tabs */}
            <div className="flex w-full border-b border-border-default">
              {(['undergraduate','postgraduate'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm font-medium ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
                >
                  {tab === 'undergraduate' ? 'Undergraduates' : 'Postgraduates'}
                </button>
              ))}
            </div>

            {/* Applications List */}
          {filteredTAs.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <FaUserGraduate className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No applications in this tab.</p>
              </div>
          ) : (
              <div className="space-y-2">
                {filteredTAs.map((ta, idx) => {
              const statusLower = (ta.status || '').toLowerCase();
              const isActionDisabled = ['accepted', 'rejected'].includes(statusLower);
                  const isProcessing = processingActions.has(ta.applicationId);
                  const isPending = statusLower === 'pending';
              return (
                    <div key={idx} className="flex items-center justify-between bg-bg-page rounded-lg p-3 border border-border-default">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-text-primary">{ta.name}</span>
                          <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                        </div>
                        <span className={`badge ${
                          statusLower === 'accepted' 
                            ? 'badge-accepted' 
                            : statusLower === 'rejected' 
                            ? 'badge-rejected' 
                            : 'badge-pending'
                        }`}>
                          {statusLower === 'accepted' ? 'Accepted' : statusLower === 'rejected' ? 'Rejected' : 'Pending'}
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
                <span className="font-semibold text-text-primary">{filteredTAs.filter(ta => (ta.status || '').toLowerCase() === 'pending').length}</span>
        </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex w-full border-b border-border-default">
            {(['undergraduate','postgraduate'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
              >
                {tab === 'undergraduate' ? 'Undergraduates' : 'Postgraduates'}
              </button>
            ))}
          </div>

          {filteredTAs.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <FaUserGraduate className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No applications yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTAs.map((ta, idx) => {
                const statusLower = (ta.status || '').toLowerCase();
                const isActionDisabled = ['accepted', 'rejected'].includes(statusLower);
                const isProcessing = processingActions.has(ta.applicationId);
                const isPending = statusLower === 'pending';
                return (
                  <div key={idx} className="flex items-center justify-between bg-bg-page rounded-lg p-3 border border-border-default">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">{ta.name}</span>
                        <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                      </div>
                      <span className={`badge ${
                        statusLower === 'accepted' 
                          ? 'badge-accepted' 
                          : statusLower === 'rejected' 
                          ? 'badge-rejected' 
                          : 'badge-pending'
                      }`}>
                        {statusLower === 'accepted' ? 'Accepted' : statusLower === 'rejected' ? 'Rejected' : 'Pending'}
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'accept' | 'reject';
    applicationId: string;
    studentName: string;
  } | null>(null);
  // card view only

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
        requiredUndergraduateTAs: m.requiredUndergraduateTACount || 0,
        requiredPostgraduateTAs: m.requiredPostgraduateTACount || 0,
        appliedTAs: (m.applications || []).map((a: any) => ({
          name: a.studentName,
          status: a.status,
          applicationId: a.applicationId,
          indexNumber: a.indexNumber,
          role: a.role
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

  // Open confirmation modal for accept/reject
  const openConfirm = (type: 'accept' | 'reject', applicationId: string, studentName: string) => {
    setPendingAction({ type, applicationId, studentName });
    setShowConfirmModal(true);
  };

  const cancelSubmission = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const confirmSubmission = async () => {
    if (!pendingAction) return;
    const { type, applicationId, studentName } = pendingAction;

    try {
      setProcessingActions(prev => new Set(prev).add(applicationId));
      if (type === 'accept') {
        await axiosInstance.patch(`/lecturer/applications/${applicationId}/accept`);
      } else {
        await axiosInstance.patch(`/lecturer/applications/${applicationId}/reject`);
      }
      setShowConfirmModal(false);
      setPendingAction(null);
      fetchTAApplications();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Unknown error occurred';
      alert(`Failed to ${type} ${studentName}: ${errorMessage}`);
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
        <div className="flex items-center space-x-2" />
      </div>
      
      {
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, idx) => (
            <TARequestCard
              key={`${m.moduleCode}-${idx}`}
              moduleCode={m.moduleCode}
              moduleName={m.moduleName}
              semester={m.semester}
              year={m.year}             
              requiredUndergraduateTAs={m.requiredUndergraduateTAs}
              requiredPostgraduateTAs={m.requiredPostgraduateTAs}
              appliedTAs={m.appliedTAs}
              onAccept={(id, name) => openConfirm('accept', id, name)}
              onReject={(id, name) => openConfirm('reject', id, name)}
              processingActions={processingActions}
              collapsible={false}
            />
          ))}
        </div>
      }

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-warning" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm {pendingAction?.type === 'accept' ? 'Acceptance' : 'Rejection'}</h3>
                <p className="text-sm text-gray-600">Final confirmation required</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                {pendingAction?.type === 'accept'
                  ? `Are you sure you want to accept ${pendingAction?.studentName} as a TA? `
                  : `Are you sure you want to reject ${pendingAction?.studentName}'s TA application? `}
                <span className="font-semibold text-warning">This action cannot be undone</span> and will update the application status.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={cancelSubmission} className="btn btn-outline flex-1">Cancel</button>
              <button
                onClick={confirmSubmission}
                disabled={pendingAction ? processingActions.has(pendingAction.applicationId) : false}
                className={`btn btn-primary flex-1 ${pendingAction && processingActions.has(pendingAction.applicationId) ? 'btn-disabled' : ''}`}
              >
                {pendingAction && processingActions.has(pendingAction.applicationId) ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HandleTARequests
