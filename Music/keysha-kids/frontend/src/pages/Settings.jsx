import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  User, Lock, Key, Building2, Database, Server,
  Save, Eye, EyeOff, Shield, Phone,
  MapPin, Package, Users,
  ShoppingCart, CreditCard
} from 'lucide-react'
import { validateName, validatePhone, validatePassword, validatePin } from '../utils/validation'

export default function Settings() {
  const { user, isOwner } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  // Forms
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [pinForm, setPinForm] = useState({ oldPin: '', newPin: '', confirmPin: '' })
  const [businessForm, setBusinessForm] = useState({
    businessName: '', businessPhone1: '', businessPhone2: '',
    businessInstagram: '', businessAddress: '',
  })

  // Show/hide passwords
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showOldPin, setShowOldPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)

  // Password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '' }
    let score = 0
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[a-z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Dhaifu sana', color: '#C62828' },
      { score: 2, label: 'Dhaifu', color: '#FF6F00' },
      { score: 3, label: 'Wastani', color: '#F9A825' },
      { score: 4, label: 'Nzuri', color: '#2E7D32' },
      { score: 5, label: 'Nzuri Sana!', color: '#1B5E20' },
    ]
    return levels[score]
  }
  const passStrength = getPasswordStrength(passwordForm.newPassword)

  // Queries
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data.data,
    onSuccess: (data) => {
      setBusinessForm({
        businessName: data.businessName || '',
        businessPhone1: data.businessPhone1 || '',
        businessPhone2: data.businessPhone2 || '',
        businessInstagram: data.businessInstagram || '',
        businessAddress: data.businessAddress || '',
      })
    },
  })

  useEffect(() => {
    if (settingsData) {
      setBusinessForm({
        businessName: settingsData.businessName || '',
        businessPhone1: settingsData.businessPhone1 || '',
        businessPhone2: settingsData.businessPhone2 || '',
        businessInstagram: settingsData.businessInstagram || '',
        businessAddress: settingsData.businessAddress || '',
      })
    }
  }, [settingsData])

  const { data: systemInfo, isLoading: sysLoading } = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => (await api.get('/settings/system-info')).data.data,
    enabled: activeTab === 'system' && isOwner(),
  })

  const { data: backupData } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => (await api.get('/backups')).data.data,
    enabled: activeTab === 'backup' && isOwner(),
  })

  // Mutations
  const updateProfile = useMutation({
    mutationFn: (data) => api.put('/users/' + user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('Profile imebadilishwa!') },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const changePassword = useMutation({
    mutationFn: (data) => api.post('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password imebadilishwa!')
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const changePin = useMutation({
    mutationFn: (data) => api.post('/auth/change-pin', data),
    onSuccess: () => {
      toast.success('PIN imebadilishwa!')
      setPinForm({ oldPin: '', newPin: '', confirmPin: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const saveSettings = useMutation({
    mutationFn: (data) => api.put('/settings', data),
    onSuccess: () => { queryClient.invalidateQueries(['settings']); toast.success('Settings zimehifadhiwa!') },
    onError: (err) => toast.error(err.response?.data?.message || 'Hitilafu!'),
  })

  const doBackup = useMutation({
    mutationFn: () => api.post('/backups'),
    onSuccess: () => { queryClient.invalidateQueries(['backups']); toast.success('Backup imefanywa!') },
    onError: () => toast.error('Backup imeshindwa!'),
  })

  // Handlers
  const handleProfileSubmit = (e) => {
    e.preventDefault()
    const nameError = validateName(profileForm.name)
    if (nameError) return toast.error(nameError)
    const phoneError = validatePhone(profileForm.phone)
    if (phoneError) return toast.error(phoneError)
    updateProfile.mutate({ name: profileForm.name.trim(), phone: profileForm.phone.trim() })
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (!passwordForm.oldPassword) return toast.error('Weka password ya zamani!')
    const newPassError = validatePassword(passwordForm.newPassword)
    if (newPassError) return toast.error(newPassError)
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Password mpya hazilingani!')
    if (!window.confirm('Una uhakika unataka kubadilisha password?')) return
    changePassword.mutate({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
  }

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (!pinForm.oldPin) return toast.error('Weka PIN ya zamani!')
    const newPinError = validatePin(pinForm.newPin)
    if (newPinError) return toast.error(newPinError)
    if (pinForm.newPin !== pinForm.confirmPin) return toast.error('PIN mpya hazilingani!')
    if (!window.confirm('Una uhakika unataka kubadilisha PIN?')) return
    changePin.mutate({ oldPin: pinForm.oldPin, newPin: pinForm.newPin })
  }

  const handleBusinessSubmit = (e) => {
    e.preventDefault()
    if (!businessForm.businessName.trim()) return toast.error('Weka jina la duka!')
    saveSettings.mutate(businessForm)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Usalama', icon: Shield },
    ...(isOwner() ? [
      { id: 'business', label: 'Biashara', icon: Building2 },
      { id: 'backup', label: 'Backup', icon: Database },
      { id: 'system', label: 'Mfumo', icon: Server },
    ] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Mipangilio</div>
          <div className="page-sub">Simamia akaunti na mipangilio ya mfumo</div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          background: 'var(--gradient)', padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '22px', flexShrink: 0,
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '16px' }}>{user?.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>{user?.phone}</div>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
            background: 'rgba(255,255,255,0.2)', color: 'white',
          }}>
            {user?.role === 'OWNER' ? '👑 Owner' : '👤 Cashier'}
          </span>
        </div>
      </div>

      {/* Tabs + Content */}
      <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: isMobile ? 'column' : undefined, gridTemplateColumns: isMobile ? undefined : '200px 1fr', gap: '16px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '4px', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '4px' : 0 }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: isMobile ? '8px 14px' : '10px 14px',
                  borderRadius: '10px', border: '1px solid',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                  borderColor: isActive ? 'var(--pink)' : 'var(--border-light)',
                  background: isActive ? 'var(--pink-light)' : 'white',
                  color: isActive ? 'var(--pink)' : 'var(--text-secondary)',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--pink)'; e.currentTarget.style.color = 'var(--pink)' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div>

          {/* ═══ PROFILE TAB ═══ */}
          {activeTab === 'profile' && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} style={{ color: 'var(--pink)' }} /> Taarifa za Profile
              </div>
              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Jina Kamili *</label>
                  <input className="input" type="text" value={profileForm.name}
                    onChange={e => {
                      const val = e.target.value.replace(/[^a-zA-Z\s\u00C0-\u024F'-]/g, '')
                      setProfileForm({ ...profileForm, name: val })
                    }}
                    placeholder="Jina lako kamili" maxLength={50} />
                </div>
                <div className="form-group">
                  <label className="form-label">Namba ya Simu *</label>
                  <input className="input" type="tel" value={profileForm.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setProfileForm({ ...profileForm, phone: val })
                    }}
                    placeholder="0700000000" maxLength={10} inputMode="numeric" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <div className="input" style={{ background: '#F9FAFB', color: 'var(--text-muted)', cursor: 'not-allowed' }}>
                    {user?.role === 'OWNER' ? '👑 Owner' : '👤 Cashier'}
                  </div>
                </div>
                <button type="submit" disabled={updateProfile.isPending} className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '9px 20px' }}>
                  {updateProfile.isPending ? <><div className="spinner" /> Inabadilisha...</> : <><Save size={14} /> Hifadhi Profile</>}
                </button>
              </form>
            </div>
          )}

          {/* ═══ SECURITY TAB ═══ */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Change Password */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} style={{ color: 'var(--pink)' }} /> Badilisha Password
                </div>
                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Password ya Zamani *</label>
                    <div style={{ position: 'relative' }}>
                      <input className="input" type={showOldPass ? 'text' : 'password'}
                        value={passwordForm.oldPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                        placeholder="••••••••" style={{ paddingRight: '40px' }} />
                      <button type="button" onClick={() => setShowOldPass(!showOldPass)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {showOldPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password Mpya *</label>
                    <div style={{ position: 'relative' }}>
                      <input className="input" type={showNewPass ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="••••••••" style={{ paddingRight: '40px' }} />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {/* Password Strength */}
                    {passwordForm.newPassword && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                          {[1,2,3,4,5].map(i => (
                            <div key={i} style={{
                              flex: 1, height: '4px', borderRadius: '2px',
                              background: i <= passStrength.score ? passStrength.color : '#E5E7EB',
                              transition: 'background 0.2s',
                            }} />
                          ))}
                        </div>
                        {passStrength.label && (
                          <div style={{ fontSize: '11px', fontWeight: 600, color: passStrength.color }}>
                            {passStrength.label}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Thibitisha Password Mpya *</label>
                    <input className="input" type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••" />
                    {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <div style={{ fontSize: '11px', color: '#C62828', marginTop: '4px' }}>
                        ❌ Password hazilingani!
                      </div>
                    )}
                    {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '4px' }}>
                        ✅ Password zinalingana!
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={changePassword.isPending} className="btn btn-primary"
                    style={{ alignSelf: 'flex-start', padding: '9px 20px' }}>
                    {changePassword.isPending ? <><div className="spinner" /> Inabadilisha...</> : <><Lock size={14} /> Badilisha Password</>}
                  </button>
                </form>
              </div>

              {/* Change PIN */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={16} style={{ color: 'var(--purple)' }} /> Badilisha PIN
                </div>
                <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">PIN ya Zamani *</label>
                    <div style={{ position: 'relative' }}>
                      <input className="input" type={showOldPin ? 'text' : 'password'}
                        value={pinForm.oldPin}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                          setPinForm({ ...pinForm, oldPin: val })
                        }}
                        placeholder="••••" maxLength={6} inputMode="numeric"
                        style={{ paddingRight: '40px', letterSpacing: '6px', textAlign: 'center', fontSize: '18px' }} />
                      <button type="button" onClick={() => setShowOldPin(!showOldPin)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {showOldPin ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN Mpya *</label>
                    <div style={{ position: 'relative' }}>
                      <input className="input" type={showNewPin ? 'text' : 'password'}
                        value={pinForm.newPin}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                          setPinForm({ ...pinForm, newPin: val })
                        }}
                        placeholder="••••" maxLength={6} inputMode="numeric"
                        style={{ paddingRight: '40px', letterSpacing: '6px', textAlign: 'center', fontSize: '18px' }} />
                      <button type="button" onClick={() => setShowNewPin(!showNewPin)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {showNewPin ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Thibitisha PIN Mpya *</label>
                    <input className="input" type="password"
                      value={pinForm.confirmPin}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setPinForm({ ...pinForm, confirmPin: val })
                      }}
                      placeholder="••••" maxLength={6} inputMode="numeric"
                      style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '18px' }} />
                    {pinForm.confirmPin && pinForm.newPin !== pinForm.confirmPin && (
                      <div style={{ fontSize: '11px', color: '#C62828', marginTop: '4px' }}>❌ PIN hazilingani!</div>
                    )}
                    {pinForm.confirmPin && pinForm.newPin === pinForm.confirmPin && pinForm.confirmPin.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '4px' }}>✅ PIN zinalingana!</div>
                    )}
                  </div>
                  <button type="submit" disabled={changePin.isPending} className="btn btn-primary"
                    style={{ alignSelf: 'flex-start', padding: '9px 20px', background: 'linear-gradient(135deg, #7B2FBE, #4A0080)' }}>
                    {changePin.isPending ? <><div className="spinner" /> Inabadilisha...</> : <><Key size={14} /> Badilisha PIN</>}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ═══ BUSINESS TAB ═══ */}
          {activeTab === 'business' && isOwner() && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} style={{ color: 'var(--pink)' }} /> Taarifa za Biashara
              </div>
              {settingsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />)}
                </div>
              ) : (
                <form onSubmit={handleBusinessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Jina la Duka *</label>
                    <input className="input" type="text" value={businessForm.businessName}
                      onChange={e => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                      placeholder="Keysha Kids Collection" maxLength={100} />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">
                        <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Simu ya 1 *
                      </label>
                      <input className="input" type="tel" value={businessForm.businessPhone1}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setBusinessForm({ ...businessForm, businessPhone1: val })
                        }}
                        placeholder="0622146487" maxLength={10} inputMode="numeric" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Simu ya 2
                      </label>
                      <input className="input" type="tel" value={businessForm.businessPhone2}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setBusinessForm({ ...businessForm, businessPhone2: val })
                        }}
                        placeholder="0626030263" maxLength={10} inputMode="numeric" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Instagram
                    </label>
                    <input className="input" type="text" value={businessForm.businessInstagram}
                      onChange={e => setBusinessForm({ ...businessForm, businessInstagram: e.target.value })}
                      placeholder="@keysha_kids_collection" maxLength={50} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Anwani
                    </label>
                    <input className="input" type="text" value={businessForm.businessAddress}
                      onChange={e => setBusinessForm({ ...businessForm, businessAddress: e.target.value })}
                      placeholder="Mwanakwerekwe, Zanzibar" maxLength={100} />
                  </div>

                  {/* Preview */}
                  <div style={{ padding: '14px', borderRadius: '10px', background: '#F9FAFB', border: '1px dashed var(--border)', fontFamily: 'monospace', fontSize: '11px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px' }}>{businessForm.businessName || 'Jina la Duka'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>RECEIPT YA MAUZO</div>
                    </div>
                    <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '6px 0', margin: '6px 0', textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <div>📞 {businessForm.businessPhone1 || '0700000000'} | {businessForm.businessPhone2 || '0700000000'}</div>
                      <div>{businessForm.businessInstagram || '@instagram'}</div>
                      <div>📍 {businessForm.businessAddress || 'Anwani'}</div>
                    </div>
                  </div>

                  <button type="submit" disabled={saveSettings.isPending} className="btn btn-primary"
                    style={{ alignSelf: 'flex-start', padding: '9px 20px' }}>
                    {saveSettings.isPending ? <><div className="spinner" /> Inahifadhi...</> : <><Save size={14} /> Hifadhi Settings</>}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ═══ BACKUP TAB ═══ */}
          {activeTab === 'backup' && isOwner() && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Quick Backup */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} style={{ color: 'var(--pink)' }} /> Backup ya Data
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', borderRadius: '10px', background: '#E8F5E9', border: '1px solid #C8E6C9' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#2E7D32', marginBottom: '4px' }}>✅ Data yako iko salama!</div>
                    <div style={{ fontSize: '11px', color: '#2E7D32' }}>Backup inafanywa automatically kila usiku saa 2:00 AM</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', background: '#F9FAFB', border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Backup ya Mwisho</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {backupData?.length > 0
                          ? new Date(backupData[0].createdAt).toLocaleString('sw-TZ')
                          : 'Hakuna backup bado'
                        }
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#2E7D32', background: '#E8F5E9', padding: '3px 10px', borderRadius: '10px' }}>
                      {backupData?.length || 0} backups
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => doBackup.mutate()} disabled={doBackup.isPending}
                      className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>
                      {doBackup.isPending ? <><div className="spinner" /> Inafanya...</> : <><Database size={14} /> Fanya Backup Sasa</>}
                    </button>
                    <button onClick={() => window.location.href = '/backup'}
                      className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>
                      Ona Backups Zote →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ SYSTEM TAB ═══ */}
          {activeTab === 'system' && isOwner() && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sysLoading ? (
                <div className="card" style={{ padding: '20px' }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px', marginBottom: '10px' }} />)}
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                    {[
                      { label: 'Bidhaa', value: systemInfo?.stats?.totalProducts || 0, icon: Package, color: 'var(--pink)', bg: 'var(--pink-light)' },
                      { label: 'Wateja', value: systemInfo?.stats?.totalCustomers || 0, icon: Users, color: 'var(--purple)', bg: 'var(--purple-light)' },
                      { label: 'Mauzo', value: systemInfo?.stats?.totalSales || 0, icon: ShoppingCart, color: '#2E7D32', bg: '#E8F5E9' },
                      { label: 'Madeni', value: systemInfo?.stats?.pendingDebts || 0, icon: CreditCard, color: '#C62828', bg: '#FFEBEE' },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                      <div key={label} className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={13} style={{ color }} />
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.25, borderRadius: '0 0 12px 12px' }} />
                      </div>
                    ))}
                  </div>

                  {/* Server Info */}
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Server size={16} style={{ color: 'var(--pink)' }} /> Taarifa za Mfumo
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: 'Version', value: systemInfo?.version || '1.0.0' },
                        { label: 'Environment', value: systemInfo?.environment || 'production' },
                        { label: 'Server Status', value: systemInfo?.server?.status || 'Online ✅' },
                        { label: 'Platform', value: systemInfo?.server?.platform || 'Railway' },
                        { label: 'Database', value: systemInfo?.server?.database || 'PostgreSQL' },
                        { label: 'Frontend', value: systemInfo?.server?.frontend || 'Vercel' },
                        { label: 'Backend', value: systemInfo?.builtWith?.backend || 'Node.js + Express' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: '#F9FAFB', border: '1px solid var(--border-light)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Built With */}
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--pink-light), var(--purple-light))', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      🚀 Keysha Kids Collection Management System
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Version 1.0.0 • Built with ❤️ • {new Date().getFullYear()}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}