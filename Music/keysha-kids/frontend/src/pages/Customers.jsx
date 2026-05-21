import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Search, Users, Phone, CreditCard, X, Edit, ShoppingBag, TrendingUp, UserCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { validateName, validatePhone, validateCreditLimit } from '../utils/validation'
const Modal = ({ title, onClose, children, wide }) => (
  <div className="modal-overlay">
    <div className="modal-box" style={{ maxWidth: wide ? '560px' : '440px' }}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
)

const formatCurrency = (amount) => `TZS ${parseFloat(amount || 0).toLocaleString()}`

export default function Customers() {
  const { isOwner } = useAuth()
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [activeDetailTab, setActiveDetailTab] = useState('debts')
  const [form, setForm] = useState({ name: '', phone: '', creditLimit: '' })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 12, ...(search && { search }) })
      return (await api.get(`/customers?${params}`)).data
    },
  })

  const { data: customerDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['customer-details', selected?.id],
    queryFn: async () => (await api.get(`/customers/${selected.id}/debts`)).data.data,
    enabled: !!selected && modal === 'details',
  })

  const createCustomer = useMutation({
    mutationFn: (data) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
      toast.success('Mteja ameongezwa!')
      setModal(null)
      setForm({ name: '', phone: '', creditLimit: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const updateCustomer = useMutation({
    mutationFn: ({ id, data }) => api.put(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
      toast.success('Taarifa zimebadilishwa!')
      setModal(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const nameError = validateName(form.name)
    if (nameError) return toast.error(nameError)
    const phoneError = validatePhone(form.phone)
    if (phoneError) return toast.error(phoneError)
    const limitError = validateCreditLimit(form.creditLimit)
    if (limitError) return toast.error(limitError)
    if (modal === 'add') createCustomer.mutate({ name: form.name.trim(), phone: form.phone.trim(), creditLimit: form.creditLimit || 0 })
    else if (modal === 'edit') updateCustomer.mutate({ id: selected.id, data: { name: form.name.trim(), phone: form.phone.trim(), creditLimit: form.creditLimit || 0 } })
  }

  // Summary stats
  const totalCustomers = data?.pagination?.total || 0
  const withDebt = data?.data?.filter(c => parseFloat(c.totalDebt) > 0).length || 0
  const totalDebt = data?.data?.reduce((s, c) => s + parseFloat(c.totalDebt || 0), 0) || 0
  const noDebt = data?.data?.filter(c => parseFloat(c.totalDebt) === 0).length || 0

  // ═══ CUSTOMER CARD ═══
  const CustomerCard = ({ customer }) => {
    const debtPct = parseFloat(customer.creditLimit) > 0
      ? Math.min(100, (parseFloat(customer.totalDebt) / parseFloat(customer.creditLimit)) * 100) : 0
    const hasDebt = parseFloat(customer.totalDebt) > 0
    const isHighDebt = debtPct > 80
    const isGuest = customer.phone?.startsWith('guest_')

    return (
      <div className="card" style={{
        padding: '0', overflow: 'hidden',
        transition: 'all 0.2s', cursor: 'default',
        borderTop: `3px solid ${hasDebt ? (isHighDebt ? '#C62828' : '#E91E8C') : '#2E7D32'}`,
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      >
        {/* Card Top */}
        <div style={{ padding: '14px 16px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: hasDebt ? 'linear-gradient(135deg, #C62828, #E91E8C)' : 'var(--gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '16px', flexShrink: 0,
              }}>
                {customer.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {customer.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <Phone size={10} />
                  {isGuest ? '—' : customer.phone}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px',
              background: hasDebt ? '#FFEBEE' : '#E8F5E9',
              color: hasDebt ? '#C62828' : '#2E7D32', flexShrink: 0,
            }}>
              {hasDebt ? `Deni` : '✓ Safi'}
            </span>
          </div>

          {/* Amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: hasDebt ? '#FFEBEE' : '#F9FAFB', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: hasDebt ? '#C62828' : 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>DENI</div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: hasDebt ? '#C62828' : 'var(--text-muted)' }}>
                {formatCurrency(customer.totalDebt)}
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#EFF6FF', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#1565C0', fontWeight: 700, marginBottom: '2px' }}>KIKOMO</div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1565C0' }}>
                {parseFloat(customer.creditLimit) > 0 ? formatCurrency(customer.creditLimit) : '∞'}
              </div>
            </div>
          </div>

          {/* Progress */}
          {parseFloat(customer.creditLimit) > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                <span>Matumizi ya Kikomo</span>
                <span style={{ fontWeight: 700, color: isHighDebt ? '#C62828' : 'var(--pink)' }}>{Math.round(debtPct)}%</span>
              </div>
              <div className="progress-bar" style={{ height: '5px' }}>
                <div className="progress-fill" style={{
                  width: `${debtPct}%`,
                  background: isHighDebt ? 'linear-gradient(90deg,#C62828,#FF5252)' : 'var(--gradient)',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: isOwner() ? '1fr 1fr' : '1fr', gap: '0', borderTop: '1px solid var(--border-light)' }}>
          <button
            onClick={() => { setSelected(customer); setActiveDetailTab('debts'); setModal('details') }}
            style={{ padding: '10px', border: 'none', background: 'transparent', color: 'var(--purple)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', borderRight: isOwner() ? '1px solid var(--border-light)' : 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-light)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <CreditCard size={12} /> Historia
          </button>
          {isOwner() && (
            <button
              onClick={() => { setSelected(customer); setForm({ name: customer.name, phone: customer.phone, creditLimit: customer.creditLimit }); setModal('edit') }}
              style={{ padding: '10px', border: 'none', background: 'transparent', color: '#1565C0', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Edit size={12} /> Badilisha
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Wateja</div>
          <div className="page-sub">{totalCustomers} wateja wote kwenye mfumo</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', phone: '', creditLimit: '' }); setModal('add') }}>
          <Plus size={15} /> {isMobile ? 'Ongeza' : 'Mteja Mpya'}
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
        {[
          { label: 'Wateja Wote', value: totalCustomers, icon: Users, color: 'var(--pink)', bg: 'var(--pink-light)' },
          { label: 'Wenye Deni', value: withDebt, icon: AlertCircle, color: '#C62828', bg: '#FFEBEE' },
          { label: 'Jumla ya Madeni', value: formatCurrency(totalDebt), icon: CreditCard, color: '#FF6F00', bg: '#FFF8E1' },
          { label: 'Hawana Deni', value: noDebt, icon: UserCheck, color: '#2E7D32', bg: '#E8F5E9' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card"
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={13} style={{ color }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color }}>{value}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.25, borderRadius: '0 0 12px 12px' }} />
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="input-wrap" style={{ flex: 1 }}>
          <span className="input-icon"><Search size={14} /></span>
          <input className="input" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tafuta mteja kwa jina au simu..." />
        </div>
        {search && (
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setPage(1) }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Customers Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '10px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '12px', width: '60%', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ height: '10px', width: '40%' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: '38px', borderRadius: '8px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '32px', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="card empty-state">
          <Users size={40} />
          <p>Hakuna wateja bado</p>
          <p style={{ fontSize: '11px', marginTop: '4px' }}>Wateja wataonekana hapa watakapofanya mauzo!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '10px' }}>
          {data?.data?.map(customer => <CustomerCard key={customer.id} customer={customer} />)}
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

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? '👤 Ongeza Mteja Mpya' : `✏️ Badilisha: ${selected?.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Jina Kamili *</label>
              <input className="input" type="text" value={form.name}
                onChange={e => {
                  const val = e.target.value.replace(/[^a-zA-Z\s\u00C0-\u024F'-]/g, '')
                  setForm({ ...form, name: val })
                }}
                placeholder="Jina la mteja" required autoFocus maxLength={50} />
            </div>
            <div className="form-group">
              <label className="form-label">Namba ya Simu *</label>
              <input className="input" type="tel" value={form.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setForm({ ...form, phone: val })
                }}
                placeholder="0700000000" required maxLength={10} inputMode="numeric" />
            </div>
            <div className="form-group">
              <label className="form-label">
                Kikomo cha Deni (TZS)
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>(0 = Hakuna kikomo)</span>
              </label>
              <input className="input" type="number" value={form.creditLimit}
                onChange={e => setForm({ ...form, creditLimit: e.target.value })}
                placeholder="0" />
            </div>
            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              Hifadhi
            </button>
          </form>
        </Modal>
      )}

      {/* Details Modal — Historia kamili */}
      {modal === 'details' && selected && (
        <Modal title={`👤 ${selected.name}`} onClose={() => setModal(null)} wide>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Customer Profile */}
            <div style={{
              background: 'linear-gradient(135deg, #2D0060, #E91E8C)',
              borderRadius: '12px', padding: '16px',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '20px', flexShrink: 0,
              }}>
                {selected.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontWeight: 800, fontSize: '16px', marginBottom: '3px' }}>
                  {selected.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={11} />
                  {selected.phone?.startsWith('guest_') ? 'Simu haijahifadhiwa' : selected.phone}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>DENI</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>
                  {formatCurrency(selected.totalDebt)}
                </div>
              </div>
            </div>

            {/* Detail Tabs */}
            <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              {[
                { id: 'debts', label: '💳 Madeni', icon: CreditCard },
                { id: 'sales', label: '🛒 Mauzo', icon: ShoppingBag },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveDetailTab(tab.id)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', border: '1.5px solid',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    borderColor: activeDetailTab === tab.id ? 'var(--pink)' : 'var(--border-light)',
                    background: activeDetailTab === tab.id ? 'var(--pink-light)' : 'white',
                    color: activeDetailTab === tab.id ? 'var(--pink)' : 'var(--text-secondary)',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {detailsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ padding: '12px', borderRadius: '8px', background: '#F9FAFB' }}>
                    <div className="skeleton" style={{ height: '12px', width: '60%', marginBottom: '6px' }} />
                    <div className="skeleton" style={{ height: '10px', width: '80%' }} />
                  </div>
                ))}
              </div>
            ) : activeDetailTab === 'debts' ? (
              // Debts Tab
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                {!customerDetails?.debts?.length ? (
                  <div className="empty-state" style={{ padding: '30px' }}>
                    <CreditCard size={32} />
                    <p style={{ fontSize: '12px' }}>Hakuna madeni — mteja huyu safi! 🎉</p>
                  </div>
                ) : customerDetails.debts.map(debt => (
                  <div key={debt.id} style={{
                    padding: '12px', borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    borderLeft: `3px solid ${debt.status === 'PAID' ? '#2E7D32' : debt.status === 'PARTIAL' ? '#FF6F00' : '#C62828'}`,
                    background: '#FAFAFA',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          📅 {new Date(debt.createdAt).toLocaleDateString('sw-TZ')}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatCurrency(debt.totalAmount)}
                        </div>
                      </div>
                      <span className={`badge ${debt.status === 'PAID' ? 'badge-success' : debt.status === 'PARTIAL' ? 'badge-warning' : 'badge-danger'}`}>
                        {debt.status}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div style={{ padding: '6px', borderRadius: '6px', background: '#E8F5E9', textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', color: '#2E7D32', fontWeight: 600 }}>LILILIPWA</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#2E7D32' }}>{formatCurrency(debt.paidAmount)}</div>
                      </div>
                      <div style={{ padding: '6px', borderRadius: '6px', background: '#FFEBEE', textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', color: '#C62828', fontWeight: 600 }}>LILILOBAKI</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#C62828' }}>{formatCurrency(debt.remainingAmount)}</div>
                      </div>
                    </div>
                    {/* Progress */}
                    <div style={{ marginTop: '8px' }}>
                      <div className="progress-bar" style={{ height: '4px' }}>
                        <div className="progress-fill" style={{
                          width: `${Math.min(100, (parseFloat(debt.paidAmount) / parseFloat(debt.totalAmount)) * 100)}%`,
                          background: debt.status === 'PAID' ? '#2E7D32' : 'var(--gradient)',
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Sales Tab
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                {!customerDetails?.sales?.length ? (
                  <div className="empty-state" style={{ padding: '30px' }}>
                    <ShoppingBag size={32} />
                    <p style={{ fontSize: '12px' }}>Hakuna historia ya mauzo</p>
                  </div>
                ) : customerDetails.sales.map(sale => (
                  <div key={sale.id} style={{
                    padding: '12px', borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    borderLeft: `3px solid ${sale.paymentType === 'CASH' ? '#2E7D32' : sale.paymentType === 'CREDIT' ? '#C62828' : '#FF6F00'}`,
                    background: '#FAFAFA',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--pink)', marginBottom: '2px' }}>
                          #{sale.receiptNumber?.slice(0,8).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          📅 {new Date(sale.createdAt).toLocaleString('sw-TZ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--pink)' }}>
                          {formatCurrency(sale.totalAmount)}
                        </div>
                        <span className={`badge ${sale.paymentType === 'CASH' ? 'badge-success' : sale.paymentType === 'CREDIT' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '9px' }}>
                          {sale.paymentType}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    {sale.saleItems?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {sale.saleItems.map(item => (
                          <span key={item.id} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', background: 'var(--purple-light)', color: 'var(--purple)', fontWeight: 600 }}>
                            {item.product?.name} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Cashier */}
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px' }}>
                      👤 Cashier: {sale.cashier?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary footer */}
            {!detailsLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border-light)' }}>
                {[
                  { label: 'Mauzo Yote', value: customerDetails?.totalSales || 0, color: 'var(--pink)' },
                  { label: 'Jumla', value: formatCurrency(customerDetails?.totalSpent || 0), color: 'var(--purple)', small: true },
                  { label: 'Madeni', value: customerDetails?.debts?.length || 0, color: '#C62828' },
                ].map(({ label, value, color, small }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '8px', background: '#F9FAFB', borderRadius: '8px' }}>
                    <div style={{ fontSize: small ? '10px' : '16px', fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}