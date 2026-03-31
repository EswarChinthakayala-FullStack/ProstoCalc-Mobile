import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  UserCircle, Phone, Mail, KeyRound, ArrowRight,
  ShieldCheck, Sparkles, Activity, Eye, EyeOff,
  ChevronLeft, CheckCircle2, Circle
} from 'lucide-react'
import { toast } from 'sonner'
import { signupPatient } from '@/services/api'
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
const Field = ({ icon: Icon, placeholder, type = 'text', value, onChange, maxLength }) => {
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
        maxLength={maxLength}
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

/* ─── Password requirement row ───────────────────────────────────────────────── */
const PwdReq = ({ met, text }) => (
  <div className={cn('flex items-center gap-2 text-[11px] font-semibold transition-colors', met ? 'text-blue-600' : 'text-slate-400')}>
    {met
      ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
      : <Circle className="w-3.5 h-3.5 shrink-0" />
    }
    {text}
  </div>
)

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════════ */
const PatientSignupPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: ''
  })
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [otp, setOtp] = useState('')

  // Strict Validations
  const nameValid = formData.fullName.trim().length > 2 && formData.fullName.length <= 30 && /^[a-zA-Z\s]+$/.test(formData.fullName);
  const emailValid = formData.email.toLowerCase().endsWith('@gmail.com');
  const phoneValid = /^[6-9]\d{9}$/.test(formData.phone);

  const pwd = formData.password
  const hasLength = pwd.length >= 6
  const hasUpper = /[A-Z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)
  const pwdMatch = pwd && pwd === formData.confirmPassword
  const pwdValid = hasLength && hasUpper && hasNumber && hasSpecial && pwdMatch

  const formReady = nameValid && emailValid && phoneValid && pwdValid && agreed;

  const set = (field, val) => setFormData(p => ({ ...p, [field]: val }))

  const handleSignup = async e => {
    e.preventDefault()
    if (!formReady) return
    setIsLoading(true)
    try {
      const res = await signupPatient({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      })
      if (res.status === 'verification_required') {
        toast.info('Please verify your email address.')
        setIsVerifying(true)
      } else if (res.status === 'success') {
        toast.success('Account created. You can now sign in.')
        navigate('/login/patient')
      } else {
        toast.error(res.message || 'Registration failed. Please try again.')
      }
    } catch {
      toast.error('Unable to connect. Please check your internet and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async e => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { verifyLogin } = await import('@/services/api')
      const res = await verifyLogin(formData.email, 'patient', otp, 'signup')
      if (res.status === 'success') {
        toast.success('Account verified successfully!')
        navigate('/login/patient')
      } else {
        toast.error(res.message || 'Invalid verification code.')
      }
    } catch {
      toast.error('Verification failed. Please try again.')
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
              <span className="text-blue-400">all in one place.</span>
            </h1>
            <p className="text-[14px] text-blue-100/60 font-medium leading-relaxed max-w-sm">
              Book appointments, view treatment plans, understand costs, and track your recovery — all from one dashboard.
            </p>
          </motion.div>

          <div className="space-y-5 pt-4">
            <Feature icon={Sparkles} title="Clear pricing" desc="See accurate cost estimates before your appointment." delay={0.35} />
            <Feature icon={Activity} title="Track your progress" desc="Follow your treatment plan and recovery milestones." delay={0.45} />
            <Feature icon={ShieldCheck} title="Your data, protected" desc="All records are encrypted and stored securely." delay={0.55} />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 pt-8">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-md animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="text-[11px] font-bold text-blue-300/60 uppercase tracking-wider">Patient portal connected</span>
        </div>
      </div>

      {/* ══ RIGHT — form panel ════════════════════════════════════════════ */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-6 sm:p-10 lg:p-12 relative overflow-y-auto">

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: `radial-gradient(${'#3b82f6'} 1.5px, transparent 1.5px)`, backgroundSize: '24px 24px' }} />

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10 py-8 lg:py-0"
        >
          {/* Back */}
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 mb-6 text-[12px] font-bold uppercase tracking-widest text-muted-foreground hover:text-blue-600 transition-colors group"
          >
            <div className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center group-hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/5 transition-all">
              <ChevronLeft className="w-3.5 h-3.5" />
            </div>
            Change role
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden mb-7 space-y-1">
            <Logo variant="patient" />
            <h2 className="text-2xl font-black text-foreground tracking-tight mt-4 uppercase tracking-[0.05em]">Create account</h2>
            <p className="text-[13px] font-medium text-muted-foreground">Register to access your patient portal.</p>
          </div>

          {/* Form card */}
          <div className="bg-card border border-border rounded-md overflow-hidden shadow-2xl shadow-blue-500/5 relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-600" />

            <div className="px-7 py-5 border-b border-border flex items-center gap-3 bg-secondary/20">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-600/20">
                <UserCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black text-foreground uppercase tracking-widest leading-tight hidden lg:block">Patient Registration</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] hidden lg:block mt-1">Authorized patient access terminal</p>
                <p className="text-[12px] font-black uppercase tracking-widest text-foreground lg:hidden">Enter credentials</p>
              </div>
            </div>

            <form onSubmit={isVerifying ? handleVerify : handleSignup} className="px-7 py-6 space-y-4">
              {isVerifying ? (
                <div className="space-y-4">
                  <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5" />
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider leading-relaxed">
                      A verification code has been sent to <span className="text-foreground">{formData.email}</span>. Please enter it below to activate your account.
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
                    type="button" onClick={() => setIsVerifying(false)}
                    className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Back to registration
                  </button>
                </div>
              ) : (
                <>
                  {/* Fields */}
                  <div className="space-y-1">
                    <Field icon={UserCircle} placeholder="Full name" value={formData.fullName} onChange={v => set('fullName', v)} maxLength={30} />
                    {formData.fullName && !nameValid && <p className="text-[10px] text-red-500 font-semibold px-1">Names must be letters/spaces only and max 30 characters.</p>}
                  </div>

                  <div className="space-y-1">
                    <Field icon={Mail} placeholder="Gmail address (@gmail.com)" value={formData.email} onChange={v => set('email', v)} type="email" />
                    {formData.email && !emailValid && <p className="text-[10px] text-red-500 font-semibold px-1">Only @gmail.com addresses are allowed.</p>}
                  </div>

                  <div className="space-y-1">
                    <Field icon={Phone} placeholder="Phone number (starts 6-9)" value={formData.phone} onChange={v => set('phone', v)} type="tel" />
                    {formData.phone && !phoneValid && <p className="text-[10px] text-red-500 font-semibold px-1">10 digits starting with 6, 7, 8, or 9.</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-3">
                    <Field icon={KeyRound} placeholder="Create a password" value={formData.password} onChange={v => set('password', v)} type="password" />
                    <Field icon={ShieldCheck} placeholder="Confirm your password" value={formData.confirmPassword} onChange={v => set('confirmPassword', v)} type="password" />

                    {formData.password.length > 0 && (
                      <div className="bg-secondary/30 dark:bg-zinc-900 border border-border rounded-md p-4 grid grid-cols-2 gap-2">
                        <PwdReq met={hasLength} text="6+ characters" />
                        <PwdReq met={hasUpper} text="Uppercase letter" />
                        <PwdReq met={hasNumber} text="At least one number" />
                        <PwdReq met={hasSpecial} text="Special character" />
                        <PwdReq met={pwdMatch} text="Passwords match" />
                      </div>
                    )}
                  </div>

                  {/* Agreement */}
                  <div
                    onClick={() => setAgreed(v => !v)}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-md border cursor-pointer select-none transition-all duration-150',
                      agreed ? 'bg-blue-500/5 border-blue-500/30' : 'bg-secondary/30 border-border hover:border-blue-500/30'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150',
                      agreed ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-card border-border'
                    )}>
                      {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className="text-[12px] font-bold text-foreground leading-relaxed">
                      I agree to the processing of my medical data in accordance with the{' '}
                      <span className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px]">Privacy Policy</span>.
                    </p>
                  </div>
                </>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !formReady}
                className={cn(
                  'w-full h-12 rounded-md text-[11px] font-black uppercase tracking-widest text-white',
                  'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-[0.98]',
                  'disabled:opacity-40 disabled:pointer-events-none',
                  'transition-all duration-150',
                  'flex items-center justify-center gap-2'
                )}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-md animate-spin" />
                    {isVerifying ? 'Verifying…' : 'Creating account…'}
                  </>
                ) : (
                  <>
                    {isVerifying ? 'Verify and create' : 'Create account'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Sign in link */}
              <p className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login/patient" className="text-blue-600 hover:text-blue-700 transition-colors font-black">
                  Sign in
                </Link>
              </p>
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

export default PatientSignupPage