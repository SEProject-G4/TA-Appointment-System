import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosConfig";
import { FaTimes, FaUserGraduate } from "react-icons/fa";
import ViewModuleDetailsCard from "../../components/lecturer/ViewModuleDetailsCard";
import { GraduationCap, ChevronDown, RefreshCw } from "lucide-react";

interface AcceptedTA { userId: string; name: string; indexNumber: string; documents?: any; docStatus?: 'pending' | 'submitted'; role?: 'undergraduate' | 'postgraduate' }
interface ModuleWithAccepted {
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  requiredTAHours: number;
  requiredTACount: number;
  acceptedTAs: AcceptedTA[];
}

const ViewModuleDetails: React.FC = () => {
  // card view only
  const [modules, setModules] = useState<ModuleWithAccepted[]>([]);
  const [docModal, setDocModal] = useState<{ open: boolean; ta?: AcceptedTA }>()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTabByModule, setActiveTabByModule] = useState<Record<string, 'undergraduate' | 'postgraduate'>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  // list view removed

  const fetchAcceptedModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/lecturer/modules/with-ta-requests');
      setModules(res.data.modules || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load accepted modules');
    } finally {
      setLoading(false);
    }
  }

  const handleSortChange = (option: string) => {
    setSortOption(option);
    let sortedModules = [...modules];

    if (option === "name") {
      sortedModules.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
    } else if (option === "code") {
      sortedModules.sort((a, b) => a.moduleCode.localeCompare(b.moduleCode));
    } else if (option === "semester") {
      sortedModules.sort((a, b) => parseInt(a.semester) - parseInt(b.semester));
    } else if (option === "accepted") {
      sortedModules.sort((a, b) => b.acceptedTAs.length - a.acceptedTAs.length);
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

  useEffect(() => { fetchAcceptedModules(); }, [refreshKey]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
        <div className="flex items-center justify-center w-full h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 sm:p-6 w-full">
          <h3 className="text-error font-semibold mb-2 text-sm sm:text-base">Error</h3>
          <p className="text-text-secondary mb-4 text-xs sm:text-sm">{error}</p>
          <button className="btn btn-primary text-xs sm:text-sm px-3 py-2" onClick={fetchAcceptedModules}>Try again</button>
        </div>
      </div>
    );
  }

  // Removed hasMissingDocs; visibility is based on docStatus

  const openDocModal = (ta: AcceptedTA) => setDocModal({ open: true, ta });
  const closeDocModal = () => setDocModal({ open: false });

  const renderDocRow = (label: string, doc?: any) => {
    if (!doc) return null;
    
    const toDriveDownloadUrl = (url?: string) => {
      if (!url) return '';
      try {
        // Patterns: 
        // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
        // - https://drive.google.com/open?id=FILE_ID
        // - https://drive.google.com/uc?id=FILE_ID&export=download
        const fileIdMatch = url.match(/\/d\/([^/]+)\//) || url.match(/[?&]id=([^&]+)/);
        const fileId = fileIdMatch ? fileIdMatch[1] : '';
        return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : url;
      } catch {
        return url;
      }
    };

    const hasAnyUrl = Boolean(doc.fileUrl);
    const downloadUrl = toDriveDownloadUrl(doc.fileUrl);

    return (
      <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded border border-border-default">
        <span className="text-xs sm:text-sm font-medium text-text-primary truncate">{label}</span>
        <div className="flex items-center gap-1 sm:gap-2">
          {hasAnyUrl ? (
            <>
              <button 
                onClick={() => window.open(doc.fileUrl, "_blank")} 
                className="btn btn-primary btn-xs text-xs px-2 py-1"
              >
                View
              </button>
              <a 
                href={downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-outline btn-xs text-xs px-2 py-1"
              >
                Download
              </a>
            </>
          ) : (
            <span className="text-xs text-text-secondary">No file uploaded</span>
          )}
        </div>
      </div>
    );
  };


  const renderDocModal = () => {
    if (!docModal?.open || !docModal.ta) return null;
    const ta = docModal.ta;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={closeDocModal}></div>
        <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border-default bg-bg-card">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center">
                <FaUserGraduate className="text-sm sm:text-base" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-semibold text-text-primary truncate">{ta.name}</span>
                <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
              </div>
            </div>
            <button aria-label="Close" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md border border-border-default hover:bg-bg-page text-text-secondary flex items-center justify-center" onClick={closeDocModal}>
              <FaTimes className="text-sm" />
            </button>
          </div>
          <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto space-y-2 bg-white">
            {renderDocRow('Bank Passbook Copy', ta.documents?.bankPassbookCopy)}
            {renderDocRow('NIC Copy', ta.documents?.nicCopy)}
            {renderDocRow('CV', ta.documents?.cv)}
            {renderDocRow('Degree Certificate', ta.documents?.degreeCertificate)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 sm:px-4 bg-bg-page text-text-primary">
      <div className="container px-2 py-4 mx-auto sm:px-4 sm:py-8">
        {/* header */}
        <div className="mb-8 text-center sm:mb-12">
          <div className="flex flex-col items-center justify-center gap-2 mb-4 sm:flex-row sm:gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center sm:text-3xl lg:text-4xl">
              View Module Details
            </h1>
          </div>
        </div>
      </div>

      <div className="gap-2 p-4 m-2 rounded-lg sm:p-6 lg:p-8 sm:m-4 lg:m-8 bg-bg-card">
        <div className="gap-2">
          {/* Header - Module Overview */}
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <h2 className="text-xl font-semibold sm:text-2xl text-foreground">
                Module Overview
              </h2>
              {/* Refresh button */}
              <div>
                <button
                  className="p-2 text-sm font-medium border rounded-lg bg-bg-card text-text-primary hover:bg-primary-light/20 focus:outline-none focus:ring-2 focus:ring-primary-dark"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Controls section */}
            <div className="flex flex-col items-stretch w-full gap-3 sm:flex-row sm:items-center lg:w-auto">
              {/* Search input */}
              <input
                type="text"
                placeholder="Search modules..."
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
                    <option value="accepted">Accepted TAs (High → Low)</option>
                  </select>

                  <div className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 text-text-secondary group-hover:text-text-primary">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
            {filteredModules.map((module, moduleIndex) => (
              <ViewModuleDetailsCard
                key={moduleIndex}
                module={module}
                moduleIndex={moduleIndex}
                activeTabByModule={activeTabByModule}
                onTabChange={(moduleId, tab) => setActiveTabByModule(prev => ({ ...prev, [moduleId]: tab }))}
                onViewDocuments={openDocModal}
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

      {renderDocModal()}
    </div>
  );
};

export default ViewModuleDetails;
