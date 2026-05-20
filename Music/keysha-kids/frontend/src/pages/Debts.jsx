import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Search, CreditCard, X, CheckCircle, Printer, TrendingDown, Clock, AlertCircle } from 'lucide-react'

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay">
    <div className="modal-box" style={{ maxWidth: '440px' }}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
)

const formatCurrency = (amount) => `TZS ${parseFloat(amount || 0).toLocaleString()}`

const printDebtReceipt = (receipt) => {
  const win = window.open('', '_blank', 'width=400,height=500')
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Receipt - ${receipt.receiptNumber?.slice(0,8).toUpperCase()}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Courier New',monospace;font-size:12px;padding:16px;max-width:300px;margin:0 auto}
      .c{text-align:center}.b{font-weight:bold}
      .line{border-top:1px dashed #000;margin:8px 0}
      .row{display:flex;justify-content:space-between;margin:3px 0}
      .logo{width:52px;height:52px;border-radius:50%;object-fit:cover;margin:0 auto 6px;display:block}
      .footer{margin-top:12px;font-size:10px;text-align:center;color:#555}
      @media print{body{padding:4px}}
    </style></head><body>
    <div class="c">
      <img src="/logo.jpeg" class="logo" onerror="this.style.display='none'"/>
      <div class="b" style="font-size:14px">Keysha Kids Collection</div>
      <div>RECEIPT YA MALIPO YA DENI</div>
    </div>
    <div class="line"></div>
    <div class="row"><span>Receipt No:</span><span class="b">#${receipt.receiptNumber?.slice(0,8).toUpperCase()}</span></div>
    <div class="row"><span>Tarehe:</span><span>${new Date(receipt.paymentDate).toLocaleString('sw-TZ')}</span></div>
    <div class="row"><span>Mteja:</span><span class="b">${receipt.customerName}</span></div>
    <div class="row"><span>Simu:</span><span>${receipt.customerPhone}</span></div>
    <div class="row"><span>Aliyopokea:</span><span>${receipt.receivedBy}</span></div>
    <div class="line"></div>
    <div class="row b"><span>Kiasi Kilicholipwa:</span><span>${formatCurrency(receipt.amountPaid)}</span></div>
    <div class="row"><span>Deni Lililobaki:</span><span>${formatCurrency(receipt.remainingDebt)}</span></div>
    <div class="row"><span>Hali:</span><span>${receipt.status === 'PAID' ? 'LIMELIPWA KABISA' : 'BADO LIPO'}</span></div>
    <div class="line"></div>
    <div class="footer">
      <p>Asante kwa malipo yako!</p>
      <p>📞 0622146487 | 0626030263</p>
      <p>@keysha_kids_collection</p>
    </div>
    <script>window.onload=()=>window.print()</script>
    </body></html>
  `)
  win.document.close()
}

export default function Debts() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [payForm, setPayForm] = useState({ amountPaid: '' })
  const [receipt, setReceipt] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['debts', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 15, ...(statusFilter && { status: statusFilter }) })
      return (await api.get(`/debts?${params}`)).data
    },
  })

  const payDebt = useMutation({
    mutationFn: ({ id, data }) => api.post(`/debts/${id}/pay`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['debts'])
      queryClient.invalidateQueries(['customers'])
      queryClient.invalidateQueries(['dashboard-debts'])
      setReceipt(res.data.data.receipt)
      setModal('receipt')
      toast.success('Malipo yamepokewa!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const handlePay = (e) => {
    e.preventDefault()
    if (!payForm.amountPaid || parseFloat(payForm.amountPaid) <= 0) return toast.error('Weka kiasi!')
    payDebt.mutate({ id: selected.id, data: payForm })
  }

  const filteredData = data?.data?.filter(debt =>
    !search ||
    debt.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    debt.customer?.phone?.includes(search)
  )

  const totalPending = data?.data?.filter(d => d.status === 'PENDING').length || 0
  const totalPartial = data?.data?.filter(d => d.status === 'PARTIAL').length || 0
  const totalPaid = data?.data?.filter(d => d.status === 'PAID').length || 0
  const totalDebtAmount = data?.data?.reduce((s, d) => s + parseFloat(d.remainingAmount || 0), 0) || 0

  // ═══ MOBILE DEBT CARD ═══
  const MobileDebtCard = ({ debt }) => {
    const paidPct = Math.min(100, (parseFloat(debt.paidAmount) / parseFloat(debt.totalAmount)) * 100)
    return (
      <div style={{
        background: 'white', borderRadius: '12px', padding: '14px',
        border: '1px solid var(--border-light)', marginBottom: '8px',
        borderLeft: `3px solid ${
          debt.status === 'PAID' ? '#2E7D32' :
          debt.status === 'PARTIAL' ? '#FF6F00' : '#C62828'
        }`,
      }}>
        {/* Top Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--gradient)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '13px', flexShrink: 0,
            }}>
              {debt.customer?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {debt.customer?.name}
              </div>
              {debt.customer?.phone && !debt.customer.phone.startsWith('guest_') && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  📞 {debt.customer.phone}
                </div>
              )}
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {new Date(debt.createdAt).toLocaleDateString('sw-TZ')}
              </div>
            </div>
          </div>
          <span className={`badge ${
            debt.status === 'PAID' ? 'badge-success' :
            debt.status === 'PARTIAL' ? 'badge-warning' : 'badge-danger'
          }`}>
            {debt.status}
          </span>
        </div>

        {/* Amounts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '10px' }}>
          {[
            { label: 'JUMLA', value: formatCurrency(debt.totalAmount), color: 'var(--text-primary)', bg: '#F9FAFB' },
            { label: 'LILILIPWA', value: formatCurrency(debt.paidAmount), color: '#2E7D32', bg: '#E8F5E9' },
            { label: 'LILILOBAKI', value: formatCurrency(debt.remainingAmount), color: debt.status === 'PAID' ? '#2E7D32' : '#C62828', bg: debt.status === 'PAID' ? '#E8F5E9' : '#FFEBEE' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ padding: '8px 6px', background: bg, borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '10px' }}>
          <div className="progress-bar" style={{ height: '6px' }}>
            <div className="progress-fill" style={{
              width: `${paidPct}%`,
              background: paidPct === 100 ? '#2E7D32' : 'var(--gradient)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Maendeleo ya malipo</span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>{Math.round(paidPct)}%</span>
          </div>
        </div>

        {/* Action Button */}
        {debt.status !== 'PAID' ? (
          <button
            onClick={() => { setSelected(debt); setPayForm({ amountPaid: '' }); setModal('pay') }}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px' }}>
            <CheckCircle size={15} /> Pokea Malipo
          </button>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px', background: '#E8F5E9', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#2E7D32' }}>
            ✅ Deni Limelipwa Kabisa!
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Madeni</div>
          <div className="page-sub">{data?.pagination?.total || 0} madeni yote kwenye mfumo</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
        {[
          { label: 'Jumla ya Madeni', value: formatCurrency(totalDebtAmount), icon: TrendingDown, color: '#C62828', bg: '#FFEBEE' },
          { label: 'Pending', value: totalPending, icon: AlertCircle, color: '#C62828', bg: '#FFEBEE' },
          { label: 'Partial', value: totalPartial, icon: Clock, color: '#FF6F00', bg: '#FFF8E1' },
          { label: 'Yaliyolipwa', value: totalPaid, icon: CheckCircle, color: '#2E7D32', bg: '#E8F5E9' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={13} style={{ color }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color }}>{value}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.25, borderRadius: '0 0 12px 12px' }} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div className="input-wrap" style={{ flex: 1, minWidth: '160px' }}>
          <span className="input-icon"><Search size={14} /></span>
          <input className="input" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tafuta kwa jina au simu..." />
        </div>
        <select className="input" style={{ width: isMobile ? '100%' : '160px' }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Hali Zote</option>
          <option value="PENDING">🔴 Pending</option>
          <option value="PARTIAL">🟠 Partial</option>
          <option value="PAID">🟢 Paid</option>
        </select>
        {(search || statusFilter) && (
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}>
            <X size={13} /> Futa
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '13px', width: '40%', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ height: '10px', width: '25%' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: '36px', borderRadius: '8px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '32px', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      ) : filteredData?.length === 0 ? (
        <div className="card empty-state">
          <CreditCard size={40} />
          <p>Hakuna madeni — vizuri sana! 🎉</p>
        </div>
      ) : isMobile ? (
        // ═══ MOBILE — Cards ═══
        <div>
          {filteredData?.map(debt => <MobileDebtCard key={debt.id} debt={debt} />)}
        </div>
      ) : (
        // ═══ DESKTOP — Table ═══
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mteja</th>
                  <th>Tarehe</th>
                  <th>Jumla</th>
                  <th>Lililipwa</th>
                  <th>Lililobaki</th>
                  <th>Maendeleo</th>
                  <th>Hali</th>
                  <th style={{ textAlign: 'center' }}>Vitendo</th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.map((debt) => {
                  const paidPct = Math.min(100, (parseFloat(debt.paidAmount) / parseFloat(debt.totalAmount)) * 100)
                  return (
                    <tr key={debt.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
                            {debt.customer?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{debt.customer?.name}</div>
                            {debt.customer?.phone && !debt.customer.phone.startsWith('guest_') && (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{debt.customer.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(debt.createdAt).toLocaleDateString('sw-TZ')}
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {formatCurrency(debt.totalAmount)}
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 700, color: '#2E7D32' }}>
                        {formatCurrency(debt.paidAmount)}
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 800, color: debt.status === 'PAID' ? '#2E7D32' : '#C62828' }}>
                        {formatCurrency(debt.remainingAmount)}
                      </td>
                      <td style={{ minWidth: '80px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div className="progress-bar" style={{ height: '5px' }}>
                            <div className="progress-fill" style={{ width: `${paidPct}%`, background: paidPct === 100 ? '#2E7D32' : 'var(--gradient)' }} />
                          </div>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{Math.round(paidPct)}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          debt.status === 'PAID' ? 'badge-success' :
                          debt.status === 'PARTIAL' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {debt.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          {debt.status !== 'PAID' ? (
                            <button
                              onClick={() => { setSelected(debt); setPayForm({ amountPaid: '' }); setModal('pay') }}
                              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'var(--pink-light)', color: 'var(--pink)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                              <CheckCircle size={11} /> Lipa
                            </button>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#2E7D32', fontWeight: 600 }}>✅ Limelipwa</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Ukurasa {page} / {data?.pagination?.totalPages}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>←</button>
            <button className="btn btn-ghost" onClick={() => setPage(p=>p+1)} disabled={page>=data?.pagination?.totalPages}>→</button>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {modal === 'pay' && selected && (
        <Modal title={`💳 Pokea Malipo — ${selected.customer?.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#FFEBEE', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.customer?.name}</div>
                  {selected.customer?.phone && !selected.customer.phone.startsWith('guest_') && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selected.customer.phone}</div>
                  )}
                </div>
                <span className={`badge ${selected.status === 'PARTIAL' ? 'badge-warning' : 'badge-danger'}`}>
                  {selected.status}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '8px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>JUMLA</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(selected.totalAmount)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '8px' }}>
                  <div style={{ fontSize: '9px', color: '#C62828', fontWeight: 700, marginBottom: '4px' }}>LILILOBAKI</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#C62828' }}>{formatCurrency(selected.remainingAmount)}</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Kiasi cha Malipo (TZS) *</label>
              <input className="input" type="number" value={payForm.amountPaid}
                onChange={e => setPayForm({ amountPaid: e.target.value })}
                placeholder="0" max={selected.remainingAmount} autoFocus
                style={{ fontSize: '20px', fontWeight: 800, textAlign: 'center' }} />
            </div>

            <button type="button"
              onClick={() => setPayForm({ amountPaid: selected.remainingAmount })}
              style={{ padding: '10px', borderRadius: '8px', border: '1.5px dashed var(--purple)', background: 'var(--purple-light)', color: 'var(--purple)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              ✓ Lipa Yote — {formatCurrency(selected.remainingAmount)}
            </button>

            <button type="submit" disabled={payDebt.isPending} className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13px' }}>
              {payDebt.isPending
                ? <><div className="spinner" /> Inapokea...</>
                : <><CheckCircle size={16} /> Pokea Malipo</>
              }
            </button>
          </form>
        </Modal>
      )}

      {/* Receipt Modal */}
      {modal === 'receipt' && receipt && (
        <Modal title="✅ Receipt ya Malipo" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'white', border: '1px dashed var(--border)', borderRadius: '10px', padding: '16px', fontFamily: 'monospace' }}>
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <img src="/logo.jpeg" alt="Logo" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 6px', display: 'block' }} onError={e => e.target.style.display='none'} />
                <div style={{ fontWeight: 800, fontSize: '13px' }}>Keysha Kids Collection</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RECEIPT YA MALIPO YA DENI</div>
                <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />
              </div>
              {[
                { label: 'Receipt No', value: `#${receipt.receiptNumber?.slice(0,8).toUpperCase()}`, bold: true },
                { label: 'Mteja', value: receipt.customerName, bold: true },
                { label: 'Simu', value: receipt.customerPhone },
                { label: 'Aliyopokea', value: receipt.receivedBy },
                { label: 'Tarehe', value: new Date(receipt.paymentDate).toLocaleString('sw-TZ') },
              ].filter(({ value }) => value && !String(value).startsWith('guest_')).map(({ label, value, bold }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '8px 0', margin: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: 'var(--pink)' }}>
                  <span>KIASI KILICHOLIPWA</span><span>{formatCurrency(receipt.amountPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Deni Lililobaki</span>
                  <span style={{ color: '#C62828', fontWeight: 700 }}>{formatCurrency(receipt.remainingDebt)}</span>
                </div>
              </div>
              <div style={{ padding: '7px', borderRadius: '6px', textAlign: 'center', background: receipt.status === 'PAID' ? '#E8F5E9' : '#FFF8E1', color: receipt.status === 'PAID' ? '#2E7D32' : '#E65100', fontSize: '11px', fontWeight: 700 }}>
                {receipt.status === 'PAID' ? '✅ DENI LIMELIPWA KABISA!' : '⏳ DENI BADO LIPO'}
              </div>
              <div style={{ borderTop: '1px dashed #ccc', marginTop: '10px', paddingTop: '8px', textAlign: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>
                <div>Asante kwa malipo yako! 🙏</div>
                <div>📞 0622146487 | 0626030263</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => printDebtReceipt(receipt)} className="btn btn-ghost" style={{ justifyContent: 'center', padding: '10px' }}>
                <Printer size={14} /> Chapisha
              </button>
              <button onClick={() => setModal(null)} className="btn btn-primary" style={{ justifyContent: 'center', padding: '10px' }}>
                <CheckCircle size={14} /> Funga
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}