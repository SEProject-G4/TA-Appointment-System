import React from 'react';

interface ModuleCardProps {
  moduleCode: string;
  moduleName: string;
  onSubmit: () => void;
  onViewMore: () => void;
}

const AcceptedRequestCard: React.FC<ModuleCardProps> = ({
  moduleCode,
  moduleName,
  onSubmit,
  onViewMore,
}) => {
  return (
    <div className="w-full p-4 mb-4 bg-white border border-gray-200 shadow-md sm:p-6 rounded-xl">
      <h2 className="mb-1 text-base font-semibold text-gray-800 sm:text-lg">{moduleCode}</h2>
      <p className="mb-3 text-xs text-gray-600 sm:mb-4 sm:text-sm">{moduleName}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          onClick={onSubmit}
          className="w-full sm:w-auto min-w-fit bg-slate-500 text-text-inverted font-semibold py-2 sm:py-1 px-3 text-sm rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out border-0 relative overflow-hidden group"
        >
          Submit Documents
        </button>
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

export default AcceptedRequestCard;
