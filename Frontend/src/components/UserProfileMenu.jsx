import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  User, Settings, LogOut, LayoutDashboard,
  Shield, Mail, ChevronRight, UserCircle
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function UserProfileMenu({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Get Initials for Avatar
  const getInitials = (name) => {
    if (!name) return 'P'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  const isDentist = user?.role === 'dentist'

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" className="relative h-10 w-10 rounded-md">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={`${isDentist ? 'bg-cyan-600' : 'bg-blue-600'} text-white font-bold`}>
                {getInitials(user?.full_name || user?.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden rounded-md border-slate-200/60 shadow-2xl shadow-slate-200/50" align="start" side="top" sideOffset={10}>
        {/* Profile Header */}
        <div className="bg-slate-50/50 p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className={`absolute inset-0 ${isDentist ? 'bg-cyan-500' : 'bg-blue-500'} rounded-md blur-md opacity-20`} />
              <Avatar className="h-14 w-14 rounded-md border-2 border-white shadow-sm relative z-10">
                <AvatarFallback className={`bg-gradient-to-br ${isDentist ? 'from-cyan-600 to-teal-600' : 'from-blue-600 to-indigo-600'} text-white text-lg font-black`}>
                  {getInitials(user?.full_name || user?.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[15px] font-black text-slate-900 truncate tracking-tight leading-none mb-1.5">
                {user?.full_name || user?.name || (isDentist ? 'Clinician Admin' : 'Patient Node')}
              </h4>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Mail className="w-3 h-3" />
                <span className="text-[11px] font-bold truncate tracking-tight">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Actions */}
        <div className="p-2 bg-white">
          <div className="px-3 py-2">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 px-1">Control Hub</p>
            <div className="space-y-1">
              <Link
                to={isDentist ? '/dashboard/clinician' : '/dashboard/patient'}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 text-slate-600 ${isDentist ? 'hover:text-cyan-600' : 'hover:text-blue-600'} transition-all group`}
              >
                <div className={`w-8 h-8 rounded-md bg-slate-100/50 flex items-center justify-center ${isDentist ? 'group-hover:bg-cyan-100' : 'group-hover:bg-blue-100'} transition-colors`}>
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold flex-1">Launch Dashboard</span>
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all ${isDentist ? 'text-cyan-500' : 'text-blue-500'}`} />
              </Link>

              <Link
                to="/profile"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 text-slate-600 ${isDentist ? 'hover:text-cyan-600' : 'hover:text-blue-600'} transition-all group`}
              >
                <div className={`w-8 h-8 rounded-md bg-slate-100/50 flex items-center justify-center ${isDentist ? 'group-hover:bg-cyan-100' : 'group-hover:bg-blue-100'} transition-colors`}>
                  <UserCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold flex-1">Profile Dossier</span>
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all ${isDentist ? 'text-cyan-500' : 'text-blue-500'}`} />
              </Link>

              <Link
                to="/settings"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 text-slate-600 ${isDentist ? 'hover:text-cyan-600' : 'hover:text-blue-600'} transition-all group`}
              >
                <div className={`w-8 h-8 rounded-md bg-slate-100/50 flex items-center justify-center ${isDentist ? 'group-hover:bg-cyan-100' : 'group-hover:bg-blue-100'} transition-colors`}>
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold flex-1">Gateway Settings</span>
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all ${isDentist ? 'text-cyan-500' : 'text-blue-500'}`} />
              </Link>
            </div>
          </div>

          <Separator className="my-2 bg-slate-100" />

          <div className="p-2 pt-0">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 h-12 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 px-4 group transition-all"
            >
              <div className="w-8 h-8 rounded-md bg-red-100/50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Terminate Session</span>
            </Button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center leading-none">
            Secure Multi-Factor Authenticated
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
