import { useState, useEffect } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { FaUserGraduate } from 'react-icons/fa'
import HandleTaRequestsCard from '../../components/lecturer/HandleTaRequestsCard'

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
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
        <div className="flex items-center justify-center w-full h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="text-text-primary text-sm sm:text-base">Loading TA applications...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 sm:p-6 w-full">
          <h3 className="text-error font-semibold mb-2 text-sm sm:text-base">Error Loading Applications</h3>
          <p className="text-text-secondary mb-4 text-xs sm:text-sm">{error}</p>
          <button 
            onClick={fetchTAApplications}
            className="btn btn-primary text-xs sm:text-sm px-3 py-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
        <div className="text-center w-full py-16">
          <FaUserGraduate className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-text-secondary opacity-50" />
          <h3 className="text-text-primary text-lg sm:text-xl font-semibold mb-2">No TA Applications</h3>
          <p className="text-text-secondary text-sm sm:text-base">There are no TA applications for your modules at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
      <div className="mb-6 sm:mb-8 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-montserrat mb-2">Handle TA Requests</h1>
          <p className="text-text-secondary font-raleway text-sm sm:text-base">Review and manage TA applications for your modules</p>
        </div>
        <div className="flex items-center space-x-2" />
      </div>
      
      {
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {modules.map((m, idx) => (
            <HandleTaRequestsCard
              key={`${m.moduleCode}-${idx}`}
              moduleCode={m.moduleCode}
              moduleName={m.moduleName}
              semester={m.semester}
              year={m.year}             
              requiredUndergraduateTAs={m.requiredUndergraduateTAs}
              requiredPostgraduateTAs={m.requiredPostgraduateTAs}
              appliedTAs={m.appliedTAs}
              onAccept={(id: string, name: string) => openConfirm('accept', id, name)}
              onReject={(id: string, name: string) => openConfirm('reject', id, name)}
              processingActions={processingActions}
              collapsible={false}
            />
          ))}
        </div>
      }

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-warning" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Confirm {pendingAction?.type === 'accept' ? 'Acceptance' : 'Rejection'}</h3>
                <p className="text-xs sm:text-sm text-gray-600">Final confirmation required</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                {pendingAction?.type === 'accept'
                  ? `Are you sure you want to accept ${pendingAction?.studentName} as a TA? `
                  : `Are you sure you want to reject ${pendingAction?.studentName}'s TA application? `}
                <span className="font-semibold text-warning">This action cannot be undone</span> and will update the application status.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={cancelSubmission} className="btn btn-outline flex-1 text-sm sm:text-base">Cancel</button>
              <button
                onClick={confirmSubmission}
                disabled={pendingAction ? processingActions.has(pendingAction.applicationId) : false}
                className={`btn btn-primary flex-1 text-sm sm:text-base ${pendingAction && processingActions.has(pendingAction.applicationId) ? 'btn-disabled' : ''}`}
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
