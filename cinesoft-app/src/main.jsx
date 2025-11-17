import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';

import Cartelera from './PANTALLAS/Cartelera/cartelera.jsx'
import DetallePelicula from './PANTALLAS/DetallePelicula/DetallePelicula.jsx'; 
import MapaAsientos from './PANTALLAS/MapaAsientos/MapaAsientos.jsx';
import Boletos from './PANTALLAS/Boletos/Boletos.jsx';
import Login from './Auth/Login.jsx'
import Register from './Auth/Register.jsx'
import SplashScreen from './components/SplashScreen/SplashScreen.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/cartelera" element={<Cartelera />} />
          <Route path="/detalle/:id" element={<DetallePelicula />} />
          <Route path="/asientos/:id" element={<MapaAsientos />} />
          <Route path="/boletos/:id" element={<Boletos />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  </StrictMode>,
)