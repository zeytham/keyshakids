import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Settings from './pages/Settings'
// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import Customers from './pages/Customers'
import Debts from './pages/Debts'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Categories from './pages/Categories'
import NotFound from './pages/NotFound'
import Backup from './pages/Backup'

// Layout
import Layout from './components/Layout'

// Protected Route
const ProtectedRoute = ({ children, ownerOnly = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #E91E8C, #7B2FBE)' }}>
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent 
            rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Inapakia...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (ownerOnly && user.role !== 'OWNER') return <Navigate to="/dashboard" replace />

  return children
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="sales" element={<Sales />} />
        <Route path="customers" element={<Customers />} />
        <Route path="debts" element={<Debts />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="reports" element={
          <ProtectedRoute ownerOnly>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute ownerOnly>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="categories" element={
          <ProtectedRoute ownerOnly>
            <Categories />
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App