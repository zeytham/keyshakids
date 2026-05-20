import { useNavigate } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #7B2FBE 0%, #4A0080 40%, #C2185B 100%)' }}>
      <div className="text-center text-white">
        <AlertCircle size={80} className="mx-auto mb-6 opacity-80" />
        <h1 className="text-8xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Ukurasa Haupatikani!</h2>
        <p className="text-pink-200 mb-8">
          Ukurasa unaotafuta haupo kwenye mfumo huu.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold mx-auto
            bg-white hover:bg-pink-50 transition-all duration-200"
          style={{ color: '#7B2FBE' }}
        >
          <Home size={18} />
          Rudi Nyumbani
        </button>
      </div>
    </div>
  )
}