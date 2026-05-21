import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, ShoppingCart, CheckCircle, Printer, User, Phone, X } from 'lucide-react'
import { validateName, validatePhone } from '../utils/validation'
const Modal = ({ title, onClose, children, wide }) => (
  <div className="modal-overlay">
    <div className="modal-box" style={{ maxWidth: wide ? '720px' : '440px' }}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
)

const formatCurrency = (a) => `TZS ${parseFloat(a || 0).toLocaleString()}`

const printReceipt = (receipt, paidAmt) => {
  const win = window.open('', '_blank', 'width=400,height=650')
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Receipt #${receipt.receiptNumber?.slice(0,8).toUpperCase()}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Courier New',monospace;font-size:12px;padding:16px;max-width:300px;margin:0 auto}
      .c{text-align:center}.b{font-weight:bold}
      .line{border-top:1px dashed #000;margin:8px 0}
      .row{display:flex;justify-content:space-between;margin:3px 0}
      .logo{width:55px;height:55px;border-radius:50%;object-fit:cover;margin:0 auto 6px;display:block}
      .footer{margin-top:12px;font-size:10px;text-align:center;color:#555}
      @media print{body{padding:4px}}
    </style></head><body>
    <div class="c">
      <img src="/logo.jpeg" class="logo" onerror="this.style.display='none'"/>
      <div class="b" style="font-size:15px">Keysha Kids Collection</div>
      <div>RECEIPT YA MAUZO</div>
    </div>
    <div class="line"></div>
    <div class="row"><span>Receipt No:</span><span class="b">#${receipt.receiptNumber?.slice(0,8).toUpperCase()}</span></div>
    <div class="row"><span>Tarehe:</span><span>${new Date(receipt.createdAt).toLocaleString('sw-TZ')}</span></div>
    <div class="row"><span>Cashier:</span><span>${receipt.cashier?.name || '-'}</span></div>
    ${receipt.customer ? `<div class="row"><span>Mteja:</span><span class="b">${receipt.customer.name}</span></div>` : ''}
    ${receipt.customer?.phone && !receipt.customer.phone.startsWith('guest_') ? `<div class="row"><span>Simu:</span><span>${receipt.customer.phone}</span></div>` : ''}
    <div class="line"></div>
    <div class="b" style="margin-bottom:4px">BIDHAA:</div>
    ${receipt.saleItems?.map(item => `<div class="row"><span>${item.product?.name} ×${item.quantity}</span><span>${formatCurrency(item.subtotal)}</span></div>`).join('')}
    <div class="line"></div>
    ${parseFloat(receipt.discount) > 0 ? `<div class="row"><span>Jumla:</span><span>${formatCurrency(parseFloat(receipt.totalAmount) + parseFloat(receipt.discount))}</span></div><div class="row"><span>Punguzo:</span><span>-${formatCurrency(receipt.discount)}</span></div>` : ''}
    <div class="row b"><span>JUMLA YA KULIPA:</span><span>${formatCurrency(receipt.totalAmount)}</span></div>
    <div class="row"><span>Aina ya Malipo:</span><span>${receipt.paymentType}</span></div>
    ${receipt.paymentType === 'CASH' && paidAmt ? `<div class="row"><span>Pesa Iliyotolewa:</span><span>${formatCurrency(paidAmt)}</span></div><div class="row b"><span>CHENJI:</span><span>${formatCurrency(parseFloat(paidAmt) - parseFloat(receipt.totalAmount))}</span></div>` : ''}
    ${receipt.paymentType !== 'CASH' ? `<div class="row"><span>Lililipwa:</span><span>${formatCurrency(receipt.paidAmount)}</span></div><div class="row b" style="color:#c00"><span>DENI LILILOBAKI:</span><span>${formatCurrency(parseFloat(receipt.totalAmount) - parseFloat(receipt.paidAmount))}</span></div>` : ''}
    <div class="line"></div>
    <div class="footer"><p>Asante kwa kununua Keysha Kids!</p><p>📞 0622146487 | 0626030263</p><p>@keysha_kids_collection</p></div>
    <script>window.onload=()=>window.print()</script>
    </body></html>
  `)
  win.document.close()
}

export default function Sales() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // POS State
  const [cart, setCart] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [paymentType, setPaymentType] = useState('CASH')
  const [paidAmount, setPaidAmount] = useState('')
  const [discount, setDiscount] = useState('0')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [savedPaidAmount, setSavedPaidAmount] = useState(0)
  const [posStep, setPosStep] = useState('products') // products | cart

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 10, ...(search && { search }) })
      return (await api.get(`/sales?${params}`)).data
    },
  })

  const { data: products } = useQuery({
    queryKey: ['products-pos', productSearch],
    queryFn: async () => (await api.get(`/products?search=${productSearch}&limit=30`)).data.data,
    enabled: modal === 'pos',
    staleTime: 30000,
  })

  const createSale = useMutation({
    mutationFn: (data) => api.post('/sales', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['sales'])
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['customers'])
      queryClient.invalidateQueries(['debts'])
      setSavedPaidAmount(parseFloat(paidAmount) || 0)
      setReceipt(res.data.data)
      setModal('receipt')
      resetPOS()
      toast.success('Mauzo yamefanywa!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const voidSale = useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/sales/${id}/void`, { reason }),
    onSuccess: () => { queryClient.invalidateQueries(['sales']); toast.success('Mauzo yamefutwa!') },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const resetPOS = () => {
    setCart([]); setPaymentType('CASH'); setPaidAmount('')
    setDiscount('0'); setCustomerName(''); setCustomerPhone('')
    setProductSearch(''); setPosStep('products')
  }

  const addToCart = (product) => {
    if (product.stockQuantity === 0) return toast.error('Stock imeisha!')
    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id)
      if (ex) {
        if (ex.quantity >= product.stockQuantity) return (toast.error('Stock haitoshi!'), prev)
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, sellingPrice: parseFloat(product.sellingPrice), stockQuantity: product.stockQuantity, quantity: 1 }]
    })
    if (isMobile) toast.success(`${product.name} imeongezwa!`, { duration: 1500 })
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.productId !== id))
    else setCart(prev => prev.map(i => i.productId === id ? { ...i, quantity: qty } : i))
  }

  const total = cart.reduce((s, i) => s + i.sellingPrice * i.quantity, 0)
  const disc = parseFloat(discount) || 0
  const finalTotal = total - disc
  const paid = parseFloat(paidAmount) || 0
  const change = paid - finalTotal
  const debtRemaining = finalTotal - paid

  const handleSale = () => {
    if (cart.length === 0) return toast.error('Ongeza bidhaa!')

    // Validate jina la mteja kama si cash
    if (paymentType !== 'CASH') {
      const nameError = validateName(customerName)
      if (nameError) return toast.error(`Mteja: ${nameError}`)
    }

    // Validate simu kama imewekwa
    if (customerPhone.trim()) {
      const phoneError = validatePhone(customerPhone)
      if (phoneError) return toast.error(`Simu: ${phoneError}`)
    }

    if (paymentType === 'CASH' && paid < finalTotal) return toast.error('Pesa haitoshi!')
    if (paymentType === 'PARTIAL' && paid >= finalTotal) return toast.error('Malipo kamili — tumia Cash!')
    if (paymentType === 'PARTIAL' && paid <= 0) return toast.error('Weka pesa iliyolipwa!')

    createSale.mutate({
      items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
      paymentType, paidAmount: paymentType === 'CREDIT' ? 0 : paid,
      discount: disc, customerName: customerName.trim() || null,
      customerPhone: customerPhone.trim() || null,
    })
  }

  // ═══ MOBILE SALE CARD ═══
  const MobileSaleCard = ({ sale }) => {
    const saleChange = sale.paymentType === 'CASH'
      ? parseFloat(sale.paidAmount) - parseFloat(sale.totalAmount) : 0
    return (
      <div style={{
        background: 'white', borderRadius: '12px', padding: '14px',
        border: '1px solid var(--border-light)', marginBottom: '8px',
        borderLeft: `3px solid ${sale.isVoided ? '#E5E7EB' : sale.paymentType === 'CASH' ? '#2E7D32' : sale.paymentType === 'CREDIT' ? '#C62828' : '#FF6F00'}`,
        opacity: sale.isVoided ? 0.6 : 1,
      }}>
        {/* Top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--pink)', marginBottom: '2px' }}>
              #{sale.receiptNumber?.slice(0,8).toUpperCase()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {new Date(sale.createdAt).toLocaleString('sw-TZ')}
            </div>
            {sale.customer && (
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--purple)', marginTop: '2px' }}>
                👤 {sale.customer.name}
                {sale.customer.phone && !sale.customer.phone.startsWith('guest_') && ` • ${sale.customer.phone}`}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--pink)', marginBottom: '4px' }}>
              {formatCurrency(sale.totalAmount)}
            </div>
            {sale.isVoided
              ? <span className="badge badge-gray">Imefutwa</span>
              : <span className={`badge ${sale.paymentType === 'CASH' ? 'badge-success' : sale.paymentType === 'CREDIT' ? 'badge-danger' : 'badge-warning'}`}>
                  {sale.paymentType}
                </span>
            }
          </div>
        </div>

        {/* Chenji / Deni */}
        {sale.paymentType === 'CASH' && saleChange > 0 && (
          <div style={{ padding: '6px 10px', background: '#E8F5E9', borderRadius: '6px', marginBottom: '8px', fontSize: '11px', color: '#2E7D32', fontWeight: 700 }}>
            Chenji: {formatCurrency(saleChange)}
          </div>
        )}
        {sale.paymentType !== 'CASH' && (
          <div style={{ padding: '6px 10px', background: '#FFEBEE', borderRadius: '6px', marginBottom: '8px', fontSize: '11px', color: '#C62828', fontWeight: 700 }}>
            Deni: {formatCurrency(parseFloat(sale.totalAmount) - parseFloat(sale.paidAmount))}
          </div>
        )}

        {/* Items */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {sale.saleItems?.map(item => (
            <span key={item.id} className="badge badge-gray" style={{ fontSize: '10px' }}>
              {item.product?.name} ×{item.quantity}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => { setReceipt(sale); setSavedPaidAmount(parseFloat(sale.paidAmount)); setModal('receipt') }}
            style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', background: 'var(--pink-light)', color: 'var(--pink)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
            👁 Ona
          </button>
          <button onClick={() => printReceipt(sale, sale.paidAmount)}
            style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', background: '#E3F2FD', color: '#1565C0', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
            🖨️ Chapisha
          </button>
          {!sale.isVoided && (
            <button onClick={() => { const r = window.prompt('Sababu:'); if (r) voidSale.mutate({ id: sale.id, reason: r }) }}
              style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', background: '#FFEBEE', color: '#C62828', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
              ✕ Futa
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
          <div className="page-title">Mauzo / POS</div>
          <div className="page-sub">{salesData?.pagination?.total || 0} mauzo yote</div>
        </div>
        <button className="btn btn-primary" onClick={() => { resetPOS(); setModal('pos') }}>
          <Plus size={15} /> {isMobile ? 'Uza' : 'Mauzo Mapya'}
        </button>
      </div>

      {/* Search */}
      <div className="input-wrap">
        <span className="input-icon"><Search size={14} /></span>
        <input className="input" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Tafuta kwa risiti au jina la mteja..." />
      </div>

      {/* Sales List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <div className="skeleton" style={{ height: '14px', width: '20%' }} />
                <div className="skeleton" style={{ height: '14px', width: '30%' }} />
                <div className="skeleton" style={{ height: '14px', flex: 1 }} />
              </div>
              <div className="skeleton" style={{ height: '10px', width: '60%' }} />
            </div>
          ))}
        </div>
      ) : salesData?.data?.length === 0 ? (
        <div className="card empty-state">
          <ShoppingCart size={40} />
          <p>Hakuna mauzo bado — anza mauzo ya kwanza!</p>
        </div>
      ) : isMobile ? (
        // ═══ MOBILE ═══
        <div>
          {salesData?.data?.map(sale => <MobileSaleCard key={sale.id} sale={sale} />)}
        </div>
      ) : (
        // ═══ DESKTOP TABLE ═══
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tarehe</th>
                  <th>Mteja</th>
                  <th>Jumla (TZS)</th>
                  <th>Pesa Iliyotolewa</th>
                  <th>Chenji / Deni</th>
                  <th>Malipo</th>
                  <th style={{ textAlign: 'center' }}>Vitendo</th>
                </tr>
              </thead>
              <tbody>
                {salesData?.data?.map((sale) => {
                  const saleChange = sale.paymentType === 'CASH'
                    ? parseFloat(sale.paidAmount) - parseFloat(sale.totalAmount) : 0
                  return (
                    <tr key={sale.id} style={{ opacity: sale.isVoided ? 0.5 : 1 }}>
                      <td style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--pink)', fontWeight: 700 }}>
                        #{sale.receiptNumber?.slice(0,6).toUpperCase()}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(sale.createdAt).toLocaleString('sw-TZ')}
                      </td>
                      <td>
                        {sale.customer ? (
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700 }}>{sale.customer.name}</div>
                            {sale.customer.phone && !sale.customer.phone.startsWith('guest_') && (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sale.customer.phone}</div>
                            )}
                          </div>
                        ) : <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kawaida</span>}
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 800, color: 'var(--pink)' }}>
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {formatCurrency(sale.paidAmount)}
                      </td>
                      <td>
                        {sale.paymentType === 'CASH' && saleChange >= 0
                          ? <span style={{ fontSize: '12px', fontWeight: 700, color: '#2E7D32' }}>{formatCurrency(saleChange)}</span>
                          : <span style={{ fontSize: '12px', fontWeight: 700, color: '#C62828' }}>
                              Deni: {formatCurrency(parseFloat(sale.totalAmount) - parseFloat(sale.paidAmount))}
                            </span>
                        }
                      </td>
                      <td>
                        {sale.isVoided
                          ? <span className="badge badge-gray">Imefutwa</span>
                          : <span className={`badge ${sale.paymentType === 'CASH' ? 'badge-success' : sale.paymentType === 'CREDIT' ? 'badge-danger' : 'badge-warning'}`}>
                              {sale.paymentType}
                            </span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button onClick={() => { setReceipt(sale); setSavedPaidAmount(parseFloat(sale.paidAmount)); setModal('receipt') }}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'var(--pink-light)', color: 'var(--pink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                            👁
                          </button>
                          <button onClick={() => printReceipt(sale, sale.paidAmount)}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#E3F2FD', color: '#1565C0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                            🖨️
                          </button>
                          {!sale.isVoided && (
                            <button onClick={() => { const r = window.prompt('Sababu ya kufuta:'); if (r) voidSale.mutate({ id: sale.id, reason: r }) }}
                              style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#FFEBEE', color: '#C62828', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              ✕
                            </button>
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
      {salesData?.pagination?.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>←</button>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{page} / {salesData?.pagination?.totalPages}</span>
          <button className="btn btn-ghost" onClick={() => setPage(p=>p+1)} disabled={page>=salesData?.pagination?.totalPages}>→</button>
        </div>
      )}

      {/* ═══════════════════════════
          POS MODAL — RESPONSIVE
      ═══════════════════════════ */}
      {modal === 'pos' && (
        <Modal title={isMobile ? (posStep === 'products' ? '🛒 Chagua Bidhaa' : `💳 Malipo (${cart.length} bidhaa)`) : '🛒 Mauzo Mapya'} onClose={() => setModal(null)} wide={!isMobile}>

          {isMobile ? (
            // ═══ MOBILE POS — Steps ═══
            <div>
              {posStep === 'products' ? (
                // Step 1 — Products
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="input-wrap">
                    <span className="input-icon"><Search size={13} /></span>
                    <input className="input" value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Tafuta bidhaa..." />
                  </div>

                  {/* Cart Summary Bar */}
                  {cart.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--pink-light)', borderRadius: '10px', border: '1px solid var(--pink)' }}>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--pink)' }}>
                          🛒 {cart.length} bidhaa
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--pink)', marginLeft: '8px' }}>
                          = {formatCurrency(finalTotal)}
                        </span>
                      </div>
                      <button onClick={() => setPosStep('cart')} className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}>
                        Endelea →
                      </button>
                    </div>
                  )}

                  {/* Products List */}
                  <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {products?.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        <ShoppingCart size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                        <p style={{ fontSize: '12px' }}>Hakuna bidhaa</p>
                      </div>
                    )}
                    {products?.map(product => {
                      const inCart = cart.find(i => i.productId === product.id)
                      return (
                        <button key={product.id} onClick={() => addToCart(product)}
                          disabled={product.stockQuantity === 0}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px', borderRadius: '10px',
                            border: `1.5px solid ${inCart ? 'var(--pink)' : 'var(--border-light)'}`,
                            background: inCart ? '#FFF0F7' : 'white',
                            cursor: 'pointer', textAlign: 'left',
                            opacity: product.stockQuantity === 0 ? 0.4 : 1,
                          }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{product.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {product.category?.name}{product.size && ` • ${product.size}`}{product.color && ` • ${product.color}`}
                              {' '}• <span style={{ color: product.stockQuantity <= 5 ? '#FF6F00' : 'inherit' }}>Stock: {product.stockQuantity}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--pink)' }}>{formatCurrency(product.sellingPrice)}</div>
                            {inCart && <div style={{ fontSize: '10px', color: 'var(--pink)', fontWeight: 600 }}>×{inCart.quantity} cart</div>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                // Step 2 — Cart & Payment
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Back Button */}
                  <button onClick={() => setPosStep('products')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', padding: '0' }}>
                    ← Rudi kuchagua bidhaa
                  </button>

                  {/* Cart Items */}
                  <div style={{ background: '#F9FAFB', borderRadius: '10px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', background: '#F3F4F6', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>BIDHAA ZILIZOCHAGULIWA ({cart.length})</span>
                      <button onClick={() => setCart([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C62828', fontSize: '10px', fontWeight: 700 }}>Futa Yote</button>
                    </div>
                    {cart.map(item => (
                      <div key={item.productId} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border-light)', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--pink)', fontWeight: 700 }}>{formatCurrency(item.sellingPrice * item.quantity)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button onClick={() => updateQty(item.productId, item.quantity - 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                          <span style={{ fontSize: '13px', fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.productId, item.quantity + 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'var(--pink)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
                          <button onClick={() => updateQty(item.productId, 0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C62828' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Punguzo */}
                  <div className="form-group">
                    <label className="form-label">Punguzo (TZS)</label>
                    <input className="input" type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
                  </div>

                  {/* Total */}
                  <div style={{ background: 'linear-gradient(135deg, #FFF0F7, #F3E8FF)', borderRadius: '10px', padding: '12px 14px', border: '1px solid #F9C8E0' }}>
                    {disc > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Jumla</span><span>{formatCurrency(total)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: 'var(--pink)' }}>
                      <span>JUMLA</span><span>{formatCurrency(finalTotal)}</span>
                    </div>
                    {paid > 0 && paymentType === 'CASH' && change >= 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: '#2E7D32', marginTop: '6px', borderTop: '1px dashed #F9C8E0', paddingTop: '6px' }}>
                        <span>CHENJI</span><span>{formatCurrency(change)}</span>
                      </div>
                    )}
                    {paid > 0 && paymentType === 'PARTIAL' && debtRemaining > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: '#C62828', marginTop: '6px', borderTop: '1px dashed #F9C8E0', paddingTop: '6px' }}>
                        <span>DENI</span><span>{formatCurrency(debtRemaining)}</span>
                      </div>
                    )}
                  </div>

                  {/* Mteja */}
                  <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      👤 Taarifa za Mteja {paymentType !== 'CASH' && <span style={{ color: '#C62828' }}>*</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="input-wrap">
                        <span className="input-icon"><User size={13} /></span>
                        <input className="input" value={customerName}
                        onChange={e => {
                          const val = e.target.value.replace(/[^a-zA-Z\s\u00C0-\u024F'-]/g, '')
                          setCustomerName(val)
                        }}
                        placeholder={paymentType !== 'CASH' ? 'Jina la mteja *' : 'Jina la mteja (optional)'}
                        style={{ paddingLeft: '34px' }}
                        maxLength={50} />
                      </div>
                      <div className="input-wrap">
                        <span className="input-icon"><Phone size={13} /></span>
                        <input className="input" type="tel" value={customerPhone}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setCustomerPhone(val)
                        }}
                        placeholder="Simu (optional)"
                        style={{ paddingLeft: '34px' }}
                        maxLength={10} inputMode="numeric" />
                      </div>
                    </div>
                  </div>

                  {/* Payment Type */}
                  <div>
                    <div className="form-label" style={{ marginBottom: '8px' }}>Aina ya Malipo</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                      {[
                        { id: 'CASH', label: '💵 Cash' },
                        { id: 'CREDIT', label: '💳 Deni' },
                        { id: 'PARTIAL', label: '🔀 Partial' },
                      ].map(t => (
                        <button key={t.id}
                          onClick={() => { setPaymentType(t.id); if (t.id === 'CASH') setPaidAmount(finalTotal.toString()) }}
                          style={{ padding: '10px 6px', borderRadius: '8px', border: '1.5px solid', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderColor: paymentType === t.id ? 'var(--pink)' : 'var(--border)', background: paymentType === t.id ? 'var(--pink-light)' : 'white', color: paymentType === t.id ? 'var(--pink)' : 'var(--text-secondary)' }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paid Amount */}
                  {paymentType !== 'CREDIT' && (
                    <div className="form-group">
                      <label className="form-label">{paymentType === 'PARTIAL' ? 'Pesa Iliyolipwa Sasa' : 'Pesa Iliyotolewa'} (TZS)</label>
                      <input className="input" type="number" value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                        placeholder={formatCurrency(finalTotal)}
                        style={{ fontSize: '18px', fontWeight: 800, textAlign: 'center' }} />
                    </div>
                  )}

                  {/* Submit */}
                  <button onClick={handleSale} disabled={createSale.isPending || cart.length === 0}
                    className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14px' }}>
                    {createSale.isPending
                      ? <><div className="spinner" /> Inafanya...</>
                      : <><CheckCircle size={18} /> Maliza — {formatCurrency(finalTotal)}</>
                    }
                  </button>
                </div>
              )}
            </div>
          ) : (
            // ═══ DESKTOP POS — 2 columns ═══
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
              {/* LEFT — Products */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chagua Bidhaa</div>
                <div className="input-wrap">
                  <span className="input-icon"><Search size={13} /></span>
                  <input className="input" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Tafuta bidhaa..." style={{ fontSize: '12px' }} />
                </div>
                <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {products?.map(product => (
                    <button key={product.id} onClick={() => addToCart(product)} disabled={product.stockQuantity === 0}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', cursor: 'pointer', textAlign: 'left', opacity: product.stockQuantity === 0 ? 0.4 : 1 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F7'; e.currentTarget.style.borderColor = 'var(--pink)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--border-light)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>{product.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {product.category?.name}{product.size && ` • ${product.size}`}{product.color && ` • ${product.color}`}
                          {' '}• <span style={{ color: product.stockQuantity <= 5 ? '#FF6F00' : 'inherit' }}>Stock: {product.stockQuantity}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--pink)', flexShrink: 0, marginLeft: '8px' }}>{formatCurrency(product.sellingPrice)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT — Cart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>🛒 Cart ({cart.length})</div>
                  {cart.length > 0 && <button onClick={() => setCart([])} style={{ fontSize: '10px', color: '#C62828', background: 'none', border: 'none', cursor: 'pointer' }}>Futa Yote</button>}
                </div>
                <div style={{ minHeight: '100px', maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px', background: '#FAFAFA' }}>
                  {cart.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--text-muted)' }}>
                      <ShoppingCart size={22} style={{ opacity: 0.25, marginBottom: '4px' }} />
                      <span style={{ fontSize: '11px' }}>Cart iko tupu</span>
                    </div>
                  ) : cart.map(item => (
                    <div key={item.productId} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '4px', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatCurrency(item.sellingPrice)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <button onClick={() => updateQty(item.productId, item.quantity - 1)} style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: '11px', fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, item.quantity + 1)} style={{ width: '16px', height: '16px', borderRadius: '50%', border: 'none', background: 'var(--pink)', color: 'white', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pink)', textAlign: 'right' }}>{formatCurrency(item.sellingPrice * item.quantity)}</div>
                      <button onClick={() => updateQty(item.productId, 0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C62828', display: 'flex' }}><Trash2 size={11} /></button>
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">Punguzo (TZS)</label>
                  <input className="input" type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" style={{ fontSize: '12px' }} />
                </div>
                <div style={{ background: 'linear-gradient(135deg, #FFF0F7, #F3E8FF)', borderRadius: '10px', padding: '10px 12px', border: '1px solid #F9C8E0' }}>
                  {disc > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}><span>Jumla</span><span>{formatCurrency(total)}</span></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: 'var(--pink)' }}>
                    <span>JUMLA YA KULIPA</span><span>{formatCurrency(finalTotal)}</span>
                  </div>
                  {paid > 0 && paymentType === 'CASH' && change >= 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: '#2E7D32', marginTop: '4px', borderTop: '1px dashed #F9C8E0', paddingTop: '4px' }}>
                      <span>CHENJI</span><span>{formatCurrency(change)}</span>
                    </div>
                  )}
                  {paid > 0 && paymentType === 'PARTIAL' && debtRemaining > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: '#C62828', marginTop: '4px', borderTop: '1px dashed #F9C8E0', paddingTop: '4px' }}>
                      <span>DENI LINALOBAKI</span><span>{formatCurrency(debtRemaining)}</span>
                    </div>
                  )}
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '10px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '7px' }}>
                    👤 Mteja {paymentType !== 'CASH' && <span style={{ color: '#C62828' }}>*</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="input-wrap">
                      <span className="input-icon"><User size={12} /></span>
                      <input className="input" value={customerName}
                        onChange={e => {
                          const val = e.target.value.replace(/[^a-zA-Z\s\u00C0-\u024F'-]/g, '')
                          setCustomerName(val)
                        }}
                        placeholder={paymentType !== 'CASH' ? 'Jina *' : 'Jina (optional)'}
                        style={{ fontSize: '12px', paddingLeft: '32px' }}
                        maxLength={50} />
                    </div>
                    <div className="input-wrap">
                      <span className="input-icon"><Phone size={12} /></span>
                      <input className="input" type="tel" value={customerPhone}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setCustomerPhone(val)
                        }}
                        placeholder="Simu (optional)"
                        style={{ fontSize: '12px', paddingLeft: '32px' }}
                        maxLength={10} inputMode="numeric" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="form-label" style={{ marginBottom: '6px' }}>Aina ya Malipo</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '5px' }}>
                    {[{ id: 'CASH', label: '💵 Cash' }, { id: 'CREDIT', label: '💳 Deni' }, { id: 'PARTIAL', label: '🔀 Partial' }].map(t => (
                      <button key={t.id} onClick={() => { setPaymentType(t.id); if (t.id === 'CASH') setPaidAmount(finalTotal.toString()) }}
                        style={{ padding: '7px', borderRadius: '7px', border: '1.5px solid', fontSize: '11px', fontWeight: 600, cursor: 'pointer', borderColor: paymentType === t.id ? 'var(--pink)' : 'var(--border)', background: paymentType === t.id ? 'var(--pink-light)' : 'white', color: paymentType === t.id ? 'var(--pink)' : 'var(--text-secondary)' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                {paymentType !== 'CREDIT' && (
                  <div className="form-group">
                    <label className="form-label">{paymentType === 'PARTIAL' ? 'Pesa Iliyolipwa Sasa' : 'Pesa Iliyotolewa'} (TZS)</label>
                    <input className="input" type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder={formatCurrency(finalTotal)} style={{ fontSize: '14px', fontWeight: 700, textAlign: 'center' }} />
                  </div>
                )}
                <button onClick={handleSale} disabled={createSale.isPending || cart.length === 0} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13px' }}>
                  {createSale.isPending ? <><div className="spinner" /> Inafanya...</> : <><CheckCircle size={16} /> Maliza — {formatCurrency(finalTotal)}</>}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Receipt Modal */}
      {modal === 'receipt' && receipt && (
        <Modal title="🧾 Receipt ya Mauzo" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'white', border: '1px dashed var(--border)', borderRadius: '10px', padding: '18px', fontFamily: 'monospace' }}>
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <img src="/logo.jpeg" alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 6px', display: 'block' }} onError={e => e.target.style.display='none'} />
                <div style={{ fontWeight: 800, fontSize: '14px' }}>Keysha Kids Collection</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RECEIPT YA MAUZO</div>
                <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', marginBottom: '8px' }}>
                {[
                  { label: 'Receipt No', value: `#${receipt.receiptNumber?.slice(0,8).toUpperCase()}`, bold: true },
                  { label: 'Tarehe', value: new Date(receipt.createdAt).toLocaleString('sw-TZ') },
                  { label: 'Cashier', value: receipt.cashier?.name },
                  receipt.customer && { label: 'Mteja', value: receipt.customer.name, bold: true },
                  receipt.customer?.phone && !receipt.customer.phone.startsWith('guest_') && { label: 'Simu', value: receipt.customer.phone },
                ].filter(Boolean).map(({ label, value, bold }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '8px 0', marginBottom: '8px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>BIDHAA</div>
                {receipt.saleItems?.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>{item.product?.name} ×{item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
                {parseFloat(receipt.discount) > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Jumla</span><span>{formatCurrency(parseFloat(receipt.totalAmount) + parseFloat(receipt.discount))}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E65100' }}><span>Punguzo</span><span>− {formatCurrency(receipt.discount)}</span></div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: 'var(--pink)', borderTop: '1px dashed #ccc', paddingTop: '5px', marginTop: '2px' }}>
                  <span>JUMLA YA KULIPA</span><span>{formatCurrency(receipt.totalAmount)}</span>
                </div>
                {receipt.paymentType === 'CASH' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Pesa Iliyotolewa</span><span>{formatCurrency(savedPaidAmount || receipt.paidAmount)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#2E7D32', fontSize: '12px' }}><span>CHENJI</span><span>{formatCurrency((savedPaidAmount || parseFloat(receipt.paidAmount)) - parseFloat(receipt.totalAmount))}</span></div>
                  </>
                )}
                {receipt.paymentType !== 'CASH' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Lililipwa</span><span style={{ color: '#2E7D32', fontWeight: 700 }}>{formatCurrency(receipt.paidAmount)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#C62828', fontSize: '12px' }}><span>DENI LILILOBAKI</span><span>{formatCurrency(parseFloat(receipt.totalAmount) - parseFloat(receipt.paidAmount))}</span></div>
                  </>
                )}
              </div>
              <div style={{ borderTop: '1px dashed #ccc', marginTop: '10px', paddingTop: '8px', textAlign: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>
                <div>Asante kwa kununua Keysha Kids! 🙏</div>
                <div>📞 0622146487 | 0626030263</div>
                <div>@keysha_kids_collection</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => printReceipt(receipt, savedPaidAmount || receipt.paidAmount)} className="btn btn-ghost" style={{ justifyContent: 'center', padding: '10px' }}>
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