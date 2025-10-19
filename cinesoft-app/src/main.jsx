import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DetallePelicula from './DetallePelicula/DetallePelicula.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DetallePelicula />
  </StrictMode>,
)
