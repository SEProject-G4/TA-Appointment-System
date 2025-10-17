import { useEffect, useState } from 'react'
import axios from '../../api/axiosConfig'
import { FaTimes, FaUserGraduate } from 'react-icons/fa'
import { ChevronDown, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
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

type PersonalDetails = {
  bankAccountName: string
  address: string
  nicNumber: string
  accountNumber: string
}

// (legacy) TAItem retained in history; no longer used in new view

type AcceptedModule = { moduleId: string; moduleCode: string; moduleName: string; semester: number; year: number }
type TAView = { userId: string; name: string; indexNumber: string; role: string; acceptedModules: AcceptedModule[]; documents: Documents; personalDetails?: PersonalDetails }

const ITEMS_PER_PAGE = 9

const CSEofficeDashboard = () => {
  const [tas, setTas] = useState<TAView[]>([])
  // card view only
  const [docModal, setDocModal] = useState<{ open: boolean; ta?: TAView }>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortOption, setSortOption] = useState<string>("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'undergraduate' | 'postgraduate'>('undergraduate')
  const [currentPage, setCurrentPage] = useState<number>(1)

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

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab, sortOption])

  // list view removed

  const handleSortChange = (option: string) => {
    setSortOption(option)
    let sortedTas = [...tas]

    if (option === "name") {
      sortedTas.sort((a, b) => a.name.localeCompare(b.name))
    } else if (option === "indexNumber") {
      sortedTas.sort((a, b) => a.indexNumber.localeCompare(b.indexNumber))
    } else if (option === "modules") {
      sortedTas.sort((a, b) => b.acceptedModules.length - a.acceptedModules.length)
    }

    setTas(sortedTas)
  }

  // Filter by role (tab) and search query
  const filteredTas = tas.filter((ta) => {
    // Filter by active tab
    if (ta.role !== activeTab) return false

    // Filter by search query
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    const name = ta.name?.toLowerCase() || ""
    const indexNumber = ta.indexNumber?.toLowerCase() || ""

    return name.includes(query) || indexNumber.includes(query)
  })

  // Count TAs by role
  const undergraduateCount = tas.filter(ta => ta.role === 'undergraduate').length
  const postgraduateCount = tas.filter(ta => ta.role === 'postgraduate').length

  // Pagination calculations
  const totalPages = Math.ceil(filteredTas.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedTas = filteredTas.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages))
  }

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
      <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded border border-border-default">
        <span className="text-xs sm:text-sm font-medium text-text-primary truncate">{label}</span>
        <div className="flex items-center gap-1 sm:gap-2">
          {hasAnyUrl ? (
            <>
              <button 
                onClick={() => window.open(f.fileUrl, "_blank")} 
                className="btn btn-primary btn-xs text-xs px-2 py-1"
              >
                View
              </button>
              <a 
                href={downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-outline btn-xs text-xs px-2 py-1"
              >
                Download
              </a>
            </>
          ) : (
            <span className="text-xs text-text-secondary">No file uploaded</span>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
        <div className="flex items-center justify-center w-full h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-4 sm:px-8 md:px-12 lg:px-20 py-5">
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 sm:p-6 w-full">
          <h3 className="text-error font-semibold mb-2 text-sm sm:text-base">Error</h3>
          <p className="text-text-secondary mb-4 text-xs sm:text-sm">{error}</p>
          <button className="btn btn-primary text-xs sm:text-sm px-3 py-2" onClick={fetchData}>Try again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-page text-text-primary">
      {/* Page Header */}
      <div className="px-10 py-6 pb-5">
        <div className="flex items-center gap-3 mb-0">
          <h1 className="text-2xl font-bold text-text-primary">View TA Documents</h1>
          <button
            className="p-2 text-sm font-medium border rounded-lg bg-bg-card text-text-primary hover:bg-primary-light/20 focus:outline-none focus:ring-2 focus:ring-primary-dark"
            onClick={() => setRefreshKey((prev) => prev + 1)}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Card */}
      <div className="gap-2 p-6 m-4 mt-0 rounded-xl shadow-sm bg-bg-card border border-border-default">
        {/* Tabs */}
        <div className="flex w-full border-b border-border-default mb-6">
          <button
            onClick={() => setActiveTab('undergraduate')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'undergraduate'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Undergraduates ({undergraduateCount})
          </button>
          <button
            onClick={() => setActiveTab('postgraduate')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'postgraduate'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Postgraduates ({postgraduateCount})
          </button>
        </div>

        {/* Controls section */}
        <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-start">
          <div className="flex flex-col items-stretch w-full gap-3 sm:flex-row sm:items-center lg:w-auto">
            {/* Search input */}
            <input
              type="text"
              placeholder="Search TAs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-dark bg-bg-card text-text-primary placeholder:text-text-secondary"
            />

            {/* Sorting TAs */}
            <div className="flex flex-col w-full gap-3 sm:flex-row sm:w-auto">
              <div className="relative inline-flex w-full overflow-hidden border rounded-lg shadow-sm border-border-default bg-bg-card group sm:w-auto">
                <select
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-4 py-2 pr-10 text-sm font-medium bg-transparent appearance-none cursor-pointer sm:w-auto text-text-secondary hover:bg-primary-light/20 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-dark"
                >
                  <option value="">Sort By</option>
                  <option value="name">Name (A–Z)</option>
                  <option value="indexNumber">Index Number (A–Z)</option>
                  <option value="modules">Accepted Modules (High → Low)</option>
                </select>

                <div className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 text-text-secondary group-hover:text-text-primary">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredTas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
              {paginatedTas.map(ta => (
                <CSEofficeCard 
                  key={ta.userId} 
                  ta={ta} 
                  onViewDocuments={openDocModal}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border-default">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-border-default bg-bg-card hover:bg-primary-light/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-bg-card transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 text-text-primary" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and pages around current
                    const showPage = 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    
                    const showEllipsisBefore = page === currentPage - 2 && currentPage > 3
                    const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2
                    
                    if (showEllipsisBefore || showEllipsisAfter) {
                      return <span key={page} className="px-2 text-text-secondary">...</span>
                    }
                    
                    if (!showPage) return null
                    
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-[2rem] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'border border-border-default bg-bg-card hover:bg-primary-light/20 text-text-primary'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-border-default bg-bg-card hover:bg-primary-light/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-bg-card transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4 text-text-primary" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center sm:py-12">
            <p className="text-base sm:text-lg text-text-secondary">
              {tas.length === 0 
                ? "No accepted TAs with submitted documents." 
                : activeTab === 'undergraduate'
                ? undergraduateCount === 0
                  ? "No undergraduate TAs with submitted documents."
                  : "No undergraduate TAs found matching your search."
                : postgraduateCount === 0
                  ? "No postgraduate TAs with submitted documents."
                  : "No postgraduate TAs found matching your search."}
            </p>
          </div>
        )}
      </div>

      {docModal?.open && docModal.ta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeDocModal}></div>
          <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border-default bg-bg-card">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center">
                  <FaUserGraduate className="text-sm sm:text-base" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base font-semibold text-text-primary truncate">{docModal.ta.name}</span>
                  <span className="text-xs text-text-secondary">{docModal.ta.indexNumber}</span>
                </div>
              </div>
              <button aria-label="Close" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md border border-border-default hover:bg-bg-page text-text-secondary flex items-center justify-center" onClick={closeDocModal}>
                <FaTimes className="text-sm" />
              </button>
            </div>
            <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto space-y-4 bg-white">
              {/* Personal Details Section */}
              {docModal.ta.personalDetails && (
                <div className="space-y-2">
                  <h3 className="text-sm sm:text-base font-semibold text-text-primary border-b border-border-default pb-2">Personal Details</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {docModal.ta.personalDetails.bankAccountName && (
                      <div className="flex flex-col p-2 sm:p-3 bg-bg-page/60 rounded border border-border-default">
                        <span className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Bank Account Name</span>
                        <span className="text-xs sm:text-sm font-medium text-text-primary mt-1">{docModal.ta.personalDetails.bankAccountName}</span>
                      </div>
                    )}
                    {docModal.ta.personalDetails.accountNumber && (
                      <div className="flex flex-col p-2 sm:p-3 bg-bg-page/60 rounded border border-border-default">
                        <span className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Account Number</span>
                        <span className="text-xs sm:text-sm font-medium text-text-primary mt-1">{docModal.ta.personalDetails.accountNumber}</span>
                      </div>
                    )}
                    {docModal.ta.personalDetails.nicNumber && (
                      <div className="flex flex-col p-2 sm:p-3 bg-bg-page/60 rounded border border-border-default">
                        <span className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">NIC Number</span>
                        <span className="text-xs sm:text-sm font-medium text-text-primary mt-1">{docModal.ta.personalDetails.nicNumber}</span>
                      </div>
                    )}
                    {docModal.ta.personalDetails.address && (
                      <div className="flex flex-col p-2 sm:p-3 bg-bg-page/60 rounded border border-border-default">
                        <span className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Address</span>
                        <span className="text-xs sm:text-sm font-medium text-text-primary mt-1">{docModal.ta.personalDetails.address}</span>
                      </div>
                    )}
                    
                  </div>
                </div>
              )}

              {/* Documents Section */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-semibold text-text-primary border-b border-border-default pb-2">Documents</h3>
                <div className="space-y-2">
                  {renderDoc('Bank Passbook Copy', docModal.ta.documents?.bankPassbook)}
                  {renderDoc('NIC Copy', docModal.ta.documents?.nicCopy)}
                  {renderDoc('CV', docModal.ta.documents?.cv)}
                  {docModal.ta.role === 'postgraduate' && renderDoc('Degree Certificate', docModal.ta.documents?.degreeCertificate)}
                  {renderDoc('Declaration Form', docModal.ta.documents?.declarationForm)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CSEofficeDashboard