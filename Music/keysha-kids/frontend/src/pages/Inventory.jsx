import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Search, Edit, Package, AlertTriangle, X, TrendingUp, Eye, Filter } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { validateProductName, validatePrice, validateQuantity } from '../utils/validation'

const Modal = ({ title, onClose, children, wide }) => (
  <div className="modal-overlay">
    <div className="modal-box" style={{ maxWidth: wide ? '580px' : '440px' }}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
)

const formatCurrency = (amount) => `TZS ${parseFloat(amount || 0).toLocaleString()}`

export default function Inventory() {
  const { isOwner } = useAuth()
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [form, setForm] = useState({
    name: '', categoryId: '', subCategoryId: '',
    size: '', color: '', costPrice: '', sellingPrice: '',
    stockQuantity: '', minStockAlert: '5', supplier: '',
  })
  const [stockForm, setStockForm] = useState({ quantity: '', reason: '', costPrice: '' })
  const [adjustForm, setAdjustForm] = useState({ newQuantity: '', reason: '' })

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page, limit: isMobile ? 10 : 15,
        ...(search && { search }),
        ...(categoryFilter && { categoryId: categoryFilter }),
      })
      return (await api.get(`/products?${params}`)).data
    },
  })

  const createProduct = useMutation({
    mutationFn: (data) => api.post('/products', data),
    onSuccess: () => { queryClient.invalidateQueries(['products']); toast.success('Bidhaa imeongezwa!'); setModal(null) },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => api.put(`/products/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['products']); toast.success('Bidhaa imebadilishwa!'); setModal(null) },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const addStock = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/products/${id}/add-stock`, data),
    onSuccess: () => { queryClient.invalidateQueries(['products']); toast.success('Stock imeongezwa!'); setModal(null) },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const adjustStock = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/products/${id}/adjust-stock`, data),
    onSuccess: () => { queryClient.invalidateQueries(['products']); toast.success('Stock imerekebishwa!'); setModal(null) },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const selectedCategory = categories?.find(c => c.id === form.categoryId)
  const totalProducts = data?.pagination?.total || 0
  const lowStockCount = data?.data?.filter(p => p.stockQuantity <= p.minStockAlert).length || 0

  const handleSubmit = (e) => {
    e.preventDefault()

    if (modal === 'add' || modal === 'edit') {
      const nameError = validateProductName(form.name)
      if (nameError) return toast.error(nameError)

      if (!form.categoryId) return toast.error('Chagua category!')

      const costError = validatePrice(form.costPrice)
      if (costError) return toast.error(`Bei ya Kununulia: ${costError}`)

      const sellError = validatePrice(form.sellingPrice)
      if (sellError) return toast.error(`Bei ya Kuuzia: ${sellError}`)

      if (parseFloat(form.costPrice) > parseFloat(form.sellingPrice)) {
        return toast.error('Bei ya kuuzia lazima iwe zaidi ya bei ya kununulia!')
      }

      if (modal === 'add') createProduct.mutate(form)
      else updateProduct.mutate({ id: selected.id, data: form })

    } else if (modal === 'stock-in') {
      const qtyError = validateQuantity(stockForm.quantity)
      if (qtyError) return toast.error(`Idadi: ${qtyError}`)
      if (parseInt(stockForm.quantity) <= 0) return toast.error('Idadi iwe zaidi ya 0!')
      addStock.mutate({ id: selected.id, data: stockForm })

    } else if (modal === 'adjust') {
      const qtyError = validateQuantity(adjustForm.newQuantity)
      if (qtyError) return toast.error(`Idadi: ${qtyError}`)
      if (!adjustForm.reason?.trim()) return toast.error('Weka sababu ya marekebisho!')
      adjustStock.mutate({ id: selected.id, data: adjustForm })
    }
  }

  const openEdit = (product) => {
    setSelected(product)
    setForm({
      name: product.name, categoryId: product.categoryId,
      subCategoryId: product.subCategoryId || '',
      size: product.size || '', color: product.color || '',
      costPrice: product.costPrice, sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity, minStockAlert: product.minStockAlert,
      supplier: product.supplier || '',
    })
    setModal('edit')
  }

  // ═══ MOBILE CARD ═══
  const MobileProductCard = ({ product, index }) => {
    const isLowStock = product.stockQuantity <= product.minStockAlert
    const isOutOfStock = product.stockQuantity === 0
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '14px',
        border: '1px solid var(--border-light)',
        borderLeft: `3px solid ${isOutOfStock ? '#C62828' : isLowStock ? '#FF6F00' : 'var(--pink)'}`,
        marginBottom: '8px',
      }}>
        {/* Top Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              {product.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {product.category?.name}
              {product.subCategory && ` › ${product.subCategory.name}`}
            </div>
          </div>
          <div style={{
            minWidth: '44px', height: '44px',
            borderRadius: '10px', padding: '0 8px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: isOutOfStock ? '#FFEBEE' : isLowStock ? '#FFF8E1' : '#E8F5E9',
            marginLeft: '10px',
          }}>
            <div style={{
              fontSize: '16px', fontWeight: 800,
              color: isOutOfStock ? '#C62828' : isLowStock ? '#FF6F00' : '#2E7D32',
              lineHeight: 1,
            }}>{product.stockQuantity}</div>
            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>stock</div>
          </div>
        </div>

        {/* Tags */}
        {(product.size || product.color) && (
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {product.size && <span className="badge badge-purple" style={{ fontSize: '10px' }}>{product.size}</span>}
            {product.color && <span className="badge badge-pink" style={{ fontSize: '10px' }}>{product.color}</span>}
          </div>
        )}

        {/* Price Row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <div style={{ flex: 1, padding: '8px', background: '#F9FAFB', borderRadius: '8px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>KUNUNULIA</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{formatCurrency(product.costPrice)}</div>
          </div>
          <div style={{ flex: 1, padding: '8px', background: 'var(--pink-light)', borderRadius: '8px' }}>
            <div style={{ fontSize: '9px', color: 'var(--pink)', fontWeight: 600, marginBottom: '2px' }}>KUUZIA</div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--pink)' }}>{formatCurrency(product.sellingPrice)}</div>
          </div>
          {product.supplier && (
            <div style={{ flex: 1, padding: '8px', background: '#F3E8FF', borderRadius: '8px' }}>
              <div style={{ fontSize: '9px', color: 'var(--purple)', fontWeight: 600, marginBottom: '2px' }}>SUPPLIER</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--purple)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.supplier}</div>
            </div>
          )}
        </div>

        {/* Low stock warning */}
        {isLowStock && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: isOutOfStock ? '#FFEBEE' : '#FFF8E1', borderRadius: '6px', marginBottom: '10px' }}>
            <AlertTriangle size={12} style={{ color: isOutOfStock ? '#C62828' : '#FF6F00', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: isOutOfStock ? '#C62828' : '#FF6F00' }}>
              {isOutOfStock ? 'Stock imeisha kabisa!' : `Stock inakwisha — min: ${product.minStockAlert}`}
            </span>
          </div>
        )}

        {/* Actions */}
        {isOwner() && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
            <button onClick={() => { setSelected(product); setStockForm({ quantity: '', reason: '', costPrice: '' }); setModal('stock-in') }}
              style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#E8F5E9', color: '#2E7D32', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
              + Stock
            </button>
            <button onClick={() => openEdit(product)}
              style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#E3F2FD', color: '#1565C0', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
              <Edit size={12} /> Edit
            </button>
            <button onClick={() => { setSelected(product); setAdjustForm({ newQuantity: product.stockQuantity, reason: '' }); setModal('adjust') }}
              style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#FFF8E1', color: '#E65100', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
              Rekebisha
            </button>
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
          <div className="page-title">Bidhaa / Inventory</div>
          <div className="page-sub">{totalProducts} bidhaa zote kwenye mfumo</div>
        </div>
        {isOwner() && (
          <button className="btn btn-primary" onClick={() => {
            setForm({ name: '', categoryId: '', subCategoryId: '', size: '', color: '', costPrice: '', sellingPrice: '', stockQuantity: '', minStockAlert: '5', supplier: '' })
            setModal('add')
          }}>
            <Plus size={15} /> {isMobile ? 'Ongeza' : 'Bidhaa Mpya'}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {[
          { label: 'Bidhaa Zote', value: totalProducts, icon: Package, color: 'var(--pink)', bg: 'var(--pink-light)' },
          { label: 'Zinazokwisha', value: lowStockCount, icon: AlertTriangle, color: '#FF6F00', bg: '#FFF8E1' },
          { label: 'Ukurasa', value: `${page}/${data?.pagination?.totalPages || 1}`, icon: TrendingUp, color: '#2E7D32', bg: '#E8F5E9' },
          { label: 'Inaonyesha', value: data?.data?.length || 0, icon: Eye, color: 'var(--purple)', bg: 'var(--purple-light)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={13} style={{ color }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color }}>{value}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.3, borderRadius: '0 0 12px 12px' }} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div className="input-wrap" style={{ flex: 1, minWidth: '160px' }}>
          <span className="input-icon"><Search size={14} /></span>
          <input className="input" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tafuta bidhaa..." />
        </div>
        <select className="input" style={{ width: isMobile ? '100%' : '170px' }}
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}>
          <option value="">📦 Categories Zote</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || categoryFilter) && (
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setCategoryFilter(''); setPage(1) }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Products — Mobile Cards OR Desktop Table */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div className="skeleton" style={{ height: '14px', flex: 2 }} />
                <div className="skeleton" style={{ height: '14px', flex: 1 }} />
              </div>
              <div className="skeleton" style={{ height: '10px', width: '50%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '32px', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="card empty-state">
          <Package size={40} />
          <p>Hakuna bidhaa — ongeza ya kwanza!</p>
        </div>
      ) : isMobile ? (
        // ═══ MOBILE — Cards ═══
        <div>
          {data?.data?.map((product, index) => (
            <MobileProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      ) : (
        // ═══ DESKTOP — Table ═══
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bidhaa</th>
                  <th>Category</th>
                  <th>Size / Rangi</th>
                  <th>Bei Kununulia</th>
                  <th>Bei Kuuzia</th>
                  <th>Stock</th>
                  <th>Supplier</th>
                  {isOwner() && <th style={{ textAlign: 'center' }}>Vitendo</th>}
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((product, index) => {
                  const isLowStock = product.stockQuantity <= product.minStockAlert
                  const isOutOfStock = product.stockQuantity === 0
                  return (
                    <tr key={product.id} style={{
                      background: isOutOfStock ? '#FFF5F5' : isLowStock ? '#FFFBF0' : 'white',
                    }}>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {(page - 1) * 15 + index + 1}
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{product.name}</div>
                        {isLowStock && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                            <AlertTriangle size={10} style={{ color: isOutOfStock ? '#C62828' : '#FF6F00' }} />
                            <span style={{ fontSize: '9px', color: isOutOfStock ? '#C62828' : '#FF6F00', fontWeight: 600 }}>
                              {isOutOfStock ? 'Imeisha!' : 'Inakwisha'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{product.category?.name}</div>
                        {product.subCategory && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>› {product.subCategory.name}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {product.size && <span className="badge badge-purple" style={{ fontSize: '10px' }}>{product.size}</span>}
                          {product.color && <span className="badge badge-pink" style={{ fontSize: '10px' }}>{product.color}</span>}
                          {!product.size && !product.color && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{formatCurrency(product.costPrice)}</td>
                      <td style={{ fontSize: '13px', fontWeight: 800, color: 'var(--pink)' }}>{formatCurrency(product.sellingPrice)}</td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '36px', height: '26px', borderRadius: '6px', padding: '0 8px', fontSize: '13px', fontWeight: 800, background: isOutOfStock ? '#FFEBEE' : isLowStock ? '#FFF8E1' : '#E8F5E9', color: isOutOfStock ? '#C62828' : isLowStock ? '#FF6F00' : '#2E7D32' }}>
                          {product.stockQuantity}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>min: {product.minStockAlert}</div>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{product.supplier || '—'}</td>
                      {isOwner() && (
                        <td>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button onClick={() => { setSelected(product); setStockForm({ quantity: '', reason: '', costPrice: '' }); setModal('stock-in') }}
                              style={{ padding: '4px 8px', borderRadius: '5px', border: 'none', background: '#E8F5E9', color: '#2E7D32', fontSize: '10px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              + Stock
                            </button>
                            <button onClick={() => openEdit(product)}
                              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px', borderRadius: '5px', border: 'none', background: '#E3F2FD', color: '#1565C0', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                              <Edit size={11} /> Edit
                            </button>
                            <button onClick={() => { setSelected(product); setAdjustForm({ newQuantity: product.stockQuantity, reason: '' }); setModal('adjust') }}
                              style={{ padding: '4px 8px', borderRadius: '5px', border: 'none', background: '#FFF8E1', color: '#E65100', fontSize: '10px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              Rekebisha
                            </button>
                          </div>
                        </td>
                      )}
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
            {((page-1)*(isMobile?10:15))+1}–{Math.min(page*(isMobile?10:15), totalProducts)} / {totalProducts}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-ghost" onClick={() => setPage(1)} disabled={page===1}
              style={{ padding: '6px 10px', fontSize: '12px' }}>«</button>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
              style={{ padding: '6px 10px', fontSize: '12px' }}>‹</button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '12px', fontWeight: 600, background: 'var(--pink-light)', color: 'var(--pink)', borderRadius: '8px' }}>
              {page}/{data?.pagination?.totalPages}
            </span>
            <button className="btn btn-ghost" onClick={() => setPage(p=>p+1)} disabled={page>=data?.pagination?.totalPages}
              style={{ padding: '6px 10px', fontSize: '12px' }}>›</button>
            <button className="btn btn-ghost" onClick={() => setPage(data?.pagination?.totalPages)} disabled={page>=data?.pagination?.totalPages}
              style={{ padding: '6px 10px', fontSize: '12px' }}>»</button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Ongeza Bidhaa Mpya' : `Badilisha: ${selected?.name}`} onClose={() => setModal(null)} wide>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Jina la Bidhaa *</label>
              <input className="input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Mfano: Dress ya Msichana"
                maxLength={100} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value, subCategoryId: '' })} required>
                  <option value="">Chagua Category</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subcategory</label>
                <select className="input" value={form.subCategoryId} onChange={e => setForm({ ...form, subCategoryId: e.target.value })}>
                  <option value="">Chagua Subcategory</option>
                  {selectedCategory?.subCategories?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Size</label>
                <input className="input" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="0-3M, 1Yr, S, M..." />
              </div>
              <div className="form-group">
                <label className="form-label">Rangi</label>
                <input className="input" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Pink, Blue, Red..." />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Bei ya Kununulia (TZS) *</label>
                <input className="input" type="number" value={form.costPrice}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setForm({ ...form, costPrice: val })
                  }}
                  placeholder="0" min={1} required />
              </div>
              <div className="form-group">
                <label className="form-label">Bei ya Kuuzia (TZS) *</label>
                <input className="input" type="number" value={form.sellingPrice}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setForm({ ...form, sellingPrice: val })
                  }}
                  placeholder="0" min={1} required />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Stock ya Awali</label>
                <input className="input" type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Kiwango cha Onyo</label>
                <input className="input" type="number" value={form.minStockAlert} onChange={e => setForm({ ...form, minStockAlert: e.target.value })} placeholder="5" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input className="input" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Jina la supplier" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              Hifadhi Bidhaa
            </button>
          </form>
        </Modal>
      )}

      {modal === 'stock-in' && (
        <Modal title={`➕ Ongeza Stock — ${selected?.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Stock ya Sasa</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>{selected?.stockQuantity}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selected?.name}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Idadi ya Kuongeza *</label>
              <input className="input" type="number" value={stockForm.quantity}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  setStockForm({ ...stockForm, quantity: val })
                }}
                placeholder="0" min={1} required
                style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Bei Mpya ya Kununulia (optional)</label>
              <input className="input" type="number" value={stockForm.costPrice} onChange={e => setStockForm({ ...stockForm, costPrice: e.target.value })} placeholder={`Sasa: ${formatCurrency(selected?.costPrice)}`} />
            </div>
            <div className="form-group">
              <label className="form-label">Sababu</label>
              <input className="input" value={stockForm.reason} onChange={e => setStockForm({ ...stockForm, reason: e.target.value })} placeholder="Mfano: Manunuzi mapya" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}>
              Ongeza Stock
            </button>
          </form>
        </Modal>
      )}

      {modal === 'adjust' && (
        <Modal title={`🔧 Rekebisha Stock — ${selected?.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#FFF8E1', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #FFE082' }}>
              <div style={{ fontSize: '11px', color: '#E65100', marginBottom: '4px' }}>Stock ya Sasa</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#FF6F00' }}>{selected?.stockQuantity}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selected?.name}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Idadi Mpya *</label>
              <input className="input" type="number" value={adjustForm.newQuantity} onChange={e => setAdjustForm({ ...adjustForm, newQuantity: e.target.value })} required style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Sababu ya Marekebisho *</label>
              <textarea className="input" value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="Eleza sababu..." rows={3} style={{ resize: 'none' }} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', background: 'linear-gradient(135deg, #FF6F00, #E65100)' }}>
              Rekebisha Stock
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}