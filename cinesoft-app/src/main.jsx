import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Cartelera from './PANTALLAS/Cartelera/cartelera.jsx'
import DetallePelicula from './PANTALLAS/DetallePelicula/DetallePelicula.jsx'; 
//import Cartelera from './Cartelera/cartelera.jsx'
//import DetallePelicula from './DetallePelicula/DetallePelicula.jsx'; 
import Login from './Auth/Login.jsx'
import Register from './Auth/Register.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Cartelera />} />
        <Route path="/detalle/:id" element={<DetallePelicula />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)