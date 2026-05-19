import { motion } from 'framer-motion';

export const TuningForkIcon = ({ className, strokeColor = "currentColor" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22v-8" />
    <path d="M8 14V4" />
    <path d="M16 14V4" />
    <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4" />
  </svg>
);

export const VostokLogo = ({ className = "w-10 h-10" }) => (
  <div className={`${className} relative rounded-xl bg-[#050A05] flex items-center justify-center shadow-lg shadow-green-500/10 overflow-hidden border border-green-500/20 group`}>
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
    <TuningForkIcon className="w-6 h-6 text-[#39FF14] relative z-10 transition-transform group-hover:scale-110" />
  </div>
);

export const GraphicIcon = ({ type, color }) => {
  const floatVariants = {
    animate: {
      y: [0, -12, 0],
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
    }
  };
  const baseClass = "w-full h-full flex items-center justify-center opacity-30 pointer-events-none";
  
  return (
    <motion.div variants={floatVariants} animate="animate" className={baseClass}>
      {type === 'triangle' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><path d="M50 10 L90 90 L10 90 Z" /><circle cx="50" cy="10" r="2" fill={color} /><line x1="10" y1="90" x2="90" y2="90" strokeDasharray="4 4" /></svg>}
      {type === 'nodes' && <svg viewBox="0 0 100 40" className="w-56 h-32" fill="none" stroke={color} strokeWidth="1.5"><path d="M0 20 Q 25 0, 50 20 T 100 20" /><path d="M0 20 Q 25 40, 50 20 T 100 20" strokeDasharray="2 2" /><circle cx="25" cy="10" r="3" fill={color} /><circle cx="75" cy="10" r="3" fill={color} /></svg>}
      {type === 'symmetry' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1"><circle cx="50" cy="50" r="40" /><path d="M50 10 L50 90 M10 50 L90 50" /><path d="M21 21 L79 79 M21 79 L79 21" strokeDasharray="3 3" /></svg>}
      {type === 'resonator' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><circle cx="50" cy="55" r="35" /><rect x="42" y="5" width="16" height="15" rx="2" /><path d="M42 20 L42 25 M58 20 L58 25" /></svg>}
      {type === 'cylinder' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><ellipse cx="50" cy="30" rx="30" ry="10" /><path d="M20 30 L20 70 A30 10 0 0 0 80 70 L80 30" /><path d="M50 45 L50 85" strokeDasharray="2 2" /></svg>}
      {type === 'triode' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><rect x="35" y="10" width="30" height="70" rx="15" /><line x1="50" y1="25" x2="50" y2="35" /><path d="M40 45 H60 M40 50 H60 M40 55 H60" strokeDasharray="2 1" /><line x1="45" y1="70" x2="55" y2="70" /></svg>}
      {type === 'strobe' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1"><circle cx="50" cy="50" r="45" /><circle cx="50" cy="50" r="35" strokeDasharray="10 5" /><circle cx="50" cy="50" r="25" strokeDasharray="5 10" /><circle cx="50" cy="50" r="5" fill={color} /></svg>}
      {type === 'spectrum' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><line x1="10" y1="90" x2="90" y2="90" /><path d="M10 90 L25 40 L40 80 L55 10 L70 85 L90 90" strokeWidth="2" /><path d="M10 90 L90 90" /></svg>}
      {type === 'correlation' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><path d="M10 50 C 20 20, 30 80, 40 50 C 50 20, 60 80, 70 50 C 80 20, 90 80, 100 50" /><line x1="10" y1="10" x2="10" y2="90" opacity="0.3" /></svg>}
      {type === 'ai' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><circle cx="50" cy="50" r="10" fill={color} fillOpacity="0.2" /><circle cx="20" cy="30" r="4" fill={color} /><circle cx="20" cy="70" r="4" fill={color} /><circle cx="80" cy="30" r="4" fill={color} /><circle cx="80" cy="70" r="4" fill={color} /><line x1="24" y1="33" x2="42" y2="45" /><line x1="24" y1="67" x2="42" y2="55" /><line x1="76" y1="33" x2="58" y2="45" /><line x1="76" y1="67" x2="58" y2="55" /></svg>}
    </motion.div>
  );
};
