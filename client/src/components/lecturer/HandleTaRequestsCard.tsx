import React, { useState } from 'react'
import { FaChevronRight, FaUserGraduate, FaClipboardList, FaCopy } from 'react-icons/fa'
import { useModal } from '../../contexts/ModalProvider'
import { useToast } from '../../contexts/ToastContext'

interface TARequestCardProps {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  appliedTAs: { name: string; status: string; applicationId: string; indexNumber: string; email: string; profilePicture: string; role?: 'undergraduate' | 'postgraduate' }[];
  requiredUndergraduateTAs?: number;
  requiredPostgraduateTAs?: number;
  onAccept: (applicationId: string, studentName: string) => void;
  onReject: (applicationId: string, studentName: string) => void;
  processingActions: Set<string>;
  collapsible?: boolean;
}

const HandleTaRequestsCard: React.FC<TARequestCardProps> = ({
  moduleCode,
  moduleName,
  semester,
  year,
  appliedTAs,
  requiredUndergraduateTAs: _requiredUndergraduateTAs,
  requiredPostgraduateTAs: _requiredPostgraduateTAs,
  onAccept,
  onReject,
  processingActions,
  collapsible = true
}) => {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'undergraduate' | 'postgraduate'>('undergraduate');
  // Overall counts kept for header metrics if needed later
  // const acceptedCount = appliedTAs.filter(ta => (ta.status || '').toLowerCase() === 'accepted').length;
  const pendingCount = appliedTAs.filter(ta => (ta.status || '').toLowerCase() === 'pending').length;

  const filteredTAs = appliedTAs.filter(ta => (ta.role || 'undergraduate') === activeTab);
  const acceptedInTab = filteredTAs.filter(ta => (ta.status || '').toLowerCase() === 'accepted').length;
  const appliedInTab = filteredTAs.length;
  const progress = Math.min(appliedInTab > 0 ? (acceptedInTab / appliedInTab) * 100 : 0, 100);

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      showToast(successMessage, 'success');
    } catch (error) {
      console.error('Failed to copy emails:', error);
      showToast('Failed to copy email addresses.', 'error');
    }
  };

  const handleCopyEmail = (email: string, name: string) => {
    copyToClipboard(email, `Copied ${name}'s email to clipboard.`);
  };

  const handleCopyIndexNumber = (indexNumber: string, name: string) => {
    copyToClipboard(indexNumber, `Copied ${name}'s index number to clipboard.`);
  };

  const openProfilePicturePreview = (imageUrl: string, name: string) => {
    openModal(
      <div className="flex max-w-[92vw] flex-col items-center gap-4 rounded-xl bg-bg-card p-4 sm:p-6">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-text-primary sm:text-lg">{name}</h3>
            <p className="text-xs text-text-secondary">Profile picture preview</p>
          </div>
        </div>
        <img
          src={imageUrl}
          alt={`${name} profile picture preview`}
          className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-lg"
        />
      </div>,
      { showCloseButton: true }
    );
  };

  const handleCopyRoleEmails = (role: 'undergraduate' | 'postgraduate') => {
    const roleEmails = appliedTAs.filter(ta => (ta.role || 'undergraduate') === role).map(ta => ta.email).filter(Boolean);

    if (roleEmails.length === 0) {
      showToast(`No ${role} emails to copy.`, 'info');
      return;
    }

    copyToClipboard(
      roleEmails.join('\n'),
      `Copied all ${role === 'undergraduate' ? 'undergraduate' : 'postgraduate'} emails to clipboard.`
    );
  };

  const roleCopyButtons = (
    <div className="flex w-full flex-row justify-end gap-2">
      <button
        onClick={() => handleCopyRoleEmails('undergraduate')}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-card px-3 py-2 text-xs sm:text-sm font-medium text-text-secondary transition-colors hover:bg-primary/10 hover:text-text-primary"
        title="Copy all undergraduate emails"
      >
        <FaCopy className="h-3.5 w-3.5" />
        <span>Copy undergrad emails</span>
      </button>
      <button
        onClick={() => handleCopyRoleEmails('postgraduate')}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-card px-3 py-2 text-xs sm:text-sm font-medium text-text-secondary transition-colors hover:bg-primary/10 hover:text-text-primary"
        title="Copy all postgraduate emails"
      >
        <FaCopy className="h-3.5 w-3.5" />
        <span>Copy postgrad emails</span>
      </button>
    </div>
  );

  return (
    <div className="flex w-full flex-col items-center border border-black rounded-md p-3 sm:p-4 bg-bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row w-full items-start sm:items-center space-y-2 sm:space-y-0">
        {collapsible ? (
          <FaChevronRight
            className={`p-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full hover:bg-primary/10 text-text-secondary cursor-pointer transition-transform ease-in-out duration-100 ${
              isExpanded ? "rotate-90" : ""
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        ) : (
          <span className="w-5 sm:w-6" />
        )}
        <div className="flex flex-1 flex-col ml-2 sm:-ml-4 lg:-ml-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
            <h3 className="text-base sm:text-lg font-semibold text-text-primary">{moduleCode}</h3>
            <span className="bg-primary/10 text-primary-dark text-xs px-2 py-1 rounded-full font-medium self-start">
              Semester {semester} {year}
            </span>
          </div>
          <p className="text-text-primary text-xs sm:text-sm mt-1">{moduleName}</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
          <div className="text-right">
            <div className="text-xs sm:text-sm text-text-secondary">Progress</div>
            <div className="text-sm sm:text-lg font-semibold text-text-primary">{acceptedInTab}/{appliedInTab}</div>
          </div>
          <div className="w-12 sm:w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center bg-bg-page rounded-lg p-3 space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-2">
                  <FaUserGraduate className="text-primary-dark h-4 w-4" />
                  <span className="text-xs sm:text-sm text-text-secondary">Total Applications:</span>
                  <span className="font-semibold text-text-primary text-sm sm:text-base">{appliedTAs.length}</span>
                </div>
                <span className="hidden sm:block w-px h-5 bg-border-default" />
                <div className="flex items-center space-x-2">
                  <FaClipboardList className="text-primary-dark h-4 w-4" />
                  <span className="text-xs sm:text-sm text-text-secondary">Pending:</span>
                  <span className="font-semibold text-text-primary text-sm sm:text-base">{pendingCount}</span>
                </div>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
              {/* Tabs */}
              <div className="flex w-full border-b border-border-default">
                {(['undergraduate','postgraduate'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
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
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-bg-page rounded-lg p-3 border border-border-default space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => openProfilePicturePreview(ta.profilePicture, ta.name)}
                            className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2 focus:ring-offset-bg-page"
                            title={`View ${ta.name}'s profile picture`}
                            aria-label={`View ${ta.name}'s profile picture`}
                          >
                            <img
                              src={ta.profilePicture}
                              alt={ta.name}
                              className="h-10 w-10 rounded-full object-cover cursor-zoom-in"
                            />
                          </button>
                          <div className="flex flex-col">
                            <span className="font-medium text-text-primary text-sm sm:text-base">{ta.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyIndexNumber(ta.indexNumber, ta.name)}
                                className="inline-flex items-center justify-center rounded-full p-1 text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary"
                                title={`Copy ${ta.name}'s index number`}
                                aria-label={`Copy ${ta.name}'s index number`}
                              >
                                <FaCopy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <a href={`mailto:${ta.email}`} className="text-xs text-blue-500 hover:underline">
                                {ta.email}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(ta.email, ta.name)}
                                className="inline-flex items-center justify-center rounded-full p-1 text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary"
                                title={`Copy ${ta.name}'s email`}
                                aria-label={`Copy ${ta.name}'s email address`}
                              >
                                <FaCopy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          {(statusLower === 'accepted' || statusLower === 'rejected') && (
                            <span className={`badge text-xs ${
                              statusLower === 'accepted' ? 'badge-accepted' : 'badge-rejected'
                            }`}>
                              {statusLower === 'accepted' ? 'Accepted' : 'Rejected'}
                            </span>
                          )}
                        </div>
                        {isPending && (
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                            <button
                              className={`btn btn-primary btn-sm sm:btn-sm ${isActionDisabled || isProcessing ? 'btn-disabled' : ''}`}
                              onClick={() => onAccept(ta.applicationId, ta.name)}
                              title={isActionDisabled ? 'Already processed' : isProcessing ? 'Processing...' : 'Accept TA application'}
                              disabled={isActionDisabled || isProcessing}
                            >
                              {isProcessing ? <span>⏳</span> : <span className="text-xs">Accept</span>}
                            </button>
                            <button
                              className={`btn btn-outline btn-sm sm:btn-sm ${isActionDisabled || isProcessing ? 'btn-disabled' : ''}`}
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
          </div>
      ) : (
        <div className="w-full space-y-3 mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center bg-bg-page rounded-lg p-3 space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <FaUserGraduate className="text-primary-dark h-4 w-4" />
                <span className="text-xs sm:text-sm text-text-secondary">Total Applications:</span>
                <span className="font-semibold text-text-primary text-sm sm:text-base">{appliedTAs.length}</span>
              </div>
              <span className="hidden sm:block w-px h-5 bg-border-default" />
              <div className="flex items-center space-x-2">
                <FaClipboardList className="text-primary-dark h-4 w-4" />
                <span className="text-xs sm:text-sm text-text-secondary">Pending:</span>
                <span className="font-semibold text-text-primary text-sm sm:text-base">{filteredTAs.filter(ta => (ta.status || '').toLowerCase() === 'pending').length}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
            <div className="flex w-full border-b border-border-default">
              {(['undergraduate','postgraduate'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
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
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-bg-page rounded-lg p-3 border border-border-default space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => openProfilePicturePreview(ta.profilePicture, ta.name)}
                          className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2 focus:ring-offset-bg-page"
                          title={`View ${ta.name}'s profile picture`}
                          aria-label={`View ${ta.name}'s profile picture`}
                        >
                          <img
                            src={ta.profilePicture}
                            alt={ta.name}
                            className="h-10 w-10 rounded-full object-cover cursor-zoom-in"
                          />
                        </button>
                        <div className="flex flex-col">
                          <span className="font-medium text-text-primary text-sm sm:text-base">{ta.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyIndexNumber(ta.indexNumber, ta.name)}
                              className="inline-flex items-center justify-center rounded-full p-1 text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary"
                              title={`Copy ${ta.name}'s index number`}
                              aria-label={`Copy ${ta.name}'s index number`}
                            >
                              <FaCopy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <a href={`mailto:${ta.email}`} className="text-xs text-blue-500 hover:underline">
                              {ta.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(ta.email, ta.name)}
                              className="inline-flex items-center justify-center rounded-full p-1 text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary"
                              title={`Copy ${ta.name}'s email`}
                              aria-label={`Copy ${ta.name}'s email address`}
                            >
                              <FaCopy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {(statusLower === 'accepted' || statusLower === 'rejected') && (
                          <span className={`badge text-xs ${
                            statusLower === 'accepted' ? 'badge-accepted' : 'badge-rejected'
                          }`}>
                            {statusLower === 'accepted' ? 'Accepted' : 'Rejected'}
                          </span>
                        )}
                      </div>
                      {isPending && (
                        <div className="flex flex-col space-y-2 w-full sm:w-[100px]">
                          <button
                            className={`btn btn-primary btn-sm sm:btn-sm ${isActionDisabled || isProcessing ? 'btn-disabled' : ''}`}
                            onClick={() => onAccept(ta.applicationId, ta.name)}
                            title={isActionDisabled ? 'Already processed' : isProcessing ? 'Processing...' : 'Accept TA application'}
                            disabled={isActionDisabled || isProcessing}
                          >
                            {isProcessing ? <span>⏳</span> : <span className="text-xs">Accept</span>}
                          </button>
                          <button
                            className={`btn btn-outline btn-sm sm:btn-sm ${isActionDisabled || isProcessing ? 'btn-disabled' : ''}`}
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
      )}
      <div className="w-full pt-3">{roleCopyButtons}</div>
    </div>
  )
}

export default HandleTaRequestsCard
