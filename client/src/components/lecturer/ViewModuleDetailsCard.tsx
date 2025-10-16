import React from "react";

interface PersonalDetails {
  bankAccountName: string;
  address: string;
  nicNumber: string;
  accountNumber: string;
}

interface AcceptedTA { 
  userId: string; 
  name: string; 
  indexNumber: string; 
  documents?: any; 
  docStatus?: 'pending' | 'submitted'; 
  role?: 'undergraduate' | 'postgraduate';
  personalDetails?: PersonalDetails;
}

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

interface ViewModuleDetailsCardProps {
  module: ModuleWithAccepted;
  moduleIndex: number;
  activeTabByModule: Record<string, 'undergraduate' | 'postgraduate'>;
  onTabChange: (moduleId: string, tab: 'undergraduate' | 'postgraduate') => void;
  onViewDocuments: (ta: AcceptedTA) => void;
}

const ViewModuleDetailsCard: React.FC<ViewModuleDetailsCardProps> = ({
  module,
  moduleIndex: _moduleIndex,
  activeTabByModule,
  onTabChange,
  onViewDocuments
}) => {
  const renderTAItem = (ta: AcceptedTA, taIndex: number) => {
    const canShowDocs = ta.docStatus === 'submitted';

    return (
      <div key={taIndex} className="relative bg-bg-page rounded-lg border border-border-default p-3">
        <div className="flex items-center justify-between">
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
            onClick={() => onViewDocuments(ta)}
            className="absolute bottom-2 right-2 btn btn-outline btn-xs inline-flex items-center justify-center leading-none"
          >
            View more
          </button>
        )}
      </div>
    );
  };

  const currentTab = activeTabByModule[module.moduleId] || 'undergraduate';
  const ugCount = (module.acceptedTAs || []).filter(t => (t.role || 'undergraduate') === 'undergraduate').length;
  const pgCount = (module.acceptedTAs || []).filter(t => (t.role || 'undergraduate') === 'postgraduate').length;

  // Auto-switch tabs for better UX if current tab has zero and the other has > 0
  React.useEffect(() => {
    const shouldSwitchToPG = currentTab === 'undergraduate' && ugCount === 0 && pgCount > 0;
    const shouldSwitchToUG = currentTab === 'postgraduate' && pgCount === 0 && ugCount > 0;
    
    if (shouldSwitchToPG) {
      onTabChange(module.moduleId, 'postgraduate');
    } else if (shouldSwitchToUG) {
      onTabChange(module.moduleId, 'undergraduate');
    }
  }, [currentTab, ugCount, pgCount, module.moduleId, onTabChange]);

  const filteredTAs = module.acceptedTAs.filter(ta => (ta.role || 'undergraduate') === currentTab);

  return (
    <div className="flex w-full flex-col items-center border border-black rounded-md p-0 bg-bg-card shadow-sm hover:shadow-md transition-shadow">
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
            <div className="text-sm font-semibold text-text-primary">{Number(module.requiredTAHours ?? 0)}h</div>
          </div>
          <div className="bg-bg-page rounded-lg p-3 border border-border-default">
            <div className="text-xs text-text-secondary">
              {currentTab === 'undergraduate' ? 'Accepted Undergraduates' : 'Accepted Postgraduates'}
            </div>
            <div className="text-sm font-semibold text-text-primary">{filteredTAs.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex w-full border-b border-border-default">
          {(['undergraduate','postgraduate'] as const).map(tab => {
            const count = tab === 'undergraduate' ? ugCount : pgCount;
            const isActive = currentTab === tab;
            const isDisabled = count === 0;
            const baseCls = `px-3 py-2 text-sm font-medium ${isActive ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`;
            const disabledCls = isDisabled ? ' opacity-50 cursor-not-allowed' : '';
            return (
              <button
                key={tab}
                onClick={() => { if (!isDisabled) onTabChange(module.moduleId, tab); }}
                className={baseCls + disabledCls}
                disabled={isDisabled}
                title={isDisabled ? 'No accepted TAs in this category' : undefined}
              >
                {tab === 'undergraduate' ? 'Undergraduates' : 'Postgraduates'} ({count})
              </button>
            );
          })}
        </div>

        {/* TA List */}
        <div className="space-y-3">
          {filteredTAs.map((ta, taIndex) => renderTAItem(ta, taIndex))}
        </div>
      </div>
    </div>
  );
};

export default ViewModuleDetailsCard;
