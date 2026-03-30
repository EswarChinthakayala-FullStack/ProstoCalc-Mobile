import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'

const RequireAuth = ({ allowedRoles = [] }) => {
  const location = useLocation()
  const { user } = useAuth()

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role if specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Unauthorized access attempt
     toast.error("Unauthorized Access", {
        description: "You do not have permission to view this page.",
    })
    
    // Redirect to their appropriate dashboard or home
    if (user.role === 'dentist') {
        return <Navigate to="/dashboard/clinician" replace />
    } else if (user.role === 'patient') {
        return <Navigate to="/dashboard/patient" replace />
    } else {
        return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}

export default RequireAuth
