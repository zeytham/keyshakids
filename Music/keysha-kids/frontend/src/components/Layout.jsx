import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Settings as SettingsIcon } from 'lucide-react'
import {
  LayoutDashboard, Package, ShoppingCart, Users, CreditCard,
  BarChart3, LogOut, Menu, X, Tag, Bell, Settings, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Database } from 'lucide-react'
const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', ownerOnly: false },
  { path: '/inventory', icon: Package, label: 'Inventory', ownerOnly: false },
  { path: '/sales', icon: ShoppingCart, label: 'Mauzo / POS', ownerOnly: false },
  { path: '/customers', icon: Users, label: 'Wateja', ownerOnly: false },
  { path: '/debts', icon: CreditCard, label: 'Madeni', ownerOnly: false },
  { path: '/reports', icon: BarChart3, label: 'Ripoti', ownerOnly: true },
  { path: '/categories', icon: Tag, label: 'Categories', ownerOnly: true },
  { path: '/users', icon: Settings, label: 'Wafanyakazi', ownerOnly: true },
  { path: '/backup', icon: Database, label: 'Backup', ownerOnly: true },
  { path: '/settings', icon: SettingsIcon, label: 'Mipangilio' }
]

export default function Layout() {
  const { user, logout, isOwner } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false)
  }, [isDesktop])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      toast.success('Umetoka vizuri!')
      navigate('/login')
    } catch {
      toast.error('Hitilafu!')
    } finally {
      setLoggingOut(false)
    }
  }

  const filteredNav = navItems.filter(item => !item.ownerOnly || isOwner())
  const currentPage = navItems.find(n => location.pathname === n.path)?.label || 'Dashboard'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F0F2F5' }}>

      {/* Mobile Overlay */}
      {!isDesktop && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width: '260px',
        height: '100vh',
        background: 'linear-gradient(180deg, #2D0060 0%, #5B1A8A 40%, #9C1B6A 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 45,
        transform: isDesktop ? 'translateX(0)' : sidebarOpen ? 'translateX(0)' : 'translateX(-260px)',
        transition: 'transform 0.3s ease',
        boxShadow: !isDesktop && sidebarOpen ? '4px 0 30px rgba(0,0,0,0.3)' : 'none',
      }}>

        {/* Logo Area */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px', height: '48px',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.1)',
                flexShrink: 0,
              }}>
                <img src="/logo.jpeg" alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
                  Keysha Kids
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                  Collection
                </div>
              </div>
            </div>
            {/* Close button — mobile only */}
            {!isDesktop && (
              <button onClick={() => setSidebarOpen(false)} style={{
                color: 'rgba(255,255,255,0.6)',
                background: 'none', border: 'none',
                cursor: 'pointer', padding: '4px',
                display: 'flex',
              }}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #E91E8C, #FF6F00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '14px', flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                color: 'white', fontWeight: 600, fontSize: '13px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                {user?.role === 'OWNER' ? '👑 Owner' : '👤 Cashier'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          <div style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.35)',
            fontWeight: 700, letterSpacing: '1px',
            padding: '8px 8px 4px', textTransform: 'uppercase',
          }}>
            Menyu
          </div>
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <NavLink key={item.path} to={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px', marginBottom: '2px',
                  textDecoration: 'none', fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#7B2FBE' : 'rgba(255,255,255,0.75)',
                  background: isActive ? 'white' : 'transparent',
                  transition: 'all 0.2s',
                }}>
                <item.icon size={17} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <ChevronRight size={14} style={{ color: '#E91E8C' }} />}
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} disabled={loggingOut} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px', border: 'none',
            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.3)'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
          >
            <LogOut size={17} />
            {loggingOut ? 'Inatoka...' : 'Toka'}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        marginLeft: isDesktop ? '260px' : '0',
        transition: 'margin-left 0.3s ease',
      }}>

        {/* HEADER */}
        <header style={{
          background: 'white',
          padding: '0 24px',
          height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          borderBottom: '3px solid',
          borderImage: 'linear-gradient(135deg, #E91E8C, #7B2FBE) 1',
          flexShrink: 0, position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Hamburger — mobile/tablet only */}
            {!isDesktop && (
              <button onClick={() => setSidebarOpen(true)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px', borderRadius: '8px', color: '#E91E8C', display: 'flex',
              }}>
                <Menu size={22} />
              </button>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#1A1A2E' }}>
                {currentPage}
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                Keysha Kids Collection
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Date — desktop only */}
            {isDesktop && (
              <div style={{
                fontSize: '12px', color: '#6B7280',
                background: '#F9FAFB', padding: '6px 12px',
                borderRadius: '8px', border: '1px solid #E5E7EB',
              }}>
                {new Date().toLocaleDateString('sw-TZ', {
                  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                })}
              </div>
            )}

            {/* Bell */}
            <button style={{
              position: 'relative', background: '#FFF0F7',
              border: 'none', borderRadius: '10px', padding: '8px',
              cursor: 'pointer', color: '#E91E8C', display: 'flex',
            }}>
              <Bell size={18} />
              <span style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '8px', height: '8px',
                background: '#E91E8C', borderRadius: '50%',
                border: '1.5px solid white',
              }} />
            </button>

            {/* User Avatar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px 6px 6px', borderRadius: '10px',
              background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer',
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #E91E8C, #7B2FBE)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '12px',
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {/* Name — desktop only */}
              {isDesktop && (
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  {user?.name?.split(' ')[0]}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: isDesktop ? '24px' : '12px',
        }}>
          <div className="fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}