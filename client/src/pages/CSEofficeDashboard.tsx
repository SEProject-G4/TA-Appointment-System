import { useEffect, useState } from 'react'
import axios from '../api/axiosConfig'
import { FaChevronRight, FaTimes, FaUserGraduate } from 'react-icons/fa'

type FileMeta = {
  submitted?: boolean
  fileUrl?: string
  fileName?: string
  uploadedAt?: string
}

type Documents = {
  bankPassbookCopy: FileMeta
  nicCopy: FileMeta
  cv: FileMeta
  degreeCertificate: FileMeta
}

// (legacy) TAItem retained in history; no longer used in new view

type AcceptedModule = { moduleId: string; moduleCode: string; moduleName: string; semester: number; year: number }
type TAView = { userId: string; name: string; indexNumber: string; acceptedModules: AcceptedModule[]; documents: Documents }

const CSEofficeDashboard = () => {
  const [tas, setTas] = useState<TAView[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
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

  const toggleRow = (index: number) => {
    const next = new Set(expandedRows)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setExpandedRows(next)
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
      <div className="flex items-center justify-between p-2 bg-white rounded border border-border-default">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <div className="flex items-center gap-2">
          {hasAnyUrl ? (
            <>
              <button 
                onClick={() => window.open(f.fileUrl, "_blank")} 
                className="btn btn-primary btn-xs"
              >
                View
              </button>
              <a 
                href={downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-outline btn-xs"
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

  return (
    <div className="min-h-screen w-full flex flex-col items-start justify-start bg-bg-page text-text-primary px-20 py-5">
      <div className="mb-8 w-full flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-montserrat mb-2">View TA Documents</h1>
          <p className="text-text-secondary font-raleway">TAs with submitted documents and their accepted modules</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setViewMode('list')}
          >
            List view
          </button>
          <button 
            className={`btn ${viewMode === 'card' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setViewMode('card')}
          >
            Card view
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center w-full h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-6 w-full">
          <h3 className="text-error font-semibold mb-2">Error</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
        </div>
      )}

      {!loading && !error && tas.length === 0 && (
        <div className="bg-bg-card border border-border-default rounded-lg p-6 w-full">
          <p className="text-text-secondary">No accepted TAs with submitted documents.</p>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="flex bg-bg-card flex-col items-center rounded-sm p-2 w-full">
          <div className="w-full space-y-4">
            {tas.map((ta, index) => {
              const isOpen = expandedRows.has(index)
              return (
                <div key={ta.userId} className="flex w-full flex-col items-center outline-dashed outline-1 rounded-md p-0 bg-bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex w-full items-center justify-between px-4 py-3">
                    <div className="flex items-center">
                      <FaChevronRight
                        className={`p-1 h-6 w-6 rounded-full hover:bg-primary/10 text-text-secondary cursor-pointer transition-transform ease-in-out duration-100 ${isOpen ? 'rotate-90' : ''}`}
                        onClick={() => toggleRow(index)}
                      />
                      <div className="flex items-center gap-3 ml-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center">
                          <FaUserGraduate />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-text-primary font-semibold">{ta.name}</span>
                          <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xs text-text-secondary">Accepted Modules</div>
                        <div className="text-sm font-semibold text-text-primary">{ta.acceptedModules.length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-border-default"></div>

                  <div className={`panel w-full ${isOpen ? 'panel-open' : 'panel-closed'} p-4 space-y-4`}>
                    <div>
                      <div className="text-sm font-semibold text-text-primary mb-2">Accepted Modules</div>
                      <div role="list" className="space-y-2">
                        {ta.acceptedModules.map(m => (
                          <div
                            role="listitem"
                            key={m.moduleId}
                            className="flex items-center justify-between rounded-md border border-border-default bg-bg-page/60 px-3 py-2"
                          >
                            <div className="flex flex-col text-sm leading-tight">
                              <span className="font-bold text-black">{m.moduleCode}</span>
                              <span className="text-text-secondary">{m.moduleName}</span>
                            </div>
                            <span className="text-[11px] md:text-xs rounded-full bg-primary/10 text-primary-dark px-2 py-1 whitespace-nowrap">
                              Sem {m.semester}, {m.year}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button className="btn btn-outline btn-sm" onClick={() => openDocModal(ta)}>View documents</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {tas.map(ta => (
            <div key={ta.userId} className="flex w-full flex-col items-center outline-dashed outline-1 rounded-md p-0 bg-bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex w-full items-center justify-between p-4 border-b border-border-default">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center">
                    <FaUserGraduate />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-primary font-semibold">{ta.name}</span>
                    <span className="text-xs text-text-secondary">{ta.indexNumber}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-secondary">Accepted Modules</div>
                  <div className="text-sm font-semibold text-text-primary">{ta.acceptedModules.length}</div>
                </div>
              </div>
              <div className="p-4 space-y-3 w-full">
                <div>
                  <div className="text-sm font-semibold text-text-primary mb-2">Accepted Modules</div>
                  <div role="list" className="space-y-2">
                    {ta.acceptedModules.map(m => (
                      <div
                        role="listitem"
                        key={m.moduleId}
                        className="flex items-center justify-between rounded-md border border-border-default bg-bg-page/60 px-3 py-2"
                      >
                        <div className="flex flex-col text-sm leading-tight">
                          <span className="font-bold text-black">{m.moduleCode}</span>
                          <span className="text-text-secondary">{m.moduleName}</span>
                        </div>
                        <span className="text-[11px] md:text-xs rounded-full bg-primary/10 text-primary-dark px-2 py-1 whitespace-nowrap">
                          Sem {m.semester}, {m.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="btn btn-outline btn-sm" onClick={() => openDocModal(ta)}>View documents</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {docModal?.open && docModal.ta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeDocModal}></div>
          <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-bg-card">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center">
                  <FaUserGraduate />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-text-primary">{docModal.ta.name}</span>
                  <span className="text-xs text-text-secondary">{docModal.ta.indexNumber}</span>
                </div>
              </div>
              <button aria-label="Close" className="h-8 w-8 rounded-md border border-border-default hover:bg-bg-page text-text-secondary flex items-center justify-center" onClick={closeDocModal}>
                <FaTimes />
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-2 bg-white">
              {renderDoc('Bank Passbook Copy', docModal.ta.documents?.bankPassbookCopy)}
              {renderDoc('NIC Copy', docModal.ta.documents?.nicCopy)}
              {renderDoc('CV', docModal.ta.documents?.cv)}
              {renderDoc('Degree Certificate', docModal.ta.documents?.degreeCertificate)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CSEofficeDashboard