import React from 'react';

interface TACardSummaryProps {
  moduleCode: string;
  moduleName: string;
  status: 'pending' | 'accepted' | 'rejected';
  onViewMore: () => void;
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
};

const AppliedTARequestCard: React.FC<TACardSummaryProps> = ({ moduleCode, moduleName, status, onViewMore }) => {
  return (
    <div className="w-full p-3 sm:p-4 transition-shadow duration-300 border shadow-md rounded-xl bg-bg-card border-border-default hover:shadow-lg">
      <div className="mb-2 sm:mb-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary">{moduleCode}</h2>
        <p className="text-xs sm:text-sm text-text-secondary">{moduleName}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
        <span className={`text-xs font-semibold px-2 sm:px-3 py-1 rounded-full self-start ${getStatusStyle(status)}`}>
          Status : {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>

        <button
          onClick={onViewMore}
          className="w-full sm:w-auto min-w-fit bg-primary-dark text-text-inverted font-semibold py-2 sm:py-1 px-3 text-sm rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out border-0 relative overflow-hidden group"
        >
          View More
        </button>
      </div>
    </div>
  );
};

export default AppliedTARequestCard;
