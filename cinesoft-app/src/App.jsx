import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import SplashScreen from './components/SplashScreen/SplashScreen.jsx';

// Importar todas las pantallas
import Cartelera from './PANTALLAS/Cartelera/cartelera.jsx'
import DetallePelicula from './PANTALLAS/DetallePelicula/DetallePelicula.jsx'; 
import MapaAsientos from './PANTALLAS/MapaAsientos/MapaAsientos.jsx';
import ResumenCompra from './PANTALLAS/ResumenCompra/ResumenCompra.jsx';
import DetalleVenta from './PANTALLAS/DetalleVenta/DetalleVenta.jsx';
import MisCompras from './PANTALLAS/MisCompras/MisCompras.jsx';
import Login from './Auth/Login.jsx'
import Register from './Auth/Register.jsx'

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Mostrar splash por 4 segundos al cargar la app
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Si está mostrando splash, solo renderizar el SplashScreen
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Una vez que termine el splash, mostrar las rutas normales
  return (
    <Routes>
      <Route path="/" element={<Cartelera />} />
      <Route path="/cartelera" element={<Cartelera />} />
      <Route path="/detalle/:id" element={<DetallePelicula />} />
      <Route path="/asientos/:id" element={<MapaAsientos />} />
      <Route path="/resumen" element={<ResumenCompra />} />
      <Route path="/mis-compras" element={<MisCompras />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/venta/:id" element={<DetalleVenta />} />
    </Routes>
  );
}

export default App;