import { useCallback, useState, useEffect } from 'react'

// Hook para autenticación con estado reactivo
export const useAuth = () => {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken) {
      setToken(savedToken)
    }
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('user')
      }
    }
    
    setLoading(false)
  }, [])

  const login = useCallback((newToken, newUser) => {
    console.log('[useAuth] Login called with:', { token: !!newToken, user: !!newUser })
    
    if (newToken) {
      localStorage.setItem('token', newToken)
      setToken(newToken)
    }
    
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)
    }
  }, [])

  const logout = useCallback(() => {
    console.log('[useAuth] Logout called')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    // reload o redirigir según sea necesario
    window.location.href = '/'
  }, [])

  const getToken = useCallback(() => {
    return token || localStorage.getItem('token')
  }, [token])
  
  const getUser = useCallback(() => {
    if (user) return user
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  }, [user])

  // Verificar si el usuario está autenticado
  const isAuthenticated = useCallback(() => {
    return !!(token || localStorage.getItem('token'))
  }, [token])

  return { 
    login, 
    logout, 
    getToken, 
    getUser, 
    isAuthenticated,
    token, 
    user, 
    loading 
  }
}
