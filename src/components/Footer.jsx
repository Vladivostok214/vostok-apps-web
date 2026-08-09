const Footer = ({ onInfoClick }) => {
  const handleLinkClick = (e, type) => {
    e.preventDefault();
    if (onInfoClick) onInfoClick(type);
  };

  return (
    <footer className="w-full relative mt-0 md:mt-12 pt-8 md:pt-32 pb-16 px-8 z-10 bg-gradient-to-b from-transparent via-[#010101]/80 to-[#010101]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
        
        {/* COL 1: Ayuda */}
        <div className="flex flex-col gap-6">
          <h4 className="font-mono font-black text-white uppercase tracking-widest text-xs border-b border-white/10 pb-4">
            AYUDA
          </h4>
          <ul className="flex flex-col gap-3 font-sans text-slate-400 text-sm">
            <li><a href="#" onClick={(e) => handleLinkClick(e, 'quickstart')} className="hover:text-white transition-colors">Guía de Inicio Rápido</a></li>
            <li><a href="#" onClick={(e) => handleLinkClick(e, 'CALIBRATION_MANUAL')} className="hover:text-white transition-colors">Manual de Calibración</a></li>
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
            <li><a href="#" onClick={(e) => handleLinkClick(e, 'TERMS_OF_USE')} className="hover:text-white transition-colors">Términos de Uso</a></li>
            <li><a href="#" onClick={(e) => handleLinkClick(e, 'LEGAL_RULES')} className="hover:text-white transition-colors">Normas Legales</a></li>
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
              <span className="font-sans text-sm font-bold group-hover:translate-x-1 transition-transform">Comunidad Reddit</span>
            </a>
            
            <a 
              href="https://discord.gg/vostoklabs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-sans text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#5865F2]/10 flex items-center justify-center border border-[#5865F2]/20 group-hover:bg-[#5865F2]/20 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#5865F2]">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.572.099 18.057a.082.072 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>
              <span className="font-sans text-sm font-bold group-hover:translate-x-1 transition-transform">Discord Oficial</span>
            </a>
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
