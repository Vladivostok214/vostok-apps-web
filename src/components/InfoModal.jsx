import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';

const CONTENT_MAP = {
  faq: {
    title: 'Preguntas Frecuentes (FAQ)',
    content: (
      <div className="space-y-6">
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Posicionamiento del Micrófono (Mandato REW)</h5>
          <p>Para mediciones precisas, apunte el micrófono omnidireccional directamente a la fuente (0 grados) o al techo (90 grados) si está evaluando la respuesta de la sala, dependiendo del perfil de calibración de su dispositivo.</p>
        </div>
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Conceptos: Hz vs dB</h5>
          <p><strong>Hz (Hertz):</strong> Mide la frecuencia, percibida como el "tono" (grave o agudo).<br/><strong>dB (Decibelios):</strong> Mide la amplitud, percibida como la Presión Sonora o "volumen".</p>
        </div>
      </div>
    )
  },
  privacy: {
    title: 'Privacidad Técnica',
    content: (
      <div className="space-y-6">
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Telemetría Zero-Footprint</h5>
          <p>Utilizamos el modo 'Cookieless server hash' de PostHog. Solo capturamos telemetría técnica anónima (como el Sample Rate y la Base Latency) sin utilizar cookies ni rastreadores entre sesiones.</p>
        </div>
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Procesamiento Local (Hardware Bypass)</h5>
          <p>El audio se captura en estado crudo evadiendo el pre-procesamiento del sistema (echo cancellation: false). Los cálculos de DSP se ejecutan 100% en la memoria de su navegador. El flujo de audio nunca es grabado ni enviado a servidores externos.</p>
        </div>
      </div>
    )
  },
  calibration: {
    title: 'Manual de Calibración',
    content: (
      <div className="space-y-6">
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Aplanando la Curva</h5>
          <p>Utilice una fuente de ruido rosa (Pink Noise) confiable. Observe la gráfica en el módulo Spectrum (Modo HD-RTA). Identifique las frecuencias resonantes (picos) o cancelaciones (valles) introducidas por su sala.</p>
        </div>
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Ajuste de Referencia</h5>
          <p>Con un ecualizador paramétrico en su cadena de salida, aplique cortes quirúgicos (EQ sustractiva) en las frecuencias resonantes hasta que la representación espectral tienda a una pendiente suave y controlada.</p>
        </div>
      </div>
    )
  },
  mission: {
    title: 'Misión del Laboratorio',
    content: (
      <div className="space-y-6">
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Democratizar el DSP</h5>
          <p>Vostok Labs nace con la convicción de que el análisis acústico profesional no debe estar restringido a laboratorios con equipamiento inaccesible.</p>
        </div>
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Precisión y Estética</h5>
          <p>Integramos algoritmos matemáticos complejos en interfaces táctiles fluidas de estilo Noir-Tech, priorizando siempre la estabilidad, el bajo consumo de recursos y la precisión de grado de estudio en cualquier dispositivo.</p>
        </div>
      </div>
    )
  },
  quickstart: {
    title: 'Inicio Rápido',
    content: (
      <div className="space-y-6">
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Preparación del Entorno</h5>
          <p>Asegúrese de otorgar permisos de micrófono en su navegador. Se recomienda ubicar el dispositivo en una superficie estable o soporte anti-vibración para evitar ruido estructural de baja frecuencia.</p>
        </div>
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Navegación</h5>
          <p>Seleccione el módulo deseado en el panel inferior o menú principal. El motor DSP se inicializará automáticamente. Utilice auriculares si experimenta acople (feedback) durante el uso de generadores.</p>
        </div>
      </div>
    )
  },
  terms: {
    title: 'Términos Legales',
    content: (
      <div className="space-y-6">
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Uso Referencial</h5>
          <p>Las mediciones generadas por Vostok Labs (Tuner, SPL, Spectrum) están diseñadas para referencia técnica y artística. No sustituyen instrumentos médicos de audiometría ni dispositivos de medición legal homologados.</p>
        </div>
        <div>
          <h5 className="font-mono text-[#39FF14] text-xs uppercase tracking-widest mb-2">Cómputo Intensivo</h5>
          <p>El procesamiento de Transformadas Rápidas de Fourier (FFT) y algoritmos de correlación requieren recursos de CPU de su dispositivo. El uso prolongado podría aumentar la temperatura de equipos móviles.</p>
        </div>
      </div>
    )
  }
};

const InfoModal = ({ isOpen, onClose, type }) => {
  const data = CONTENT_MAP[type] || CONTENT_MAP['faq'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] bg-[#010101]/90 backdrop-blur-xl flex items-center justify-center p-4 crt-scanlines"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-xl bg-black border border-[#39FF14]/20 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(57,255,20,0.05)] relative overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20 hover:bg-[#39FF14]/20 transition-colors z-50 cursor-pointer"
            >
              <X className="w-5 h-5 text-[#39FF14]" />
            </button>
            
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-[#39FF14]" />
              </div>
              <div>
                <h3 className="text-xl font-mono font-black text-[#39FF14] uppercase tracking-tight">{data.title}</h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Base de Datos Vostok</p>
              </div>
            </div>

            <div className="font-sans text-slate-300 text-sm leading-relaxed relative z-10 custom-scrollbar max-h-[60vh] overflow-y-auto pr-2">
              {data.content}
            </div>

            <div className="mt-8 pt-6 border-t border-[#39FF14]/10 flex justify-between items-center relative z-10">
              <div className="font-mono text-[#39FF14]/70 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse shadow-[0_0_5px_#39FF14]"></div>
                LECTURA COMPLETA
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InfoModal;
