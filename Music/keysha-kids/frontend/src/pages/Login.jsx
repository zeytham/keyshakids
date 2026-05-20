import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Phone, Lock, ArrowRight } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginType, setLoginType] = useState('password')
  const [form, setForm] = useState({ phone: '', password: '', pin: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.phone) return toast.error('Weka namba ya simu!')
    if (loginType === 'password' && !form.password) return toast.error('Weka password!')
    if (loginType === 'pin' && !form.pin) return toast.error('Weka PIN!')

    setLoading(true)
    try {
      await login(
        form.phone,
        loginType === 'password' ? form.password : null,
        loginType === 'pin' ? form.pin : null
      )
      toast.success('Umeingia vizuri!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Namba au nywila si sahihi!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #2D0060 0%, #5B1A8A 35%, #9C1B6A 70%, #E91E8C 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background Decorations */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-150px', left: '-100px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.03)',
      }} />
      <div style={{
        position: 'absolute', top: '30%', left: '5%',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'rgba(255,111,0,0.1)',
      }} />

      {/* LEFT SIDE — Branding (Desktop only) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        color: 'white',
      }}
        className="hide-mobile"
      >
        <div style={{
          width: '140px', height: '140px',
          borderRadius: '50%',
          border: '4px solid rgba(255,255,255,0.3)',
          overflow: 'hidden',
          marginBottom: '32px',
          background: 'rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <img
            src="/logo.jpeg"
            alt="Keysha Kids"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <h1 style={{
          fontSize: '42px', fontWeight: 800,
          marginBottom: '12px', textAlign: 'center',
          textShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}>
          Keysha Kids
        </h1>
        <p style={{
          fontSize: '18px', opacity: 0.8,
          marginBottom: '48px', textAlign: 'center',
        }}>
          Collection Management System
        </p>

        {/* Features */}
        {[
          '📦 Simamia Stock kwa Urahisi',
          '💰 Fuatilia Mauzo Yote',
          '📊 Ripoti za Kina',
          '💳 Simamia Madeni ya Wateja',
          '👥 Dhibiti Wafanyakazi',
        ].map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '12px',
            background: 'rgba(255,255,255,0.1)',
            padding: '12px 20px',
            borderRadius: '12px',
            width: '100%', maxWidth: '340px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* RIGHT SIDE — Login Form */}
      <div style={{
        width: '100%', maxWidth: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{
          width: '100%', maxWidth: '400px',
          background: 'white',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        }}>

          {/* Card Header */}
          <div style={{
            background: 'linear-gradient(135deg, #E91E8C, #7B2FBE)',
            padding: '32px 32px 28px',
            textAlign: 'center',
            position: 'relative',
          }}>
            {/* Mobile Logo */}
            <div style={{
              width: '72px', height: '72px',
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.4)',
              overflow: 'hidden',
              margin: '0 auto 16px',
              background: 'rgba(255,255,255,0.15)',
            }}
              className="hide-desktop"
            >
              <img src="/logo.jpeg" alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h2 style={{
              color: 'white', fontSize: '22px',
              fontWeight: 700, marginBottom: '6px',
            }}>
              Karibu Tena! 👋
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
              Ingia kwenye akaunti yako ya Keysha Kids
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: '32px' }}>

            {/* Toggle */}
            <div style={{
              display: 'flex',
              background: '#F3F4F6',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '24px',
            }}>
              {[
                { id: 'password', label: '🔑 Password' },
                { id: 'pin', label: '🔢 PIN' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setLoginType(t.id)}
                  style={{
                    flex: 1, padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: loginType === t.id
                      ? 'linear-gradient(135deg, #E91E8C, #7B2FBE)'
                      : 'transparent',
                    color: loginType === t.id ? 'white' : '#6B7280',
                    boxShadow: loginType === t.id
                      ? '0 4px 12px rgba(233,30,140,0.3)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>

              {/* Phone */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block', fontSize: '13px',
                  fontWeight: 600, color: '#374151', marginBottom: '8px',
                }}>
                  Namba ya Simu
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{
                    position: 'absolute', left: '14px',
                    top: '50%', transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                  }} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="0700 000 000"
                    className="input"
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>

              {/* Password / PIN */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block', fontSize: '13px',
                  fontWeight: 600, color: '#374151', marginBottom: '8px',
                }}>
                  {loginType === 'password' ? 'Password' : 'PIN (nambari 4-6)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute', left: '14px',
                    top: '50%', transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                  }} />
                  <input
                    type={loginType === 'pin' ? 'password' : showPassword ? 'text' : 'password'}
                    value={loginType === 'password' ? form.password : form.pin}
                    onChange={e => setForm({
                      ...form,
                      [loginType === 'password' ? 'password' : 'pin']: e.target.value
                    })}
                    placeholder={loginType === 'password' ? '••••••••' : '••••'}
                    maxLength={loginType === 'pin' ? 6 : undefined}
                    inputMode={loginType === 'pin' ? 'numeric' : undefined}
                    className="input"
                    style={{
                      paddingLeft: '42px',
                      paddingRight: loginType === 'password' ? '42px' : '16px',
                      letterSpacing: '3px',
                    }}
                  />
                  {loginType === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '14px',
                        top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: '#9CA3AF',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px', height: '16px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Inaingia...
                  </>
                ) : (
                  <>
                    Ingia
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p style={{
              textAlign: 'center', fontSize: '11px',
              color: '#9CA3AF', marginTop: '24px',
            }}>
              Keysha Kids Collection © {new Date().getFullYear()} — Haki zote zimehifadhiwa
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}