import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import './MapaAsientos.css';
import { useAuth } from '../../hooks/useAuth.js';

// --- Constantes de la Sala ---
const SEAT_LAYOUT = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const COLUMNS = 5;

const MOCK_ASIENTOS_DATA =
  SEAT_LAYOUT.flatMap(rowLetter =>
    Array.from({ length: COLUMNS }, (_, i) => ({
      _id: `${rowLetter}${i + 1}`,
      nombre: `${rowLetter}${i + 1}`,
      estado:
        (rowLetter === 'B' && i === 1) || (rowLetter === 'C' && i === 2)
          ? 'ocupado'
          : 'disponible', // Simula B2 y C3 ocupados
    }))
  );

function MapaAsientos() {
  const { id: funcionId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  // Obtener parámetros de la URL
  const selectedDay = searchParams.get('day');
  const selectedTime = searchParams.get('time');
  const movieTitleParam = searchParams.get('title');
  const rawMovieId = searchParams.get('movieId');
  const movieId = rawMovieId && rawMovieId.trim() !== '' ? rawMovieId : funcionId;
  const movieTitle = movieTitleParam ? decodeURIComponent(movieTitleParam) : 'Película Desconocida';

  const asientosData = MOCK_ASIENTOS_DATA;
  const loading = false;

  const [asientosReal, setAsientosReal] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (asientosData && asientosData.length > 0) {
      const asientosMap = asientosData.reduce((acc, asiento) => {
        acc[asiento.nombre] = asiento;
        return acc;
      }, {});
      setAsientosReal(asientosMap);
      setSelectedSeats([]);
    }
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
          const asiento = asientosReal[seatId];

          if (!asiento) return null;

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

  if (loading || Object.keys(asientosReal).length === 0)
    return <div className="text-white text-center my-5">Cargando mapa de asientos...</div>;

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
