import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  UserCheck, KeyRound, Mail, ArrowRight, ShieldCheck,
  HeartPulse, History, Sparkles, Eye, EyeOff, ChevronLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { loginPatient, verifyLogin } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/Logo'
import { cn } from '@/lib/utils'

/* ─── Feature row (left panel) ──────────────────────────────────────────────── */
const Feature = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay }}
    className="flex items-start gap-4"
  >
    <div className="w-10 h-10 rounded-md bg-blue-500/15 border border-blue-400/20 flex items-center justify-center shrink-0">
      <Icon className="w-4.5 h-4.5 text-blue-300" />
    </div>
    <div>
      <p className="text-[14px] font-bold text-white leading-tight">{title}</p>
      <p className="text-[12px] text-blue-100/55 font-medium leading-relaxed mt-0.5">{desc}</p>
    </div>
  </motion.div>
)

/* ─── Input field ────────────────────────────────────────────────────────────── */
const Field = ({ icon: Icon, placeholder, type = 'text', value, onChange }) => {
  const [show, setShow] = useState(false)
  const isPwd = type === 'password'
  return (
    <div className="relative group/field">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-blue-600 transition-colors pointer-events-none" />
      <input
        type={isPwd ? (show ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className={cn(
          'w-full h-12 rounded-md text-[14px] font-bold text-foreground',
          'bg-secondary/30 dark:bg-zinc-900 border border-border',
          'placeholder:text-muted-foreground placeholder:font-medium',
          'focus:outline-none focus:border-blue-500/50 focus:bg-card focus:ring-4 focus:ring-blue-500/5',
          'transition-all duration-150',
          isPwd ? 'pl-11 pr-11' : 'pl-11 pr-4'
        )}
      />
      {isPwd && (
        <button
          type="button" onClick={() => setShow(v => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors focus:outline-none"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════════ */
const PatientLoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [is2fa, setIs2fa] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const emailValid = email.toLowerCase().endsWith('@gmail.com');

  const handleLogin = async e => {
    e.preventDefault()
    if (!emailValid) return toast.error('Only @gmail.com addresses are permitted.');
    setIsLoading(true)
    try {
      const res = await loginPatient(email, password)
      if (res.status === '2fa_required') {
        toast.info('Verification code sent to your email.')
        setIs2fa(true)
      } else if (res.status === 'success') {
        toast.success(`Welcome back.`)
        login(res.user, res.token)
        navigate('/dashboard/patient')
      } else {
        toast.error(res.message || 'Incorrect email or password.')
      }
    } catch {
      toast.error('Unable to connect. Please check your internet.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async e => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await verifyLogin(email, 'patient', otp)
      if (res.status === 'success') {
        toast.success(`Identity verified. Welcome back.`)
        login(res.user, res.token)
        navigate('/dashboard/patient')
      } else {
        toast.error(res.message || 'Invalid code.')
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      toast.error('Verification failed. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* ══ LEFT — branding panel ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[42%] bg-zinc-950 relative overflow-hidden flex-col justify-between p-12 xl:p-16">

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Glow blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-blue-600/20 rounded-md blur-[100px]" />
        <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 bg-blue-500/10 rounded-md blur-[80px]" />

        <div className="relative z-10 space-y-10">
          <Link to="/"><Logo theme="dark" variant="patient" /></Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-3 pt-8"
          >
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Your dental care, <br />
              <span className="text-blue-400">made clear.</span>
            </h1>
            <p className="text-[14px] text-blue-100/60 font-medium leading-relaxed max-w-sm">
              Sign in to view your treatment plan, check appointment details, and understand your costs.
            </p>
          </motion.div>

          <div className="space-y-5 pt-4">
            <Feature icon={Sparkles} title="Transparent pricing" desc="See a full breakdown of costs before any procedure." delay={0.35} />
            <Feature icon={History} title="Your treatment journey" desc="Track every step of your dental care in one place." delay={0.45} />
            <Feature icon={HeartPulse} title="Confident decisions" desc="All the information you need to make the right choice." delay={0.55} />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 pt-8">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-md animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="text-[11px] font-bold text-blue-300/60 uppercase tracking-wider">Patient portal connected</span>
        </div>
      </div>

      {/* ══ RIGHT — form panel ════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 relative overflow-y-auto">

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: `radial-gradient(${'#3b82f6'} 1.5px, transparent 1.5px)`, backgroundSize: '24px 24px' }} />

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Portal switch */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 mb-8 text-[12px] font-bold uppercase tracking-widest text-muted-foreground hover:text-blue-600 transition-colors group"
          >
            <div className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center group-hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/5 transition-all">
              <ChevronLeft className="w-3.5 h-3.5" />
            </div>
            Switch portal
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 space-y-2">
            <Logo variant="patient" />
            <h2 className="text-2xl font-black text-foreground tracking-tight mt-4 uppercase tracking-[0.05em]">Patient sign in</h2>
            <p className="text-[13px] font-medium text-muted-foreground">Sign in to access your dental portal.</p>
          </div>

          {/* Form card */}
          <div className="bg-card border border-border rounded-md overflow-hidden shadow-2xl shadow-blue-500/5 relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-600" />

            <div className="px-7 py-5 border-b border-border flex items-center gap-3 bg-secondary/20">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-600/20">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black text-foreground uppercase tracking-widest leading-tight hidden lg:block">Patient sign in</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] hidden lg:block mt-1">Authorized Patient access point</p>
                <p className="text-[12px] font-black uppercase tracking-widest text-foreground lg:hidden">Enter credentials</p>
              </div>
            </div>

            <form onSubmit={is2fa ? handleVerifyOtp : handleLogin} className="px-7 py-6 space-y-5">

              {/* Fields */}
              {!is2fa ? (
                <div className="space-y-3">
                  <Field
                    icon={Mail}
                    placeholder="Email address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                  />
                  <div className="space-y-1.5">
                    <Field
                      icon={KeyRound}
                      placeholder="Password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                    />
                    <div className="flex justify-end">
                      <Link
                        to="/forgot-password"
                        className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider leading-relaxed">
                      Verification code sent to <span className="text-foreground">{email}</span>.
                    </p>
                  </div>
                  <div className="relative group/field">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-blue-600 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      className={cn(
                        'w-full h-12 pl-11 pr-4 rounded-md text-[18px] font-black tracking-[0.4em] text-foreground',
                        'bg-secondary/30 dark:bg-zinc-900 border border-border focus:outline-none focus:border-blue-500/50 focus:bg-card focus:ring-4 focus:ring-blue-500/5',
                        'transition-all duration-150'
                      )}
                    />
                  </div>
                  <button
                    type="button" onClick={() => setIs2fa(false)}
                    className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Back to login
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full h-12 rounded-md text-[11px] font-black uppercase tracking-widest text-white',
                  'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-[0.98]',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  'transition-all duration-150',
                  'flex items-center justify-center gap-2'
                )}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-md animate-spin" />
                    {is2fa ? 'Verifying…' : 'Signing in…'}
                  </>
                ) : (
                  <>
                    {is2fa ? 'Verify and sign in' : 'Sign in'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Identity Gate</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Sign up */}
              <Link to="/signup/patient">
                <button
                  type="button"
                  className={cn(
                    'w-full h-11 rounded-md text-[11px] font-black uppercase tracking-widest',
                    'bg-secondary/30 border border-border text-foreground',
                    'hover:bg-secondary/50 hover:border-blue-500/30',
                    'transition-all duration-150'
                  )}
                >
                  Create new patient profile
                </button>
              </Link>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] font-medium text-slate-400 mt-5 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            Your data is encrypted and never shared.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default PatientLoginPage