import { useFetch } from '../../hooks/useFetch'
import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom' // Importado useSearchParams
import { useCart } from '../../context/CartContext'
import Navbar from '../../components/Navbar/Navbar'
import './DetallePelicula.css'

function DetallePelicula() {
  const { id } = useParams()
  const { reservations } = useCart()
  
  const [searchParams] = useSearchParams(); // Obtenemos los parámetros de búsqueda de la URL
  const peliculaId = id; 
  
  // CORRECCIÓN 1: Validación robusta para evitar la llamada al backend con ID 'undefined'
  if (!id || id === 'undefined') return <div className="text-center">ID de película no especificado.</div>

  const { data, loading, error } = useFetch(`https://cine-web-api-tobi.vercel.app/api/peliculas/${id}`)

  // si por alguna razón el backend responde con array, tomamos el primer elemento
  const pelicula = Array.isArray(data) ? data[0] : data

  // --- Estados para selección de día/horario ---
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [horariosPorDia, setHorariosPorDia] = useState(null)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [errorHorarios, setErrorHorarios] = useState(null)
  
  // --- Nuevos estados para filtros de días ---
  const [dayFilter, setDayFilter] = useState('todos') // 'todos', 'hoy', 'weekend', 'semana'
  const [showAllDays, setShowAllDays] = useState(false) // Para mostrar/ocultar días adicionales

  // Manejadores de eventos robustos para prevenir recarga de página
  const handleFilterClick = (e, filterValue) => {
    e.preventDefault()
    e.stopPropagation()
    setDayFilter(filterValue)
  }

  const handleToggleAllDays = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowAllDays(!showAllDays)
  }

  const handleDaySelect = (e, dayIso, hasShowtimes) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasShowtimes) {
      setSelectedDay(dayIso)
    }
  }

  const handleTimeSelect = (e, hora) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedTime(hora)
  }

  // Manejador para evitar propagación de eventos del navbar
  const handleNavClick = (e) => {
    e.stopPropagation()
    // Permitir que el Link funcione normalmente, solo evitar propagación
  }

  // genera próximos N días (label en español) con más información
  const getNextDays = (n = 14) => { // Aumentado a 14 días para más opciones
    const days = []
    const today = new Date()
    for (let i = 0; i < n; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      // Usar fecha local en lugar de UTC
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const iso = `${year}-${month}-${day}`;
      
      // Etiquetas más descriptivas
      let label, shortLabel, dayType
      if (i === 0) {
        label = 'Hoy'
        shortLabel = 'Hoy'
        dayType = 'today'
      } else if (i === 1) {
        label = 'Mañana'
        shortLabel = 'Mañana'
        dayType = 'tomorrow'
      } else {
        label = d.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'short' 
        })
        shortLabel = d.toLocaleDateString('es-ES', { 
          weekday: 'short', 
          day: 'numeric' 
        })
        dayType = 'future'
      }
      
      // Detectar si es fin de semana
      const isWeekend = d.getDay() === 0 || d.getDay() === 6
      
      days.push({ 
        iso, 
        label, 
        shortLabel, 
        dayType, 
        isWeekend,
        fullDate: d
      })
    }
    return days
  }

  // Solo mostrar los próximos 7 días por defecto
  const dias = getNextDays(7)

  // Función para filtrar días según el filtro activo
  const getFilteredDays = () => {
    let filtered = []
    switch (dayFilter) {
      case 'hoy':
        filtered = dias.filter(d => d.dayType === 'today')
        break
      case 'mañana':
        filtered = dias.filter(d => d.dayType === 'today' || d.dayType === 'tomorrow')
        break
      case 'weekend':
        filtered = dias.filter(d => d.isWeekend)
        break
      case 'semana':
        filtered = dias.filter(d => !d.isWeekend)
        break
      case 'todos':
      default:
        // Mostrar todos los días cuando no hay datos o mostrar solo los que tienen funciones
        filtered = dias
        break
    }
    return filtered
  }

  // Función para obtener estadísticas de funciones por filtro
  const getFilterStats = () => {
    if (!horariosPorDia) return null
    
    const filtered = getFilteredDays()
    const diasConFunciones = filtered.filter(d => 
      horariosPorDia[d.iso] && horariosPorDia[d.iso].length > 0
    ).length
    const totalDias = filtered.length
    const totalFunciones = filtered.reduce((sum, d) => 
      sum + (horariosPorDia[d.iso]?.length || 0), 0
    )
    
    return { diasConFunciones, totalDias, totalFunciones }
  }

  // CORRECCIÓN 2: Efecto para restaurar la selección de día y hora desde la URL (al regresar)
  useEffect(() => {
    const dayParam = searchParams.get('day');
    const timeParam = searchParams.get('time');

    // Solo inicializa el día si viene en la URL y aún no se ha seleccionado
    if (dayParam && selectedDay === null) {
        setSelectedDay(dayParam);
    }
    // Solo inicializa la hora si viene en la URL y aún no se ha seleccionado
    if (timeParam && selectedTime === null) {
        setSelectedTime(timeParam);
    }
  }, [searchParams, selectedDay, selectedTime]); // Depende de searchParams y el estado actual


  // obtener funciones desde backend usando el endpoint implementado
  useEffect(() => {
    if (!id) return
    setLoadingHorarios(true)
    setErrorHorarios(null)
    
    // Usar el endpoint implementado: GET /funciones?pelicula=:id
    fetch(`https://cine-web-api-tobi.vercel.app/api/funciones?pelicula=${id}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}: No se pudieron cargar las funciones`)
        }
        return res.json()
      })
      .then((funciones) => {
        if (!Array.isArray(funciones)) {
          throw new Error("El endpoint debe devolver un array de funciones")
        }

        if (funciones.length === 0) {
          setHorariosPorDia({})
          return
        }

        // Filtrar solo funciones futuras o de hoy (no pasadas)
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        const fechaHoyString = `${year}-${month}-${day}`;
        
        const funcionesFuturas = funciones.filter((funcion) => {
          const fechaFuncion = new Date(funcion.horario);
          const yearF = fechaFuncion.getFullYear();
          const monthF = String(fechaFuncion.getMonth() + 1).padStart(2, '0');
          const dayF = String(fechaFuncion.getDate()).padStart(2, '0');
          const fechaFuncionString = `${yearF}-${monthF}-${dayF}`;
          return fechaFuncionString >= fechaHoyString;
        });

        if (funcionesFuturas.length === 0) {
          setHorariosPorDia({})
          return
        }

        // Procesar funciones y agrupar por día
        const map = {}
        funcionesFuturas.forEach((funcion) => {
          const fechaHorario = new Date(funcion.horario)
          // Usar fecha local en lugar de UTC
          const yearF = fechaHorario.getFullYear();
          const monthF = String(fechaHorario.getMonth() + 1).padStart(2, '0');
          const dayF = String(fechaHorario.getDate()).padStart(2, '0');
          const day = `${yearF}-${monthF}-${dayF}`; // "2025-12-06"
          const time = fechaHorario.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
          
          if (!map[day]) map[day] = []
          
          // Crear objeto con información completa de la función
          const funcionInfo = {
            hora: time,
            precio: funcion.precio || 0,
            idioma: funcion.idioma || 'No especificado',
            sala: funcion.sala,
            funcionId: funcion._id,
            horarioCompleto: funcion.horario
          }
          
          map[day].push(funcionInfo)
        })
        
        // Ordenar funciones por hora para cada día
        Object.keys(map).forEach(day => {
          map[day].sort((a, b) => a.hora.localeCompare(b.hora))
        })
        
        setHorariosPorDia(map)
        
        // Autoseleccionar el primer día con funciones en los próximos 7 días si no hay día seleccionado
        if (!selectedDay) {
          const diasConFunciones = Object.keys(map).filter(dia => dias.some(d => d.iso === dia))
          if (diasConFunciones.length > 0) {
            const hoyDate = new Date();
            const yearH = hoyDate.getFullYear();
            const monthH = String(hoyDate.getMonth() + 1).padStart(2, '0');
            const dayH = String(hoyDate.getDate()).padStart(2, '0');
            const hoy = `${yearH}-${monthH}-${dayH}`;
            const diaInicial = diasConFunciones.includes(hoy) ? hoy : diasConFunciones[0]
            setSelectedDay(diaInicial)
          }
        }
      })
      .catch((err) => {
        console.error('[DetallePelicula] Error cargando funciones:', err)
        setErrorHorarios(err.message)
        
        // Solo mostrar fallback si no hay funciones reales
        const defaultSlots = [
          { hora: "12:00", precio: 8500, idioma: "Español" },
          { hora: "15:30", precio: 8500, idioma: "Español" },
          { hora: "18:00", precio: 10000, idioma: "Español" },
          { hora: "21:00", precio: 10000, idioma: "Subtitulado" }
        ]
        const map = {}
        dias.forEach(d => { map[d.iso] = [...defaultSlots] })
        setHorariosPorDia(map)
      })
      .finally(() => {
        setLoadingHorarios(false)
      })

  }, [id])

  // cuando cambia el día, limpiar horario seleccionado
  useEffect(() => {
    setSelectedTime(null)
  }, [selectedDay])

  // cuando cambia el filtro de días, verificar si el día seleccionado sigue siendo válido
  useEffect(() => {
    if (selectedDay && dayFilter !== 'todos') {
      const filteredDays = getFilteredDays()
      const isDayStillVisible = filteredDays.some(d => d.iso === selectedDay)
      if (!isDayStillVisible) {
        // Si el día seleccionado ya no es visible, seleccionar el primer día del filtro
        const firstAvailableDay = filteredDays.find(d => 
          horariosPorDia && horariosPorDia[d.iso] && horariosPorDia[d.iso].length > 0
        )
        setSelectedDay(firstAvailableDay?.iso || null)
      }
    }
  }, [dayFilter, horariosPorDia])

  if (loading) return <div>Cargando detalles...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!pelicula) return <div>No se encontró la película.</div>

  const availableTimes = horariosPorDia ? (horariosPorDia[selectedDay] || []) : []

  // LINEA 111: SE OBTIENE EL TÍTULO DE LA PELÍCULA
  const movieTitle = pelicula.titulo || pelicula.title || 'Película sin Título';



  return (
    <>
      <Navbar cartCount={reservations.length} showCartBadge={true} />

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
            <h1>{movieTitle}</h1>
            <p><strong>Género:</strong> {pelicula.genero || pelicula.genre || 'N/A'}</p>
            <p><strong>Director:</strong> {pelicula.director || 'N/A'}</p>
            <p><strong>Duración:</strong> {pelicula.duracion ? `${pelicula.duracion} min` : 'N/A'}</p>
            <p><strong>Clasificación:</strong> {pelicula.clasificacion || 'N/A'}</p>
            <h4>Sinopsis</h4>
            <p>{pelicula.sinopsis || 'N/A'}</p>

            {/* --- Selección de día y horarios --- */}
            <hr />
            <div 
              className="filters-section" 
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
            >
              <h4>Selecciona día</h4>
              
              {/* Filtros de días */}
              <div className="day-filters" style={{ marginBottom: '16px' }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <small className="text-muted">Filtrar por:</small>
                  <small className="text-muted">
                    {dayFilter === 'todos' ? 'Mostrando todos los días' : 
                     dayFilter === 'hoy' ? 'Solo funciones de hoy' :
                     dayFilter === 'mañana' ? 'Hoy y mañana' :
                     dayFilter === 'weekend' ? 'Solo fines de semana' :
                     'Solo días entre semana'}
                  </small>
                </div>
                
                <div className="btn-group" role="group" aria-label="Filtros de días">
                  <span
                    role="button"
                    tabIndex={0}
                    className={`btn btn-sm user-select-none ${dayFilter === 'todos' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={(e) => handleFilterClick(e, 'todos')}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterClick(e, 'todos')}
                    style={{ cursor: 'pointer', display: 'inline-block' }}
                  >
                    Todos
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className={`btn btn-sm user-select-none ${dayFilter === 'hoy' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={(e) => handleFilterClick(e, 'hoy')}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterClick(e, 'hoy')}
                    style={{ cursor: 'pointer', display: 'inline-block' }}
                  >
                    Hoy
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className={`btn btn-sm user-select-none ${dayFilter === 'mañana' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={(e) => handleFilterClick(e, 'mañana')}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterClick(e, 'mañana')}
                    style={{ cursor: 'pointer', display: 'inline-block' }}
                  >
                    Hoy/Mañana
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className={`btn btn-sm user-select-none ${dayFilter === 'weekend' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={(e) => handleFilterClick(e, 'weekend')}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterClick(e, 'weekend')}
                    style={{ cursor: 'pointer', display: 'inline-block' }}
                  >
                    🎉 Fin de Semana
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className={`btn btn-sm user-select-none ${dayFilter === 'semana' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={(e) => handleFilterClick(e, 'semana')}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterClick(e, 'semana')}
                    style={{ cursor: 'pointer', display: 'inline-block' }}
                  >
                    📅 Entre Semana
                  </span>
                </div>
                
                {/* Botón para mostrar más días */}
                {dayFilter === 'todos' && (
                  <div style={{ marginTop: '8px' }}>
                    <span
                      role="button"
                      tabIndex={0}
                      className="btn btn-link btn-sm p-0 user-select-none"
                      onClick={handleToggleAllDays}
                      onKeyDown={(e) => e.key === 'Enter' && handleToggleAllDays(e)}
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                    >
                      {showAllDays ? '▲ Mostrar menos días' : '▼ Mostrar más días (2 semanas)'}
                    </span>
                  </div>
                )}

                {/* Estadísticas del filtro */}
                {(() => {
                  const stats = getFilterStats()
                  if (stats && stats.totalDias > 0) {
                    return (
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '0.85rem', 
                        color: '#666',
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap'
                      }}>
                        <span>📅 {stats.diasConFunciones}/{stats.totalDias} días con funciones</span>
                        {stats.totalFunciones > 0 && (
                          <span>🎬 {stats.totalFunciones} funciones disponibles</span>
                        )}
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="days-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {getFilteredDays().map(d => {
                  const hasShowtimes = horariosPorDia && horariosPorDia[d.iso] && horariosPorDia[d.iso].length > 0
                  return (
                    <span
                      key={d.iso}
                      role="button"
                      tabIndex={hasShowtimes ? 0 : -1}
                      className={`btn btn-day user-select-none ${selectedDay === d.iso ? 'btn-primary' : 'btn-outline-secondary'} ${!hasShowtimes ? 'disabled' : ''}`}
                      onClick={(e) => handleDaySelect(e, d.iso, hasShowtimes)}
                      onKeyDown={(e) => e.key === 'Enter' && hasShowtimes && handleDaySelect(e, d.iso, hasShowtimes)}
                      style={{ 
                        minWidth: '100px',
                        position: 'relative',
                        cursor: hasShowtimes ? 'pointer' : 'not-allowed',
                        display: 'inline-block'
                      }}
                    >
                      <div>
                        <strong>{d.shortLabel}</strong>
                        {d.isWeekend && <span style={{ fontSize: '0.7rem' }}> 🎉</span>}
                      </div>
                      {!hasShowtimes && (
                        <small style={{ color: '#999', fontSize: '0.7rem' }}>Sin funciones</small>
                      )}
                    </span>
                  )
                })}
              </div>

              <h4>Horarios disponibles</h4>
              {loadingHorarios ? (
                <div className="alert alert-info">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Cargando funciones...
                  </div>
                </div>
              ) : errorHorarios ? (
                <div className="alert alert-warning" role="alert">
                  <strong>⚠️ {errorHorarios}</strong>
                  <br />
                  <small>Mostrando horarios de ejemplo mientras tanto.</small>
                  <details className="mt-2">
                    <summary style={{ cursor: 'pointer' }}>Información técnica</summary>
                    <small>Endpoint consultado: <code>GET /funciones?pelicula={id}</code></small>
                  </details>
                </div>
              ) : null}
                <div className="times-grid">
                  {availableTimes && availableTimes.length > 0 ? (
                    availableTimes.map((funcion, index) => {
                      // Manejar tanto objetos completos como strings simples para compatibilidad
                      const hora = typeof funcion === 'object' ? funcion.hora : funcion;
                      const precio = typeof funcion === 'object' ? funcion.precio : null;
                      const idioma = typeof funcion === 'object' ? funcion.idioma : null;
                      const funcionId = typeof funcion === 'object' ? funcion.funcionId : null;
                      
                      const isSelected = selectedTime === hora;
                      
                      return (
                        <span
                          key={funcionId || `${hora}-${index}`}
                          role="button"
                          tabIndex={0}
                          className={`funcion-button user-select-none ${isSelected ? 'selected' : ''}`}
                          onClick={(e) => handleTimeSelect(e, hora)}
                          onKeyDown={(e) => e.key === 'Enter' && handleTimeSelect(e, hora)}
                          style={{ cursor: 'pointer', display: 'inline-block' }}
                        >
                          <div className="funcion-hora">{hora}</div>
                          {precio && (
                            <div className="funcion-precio">
                              ${precio.toLocaleString()}
                            </div>
                          )}
                          {idioma && (
                            <div className="funcion-idioma">
                              {idioma}
                            </div>
                          )}
                        </span>
                      );
                    })
                  ) : !loadingHorarios && !errorHorarios && horariosPorDia && Object.keys(horariosPorDia).length === 0 ? (
                    <div className="alert alert-info">
                      <h6>📅 No hay funciones programadas</h6>
                      <p className="mb-0">Esta película aún no tiene funciones programadas. <br />
                      <small>Los horarios se mostrarán cuando el administrador configure las funciones.</small></p>
                    </div>
                  ) : (
                    <div>No hay horarios para este día.</div>
                  )}
                </div>              <div style={{ marginTop: '12px' }}>
                <strong>Selección actual:</strong>
                <div className="seleccion-info">
                  <div>
                    <strong>Día:</strong> {selectedDay ? new Date(selectedDay).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'No seleccionado'}
                  </div>
                  {selectedTime && (
                    <>
                      <div className="seleccion-info-item">
                        <strong>Horario:</strong> {selectedTime}
                      </div>
                      {availableTimes && (() => {
                        const funcionSeleccionada = availableTimes.find(f => 
                          (typeof f === 'object' ? f.hora : f) === selectedTime
                        );
                        if (funcionSeleccionada && typeof funcionSeleccionada === 'object') {
                          return (
                            <>
                              <div className="seleccion-info-item">
                                <strong>Precio:</strong> <span className="precio-destacado">L.{funcionSeleccionada.precio?.toLocaleString()}</span>
                              </div>
                              <div className="seleccion-info-item">
                                <strong>Idioma:</strong> {funcionSeleccionada.idioma}
                              </div>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                {/* REEMPLAZO DEL BOTÓN POR EL LINK DE NAVEGACIÓN */}
                <Link 
                  to={(() => {
                    // Buscar la función seleccionada para obtener su ID
                    let funcionId = peliculaId; // Fallback al ID de película
                    
                    if (availableTimes && selectedTime) {
                      const funcionSeleccionada = availableTimes.find(f => 
                        (typeof f === 'object' ? f.hora : f) === selectedTime
                      );
                      
                      if (funcionSeleccionada && typeof funcionSeleccionada === 'object') {
                        funcionId = funcionSeleccionada.funcionId || funcionSeleccionada._id || peliculaId;
                      }
                    }
                    
                    // Construir URL con el ID de la función
                    const baseUrl = `/asientos/${funcionId}`;
                    const params = new URLSearchParams({
                      day: selectedDay || '',
                      time: selectedTime || '',
                      title: movieTitle,
                      movieId: peliculaId
                    });
                    
                    // Agregar información adicional de la función si está disponible
                    if (availableTimes && selectedTime) {
                      const funcionSeleccionada = availableTimes.find(f => 
                        (typeof f === 'object' ? f.hora : f) === selectedTime
                      );
                      if (funcionSeleccionada && typeof funcionSeleccionada === 'object') {
                        if (funcionSeleccionada.precio) params.set('precio', funcionSeleccionada.precio.toString());
                        if (funcionSeleccionada.idioma) params.set('idioma', funcionSeleccionada.idioma);
                        if (funcionSeleccionada.funcionId) params.set('funcionId', funcionSeleccionada.funcionId);
                        if (funcionSeleccionada.sala) params.set('salaId', funcionSeleccionada.sala);
                      }
                    }
                    
                    return `${baseUrl}?${params.toString()}`;
                  })()} 
                  
                  className={`btn btn-lg ${!selectedDay || !selectedTime ? 'btn-secondary disabled' : 'btn-success'}`}
                  
                  aria-disabled={!selectedDay || !selectedTime}
                  style={!selectedDay || !selectedTime ? { pointerEvents: 'none' } : {}}
                >
                 Reservar Asientos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


export default DetallePelicula
