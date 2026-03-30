import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail, KeyRound, ArrowRight, ShieldCheck,
  ChevronLeft, CheckCircle2, Circle, Stethoscope,
  UserCircle, Lock, RefreshCcw, Eye, EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import Logo from '@/components/Logo'
import { cn } from '@/lib/utils'
import { forgotPassword, verifyOtp, resetPassword } from '@/services/api'

/* ─── Password requirement row ───────────────────────────────────────────────── */
const PwdReq = ({ met, text, color }) => (
  <div className={cn(
    'flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-colors',
    met 
      ? (color === 'teal' ? 'text-teal-600 dark:text-teal-400' : 'text-blue-600 dark:text-blue-400') 
      : 'text-muted-foreground/60'
  )}>
    {met
      ? <CheckCircle2 className={cn('w-3.5 h-3.5 shrink-0', color === 'teal' ? 'text-teal-500' : 'text-blue-500')} />
      : <Circle className="w-3.5 h-3.5 shrink-0 opacity-40" />
    }
    {text}
  </div>
)

/* ─── Shared input ───────────────────────────────────────────────────────────── */
const Field = ({ icon: Icon, placeholder, type = 'text', value, onChange, maxLength, color = 'blue', tracking = false }) => {
  const [show, setShow] = useState(false)
  const isPwd = type === 'password'
  return (
    <div className="relative group/field">
      <Icon className={cn(
        'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors pointer-events-none',
        color === 'teal' ? 'group-focus-within/field:text-teal-600' : 'group-focus-within/field:text-blue-600'
      )} />
      <input
        type={isPwd ? (show ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        required
        className={cn(
          'w-full h-12 rounded-md text-[14px] font-bold text-foreground',
          'bg-secondary/30 dark:bg-zinc-900 border border-border',
          'placeholder:text-muted-foreground placeholder:font-medium uppercase tracking-wider',
          'focus:outline-none focus:bg-card focus:ring-4 transition-all duration-150',
          color === 'teal' ? 'focus:border-teal-500/50 focus:ring-teal-500/5' : 'focus:border-blue-500/50 focus:ring-blue-500/5',
          tracking ? 'tracking-[0.4em] text-[18px] font-black' : '',
          isPwd ? 'pl-11 pr-11' : 'pl-11 pr-4'
        )}
      />
      {isPwd && (
        <button
          type="button" onClick={() => setShow(v => !v)}
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors focus:outline-none',
            color === 'teal' ? 'hover:text-teal-600' : 'hover:text-blue-600'
          )}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}

/* ─── Step progress dots ─────────────────────────────────────────────────────── */
const StepDots = ({ step, color }) => (
  <div className="flex items-center justify-center gap-2 pt-2 pb-1">
    {[1, 2, 3].map(s => (
      <div key={s} className={cn(
        'rounded-md transition-all duration-300',
        s === step
          ? cn('w-5 h-1.5', color === 'teal' ? 'bg-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]')
          : s < step
            ? cn('w-1.5 h-1.5', color === 'teal' ? 'bg-teal-300/40' : 'bg-blue-300/40')
            : 'w-1.5 h-1.5 bg-muted/30'
      )} />
    ))}
  </div>
)

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════════ */
const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('patient')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const color = role === 'dentist' ? 'teal' : 'blue'

  const hasLength = password.length >= 6
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  const pMatch = password && password === confirmPassword
  const pValid = hasLength && hasUpper && hasNumber && hasSpecial && pMatch

  const handleSendOTP = async (e) => {
    e?.preventDefault()
    if (!email) return toast.error('Please enter your email address.')
    setLoading(true)
    try {
      const res = await forgotPassword(email, role)
      if (res.status === 'success') { toast.success(res.message || 'Code sent to your email.'); setStep(2) }
      else toast.error(res.message || 'Failed to send code.')
    } catch (err) { toast.error('Unable to connect. Please try again.') }
    finally { setLoading(false) }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (!otp) return toast.error('Please enter the verification code.')
    setLoading(true)
    try {
      const res = await verifyOtp(email, role, otp)
      if (res.status === 'success') { toast.success('Identity verified.'); setStep(3) }
      else toast.error(res.message || 'Incorrect code. Please try again.')
    } catch { toast.error('Unable to connect. Please try again.') }
    finally { setLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!pValid) return toast.error('Please meet all password requirements.')
    setLoading(true)
    try {
      const res = await resetPassword({ email, role, password, otp })
      if (res.status === 'success') {
        toast.success('Password updated. You can now sign in.')
        navigate(role === 'dentist' ? '/login/clinician' : '/login/patient')
      } else toast.error(res.message || 'Failed to reset password.')
    } catch { toast.error('Unable to connect. Please try again.') }
    finally { setLoading(false) }
  }

  /* ── Left panel copy ── */
  const panelCopy = {
    1: { h: <>Recover your <br /><span className={color === 'teal' ? 'text-teal-400' : 'text-blue-400'}>account.</span></>, p: "Enter your email address and we'll send you a one-time verification code." },
    2: { h: <>Verify your <br /><span className={color === 'teal' ? 'text-teal-400' : 'text-blue-400'}>identity.</span></>, p: `We sent a 6-digit code to ${email}. Enter it below to continue.` },
    3: { h: <>Set a new <br /><span className={color === 'teal' ? 'text-teal-400' : 'text-blue-400'}>password.</span></>, p: "Choose a strong password to secure your account." },
  }

  const stepIcon = { 1: RefreshCcw, 2: ShieldCheck, 3: Lock }
  const stepTitle = { 1: 'Forgot password', 2: 'Verify code', 3: 'New password' }
  const StepIcon = stepIcon[step]

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* ══ LEFT — branding panel ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[42%] bg-zinc-950 relative overflow-hidden flex-col justify-between p-12 xl:p-16 transition-colors duration-500">
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: `radial-gradient(${role === 'dentist' ? '#2dd4bf' : '#3b82f6'} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
        <div className={cn('absolute top-[-80px] right-[-80px] w-80 h-80 rounded-md blur-[100px] transition-colors duration-700', role === 'dentist' ? 'bg-teal-600/20' : 'bg-blue-600/20')} />
        <div className={cn('absolute bottom-[-80px] left-[-80px] w-64 h-64 rounded-md blur-[80px]', role === 'dentist' ? 'bg-teal-500/10' : 'bg-blue-500/10')} />

        <div className="relative z-10 space-y-10">
          <Link to="/"><Logo theme="dark" variant={role} /></Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 pt-8"
            >
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
                {panelCopy[step].h}
              </h1>
              <p className={cn('text-[14px] font-medium leading-relaxed max-w-sm', role === 'dentist' ? 'text-teal-100/60' : 'text-blue-100/60')}>
                {panelCopy[step].p}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Step progress */}
          <div className="flex items-center gap-4 pt-4">
            {[
              { n: 1, label: 'Email' },
              { n: 2, label: 'Verify' },
              { n: 3, label: 'Reset' },
            ].map(({ n, label }, i) => (
              <React.Fragment key={n}>
                <div key={n} className="flex items-center gap-2">
                  <div className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black border transition-all',
                    n < step ? (role === 'dentist' ? 'bg-teal-600 border-teal-600 text-white' : 'bg-blue-600 border-blue-600 text-white') :
                      n === step ? 'bg-white/15 border-white/30 text-white shadow-lg' :
                        'bg-white/5 border-white/10 text-white/30'
                  )}>
                    {n < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
                  </div>
                  <span className={cn('text-[10px] font-black uppercase tracking-widest', n === step ? 'text-white' : 'text-white/30')}>{label}</span>
                </div>
                {i < 2 && <div className={cn('flex-1 h-px', n < step ? (role === 'dentist' ? 'bg-teal-600/50' : 'bg-blue-600/50') : 'bg-white/10')} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 pt-8">
          <div className={cn('w-1.5 h-1.5 rounded-md animate-pulse shadow-lg', role === 'dentist' ? 'bg-teal-500 shadow-teal-500/50' : 'bg-blue-500 shadow-blue-500/50')} />
          <span className={cn('text-[10px] font-black uppercase tracking-[0.2em] transition-colors', role === 'dentist' ? 'text-teal-300/60' : 'text-blue-300/60')}>
            Protocol Sequence Active
          </span>
        </div>
      </div>

      {/* ══ RIGHT — form panel ════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 relative overflow-y-auto">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: `radial-gradient(${role === 'dentist' ? '#2dd4bf' : '#3b82f6'} 1.5px, transparent 1.5px)`, backgroundSize: '24px 24px' }} />

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Back to sign in */}
          <Link
            to={role === 'dentist' ? '/login/clinician' : '/login/patient'}
            className={cn(
              'inline-flex items-center gap-2 mb-8 text-[12px] font-black uppercase tracking-widest text-muted-foreground transition-colors group',
              role === 'dentist' ? 'hover:text-teal-600' : 'hover:text-blue-600'
            )}
          >
            <div className={cn(
              'w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center transition-all shadow-sm',
              role === 'dentist' ? 'group-hover:border-teal-500/50 group-hover:shadow-teal-500/5' : 'group-hover:border-blue-500/50 group-hover:shadow-blue-500/5'
            )}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </div>
            Exit Protocol
          </Link>

          {/* Form card */}
          <div className="bg-card border border-border rounded-md overflow-hidden shadow-2xl shadow-black/10 relative transition-all duration-300">
            <div className={cn('absolute top-0 left-0 right-0 h-[3px] transition-colors duration-500', color === 'teal' ? 'bg-teal-600' : 'bg-blue-600')} />

            {/* Card header */}
            <div className="px-7 py-5 border-b border-border flex items-center justify-between bg-secondary/20">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center shadow-lg',
                  color === 'teal' ? 'bg-teal-600 shadow-teal-600/20' : 'bg-blue-600 shadow-blue-600/20'
                )}>
                  <StepIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-foreground uppercase tracking-widest leading-tight">{stepTitle[step]}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] mt-1">
                    Sequence {step} of 3
                  </p>
                </div>
              </div>
              <StepDots step={step} color={color} />
            </div>

            <div className="px-7 py-6">

              {/* ── STEP 1: Email ── */}
              {step === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-5">

                  {/* Role toggle */}
                  <div className="p-1 bg-secondary/40 border border-border rounded-md flex gap-1">
                    <button
                      type="button"
                      onClick={() => setRole('patient')}
                      className={cn(
                        'flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-2',
                        role === 'patient' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                      )}
                    >
                      <UserCircle className="w-3.5 h-3.5" /> Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('dentist')}
                      className={cn(
                        'flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-2',
                        role === 'dentist' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                      )}
                    >
                      <Stethoscope className="w-3.5 h-3.5" /> Clinician
                    </button>
                  </div>

                  <Field icon={Mail} placeholder="Email address" type="email" value={email} onChange={setEmail} color={color} />

                  <button
                    type="submit" disabled={loading}
                    className={cn(
                      'w-full h-12 rounded-md text-[11px] font-black uppercase tracking-widest text-white transition-all duration-150 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
                      color === 'teal' ? 'bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20'
                    )}
                  >
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-md animate-spin" /> : <><span>Transmit Request</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </form>
              )}

              {/* ── STEP 2: OTP ── */}
              {step === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-5">

                  <div className={cn('px-4 py-3 rounded-md border text-[11px] font-black uppercase tracking-widest flex items-start gap-3', color === 'teal' ? 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400')}>
                    <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                    <span>Identity: <span className="text-foreground ml-1">{email}</span></span>
                  </div>

                  <Field
                    icon={ShieldCheck}
                    placeholder="Enter 6-digit code"
                    type="text"
                    value={otp}
                    onChange={v => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    color={color}
                    tracking={true}
                  />

                  <button
                    type="submit" disabled={loading || otp.length < 6}
                    className={cn(
                      'w-full h-12 rounded-md text-[11px] font-black uppercase tracking-widest text-white transition-all duration-150 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
                      color === 'teal' ? 'bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20'
                    )}
                  >
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-md animate-spin" /> : <><span>Authorize Access</span><ShieldCheck className="w-4 h-4" /></>}
                  </button>

                  <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Didn't receive it?{' '}
                    <button
                      type="button" onClick={handleSendOTP}
                      className={cn('font-black transition-colors', color === 'teal' ? 'text-teal-600 hover:text-teal-700' : 'text-blue-600 hover:text-blue-700')}
                    >
                      Resend Protocol
                    </button>
                  </p>
                </form>
              )}

              {/* ── STEP 3: New password ── */}
              {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-3">
                    <Field icon={KeyRound} placeholder="New password" type="password" value={password} onChange={setPassword} color={color} />
                    <Field icon={ShieldCheck} placeholder="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} color={color} />
                  </div>

                  {password.length > 0 && (
                    <div className="bg-secondary/40 border border-border rounded-md p-4 grid grid-cols-2 gap-2 transition-all duration-300">
                      <PwdReq met={hasLength} text="6+ characters" color={color} />
                      <PwdReq met={hasUpper} text="Uppercase char" color={color} />
                      <PwdReq met={hasNumber} text="Numeral freq" color={color} />
                      <PwdReq met={hasSpecial} text="Symbol seq" color={color} />
                      <PwdReq met={pMatch} text="Parity check" color={color} />
                    </div>
                  )}

                  <button
                    type="submit" disabled={loading || !pValid}
                    className={cn(
                      'w-full h-12 rounded-md text-[11px] font-black uppercase tracking-widest text-white transition-all duration-150 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
                      color === 'teal' ? 'bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20'
                    )}
                  >
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-md animate-spin" /> : <><span>Commit Changes</span><RefreshCcw className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

            </div>
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

export default ForgotPassword