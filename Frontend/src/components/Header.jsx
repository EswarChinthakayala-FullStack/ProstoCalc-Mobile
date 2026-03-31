import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, Stethoscope, ArrowRight, Moon, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from './ui/sheet'

import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { LogOut, User, LayoutDashboard } from 'lucide-react'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Docs', path: '/docs' },
]

const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const dashboardPath = user?.role === 'dentist' ? '/dashboard/clinician' : '/dashboard/patient'

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg shadow-slate-900/5 dark:shadow-black/20 border-b border-slate-100 dark:border-slate-800'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-white rounded-md shadow-lg shadow-slate-200/50 flex items-center justify-center border border-slate-100 group-hover:shadow-blue-500/10 transition-shadow overflow-hidden">
            <img src={user?.role === 'dentist' ? "/logo-teal.svg" : "/logo.svg"} alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Prosto<span className={user?.role === 'dentist' ? "text-teal-600" : "text-blue-600"}>Calc</span>
            </span>
            <span className="text-[8px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase hidden sm:block leading-none">Clinical Platform</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${location.pathname === item.path
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-cyan-400 transition-all"
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to={dashboardPath}>
                <Button variant="ghost" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-bold px-4 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Link to={user?.role === 'dentist' ? '/dentist/profile' : '/patient/profile'} className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-100 transition-colors group">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] text-white font-bold transition-transform group-hover:scale-105 ${user?.role === 'dentist' ? 'bg-teal-600' : 'bg-blue-600'}`}>
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate group-hover:text-slate-900">
                    {user?.full_name?.split(' ')[0]}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-bold px-4">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-md px-6 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all text-sm"
                >
                  Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5 text-slate-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0 flex flex-col">
            <SheetHeader className="p-6 pb-4 border-b border-slate-100">
              <SheetTitle className="flex items-center gap-2.5 text-left">
                <div className="w-9 h-9 bg-white rounded-md flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden">
                  <img src={user?.role === 'dentist' ? "/logo-teal.svg" : "/logo.svg"} alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <span className="text-lg font-black text-slate-900">
                    Prosto<span className={user?.role === 'dentist' ? "text-teal-600" : "text-blue-600"}>Calc</span>
                  </span>
                </div>
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-400 font-medium text-left">
                Chairside Prosthodontic Calculator
              </SheetDescription>
            </SheetHeader>

            <nav className="flex flex-col p-4 gap-1">
              {navItems.map((item) => (
                <SheetClose asChild key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-md text-base font-semibold transition-all ${location.pathname === item.path
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}

              {isAuthenticated ? (
                <>
                  <SheetClose asChild>
                    <Link
                      to={dashboardPath}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <LayoutDashboard className="w-5 h-5 text-blue-600" />
                      Dashboard
                    </Link>
                  </SheetClose>
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-md text-base font-semibold text-red-600 hover:bg-red-50 transition-all text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <SheetClose asChild>
                  <Link
                    to="/login"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <User className="w-5 h-5 text-slate-400" />
                    Sign In
                  </Link>
                </SheetClose>
              )}
            </nav>

            {!isAuthenticated && (
              <div className="px-4 mt-auto pb-6">
                <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md text-white space-y-3">
                  <h4 className="font-bold text-sm">Ready to automate pricing?</h4>
                  <p className="text-xs text-blue-100 leading-relaxed">Start your clinical estimation journey today.</p>
                  <SheetClose asChild>
                    <Link to="/signup">
                      <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-md shadow-sm text-sm">
                        Get Started <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
              </div>
            )}

            {isAuthenticated && (
              <div className="px-4 mt-auto pb-6">
                <SheetClose asChild>
                  <Link to={user?.role === 'dentist' ? '/dentist/profile' : '/patient/profile'} className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-100 transition-colors cursor-pointer group">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform ${user?.role === 'dentist' ? 'bg-teal-600' : 'bg-blue-600'}`}>
                      {user?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{user?.full_name}</p>
                      <p className={`text-xs capitalize font-medium ${user?.role === 'dentist' ? 'text-teal-600' : 'text-blue-500'}`}>
                        {user?.role === 'dentist' ? 'Clinical Profile' : 'Patient Profile'}
                      </p>
                    </div>
                  </Link>
                </SheetClose>
              </div>
            )}

            <div className="px-4 pb-6">
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-md bg-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400">CLINICAL v3.2 — ACTIVE</span>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  )
}

export default Header
