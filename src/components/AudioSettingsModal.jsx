import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Settings2 } from 'lucide-react';
import { useAudioDevice } from '../context/AudioDeviceContext';

export default function AudioSettingsModal({ isOpen, onClose }) {
  const [devices, setDevices] = useState([]);
  const { selectedDeviceId, setSelectedDeviceId, selectedChannel, setSelectedChannel } = useAudioDevice();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    try {
      setError(null);
      // Ask for permission first so device labels are not blank
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
      setDevices(audioInputs);
    } catch (err) {
      console.error("Error accessing media devices", err);
      setError("No se pudo acceder a los dispositivos de audio. Por favor, asegúrate de haber dado permisos de micrófono.");
    }
  };

  const handleDeviceChange = (deviceId) => {
    if (deviceId === 'default') {
      setSelectedDeviceId(null);
    } else {
      setSelectedDeviceId(deviceId);
    }
    onClose(); // Optional: close modal immediately on selection, or keep open. We'll close it for UX.
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-neutral-950 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative flex flex-col"
          >
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-2xl flex items-center justify-center">
                <Settings2 className="w-6 h-6 text-[#39FF14]" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Audio Engine</h3>
                <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">Global Input Selection</p>
              </div>
            </div>

            {error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm mb-6">
                {error}
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 font-mono">Dispositivos Disponibles</div>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                  <button
                    onClick={() => handleDeviceChange('default')}
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 ${
                      !selectedDeviceId 
                        ? 'bg-[#39FF14]/10 border-[#39FF14]/50' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Mic className={`w-5 h-5 ${!selectedDeviceId ? 'text-[#39FF14]' : 'text-slate-400'}`} />
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${!selectedDeviceId ? 'text-[#39FF14]' : 'text-slate-300'}`}>
                        Por defecto del sistema
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Automático</span>
                    </div>
                  </button>
                  
                  {devices.map((device) => {
                    const isSelected = selectedDeviceId === device.deviceId;
                    return (
                      <button
                        key={device.deviceId}
                        onClick={() => handleDeviceChange(device.deviceId)}
                        className={`w-full text-left px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 ${
                          isSelected 
                            ? 'bg-[#39FF14]/10 border-[#39FF14]/50' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Mic className={`w-5 h-5 ${isSelected ? 'text-[#39FF14]' : 'text-slate-400'}`} />
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${isSelected ? 'text-[#39FF14]' : 'text-slate-300'}`}>
                            {device.label || `Interface ${device.deviceId.substring(0, 5)}...`}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Hardware dedicado</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-6 border-t border-white/10 pt-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 font-mono mb-2">Canal de Entrada</div>
                  <select 
                    value={selectedChannel || 'mix'} 
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-300 outline-none focus:border-[#39FF14]/40 transition-colors cursor-pointer"
                  >
                    <option value="mix" className="bg-neutral-900">Mezcla (Default L+R)</option>
                    <option value="0" className="bg-neutral-900">Canal 1 (L)</option>
                    <option value="1" className="bg-neutral-900">Canal 2 (R)</option>
                  </select>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-center text-slate-500 leading-relaxed font-medium">
              El dispositivo seleccionado será utilizado en el Afinador, Espectrómetro, Medidor SPL y Radar Armónico.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
