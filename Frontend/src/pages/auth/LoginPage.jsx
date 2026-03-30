import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Stethoscope, Mail, LockKeyhole, ArrowRight,
  ShieldCheck, Cpu, Zap, Globe, Eye, EyeOff,
  ChevronLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { loginDentist, verifyLogin } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/Logo'
import { cn } from '@/lib/utils'

/* ─── Feature row (left panel) ──────────────────────────────────────────────── */
const Feature = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay }}
    className="flex items-start gap-4"
  >
    <div className="w-10 h-10 rounded-md bg-teal-500/15 border border-teal-400/20 flex items-center justify-center shrink-0">
      <Icon className="w-4.5 h-4.5 text-teal-300" />
    </div>
    <div>
      <p className="text-[14px] font-bold text-white leading-tight">{title}</p>
      <p className="text-[12px] text-teal-100/55 font-medium leading-relaxed mt-0.5">{desc}</p>
    </div>
  </motion.div>
)

/* ─── Input field ────────────────────────────────────────────────────────────── */
const Field = ({ icon: Icon, placeholder, type = 'text', value, onChange }) => {
  const [show, setShow] = useState(false)
  const isPwd = type === 'password'

  return (
    <div className="relative group/field">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-teal-600 transition-colors pointer-events-none" />
      <input
        type={isPwd ? (show ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className={cn(
          'w-full h-12 rounded-md text-[14px] font-bold text-foreground',
          'bg-secondary/30 dark:bg-zinc-900/50 border border-border',
          'placeholder:text-muted-foreground placeholder:font-medium',
          'focus:outline-none focus:border-teal-500/50 focus:bg-card focus:ring-4 focus:ring-teal-500/5',
          'transition-all duration-150',
          isPwd ? 'pl-11 pr-11' : 'pl-11 pr-4'
        )}
      />
      {isPwd && (
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors focus:outline-none"
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
const LoginPage = () => {
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
      const res = await loginDentist(email, password)
      if (res.status === '2fa_required') {
        toast.info('Verification code sent to your clinical email.')
        setIs2fa(true)
      } else if (res.status === 'success') {
        toast.success(`Welcome back.`)
        login(res.user, res.token)
        navigate('/dashboard/clinician')
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
      const res = await verifyLogin(email, 'dentist', otp)
      if (res.status === 'success') {
        toast.success(`Identity verified. Welcome back, Dr. ${res.user.full_name?.split(' ')[0]}`)
        login(res.user, res.token)
        navigate('/dashboard/clinician')
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

        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(#2dd4bf 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Glow blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-teal-600/20 rounded-md blur-[100px]" />
        <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 bg-teal-500/10 rounded-md blur-[80px]" />

        <div className="relative z-10 space-y-10">
          {/* Logo */}
          <Link to="/">
            <Logo theme="dark" variant="dentist" />
          </Link>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-3 pt-8"
          >
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Clinician portal <br />
              <span className="text-teal-400">Terminal v2.4</span>
            </h1>
            <p className="text-[14px] text-teal-100/60 font-medium leading-relaxed max-w-sm">
              Accurate cost calculations, protocol recommendations, and patient-ready treatment plans — all in one place.
            </p>
          </motion.div>

          {/* Feature list */}
          <div className="space-y-5 pt-4">
            <Feature icon={Cpu} title="Instant cost calculations" desc="Accurate quotes based on procedure complexity and materials." delay={0.35} />
            <Feature icon={Zap} title="Clinical decision support" desc="Intelligent material and protocol recommendations per case." delay={0.45} />
            <Feature icon={Globe} title="Real-time patient discussions" desc="Generate and review treatment options with patients chairside." delay={0.55} />
            <Feature icon={ShieldCheck} title="Secure & compliant" desc="Your patient data is encrypted and stored safely." delay={0.65} />
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10 flex items-center gap-2 pt-8">
          <div className="w-1.5 h-1.5 bg-teal-500 rounded-md animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
          <span className="text-[11px] font-bold text-teal-300/60 uppercase tracking-wider">Clinical Node Active</span>
        </div>
      </div>

      {/* ══ RIGHT — form panel ════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 relative overflow-y-auto">

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: `radial-gradient(${'#2dd4bf'} 1.5px, transparent 1.5px)`, backgroundSize: '24px 24px' }} />

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Portal switch */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 mb-8 text-[12px] font-bold uppercase tracking-widest text-muted-foreground hover:text-teal-600 transition-colors group"
          >
            <div className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center group-hover:border-teal-500/50 group-hover:shadow-lg group-hover:shadow-teal-500/5 transition-all">
              <ChevronLeft className="w-3.5 h-3.5" />
            </div>
            Switch portal
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 space-y-2">
            <Logo variant="dentist" />
            <h2 className="text-2xl font-black text-foreground tracking-tight mt-4 uppercase tracking-[0.05em]">Clinician sign in</h2>
            <p className="text-[13px] font-medium text-muted-foreground">Access your clinical tools and patient records.</p>
          </div>

          {/* Form card */}
          <div className="bg-card border border-border rounded-md overflow-hidden shadow-2xl shadow-teal-500/5 relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-teal-600" />

            <div className="px-7 py-6 border-b border-border flex items-center gap-3 bg-secondary/20">
              <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center shadow-lg shadow-teal-600/20">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black text-foreground uppercase tracking-widest leading-tight hidden lg:block">Clinician sign in</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] hidden lg:block mt-1">Credentials verification protocol</p>
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
                      icon={LockKeyhole}
                      placeholder="Password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                    />
                    <div className="flex justify-end">
                      <Link
                        to="/forgot-password"
                        className="text-[11px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="px-4 py-3 bg-teal-500/10 border border-teal-500/20 rounded-md flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-teal-500 mt-0.5" />
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider leading-relaxed">
                      Two-step verification enabled for <span className="text-foreground">{email}</span>.
                    </p>
                  </div>
                  <div className="relative group/field">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-teal-600 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      className={cn(
                        'w-full h-12 pl-11 pr-4 rounded-md text-[18px] font-black tracking-[0.4em] text-foreground',
                        'bg-secondary/30 dark:bg-zinc-900 border border-border focus:outline-none focus:border-teal-500/50 focus:bg-card focus:ring-4 focus:ring-teal-500/5',
                        'transition-all duration-150'
                      )}
                    />
                  </div>
                  <button
                    type="button" onClick={() => setIs2fa(false)}
                    className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-teal-600 transition-colors"
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
                  'bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-600/20 active:scale-[0.98]',
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
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Protocol Entry</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Sign up */}
              <Link to="/signup/clinician">
                <button
                  type="button"
                  className={cn(
                    'w-full h-11 rounded-md text-[11px] font-black uppercase tracking-widest',
                    'bg-secondary/30 border border-border text-foreground',
                    'hover:bg-secondary/50 hover:border-teal-500/30',
                    'transition-all duration-150'
                  )}
                >
                  Register new account
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

export default LoginPage