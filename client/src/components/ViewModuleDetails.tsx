import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosConfig";
import { FaChevronRight, FaUserGraduate, FaClipboardList } from "react-icons/fa";

interface ApprovedTA { userId: string; name: string; indexNumber: string; documents?: any }
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

  // Helper to check if TA has any missing documents
  const hasMissingDocs = (documents?: any) => {
    if (!documents) return true;
    const requiredDocs = [
      documents.bankPassbookCopy,
      documents.nicCopy,
      documents.cv,
      documents.degreeCertificate,
    ];
    return requiredDocs.some(doc => !doc?.submitted);
  };

  const renderDocRow = (label: string, doc?: any) => {
    if (!doc?.submitted) return null;
    
    return (
      <div className="flex items-center justify-between p-2 bg-white rounded border border-border-default">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <button 
          onClick={() => doc?.fileUrl && window.open(doc.fileUrl, "_blank")} 
          className="btn btn-primary btn-xs"
        >
          View
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
      <div className="mb-8 w-full flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-montserrat mb-2">View Module Details</h1>
          <p className="text-text-secondary font-raleway">Overview of all assigned modules and teaching assistant status</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-white text-text-primary border border-border-default hover:bg-gray-50'
            }`}
          >
            List view
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'card'
                ? 'bg-primary text-white'
                : 'bg-white text-text-primary border border-border-default hover:bg-gray-50'
            }`}
          >
            Card view
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        // List View
        <div className="w-full space-y-4">
          {modules.map((module, moduleIndex) => {
            const isOpen = expandedModules.has(moduleIndex);
            return (
              <div key={moduleIndex} className="bg-white rounded-xl border border-border-default shadow-sm overflow-hidden">
                {/* Module Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleModuleExpansion(moduleIndex)}
                >
                  <div className="flex items-center space-x-4">
                    <FaChevronRight 
                      className={`h-5 w-5 text-text-secondary transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-bold text-text-primary">{module.moduleCode}</h2>
                        <span className="bg-primary/10 text-primary-dark text-xs px-3 py-1 rounded-full font-medium">
                          {module.semester} {module.year}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm mt-1">{module.moduleName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-xs text-text-secondary">TA Hours</div>
                      <div className="text-lg font-semibold text-text-primary">{module.requiredTAHours}h</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-secondary">Approved TAs</div>
                      <div className="text-lg font-semibold text-text-primary">{module.approvedTAs.length}</div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <div className={`panel ${isOpen ? 'panel-open' : 'panel-closed'} border-t border-border-default`}>
                  <div className="p-4 space-y-4">
                    {/* TA List */}
                    <div>
                      <h3 className="text-base font-semibold text-text-primary mb-3 flex items-center">
                        <FaUserGraduate className="w-4 h-4 text-primary-dark mr-2" />
                        Teaching Assistants
                      </h3>
                      <div className="space-y-3">
                        {module.approvedTAs.map((ta, taIndex) => (
                          <div key={taIndex} className="bg-bg-page rounded-lg border border-border-default p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex flex-col">
                                  <span className="font-medium text-text-primary">{ta.name}</span>
                                  <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                                </div>
                                {hasMissingDocs(ta.documents) && (
                                  <span className="badge badge-pending ml-2">Not submitted</span>
                                )}
                              </div>
                            </div>
                            {/* Document Details */}
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                              {renderDocRow('Bank Passbook Copy', ta.documents?.bankPassbookCopy)}
                              {renderDocRow('NIC Copy', ta.documents?.nicCopy)}
                              {renderDocRow('CV', ta.documents?.cv)}
                              {renderDocRow('Degree Certificate', ta.documents?.degreeCertificate)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Card View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="bg-white rounded-xl border border-border-default shadow-sm overflow-hidden">
              {/* Module Header */}
              <div className="p-4 border-b border-border-default">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-bold text-text-primary">{module.moduleCode}</h2>
                    <span className="bg-primary/10 text-primary-dark text-xs px-3 py-1 rounded-full font-medium">
                      {module.semester} {module.year}
                    </span>
                  </div>
                </div>
                <p className="text-text-secondary text-sm mb-3">{module.moduleName}</p>
                <div className="w-full h-px bg-border-default"></div>
              </div>

              <div className="p-4 space-y-4">
                {/* TA Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-bg-page rounded-lg p-3 border border-border-default">
                    <div className="text-xs text-text-secondary">TA Hours</div>
                    <div className="text-lg font-semibold text-text-primary">{module.requiredTAHours}h</div>
                  </div>
                  <div className="bg-bg-page rounded-lg p-3 border border-border-default">
                    <div className="text-xs text-text-secondary">Approved TAs</div>
                    <div className="text-lg font-semibold text-text-primary">{module.approvedTAs.length}</div>
                  </div>
                </div>

                {/* TA List */}
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-3 flex items-center">
                    <FaUserGraduate className="w-4 h-4 text-primary-dark mr-2" />
                    Teaching Assistants
                  </h3>
                  <div className="space-y-2">
                    {module.approvedTAs.map((ta, taIndex) => (
                      <div key={taIndex} className="bg-bg-page rounded-lg border border-border-default p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-text-primary">{ta.name}</span>
                              <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                            </div>
                          </div>
                          {hasMissingDocs(ta.documents) && (
                            <span className="badge badge-pending ml-2">Not submitted</span>
                          )}
                        </div>
                        {/* Document Summary (compact) */}
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {renderDocRow('Bank Passbook Copy', ta.documents?.bankPassbookCopy)}
                          {renderDocRow('NIC Copy', ta.documents?.nicCopy)}
                          {renderDocRow('CV', ta.documents?.cv)}
                          {renderDocRow('Degree Certificate', ta.documents?.degreeCertificate)}
                        </div>
                      </div>
                    ))}
                  </div>
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
