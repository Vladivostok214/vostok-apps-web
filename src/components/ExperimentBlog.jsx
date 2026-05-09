import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Terminal, Activity, Cpu, 
  Shield, Zap, Info, FileText,
  ChevronRight, ExternalLink, Clock,
  Calendar, User, BookOpen
} from 'lucide-react';

const CodeBlock = ({ code, language = "powershell" }) => (
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

const ComparisonTable = () => (
  <div className="my-10 overflow-hidden border border-white/10 rounded-2xl bg-white/[0.02] backdrop-blur-sm">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-white/10 bg-white/5">
          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Métrica</th>
          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white">Google Chrome (PID 6628)</th>
          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#39FF14]">Brave Browser (PID 5172)</th>
          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-cyan-400">Veredicto</th>
        </tr>
      </thead>
      <tbody className="text-sm font-mono">
        <tr className="border-b border-white/5">
          <td className="p-4 text-slate-400 font-bold">RAM (WorkingSet)</td>
          <td className="p-4 text-slate-300">449.27 MB</td>
          <td className="p-4 text-[#39FF14] font-black">175.04 MB</td>
          <td className="p-4 text-cyan-400">Ahorro del 61%</td>
        </tr>
        <tr>
          <td className="p-4 text-slate-400 font-bold">CPU (Tiempo Acumulado)</td>
          <td className="p-4 text-slate-300">632.55 Segs</td>
          <td className="p-4 text-[#39FF14] font-black">10.05 Segs</td>
          <td className="p-4 text-cyan-400">Gestión Pasiva</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const POSTS = [
  {
    id: 'performance-audit-2026',
    title: "Informe de Auditoría de Rendimiento: Navegadores Web y Ecosistema",
    date: "8 de Mayo de 2026",
    category: "Ingeniería de Sistemas",
    readTime: "6 MIN",
    author: "Vladivostok",
    excerpt: "Análisis profundo sobre el impacto del consumo de CPU y RAM en entornos de alto rendimiento. Chrome vs Brave en la era de la IA.",
    icon: Activity,
    color: "#39FF14"
  },
  {
    id: 'ai-dsp-future',
    title: "El Futuro del DSP: Integración de Modelos JEPA en Tiempo Real",
    date: "15 de Abril de 2026",
    category: "Inteligencia Artificial",
    readTime: "8 MIN",
    author: "Vladivostok",
    excerpt: "Cómo los modelos de arquitectura Joint-Embedding Predictive están revolucionando la detección de transientes y la síntesis granular.",
    icon: Zap,
    color: "#06b6d4"
  },
  {
    id: 'noir-tech-design',
    title: "Filosofía Noir-Tech: Estética Industrial en el Audio Digital",
    date: "02 de Marzo de 2026",
    category: "Diseño UI/UX",
    readTime: "5 MIN",
    author: "Vladivostok",
    excerpt: "Explorando la psicología detrás de las interfaces de alto contraste y la densidad de información en herramientas de laboratorio.",
    icon: Terminal,
    color: "#A855F7"
  }
];

export default function ExperimentBlog({ onBack }) {
  const [selectedPostId, setSelectedPostId] = useState(null);

  const auditContent = {
    script: `param (  
    [string]$TargetName = "",  
    [int]$TargetId = 0  
)

# Lógica de búsqueda  
if ($TargetId -gt 0) {  
    $Procs = Get-Process -Id $TargetId -ErrorAction SilentlyContinue  
} elseif ($TargetName -ne "") {  
    $Procs = Get-Process -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -match $TargetName}  
} else {  
    Write-Warning "Debes ingresar un nombre o un ID."  
    return  
}

if (-not $Procs) {   
    Write-Warning "No se encontraron procesos activos."  
    return   
}

# Extracción de Datos  
$Procs | Select-Object ProcessName, Id, CPU, WorkingSet | Export-Csv -Path proc.csv -NoTypeInformation

$Ids = $Procs.Id  
Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object {$_.OwningProcess -in $Ids} | Select-Object OwningProcess, State, RemoteAddress, RemotePort | Export-Csv -Path net.csv -NoTypeInformation

Write-Warning "Auditoría completada. Revisa proc.csv y net.csv."`
  };

  const selectedPost = POSTS.find(p => p.id === selectedPostId);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#010101] z-[200] flex flex-col overflow-hidden font-sans text-white"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-30 z-10" />
      <div className="absolute inset-0 pointer-events-none z-0" style={{ 
        backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px)', 
        backgroundSize: '40px 40px' 
      }} />

      {/* Header */}
      <header className="w-full pt-[max(1.5rem,env(safe-area-inset-top))] px-6 sm:px-12 pb-6 border-b border-white/5 bg-black/80 backdrop-blur-xl z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={selectedPostId ? () => setSelectedPostId(null) : onBack}
            className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-[#39FF14]">Vostok_Log_System</h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              {selectedPostId ? "Reading_Entry" : "Entry_Index"}
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Database</span>
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-black tracking-widest">Connected_Stable</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar z-10">
        <AnimatePresence mode="wait">
          {!selectedPostId ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto px-6 py-20 sm:px-12"
            >
              <div className="mb-16">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-4">
                  Vostok <span className="text-[#39FF14]">Blog</span>
                </h2>
                <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">Explorando la frontera entre el código y el sonido.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {POSTS.map((post) => {
                  const Icon = post.icon;
                  return (
                    <motion.button
                      key={post.id}
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedPostId(post.id)}
                      className="text-left bg-[#080808] border border-white/5 rounded-[2rem] p-8 flex flex-col group relative overflow-hidden transition-all hover:border-[#39FF14]/20"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Icon className="w-24 h-24" style={{ color: post.color }} />
                      </div>
                      
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#39FF14]/30">
                          <Icon className="w-5 h-5" style={{ color: post.color }} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{post.category}</span>
                      </div>

                      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 group-hover:text-[#39FF14] transition-colors leading-tight">
                        {post.title}
                      </h3>
                      
                      <p className="text-slate-500 text-sm mb-8 line-clamp-3 font-medium uppercase leading-relaxed">
                        {post.excerpt}
                      </p>

                      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">Fecha</span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">{post.date}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">Lectura</span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">{post.readTime}</span>
                          </div>
                        </div>
                        <BookOpen className="w-4 h-4 text-slate-600 group-hover:text-[#39FF14] transition-colors" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.article 
              key="post"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-4xl mx-auto px-6 py-16 sm:px-12"
            >
              {selectedPostId === 'performance-audit-2026' ? (
                <>
                  {/* Post Header */}
                  <div className="mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[9px] font-black uppercase tracking-[0.3em] mb-8">
                      <Terminal className="w-3 h-3" />
                      {selectedPost.category}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
                      {selectedPost.title}
                    </h2>
                    <div className="flex flex-wrap gap-8 text-slate-500">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-[#39FF14]" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-700">Autor</span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{selectedPost.author}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-[#39FF14]" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-700">Publicado</span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{selectedPost.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-[#39FF14]" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-700">Tiempo</span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{selectedPost.readTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-16 text-slate-400 leading-relaxed text-lg">
                    {/* Resumen Ejecutivo */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">1. Resumen Ejecutivo</h3>
                      </div>
                      <p>
                        Esta investigación se centró en analizar la telemetría cruda (Consumo de CPU, Memoria RAM y Conexiones de Red) de diferentes aplicaciones en un entorno Windows 11 optimizado.
                      </p>
                      <p>
                        Se desarrolló una herramienta personalizada en PowerShell capaz de capturar el estado exacto de cualquier proceso o pestaña (vía PID) en un instante dado. El hallazgo más crítico fue la diferencia sustancial en la gestión de recursos al ejecutar tareas intensivas de IA entre <span className="text-white font-bold">Google Chrome</span> y <span className="text-[#39FF14] font-bold">Brave Browser</span>.
                      </p>
                    </section>

                    {/* Script Maestro */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Terminal className="w-4 h-4 text-[#39FF14]" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">2. Herramienta de Auditoría: "Script Maestro"</h3>
                      </div>
                      <p>
                        Para estandarizar las mediciones, se iteró y perfeccionó un script de PowerShell (Audit-Process.ps1). Esta herramienta extrae datos limpios a formato .csv para su posterior análisis.
                      </p>
                      <CodeBlock code={auditContent.script} />
                      <div className="p-6 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl">
                        <div className="flex gap-4">
                          <Info className="w-6 h-6 text-cyan-400 shrink-0" />
                          <p className="text-sm italic">"Este script es fundamental para auditar el impacto de procesos externos mientras el sistema está bajo carga crítica."</p>
                        </div>
                      </div>
                    </section>

                    {/* Análisis Comparativo */}
                    <section className="space-y-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Cpu className="w-4 h-4 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">3. Análisis Comparativo: Navegadores Web</h3>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-white uppercase tracking-widest">Microsoft Edge</span>
                            <Zap className="w-4 h-4 text-amber-500" />
                          </div>
                          <p className="text-sm leading-relaxed">Mantiene instancias de <span className="text-white">WebView2</span> activas incluso cerrado. Consumo moderado (~166 MB RAM) debido a la integración nativa con el sistema operativo.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-white uppercase tracking-widest">Google Chrome</span>
                            <Activity className="w-4 h-4 text-red-500" />
                          </div>
                          <p className="text-sm leading-relaxed">El perfil más agresivo: ~2.38 GB RAM global y múltiples procesos superando el 100% de uso de hilos en ráfagas.</p>
                        </div>
                      </div>

                      <div className="p-8 rounded-3xl bg-[#39FF14]/5 border border-[#39FF14]/20 space-y-4">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-[#39FF14]" />
                          <span className="text-sm font-black text-[#39FF14] uppercase tracking-widest">Brave Browser (Elección Vostok)</span>
                        </div>
                        <p className="text-sm leading-relaxed">Arquitectura enfocada en privacidad. Solo 16 conexiones de red activas vs +40 en Chrome. El bloqueo nativo de rastreadores reduce drásticamente el uso de CPU en sitios pesados.</p>
                      </div>
                    </section>

                    {/* El Duelo */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">4. El "Duelo": Prueba de Estrés IA</h3>
                      </div>
                      <p>
                        Aislamos los PIDs exactos de una pestaña ejecutando **Gemini AI** en ambos navegadores. Los resultados del Administrador de Tareas son contundentes:
                      </p>
                      <ComparisonTable />
                      <p className="text-sm italic border-l-2 border-[#39FF14]/30 pl-6">
                        La diferencia radica en la asignación de memoria: Chrome pre-reserva grandes bloques por seguridad (Aislamiento de Sitios), mientras que Brave optimiza el motor V8 limitando scripts en segundo plano.
                      </p>
                    </section>

                    {/* Conclusiones */}
                    <section className="space-y-6 pb-20">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Info className="w-4 h-4 text-[#39FF14]" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">5. Conclusiones y Eficiencia</h3>
                      </div>
                      <ul className="space-y-4">
                        {[
                          { title: "Navegador Recomendado: Brave", desc: "Ahorrar casi 300 MB de RAM por cada pestaña permite destinar esos recursos a procesos críticos de desarrollo y herramientas de alto rendimiento." },
                          { title: "Manejo de Ecosistemas Pesados", desc: "Cerrar procesos en segundo plano de suites creativas antes de sesiones de alta carga computacional para evitar picos de red y CPU." },
                          { title: "Monitoreo Continuo", desc: "Mantener el script Audit-Process.ps1 a mano. Si el sistema experimenta inestabilidad, auditar permite descartar causas externas de forma empírica." }
                        ].map((item, i) => (
                          <li key={i} className="flex gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <ChevronRight className="w-5 h-5 text-[#39FF14] shrink-0" />
                            <div className="space-y-1">
                              <span className="text-white font-bold block">{item.title}</span>
                              <span className="text-sm">{item.desc}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </>
              ) : (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-10 animate-pulse">
                    <Terminal className="w-8 h-8 text-slate-700" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-white">Contenido en Encriptación</h2>
                  <p className="text-slate-500 text-sm max-w-md uppercase tracking-widest font-mono">Este post está siendo procesado por el motor Vostok. Estará disponible en la próxima actualización de telemetría.</p>
                  <button 
                    onClick={() => setSelectedPostId(null)}
                    className="mt-12 px-10 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Volver al Índice
                  </button>
                </div>
              )}
            </motion.article>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="w-full py-8 px-6 sm:px-12 border-t border-white/5 bg-black z-20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {selectedPostId ? "End_Of_Entry" : "System_Idle"}
          </span>
        </div>
        <button 
          onClick={selectedPostId ? () => setSelectedPostId(null) : onBack}
          className="flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#39FF14]/10 hover:border-[#39FF14]/40 hover:text-[#39FF14] transition-all"
        >
          {selectedPostId ? "Cerrar Lectura" : "Cerrar Blog"}
          <ExternalLink className="w-4 h-4" />
        </button>
      </footer>
    </motion.div>
  );
}
