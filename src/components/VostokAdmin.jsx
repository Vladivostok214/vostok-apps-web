import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Trash2, Edit3, Copy, Sparkles, Link, Globe, Type, Trash, ChevronDown } from 'lucide-react';

const AVAILABLE_ICONS = ['Activity', 'Mic', 'Cpu', 'Database', 'Shield', 'Volume2', 'Zap', 'Music', 'Waves', 'Smartphone', 'Terminal'];
const CATEGORIES = ['General', 'Hardware', 'Matemática', 'Memoria', 'Seguridad', 'Acústica', 'Sistemas', 'Investigación'];

export default function VostokAdmin({ posts, onSave, onClose }) {
  const [editingPost, setSelectedPost] = useState(null);
  const [localPosts, setLocalPosts] = useState(posts);
  const [writeMode, setWriteMode] = useState('smart');
  const [rawText, setRawText] = useState('');

  const parseSmartText = (text) => {
    const lines = text.split('\n\n');
    return lines.map(block => {
      const trimmed = block.trim();
      if (trimmed.startsWith('###')) {
        return { type: 'h3', text: trimmed.replace('###', '').trim() };
      }
      if (trimmed.startsWith('```')) {
        return { type: 'code', text: trimmed.replace(/```/g, '').trim(), language: 'javascript' };
      }
      if (trimmed.length < 50 && !trimmed.includes('.') && trimmed.length > 0) {
        return { type: 'h3', text: trimmed };
      }
      return { type: 'p', text: trimmed.replace(/\n/g, ' ') };
    });
  };

  const handleEdit = (post) => {
    setSelectedPost({ 
      ...post, 
      contentStr: JSON.stringify(post.content, null, 2),
      localLinks: [...(post.links || [])]
    });
    
    const initialRaw = post.content.map(b => {
        if (b.type === 'h3') return `### ${b.text}`;
        if (b.type === 'code') return `\`\`\`\n${b.text}\n\`\`\``;
        return b.text;
    }).join('\n\n');
    setRawText(initialRaw);
  };

  const handleAddNew = () => {
    const newPost = {
        id: `post-${Date.now()}`,
        title: "Nueva Investigación",
        date: new Date().toLocaleDateString(),
        category: "Investigación",
        readTime: "5 MIN",
        author: "Vladivostok",
        excerpt: "Descripción breve...",
        iconName: "Activity",
        color: "#39FF14",
        content: [{ type: "p", text: "Inicia aquí..." }],
        links: []
    };
    setLocalPosts([newPost, ...localPosts]);
    handleEdit(newPost);
  };

  const addLinkField = () => {
    setSelectedPost({
        ...editingPost,
        localLinks: [...editingPost.localLinks, { title: '', url: '', source: '' }]
    });
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...editingPost.localLinks];
    newLinks[index][field] = value;
    setSelectedPost({ ...editingPost, localLinks: newLinks });
  };

  const removeLink = (index) => {
    setSelectedPost({
        ...editingPost,
        localLinks: editingPost.localLinks.filter((_, i) => i !== index)
    });
  };

  const handleSavePost = () => {
    try {
        const updatedPost = { 
            ...editingPost, 
            content: writeMode === 'smart' ? parseSmartText(rawText) : JSON.parse(editingPost.contentStr),
            links: editingPost.localLinks.filter(l => l.title && l.url)
        };
        delete updatedPost.contentStr;
        delete updatedPost.localLinks;

        const newPosts = localPosts.map(p => p.id === updatedPost.id ? updatedPost : p);
        setLocalPosts(newPosts);
        setSelectedPost(null);
    } catch (e) {
        alert("Error en el formato JSON. Revisa el contenido.");
    }
  };

  const handleExportSingle = () => {
    try {
        const postToExport = { 
            ...editingPost, 
            content: writeMode === 'smart' ? parseSmartText(rawText) : JSON.parse(editingPost.contentStr),
            links: editingPost.localLinks.filter(l => l.title && l.url)
        };
        delete postToExport.contentStr;
        delete postToExport.localLinks;

        const code = `// --- ACTUALIZACIÓN DE POST INDIVIDUAL ---\nconst updatedPost = ${JSON.stringify(postToExport, null, 2)};`;
        navigator.clipboard.writeText(code);
        alert("Código del post copiado.");
    } catch (e) {
        alert("Error al exportar.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-[#020202]/98 backdrop-blur-3xl p-6 overflow-hidden flex flex-col font-mono text-white"
    >
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 text-[#39FF14]">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-black uppercase tracking-[0.3em]">Vostok_Admin_V3.0 [Structural_Mode]</span>
        </div>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!editingPost ? (
          <div className="grid gap-4 max-w-4xl mx-auto">
            {localPosts.map(post => (
              <div key={post.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center group hover:border-[#39FF14]/40 transition-all shadow-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white uppercase tracking-wider">{post.title}</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mt-1">{post.category} | {post.date}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleEdit(post)} className="p-3 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-[#39FF14]/20 border border-white/5 hover:border-[#39FF14]/30">
                        <Edit3 className="w-4 h-4 text-[#39FF14]" />
                    </button>
                    <button onClick={() => setLocalPosts(localPosts.filter(p => p.id !== post.id))} className="p-3 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-red-500">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
            <button onClick={handleAddNew} className="p-10 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-600 hover:text-[#39FF14] hover:border-[#39FF14]/30 transition-all flex flex-col items-center justify-center gap-4 uppercase text-[10px] font-black tracking-[0.3em] bg-white/[0.01]">
                <Plus className="w-8 h-8" /> Iniciar Nuevo Paper de Investigación
            </button>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
              <div className="space-y-3 col-span-2">
                <label className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Título Principal</label>
                <input value={editingPost.title} onChange={e => setSelectedPost({...editingPost, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-[#39FF14]/50 outline-none transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Categoría</label>
                <div className="relative">
                    <select value={editingPost.category} onChange={e => setSelectedPost({...editingPost, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs uppercase font-bold appearance-none outline-none focus:border-[#39FF14]/50">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Ícono Visual</label>
                <div className="grid grid-cols-6 gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                    {AVAILABLE_ICONS.map(icon => (
                        <button key={icon} onClick={() => setSelectedPost({...editingPost, iconName: icon})} className={`p-2 rounded-lg flex items-center justify-center transition-all ${editingPost.iconName === icon ? 'bg-[#39FF14] text-black' : 'hover:bg-white/10 text-slate-500'}`}>
                            <span className="text-[8px] font-bold">{icon.substring(0, 3)}</span>
                        </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Content & Bibliography Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Content Editor */}
                <div className="space-y-6 flex flex-col">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl">
                            <button onClick={() => setWriteMode('smart')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${writeMode === 'smart' ? 'bg-[#39FF14] text-black shadow-[0_0_10px_#39FF1440]' : 'text-slate-500'}`}>Smart</button>
                            <button onClick={() => setWriteMode('json')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${writeMode === 'json' ? 'bg-cyan-500 text-black shadow-[0_0_10px_#06b6d440]' : 'text-slate-500'}`}>JSON</button>
                        </div>
                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Cuerpo de la Investigación</label>
                    </div>
                    {writeMode === 'smart' ? (
                         <textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder="### Título de Sección...&#10;&#10;Contenido..." className="flex-1 min-h-[450px] bg-black border border-white/10 rounded-2xl p-6 text-sm text-slate-300 font-sans leading-relaxed focus:border-[#39FF14]/30 outline-none custom-scrollbar" />
                    ) : (
                        <textarea value={editingPost.contentStr} onChange={e => setSelectedPost({...editingPost, contentStr: e.target.value})} className="flex-1 min-h-[450px] bg-black border border-white/10 rounded-2xl p-6 text-xs text-cyan-400 font-mono focus:border-cyan-500/50 outline-none custom-scrollbar" />
                    )}
                </div>

                {/* Structured Bibliography Editor */}
                <div className="space-y-6 flex flex-col">
                    <div className="flex justify-between items-center">
                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Fuentes y Bibliografía</label>
                        <button onClick={addLinkField} className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg text-[9px] font-black uppercase hover:bg-purple-500/20 transition-all">
                            <Plus className="w-3 h-3" /> Agregar Fuente
                        </button>
                    </div>
                    
                    <div className="flex-1 space-y-4 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-y-auto custom-scrollbar min-h-[450px]">
                        {editingPost.localLinks.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                                <Globe className="w-8 h-8" />
                                <span className="text-[9px] uppercase font-black tracking-widest">Sin fuentes añadidas</span>
                            </div>
                        )}
                        {editingPost.localLinks.map((link, idx) => (
                            <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3 relative group">
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[7px] text-slate-600 uppercase font-black">Título</label>
                                        <div className="flex items-center gap-2 bg-black p-2 rounded-lg border border-white/5">
                                            <Type className="w-3 h-3 text-slate-500" />
                                            <input value={link.title} onChange={e => updateLink(idx, 'title', e.target.value)} className="w-full bg-transparent border-none outline-none text-xs text-white" placeholder="Ej: Audio API Reference" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[7px] text-slate-600 uppercase font-black">URL</label>
                                        <div className="flex items-center gap-2 bg-black p-2 rounded-lg border border-white/5">
                                            <Link className="w-3 h-3 text-slate-500" />
                                            <input value={link.url} onChange={e => updateLink(idx, 'url', e.target.value)} className="w-full bg-transparent border-none outline-none text-xs text-cyan-500" placeholder="https://..." />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-end gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[7px] text-slate-600 uppercase font-black">Fuente / Autor</label>
                                        <div className="flex items-center gap-2 bg-black p-2 rounded-lg border border-white/5">
                                            <Globe className="w-3 h-3 text-slate-500" />
                                            <input value={link.source} onChange={e => updateLink(idx, 'source', e.target.value)} className="w-full bg-transparent border-none outline-none text-xs text-slate-400" placeholder="Ej: MDN Web Docs" />
                                        </div>
                                    </div>
                                    <button onClick={() => removeLink(idx)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all">
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-4 border-t border-white/10 pt-10">
                <button onClick={handleSavePost} className="flex-1 py-5 bg-[#39FF14] text-black text-xs font-black uppercase rounded-2xl hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_20px_rgba(57,255,20,0.2)]">
                    Consolidar en Previsualización
                </button>
                <button onClick={handleExportSingle} className="px-10 py-5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase rounded-2xl flex items-center gap-3 hover:bg-cyan-500/20 transition-all active:scale-95">
                    <Copy className="w-4 h-4" /> Exportar para Gemini
                </button>
                <button onClick={() => setSelectedPost(null)} className="px-10 py-5 bg-white/5 border border-white/10 text-white text-xs font-black uppercase rounded-2xl hover:bg-white/10 transition-all">
                    Regresar al Índice
                </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
