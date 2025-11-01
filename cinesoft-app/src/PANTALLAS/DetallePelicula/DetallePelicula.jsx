import { useFetch } from '../../hooks/useFetch'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import './DetallePelicula.css'

function DetallePelicula() {
  const { id } = useParams()
  if (!id) return <div className="text-center">ID de película no especificado.</div>

  const { data, loading, error } = useFetch(`http://localhost:3000/peliculas/${id}`)

  useEffect(() => {
    console.log('[DetallePelicula] /peliculas/:id ->', data)
  }, [data])

  // si por alguna razón el backend responde con array, tomamos el primer elemento
  const pelicula = Array.isArray(data) ? data[0] : data

  // --- Nuevos estados para selección de día/horario ---
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [horariosPorDia, setHorariosPorDia] = useState(null)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [errorHorarios, setErrorHorarios] = useState(null)

  // genera próximos N días (label en español)
  const getNextDays = (n = 7) => {
    const days = []
    const today = new Date()
    for (let i = 0; i < n; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const iso = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
      days.push({ iso, label })
    }
    return days
  }

  const dias = getNextDays(7)

  // intenta obtener horarios desde backend /peliculas/:id/horarios
  useEffect(() => {
    if (!id) return
    setLoadingHorarios(true)
    setErrorHorarios(null)
    fetch(`http://localhost:3000/peliculas/${id}/horarios`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((result) => {
        // aceptar varias formas:
        // 1) { "2025-10-31": ["12:00","15:00"], ... }
        // 2) ["2025-10-31T20:00:00.000Z", "2025-10-31T22:30:00.000Z", ...]
        // 3) ["12:00","15:00"] -> mismos horarios todos los días

        if (Array.isArray(result)) {
          // Si son strings ISO con "T", convertirlas en fechas legibles agrupadas por día
          if (result.length > 0 && typeof result[0] === "string" && result[0].includes("T")) {
            const map = {}
            result.forEach((iso) => {
              const date = new Date(iso)
              const day = date.toISOString().slice(0, 10) // "2025-10-31"
              const time = date.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })
              if (!map[day]) map[day] = []
              map[day].push(time)
            })
            setHorariosPorDia(map)
          } else {
            // Si son solo horas (sin fechas ISO), aplicarlas a todos los días
            const map = {}
            dias.forEach(d => { map[d.iso] = result })
            setHorariosPorDia(map)
          }
        } else if (result && typeof result === "object") {
          // Si ya viene agrupado por día
          setHorariosPorDia(result)
        } else {
          throw new Error("Formato de horarios no válido")
        }
      })
      .catch(() => {
        // fallback: horarios por defecto si no hay endpoint o formato incorrecto
        const defaultSlots = ["12:00", "15:30", "18:00", "21:00"]
        const map = {}
        dias.forEach(d => { map[d.iso] = defaultSlots })
        setHorariosPorDia(map)
      })
      .finally(() => {
        setLoadingHorarios(false)
        if (!selectedDay) setSelectedDay(dias[0].iso)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // cuando cambia el día, limpiar horario seleccionado
  useEffect(() => {
    setSelectedTime(null)
  }, [selectedDay])

  if (loading) return <div>Cargando detalles...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!pelicula) return <div>No se encontró la película.</div>

  const availableTimes = horariosPorDia ? (horariosPorDia[selectedDay] || []) : []

  const handleReserva = () => {
    if (!selectedDay || !selectedTime) return alert('Selecciona día y horario.')
    // aquí puedes realizar POST a /reservas o llevar al flujo de compra
    console.log('Reservar:', { peliculaId: pelicula._id || id, dia: selectedDay, hora: selectedTime })
    alert(`Reserva: ${pelicula.titulo} - ${selectedDay} ${selectedTime}`)
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <div className="container align-items-center d-flex">
            {/* BOTÓN ATRÁS en la izquierda */}
            <div className="me-3">
              <Link to="/" className="btn-link" aria-label="Atrás">Atrás</Link>
            </div>

            {/* LOGO / TITULO */}
            <Link className="navbar-brand logo me-auto" to="/">CINESOFT</Link>

            {/* Espacio y botones de la derecha */}
            <div className="d-flex align-items-center ms-auto">
              {/* Icono registro/inicio sesión */}
              <Link to="/auth" className="btn-link icon-btn" aria-label="Iniciar sesión / Registrarse" style={{ gap: '8px' }}>
                {/* icono simple de usuario (SVG) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z"/>
                  <path fillRule="evenodd" d="M8 8a3 3 0 100-6 3 3 0 000 6z"/>
                </svg>
                <span className="d-none d-sm-inline"></span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="detalle-container">
        <div className="detalle-card">
          <div className="poster-section">
            {pelicula.poster ? (
              <img src={pelicula.poster} alt={`Póster de ${pelicula.titulo || 'película'}`} />
            ) : (
              <div className="poster-placeholder">Sin póster</div>
            )}
          </div>

          <div className="info-section">
            <h1>{pelicula.titulo || pelicula.title || 'Sin título'}</h1>
            <p><strong>Género:</strong> {pelicula.genero || pelicula.genre || 'N/A'}</p>
            <p><strong>Director:</strong> {pelicula.director || 'N/A'}</p>
            <p><strong>Duración:</strong> {pelicula.duracion ? `${pelicula.duracion} min` : 'N/A'}</p>
            <p><strong>Clasificación:</strong> {pelicula.clasificacion || 'N/A'}</p>
            <h4>Sinopsis</h4>
            <p>{pelicula.sinopsis || 'N/A'}</p>

            {/* --- Selección de día y horarios --- */}
            <hr />
            <div>
              <h4>Selecciona día</h4>
              <div className="days-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {dias.map(d => (
                  <button
                    key={d.iso}
                    className={`btn btn-sm ${selectedDay === d.iso ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setSelectedDay(d.iso)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <h4>Horarios disponibles</h4>
              {loadingHorarios ? (
                <div>Cargando horarios...</div>
              ) : errorHorarios ? (
                <div className="text-danger">Error cargando horarios</div>
              ) : (
                <div className="times-grid" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {availableTimes && availableTimes.length > 0 ? (
                    availableTimes.map((t) => (
                      <button
                        key={t}
                        className={`btn btn-sm ${selectedTime === t ? 'btn-success' : 'btn-outline-primary'}`}
                        onClick={() => setSelectedTime(t)}
                      >
                        {t}
                      </button>
                    ))
                  ) : (
                    <div>No hay horarios para este día.</div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <strong>Seleccionado:</strong>{' '}
                {selectedDay ? new Date(selectedDay).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : ' — '}
                {' '} {selectedTime ? `— ${selectedTime}` : ''}
              </div>

              <div style={{ marginTop: '12px' }}>
                <button className="btn-link" onClick={handleReserva} disabled={!selectedDay || !selectedTime}>Reservar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DetallePelicula
