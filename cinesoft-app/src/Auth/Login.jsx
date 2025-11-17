import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../Auth/login.css'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Endpoint asumido: http://localhost:3000/usuarios/login
      const res = await fetch('http://localhost:3000/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      // Manejo robusto: si la respuesta no es JSON, leer como texto y mostrar mensaje útil
      const contentType = res.headers.get('content-type') || ''
      let data
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        throw new Error(`Respuesta inválida del servidor (${res.status}): ${text.substring(0, 200)}`)
      }

      if (!res.ok) throw new Error(data.message || `Error al iniciar sesión (status ${res.status})`)

      console.log('[Login] Respuesta del backend:', data)

      // verificar que se recibió el token
      if (!data.token) {
        throw new Error('El servidor no devolvió un token válido')
      }

      // guardar token y estado global
      login(data.token, data.user)
      console.log('[Login] Token guardado exitosamente')
      setLoading(false)
      
      // Verificar si hay una reserva pendiente después del login
      const pendingReservation = sessionStorage.getItem('pendingReservation')
      if (pendingReservation) {
        try {
          const reservationData = JSON.parse(pendingReservation)
          console.log('[Login] Reserva pendiente encontrada, redirigiendo:', reservationData)
          
          // Limpiar la reserva pendiente del storage
          sessionStorage.removeItem('pendingReservation')
          
          // Redirigir de vuelta a la URL donde estaba el usuario
          navigate(reservationData.returnUrl || '/cartelera', { replace: true })
        } catch (error) {
          console.error('[Login] Error al procesar reserva pendiente:', error)
          navigate('/cartelera')
        }
      } else {
        // Redirección normal si no hay reserva pendiente
        navigate('/cartelera')
      }
    } catch (err) {
      setLoading(false)
      setError(err.message)
    }
  }

  useEffect(() => {
    // small delay so CSS animation plays on mount
    const t = setTimeout(() => setMounted(true), 20)
    
    // Verificar si el usuario fue redirigido aquí por intentar hacer una reserva sin estar logueado
    const pendingReservation = sessionStorage.getItem('pendingReservation')
    if (pendingReservation) {
      setError('Debes iniciar sesión para continuar con tu reserva.')
    }
    
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className={`card auth-card border-2 border-danger shadow-lg p-4 rounded-4 ${mounted ? 'mounted' : ''}`} style={{ maxWidth: 540 }}>
        <div className="card-body bg-dark text-white rounded-3 p-4">
          <div className="text-center mb-3">
            <div className="brand-title text-danger fw-bold" style={{ fontSize: '2rem' }}>CINESOFT</div>
            <h3 className="mt-2">Iniciar Sesión</h3>
            <p className="text-muted small">Accede con tu cuenta para comprar entradas y administrar reservas</p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3 form-floating">
              <input
                type="email"
                id="inputEmail"
                className="form-control form-control-lg bg-black text-white auth-input"
                placeholder="Usuario"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
              <label htmlFor="inputEmail">Usuario</label>
            </div>

            <div className="mb-3 form-floating position-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="inputPassword"
                className="form-control form-control-lg bg-black text-white auth-input"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <label htmlFor="inputPassword">Contraseña</label>
              <button type="button" className="password-toggle btn btn-sm btn-outline-secondary" onClick={() => setShowPassword(s => !s)} aria-label="Mostrar contraseña">
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            <div className="d-grid">
              <button type="submit" className="btn btn-danger btn-lg w-100 rounded-3 btn-animate" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Ingresando...</> : 'Ingresar'}
              </button>
            </div>
          </form>

          <p className="text-center mt-3 mb-0 text-white">¿No tienes cuenta? <Link to="/register" className="text-danger">Regístrate</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Login
