import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import './MapaAsientos.css';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';

// --- Constantes de la Sala ---
const SEAT_LAYOUT = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const COLUMNS = 5;

function MapaAsientos() {
  const { id: funcionId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  console.log('[MapaAsientos] funcionId recibido desde URL:', funcionId);

  // Obtener parámetros de la URL
  const selectedDay = searchParams.get('day');
  const selectedTime = searchParams.get('time');
  const movieTitleParam = searchParams.get('title');
  const rawMovieId = searchParams.get('movieId');
  const movieId = rawMovieId && rawMovieId.trim() !== '' ? rawMovieId : funcionId;
  const movieTitle = movieTitleParam ? decodeURIComponent(movieTitleParam) : 'Película Desconocida';

  console.log('[MapaAsientos] Parámetros URL:', { selectedDay, selectedTime, movieTitle, movieId });

  // Usar el endpoint real para obtener asientos de la función
  const endpointUrl = `http://localhost:3000/funciones/${funcionId}/asientos`;
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
              const asientoNormalizado = {
                _id: asiento._id,
                nombre: nombreAsiento,
                estado: asiento.estadoFuncion || 'disponible',
                fila: asiento.fila,
                numero: asiento.numero
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
          const asientoNormalizado = {
            _id: asiento._id || asiento.id,
            nombre: asiento.nombre || asiento.codigo || `${asiento.fila}${asiento.numero}` || asiento._id,
            estado: asiento.estado || asiento.estadoFuncion || 'disponible',
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

  const toggleSeat = (seatId, e) => {
    e.preventDefault(); // Prevenir cualquier comportamiento por defecto
    e.stopPropagation(); // Detener la propagación del evento
    
    setAlertMessage('');
    const asientoObj = asientosReal[seatId];
    if (!asientoObj || asientoObj.estado !== 'disponible') return;

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

    const seatsList = selectedSeats.join(',');

    // Navegación hacia la pantalla de Boletos
    const targetUrl = `/boletos/${funcionId}?seats=${seatsList}&day=${selectedDay}&time=${selectedTime}&title=${encodeURIComponent(movieTitle)}${movieId ? `&movieId=${movieId}` : ''}`;

    // Reemplazamos la entrada actual en el historial (evita duplicación)
    navigate(targetUrl, { replace: true });
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
          if (isOccupied) {
            btnClass += ' btn-danger disabled';
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
                onClick={(e) => !isOccupied && toggleSeat(seatId, e)}
                disabled={isOccupied}
              >
                {asiento.nombre || seatId}
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
      <nav className="navbar cinesoft-nav">
        <div className="container-fluid">
          <div className="container align-items-center d-flex position-relative">
            {/* BOTÓN ATRÁS (Corregido) */}
            <div className="me-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/detalle/${movieId}`, { replace: true });
                }}
                className="nav-btn-atras"
                aria-label="Atrás"
              >
                Atrás
              </button>
            </div>

            {/* LOGO */}
            <span className="navbar-brand logo me-auto">
              CINESOFT
            </span>

            {/* PERFIL */}
            <div className="d-flex align-items-center ms-auto">
              <Link 
                to="/perfil" 
                className="nav-btn-perfil" 
                aria-label="Perfil de usuario"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z" />
                  <path fillRule="evenodd" d="M8 8a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>

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

            {/* Mensaje de alerta */}
            {alertMessage && (
              <div className="alert alert-warning mt-3" role="alert">
                {alertMessage}
              </div>
            )}

            {/* BOTÓN CONTINUAR */}
            <button
              onClick={handleContinue}
              className="btn btn-warning btn-lg mt-4 fw-bold"
              disabled={selectedSeats.length === 0}
            >
              Continuar con la compra ({selectedSeats.length} asiento(s))
            </button>
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
