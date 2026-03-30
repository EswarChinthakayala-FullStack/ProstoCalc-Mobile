import { Stethoscope } from 'lucide-react'

const Logo = ({ className = '', theme = 'light', variant = 'default' }) => {
  const isDark = theme === 'dark'
  const titleColor = isDark ? 'text-white' : 'text-slate-900'

  // Decide which SVG and highlight color to use based on variant
  const isDentist = variant === 'dentist'
  const logoSrc = isDentist ? '/logo-teal.svg' : '/logo.svg'
  const highlightColor = isDentist ? 'text-teal-500' : 'text-blue-600'
  const logoBg = isDentist ? 'bg-white border-teal-100 shadow-teal-500/10' : 'bg-white border-slate-100 shadow-blue-500/10'

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Container */}
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center border shadow-lg transition-all overflow-hidden ${logoBg}`}>
        <img
          src={logoSrc}
          alt="ProstoCalc Logo"
          className="w-7 h-7 md:w-8 md:h-8 object-contain"
        />
      </div>

      {/* Text Container */}
      <div className="flex flex-col justify-center">
        <h1 className={`text-xl md:text-2xl font-black tracking-tight ${titleColor} leading-none`}>
          Prosto<span className={highlightColor}>Calc</span>
        </h1>
        <span className={`text-[8px] font-bold tracking-[0.2em] uppercase mt-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
          {isDentist ? 'Clinical Engine' : 'Patient Portal'}
        </span>
      </div>
    </div>
  )
}

export default Logo
