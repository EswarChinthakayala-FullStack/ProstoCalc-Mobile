import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Search, ChevronRight, Book, 
  Settings, Cpu, Cloud, Smartphone, 
  ShieldCheck, AlertTriangle, Menu, X, ArrowLeft,
  Sun, Moon, Hash, List, Anchor
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { docsManifest, getDocContent } from '../data/docsData';
import { Button } from '../components/ui/button';
import { useTheme } from '../context/ThemeContext';

const DocsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeDocId, setActiveDocId] = useState(searchParams.get('id') || 'overview');
  const [docContent, setDocContent] = useState('Loading documentation...');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toc, setToc] = useState([]);

  // Update URL search param when active doc changes
  useEffect(() => {
    const id = searchParams.get('id') || 'overview';
    setActiveDocId(id);
  }, [searchParams]);

  // Load documentation content
  useEffect(() => {
    const loadDoc = async () => {
      setIsLoading(true);
      const content = await getDocContent(activeDocId);
      setDocContent(content);
      
      // Parse TOC (simple ## headings)
      const headingLines = content.split('\n').filter(line => line.startsWith('## '));
      const parsedToc = headingLines.map(line => {
        const text = line.replace('## ', '').trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return { text, id };
      });
      setToc(parsedToc);
      
      setIsLoading(false);
      // On mobile, close sidebar when selecting content
      setIsSidebarOpen(false);
      window.scrollTo(0, 0);
    };
    loadDoc();
  }, [activeDocId]);

  const filteredDocs = useMemo(() => {
    if (!searchTerm) return docsManifest;
    return docsManifest.filter(d => 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const categories = useMemo(() => {
    const cats = [...new Set(docsManifest.map(d => d.category))];
    return cats;
  }, []);

  const getIconForCategory = (cat) => {
    switch (cat) {
      case 'Intelligence': return <Cpu className="w-4 h-4" />;
      case 'Architecture': return <Cloud className="w-4 h-4" />;
      case 'Governance': return <ShieldCheck className="w-4 h-4" />;
      default: return <Book className="w-4 h-4" />;
    }
  };

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white dark' : 'bg-slate-50 text-slate-900'}`}>
      {/* ═ HEADER ═ */}
      <header className="sticky top-0 z-[60] bg-white/80 dark:bg-black/90 backdrop-blur-2xl border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Book className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-[#0D2659] dark:text-white tracking-tight">Prosto<span className="text-blue-600">Docs</span></h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1">Technical Intelligence hub</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1 hidden sm:block" />
            <Link to="/">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 font-mono">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full relative">
        {/* ═ SIDEBAR (LEFT) ═ */}
        <aside className={`
          fixed lg:sticky top-16 lg:top-20 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] 
          w-72 sm:w-80 bg-white dark:bg-[#050505] border-r border-slate-200 dark:border-zinc-800 
          z-50 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full flex flex-col p-4 sm:p-6 pb-20 lg:pb-6 overflow-y-auto custom-scrollbar">
            {/* Search */}
            <div className="relative mb-8 text-slate-400 focus-within:text-blue-500 transition-colors">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find technical guides..." 
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-zinc-200"
              />
            </div>

            {/* Navigation Groups */}
            <div className="space-y-8">
              {categories.map(cat => (
                <div key={cat}>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-2">
                    {getIconForCategory(cat)}
                    {cat}
                  </h3>
                  <div className="space-y-1 px-1">
                    {filteredDocs.filter(d => d.category === cat).map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => navigate(`/docs?id=${doc.id}`)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-bold transition-all group
                          ${activeDocId === doc.id 
                            ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 shadow-sm shadow-blue-500/5' 
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-white border border-transparent'}
                        `}
                      >
                        <span className="truncate">{doc.title}</span>
                        {activeDocId === doc.id && (
                          <motion.div layoutId="activeDocIndicator">
                            <ChevronRight className="w-4 h-4 shrink-0 text-blue-500" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ═ MAIN CONTENT (CENTER) ═ */}
        <main className="flex-1 w-full min-h-0 bg-white dark:bg-black p-4 sm:p-8 lg:p-12 xl:p-16 relative overflow-x-hidden border-r border-slate-50 dark:border-zinc-900">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[grid_#e2e8f0_24px_24px] dark:bg-[grid_#18181b_40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_20%,transparent_100%)] opacity-20 pointer-events-none" />

          <div className="relative max-w-3xl mx-auto xl:mx-0">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 px-4 text-center"
                >
                  <div className="w-12 h-12 border-4 border-blue-100 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Compiling Intelligence...</p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeDocId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-none"
                  data-color-mode={theme === 'dark' ? 'dark' : 'light'}
                >
                  <div className="wmde-markdown-var">
                    <MDEditor.Markdown 
                      source={docContent} 
                      style={{ 
                        backgroundColor: 'transparent',
                        color: theme === 'dark' ? '#d4d4d8' : '#334155',
                        fontSize: '15px'
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Pagination */}
            {!isLoading && (
              <div className="mt-20 pt-10 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  &copy; 2026 ProstoCalc Technical Intelligence Hub
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[9px] font-mono border-slate-100 dark:border-zinc-800 text-slate-400 uppercase">REV: 03.31.2026</Badge>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-mono uppercase">Status: Official</Badge>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ═ TABLE OF CONTENTS (RIGHT) ═ */}
        <aside className="hidden xl:block w-72 sticky top-20 h-[calc(100vh-5rem)] p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-black">
          {toc.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <List className="w-3.5 h-3.5 text-blue-500" />
                In this page
              </h3>
              <nav className="space-y-3">
                {toc.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToHeading(item.id)}
                    className="block w-full text-left text-[11px] font-bold text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-relaxed px-2 border-l-2 border-transparent hover:border-blue-500/30"
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
              <div className="pt-8 border-t border-slate-50 dark:border-zinc-900 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black tracking-widest text-emerald-600/70 uppercase">Engine v5.0 Live</span>
                </div>
                <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 leading-relaxed italic">
                  This document describes the ProstoCalc Clinical Cost Intelligence Engine architecture.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ═ MOBILE SIDEBAR OVERLAY ═ */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
        />
      )}
    </div>
  );
};

// Simple Badge component if not available
const Badge = ({ children, className = '', variant = 'primary' }) => {
  const styles = {
    primary: 'bg-blue-600 text-white',
    outline: 'border border-slate-200 bg-transparent',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${styles[variant] || ''} ${className}`}>
      {children}
    </span>
  );
};


export default DocsPage;
