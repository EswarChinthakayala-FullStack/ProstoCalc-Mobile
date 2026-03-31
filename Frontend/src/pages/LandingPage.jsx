import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, Brain, ChevronRight, Sparkles, Calculator,
  ArrowRight, Star, CheckCircle2, ChevronLeft,
  Phone, MapPin, Stethoscope, Award, TrendingUp, Zap
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useTheme } from '../context/ThemeContext'

import imgBanner from '../assets/banner/1.png'
import imgAbout from '../assets/about/priority.png'
import imgExpert from '../assets/expert.png'
import imgEmergency from '../assets/emergency.png'
import imgService1 from '../assets/service/1.png'
import imgService2 from '../assets/service/2.png'
import imgService3 from '../assets/service/3.png'
import imgService4 from '../assets/service/4.png'
import imgSymptom1 from '../assets/symptoms/1.png'
import imgSymptom2 from '../assets/symptoms/2.png'
import imgSymptom3 from '../assets/symptoms/3.png'
import imgSymptom4 from '../assets/symptoms/4.png'
import imgBlog1 from '../assets/blogs/1.png'
import imgBlog2 from '../assets/blogs/2.png'
import imgBlog3 from '../assets/blogs/3.png'
import imgTestimonial1 from '../assets/testimonial/1.png'
import imgTestimonial2 from '../assets/testimonial/2.png'
import imgTestimonial3 from '../assets/testimonial/3.png'
import imgDiagnostic from '../assets/servicePage/1.png'
import imgGallery1 from '../assets/servicePage/gallery/1.png'
import imgGallery2 from '../assets/servicePage/gallery/2.png'
import imgGallery3 from '../assets/servicePage/gallery/3.png'
import imgGallery4 from '../assets/servicePage/gallery/4.png'
import imgGallery5 from '../assets/servicePage/gallery/5.png'
import imgGallery6 from '../assets/servicePage/gallery/6.png'
import imgFooterCall from '../assets/footer/calling.png'
import imgFooterLocation from '../assets/footer/location.png'
import imgFooterTime from '../assets/footer/time.png'

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.6, ease: 'easeOut' } }
const stagger = (i) => ({ ...fadeUp, transition: { ...fadeUp.transition, delay: i * 0.08 } })

/* ── Section Heading Component ── */
const SectionHead = ({ tag, title, subtitle, center = false, light = false }) => (
  <motion.div {...fadeUp} className={`space-y-2 sm:space-y-3 ${center ? 'text-center' : ''}`}>
    {tag && <p className={`text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase ${light ? 'text-cyan-400' : 'text-blue-600'}`}>{tag}</p>}
    <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${light ? 'text-white' : 'text-[#0D2659] dark:text-white'}`}>{title}</h2>
    {subtitle && <p className={`text-sm sm:text-base lg:text-lg max-w-2xl font-medium leading-relaxed ${center ? 'mx-auto' : ''} ${light ? 'text-blue-200/80' : 'text-slate-500 dark:text-slate-400'}`}>{subtitle}</p>}
  </motion.div>
)

const LandingPage = () => {


  const services = [
    { title: 'Removable Prosthetics', sub: 'CD & RPD Automation', desc: 'Automated calculations for complete and partial dentures with real-time pricing accuracy.', img: imgService3, accent: 'from-blue-400 to-blue-600' },
    { title: 'Implant Prosthodontics', sub: 'Surgical & Prosthetic Sync', desc: 'Integration of surgical phases and prosthetic timelines with intelligent cost scaling.', img: imgService1, accent: 'from-cyan-400 to-blue-500' },
    { title: 'Fixed Restorations', sub: 'Crown & Bridge Architecture', desc: 'High-precision estimation for fixed restorations, managing material grades and pricing.', img: imgService2, accent: 'from-indigo-400 to-blue-600' },
    { title: 'Full Mouth Rehabilitation', sub: 'Complex FMR Planning', desc: 'Multi-stage financial roadmaps for complex full-mouth reconstruction cases.', img: imgService4, accent: 'from-slate-400 to-slate-600' },
  ]

  const features = [
    { icon: <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />, title: 'AI Cost Estimator', desc: 'Instant prosthodontic cost estimation powered by clinical intelligence.', tag: 'Core Engine' },
    { icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />, title: 'Clinical Decision Support', desc: 'Evidence-based treatment path recommendations for chairside decisions.', tag: 'Intelligence' },
    { icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />, title: 'Treatment Analytics', desc: 'Comprehensive outcome tracking and predictive treatment analytics.', tag: 'Analytics' },
  ]

  const stats = [
    { value: '99.8%', label: 'Estimation Accuracy' },
    { value: '7+', label: 'Treatment Categories' },
    { value: '50K+', label: 'Calculations' },
    { value: '24/7', label: 'Clinical Support' },
  ]

  const testimonials = [
    { name: 'Dr. Sarah Johnson', role: 'Prosthodontist', img: imgTestimonial1, text: 'ProstoCalc reduced my chairside estimation time by 80%. The pricing accuracy is unprecedented.' },
    { name: 'Dr. Michael Reed', role: 'Implantologist', img: imgTestimonial2, text: 'Clinical decision support helped me plan complex FMR cases with confidence and transparency.' },
    { name: 'Dr. Elena Kowalski', role: 'General Dentist', img: imgTestimonial3, text: 'Finally, a tool that automates the most tedious part of prosthodontic practice — pricing.' },
  ]

  const gallery = [...[imgGallery1, imgGallery2, imgGallery3, imgGallery4, imgGallery5, imgGallery6], ...[imgGallery1, imgGallery2, imgGallery3, imgGallery4, imgGallery5, imgGallery6]]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="relative bg-white dark:bg-slate-950 selection:bg-blue-100 dark:selection:bg-blue-900">

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[85vh] sm:min-h-screen flex items-center overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        <div className="absolute inset-0 w-full h-full bg-grid-slate-100 dark:opacity-5 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 dark:from-blue-950/30 via-transparent to-transparent opacity-60" />

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-20 grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center relative z-10">
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            <motion.div {...fadeUp} className="space-y-4 sm:space-y-6">
              <Badge variant="outline" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-blue-100 dark:border-blue-800 shadow-sm px-3 py-1.5 text-[9px] sm:text-[10px] font-black tracking-[0.15em] uppercase gap-2 text-[#0D2659] dark:text-blue-300">
                <span className="w-2 h-2 bg-cyan-400 rounded-md animate-pulse" />
                Chairside Clinical Support
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-[#0D2659] dark:text-white">
                Clinical<br />
                <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-500 bg-clip-text text-transparent">Prosthodontic</span><br />
                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl flex items-center gap-3">
                  Calculus. <Sparkles className="w-8 h-8 text-yellow-500" />
                </span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg max-w-lg leading-relaxed font-medium text-[#0D2659]/55 dark:text-slate-400">
                A chairside prosthodontic calculator for clinical decision support, outcome-based pricing, and treatment architecture automation.
              </p>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black rounded-md sm:rounded-md shadow-xl shadow-blue-600/20 px-6 sm:px-8 py-5 sm:py-6 text-sm w-full sm:w-auto">
                  Begin Estimation <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" className="font-bold rounded-md sm:rounded-md px-6 sm:px-8 py-5 sm:py-6 text-sm border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 dark:text-white w-full sm:w-auto">
                  <Phone className="w-4 h-4 text-blue-500 mr-1" /> Contact Us
                </Button>
              </Link>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="flex gap-6 sm:gap-8 pt-2 sm:pt-4">
              {[{ v: '99.8%', l: 'Accuracy' }, { v: '7+', l: 'Treatments' }, { v: '<3s', l: 'Estimate' }].map((s, i) => (
                <div key={i}>
                  <p className="text-xl sm:text-2xl font-black text-[#0D2659] dark:text-white">{s.v}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-400 uppercase">{s.l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative flex justify-center lg:justify-end">
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-[8%] left-[2%] sm:left-[5%] z-20 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md sm:rounded-md flex items-center justify-center shadow-xl rotate-[-12deg]">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-[12%] right-[2%] sm:right-[5%] z-20 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-md sm:rounded-md shadow-xl border border-slate-100 dark:border-slate-700">
              <p className="text-[9px] sm:text-[10px] font-black text-cyan-500 tracking-widest">24H DENTAL</p>
              <p className="text-xs sm:text-sm font-black text-[#0D2659] dark:text-white">+91 98765 43210</p>
            </motion.div>
            <div className="relative z-10 w-[75%] sm:w-[80%] lg:w-full max-w-md">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 dark:from-blue-600/20 to-cyan-200/40 dark:to-cyan-600/20 rounded-md blur-3xl scale-110" />
              <img src={imgBanner} alt="Confident Smile" className="relative z-10 w-full object-contain drop-shadow-2xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
        <div className="absolute inset-x-0 top-0 h-full w-screen -ml-[calc((100vw-100%)/2)] bg-slate-50/50 dark:bg-slate-900/50 -z-10">
          <div className="absolute inset-0 w-full h-full bg-grid-slate-100 dark:opacity-5 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </div>
        <SectionHead center tag="Clinical Specializations" title={<>Prosthodontic <span className="text-blue-600">Precision</span> Care.</>} subtitle="From removable prosthetics to full mouth rehabilitations — ProstoCalc automates every clinical pricing dimension." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-10 sm:mt-14 lg:mt-20">
          {services.map((s, i) => (
            <motion.div key={i} {...stagger(i)} whileHover={{ y: -8 }}>
              <Card className="border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-black/20 hover:shadow-xl overflow-hidden rounded-md sm:rounded-md h-full transition-all dark:bg-slate-900">
                <CardContent className="p-5 sm:p-6 lg:p-8 flex flex-col items-center text-center h-full">
                  <div className={`w-full aspect-[4/3] sm:aspect-square bg-gradient-to-br ${s.accent} rounded-md sm:rounded-md lg:rounded-md mb-5 sm:mb-6 lg:mb-8 flex items-center justify-center relative overflow-hidden opacity-90`}>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/90 rounded-md sm:rounded-md lg:rounded-md shadow-sm flex items-center justify-center z-10">
                      <img src={s.img} className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 object-contain" alt="" />
                    </div>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                  </div>
                  <h4 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-[#0D2659] dark:text-white">{s.title}</h4>
                  <p className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{s.sub}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-medium mt-2 sm:mt-3">{s.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ EXPERT / CLINICAL INTELLIGENCE ═══ */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D2659, #132F5E)' }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(0,217,242,0.5) 1px, transparent 1px)', backgroundSize: '35px 35px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">
            <motion.div {...fadeUp} className="space-y-6 sm:space-y-8 lg:space-y-10">
              <SectionHead light tag="Why ProstoCalc" title={<>Powered by <span className="text-cyan-400">Clinical</span> Intelligence.</>} subtitle="AI-driven cost estimation combined with evidence-based clinical protocols for chairside decision support." />
              <div className="grid gap-3 sm:gap-4">
                {[{ t: 'Pricing Automation Engine', d: 'Automate complex prosthodontic billing with real-time precision.' }, { t: 'Clinical Decision Matrix', d: 'Chairside verification of treatment paths and outcome predictions.' }].map((item, i) => (
                  <motion.div key={i} {...stagger(i)} className="flex gap-3 sm:gap-4 p-4 sm:p-5 lg:p-6 rounded-md sm:rounded-md bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-cyan-500/20 rounded-md sm:rounded-md flex items-center justify-center text-cyan-400 flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                    <div><h4 className="font-bold text-white text-sm sm:text-base lg:text-lg">{item.t}</h4><p className="text-blue-300/60 text-xs sm:text-sm mt-1">{item.d}</p></div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="relative">
              <div className="rounded-md sm:rounded-md lg:rounded-[4rem] overflow-hidden border-2 sm:border-4 border-white/10 shadow-2xl aspect-[4/5] sm:aspect-square bg-slate-800">
                <img src={imgExpert} className="w-full h-full object-cover opacity-80" alt="Expert Care" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0D2659]/60 to-transparent" />
              </div>
              <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-4 sm:-bottom-6 -left-2 sm:-left-6 p-4 sm:p-5 bg-white/10 backdrop-blur-xl rounded-md sm:rounded-md border border-white/20 text-white max-w-[180px] sm:max-w-[200px] shadow-2xl">
                <div className="flex gap-2 sm:gap-3 items-center mb-2">
                  <div className="p-2 bg-cyan-500 rounded-md sm:rounded-md"><Award className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div><p className="text-lg sm:text-xl font-black">99.8%</p><p className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest opacity-60">Accuracy</p></div>
                </div>
                <p className="text-[10px] sm:text-xs font-medium opacity-70 hidden sm:block">Clinical estimation excellence across all categories.</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ DIAGNOSTICS ═══ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
        <div className="absolute inset-x-0 top-0 h-full w-screen -ml-[calc((100vw-100%)/2)] bg-slate-50/50 dark:bg-slate-900/50 -z-10">
          <div className="absolute inset-0 w-full h-full bg-grid-slate-100 dark:opacity-5 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </div>
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <motion.div {...fadeUp} className="order-2 lg:order-1 relative">
            <div className="rounded-md sm:rounded-md lg:rounded-md overflow-hidden shadow-2xl border border-slate-100">
              <img src={imgDiagnostic} alt="Clinical Diagnostics" className="w-full h-auto object-cover" />
            </div>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="order-1 lg:order-2 space-y-5 sm:space-y-6 lg:space-y-8">
            <SectionHead tag="Advanced Technology" title={<>Clinical Decision<br className="hidden sm:block" />Support System.</>} subtitle="Automate the architectural pricing of your clinical rehabilitations with real-time chairside intelligence." />
            <ul className="space-y-2.5 sm:space-y-3">
              {['Automated Cost Estimation', 'Treatment Complexity Analysis', 'Material Grade Optimization', 'Multi-Stage Financial Planning'].map((item, i) => (
                <motion.li key={i} {...stagger(i)} className="flex items-center gap-2.5 sm:gap-3 font-bold text-sm sm:text-base text-[#0D2659] dark:text-white">
                  <div className="w-2 h-2 rounded-md bg-cyan-400 flex-shrink-0" />{item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ═══ GALLERY (Carousel) ═══ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <div className="absolute inset-x-0 top-0 h-full w-screen -ml-[calc((100vw-100%)/2)] bg-slate-50/50 -z-10">
          <div className="absolute inset-0 w-full h-full bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-8 mb-8 sm:mb-12">
          <SectionHead tag="Clinical Portfolio" title={<>Treatment <span className="text-blue-600">Gallery.</span></>} />
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {gallery.map((img, i) => (
              <CarouselItem key={i} className="pl-2 md:pl-4 sm:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <motion.div whileHover={{ y: -5 }} className="rounded-md sm:rounded-md lg:rounded-md overflow-hidden bg-slate-100 relative group cursor-pointer aspect-[4/3] sm:aspect-[16/10]">
                    <img src={img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Case ${i + 1}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 text-white opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-cyan-300 mb-0.5">Clinical Case</p>
                      <h4 className="text-sm sm:text-lg font-bold">Precision Case 0{i + 1}</h4>
                    </div>
                  </motion.div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-end gap-2 mt-8">
            <CarouselPrevious className="static translate-y-0 translate-x-0" />
            <CarouselNext className="static translate-y-0 translate-x-0 bg-blue-600 hover:bg-blue-700 text-white border-0" />
          </div>
        </Carousel>
      </section>

      {/* ═══ SYMPTOMS ═══ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <div className="absolute inset-x-0 top-0 h-full w-screen -ml-[calc((100vw-100%)/2)] bg-slate-50/50 -z-10">
          <div className="absolute inset-0 w-full h-full bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-14 lg:mb-16">
          <SectionHead tag="Clinical Indicators" title={<>Identify Your <span className="text-blue-600">Symptoms.</span></>} />
          <p className="text-slate-500 max-w-sm text-sm sm:text-base font-medium">Early detection through clinical pattern recognition and chairside analysis.</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {[{ n: 'Structural Pain', img: imgSymptom1 }, { n: 'Sensitivity', img: imgSymptom2 }, { n: 'Gingival Issues', img: imgSymptom3 }, { n: 'Alignment Drift', img: imgSymptom4 }, { n: 'Neural Impact', img: imgSymptom1 }].map((s, i) => (
            <motion.div key={i} {...stagger(i)} whileHover={{ scale: 1.05 }} className="group cursor-pointer text-center space-y-2 sm:space-y-3">
              <div className="aspect-square bg-white dark:bg-slate-800 rounded-md p-4 sm:p-5 lg:p-6 shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center group-hover:border-blue-200 transition-colors relative overflow-hidden">
                <img src={s.img} className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain z-10 opacity-70 group-hover:opacity-100 transition-opacity" alt={s.n} />
                <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 opacity-0 group-hover:opacity-50 transition-opacity" />
              </div>
              <p className="font-bold text-xs sm:text-sm tracking-tight text-[#0D2659] dark:text-white">{s.n}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ EMERGENCY ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <motion.div {...fadeUp}>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 overflow-hidden rounded-md sm:rounded-md lg:rounded-md shadow-2xl">
            <CardContent className="p-0">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative grid lg:grid-cols-2 items-center">
                <div className="p-6 sm:p-10 lg:p-16 space-y-4 sm:space-y-5 lg:space-y-6">
                  <Badge className="bg-white/10 border-white/20 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest gap-2 px-3 py-1.5">
                    <span className="w-2 h-2 bg-red-400 rounded-md animate-pulse" /> Immediate Response
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">24/7 Clinical<br /><span className="text-cyan-300">Emergency</span> Hub.</h2>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg font-medium leading-relaxed max-w-md">Dental trauma? Our system prioritizes urgent care for immediate clinical stabilization.</p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-1 sm:pt-2">
                    <Button className="bg-white text-blue-600 hover:bg-blue-50 font-black rounded-md sm:rounded-md shadow-xl px-6 py-5 text-sm">ACTIVATE EMERGENCY</Button>
                    <Button variant="outline" className="bg-blue-500/20 text-white border-white/20 hover:bg-white/10 font-bold rounded-md sm:rounded-md px-6 py-5 text-sm">VIEW PROTOCOLS</Button>
                  </div>
                </div>
                <div className="hidden lg:block relative h-full min-h-[400px]">
                  <img src={imgEmergency} className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-overlay" alt="Emergency" />
                  <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-blue-700 to-transparent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <div className="absolute inset-x-0 top-0 h-full w-screen -ml-[calc((100vw-100%)/2)] bg-slate-50/50 -z-10">
          <div className="absolute inset-0 w-full h-full bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </div>
        <SectionHead center tag="Clinical Feedback" title="Trusted by Professionals." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-10 sm:mt-14 lg:mt-16">
          {testimonials.map((t, i) => (
            <motion.div key={i} {...stagger(i)} whileHover={{ y: -6 }}>
              <Card className="border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-black/20 rounded-md sm:rounded-md h-full transition-all hover:shadow-xl dark:bg-slate-900">
                <CardContent className="p-5 sm:p-6 lg:p-8 space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-md sm:rounded-md overflow-hidden border-2 border-slate-50 dark:border-slate-700 shadow-sm flex-shrink-0"><img src={t.img} className="w-full h-full object-cover" alt={t.name} /></div>
                    <div><h4 className="font-bold text-sm sm:text-base text-[#0D2659] dark:text-white">{t.name}</h4><p className="text-[8px] sm:text-[9px] font-black text-blue-600 uppercase tracking-widest">{t.role}</p></div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed text-xs sm:text-sm">"{t.text}"</p>
                  <div className="flex gap-0.5 text-yellow-400">{[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />)}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 mb-10 sm:mb-14 lg:mb-16">
          <SectionHead title={<>Core Engine <span className="text-blue-600">Modules.</span></>} />
          <p className="text-slate-500 font-medium max-w-sm text-sm sm:text-base">Clinical-grade modules for prosthodontic cost estimation and decision support.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((f, i) => (
            <motion.div key={i} {...stagger(i)} whileHover={{ y: -5 }}>
              <Card className="border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 rounded-md sm:rounded-md h-full transition-all group overflow-hidden dark:bg-slate-900">
                <CardContent className="p-6 sm:p-8 lg:p-10 relative">
                  <div className="absolute top-6 right-6 opacity-[0.03] scale-[2] group-hover:scale-[3] transition-transform duration-700">{f.icon}</div>
                  <Badge variant="outline" className="text-[8px] sm:text-[9px] font-black text-blue-600 uppercase tracking-wider mb-4 sm:mb-6">{f.tag}</Badge>
                  <div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-slate-50 dark:bg-slate-800 rounded-md sm:rounded-md flex items-center justify-center mb-4 sm:mb-5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">{f.icon}</div>
                  <h3 className="text-lg sm:text-xl font-black mb-2 sm:mb-3 tracking-tight text-[#0D2659] dark:text-white">{f.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs sm:text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ ABOUT PREVIEW ═══ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <div className="absolute inset-x-0 top-0 h-full w-screen -ml-[calc((100vw-100%)/2)] bg-slate-50/50 -z-10">
          <div className="absolute inset-0 w-full h-full bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </div>
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">
          <motion.div {...fadeUp} className="relative">
            <Card className="border-slate-100 shadow-2xl rounded-md sm:rounded-md lg:rounded-md overflow-hidden p-1.5 sm:p-2">
              <div className="aspect-[4/5] sm:aspect-[3/4] rounded-md sm:rounded-md lg:rounded-md overflow-hidden relative">
                <img src={imgAbout} alt="ProstoCalc Platform" className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D2659]/80 to-transparent" />
                <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-4 sm:left-6 lg:left-8 right-4 sm:right-8 text-white">
                  <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mb-2 opacity-80" />
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight">Chairside Intelligence</h3>
                  <p className="text-xs sm:text-sm font-medium opacity-70 mt-1">Built for clinicians, by clinicians.</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="space-y-6 sm:space-y-8">
            <SectionHead tag="Our Mission" title={<>Transparent Prosthodontic<br className="hidden sm:block" />Pricing for All.</>} />
            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
              {[
                { icon: <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />, t: 'Chairside Calculus', d: 'Instant cost estimation for complex prosthodontic reconstructions at the point of care.' },
                { icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />, t: 'Pricing Automation', d: 'Eliminate billing ambiguity with intelligent pricing engines for any treatment complexity.' },
                { icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />, t: 'Outcome Predictions', d: 'AI-powered treatment outcome predictions integrated with real-time clinical data.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-white dark:bg-slate-800 rounded-md sm:rounded-md shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">{item.icon}</div>
                  <div><h4 className="text-sm sm:text-base font-black text-[#0D2659] dark:text-white">{item.t}</h4><p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mt-0.5 sm:mt-1">{item.d}</p></div>
                </div>
              ))}
            </div>
            <Button variant="link" className="text-blue-600 font-black text-xs sm:text-sm uppercase tracking-widest p-0 h-auto">
              Learn more <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <Separator />
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 text-center">
            {stats.map((s, i) => (
              <motion.div key={i} {...stagger(i)} className="space-y-1">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-[#0D2659] dark:text-white">{s.value}</p>
                <p className="text-[9px] sm:text-[10px] font-black tracking-widest text-slate-400 uppercase">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <Separator />

      {/* ═══ BLOGS ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 sm:mb-14 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#0D2659] dark:text-white">Clinical Insights.</h2>
          <Button variant="link" className="text-blue-600 font-black text-xs sm:text-sm uppercase tracking-widest p-0 h-auto">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {[{ t: 'AI-Driven Implant Planning', d: 'FEB 14, 2026', img: imgBlog1 }, { t: 'Prosthodontic Pricing Models', d: 'FEB 10, 2026', img: imgBlog2 }, { t: 'Optimizing Treatment Outcomes', d: 'JAN 28, 2026', img: imgBlog3 }].map((b, i) => (
            <motion.div key={i} {...stagger(i)} whileHover={{ y: -5 }} className="group cursor-pointer space-y-3 sm:space-y-4">
              <div className="aspect-[16/10] rounded-md sm:rounded-md overflow-hidden border border-slate-100 shadow-md relative">
                <img src={b.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={b.t} />
              </div>
              <div>
                <p className="text-[8px] sm:text-[9px] font-black text-blue-600 uppercase tracking-widest">{b.d}</p>
                <h4 className="text-sm sm:text-base lg:text-lg font-black tracking-tight mt-1 group-hover:text-blue-600 transition-colors text-[#0D2659] dark:text-white">{b.t}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-slate-100 dark:border-slate-800 bg-gradient-to-b from-[#FAFCFF] to-[#F0F5FF] dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2 sm:col-span-1 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" className="w-8 h-8" alt="Logo" />
                <h3 className="text-lg sm:text-xl font-black text-[#0D2659] dark:text-white">ProstoCalc</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Precision calculus for modern prosthodontics. Automating the architecture of clinical success.</p>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-md bg-cyan-400 animate-pulse" /><span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-slate-400">ENGINE: V3.4_STABLE</span></div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-[#0D2659] dark:text-white">Quick Links</h4>
              {['Home', 'About', 'Services'].map(l => <a key={l} href="#" className="block text-xs sm:text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">{l}</a>)}
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-[#0D2659] dark:text-white">Platform</h4>
              {['Cost Estimator', 'Treatment Plans', 'AI Reports'].map(l => <a key={l} href="#" className="block text-xs sm:text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">{l}</a>)}
              <Link to="/docs" className="block text-xs sm:text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">Documentation</Link>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-[#0D2659] dark:text-white">Contact</h4>
              <div className="flex items-center gap-2 sm:gap-3"><img src={imgFooterCall} className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" alt="" /><span className="text-xs sm:text-sm text-slate-500">+91 98765 43210</span></div>
              <div className="flex items-center gap-2 sm:gap-3"><img src={imgFooterLocation} className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" alt="" /><span className="text-xs sm:text-sm text-slate-500">Chennai, India</span></div>
              <div className="flex items-center gap-2 sm:gap-3"><img src={imgFooterTime} className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" alt="" /><span className="text-xs sm:text-sm text-slate-500">Mon - Sun: 9AM - 8PM</span></div>
            </div>
          </div>
          <Separator className="mb-6 sm:mb-8" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
              <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-slate-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-md bg-cyan-400 animate-pulse" /> NODE: CLINICAL_MAIN</span>
              <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-slate-400 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> AES-256 ENCRYPTED</span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold tracking-tighter text-slate-400">&copy; 2026 PROSTOCALC. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </motion.div>
  )
}

export default LandingPage
