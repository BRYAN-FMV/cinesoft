import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Cartelera from './Cartelera/cartelera.jsx'
import DetallePelicula from './DetallePelicula/DetallePelicula.jsx'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Cartelera />} />
        <Route path="/detalle/:id" element={<DetallePelicula />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)