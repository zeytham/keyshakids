import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import {
  BarChart3, TrendingUp, Package, Users,
  RefreshCw, Calendar, ChevronRight, Award, AlertTriangle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

const formatCurrency = (amount) => `TZS ${parseFloat(amount || 0).toLocaleString()}`

const periods = [
  { value: 'today', label: 'Leo' },
  { value: 'yesterday', label: 'Jana' },
  { value: 'this_week', label: 'Wiki Hii' },
  { value: 'last_week', label: 'Wiki Iliyopita' },
  { value: 'this_month', label: 'Mwezi Huu' },
  { value: 'last_month', label: 'Mwezi Uliopita' },
  { value: 'this_year', label: 'Mwaka Huu' },
  { value: 'last_year', label: 'Mwaka Uliopita' },
  { value: 'custom', label: '📅 Tarehe' },
]

const StatCard = ({ title, value, icon: Icon, color, sub, trend }) => (
  <div className="stat-card" style={{ cursor: 'default' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} style={{ color }} />
      </div>
      {trend !== undefined && (
        <span style={{ fontSize: '10px', fontWeight: 700, color: trend >= 0 ? '#2E7D32' : '#C62828', background: trend >= 0 ? '#E8F5E9' : '#FFEBEE', padding: '2px 7px', borderRadius: '10px' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '4px' }}>{title}</div>
    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
    {sub && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>{sub}</div>}
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}60, ${color}20)`, borderRadius: '0 0 12px 12px' }} />
  </div>
)

const SkeletonCard = () => (
  <div className="stat-card">
    <div className="skeleton" style={{ width: '34px', height: '34px', borderRadius: '9px', marginBottom: '10px' }} />
    <div className="skeleton" style={{ height: '9px', width: '55%', marginBottom: '6px' }} />
    <div className="skeleton" style={{ height: '18px', width: '75%' }} />
  </div>
)

const SectionHead = ({ title, badge, badgeColor = 'var(--pink)' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-light)', background: '#FAFAFA' }}>
    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
    {badge !== undefined && (
      <span style={{ fontSize: '10px', fontWeight: 700, color: badgeColor, background: `${badgeColor}18`, padding: '2px 8px', borderRadius: '10px' }}>
        {badge}
      </span>
    )}
  </div>
)

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales')
  const [period, setPeriod] = useState('today')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const params = new URLSearchParams({
    period,
    ...(period === 'custom' && from && { from }),
    ...(period === 'custom' && to && { to }),
  })

  const { data: salesReport, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['report-sales', period, from, to],
    queryFn: async () => (await api.get(`/reports/sales?${params}`)).data.data,
    enabled: activeTab === 'sales',
  })

  const { data: financialReport, isLoading: finLoading, refetch: refetchFin } = useQuery({
    queryKey: ['report-financial', period, from, to],
    queryFn: async () => (await api.get(`/reports/financial?${params}`)).data.data,
    enabled: activeTab === 'financial',
  })

  const { data: inventoryReport, isLoading: invLoading } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: async () => (await api.get('/reports/inventory')).data.data,
    enabled: activeTab === 'inventory',
  })

  const { data: staffReport, isLoading: staffLoading, refetch: refetchStaff } = useQuery({
    queryKey: ['report-staff', period, from, to],
    queryFn: async () => (await api.get(`/reports/staff?${params}`)).data.data,
    enabled: activeTab === 'staff',
  })

  const { data: productsPerf, isLoading: perfLoading } = useQuery({
    queryKey: ['report-products-perf', period, from, to],
    queryFn: async () => (await api.get(`/reports/products-performance?${params}`)).data.data,
    enabled: activeTab === 'products',
  })

  const tabs = [
    { id: 'sales', label: 'Mauzo', icon: BarChart3, color: '#E91E8C' },
    { id: 'financial', label: 'Fedha', icon: TrendingUp, color: '#2E7D32' },
    { id: 'inventory', label: 'Inventory', icon: Package, color: '#1565C0' },
    { id: 'staff', label: 'Wafanyakazi', icon: Users, color: '#7B2FBE' },
    { id: 'products', label: 'Bidhaa', icon: Award, color: '#FF6F00' },
  ]

  const activeTabData = tabs.find(t => t.id === activeTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Ripoti</div>
          <div className="page-sub">Takwimu na uchambuzi wa biashara yako</div>
        </div>
        <button className="btn btn-primary"
          onClick={() => { refetchSales?.(); refetchFin?.(); refetchStaff?.() }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <RefreshCw size={14} /> {isMobile ? '' : 'Refresh'}
        </button>
      </div>

      {/* Period Selector */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Calendar size={14} style={{ color: 'var(--pink)' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Chagua Kipindi</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {periods.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              style={{
                padding: isMobile ? '5px 10px' : '5px 13px',
                borderRadius: '20px', border: '1.5px solid',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
                borderColor: period === p.value ? 'var(--pink)' : 'var(--border)',
                background: period === p.value ? 'var(--gradient)' : 'white',
                color: period === p.value ? 'white' : 'var(--text-secondary)',
                boxShadow: period === p.value ? '0 2px 8px rgba(233,30,140,0.25)' : 'none',
              }}
              onMouseEnter={e => { if (period !== p.value) { e.currentTarget.style.borderColor = 'var(--pink)'; e.currentTarget.style.color = 'var(--pink)' } }}
              onMouseLeave={e => { if (period !== p.value) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tarehe ya Kuanzia</label>
              <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 'auto' }} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tarehe ya Mwisho</label>
              <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 'auto' }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: isMobile ? '7px 12px' : '8px 16px',
                borderRadius: '10px', border: '1.5px solid',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.2s',
                borderColor: isActive ? tab.color : 'var(--border-light)',
                background: isActive ? tab.color : 'white',
                color: isActive ? 'white' : 'var(--text-secondary)',
                boxShadow: isActive ? `0 4px 12px ${tab.color}30` : 'none',
                transform: isActive ? 'translateY(-1px)' : '',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = tab.color; e.currentTarget.style.color = tab.color; e.currentTarget.style.background = `${tab.color}10` } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'white' } }}
            >
              <tab.icon size={13} />
              {isMobile ? '' : tab.label}
              {isMobile && <span style={{ fontSize: '9px', display: 'block', marginTop: '0' }}>{tab.label}</span>}
            </button>
          )
        })}
      </div>

      {/* ═══ SALES TAB ═══ */}
      {activeTab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
            {salesLoading ? [1,2,3,4].map(i => <SkeletonCard key={i} />) : (
              <>
                <StatCard title="Jumla ya Mauzo" icon={BarChart3} color="#E91E8C"
                  value={salesReport?.summary?.totalSales || 0}
                  sub={formatCurrency(salesReport?.summary?.totalRevenue)} />
                <StatCard title="Faida" icon={TrendingUp} color="#2E7D32"
                  value={formatCurrency(salesReport?.summary?.totalProfit)} />
                <StatCard title="Cash Sales" icon={TrendingUp} color="#1565C0"
                  value={salesReport?.summary?.cashSales || 0} />
                <StatCard title="Mauzo ya Deni" icon={TrendingUp} color="#C62828"
                  value={salesReport?.summary?.creditSales || 0}
                  sub={`Partial: ${salesReport?.summary?.partialSales || 0}`} />
              </>
            )}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <SectionHead title="📋 Orodha ya Mauzo" badge={`${salesReport?.sales?.length || 0} mauzo`} />
            {isMobile ? (
              // Mobile — List cards
              <div style={{ padding: '8px' }}>
                {salesReport?.sales?.slice(0, 20).map(sale => (
                  <div key={sale.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', marginBottom: '4px',
                    background: '#FAFAFA', borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--pink)' }}>
                        #{sale.receiptNumber?.slice(0,8).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {sale.cashier?.name} • {new Date(sale.createdAt).toLocaleDateString('sw-TZ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--pink)' }}>{formatCurrency(sale.totalAmount)}</div>
                      <span className={`badge ${sale.paymentType === 'CASH' ? 'badge-success' : sale.paymentType === 'CREDIT' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '9px' }}>
                        {sale.paymentType}
                      </span>
                    </div>
                  </div>
                ))}
                {!salesLoading && !salesReport?.sales?.length && (
                  <div className="empty-state"><BarChart3 size={32} /><p>Hakuna mauzo</p></div>
                )}
              </div>
            ) : (
              // Desktop — Table
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      <th>Cashier</th>
                      <th>Jumla</th>
                      <th>Aina</th>
                      <th>Tarehe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport?.sales?.slice(0, 20).map(sale => (
                      <tr key={sale.id}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFF0F7'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--pink)', fontWeight: 700 }}>
                          #{sale.receiptNumber?.slice(0,8).toUpperCase()}
                        </td>
                        <td style={{ fontWeight: 600 }}>{sale.cashier?.name}</td>
                        <td style={{ fontWeight: 800, color: 'var(--pink)' }}>{formatCurrency(sale.totalAmount)}</td>
                        <td>
                          <span className={`badge ${sale.paymentType === 'CASH' ? 'badge-success' : sale.paymentType === 'CREDIT' ? 'badge-danger' : 'badge-warning'}`}>
                            {sale.paymentType}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(sale.createdAt).toLocaleString('sw-TZ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!salesLoading && !salesReport?.sales?.length && (
                  <div className="empty-state"><BarChart3 size={32} /><p>Hakuna mauzo kwa kipindi hiki</p></div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ FINANCIAL TAB ═══ */}
      {activeTab === 'financial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
            {finLoading ? [1,2,3,4,5,6].map(i => <SkeletonCard key={i} />) : (
              <>
                <StatCard title="Mapato Yote" icon={TrendingUp} color="#E91E8C"
                  value={formatCurrency(financialReport?.revenue?.totalRevenue)} />
                <StatCard title="Cash Iliyopokelewa" icon={TrendingUp} color="#2E7D32"
                  value={formatCurrency(financialReport?.revenue?.cashRevenue)} />
                <StatCard title="Punguzo Lote" icon={TrendingUp} color="#FF6F00"
                  value={formatCurrency(financialReport?.revenue?.totalDiscount)} />
                <StatCard title="Gharama ya Bidhaa" icon={Package} color="#C62828"
                  value={formatCurrency(financialReport?.profit?.totalCost)} />
                <StatCard title="Faida Ghafi" icon={TrendingUp} color="#1565C0"
                  value={formatCurrency(financialReport?.profit?.grossProfit)}
                  sub={`Margin: ${financialReport?.profit?.profitMargin || 0}%`} />
                <StatCard title="Madeni Yanayosubiri" icon={TrendingUp} color="#7B2FBE"
                  value={formatCurrency(financialReport?.debts?.totalPendingDebts)} />
              </>
            )}
          </div>

          {/* Profit Meter */}
          {!finLoading && financialReport?.profit && (
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                📊 Uchambuzi wa Faida
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ flex: 1 }}>
                  <div className="progress-bar" style={{ height: '10px' }}>
                    <div className="progress-fill" style={{
                      width: `${Math.min(100, financialReport.profit.profitMargin || 0)}%`,
                      background: (financialReport.profit.profitMargin || 0) > 20
                        ? 'linear-gradient(90deg, #2E7D32, #4CAF50)'
                        : 'linear-gradient(90deg, #FF6F00, #FFA726)',
                    }} />
                  </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', minWidth: '40px', textAlign: 'right' }}>
                  {financialReport.profit.profitMargin || 0}%
                </span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {(financialReport.profit.profitMargin || 0) > 20
                  ? '✅ Faida nzuri — biashara inaendelea vizuri!'
                  : '⚠️ Faida ndogo — zingatia bei za bidhaa'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ INVENTORY TAB ═══ */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
            {invLoading ? [1,2,3,4].map(i => <SkeletonCard key={i} />) : (
              <>
                <StatCard title="Bidhaa Zote" icon={Package} color="#E91E8C"
                  value={inventoryReport?.summary?.totalProducts || 0} />
                <StatCard title="Thamani ya Stock" icon={TrendingUp} color="#1565C0"
                  value={formatCurrency(inventoryReport?.summary?.totalStockValue)} />
                <StatCard title="Zinazokwisha" icon={AlertTriangle} color="#FF6F00"
                  value={inventoryReport?.summary?.lowStockCount || 0} />
                <StatCard title="Zimeisha Kabisa" icon={Package} color="#C62828"
                  value={inventoryReport?.summary?.outOfStockCount || 0} />
              </>
            )}
          </div>

          {inventoryReport?.lowStockProducts?.length > 0 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <SectionHead title="⚠️ Bidhaa Zinazokwisha Stock" badge={inventoryReport.lowStockProducts.length} badgeColor="#FF6F00" />
              {isMobile ? (
                <div style={{ padding: '8px' }}>
                  {inventoryReport.lowStockProducts.map(p => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', marginBottom: '4px',
                      background: p.stockQuantity === 0 ? '#FFF5F5' : '#FFFBF0',
                      borderRadius: '8px', border: `1px solid ${p.stockQuantity === 0 ? '#FFCDD2' : '#FFE082'}`,
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.category_name || p.category?.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: p.stockQuantity === 0 ? '#C62828' : '#FF6F00' }}>
                          {p.stockQuantity}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>min: {p.minStockAlert}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Bidhaa</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Kiwango cha Onyo</th>
                        <th>Hali</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryReport.lowStockProducts.map(p => (
                        <tr key={p.id}
                          style={{ background: p.stockQuantity === 0 ? '#FFF5F5' : '#FFFBF0' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                          <td style={{ fontWeight: 700 }}>{p.name}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{p.category_name || p.category?.name}</td>
                          <td>
                            <span style={{ fontWeight: 800, fontSize: '15px', color: p.stockQuantity === 0 ? '#C62828' : '#FF6F00' }}>
                              {p.stockQuantity}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{p.minStockAlert}</td>
                          <td>
                            <span className={`badge ${p.stockQuantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                              {p.stockQuantity === 0 ? 'Imeisha' : 'Inakwisha'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ STAFF TAB ═══ */}
      {activeTab === 'staff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {staffLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : staffReport?.staffReports?.length === 0 ? (
            <div className="card empty-state"><Users size={36} /><p>Hakuna data ya wafanyakazi</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '12px' }}>
              {staffReport?.staffReports?.map((staff, idx) => (
                <div key={staff.user.id} className="card" style={{ padding: '0', overflow: 'hidden', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                  {/* Card Banner */}
                  <div style={{
                    padding: '14px 16px',
                    background: idx % 2 === 0
                      ? 'linear-gradient(135deg, #E91E8C, #7B2FBE)'
                      : 'linear-gradient(135deg, #7B2FBE, #1565C0)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
                      {staff.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{staff.user.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{staff.user.role}</div>
                    </div>
                  </div>
                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0', padding: '12px', gap: '8px' }}>
                    {[
                      { label: 'Mauzo', value: staff.totalSales, color: 'var(--pink)', bg: 'var(--pink-light)' },
                      { label: 'Mapato', value: formatCurrency(staff.totalRevenue), color: '#2E7D32', bg: '#E8F5E9', small: true },
                      { label: 'Voids', value: staff.voids, color: '#C62828', bg: '#FFEBEE' },
                    ].map(({ label, value, color, bg, small }) => (
                      <div key={label} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: '8px', background: bg }}>
                        <div style={{ fontSize: small ? '10px' : '18px', fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 600 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ PRODUCTS TAB ═══ */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {perfLoading ? (
            <div className="card" style={{ padding: '20px' }}>
              <div className="skeleton" style={{ height: '200px', borderRadius: '8px' }} />
            </div>
          ) : (
            <>
              {/* Top Selling Chart */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <SectionHead title="🔥 Bidhaa Zinazoenda Haraka" badge={`Top ${Math.min(8, productsPerf?.topSelling?.length || 0)}`} badgeColor="#FF6F00" />
                {productsPerf?.topSelling?.length > 0 ? (
                  <div style={{ padding: '16px' }}>
                    <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
                      <BarChart data={productsPerf.topSelling.slice(0, 8)} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis dataKey="product.name" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          cursor={{ fill: 'rgba(233,30,140,0.05)' }}
                        />
                        <Bar dataKey="totalQuantity" name="Idadi Iliyouzwa"
                          fill="url(#pinkGradient)" radius={[6,6,0,0]} />
                        <defs>
                          <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E91E8C" />
                            <stop offset="100%" stopColor="#7B2FBE" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="empty-state"><Package size={32} /><p>Hakuna data ya mauzo</p></div>
                )}
              </div>

              {/* Slow Moving */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <SectionHead title="🐢 Bidhaa Zinazoenda Polepole" />
                {productsPerf?.slowMoving?.length > 0 ? (
                  <div>
                    {productsPerf.slowMoving.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 16px', borderBottom: '1px solid #FAFAFA',
                        transition: 'background 0.15s', cursor: 'default',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.product?.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.product?.category?.name}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{item.totalQuantity} kuuzwa</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatCurrency(item.totalRevenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state"><Package size={32} /><p>Hakuna data</p></div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}