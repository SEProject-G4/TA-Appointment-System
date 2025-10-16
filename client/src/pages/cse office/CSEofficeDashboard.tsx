import { useEffect, useState } from 'react'
import axios from '../../api/axiosConfig'
import { FaTimes, FaUserGraduate } from 'react-icons/fa'
import CSEofficeCard from '../../components/cse office/CSEofficeCard'

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

// (legacy) TAItem retained in history; no longer used in new view

type AcceptedModule = { moduleId: string; moduleCode: string; moduleName: string; semester: number; year: number }
type TAView = { userId: string; name: string; indexNumber: string; role: string; acceptedModules: AcceptedModule[]; documents: Documents }

const CSEofficeDashboard = () => {
  const [tas, setTas] = useState<TAView[]>([])
  // card view only
  const [docModal, setDocModal] = useState<{ open: boolean; ta?: TAView }>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get('/cse-office/view-ta-documents')
        setTas(res.data?.tas || [])
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // list view removed

  const openDocModal = (ta: TAView) => setDocModal({ open: true, ta })
  const closeDocModal = () => setDocModal({ open: false })

  const renderDoc = (label: string, f?: FileMeta) => {
    if (!f) return null

    const toDriveDownloadUrl = (url?: string) => {
      if (!url) return ''
      try {
        const fileIdMatch = url.match(/\/d\/([^/]+)\//) || url.match(/[?&]id=([^&]+)/)
        const fileId = fileIdMatch ? fileIdMatch[1] : ''
        return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : url
      } catch {
        return url
      }
    }

    const hasAnyUrl = Boolean(f.fileUrl)
    const downloadUrl = toDriveDownloadUrl(f.fileUrl)

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-3 bg-white rounded border border-border-default">
        <span className="text-xs sm:text-sm font-medium text-text-primary">{label}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasAnyUrl ? (
            <>
              <button 
                onClick={() => window.open(f.fileUrl, "_blank")} 
                className="btn btn-primary btn-xs text-[10px] sm:text-xs px-2 sm:px-3"
              >
                View
              </button>
              <a 
                href={downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-outline btn-xs text-[10px] sm:text-xs px-2 sm:px-3"
              >
                Download
              </a>
            </>
          ) : (
            <span className="text-[10px] sm:text-xs text-text-secondary">No file uploaded</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-6 md:px-10 lg:px-20 py-4 sm:py-5">
      <div className="mb-6 sm:mb-8 w-full flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-montserrat mb-1 sm:mb-2">View TA Documents</h1>
          <p className="text-xs sm:text-sm text-text-secondary font-raleway">TAs with submitted documents and their accepted modules</p>
        </div>
        <div className="flex items-center space-x-2" />
      </div>

      {loading && (
        <div className="flex items-center justify-center w-full h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 sm:p-6 w-full">
          <h3 className="text-error font-semibold mb-2 text-sm sm:text-base">Error</h3>
          <p className="text-text-secondary mb-4 text-xs sm:text-sm">{error}</p>
          <button className="btn btn-primary text-xs sm:text-sm" onClick={() => window.location.reload()}>Try again</button>
        </div>
      )}

      {!loading && !error && tas.length === 0 && (
        <div className="bg-bg-card border border-border-default rounded-lg p-4 sm:p-6 w-full">
          <p className="text-text-secondary text-xs sm:text-sm">No accepted TAs with submitted documents.</p>
        </div>
      )}

      {!loading && !error && tas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 w-full">
          {tas.map(ta => (
            <CSEofficeCard 
              key={ta.userId} 
              ta={ta} 
              onViewDocuments={openDocModal}
            />
          ))}
        </div>
      )}

      {docModal?.open && docModal.ta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeDocModal}></div>
          <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl bg-white rounded-lg sm:rounded-xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-border-default bg-bg-card flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center text-sm sm:text-base">
                  <FaUserGraduate />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm sm:text-base font-semibold text-text-primary truncate">{docModal.ta.name}</span>
                  <span className="text-[10px] sm:text-xs text-text-secondary">{docModal.ta.indexNumber}</span>
                </div>
              </div>
              <button aria-label="Close" className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-md border border-border-default hover:bg-bg-page text-text-secondary flex items-center justify-center ml-2" onClick={closeDocModal}>
                <FaTimes className="text-sm sm:text-base" />
              </button>
            </div>
            <div className="p-3 sm:p-5 overflow-y-auto space-y-2 bg-white flex-1">
              {renderDoc('Bank Passbook Copy', docModal.ta.documents?.bankPassbook)}
              {renderDoc('NIC Copy', docModal.ta.documents?.nicCopy)}
              {renderDoc('CV', docModal.ta.documents?.cv)}
              {docModal.ta.role !== 'undergraduate' && renderDoc('Degree Certificate', docModal.ta.documents?.degreeCertificate)}
              {renderDoc('Declaration Form', docModal.ta.documents?.declarationForm)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CSEofficeDashboard