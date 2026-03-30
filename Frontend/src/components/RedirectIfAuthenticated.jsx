import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RedirectIfAuthenticated = () => {
  const { isAuthenticated, user } = useAuth()
  
  if (isAuthenticated && user) {
     if (user.role === 'dentist') return <Navigate to="/dashboard/clinician" replace />
     if (user.role === 'patient') return <Navigate to="/dashboard/patient" replace />
     return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default RedirectIfAuthenticated
