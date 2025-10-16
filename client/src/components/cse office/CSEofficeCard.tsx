import React from 'react'
import { FaUserGraduate } from 'react-icons/fa'

type FileMeta = {
  submitted?: boolean
  fileUrl?: string
  fileName?: string
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
  address: string
  nicNumber: string
  accountNumber: string
}

type AcceptedModule = { moduleId: string; moduleCode: string; moduleName: string; semester: number; year: number }
type TAView = { userId: string; name: string; indexNumber: string; role: string; acceptedModules: AcceptedModule[]; documents: Documents; personalDetails?: PersonalDetails }

interface CSEofficeCardProps {
  ta: TAView;
  onViewDocuments: (ta: TAView) => void;
}

const CSEofficeCard: React.FC<CSEofficeCardProps> = ({ ta, onViewDocuments }) => {
  return (
    <div className="flex w-full flex-col items-center border border-black rounded-md p-0 bg-bg-card shadow-sm hover:shadow-md transition-shadow min-h-36 sm:min-h-40">
      <div className="flex w-full items-center justify-between p-3 sm:p-4 border-b border-border-default gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center text-sm sm:text-base">
            <FaUserGraduate />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base text-text-primary font-semibold truncate">{ta.name}</span>
            <span className="text-[10px] sm:text-xs text-text-secondary">{ta.indexNumber}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] sm:text-xs text-text-secondary">Modules</div>
          <div className="text-sm sm:text-base font-semibold text-text-primary">{ta.acceptedModules.length}</div>
        </div>
      </div>
      <div className="p-3 sm:p-4 space-y-3 w-full">
        <div>
          <div className="text-xs sm:text-sm font-semibold text-text-primary mb-2">Accepted Modules</div>
          <div role="list" className="space-y-2">
            {ta.acceptedModules.map(m => (
              <div
                role="listitem"
                key={m.moduleId}
                className="flex items-center justify-between gap-1 sm:gap-2 rounded-md border border-border-default bg-bg-page/60 px-2 sm:px-3 py-3"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex flex-col text-xs sm:text-sm leading-tight min-w-0">
                    <span className="font-bold text-black truncate">{m.moduleName}</span>
                    <span className="text-text-secondary text-[11px] sm:text-xs truncate">{m.moduleCode}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs rounded-full bg-primary/10 text-primary-dark px-2 py-1 whitespace-nowrap flex-shrink-0">
                    Sem {m.semester} {m.year}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn btn-outline btn-sm text-xs sm:text-sm" onClick={() => onViewDocuments(ta)}>View details</button>
        </div>
      </div>
    </div>
  )
}

export default CSEofficeCard
