import React from 'react'

interface TARequestCardProps {
  moduleCode: string;
  moduleName: string;
  semester: string;
  year: string;
  appliedTAs: { name: string; status: string }[];
  totalRequiredTAs: number;
  onAccept: (name: string) => void;
  onReject: (name: string) => void;
}

const TARequestCard: React.FC<TARequestCardProps> = ({
  moduleCode,
  moduleName,
  semester,
  year,
  appliedTAs,
  totalRequiredTAs,
  onAccept,
  onReject
}) => {
  const acceptedCount = appliedTAs.filter(ta => ta.status.toLowerCase() === 'accepted').length;
  const progress = Math.min((acceptedCount / totalRequiredTAs) * 100, 100);

  return (
    <div className="w-full bg-bg-card rounded-xl shadow-lg overflow-visible border border-border-default mb-6">
      <div className="bg-gradient-to-r from-primary-dark to-primary px-6 py-4 flex items-center justify-between rounded-t-xl">
        <div>
          <div className="flex items-center space-x-4">
            <h2 className="text-text-inverted font-bold text-lg">{moduleCode}</h2>
            <span className="bg-bg-card bg-opacity-20 text-text-inverted text-xs px-2 py-1 rounded-full">
              {semester} {year}
            </span>
          </div>
          <p className="text-text-inverted font-bold text-m mt-1">{moduleName}</p>
        </div>
      </div>
      <div className="px-6 py-4">
        <h3 className="text-xs text-text-primary uppercase tracking-wide mb-2">Applied TAs</h3>
        <ul className="divide-y divide-border-default">
          {appliedTAs.length === 0 ? (
            <li className="py-2 text-text-secondary text-sm">No applications yet.</li>
          ) : (
            appliedTAs.map((ta, idx) => {
              const isActionDisabled = ['accepted', 'rejected'].includes(ta.status.toLowerCase());
              return (
                <li key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center min-w-0 flex-1 space-x-3">
                    <span className="text-text-primary font-medium truncate max-w-[120px]">{ta.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ta.status.toLowerCase() === 'accepted' ? 'bg-success/10 text-success' : ta.status.toLowerCase() === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>{ta.status}</span>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      className={`bg-success text-text-inverted text-xs px-2 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-success/40 ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-success/90'}`}
                      onClick={() => onAccept(ta.name)}
                      title="Accept"
                      disabled={isActionDisabled}
                    >
                      ✓
                    </button>
                    <button
                      className={`bg-error text-text-inverted text-xs px-2 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-error/40 ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-error/90'}`}
                      onClick={() => onReject(ta.name)}
                      title="Reject"
                      disabled={isActionDisabled}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              )
            })
          )}
        </ul>
        {/* Progress Bar Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-primary font-medium">Accepted TAs</span>
            <span className="text-xs text-text-primary font-semibold">{acceptedCount}/{totalRequiredTAs}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Loading shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Example usage with mock data and handlers
const HandleTARequests = () => {
  const modules = [
    {
      moduleCode: 'CS1010',
      moduleName: 'Introduction to Computer Science',
      semester: '3rd Semester',
      year: '2024',
      totalRequiredTAs: 5,
      appliedTAs: [
        { name: 'Alice Johnson', status: 'Pending' },
        { name: 'Bob Smith', status: 'Accepted' },
        { name: 'Charlie Lee', status: 'Pending' }
      ]
    },
    {
      moduleCode: 'CS301',
      moduleName: 'Introduction to Machine Learning',
      semester: '5th Semester',
      year: '2024',
      totalRequiredTAs: 3,
      appliedTAs: [
        { name: 'Sarah Wilson', status: 'Accepted' },
        { name: 'David Chen', status: 'Pending' },
        { name: 'Priya Patel', status: 'Rejected' }
      ]
    },
    {
      moduleCode: 'CS302',
      moduleName: 'Introduction to Artificial Intelligence',
      semester: '5th Semester',
      year: '2024',
      totalRequiredTAs: 4,
      appliedTAs: [
        { name: 'Liam Brown', status: 'Pending' },
        { name: 'Emma Davis', status: 'Accepted' },
        { name: 'Noah Garcia', status: 'Pending' }
      ]
    }
  ]

  const handleAccept = (name: string) => {
    alert(`Accepted TA: ${name}`)
  }

  const handleReject = (name: string) => {
    alert(`Rejected TA: ${name}`)
  }

  return (
    <div className="py-8 px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m, idx) => (
          <TARequestCard
            key={`${m.moduleCode}-${idx}`}
            moduleCode={m.moduleCode}
            moduleName={m.moduleName}
            semester={m.semester}
            year={m.year}
            totalRequiredTAs={m.totalRequiredTAs}
            appliedTAs={m.appliedTAs}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  )
}

export default HandleTARequests
