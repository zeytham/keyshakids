import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import {
  ShoppingCart, Package, CreditCard, TrendingUp,
  AlertTriangle, Users, RefreshCw, ArrowUpRight
} from 'lucide-react'

const formatCurrency = (amount) =>
  `TZS ${parseFloat(amount || 0).toLocaleString()}`

const StatCard = ({ title, value, icon: Icon, color, sub, trend }) => (
  <div className="stat-card">
    <div style={{
      display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-between', marginBottom: '10px',
    }}>
      <div style={{
        width: '36px', height: '36px',
        borderRadius: '10px',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} style={{ color }} />
      </div>
      {trend !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '2px',
          fontSize: '10px', fontWeight: 700,
          padding: '2px 6px', borderRadius: '20px',
          background: trend >= 0 ? '#E8F5E9' : '#FFEBEE',
          color: trend >= 0 ? '#2E7D32' : '#C62828',
        }}>
          <ArrowUpRight size={10} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '3px' }}>
      {title}
    </div>
    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
        {sub}
      </div>
    )}
    {/* Accent line bottom */}
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: '2px', background: `${color}40`,
      borderRadius: '0 0 12px 12px',
    }} />
  </div>
)

const SkeletonCard = () => (
  <div className="stat-card">
    <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px', marginBottom: '10px' }} />
    <div className="skeleton" style={{ width: '60%', height: '10px', marginBottom: '6px' }} />
    <div className="skeleton" style={{ width: '80%', height: '20px', marginBottom: '6px' }} />
    <div className="skeleton" style={{ width: '50%', height: '9px' }} />
  </div>
)

export default function Dashboard() {
  const { user, isOwner } = useAuth()

  const { data: salesReport, isLoading: salesLoading, refetch } = useQuery({
    queryKey: ['dashboard-sales'],
    queryFn: async () => {
      const res = await api.get('/reports/sales?period=today')
      return res.data.data
    },
    enabled: isOwner(),
    refetchInterval: 60000,
  })

  const { data: financialReport } = useQuery({
    queryKey: ['dashboard-financial'],
    queryFn: async () => {
      const res = await api.get('/reports/financial?period=today')
      return res.data.data
    },
    enabled: isOwner(),
    refetchInterval: 60000,
  })

  const { data: inventoryReport } = useQuery({
    queryKey: ['dashboard-inventory'],
    queryFn: async () => {
      const res = await api.get('/reports/inventory')
      return res.data.data
    },
    enabled: isOwner(),
  })

  const { data: debtsData } = useQuery({
    queryKey: ['dashboard-debts'],
    queryFn: async () => {
      const res = await api.get('/debts?status=PENDING&limit=6')
      return res.data
    },
    refetchInterval: 60000,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Welcome Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #2D0060 0%, #7B2FBE 50%, #E91E8C 100%)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.35)',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.15)',
            flexShrink: 0,
          }}>
            <img src="/logo.jpeg" alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: 800 }}>
              Habari, {user?.name?.split(' ')[0]}! 👋
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', marginTop: '2px' }}>
              {new Date().toLocaleDateString('sw-TZ', {
                weekday: 'long', day: 'numeric',
                month: 'long', year: 'numeric'
              })}
            </div>
          </div>
        </div>
        {isOwner() && (
          <button onClick={() => refetch()} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '8px',
            color: 'white', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer',
          }}>
            <RefreshCw size={13} />
            Refresh
          </button>
        )}
      </div>

      {/* Stats Grid */}
      {isOwner() && (
        <>
          {/* Row 1 */}
          <div className="grid-4">
            {salesLoading ? (
              [1,2,3,4].map(i => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard
                  title="Mauzo Leo"
                  value={salesReport?.summary?.totalSales || 0}
                  icon={ShoppingCart}
                  color="#E91E8C"
                  sub={formatCurrency(salesReport?.summary?.totalRevenue)}
                />
                <StatCard
                  title="Faida Leo"
                  value={formatCurrency(financialReport?.profit?.grossProfit)}
                  icon={TrendingUp}
                  color="#2E7D32"
                  sub={`Margin: ${financialReport?.profit?.profitMargin || 0}%`}
                />
                <StatCard
                  title="Stock Inayokwisha"
                  value={inventoryReport?.summary?.lowStockCount || 0}
                  icon={AlertTriangle}
                  color="#FF6F00"
                  sub={`Nje ya stock: ${inventoryReport?.summary?.outOfStockCount || 0}`}
                />
                <StatCard
                  title="Madeni Yanayosubiri"
                  value={formatCurrency(financialReport?.debts?.totalPendingDebts)}
                  icon={CreditCard}
                  color="#C62828"
                  sub="Jumla ya madeni"
                />
              </>
            )}
          </div>

          {/* Row 2 */}
          <div className="grid-4">
            {salesLoading ? (
              [1,2,3,4].map(i => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard
                  title="Cash Leo"
                  value={formatCurrency(financialReport?.revenue?.cashRevenue)}
                  icon={TrendingUp}
                  color="#1565C0"
                />
                <StatCard
                  title="Mauzo ya Deni"
                  value={salesReport?.summary?.creditSales || 0}
                  icon={Users}
                  color="#7B2FBE"
                  sub={`Partial: ${salesReport?.summary?.partialSales || 0}`}
                />
                <StatCard
                  title="Bidhaa Zote"
                  value={inventoryReport?.summary?.totalProducts || 0}
                  icon={Package}
                  color="#E91E8C"
                  sub={formatCurrency(inventoryReport?.summary?.totalStockValue)}
                />
                <StatCard
                  title="Punguzo Leo"
                  value={formatCurrency(salesReport?.summary?.totalDiscount)}
                  icon={ArrowUpRight}
                  color="#FF6F00"
                />
              </>
            )}
          </div>
        </>
      )}

      {/* Bottom Grid */}
      <div className="grid-2">

        {/* Recent Sales */}
        <div className="card">
          <div className="section-head">
            <div className="section-title">
              <div className="section-icon" style={{ background: '#FCE4EC' }}>
                <ShoppingCart size={13} style={{ color: '#E91E8C' }} />
              </div>
              Mauzo ya Hivi Karibuni
            </div>
            <span className="badge badge-pink">Leo</span>
          </div>
          <div>
            {salesReport?.sales?.length > 0 ? (
              salesReport.sales.slice(0, 6).map((sale) => (
                <div key={sale.id} style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid #FAFAFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                      {sale.cashier?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {sale.cashier?.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(sale.createdAt).toLocaleTimeString('sw-TZ')}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--pink)' }}>
                      {formatCurrency(sale.totalAmount)}
                    </div>
                    <span className={`badge ${
                      sale.paymentType === 'CASH' ? 'badge-success' :
                      sale.paymentType === 'CREDIT' ? 'badge-danger' : 'badge-warning'
                    }`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                      {sale.paymentType}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <ShoppingCart size={32} />
                <p>Hakuna mauzo leo bado</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Debts */}
        <div className="card">
          <div className="section-head">
            <div className="section-title">
              <div className="section-icon" style={{ background: '#FFEBEE' }}>
                <CreditCard size={13} style={{ color: '#C62828' }} />
              </div>
              Madeni Yanayosubiri
            </div>
            <span className="badge badge-danger">
              {debtsData?.pagination?.total || 0}
            </span>
          </div>
          <div>
            {debtsData?.data?.length > 0 ? (
              debtsData.data.slice(0, 6).map((debt) => (
                <div key={debt.id} style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid #FAFAFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                      {debt.customer?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {debt.customer?.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {debt.customer?.phone}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#C62828' }}>
                      {formatCurrency(debt.remainingAmount)}
                    </div>
                    <span className={`badge ${
                      debt.status === 'PENDING' ? 'badge-danger' : 'badge-warning'
                    }`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                      {debt.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <CreditCard size={32} />
                <p>Hakuna madeni yanayosubiri</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {isOwner() && inventoryReport?.lowStockProducts?.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="section-head" style={{ background: '#FFF8E1', borderBottom: '1px solid #FFE082' }}>
            <div className="section-title" style={{ color: '#E65100' }}>
              <AlertTriangle size={15} style={{ color: '#FF6F00' }} />
              Bidhaa Zinazokwisha Stock
            </div>
            <span className="badge badge-warning">
              {inventoryReport.lowStockProducts.length} bidhaa
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '10px',
            padding: '14px',
          }}>
            {inventoryReport.lowStockProducts.slice(0, 8).map((product) => (
              <div key={product.id} style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#FFF8E1',
                border: '1px solid #FFE082',
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'var(--text-primary)', marginBottom: '3px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {product.category?.name}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#FF6F00', lineHeight: 1 }}>
                  {product.stockQuantity}
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 400 }}> zilizobaki</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}