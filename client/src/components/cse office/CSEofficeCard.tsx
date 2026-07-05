import React from 'react'
import { FaUserGraduate } from 'react-icons/fa'

// --- Updated Types to match the backend and main dashboard ---
type FileMeta = {
  submitted?: boolean
  id?: string
  name?: string
  viewLink?: string
  downloadLink?: string
  uploadedAt?: string
}

type Documents = {
  bankPassbook: FileMeta
  nicCopy: FileMeta
  cv: FileMeta
  degreeCertificate: FileMeta
  declarationForm: FileMeta
}

type PersonalDetails = {
  bankAccountName: string
  bank: string
  branch: string
  address: string
  nicNumber: string
  accountNumber: string
}

// Updated to include taHours instead of semester/year
type AcceptedModule = { 
  moduleId: string; 
  moduleCode: string; 
  moduleName: string; 
  taHours: number;
}

type TAView = { 
  userId: string;
  documentId: string;
  name: string; 
  indexNumber: string;
  email: string; 
  role: string; 
  acceptedModules: AcceptedModule[]; 
  documents: Documents; 
  personalDetails?: PersonalDetails 
}

interface CSEofficeCardProps {
  ta: TAView;
  onViewDocuments: (ta: TAView) => void;
}

const CSEofficeCard: React.FC<CSEofficeCardProps> = ({ ta, onViewDocuments }) => {
  return (
    <div className="flex flex-col items-center w-full min-h-[9rem] p-0 transition-shadow border border-black rounded-md shadow-sm sm:min-h-[10rem] bg-bg-card hover:shadow-md">
      {/* Header Info */}
      <div className="flex items-center justify-between w-full gap-2 p-3 border-b sm:p-4 border-border-default">
        <div className="flex items-center min-w-0 gap-2 sm:gap-3">
          <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm rounded-full sm:h-9 sm:w-9 bg-primary/10 text-primary-dark sm:text-base">
            <FaUserGraduate />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate sm:text-base text-text-primary">{ta.indexNumber} - {ta.name}</span>
            <a href={`mailto:${ta.email}`} className="text-[10px] sm:text-xs text-text-secondary truncate">{ta.email}</a>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-[10px] sm:text-xs text-text-secondary">Modules</div>
          <div className="text-sm font-semibold sm:text-base text-text-primary">{ta.acceptedModules.length}</div>
        </div>
      </div>

      {/* Modules List & Action */}
      <div className="w-full p-3 space-y-3 sm:p-4">
        <div>
          <div className="mb-2 text-xs font-semibold sm:text-sm text-text-primary">Accepted Modules</div>
          <div role="list" className="space-y-2">
            {ta.acceptedModules.length > 0 ? (
              ta.acceptedModules.map(m => (
                <div
                  role="listitem"
                  key={m.moduleId}
                  className="flex items-center justify-between gap-1 py-3 border rounded-md sm:gap-2 border-border-default bg-bg-page/60 px-2 sm:px-3"
                >
                  <div className="flex items-center min-w-0 gap-2 sm:gap-3">
                    <div className="flex flex-col min-w-0 text-xs leading-tight sm:text-sm">
                      <span className="text-black truncate">{m.moduleName}</span>
                      <span className="text-text-secondary text-[11px] sm:text-xs truncate">{m.moduleCode}</span>
                    </div>
                  </div>
                  {/* Updated Badge to show TA Hours */}
                  <span className="text-[10px] sm:text-xs rounded-full bg-primary/10 text-primary-dark px-2 py-1 whitespace-nowrap flex-shrink-0">
                    {m.taHours} {m.taHours === 1 ? 'Hour' : 'Hours'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-2 text-xs text-center text-text-secondary">
                No active modules found.
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <button 
            className="text-xs btn btn-outline btn-sm sm:text-sm" 
            onClick={() => onViewDocuments(ta)}
          >
            View details
          </button>
        </div>
      </div>
    </div>
  )
}

export default CSEofficeCard