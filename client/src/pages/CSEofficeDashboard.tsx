import { useEffect, useState } from 'react'
import axios from '../api/axiosConfig'

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

type TAItem = {
  userId: string
  name: string
  indexNumber: string
  documents: Documents
  documentSummary: { submittedCount: number; total: number; allSubmitted: boolean }
}

type ModuleItem = {
  moduleId: string
  moduleCode: string
  moduleName: string
  semester: number
  year: number
  requiredTAHours?: number
  requiredTACount?: number
  approvedTAs: TAItem[]
}

const CSEofficeDashboard = () => {
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get('/cse-office/view-ta-documents')
        setModules(res.data?.modules || [])
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const renderDoc = (label: string, f?: FileMeta) => {
    const submitted = Boolean(f?.submitted)
    const fileUrl = f?.fileUrl
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ minWidth: 160 }}>{label}</span>
        <span style={{ color: submitted ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
          {submitted ? 'Submitted' : 'Not submitted'}
        </span>
        {submitted && fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2563eb', textDecoration: 'underline' }}
          >
            Download
          </a>
        ) : null}
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>CSE Office — Accepted TAs & Documents</h2>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}

      {!loading && !error && modules.length === 0 && (
        <div>No accepted TAs found.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {modules.map(m => (
          <div key={m.moduleId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{m.moduleCode} — {m.moduleName}</div>
                <div style={{ color: '#6b7280' }}>Sem {m.semester}, {m.year}</div>
                <div style={{ color: '#6b7280' }}>Approved TAs: {m.approvedTAs.length}</div>
              </div>
              <button onClick={() => toggle(m.moduleId)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}>
                {expanded[m.moduleId] ? 'Hide' : 'View more'}
              </button>
            </div>

            {expanded[m.moduleId] && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {m.approvedTAs.map(ta => (
                  <div key={ta.userId} style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{ta.name} ({ta.indexNumber})</div>
                        <div style={{ color: '#6b7280' }}>
                          Documents submitted: {ta.documentSummary.submittedCount}/{ta.documentSummary.total}
                          {ta.documentSummary.allSubmitted ? ' — All complete' : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {renderDoc('Bank passbook copy', ta.documents.bankPassbookCopy)}
                      {renderDoc('NIC copy', ta.documents.nicCopy)}
                      {renderDoc('CV', ta.documents.cv)}
                      {renderDoc('Degree certificate', ta.documents.degreeCertificate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CSEofficeDashboard