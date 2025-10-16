import { useState, useEffect } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { FaUserGraduate } from 'react-icons/fa'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import HandleTaRequestsCard from '../../components/lecturer/HandleTaRequestsCard'
import { ChevronDown, RefreshCw } from 'lucide-react'

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'accept' | 'reject';
    applicationId: string;
    studentName: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
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
    if (isProcessing) return; // Prevent closing while processing
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const confirmSubmission = async () => {
    if (!pendingAction || isProcessing) return;
    const { type, applicationId, studentName } = pendingAction;

    try {
      setIsProcessing(true);
      setProcessingActions(prev => new Set(prev).add(applicationId));
      
      // Optimistically update local state before API call
      const newStatus = type === 'accept' ? 'accepted' : 'rejected';
      setModules(prevModules => 
        prevModules.map(module => ({
          ...module,
          appliedTAs: module.appliedTAs.map(ta => 
            ta.applicationId === applicationId 
              ? { ...ta, status: newStatus }
              : ta
          )
        }))
      );
      
      if (type === 'accept') {
        await axiosInstance.patch(`/lecturer/applications/${applicationId}/accept`);
      } else {
        await axiosInstance.patch(`/lecturer/applications/${applicationId}/reject`);
      }
      
      setShowConfirmModal(false);
      setPendingAction(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Unknown error occurred';
      alert(`Failed to ${type} ${studentName}: ${errorMessage}`);
      // Revert optimistic update on error
      await fetchTAApplications();
      setShowConfirmModal(false);
      setPendingAction(null);
    } finally {
      setIsProcessing(false);
      setProcessingActions(prev => { const s = new Set(prev); s.delete(applicationId); return s; });
    }
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    let sortedModules = [...modules];

    if (option === "name") {
      sortedModules.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
    } else if (option === "code") {
      sortedModules.sort((a, b) => a.moduleCode.localeCompare(b.moduleCode));
    } else if (option === "semester") {
      sortedModules.sort((a, b) => parseInt(a.semester) - parseInt(b.semester));
    } else if (option === "applications") {
      sortedModules.sort((a, b) => b.appliedTAs.length - a.appliedTAs.length);
    }

    setModules(sortedModules);
  };

  const filteredModules = modules.filter((mod) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const code = mod.moduleCode?.toLowerCase() || "";
    const name = mod.moduleName?.toLowerCase() || "";

    return code.includes(query) || name.includes(query);
  });

  useEffect(() => { fetchTAApplications(); }, [refreshKey]);

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
    <div className="min-h-screen bg-bg-page text-text-primary">
      {/* Page Header */}
      <div className="px-10 py-6 pb-5">
        <div className="flex items-center gap-3 mb-0">
          <h1 className="text-2xl font-bold text-text-primary">Handle TA Requests</h1>
          <button
            className="p-2 text-sm font-medium border rounded-lg bg-bg-card text-text-primary hover:bg-primary-light/20 focus:outline-none focus:ring-2 focus:ring-primary-dark"
            onClick={() => setRefreshKey((prev) => prev + 1)}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Card */}
      <div className="gap-2 p-4 sm:p-6 ml-1 sm:ml-2 mr-4 mt-0 rounded-xl shadow-sm bg-bg-card border border-border-default">
        {/* Controls section */}
        <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-start">
          <div className="flex flex-col items-stretch w-full gap-3 sm:flex-row sm:items-center lg:w-auto">
            {/* Search input */}
            <input
              type="text"
              placeholder="Search modules"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-dark bg-bg-card text-text-primary placeholder:text-text-secondary"
            />

            {/* Sorting modules */}
            <div className="flex flex-col w-full gap-3 sm:flex-row sm:w-auto">
              <div className="relative inline-flex w-full overflow-hidden border rounded-lg shadow-sm border-border-default bg-bg-card group sm:w-auto">
                <select
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-4 py-2 pr-10 text-sm font-medium bg-transparent appearance-none cursor-pointer sm:w-auto text-text-secondary hover:bg-primary-light/20 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-dark"
                >
                  <option value="">Sort By</option>
                  <option value="name">Module Name (A–Z)</option>
                  <option value="code">Module Code (A–Z)</option>
                  <option value="semester">Semester (Low → High)</option>
                  <option value="applications">Applications (High → Low)</option>
                </select>

                <div className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 text-text-secondary group-hover:text-text-primary">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredModules.length > 0 ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredModules.map((m, idx) => (
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
        ) : (
          <div className="py-8 text-center sm:py-12">
            <p className="text-base sm:text-lg text-text-secondary">
              No modules found matching your search.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmModal}
        title={`Confirm ${pendingAction?.type === 'accept' ? 'Acceptance' : 'Rejection'}`}
        message={
          pendingAction?.type === 'accept'
            ? `Are you sure you want to accept ${pendingAction?.studentName} as a TA? This action cannot be undone and will update the application status.`
            : `Are you sure you want to reject ${pendingAction?.studentName}'s TA application? This action cannot be undone and will update the application status.`
        }
        onConfirm={confirmSubmission}
        onCancel={cancelSubmission}
        confirmButtonText={isProcessing ? 'Processing...' : (pendingAction?.type === 'accept' ? 'Accept' : 'Reject')}
        cancelButtonText="Cancel"
        confirmButtonClassName="px-4 py-2 font-medium text-white bg-gray-700 rounded-lg shadow-sm hover:bg-gray-800 transition disabled:opacity-70 disabled:cursor-not-allowed"
        cancelButtonClassName="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default HandleTARequests
