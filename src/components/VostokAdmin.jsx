import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Trash2, Edit3, Eye } from 'lucide-react';

export default function VostokAdmin({ posts, onSave, onClose }) {
  const [editingPost, setSelectedPost] = useState(null);
  const [localPosts, setLocalPosts] = useState(posts);

  const handleEdit = (post) => {
    setSelectedPost({ ...post, contentStr: JSON.stringify(post.content, null, 2), linksStr: JSON.stringify(post.links, null, 2) });
  };

  const handleSavePost = () => {
    try {
        const updatedPost = { 
            ...editingPost, 
            content: JSON.parse(editingPost.contentStr),
            links: JSON.parse(editingPost.linksStr)
        };
        delete updatedPost.contentStr;
        delete updatedPost.linksStr;

        const newPosts = localPosts.map(p => p.id === updatedPost.id ? updatedPost : p);
        setLocalPosts(newPosts);
        setSelectedPost(null);
    } catch (e) {
        alert("Error en el formato JSON del contenido o links.");
    }
  };

  const handleFinalExport = () => {
    const code = `export const BLOG_POSTS = ${JSON.stringify(localPosts, null, 2)};`;
    console.log(code);
    navigator.clipboard.writeText(code);
    alert("Código de posts copiado al portapapeles. Pásaselo a Gemini para actualizar el archivo físico.");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl p-6 overflow-hidden flex flex-col font-mono"
    >
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 text-[#39FF14]">
          <Edit3 className="w-5 h-5" />
          <span className="text-sm font-black uppercase tracking-[0.3em]">Vostok_Admin_Console</span>
        </div>
        <div className="flex gap-4">
            <button onClick={handleFinalExport} className="px-4 py-2 bg-[#39FF14]/10 border border-[#39FF14]/40 text-[#39FF14] text-[10px] uppercase font-bold rounded-lg hover:bg-[#39FF14]/20 transition-all flex items-center gap-2">
                <Save className="w-3 h-3" /> Exportar para Git
            </button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!editingPost ? (
          <div className="grid gap-4">
            {localPosts.map(post => (
              <div key={post.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group hover:border-[#39FF14]/30 transition-all">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{post.title}</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">{post.category} | {post.date}</span>
                </div>
                <button onClick={() => handleEdit(post)} className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#39FF14]/20">
                  <Edit3 className="w-4 h-4 text-[#39FF14]" />
                </button>
              </div>
            ))}
            <button className="p-4 border-2 border-dashed border-white/10 rounded-xl text-slate-600 hover:text-[#39FF14] hover:border-[#39FF14]/30 transition-all flex items-center justify-center gap-2 uppercase text-[10px] font-bold">
                <Plus className="w-4 h-4" /> Agregar Nueva Entrada
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[9px] text-slate-500 uppercase font-black">Título del Post</label>
                <input 
                  value={editingPost.title} 
                  onChange={e => setSelectedPost({...editingPost, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#39FF14]/50 outline-none" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[9px] text-slate-500 uppercase font-black">Categoría</label>
                <input 
                  value={editingPost.category} 
                  onChange={e => setSelectedPost({...editingPost, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#39FF14]/50 outline-none" 
                />
              </div>
            </div>

            <div className="space-y-4">
                <label className="text-[9px] text-slate-500 uppercase font-black">Contenido (JSON Structure)</label>
                <textarea 
                  value={editingPost.contentStr} 
                  onChange={e => setSelectedPost({...editingPost, contentStr: e.target.value})}
                  rows={10}
                  className="w-full bg-black border border-white/10 rounded-lg p-4 text-xs text-cyan-400 font-mono focus:border-[#39FF14]/50 outline-none custom-scrollbar" 
                />
                <span className="text-[8px] text-slate-600">Tipos: h3, p, code. Formato: [{`{ "type": "p", "text": "..." }`}]</span>
            </div>

            <div className="space-y-4">
                <label className="text-[9px] text-slate-500 uppercase font-black">Bibliografía (JSON Structure)</label>
                <textarea 
                  value={editingPost.linksStr} 
                  onChange={e => setSelectedPost({...editingPost, linksStr: e.target.value})}
                  rows={4}
                  className="w-full bg-black border border-white/10 rounded-lg p-4 text-xs text-purple-400 font-mono focus:border-[#39FF14]/50 outline-none custom-scrollbar" 
                />
            </div>

            <div className="flex gap-4 pt-4">
                <button onClick={handleSavePost} className="flex-1 py-3 bg-[#39FF14] text-black text-xs font-black uppercase rounded-xl hover:scale-[1.02] transition-transform">
                    Guardar Cambios Locales
                </button>
                <button onClick={() => setSelectedPost(null)} className="px-8 py-3 bg-white/5 text-white text-xs font-black uppercase rounded-xl">
                    Cancelar
                </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
