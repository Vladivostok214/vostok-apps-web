import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'
import { AudioDeviceProvider } from './context/AudioDeviceContext.jsx'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nueva actualización disponible. ¿Recargar?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App lista para trabajar offline')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AudioDeviceProvider>
      <App />
    </AudioDeviceProvider>
  </StrictMode>,
)
