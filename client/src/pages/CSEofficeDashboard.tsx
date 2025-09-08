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

// (legacy) TAItem retained in history; no longer used in new view

type AcceptedModule = { moduleId: string; moduleCode: string; moduleName: string; semester: number; year: number }
type TAView = { userId: string; name: string; indexNumber: string; acceptedModules: AcceptedModule[]; documents: Documents }

const CSEofficeDashboard = () => {
  const [tas, setTas] = useState<TAView[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
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

      {!loading && !error && tas.length === 0 && (<div>No accepted TAs with submitted documents.</div>)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tas.map(ta => (
          <div key={ta.userId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{ta.name} ({ta.indexNumber})</div>
                <div style={{ color: '#6b7280' }}>Accepted modules: {ta.acceptedModules.length}</div>
              </div>
              <button onClick={() => toggle(ta.userId)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}>
                {expanded[ta.userId] ? 'Hide' : 'View more'}
              </button>
            </div>

            {expanded[ta.userId] && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 600 }}>Accepted Modules</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {ta.acceptedModules.map(m => (
                    <li key={m.moduleId}>{m.moduleCode} — {m.moduleName} (Sem {m.semester}, {m.year})</li>
                  ))}
                </ul>
                <div style={{ fontWeight: 600, marginTop: 8 }}>Documents</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {renderDoc('Bank passbook copy', ta.documents.bankPassbookCopy)}
                  {renderDoc('NIC copy', ta.documents.nicCopy)}
                  {renderDoc('CV', ta.documents.cv)}
                  {renderDoc('Degree certificate', ta.documents.degreeCertificate)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CSEofficeDashboard