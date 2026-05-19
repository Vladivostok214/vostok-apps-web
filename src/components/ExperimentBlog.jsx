import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Terminal, Activity, BookOpen, ExternalLink, Clock,
  Calendar, User, Edit3
} from 'lucide-react';
import { BLOG_POSTS } from '../lib/blog-posts';
import VostokAdmin from './VostokAdmin';

const CodeBlock = ({ code, language = "javascript" }) => (
  <div className="relative group my-8">
    <div className="absolute -inset-2 bg-gradient-to-r from-[#39FF14]/10 to-cyan-500/10 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
    <div className="relative bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{language}</span>
      </div>
      <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
        {code}
      </pre>
    </div>
  </div>
);

const Bibliography = ({ links }) => (
  <div className="mt-20 pt-10 border-t border-white/5">
    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
      <BookOpen className="w-3 h-3" /> Fuentes y Lectura Recomendada
    </h4>
    <div className="grid gap-3">
      {links?.map((link, i) => (
        <a 
          key={i} href={link.url} target="_blank" rel="noopener noreferrer"
          className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-all"
        >
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white group-hover:text-[#39FF14] transition-colors">{link.title}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">{link.source}</span>
          </div>
          <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-[#39FF14]" />
        </a>
      ))}
    </div>
  </div>
);

export default function ExperimentBlog({ onBack }) {
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [posts, setPosts] = useState(BLOG_POSTS);
  const [showAdmin, setShowAdmin] = useState(false);
  const mainContentRef = useRef(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  useEffect(() => {
    if (mainContentRef.current) mainContentRef.current.scrollTo(0, 0);
  }, [selectedPostId]);

  const handleAdminTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      setShowAdmin(true);
      tapCountRef.current = 0;
    } else {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 1500);
    }
  };

  const selectedPost = posts.find(p => p.id === selectedPostId);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#010101] z-[200] flex flex-col overflow-hidden font-sans text-white"
    >
      <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-30 z-10" />
      
      <header className="w-full pt-[max(1.5rem,env(safe-area-inset-top))] px-6 sm:px-12 pb-6 border-b border-white/5 bg-black/80 backdrop-blur-xl z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={selectedPostId ? () => setSelectedPostId(null) : onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div onClick={handleAdminTap} className="cursor-pointer select-none">
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-[#39FF14]">Vostok_Log_System</h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{selectedPostId ? "Reading_Entry" : "Entry_Index"}</p>
          </div>
        </div>
      </header>

      <main ref={mainContentRef} className="flex-1 overflow-y-auto custom-scrollbar z-10 scroll-smooth">
        <AnimatePresence mode="wait">
          {!selectedPostId ? (
            <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto px-6 py-20 sm:px-12">
              <div className="mb-16">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-4">Vostok <span className="text-[#39FF14]">Blog</span></h2>
                <p className="text-slate-500 font-mono text-xs tracking-widest uppercase italic">"Traducir la complejidad a la experiencia."</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-20">
                {posts.map((post) => {
                  const Icon = post.icon;
                  return (
                    <motion.button key={post.id} whileHover={{ y: -5 }} onClick={() => setSelectedPostId(post.id)} className="text-left bg-[#080808] border border-white/5 rounded-[2rem] p-8 flex flex-col group relative overflow-hidden transition-all hover:border-[#39FF14]/20">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Icon className="w-24 h-24" style={{ color: post.color }} /></div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#39FF14]/30"><Icon className="w-5 h-5" style={{ color: post.color }} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{post.category}</span>
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 group-hover:text-[#39FF14] transition-colors leading-tight">{post.title}</h3>
                      <p className="text-slate-500 text-sm mb-8 line-clamp-3 font-medium uppercase leading-relaxed">{post.excerpt}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.article key="post" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="max-w-4xl mx-auto px-6 py-16 sm:px-12 pb-32">
                <div className="mb-20">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[9px] font-black uppercase tracking-[0.3em] mb-8">
                    <selectedPost.icon className="w-3 h-3" /> {selectedPost.category}
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-8">{selectedPost.title}</h2>
                  <div className="flex flex-wrap gap-8 text-slate-500">
                    <div className="flex items-center gap-3"><User className="w-4 h-4 text-[#39FF14]" /><div className="flex flex-col"><span className="text-[8px] font-black uppercase tracking-widest text-slate-700">Autor</span><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{selectedPost.author}</span></div></div>
                    <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-[#39FF14]" /><div className="flex flex-col"><span className="text-[8px] font-black uppercase tracking-widest text-slate-700">Publicado</span><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{selectedPost.date}</span></div></div>
                  </div>
                </div>
                
                <div className="space-y-12 text-slate-400 leading-relaxed text-lg">
                  {selectedPost.content.map((block, i) => {
                    if (block.type === 'h3') return <h3 key={i} className="text-xl font-black text-white uppercase tracking-wider">{block.text}</h3>;
                    if (block.type === 'p') return <p key={i}>{block.text}</p>;
                    if (block.type === 'code') return <CodeBlock key={i} code={block.text} language={block.language} />;
                    return null;
                  })}
                </div>

                <Bibliography links={selectedPost.links} />

                <div className="mt-20 pt-10 border-t border-white/10 flex flex-col items-center">
                    <button onClick={() => setSelectedPostId(null)} className="px-10 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"><ArrowLeft className="w-4 h-4" />Volver al Índice</button>
                </div>
            </motion.article>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showAdmin && <VostokAdmin posts={posts} onClose={() => setShowAdmin(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
