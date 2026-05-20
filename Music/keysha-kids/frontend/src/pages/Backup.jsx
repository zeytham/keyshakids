import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Database, Download, Trash2, RefreshCw, Shield, Clock, CheckCircle } from 'lucide-react'

const formatSize = (size) => size
const formatDate = (date) => new Date(date).toLocaleString('sw-TZ')

export default function Backup() {
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => (await api.get('/backups')).data.data,
    refetchInterval: 30000,
  })

  const createBackup = useMutation({
    mutationFn: () => api.post('/backups'),
    onMutate: () => setCreating(true),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['backups'])
      toast.success('Backup imefanywa vizuri!')
      setCreating(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Backup imeshindwa!')
      setCreating(false)
    },
  })

  const deleteBackup = useMutation({
    mutationFn: (filename) => api.delete(`/backups/${filename}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['backups'])
      toast.success('Backup imefutwa!')
    },
    onError: () => toast.error('Imeshindwa kufuta!'),
  })

  const handleDownload = (filename) => {
    const token = localStorage.getItem('token')
    window.open(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/backups/download/${filename}`,
      '_blank'
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Backup ya Data</div>
          <div className="page-sub">Salimisha data ya biashara yako</div>
        </div>
        <button className="btn btn-primary"
          onClick={() => createBackup.mutate()}
          disabled={creating}>
          {creating
            ? <><div className="spinner" /> Inafanya Backup...</>
            : <><Database size={15} /> Fanya Backup Sasa</>
          }
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid-3">
        {[
          { icon: Shield, color: '#2E7D32', bg: '#E8F5E9', label: 'Usalama wa Data', value: 'Imehifadhiwa', sub: 'PostgreSQL backup' },
          { icon: Clock, color: '#1565C0', bg: '#E3F2FD', label: 'Auto Backup', value: 'Kila Usiku', sub: 'Saa 2:00 asubuhi' },
          { icon: Database, color: 'var(--purple)', bg: 'var(--purple-light)', label: 'Backups Zilizohifadhiwa', value: `${data?.length || 0}`, sub: 'Max 10 huhifadhiwa' },
        ].map(({ icon: Icon, color, bg, label, value, sub }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} style={{ color }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.25, borderRadius: '0 0 12px 12px' }} />
          </div>
        ))}
      </div>

      {/* Backups List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-light)', background: '#FAFAFA' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            📦 Orodha ya Backups
          </div>
          <button className="btn btn-ghost" onClick={() => queryClient.invalidateQueries(['backups'])}
            style={{ padding: '5px 10px', fontSize: '11px' }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="skeleton" style={{ height: '14px', width: '40%' }} />
                <div className="skeleton" style={{ height: '14px', width: '15%' }} />
                <div className="skeleton" style={{ height: '14px', width: '20%' }} />
              </div>
            ))}
          </div>
        ) : data?.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px' }}>
            <Database size={40} />
            <p>Hakuna backups bado</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Bonyeza "Fanya Backup Sasa" kuanza!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jina la Faili</th>
                  <th>Ukubwa</th>
                  <th>Tarehe</th>
                  <th style={{ textAlign: 'center' }}>Vitendo</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((backup, index) => (
                  <tr key={backup.filename}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {index + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Database size={13} style={{ color: '#2E7D32' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {backup.filename}
                          </div>
                          {index === 0 && (
                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#2E7D32', background: '#E8F5E9', padding: '1px 6px', borderRadius: '8px' }}>
                              ✓ Hivi Karibuni
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {backup.size}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {formatDate(backup.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleDownload(backup.filename)}
                          title="Download Backup"
                          style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#E8F5E9', color: '#2E7D32', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                          <Download size={12} /> Pakua
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Futa backup "${backup.filename}"?`)) deleteBackup.mutate(backup.filename) }}
                          title="Futa Backup"
                          style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#FFEBEE', color: '#C62828', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warning */}
      <div style={{ padding: '14px 16px', borderRadius: '12px', background: '#FFF8E1', border: '1px solid #FFE082', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#E65100', marginBottom: '4px' }}>Muhimu — Backup ya Kawaida!</div>
          <div style={{ fontSize: '11px', color: '#E65100', lineHeight: 1.6 }}>
            Fanya backup angalau mara moja kwa wiki. Hifadhi backup katika mahali salama kama Google Drive au USB. Backup inakusaidia kurejesha data yako kama kuna tatizo la kompyuta.
          </div>
        </div>
      </div>
    </div>
  )
}