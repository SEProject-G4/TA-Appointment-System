import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosConfig";
import { FaTimes, FaUserGraduate } from "react-icons/fa";

interface AcceptedTA { userId: string; name: string; indexNumber: string; documents?: any; docStatus?: 'pending' | 'submitted' }
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

  useEffect(() => { fetchAcceptedModules(); }, []);

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
          <button className="btn btn-primary" onClick={fetchAcceptedModules}>Try again</button>
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

  const renderTAItem = (ta: AcceptedTA, _moduleIndex: number, taIndex: number) => {
    const canShowDocs = ta.docStatus === 'submitted';

    return (
      <div key={taIndex} className="relative bg-bg-page rounded-lg border border-border-default p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="font-medium text-text-primary">{ta.name}</span>
              <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
            </div>
          </div>
          {!canShowDocs && (
            <span className="badge badge-pending">Not submitted</span>
          )}
        </div>

        {canShowDocs && (
          <button
            onClick={() => openDocModal(ta)}
            className="absolute bottom-2 right-2 btn btn-outline btn-xs"
          >
            View more
          </button>
        )}
      </div>
    );
  }

  const renderDocModal = () => {
    if (!docModal?.open || !docModal.ta) return null;
    const ta = docModal.ta;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={closeDocModal}></div>
        <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-bg-card">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center">
                <FaUserGraduate />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-text-primary">{ta.name}</span>
                <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
              </div>
            </div>
            <button aria-label="Close" className="h-8 w-8 rounded-md border border-border-default hover:bg-bg-page text-text-secondary flex items-center justify-center" onClick={closeDocModal}>
              <FaTimes />
            </button>
          </div>
          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-2 bg-white">
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
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
      <div className="mb-8 w-full flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-montserrat mb-2">View Module Details</h1>
          <p className="text-text-secondary font-raleway">Overview of assigned modules and teaching assistant status</p>
        </div>
        <div className="flex items-center space-x-2" />
      </div>
      {
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
                      Semester {module.semester} {module.year}
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
                    <div className="text-xs text-text-secondary">Accepted TAs</div>
                    <div className="text-sm font-semibold text-text-primary">{module.acceptedTAs.length}</div>
                  </div>
                </div>

                {/* TA List */}
                <div className="space-y-3">
                  {module.acceptedTAs.map((ta, taIndex) => renderTAItem(ta, moduleIndex, taIndex))}
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      {renderDocModal()}
    </div>
  );
};

export default ViewModuleDetails;
