import { useCallback } from 'react'

// Hook minimal para autenticación: guarda token y user en localStorage
export const useAuth = () => {
  const login = useCallback((token, user) => {
    if (token) localStorage.setItem('token', token)
    if (user) localStorage.setItem('user', JSON.stringify(user))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // reload o redirigir según sea necesario
    window.location.href = '/'
  }, [])

  const getToken = useCallback(() => localStorage.getItem('token'), [])
  const getUser = useCallback(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  }, [])

  return { login, logout, getToken, getUser }
}

export default useAuth
