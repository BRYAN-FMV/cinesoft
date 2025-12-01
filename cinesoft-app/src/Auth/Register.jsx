import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
// reuse login styles for consistent look
import '../Auth/login.css'
import { useAuth } from '../hooks/useAuth'

const Register = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    // Validaciones básicas en el frontend
    if (!name.trim()) {
      setError('El nombre es requerido')
      setLoading(false)
      return
    }
    
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un email válido')
      setLoading(false)
      return
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }
    
    try {
      const res = await fetch('https://cine-web-api-tobi.vercel.app/usuarios/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const contentType = res.headers.get('content-type') || ''
      let data
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        throw new Error(`Respuesta inválida del servidor (${res.status}): ${text.substring(0, 200)}`)
      }

      if (!res.ok) {
        // Manejo específico para error 409 (Conflict)
        if (res.status === 409) {
          throw new Error(data.message || 'Este email ya está registrado. Intenta con otro email o inicia sesión.')
        }
        throw new Error(data.message || `Error al registrarse (status ${res.status})`)
      }

      if (data.token) {
        login(data.token, data.user)
      }

      setLoading(false)
      navigate('/')
    } catch (err) {
      setLoading(false)
      setError(err.message)
    }
  }

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className={`card auth-card border-2 border-danger shadow-lg p-4 rounded-4 ${mounted ? 'mounted' : ''}`} style={{ maxWidth: 640 }}>
        <div className="card-body bg-dark text-white rounded-3 p-4">
          <div className="text-center mb-3">
            <div className="brand-title text-danger fw-bold" style={{ fontSize: '2rem' }}>CINESOFT</div>
            <h3 className="mt-2">Crear Cuenta</h3>
            <p className="auth-header-sub">Crea tu cuenta para administrar tus reservas y comprar entradas</p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                id="inputName"
                className="form-control form-control-lg bg-black text-white auth-input"
                placeholder="Nombre completo"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <input
                id="inputEmail"
                type="email"
                className="form-control form-control-lg bg-black text-white auth-input"
                placeholder="Correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3 position-relative">
              <input
                id="inputPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-control form-control-lg bg-black text-white auth-input"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="password-toggle btn btn-sm btn-outline-secondary" onClick={() => setShowPassword(s => !s)} aria-label="Mostrar contraseña">
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            <div className="mb-3">
              <input
                id="inputConfirm"
                type={showPassword ? 'text' : 'password'}
                className="form-control form-control-lg bg-black text-white auth-input"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* client-side password match check */}
            {password && confirmPassword && password !== confirmPassword && (
              <div className="alert alert-danger">Las contraseñas no coinciden</div>
            )}

            <div className="d-grid mt-3">
              <button type="submit" className="btn btn-danger btn-lg w-100 rounded-3 btn-animate" disabled={loading || (password && confirmPassword && password !== confirmPassword)}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Registrando...</> : 'Registrarse'}
              </button>
            </div>
          </form>

          <p className="text-center mt-3 mb-0 text-white auth-footnote">¿Ya tienes cuenta? <Link to="/login" className="text-danger">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Register
