import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Edit, Power, Key, Users as UsersIcon, Phone, Shield, UserCheck, UserX } from 'lucide-react'
import { validateName, validatePhone, validatePin, validatePassword } from '../utils/validation'

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

export default function Users() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', pin: '', password: '', newPin: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data.data,
  })

  const createUser = useMutation({
    mutationFn: (data) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Mfanyakazi ameongezwa!')
      setModal(null)
      setForm({ name: '', phone: '', pin: '', password: '', newPin: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const updateUser = useMutation({
    mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Taarifa zimebadilishwa!')
      setModal(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const toggleStatus = useMutation({
    mutationFn: (id) => api.patch(`/users/${id}/toggle-status`),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('Hali imebadilishwa!') },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const resetPin = useMutation({
    mutationFn: ({ id, newPin }) => api.patch(`/users/${id}/reset-pin`, { newPin }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('PIN imebadilishwa!')
      setModal(null)
      setForm({ name: '', phone: '', pin: '', password: '', newPin: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const handleSubmit = (e) => {
  e.preventDefault()

  if (modal === 'add') {
    // Validate jina
    const nameError = validateName(form.name)
    if (nameError) return toast.error(nameError)

    // Validate simu
    const phoneError = validatePhone(form.phone)
    if (phoneError) return toast.error(phoneError)

    // Validate PIN
    const pinError = validatePin(form.pin)
    if (pinError) return toast.error(pinError)

    // Validate password kama imewekwa
    if (form.password) {
      const passError = validatePassword(form.password)
      if (passError) return toast.error(passError)
    }

    createUser.mutate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      pin: form.pin.trim(),
      password: form.password || undefined,
    })

  } else if (modal === 'edit') {
    // Validate jina
    const nameError = validateName(form.name)
    if (nameError) return toast.error(nameError)

    // Validate simu
    const phoneError = validatePhone(form.phone)
    if (phoneError) return toast.error(phoneError)

    updateUser.mutate({
      id: selected.id,
      data: { name: form.name.trim(), phone: form.phone.trim() },
    })

  } else if (modal === 'reset-pin') {
    // Validate PIN
    const pinError = validatePin(form.newPin)
    if (pinError) return toast.error(pinError)

    resetPin.mutate({ id: selected.id, newPin: form.newPin.trim() })
  }
}

  const owners = data?.filter(u => u.role === 'OWNER') || []
  const cashiers = data?.filter(u => u.role === 'CASHIER') || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Wafanyakazi</div>
          <div className="page-sub">
            {data?.length || 0} wafanyakazi wote • {data?.filter(u => u.isActive).length || 0} wanaofanya kazi
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setModal('add')
          setForm({ name: '', phone: '', pin: '', password: '', newPin: '' })
        }}>
          <Plus size={15} /> Mfanyakazi Mpya
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4">
        {[
          { label: 'Wafanyakazi Wote', value: data?.length || 0, color: 'var(--pink)', bg: 'var(--pink-light)', icon: UsersIcon },
          { label: 'Wanaofanya Kazi', value: data?.filter(u => u.isActive).length || 0, color: '#2E7D32', bg: '#E8F5E9', icon: UserCheck },
          { label: 'Waliozimwa', value: data?.filter(u => !u.isActive).length || 0, color: '#C62828', bg: '#FFEBEE', icon: UserX },
          { label: 'Owners', value: owners.length, color: 'var(--purple)', bg: 'var(--purple-light)', icon: Shield },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} style={{ color }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color }}>{value}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.25, borderRadius: '0 0 12px 12px' }} />
          </div>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div className="skeleton" style={{ width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '11px', width: '40%', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ height: '11px', width: '30%' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: '36px', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="card empty-state" style={{ padding: '60px' }}>
          <UsersIcon size={48} style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Hakuna wafanyakazi bado</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>Ongeza mfanyakazi wa kwanza!</p>
        </div>
      ) : (
        <div>
          {/* Owners Section */}
          {owners.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '18px', background: 'var(--purple)', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  👑 Owners ({owners.length})
                </span>
              </div>
              <div className="grid-2">
                {owners.map(user => <UserCard key={user.id} user={user} onEdit={(u) => { setSelected(u); setForm({ name: u.name, phone: u.phone, pin: '', password: '', newPin: '' }); setModal('edit') }} onPin={(u) => { setSelected(u); setForm({ ...form, newPin: '' }); setModal('reset-pin') }} onToggle={(u) => { if (window.confirm(`${u.isActive ? 'Zima' : 'Washa'} akaunti ya ${u.name}?`)) toggleStatus.mutate(u.id) }} />)}
              </div>
            </div>
          )}

          {/* Cashiers Section */}
          {cashiers.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '18px', background: 'var(--pink)', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  👤 Cashiers ({cashiers.length})
                </span>
              </div>
              <div className="grid-2">
                {cashiers.map(user => <UserCard key={user.id} user={user} onEdit={(u) => { setSelected(u); setForm({ name: u.name, phone: u.phone, pin: '', password: '', newPin: '' }); setModal('edit') }} onPin={(u) => { setSelected(u); setForm({ ...form, newPin: '' }); setModal('reset-pin') }} onToggle={(u) => { if (window.confirm(`${u.isActive ? 'Zima' : 'Washa'} akaunti ya ${u.name}?`)) toggleStatus.mutate(u.id) }} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          title={
            modal === 'add' ? 'Ongeza Mfanyakazi Mpya' :
            modal === 'edit' ? `Badilisha: ${selected?.name}` :
            `Reset PIN — ${selected?.name}`
          }
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {modal === 'add' && (
              <>
                <div className="form-group">
                  <label className="form-label">Jina Kamili *</label>
                  // Jina — zuia nambari
                    <input className="input" type="text" value={form.name}
                      onChange={e => {
                        const val = e.target.value.replace(/[^a-zA-Z\s\u00C0-\u024F'-]/g, '')
                        setForm({ ...form, name: val })
                      }}
                      placeholder="Jina la mfanyakazi"
                      maxLength={50} />
                </div>
                <div className="form-group">
                  <label className="form-label">Namba ya Simu *</label>
                  // Simu — nambari tu, max 10
                  <input className="input" type="tel" value={form.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setForm({ ...form, phone: val })
                    }}
                    placeholder="0700000000"
                    maxLength={10}
                    inputMode="numeric" />
                </div>
                <div className="form-group">
                  <label className="form-label">PIN (nambari 4-6) *</label>
                 // PIN — nambari tu, max 6
                <input className="input" type="password" value={form.pin}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setForm({ ...form, pin: val })
                  }}
                  placeholder="••••"
                  maxLength={6}
                  inputMode="numeric" 
                    style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '18px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — kwa laptop)</span>
                  </label>
                  <input className="input" type="password" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Angalau herufi 8" />
                </div>
              </>
            )}

            {modal === 'edit' && (
              <>
                <div className="form-group">
                  <label className="form-label">Jina Kamili</label>
                  <input className="input" type="text" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Namba ya Simu</label>
                  <input className="input" type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </>
            )}

            {modal === 'reset-pin' && (
              <div className="form-group">
                <div style={{ textAlign: 'center', padding: '16px', background: '#FFF8E1', borderRadius: '10px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#E65100', fontWeight: 600, marginBottom: '4px' }}>
                    Kubadilisha PIN ya {selected?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Weka PIN mpya ya nambari 4-6</div>
                </div>
                <label className="form-label">PIN Mpya *</label>
                <input className="input" type="password" value={form.newPin}
                  onChange={e => setForm({ ...form, newPin: e.target.value })}
                  placeholder="••••" maxLength={6} inputMode="numeric" autoFocus
                  style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px', fontWeight: 800 }} />
              </div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '4px' }}>
              Hifadhi
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════
// USER CARD COMPONENT
// ═══════════════════════════════
function UserCard({ user, onEdit, onPin, onToggle }) {
  const isOwner = user.role === 'OWNER'
  const gradientBg = isOwner
    ? 'linear-gradient(135deg, #4A0080, #7B2FBE)'
    : 'linear-gradient(135deg, #E91E8C, #C2185B)'

  return (
    <div className="card" style={{
      padding: '0',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}
    >
      {/* Card Top — Colored Banner */}
      <div style={{
        background: gradientBg,
        padding: '24px 24px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '40px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        {/* Status badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
            background: user.isActive ? 'rgba(46,125,50,0.9)' : 'rgba(198,40,40,0.9)',
            color: 'white', backdropFilter: 'blur(4px)',
          }}>
            {user.isActive ? '● Online' : '● Offline'}
          </span>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '3px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '22px', flexShrink: 0,
            backdropFilter: 'blur(4px)',
          }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '16px', marginBottom: '3px' }}>
              {user.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isOwner ? '👑 Owner' : '👤 Cashier'}
            </div>
          </div>
        </div>
      </div>

      {/* Card Bottom — Info & Actions */}
      <div style={{ padding: '20px 20px 16px', marginTop: '-16px', background: 'white', borderRadius: '16px 16px 0 0', position: 'relative' }}>

        {/* Phone */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 12px', background: '#F9FAFB',
          borderRadius: '8px', marginBottom: '16px',
          border: '1px solid var(--border-light)',
        }}>
          <Phone size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
            {user.phone}
          </span>
        </div>

        {/* Joined Date */}
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '14px', textAlign: 'center' }}>
          Ameongezwa: {new Date(user.createdAt).toLocaleDateString('sw-TZ')}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          <button onClick={() => onEdit(user)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '10px 6px', borderRadius: '10px', border: 'none',
            background: '#EFF6FF', color: '#1565C0',
            fontSize: '10px', fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
            onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}
          >
            <Edit size={16} />
            Badilisha
          </button>

          <button onClick={() => onPin(user)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '10px 6px', borderRadius: '10px', border: 'none',
            background: '#FFFBEB', color: '#D97706',
            fontSize: '10px', fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEF3C7'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFFBEB'}
          >
            <Key size={16} />
            PIN
          </button>

          <button onClick={() => onToggle(user)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '10px 6px', borderRadius: '10px', border: 'none',
            background: user.isActive ? '#FFF1F2' : '#F0FDF4',
            color: user.isActive ? '#C62828' : '#2E7D32',
            fontSize: '10px', fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Power size={16} />
            {user.isActive ? 'Zima' : 'Washa'}
          </button>
        </div>
      </div>
    </div>
  )
}