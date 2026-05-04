const Footer = ({ onContactClick, onInfoClick }) => {
  const handleLinkClick = (e, type) => {
    e.preventDefault();
    if (onInfoClick) onInfoClick(type);
  };

  return (
    <footer className="bg-[#010101] border border-white/10 backdrop-blur-md py-16 px-8 z-10 relative mt-24 mx-4 md:mx-8 mb-8 rounded-[2.5rem]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
        
        {/* COL 1: Ayuda */}
        <div className="flex flex-col gap-6">
          <h4 className="font-mono font-black text-white uppercase tracking-widest text-xs border-b border-white/10 pb-4">
            AYUDA
          </h4>
          <ul className="flex flex-col gap-3 font-sans text-slate-400 text-sm">
            <li><a href="#" onClick={(e) => handleLinkClick(e, 'quickstart')} className="hover:text-white transition-colors">Guía de Inicio Rápido</a></li>
            <li><a href="#" onClick={(e) => handleLinkClick(e, 'calibration')} className="hover:text-white transition-colors">Manual de Calibración</a></li>
            <li><a href="#" onClick={(e) => handleLinkClick(e, 'faq')} className="hover:text-white transition-colors">Preguntas Frecuentes (FAQ)</a></li>
          </ul>
        </div>

        {/* COL 2: Laboratorio */}
        <div className="flex flex-col gap-6">
          <h4 className="font-mono font-black text-white uppercase tracking-widest text-xs border-b border-white/10 pb-4">
            LABORATORIO
          </h4>
          <p className="font-sans text-slate-400 text-sm leading-relaxed">
            Vostok Labs es un ecosistema de herramientas DSP. Nuestra misión es democratizar el análisis acústico profesional con interfaces accesibles y precisas.
          </p>
          <button 
            onClick={(e) => handleLinkClick(e, 'mission')}
            className="text-left font-sans text-slate-400 hover:text-[#39FF14] transition-colors text-sm font-bold w-max"
          >
            Leer Misión Completa
          </button>
        </div>

        {/* COL 3: Legal */}
        <div className="flex flex-col gap-6">
          <h4 className="font-mono font-black text-white uppercase tracking-widest text-xs border-b border-white/10 pb-4">
            LEGAL
          </h4>
          <ul className="flex flex-col gap-3 font-sans text-slate-400 text-sm">
            <li><a href="#" onClick={(e) => handleLinkClick(e, 'privacy')} className="hover:text-white transition-colors">Política de Privacidad Técnica</a></li>
            <li><a href="#" onClick={(e) => handleLinkClick(e, 'terms')} className="hover:text-white transition-colors">Términos de Uso</a></li>
            <li><a href="#" onClick={(e) => handleLinkClick(e, 'legal')} className="hover:text-white transition-colors">Normas Legales</a></li>
          </ul>
        </div>

        {/* COL 4: Participa */}
        <div className="flex flex-col gap-6">
          <h4 className="font-mono font-black text-white uppercase tracking-widest text-xs border-b border-white/10 pb-4">
            PARTICIPA
          </h4>
          <div className="flex flex-col gap-4">
            <a 
              href="https://reddit.com/r/vostoklabs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-sans text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#FF4500]/10 flex items-center justify-center border border-[#FF4500]/20 group-hover:bg-[#FF4500]/20 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#FF4500]">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-10.056 1.597.04.21.06.422.06.637 0 2.73-3.385 4.943-7.56 4.943-4.175 0-7.56-2.213-7.56-4.943 0-.213.02-.424.062-.643a1.756 1.756 0 0 1-1.054-1.59c0-.968.786-1.754 1.754-1.754.463 0 .875.18 1.179.475 1.187-.85 2.812-1.415 4.606-1.498l.906-4.239a.44.44 0 0 1 .52-.339l2.815.594c.03-.265.249-.471.52-.471zm-7.39 8.59c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1 1.1-.49 1.1-1.1-.49-1.1-1.1-1.1zm4.76 0c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1 1.1-.49 1.1-1.1-.49-1.1-1.1-1.1zm-3.154 3.386c-.118 0-.213.096-.213.214 0 .43.348.78.777.78s.777-.35.777-.78a.214.214 0 0 0-.213-.214h-1.128z" />
                </svg>
              </div>
              <span className="font-sans text-sm font-bold group-hover:translate-x-1 transition-transform">Comunidad r/vostoklabs</span>
            </a>
            <button 
              onClick={onContactClick}
              className="text-left font-sans text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400 group-hover:text-white">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </div>
              <span className="font-sans text-sm font-bold group-hover:translate-x-1 transition-transform">Buzón de Contacto</span>
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono text-[#39FF14]/70 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse shadow-[0_0_5px_#39FF14]"></div>
          SYS.STATUS: ONLINE
        </div>
        <div className="font-mono text-slate-600 text-[10px] font-bold tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} VOSTOK LABS. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
