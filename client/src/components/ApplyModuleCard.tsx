import React from 'react'

interface ApplyModuleCardProps {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  moduleCoordinator: string[];
  requiredTAHours: number;
  requirements: string;
  numberOfTAsNeeded: number;
  appliedTAs: number;
  status: string;
  applicationDueDate: string;
  documentDueDate: string;
}

const ApplyModuleCard: React.FC<ApplyModuleCardProps> = ({
  moduleCode,
  moduleName,
  semester,
  year,
  moduleCoordinator,
  requiredTAHours,
  requirements,
  numberOfTAsNeeded,
  appliedTAs,
  applicationDueDate,
  documentDueDate
}) => {
  const progressPercentage = (appliedTAs / numberOfTAsNeeded) * 100;

  return (
    <div className="max-w-md mx-auto bg-bg-card rounded-xl shadow-lg overflow-hidden border border-border-default hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-dark to-primary px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-5">
              <h2 className="text-text-inverted font-bold text-lg">{moduleCode}</h2>
              <span className="bg-bg-card bg-opacity-20 text-text-inverted text-xs px-2 py-1 rounded-full">
                {semester} {year}
              </span>
            </div>
            <p className="text-text-secondary font-bold text-m mt-1">{moduleName}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-3">
        {/* Module Coordinator */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-primary-light bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-text-primary uppercase tracking-wide">Module Coordinators</p>
            <p className="text-sm font-medium text-text-primary">
              {moduleCoordinator.join(' & ')}
            </p>
          </div>
        </div>

        {/* TA Requirements */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-info bg-opacity-10 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-info bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-info" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-primary">Required Hours per Week</p>
                <p className="text-sm font-semibold text-text-primary">{requiredTAHours}h</p>
              </div>
            </div>
          </div>

          <div className="bg-info bg-opacity-10 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-info bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-info" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-primary">TAs Needed</p>
                <p className="text-sm font-semibold text-text-primary">{numberOfTAsNeeded}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Due Dates Section */}
        <div className="bg-gradient-to-br from-error/5 via-warning/5 to-error/5 rounded-lg p-3 border border-error/10">
          <h3 className="text-xs text-text-primary uppercase tracking-wide font-semibold mb-2 flex items-center">
            <svg className="w-3 h-3 text-error mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Important Deadlines
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-error/10 rounded-lg p-2 border-l-4 border-error">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-error/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-error" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-text-primary">Application Due</p>
                  <p className="text-sm font-semibold text-text-primary">{applicationDueDate}</p>
                </div>
              </div>
              <div className="text-right">
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-warning/10 rounded-lg p-2 border-l-4 border-warning">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-warning/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-warning" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-text-primary">Document Due</p>
                  <p className="text-sm font-semibold text-text-primary">{documentDueDate}</p>
                </div>
              </div>
              <div className="text-right">
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div>
          <p className="text-xs text-text-primary uppercase tracking-wide mb-1">Requirements</p>
          <div className="bg-info bg-opacity-10 rounded-lg p-2">
            <p className="text-sm text-text-primary leading-relaxed">{requirements}</p>
          </div>
        </div>

        {/* TA Application Progress */}
        <div className="bg-success bg-opacity-10 rounded-lg p-2 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-success bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs text-text-primary">Applications</p>
            </div>
            <p className="text-xs text-text-primary">{appliedTAs}/{numberOfTAsNeeded}</p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-success h-2 rounded-full transition-all duration-300 ease-in-out relative"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            >
              {/* Loading shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full bg-primary-dark text-text-inverted font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out border-0 relative overflow-hidden group">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
          
          {/* Button content */}
          <div className="relative flex items-center justify-center space-x-3">
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm tracking-wide">Apply for TA Position</span>
          </div>
        </button>
      </div>
    </div>
  )
}

export default ApplyModuleCard