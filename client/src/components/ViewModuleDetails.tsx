import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosConfig";
import { FaChevronRight } from "react-icons/fa";

interface ApprovedTA { userId: string; name: string; indexNumber: string; documents?: any; docStatus?: 'pending' | 'submitted' }
interface ModuleWithApproved {
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  requiredTAHours: number;
  requiredTACount: number;
  approvedTAs: ApprovedTA[];
}

const ViewModuleDetails: React.FC = () => {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [modules, setModules] = useState<ModuleWithApproved[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleModuleExpansion = (moduleIndex: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleIndex)) {
      newExpanded.delete(moduleIndex);
    } else {
      newExpanded.add(moduleIndex);
    }
    setExpandedModules(newExpanded);
  };

  const fetchApprovedModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/lecturer/modules/with-ta-requests');
      setModules(res.data.modules || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load approved modules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchApprovedModules(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
        <div className="flex items-center justify-center w-full h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
        <div className="bg-error/10 border border-error/20 rounded-lg p-6 w-full">
          <h3 className="text-error font-semibold mb-2">Error</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchApprovedModules}>Try again</button>
        </div>
      </div>
    );
  }

  // Removed hasMissingDocs; visibility is based on docStatus

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
      <div className="flex items-center justify-between p-2 bg-white rounded border border-border-default">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <div className="flex items-center gap-2">
          {hasAnyUrl ? (
            <>
              <button 
                onClick={() => window.open(doc.fileUrl, "_blank")} 
                className="btn btn-primary btn-xs"
              >
                View
              </button>
              <a 
                href={downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-outline btn-xs"
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

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
      <div className="mb-8 w-full flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-montserrat mb-2">View Module Details</h1>
          <p className="text-text-secondary font-raleway">Overview of assigned modules and teaching assistant status</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setViewMode('list')}
          >
            List view
          </button>
          <button 
            className={`btn ${viewMode === 'card' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setViewMode('card')}
          >
            Card view
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="flex bg-bg-card flex-col items-center rounded-sm p-2 w-full">
          <div className="w-full space-y-4">
            {modules.map((module, moduleIndex) => {
              const isOpen = expandedModules.has(moduleIndex);
              return (
                <div key={moduleIndex} 
                  className="flex w-full flex-col items-center outline-dashed outline-1 rounded-md p-0 bg-bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Module Header */}
                  <div className="flex w-full items-center justify-between px-4 py-3">
                    <div className="flex items-center">
                      <FaChevronRight
                        className={`p-1 h-6 w-6 rounded-full hover:bg-primary/10 text-text-secondary cursor-pointer transition-transform ease-in-out duration-100 ${isOpen ? 'rotate-90' : ''}`}
                        onClick={() => toggleModuleExpansion(moduleIndex)}
                      />
                      <div className="flex flex-col ml-3">
                        <div className="flex items-center space-x-3">
                          <h2 className="text-text-primary font-semibold text-base">{module.moduleCode}</h2>
                          <span className="bg-primary/10 text-primary-dark text-xs px-2 py-1 rounded-full font-medium">
                            {module.semester} {module.year}
                          </span>
                        </div>
                        <p className="text-text-primary text-sm mt-1">{module.moduleName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xs text-text-secondary">TA Hours</div>
                        <div className="text-sm font-semibold text-text-primary">{module.requiredTAHours}h</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-text-secondary">Approved TAs</div>
                        <div className="text-sm font-semibold text-text-primary">{module.approvedTAs.length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-border-default"></div>

                  {/* Expanded Content */}
                  <div className={`panel w-full ${isOpen ? 'panel-open' : 'panel-closed'} p-4 space-y-4`}>
                    <div className="space-y-3">
                      {module.approvedTAs.map((ta, taIndex) => (
                        <div key={taIndex} className="bg-bg-page rounded-lg border border-border-default p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex flex-col">
                                <span className="font-medium text-text-primary">{ta.name}</span>
                                <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                              </div>
                            </div>
                            {ta.docStatus !== 'submitted' ? (
                              <span className="badge badge-pending">Not submitted</span>
                            ) : (
                              <details>
                                <summary className="btn btn-outline btn-xs">View more</summary>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  {renderDocRow('Bank Passbook Copy', ta.documents?.bankPassbookCopy)}
                                  {renderDocRow('NIC Copy', ta.documents?.nicCopy)}
                                  {renderDocRow('CV', ta.documents?.cv)}
                                  {renderDocRow('Degree Certificate', ta.documents?.degreeCertificate)}
                                </div>
                              </details>
                            )}
                          </div>
                          {/* Document Grid is shown inside details when submitted */}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Card View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {modules.map((module, moduleIndex) => (
            <div key={moduleIndex} 
              className="flex w-full flex-col items-center outline-dashed outline-1 rounded-md p-0 bg-bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex w-full items-center justify-between p-4 border-b border-border-default">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-text-primary font-semibold text-base">{module.moduleCode}</h2>
                    <span className="bg-primary/10 text-primary-dark text-xs px-2 py-1 rounded-full font-medium">
                      {module.semester} {module.year}
                    </span>
                  </div>
                  <p className="text-text-primary text-sm mt-1">{module.moduleName}</p>
                </div>
              </div>

              <div className="p-4 space-y-4 w-full">
                {/* Module Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-page rounded-lg p-3 border border-border-default">
                    <div className="text-xs text-text-secondary">TA Hours</div>
                    <div className="text-sm font-semibold text-text-primary">{module.requiredTAHours}h</div>
                  </div>
                  <div className="bg-bg-page rounded-lg p-3 border border-border-default">
                    <div className="text-xs text-text-secondary">Approved TAs</div>
                    <div className="text-sm font-semibold text-text-primary">{module.approvedTAs.length}</div>
                  </div>
                </div>

                {/* TA List */}
                <div className="space-y-3">
                  {module.approvedTAs.map((ta, taIndex) => (
                    <div key={taIndex} className="bg-bg-page rounded-lg border border-border-default p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-text-primary">{ta.name}</span>
                          <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                        </div>
                        {ta.docStatus !== 'submitted' ? (
                          <span className="badge badge-pending">Not submitted</span>
                        ) : (
                          <details>
                            <summary className="btn btn-outline btn-xs">View more</summary>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {renderDocRow('Bank Passbook Copy', ta.documents?.bankPassbookCopy)}
                              {renderDocRow('NIC Copy', ta.documents?.nicCopy)}
                              {renderDocRow('CV', ta.documents?.cv)}
                              {renderDocRow('Degree Certificate', ta.documents?.degreeCertificate)}
                            </div>
                          </details>
                        )}
                      </div>
                      {/* Document Grid is shown inside details when submitted */}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewModuleDetails;
