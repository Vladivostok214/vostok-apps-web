import React, { createContext, useContext, useState, useEffect } from 'react';

const AudioDeviceContext = createContext();

export function AudioDeviceProvider({ children }) {
  const [selectedDeviceId, setSelectedDeviceIdState] = useState(null);
  const [selectedChannel, setSelectedChannelState] = useState('mix'); // 'mix', '0', '1'

  useEffect(() => {
    // Load preference on mount
    const savedId = localStorage.getItem('vostok_audio_device_id');
    const savedChannel = localStorage.getItem('vostok_audio_channel');
    if (savedId) setSelectedDeviceIdState(savedId);
    if (savedChannel) setSelectedChannelState(savedChannel);
  }, []);

  const setSelectedDeviceId = (id) => {
    setSelectedDeviceIdState(id);
    if (id) localStorage.setItem('vostok_audio_device_id', id);
    else localStorage.removeItem('vostok_audio_device_id');
  };

  const setSelectedChannel = (channel) => {
    setSelectedChannelState(channel);
    localStorage.setItem('vostok_audio_channel', channel);
  };

  return (
    <AudioDeviceContext.Provider value={{ 
      selectedDeviceId, 
      setSelectedDeviceId,
      selectedChannel,
      setSelectedChannel
    }}>
      {children}
    </AudioDeviceContext.Provider>
  );
}

export function useAudioDevice() {
  const context = useContext(AudioDeviceContext);
  if (!context) {
    throw new Error('useAudioDevice must be used within an AudioDeviceProvider');
  }
  return context;
}

/**
 * Rutea el canal específico del MediaStreamSourceNode a un nuevo AudioNode mono
 * aislando el Input L o R de la interfaz de hardware.
 */
export const routeAudioChannel = (audioCtx, sourceNode, selectedChannel) => {
  // Si estamos en modo "mix" o no es válido, devolvemos el nodo original (downmix del navegador)
  if (!selectedChannel || selectedChannel === 'mix') return sourceNode;
  
  const splitter = audioCtx.createChannelSplitter(2);
  sourceNode.connect(splitter);
  
  const monoNode = audioCtx.createGain();
  monoNode.channelCount = 1;
  monoNode.channelCountMode = "explicit";
  
  try {
      splitter.connect(monoNode, parseInt(selectedChannel), 0);
  } catch(e) {
      // Fallback seguro si la interfaz es estrictamente mono
      splitter.connect(monoNode, 0, 0);
  }
  
  return monoNode;
};
