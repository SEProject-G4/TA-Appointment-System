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
    <div className="w-full max-w-md p-6 mb-4 bg-white border border-gray-200 shadow-md rounded-xl">
      <h2 className="mb-1 text-lg font-semibold text-gray-800">{moduleCode}</h2>
      <p className="mb-4 text-sm text-gray-600">{moduleName}</p>
      <div className="flex justify-between">
        <button
          onClick={onSubmit}
          className="min-w-fit bg-slate-500 text-text-inverted font-semibold py-1 px-3 rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out border-0 relative overflow-hidden group"
        >
          Submit Documents
        </button>
        <button
          onClick={onViewMore}
          className="min-w-fit bg-primary-dark text-text-inverted font-semibold py-1 px-3 rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out border-0 relative overflow-hidden group"
        >
          View More
        </button>
      </div>
    </div>
  );
};

export default AcceptedRequestCard;
