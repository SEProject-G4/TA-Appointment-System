import React, { useState } from 'react'
import { FaChevronRight, FaUserGraduate, FaClipboardList } from 'react-icons/fa'

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

const HandleTaRequestsCard: React.FC<TARequestCardProps> = ({
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

export default HandleTaRequestsCard
