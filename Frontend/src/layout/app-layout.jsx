import React from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import Header from '../components/Header'
import HelperBot from '../components/HelperBot'

import { useAuth } from '../context/AuthContext'

const AppLayout = () => {
  const { user, isAuthenticated } = useAuth()

  React.useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]')
    
    if (isAuthenticated && user?.role === 'dentist') {
      document.title = 'ProstoCalc - Dentist'
      if (favicon) favicon.href = '/logo-teal.svg'
    } else if (isAuthenticated && user?.role === 'patient') {
      document.title = 'ProstoCalc - Patient'
      if (favicon) favicon.href = '/logo.svg'
    } else {
      document.title = 'ProstoCalc'
      if (favicon) favicon.href = '/logo.svg'
    }
  }, [user, isAuthenticated])

  return (
    <div className={`bg-white transition-colors duration-300 overflow-x-hidden ${
      user?.role === 'dentist' ? 'dark:bg-black' : 'dark:bg-slate-950'
    } text-slate-900 dark:text-slate-100`}>
      <Header />
      <main className='min-h-screen pt-16'>
        <Toaster position="top-right" />
        <Outlet/>
      </main>
      <HelperBot />
    </div>
  )
}

export default AppLayout
