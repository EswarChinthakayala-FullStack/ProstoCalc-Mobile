import React from 'react'
import { motion } from 'framer-motion'
import {
  Stethoscope, Calculator, Brain, ShieldCheck, TrendingUp,
  Award, Users, Target, Zap, ArrowRight, CheckCircle2, Star
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { Separator } from '../components/ui/separator'

import imgAbout from '../assets/about/priority.png'
import imgBanner1 from '../assets/about/banner/banner_1.png'
import imgBanner2 from '../assets/about/banner/banner_2.png'
import imgTeam1 from '../assets/about/team/1.png'
import imgTeam2 from '../assets/about/team/2.png'
import imgTeam3 from '../assets/about/team/3.png'
import imgTeam4 from '../assets/about/team/4.png'
import imgExpert from '../assets/expert.png'
import imgFooterCall from '../assets/footer/calling.png'
import imgFooterLocation from '../assets/footer/location.png'
import imgFooterTime from '../assets/footer/time.png'

const C = { darkBlue: '#0D2659', lightBlue: '#40A6F2', cyan: '#00D9F2' }
const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.6 } }
const stagger = (i) => ({ ...fadeUp, transition: { ...fadeUp.transition, delay: i * 0.08 } })

const AboutPage = () => {
  const team = [
    { name: 'Prasanna', role: 'Chief Prosthodontist', img: imgTeam1 },
    { name: 'Rahul Sharma', role: 'Lead Engineer', img: imgTeam2 },
     { name: 'Eswar', role: 'Developer', img: imgTeam3 },
    { name: 'Dr. Priya Desai', role: 'Clinical Advisor', img: imgTeam4 },
   
  ]

  const milestones = [
    { year: '2026', title: 'Concept & Research', desc: 'Identified the gap in chairside prosthodontic cost estimation and began clinical research.' },
    { year: '2026', title: 'iOS App Launch', desc: 'Released ProstoCalc for iOS with CoreML-powered estimation and 7+ treatment categories.' },
    { year: '2026', title: 'Web Platform', desc: 'Expanding to web with real-time clinical decision support and multi-platform coverage.' },
  ]

  const values = [
    { icon: <Target className="w-5 h-5" />, title: 'Clinical Accuracy', desc: 'Every estimation is validated against evidence-based prosthodontic protocols.' },
    { icon: <ShieldCheck className="w-5 h-5" />, title: 'Data Security', desc: 'AES-256 encryption and HIPAA-aligned data handling for patient privacy.' },
    { icon: <Users className="w-5 h-5" />, title: 'Clinician-First Design', desc: 'Built by clinicians for clinicians — every feature serves chairside workflows.' },
    { icon: <Zap className="w-5 h-5" />, title: 'Instant Results', desc: 'Sub-3-second estimation times for any prosthodontic treatment complexity.' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="relative bg-white selection:bg-blue-100">

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-24 bg-slate-50/50">
        <div className="absolute inset-0 w-full h-full bg-grid-slate-100 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <motion.div {...fadeUp} className="space-y-4 sm:space-y-6">
              <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-sm px-3 py-1.5 text-[9px] sm:text-[10px] font-black tracking-[0.15em] uppercase gap-2" style={{ color: C.darkBlue }}>
                <span className="w-2 h-2 bg-cyan-400 rounded-md animate-pulse" />
                About ProstoCalc
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight" style={{ color: C.darkBlue }}>
                Reimagining<br />
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Prosthodontic</span><br />
                Pricing.
              </h1>
              <p className="text-sm sm:text-base lg:text-lg max-w-lg leading-relaxed font-medium text-slate-500">
                We're building the definitive chairside calculator for prosthodontic clinical decision support — developed by clinicians, powered by intelligent automation.
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black rounded-md sm:rounded-md shadow-xl shadow-blue-600/20 px-6 sm:px-8 py-5 sm:py-6 text-sm">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="relative">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-md sm:rounded-md lg:rounded-md overflow-hidden shadow-xl border border-slate-100 aspect-[3/4]">
                  <img src={imgBanner1} className="w-full h-full object-cover" alt="Dental Care" />
                </div>
                <div className="rounded-md sm:rounded-md lg:rounded-md overflow-hidden shadow-xl border border-slate-100 aspect-[3/4] mt-6 sm:mt-8 lg:mt-12">
                  <img src={imgBanner2} className="w-full h-full object-cover" alt="Patient Care" />
                </div>
              </div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-3 sm:py-4 bg-white rounded-md sm:rounded-md shadow-xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-md flex items-center justify-center"><Stethoscope className="w-5 h-5 text-white" /></div>
                <div>
                  <p className="text-xs sm:text-sm font-black" style={{ color: C.darkBlue }}>Clinical Platform</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400">Since 2024</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ MISSION ═══ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
        <div className="absolute inset-x-0 top-0 h-full w-screen -ml-[calc((100vw-100%)/2)] bg-slate-50/50 -z-10">
          <div className="absolute inset-0 w-full h-full bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </div>
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
          <motion.div {...fadeUp} className="relative">
            <Card className="border-slate-100 shadow-2xl rounded-md sm:rounded-md lg:rounded-md overflow-hidden p-1.5 sm:p-2">
              <div className="aspect-[4/5] sm:aspect-[3/4] rounded-md sm:rounded-md lg:rounded-md overflow-hidden relative">
                <img src={imgAbout} alt="ProstoCalc" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D2659]/80 to-transparent" />
                <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-4 sm:left-6 lg:left-8 text-white">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-black">Our Vision</h3>
                  <p className="text-xs sm:text-sm opacity-70 mt-1">Transparent pricing, better outcomes.</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="space-y-5 sm:space-y-6 lg:space-y-8">
            <div className="space-y-2 sm:space-y-3">
              <p className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase text-blue-600">Our Mission</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight" style={{ color: C.darkBlue }}>
                Eliminating the Guesswork in<br className="hidden md:block" /> Prosthodontic Pricing.
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">
              ProstoCalc was born from a simple observation: prosthodontic pricing is opaque, inconsistent, and time-consuming. We believe every clinician deserves instant, accurate, and transparent cost estimation at the point of care.
            </p>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">
              Our platform combines clinical expertise with AI-driven automation to deliver real-time treatment cost analysis — from single crowns to complex full mouth rehabilitations.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
              {['iOS App', 'Web Platform', 'AI Engine', 'HIPAA Aligned'].map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-3 py-1.5 text-blue-600 border-blue-100 bg-blue-50/50">{tag}</Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ VALUES ═══ */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.darkBlue}, #132F5E)` }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(0,217,242,0.5) 1px, transparent 1px)', backgroundSize: '35px 35px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center space-y-2 sm:space-y-3 mb-10 sm:mb-14 lg:mb-16">
            <p className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase text-cyan-400">Core Principles</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">What Drives Us.</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {values.map((v, i) => (
              <motion.div key={i} {...stagger(i)}>
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all h-full rounded-md sm:rounded-md">
                  <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-cyan-500/20 rounded-md sm:rounded-md flex items-center justify-center text-cyan-400">{v.icon}</div>
                    <h4 className="text-sm sm:text-base font-bold text-white">{v.title}</h4>
                    <p className="text-xs sm:text-sm text-blue-200/60 leading-relaxed">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TIMELINE ═══ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
        <div className="absolute inset-x-0 top-0 h-full w-screen -ml-[calc((100vw-100%)/2)] bg-slate-50/50 -z-10">
          <div className="absolute inset-0 w-full h-full bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </div>
        <motion.div {...fadeUp} className="text-center space-y-2 sm:space-y-3 mb-10 sm:mb-14 lg:mb-16">
          <p className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase text-blue-600">Our Journey</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight" style={{ color: C.darkBlue }}>From Concept to Platform.</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {milestones.map((m, i) => (
            <motion.div key={i} {...stagger(i)} whileHover={{ y: -5 }}>
              <Card className="border-slate-100 shadow-md hover:shadow-xl rounded-md sm:rounded-md h-full transition-all group">
                <CardContent className="p-5 sm:p-6 lg:p-8 space-y-3 sm:space-y-4">
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-black text-xs sm:text-sm px-3 py-1">{m.year}</Badge>
                  <h3 className="text-base sm:text-lg lg:text-xl font-black tracking-tight" style={{ color: C.darkBlue }}>{m.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{m.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ TEAM ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <motion.div {...fadeUp} className="text-center space-y-2 sm:space-y-3 mb-10 sm:mb-14 lg:mb-16">
          <p className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase text-blue-600">The Team</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight" style={{ color: C.darkBlue }}>Meet the <span className="text-blue-600">Minds</span> Behind It.</h2>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {team.map((t, i) => (
            <motion.div key={i} {...stagger(i)} whileHover={{ y: -6 }} className="text-center group">
              <Card className="border-slate-100 shadow-md hover:shadow-xl rounded-md sm:rounded-md overflow-hidden transition-all">
                <div className="aspect-[3/4] overflow-hidden relative bg-slate-100">
                  <img src={t.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={t.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D2659]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardContent className="p-3 sm:p-4 lg:p-5">
                  <h4 className="text-xs sm:text-sm lg:text-base font-black tracking-tight" style={{ color: C.darkBlue }}>{t.name}</h4>
                  <p className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{t.role}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <motion.div {...fadeUp}>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 overflow-hidden rounded-md sm:rounded-md lg:rounded-md shadow-2xl">
            <CardContent className="p-6 sm:p-10 lg:p-16 text-center space-y-4 sm:space-y-6 relative">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">Ready to Automate Your<br /><span className="text-cyan-300">Clinical Pricing?</span></h2>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg font-medium mt-3 sm:mt-4 leading-relaxed">Join thousands of clinicians who trust ProstoCalc for instant, accurate prosthodontic cost estimation.</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 sm:mt-8">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 font-black rounded-md sm:rounded-md shadow-xl px-6 sm:px-8 py-5 sm:py-6 text-sm">Start Free Estimation</Button>
                  <Button variant="outline" className="bg-blue-500/20 text-white border-white/20 hover:bg-white/10 font-bold rounded-md sm:rounded-md px-6 sm:px-8 py-5 sm:py-6 text-sm">Download iOS App</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-slate-100" style={{ background: 'linear-gradient(180deg, #FAFCFF, #F0F5FF)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2 sm:col-span-1 space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-black" style={{ color: C.darkBlue }}>ProstoCalc</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Chairside prosthodontic calculator for clinical decision support.</p>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-[10px] sm:text-xs font-black tracking-widest uppercase" style={{ color: C.darkBlue }}>Quick Links</h4>
              {['Home', 'About', 'Services'].map(l => <a key={l} href="#" className="block text-xs sm:text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">{l}</a>)}
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-[10px] sm:text-xs font-black tracking-widest uppercase" style={{ color: C.darkBlue }}>Platform</h4>
              {['Cost Estimator', 'Treatment Plans', 'AI Reports'].map(l => <a key={l} href="#" className="block text-xs sm:text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">{l}</a>)}
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-[10px] sm:text-xs font-black tracking-widest uppercase" style={{ color: C.darkBlue }}>Contact</h4>
              <div className="flex items-center gap-2 sm:gap-3"><img src={imgFooterCall} className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" alt="" /><span className="text-xs sm:text-sm text-slate-500">+91 98765 43210</span></div>
              <div className="flex items-center gap-2 sm:gap-3"><img src={imgFooterLocation} className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" alt="" /><span className="text-xs sm:text-sm text-slate-500">Chennai, India</span></div>
              <div className="flex items-center gap-2 sm:gap-3"><img src={imgFooterTime} className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" alt="" /><span className="text-xs sm:text-sm text-slate-500">Mon - Sun: 9AM - 8PM</span></div>
            </div>
          </div>
          <Separator className="mb-6 sm:mb-8" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-slate-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-md bg-cyan-400 animate-pulse" /> CLINICAL v3.2</span>
            <p className="text-[9px] sm:text-[10px] font-bold tracking-tighter text-slate-400">&copy; 2026 PROSTOCALC. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </motion.div>
  )
}

export default AboutPage
