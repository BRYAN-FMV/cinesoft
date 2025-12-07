import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import './MapaAsientos.css';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useCart } from '../../context/CartContext.jsx';
import Navbar from '../../components/Navbar/Navbar';

// --- Constantes de la Sala ---
const SEAT_LAYOUT = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const COLUMNS = 5;

function MapaAsientos() {
  const { id: funcionId } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();
  const { addReservation } = useCart();
  const [searchParams] = useSearchParams();

  console.log('[MapaAsientos] funcionId recibido desde URL:', funcionId);
  console.log('[MapaAsientos] Token disponible:', !!token);
  console.log('[MapaAsientos] Auth loading:', authLoading);

  // Obtener parámetros de la URL
  const selectedDay = searchParams.get('day');
  const selectedTime = searchParams.get('time');
  const movieTitleParam = searchParams.get('title');
  const rawMovieId = searchParams.get('movieId');
  const movieId = rawMovieId && rawMovieId.trim() !== '' ? rawMovieId : funcionId;
  const movieTitle = movieTitleParam ? decodeURIComponent(movieTitleParam) : 'Película Desconocida';
  
  // Obtener información adicional de la función (precio, idioma, sala)
  const precio = parseFloat(searchParams.get('precio')) || 0;
  const idioma = searchParams.get('idioma') || 'No especificado';
  const salaId = searchParams.get('salaId') || 'No especificada';
  
  // Estado para almacenar información de la sala
  const [salaInfo, setSalaInfo] = useState(null);
  // Estado para refrescar asientos
  const [refreshSeats, setRefreshSeats] = useState(0);

  console.log('[MapaAsientos] Parámetros URL:', { selectedDay, selectedTime, movieTitle, movieId });

  // Usar el endpoint real para obtener asientos de la función
  const endpointUrl = `https://cine-web-api-tobi.vercel.app/api/funciones/${funcionId}/asientos`;
  console.log('[MapaAsientos] Consultando endpoint:', endpointUrl);
  
  const { data: asientosData, loading, error } = useFetch(endpointUrl);

  // Debug adicional para verificar el estado del hook useFetch
  useEffect(() => {
    console.log('[MapaAsientos] === ESTADO useFetch ===');
    console.log('[MapaAsientos] loading:', loading);
    console.log('[MapaAsientos] error:', error);
    console.log('[MapaAsientos] data:', asientosData);
    console.log('[MapaAsientos] ========================');
  }, [loading, error, asientosData]);

  const [asientosReal, setAsientosReal] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    console.log('[MapaAsientos] === DEBUG COMPLETO ===');
    console.log('[MapaAsientos] Datos recibidos del backend:', asientosData);
    console.log('[MapaAsientos] Tipo de datos:', typeof asientosData);
    
    if (asientosData) {
      // Mostrar la estructura completa
      console.log('[MapaAsientos] Estructura completa:', JSON.stringify(asientosData, null, 2));
      
      let asientos = [];
      
      // NUEVA ESTRUCTURA: El backend devuelve { mapa: { A: [...], B: [...] } }
      if (asientosData.mapa && typeof asientosData.mapa === 'object') {
        console.log('[MapaAsientos] Encontrado mapa por filas:', asientosData.mapa);
        
        // Convertir el objeto de filas en un array plano de asientos
        Object.keys(asientosData.mapa).forEach(fila => {
          const asientosFila = asientosData.mapa[fila];
          if (Array.isArray(asientosFila)) {
            asientosFila.forEach(asiento => {
              const nombreAsiento = asiento.codigo || `${asiento.fila}${asiento.numero}`;
              const estadoFinal = asiento.estadoFuncion || asiento.estado || 'disponible';
              const asientoNormalizado = {
                _id: asiento._id,
                nombre: nombreAsiento,
                estado: estadoFinal,
                fila: asiento.fila,
                numero: asiento.numero,
                originalData: asiento // Para debug
              };
              
              console.log('[MapaAsientos] Procesando asiento individual:', asientoNormalizado);
              asientos.push(asientoNormalizado);
            });
          }
        });
        
        console.log('[MapaAsientos] Asientos procesados desde mapa por filas:', asientos.length);
      }
      // ESTRUCTURA ANTERIOR: funcion.mapa como array
      else if (asientosData.funcion && asientosData.funcion.mapa && Array.isArray(asientosData.funcion.mapa)) {
        asientos = asientosData.funcion.mapa;
        console.log('[MapaAsientos] Asientos encontrados en funcion.mapa (array):', asientos);
      }
      // Fallback: si es un array directo
      else if (Array.isArray(asientosData)) {
        asientos = asientosData;
        console.log('[MapaAsientos] Usando array directo:', asientos);
      }
      // Si es un objeto con otra estructura
      else {
        console.warn('[MapaAsientos] Formato de respuesta inesperado:', asientosData);
        console.log('[MapaAsientos] Claves disponibles:', Object.keys(asientosData));
        asientos = [];
      }

      if (asientos.length > 0) {
        console.log('[MapaAsientos] Procesando', asientos.length, 'asientos reales del backend');
        const asientosMap = asientos.reduce((acc, asiento) => {
          // Asegurar que cada asiento tiene las propiedades necesarias
          const estadoFinal = asiento.estadoFuncion || asiento.estado || 'disponible';
          const asientoNormalizado = {
            _id: asiento._id || asiento.id,
            nombre: asiento.nombre || asiento.codigo || `${asiento.fila}${asiento.numero}` || asiento._id,
            estado: estadoFinal,
            originalData: asiento // Guardar datos originales para debug
          };
          
          // Registrar el asiento con su nombre original
          acc[asientoNormalizado.nombre] = asientoNormalizado;
          
          // TAMBIÉN registrar con formato simplificado si es diferente
          if (asiento.fila && asiento.numero) {
            const nombreSimple = `${asiento.fila}${asiento.numero}`;
            if (nombreSimple !== asientoNormalizado.nombre) {
              console.log(`[MapaAsientos] Registrando asiento con nombre alternativo: ${nombreSimple} (original: ${asientoNormalizado.nombre})`);
              acc[nombreSimple] = asientoNormalizado;
            }
          }
          
          console.log('[MapaAsientos] Asiento registrado:', {
            nombre: asientoNormalizado.nombre,
            estado: asientoNormalizado.estado,
            fila: asiento.fila,
            numero: asiento.numero
          });
          
          return acc;
        }, {});
        
        console.log('[MapaAsientos] Asientos REALES procesados:', asientosMap);
        console.log('[MapaAsientos] Total asientos REALES:', Object.keys(asientosMap).length);
        setAsientosReal(asientosMap);
        setSelectedSeats([]);
      } else {
        console.warn('[MapaAsientos] ¡MAPA VACÍO! El backend no tiene asientos configurados');
        console.log('[MapaAsientos] No se usarán datos mock, mostrando mapa vacío');
        setAsientosReal({});
        setSelectedSeats([]);
      }
    } else {
      console.error('[MapaAsientos] ¡No hay datos! asientosData es null/undefined');
    }
    console.log('[MapaAsientos] === FIN DEBUG ===');
  }, [asientosData]);

  // Función para refrescar estado de asientos
  const refreshSeatsState = async () => {
    try {
      console.log('[MapaAsientos] Refrescando estado de asientos para función:', funcionId);
      const response = await fetch(`https://cine-web-api-tobi.vercel.app/api/funciones/${funcionId}/asientos`);
      if (response.ok) {
        const freshData = await response.json();
        console.log('[MapaAsientos] Asientos actualizados desde servidor:', freshData);
        
        // Forzar re-procesamiento de datos actualizados
        if (freshData && Object.keys(freshData).length > 0) {
          // Llamar directamente al useEffect que procesa los datos
          console.log('[MapaAsientos] Forzando actualización con datos frescos');
          // Simular cambio en asientosData para que se dispare el useEffect
          setRefreshSeats(prev => prev + 1);
          
          // TODO: Aquí deberíamos actualizar asientosData directamente, pero por ahora forzamos refresh
          window.location.reload(); // Reload temporal hasta arreglar el state management
        }
      }
    } catch (error) {
      console.error('[MapaAsientos] Error al refrescar asientos:', error);
    }
  };

  // Auto-refresh cada 30 segundos para mantener sincronizado el estado
  useEffect(() => {
    const interval = setInterval(refreshSeatsState, 30000);
    return () => clearInterval(interval);
  }, [funcionId]);

  // Extraer información de la sala desde los datos del backend
  useEffect(() => {
    if (asientosData && asientosData.funcion && asientosData.funcion.sala) {
      const sala = asientosData.funcion.sala;
      if (typeof sala === 'object' && sala.nombre) {
        setSalaInfo(sala.nombre);
        console.log('[MapaAsientos] Información de sala obtenida:', sala.nombre);
      } else if (typeof sala === 'string') {
        setSalaInfo(sala);
      }
    }
  }, [asientosData]);

  const toggleSeat = (seatId, e) => {
    e.preventDefault(); // Prevenir cualquier comportamiento por defecto
    e.stopPropagation(); // Detener la propagación del evento
    
    setAlertMessage('');
    const asientoObj = asientosReal[seatId];
    
    // Verificación más estricta del estado del asiento
    if (!asientoObj) {
      console.warn(`[MapaAsientos] Asiento ${seatId} no encontrado en asientosReal`);
      setAlertMessage(`El asiento ${seatId} no está disponible.`);
      return;
    }
    
    // Verificar todos los estados posibles de no disponibilidad
    const estadosNoDisponibles = ['vendido', 'reservado', 'ocupado', 'mantenimiento'];
    if (asientoObj.estado !== 'disponible' || estadosNoDisponibles.includes(asientoObj.estado)) {
      console.warn(`[MapaAsientos] Asiento ${seatId} está en estado: ${asientoObj.estado}`);
      setAlertMessage(`El asiento ${seatId} ya está ocupado o no está disponible.`);
      return;
    }

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      setAlertMessage("Selecciona al menos un asiento para continuar.");
      return;
    }

    // Esperar a que termine de cargar la autenticación
    if (authLoading) {
      setAlertMessage("Verificando autenticación...");
      return;
    }

    // Verificar autenticación antes de continuar
    if (!token) {
      console.log('[MapaAsientos] Usuario no autenticado, redirigiendo al login');
      setAlertMessage("Debes iniciar sesión para continuar con la compra. Serás redirigido al login.");
      
      // Guardar el estado actual en sessionStorage para retomarlo después del login
      const reservationState = {
        funcionId,
        selectedSeats,
        selectedDay,
        selectedTime,
        movieTitle,
        movieId,
        returnUrl: window.location.pathname + window.location.search
      };
      
      sessionStorage.setItem('pendingReservation', JSON.stringify(reservationState));
      console.log('[MapaAsientos] Estado de reserva guardado:', reservationState);
      
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
      
      return;
    }

    console.log('[MapaAsientos] Usuario autenticado, agregando reserva al carrito');
    
    // Crear objeto de reserva con información completa de los asientos
    const selectedSeatsData = selectedSeats.map(seatName => {
      const asientoObj = asientosReal[seatName];
      return {
        _id: asientoObj ? asientoObj._id : seatName,
        codigo: seatName // El código visual (A1, B2, etc.)
      };
    });
    const reservationData = {
      funcionId,
      movieTitle,
      selectedDay,
      selectedTime,
      selectedSeats: selectedSeatsData,
      precio,
      idioma,
      sala: salaInfo || salaId || 'No especificada'
    };
    // Agregar al carrito
    addReservation(reservationData);
    
    // Mostrar mensaje de confirmación
    setAlertMessage(`¡Reserva agregada al carrito! ${selectedSeats.length} asiento(s) para ${movieTitle}`);
    
    // Redirigir a la cartelera para que pueda seguir comprando o ir al carrito
    setTimeout(() => {
      navigate('/cartelera', { replace: true });
    }, 1500);
  };

  const renderSeatRow = (rowLetter) => {
    return (
      <div key={rowLetter} className="d-flex justify-content-center mb-3 seat-row">
        {Array.from({ length: COLUMNS }, (_, i) => {
          const seatNumber = i + 1;
          const seatId = `${rowLetter}${seatNumber}`;
          
          // Buscar el asiento en diferentes formatos posibles
          let asiento = asientosReal[seatId]; // Formato "A1"
          if (!asiento) {
            // Buscar con formato "5-A1" o similar
            const altFormats = [
              `5-${seatId}`,
              `${rowLetter}${seatNumber}`,
              `${rowLetter}-${seatNumber}`,
            ];
            for (const format of altFormats) {
              if (asientosReal[format]) {
                asiento = asientosReal[format];
                break;
              }
            }
          }

          if (!asiento) {
            // Si no hay asiento real, crear uno temporal como no disponible
            asiento = {
              _id: seatId,
              nombre: seatId,
              estado: 'no-disponible'
            };
          }

          const isOccupied = asiento.estado !== 'disponible';
          const isSelected = selectedSeats.includes(seatId);

          let btnClass = 'btn seat-button';
          let isDisabled = false;
          
          // Debug del estado del asiento  
          console.log(`[MapaAsientos] Asiento ${seatId}:`, {
            estado: asiento.estado,
            estadoOriginal: asiento.originalData?.estadoFuncion,
            ocupado: isOccupied,
            seleccionado: isSelected
          });
          
          // Verificar si está ocupado (vendido, reservado, etc)
          if (isOccupied || asiento.estado === 'vendido' || asiento.estado === 'reservado') {
            btnClass += ' btn-danger disabled';
            isDisabled = true;
          } else if (isSelected) {
            btnClass += ' btn-success';
          } else {
            btnClass += ' btn-primary';
          }

          const spacingElement =
            seatNumber === 2 ? (
              <div key={`spacer-${seatId}`} className="pasillo-spacer d-none d-sm-block"></div>
            ) : null;

          return (
            <React.Fragment key={seatId}>
              <button
                className={`${btnClass} m-1`}
                onClick={(e) => !isDisabled && toggleSeat(seatId, e)}
                disabled={isDisabled}
                style={{
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.6 : 1
                }}
              >
                {seatId}
              </button>
              {spacingElement}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Manejo de estados de carga y error
  if (loading) {
    console.log('[MapaAsientos] ESTADO: Cargando...');
    return <div className="text-white text-center my-5">Cargando mapa de asientos...</div>;
  }

  if (error) {
    console.error('[MapaAsientos] ERROR:', error);
    return (
      <div className="container my-5 text-center">
        <div className="alert alert-danger" role="alert">
          <h4>Error al cargar asientos</h4>
          <p>No se pudieron cargar los asientos de la función. {error}</p>
          <p><strong>Endpoint consultado:</strong> {endpointUrl}</p>
          <p><strong>funcionId:</strong> {funcionId}</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate(`/detalle/${movieId}`, { replace: true })}
          >
            Volver a seleccionar función
          </button>
        </div>
      </div>
    );
  }

  console.log('[MapaAsientos] ESTADO: Datos cargados, verificando asientos...');
  console.log('[MapaAsientos] asientosReal contiene:', Object.keys(asientosReal).length, 'asientos');

  if (!asientosData || Object.keys(asientosReal).length === 0) {
    console.warn('[MapaAsientos] PROBLEMA: No hay asientos para mostrar');
    return (
      <div className="container my-5 text-center">
        <div className="alert alert-warning" role="alert">
          <h4>No hay asientos disponibles</h4>
          <p>No se encontraron asientos para esta función.</p>
          <p><strong>Endpoint consultado:</strong> {endpointUrl}</p>
          <p><strong>funcionId:</strong> {funcionId}</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate(`/detalle/${movieId}`, { replace: true })}
          >
            Volver a seleccionar función
          </button>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      {/* NAVBAR */}
      <Navbar 
        cartCount={selectedSeats.length} 
        showCartBadge={true} 
      />

      {/* CONTENIDO PRINCIPAL */}
      <div className="container my-5 content-wrapper page-content-offset mb-5">
        <h2 className="text-center mb-4 text-white">Selecciona tus asientos</h2>

        <div className="text-center text-secondary mb-3">
          <h3 className="mb-2">{movieTitle}</h3>
          <p>
            {selectedDay && selectedTime
              ? `${selectedDay} a las ${selectedTime}`
              : 'Fecha y hora no seleccionadas'}
          </p>
          {salaInfo && (
            <p className="text-info">
              <strong>Sala:</strong> {salaInfo} | <strong>Idioma:</strong> {idioma}
              {precio > 0 && <span> | <strong>Precio:</strong> ${precio}</span>}
            </p>
          )}
        </div>

        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="seats-grid">{SEAT_LAYOUT.map(renderSeatRow)}</div>

            {/* Leyenda de colores */}
            <div className="text-white mt-4 legend-container">
              <div className="seat-legend"><span className="seat-color bg-primary"></span>Disponible</div>
              <div className="seat-legend"><span className="seat-color bg-success"></span>Seleccionado</div>
              <div className="seat-legend"><span className="seat-color bg-danger"></span>Ocupado</div>
            </div>

            {/* Info de debug */}
            <div className="mt-3">
              <small className="text-secondary">
                🔍 Debug: función {funcionId} | {Object.keys(asientosReal).length} asientos cargados
                {process.env.NODE_ENV === 'development' && (
                  <><br/>endpoint: {endpointUrl}</>
                )}
              </small>
            </div>

            {/* Mensaje de alerta */}
            {alertMessage && (
              <div className="alert alert-warning mt-3" role="alert">
                {alertMessage}
              </div>
            )}

            {/* BOTÓN CONTINUAR */}
            <button
              onClick={handleContinue}
              className={`btn btn-lg mt-4 fw-bold ${
                authLoading
                  ? 'btn-secondary'
                  : !token 
                    ? 'btn-info' 
                    : selectedSeats.length === 0 
                      ? 'btn-secondary' 
                      : 'btn-success'
              }`}
              disabled={(selectedSeats.length === 0 && token) || authLoading}
            >
              {authLoading
                ? `Verificando autenticación... (${selectedSeats.length} asiento(s))`
                : !token 
                  ? `Iniciar sesión para continuar (${selectedSeats.length} asiento(s))`
                  : `Agregar al carrito (${selectedSeats.length} asiento(s))`
              }
            </button>
            
            {/* Información de precio */}
            {token && selectedSeats.length > 0 && precio > 0 && (
              <div className="alert alert-info mt-3" role="alert">
                <small>
                  <strong>Precio por asiento:</strong> ${precio.toFixed(2)} <br />
                  <strong>Total:</strong> ${(precio * selectedSeats.length).toFixed(2)}
                </small>
              </div>
            )}
            
            {/* Mensaje informativo para usuarios no autenticados */}
            {!authLoading && !token && (
              <div className="alert alert-info mt-3" role="alert">
                <small>
                  <i className="bi bi-info-circle me-2"></i>
                  Debes iniciar sesión para agregar asientos al carrito. 
                  Tu selección se guardará temporalmente.
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer bg-dark text-white text-center p-3">
        <p className="m-0">&copy; 2025 CINESOFT - Todos los derechos reservados</p>
      </footer>
    </React.Fragment>
  );
}

export default MapaAsientos;
