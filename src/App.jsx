import React from 'react';
import { Smartphone, Activity, Zap, Waves, Headphones, ArrowRight, Mail, SlidersHorizontal, Globe, MessageCircle } from 'lucide-react';

// Icono SVG personalizado para el Diapasón
const TuningForkIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22v-8"></path>
    <path d="M8 14V4"></path>
    <path d="M16 14V4"></path>
    <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4"></path>
  </svg>
);

export default function App() {
  return (
    <div className="min-h-screen bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B0F19] to-black text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Navegación */}
      <nav className="fixed top-0 w-full z-50 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wide">Vostok<span className="font-light opacity-70">Apps</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#tuner" className="hover:text-white transition-colors">Vostok Tuner</a>
            <a href="#ecosistema" className="hover:text-white transition-colors">Ecosistema</a>
            <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
          </div>
          
          <button className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all text-white backdrop-blur-md">
            Contacto
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 px-6 flex flex-col items-center text-center">
        {/* Glow de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Nuevo Lanzamiento
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 max-w-4xl leading-tight">
          Redefiniendo el <br className="hidden md:block"/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">Audio Digital Móvil</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 font-medium">
          Creamos herramientas de precisión de grado de estudio con interfaces que inspiran. Nuestra misión es potenciar tu creatividad musical desde la palma de tu mano.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#tuner" className="px-8 py-4 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2">
            Descubrir Vostok Tuner
            <ArrowRight className="w-5 h-5" />
          </a>
          <button className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            Ver Ecosistema
          </button>
        </div>
      </section>

      {/* Featured App: Vostok Tuner */}
      <section id="tuner" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#131B2C]/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 lg:p-16 flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden">
            
            {/* Background Glow for Tuner */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="lg:w-1/2 z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mb-8 border border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <TuningForkIcon className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                Vostok Tuner
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Nuestra primera obra maestra. Un afinador cromático y de instrumentos que combina un motor de detección <strong className="text-emerald-400">AutoCorrelate</strong> de alta precisión (± 4 Cents) con un diseño UI vanguardista en cristal oscuro.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 mb-10">
                <div className="flex flex-col gap-2">
                  <Activity className="w-6 h-6 text-blue-400" />
                  <h3 className="font-semibold text-white">Onda Sinusoidal Reactiva</h3>
                  <p className="text-sm text-slate-500">Visualización en tiempo real a 60FPS en el lienzo de fondo.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Smartphone className="w-6 h-6 text-purple-400" />
                  <h3 className="font-semibold text-white">Navegación Nativa</h3>
                  <p className="text-sm text-slate-500">Controles basados en gestos fluidos (Swipes) y feedback háptico.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Zap className="w-6 h-6 text-emerald-400" />
                  <h3 className="font-semibold text-white">Precisión Extrema</h3>
                  <p className="text-sm text-slate-500">Bloqueo de afinación inteligente con cinta deslizante inferior.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <TuningForkIcon className="w-6 h-6 text-amber-400" />
                  <h3 className="font-semibold text-white">Multi-Instrumento</h3>
                  <p className="text-sm text-slate-500">Perfiles para Guitarra, Bajo, Ukelele, Violín y modo Cromático.</p>
                </div>
              </div>
              
              <button className="px-8 py-3.5 rounded-2xl bg-white text-black font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                Próximamente en App Store
              </button>
            </div>

            {/* Mockup CSS del Afinador */}
            <div className="lg:w-1/2 flex justify-center z-10">
              <div className="relative w-[300px] h-[600px] bg-[#0B0F19] rounded-[3rem] border-[8px] border-slate-800 shadow-2xl shadow-blue-500/20 overflow-hidden flex flex-col items-center pt-16 pb-8">
                {/* Notch */}
                <div className="absolute top-0 w-32 h-6 bg-slate-800 rounded-b-2xl"></div>
                
                {/* Simulated UI */}
                <div className="w-full px-6 flex justify-between items-center mb-12">
                  <TuningForkIcon className="w-5 h-5 text-slate-500" />
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full"></div>
                  <SlidersHorizontal className="w-5 h-5 text-slate-500" />
                </div>

                <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-6">
                  Perfecto
                </div>

                <div className="relative w-full max-w-[240px] aspect-[2/1] mb-6">
                  {/* Fake Arc */}
                  <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className="stroke-white/5" strokeWidth="8" strokeLinecap="round" />
                    <path d="M 94 20 A 80 80 0 0 1 106 20" fill="none" className="stroke-emerald-500/30" strokeWidth="8" strokeLinecap="round" />
                    <line x1="100" y1="100" x2="100" y2="20" stroke="#10b981" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <circle cx="100" cy="100" r="6" fill="#10b981" />
                  </svg>
                </div>

                <div className="text-7xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">A<span className="text-3xl opacity-60">4</span></div>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-2">+0 CENTS</div>

                {/* Fake Tape Slider */}
                <div className="mt-auto w-full h-16 border-t border-white/5 relative overflow-hidden flex items-end justify-center">
                  <div className="w-0.5 h-8 bg-emerald-500 absolute bottom-0 z-10"></div>
                  <div className="flex gap-4 opacity-50 px-4">
                    <div className="w-px h-4 bg-slate-500"></div><div className="w-px h-6 bg-slate-500"></div><div className="w-px h-4 bg-slate-500"></div>
                    <div className="w-px h-6 bg-slate-500"></div><div className="w-px h-4 bg-slate-500"></div><div className="w-px h-6 bg-slate-500"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Roadmap / Ecosystem Section */}
      <section id="ecosistema" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Expandiendo el <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Ecosistema</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              El afinador es solo el comienzo. Estamos desarrollando una suite completa de aplicaciones que transformarán tu dispositivo móvil en una navaja suiza de producción musical.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* App Card 1 */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Vostok Metronome</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Subdivisiones complejas, polirritmias, setlists guardados y sincronización Link. Una máquina del tiempo perfecta.
              </p>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-400 transition-colors">
                En Desarrollo
              </span>
            </div>

            {/* App Card 2 */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
                <Waves className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Vostok Spectrum</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Analizador de espectro y osciloscopio 3D en tiempo real. Ve el sonido como nunca antes lo habías visto.
              </p>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-400 transition-colors">
                Concepto Fase Alpha
              </span>
            </div>

            {/* App Card 3 */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-6 border border-orange-500/30">
                <Headphones className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Vostok 4-Track</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Captura ideas instantáneamente. Grabadora multipista minimalista inspirada en la era dorada del cassette analógico.
              </p>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-orange-400 transition-colors">
                Próximamente
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Únete a la beta privada</h2>
          <p className="text-slate-400 mb-10 text-lg">
            Sé el primero en probar Vostok Tuner y nuestras futuras aplicaciones. Buscamos músicos que nos ayuden a refinar la experiencia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input 
              type="email" 
              placeholder="tu@correo.com" 
              className="px-6 py-4 rounded-full bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-80 backdrop-blur-sm"
            />
            <button className="px-8 py-4 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              Suscribirme
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-blue-500" />
            <span className="text-lg font-bold tracking-wide">Vostok<span className="font-light opacity-70">Apps</span></span>
          </div>
          
          <div className="flex gap-6 text-slate-500">
            <a href="#" className="hover:text-white transition-colors"><Globe className="w-5 h-5" /></a>
            <a href="#" className="hover:text-white transition-colors"><MessageCircle className="w-5 h-5" /></a>
            <a href="#" className="hover:text-white transition-colors"><Mail className="w-5 h-5" /></a>
          </div>
          
          <div className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} Vostok Apps. Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}