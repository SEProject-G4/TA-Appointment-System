import { useEffect, useState } from 'react'
import axios from '../../api/axiosConfig'
import { FaTimes, FaUserGraduate } from 'react-icons/fa'
import { ChevronDown, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import CSEofficeCard from '../../components/cse office/CSEofficeCard'

// --- Types ---
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
  address: string
  nicNumber: string
  accountNumber: string
}

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

type GroupedData = {
  recSeriesId: string;
  recSeriesName: string;
  tas: TAView[];
}

const ITEMS_PER_PAGE = 6; // Keeps the UI compact (2 rows of 3 on large screens)

// --- Sub-Component: Individual Series Section ---
// This isolates the search, filter, and pagination state per recruitment round
const RecruitmentSeriesSection = ({ 
  group, 
  onViewDocuments 
}: { 
  group: GroupedData; 
  onViewDocuments: (ta: TAView) => void 
}) => {
  const [activeTab, setActiveTab] = useState<'undergraduate' | 'postgraduate'>('undergraduate')
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortOption, setSortOption] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Reset to page 1 if filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab, sortOption])

  // Process data for this specific group
  let processedTas = group.tas.filter(ta => {
    if (ta.role !== activeTab) return false
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const name = ta.name?.toLowerCase() || ""
      const indexNumber = ta.indexNumber?.toLowerCase() || ""
      return name.includes(query) || indexNumber.includes(query)
    }
    return true
  })

  // Sort
  if (sortOption === "name") {
    processedTas.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortOption === "indexNumber") {
    processedTas.sort((a, b) => a.indexNumber.localeCompare(b.indexNumber))
  } else if (sortOption === "modules") {
    processedTas.sort((a, b) => b.acceptedModules.length - a.acceptedModules.length)
  }

  // Counts for tabs
  const undergradCount = group.tas.filter(ta => ta.role === 'undergraduate').length
  const postgradCount = group.tas.filter(ta => ta.role === 'postgraduate').length

  // Pagination logic
  const totalPages = Math.ceil(processedTas.length / ITEMS_PER_PAGE) || 1
  const paginatedTas = processedTas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  )

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages))
  }

  return (
    <div className="p-6 mb-8 border shadow-sm rounded-xl bg-bg-card border-border-default">
      {/* Series Header */}
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border-default">
        <div className="w-2 h-6 rounded-full bg-primary"></div>
        <h2 className="text-xl font-bold text-text-primary">
          {group.recSeriesName}
        </h2>
        <span className="px-2.5 py-0.5 ml-2 text-xs font-medium rounded-full bg-primary/10 text-primary-dark">
          {group.tas.length} Total Submissions
        </span>
      </div>

      {/* Local Tabs */}
      <div className="flex w-full mb-6 border-b border-border-default">
        <button
          onClick={() => setActiveTab('undergraduate')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'undergraduate'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Undergraduates ({undergradCount})
        </button>
        <button
          onClick={() => setActiveTab('postgraduate')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'postgraduate'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Postgraduates ({postgradCount})
        </button>
      </div>

      {/* Local Controls */}
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-start">
        <div className="flex flex-col items-stretch w-full gap-3 sm:flex-row sm:items-center lg:w-auto">
          <input
            type="text"
            placeholder="Search within this round"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-dark bg-bg-page text-text-primary placeholder:text-text-secondary"
          />

          <div className="relative inline-flex w-full overflow-hidden border rounded-lg shadow-sm border-border-default bg-bg-page group sm:w-auto">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
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

      {/* Local Grid Render */}
      {paginatedTas.length > 0 ? (
        <>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {paginatedTas.map(ta => (
              <CSEofficeCard 
                key={ta.userId} 
                ta={ta} 
                onViewDocuments={onViewDocuments}
              />
            ))}
          </div>

          {/* Local Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 mt-6 border-t border-border-default">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 transition-colors border rounded-lg border-border-default bg-bg-page hover:bg-primary-light/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-text-primary" />
              </button>
              
              <div className="flex items-center gap-1">
                <span className="px-3 text-sm text-text-secondary">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 transition-colors border rounded-lg border-border-default bg-bg-page hover:bg-primary-light/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-text-primary" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-8 text-center sm:py-12 border-2 border-dashed border-border-default rounded-xl">
          <p className="text-sm sm:text-base text-text-secondary">
            No TAs found matching your search in this round.
          </p>
        </div>
      )}
    </div>
  )
}

// --- Main Page Component ---
const CSEofficeDashboard = () => {
  const [isZipping, setIsZipping] = useState(false);
  const [groupedData, setGroupedData] = useState<GroupedData[]>([])
  const [docModal, setDocModal] = useState<{ open: boolean; ta?: TAView }>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get('/cse-office/view-ta-documents')
      setGroupedData(res.data?.groupedData || [])
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  const handleDownloadAllZip = async () => {
    if (!docModal?.ta?.documentId) return;
    
    setIsZipping(true);
    try {
      // Pass only the documentId and the name (for the zip file title)
      const response = await axios.post('/documents/zip', {
        documentId: docModal.ta.documentId,
        taName: docModal.ta.name
      }, {
        responseType: 'blob' // CRITICAL for binary files
      });

      // Trigger the browser download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docModal.ta.name.replace(/\s+/g, "_")}_Documents.zip`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error downloading zip:", error);
      alert("Failed to create ZIP file. Please try downloading files individually.");
    } finally {
      setIsZipping(false);
    }
  };

  const openDocModal = (ta: TAView) => setDocModal({ open: true, ta })
  const closeDocModal = () => setDocModal({ open: false })

  const renderDoc = (label: string, f?: FileMeta) => {
    if (!f) return null
    const hasAnyUrl = Boolean(f.viewLink)

    return (
      <div className="flex items-center justify-between p-2 bg-white border rounded sm:p-3 border-border-default">
        <span className="text-xs font-medium truncate sm:text-sm text-text-primary">{label}</span>
        <div className="flex items-center gap-1 sm:gap-2">
          {hasAnyUrl ? (
            <>
              <button onClick={() => window.open(f.viewLink, "_blank")} className="px-2 py-1 text-xs btn btn-primary btn-xs">
                View
              </button>
              {f.downloadLink && (
                <a href={f.downloadLink} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs btn btn-outline btn-xs">
                  Download
                </a>
              )}
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
      <div className="flex flex-col items-start justify-start w-full min-h-screen px-4 py-5 bg-bg-page text-text-primary sm:px-8 md:px-12 lg:px-20">
        <div className="flex items-center justify-center w-full h-64">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start justify-start w-full min-h-screen px-4 py-5 bg-bg-page text-text-primary sm:px-8 md:px-12 lg:px-20">
        <div className="w-full p-4 border rounded-lg bg-error/10 border-error/20 sm:p-6">
          <h3 className="mb-2 text-sm font-semibold text-error sm:text-base">Error</h3>
          <p className="mb-4 text-xs text-text-secondary sm:text-sm">{error}</p>
          <button className="px-3 py-2 text-xs btn btn-primary sm:text-sm" onClick={fetchData}>Try again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-page text-text-primary">
      {/* Global Page Header */}
      <div className="px-4 py-6 pb-5 sm:px-10">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-bold text-text-primary">TA Document Submissions</h1>
          <button
            className="p-2 text-sm font-medium transition-colors border rounded-lg bg-bg-card text-text-primary hover:bg-primary-light/20 focus:outline-none focus:ring-2 focus:ring-primary-dark"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Render Each Recruitment Series Independently */}
      <div className="px-4 sm:px-10">
        {groupedData.length > 0 ? (
          groupedData.map((group) => (
            <RecruitmentSeriesSection 
              key={group.recSeriesId} 
              group={group} 
              onViewDocuments={openDocModal} 
            />
          ))
        ) : (
          <div className="py-12 mt-4 text-center border shadow-sm rounded-xl bg-bg-card border-border-default">
            <p className="text-lg text-text-secondary">
              No active recruitment rounds with submitted documents found.
            </p>
          </div>
        )}
      </div>

      {/* Global Document Modal */}
      {docModal?.open && docModal.ta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeDocModal}></div>
          <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl overflow-hidden bg-white shadow-2xl rounded-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b sm:px-5 sm:py-4 border-border-default bg-bg-card">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-full sm:h-10 sm:w-10 bg-primary/10 text-primary-dark">
                  <FaUserGraduate className="text-base sm:text-xl" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold truncate sm:text-base text-text-primary">{docModal.ta.name}</span>
                  <span className="text-sm text-text-primary">{docModal.ta.indexNumber}</span>
                  <a href={`mailto:${docModal.ta.email}`} className="text-[10px] sm:text-xs text-text-secondary truncate">{docModal.ta.email}</a>
                </div>
              </div>
              <button aria-label="Close" className="flex items-center justify-center w-7 h-7 border rounded-md sm:h-8 sm:w-8 border-border-default hover:bg-bg-page text-text-secondary" onClick={closeDocModal}>
                <FaTimes className="text-sm" />
              </button>
            </div>
            
            <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto space-y-5 bg-bg-page/30">
              
              {/* Accepted Modules */}
              {docModal.ta.acceptedModules && docModal.ta.acceptedModules.length > 0 && (
                <div className="p-4 bg-white border rounded-lg shadow-sm border-border-default">
                  <h3 className="pb-2 text-sm font-semibold border-b sm:text-base text-text-primary border-border-default">Assigned Modules</h3>
                  <div className="grid grid-cols-1 gap-2 mt-3 sm:grid-cols-2">
                    {docModal.ta.acceptedModules.map(mod => (
                      <div key={mod.moduleId} className="p-2.5 border rounded bg-primary-light/5 border-primary-light/20">
                        <p className="text-sm font-bold text-primary-dark">{mod.moduleCode}</p>
                        <p className="text-sm truncate text-text-primary">{mod.moduleName}</p>
                        <p className="text-xs text-text-secondary mt-1">TA Hours: {mod.taHours}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Details */}
              {docModal.ta.personalDetails && (
                <div className="p-4 bg-white border rounded-lg shadow-sm border-border-default">
                  <h3 className="pb-2 text-sm font-semibold border-b sm:text-base text-text-primary border-border-default">Personal Details</h3>
                  <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
                    {docModal.ta.personalDetails.bankAccountName && (
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Bank Account Name</span>
                        <span className="text-xs font-medium sm:text-sm text-text-primary">{docModal.ta.personalDetails.bankAccountName}</span>
                      </div>
                    )}
                    {docModal.ta.personalDetails.accountNumber && (
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Account Number</span>
                        <span className="text-xs font-medium sm:text-sm text-text-primary">{docModal.ta.personalDetails.accountNumber}</span>
                      </div>
                    )}
                    {docModal.ta.personalDetails.nicNumber && (
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">NIC Number</span>
                        <span className="text-xs font-medium sm:text-sm text-text-primary">{docModal.ta.personalDetails.nicNumber}</span>
                      </div>
                    )}
                    {docModal.ta.personalDetails.address && (
                      <div className="flex flex-col sm:col-span-2">
                        <span className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Address</span>
                        <span className="text-xs font-medium sm:text-sm text-text-primary">{docModal.ta.personalDetails.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div className="p-4 bg-white border rounded-lg shadow-sm border-border-default">
                <div className="flex items-center justify-between pb-2 border-b border-border-default">
                  <h3 className="text-sm font-semibold sm:text-base text-text-primary">Uploaded Documents</h3>
                  
                  {/* NEW ZIP BUTTON */}
                  <button 
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white transition-colors rounded bg-primary hover:bg-primary-dark disabled:opacity-50"
                  >
                    {isZipping ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        Zipping...
                      </>
                    ) : (
                      "Download All (ZIP)"
                    )}
                  </button>
                </div>
                <div className="mt-3 space-y-2">
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