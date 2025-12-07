import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { useCart } from '../../context/CartContext.jsx';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Carrito from '../Carrito/Carrito';
import './cartelera.css';

// Constantes de configuración
const API_URL = {
  PELICULAS: 'https://cine-web-api-tobi.vercel.app/api/peliculas',
  FUNCIONES: 'https://cine-web-api-tobi.vercel.app/api/funciones',
};

/**
 * Componente principal de la cartelera de cine
 */
const Cartelera = () => {
  // Estados
  const [currentSlide, setCurrentSlide] = useState(0);
  const [peliculasProximasSemana, setPeliculasProximasSemana] = useState([]);
  
  // Contexto del carrito
  const { reservations } = useCart();
  
  // Control del modal del carrito
  const [searchParams, setSearchParams] = useSearchParams();
  const showCarrito = searchParams.has('carrito');
  
  // Hooks para obtener datos
  const { 
    data: peliculas, 
    loading: loadingPeliculas, 
    error: errorPeliculas 
  } = useFetch(API_URL.PELICULAS);
  
  const { 
    data: funciones, 
    loading: loadingFunciones, 
    error: errorFunciones 
  } = useFetch(API_URL.FUNCIONES);
  
  // Handlers del carrito
  const handleShowCarrito = useCallback(() => {
    setSearchParams({ carrito: '1' });
  }, [setSearchParams]);
  
  const handleCloseCarrito = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);
  
  // Filtrar y ordenar películas con funciones próximas
  useEffect(() => {
    if (!peliculas?.length || !funciones?.length) return;
    
    const hoy = new Date();
    const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const proximaSemana = new Date(fechaHoy);
    proximaSemana.setDate(fechaHoy.getDate() + 7);
    
    // Filtrar funciones de la próxima semana
    const funcionesProximaSemana = funciones.filter(funcion => {
      if (!funcion.horario) return false;
      const fechaFuncion = new Date(funcion.horario);
      return fechaFuncion >= fechaHoy && fechaFuncion < proximaSemana;
    });
    
    // Obtener IDs únicos de películas con funciones próximas
    const peliculasIdsProximas = Array.from(
      new Set(
        funcionesProximaSemana.map(funcion => 
          typeof funcion.pelicula === 'object' 
            ? funcion.pelicula._id 
            : funcion.pelicula
        )
      )
    );
    
    // Filtrar y ordenar películas
    const peliculasFiltradas = peliculas
      .filter(pelicula => peliculasIdsProximas.includes(pelicula._id))
      .sort((a, b) => {
        const countA = funcionesProximaSemana.filter(f => 
          (typeof f.pelicula === 'object' ? f.pelicula._id : f.pelicula) === a._id
        ).length;
        
        const countB = funcionesProximaSemana.filter(f => 
          (typeof f.pelicula === 'object' ? f.pelicula._id : f.pelicula) === b._id
        ).length;
        
        return countB - countA;
      });
    
    setPeliculasProximasSemana(peliculasFiltradas);
  }, [peliculas, funciones]);
  
  // Funciones del carrusel
  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => 
      prev === peliculasProximasSemana.length - 1 ? 0 : prev + 1
    );
  }, [peliculasProximasSemana.length]);
  
  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => 
      prev === 0 ? peliculasProximasSemana.length - 1 : prev - 1
    );
  }, [peliculasProximasSemana.length]);
  
  // Datos derivados
  const isLoading = loadingPeliculas || loadingFunciones;
  const hasError = errorPeliculas || errorFunciones;
  const errorMessage = errorPeliculas?.message || errorFunciones?.message;
  
  // Preparar datos para la visualización
  const peliculasParaMostrar = useMemo(() => {
    if (!peliculas?.length) return [];
    return peliculas.length === 1 
      ? Array(12).fill(peliculas[0]) 
      : peliculas;
  }, [peliculas]);
  
  const primeraPelicula = peliculasParaMostrar[0] || null;
  
  // Componente de tarjeta de película
  const MovieCard = useCallback(({ pelicula, index }) => (
    <div 
      className="box-1"
      key={pelicula._id || `movie-dup-${index}`}
      role="article"
      aria-label={`Película: ${pelicula.titulo}`}
    >
      <div className="content">
        <img
          src={pelicula.poster}
          alt={`Póster de ${pelicula.titulo || 'película'}`}
          loading="lazy"
        />
        <h5 className="text-white mt-2">{pelicula.titulo || 'Sin Título'}</h5>
        <p className="text-secondary">{pelicula.genero || 'N/A'}</p>
        
        <Link 
          to={`/detalle/${pelicula._id || pelicula.id || 1}`} 
          className="btn btn-primary"
          aria-label={`Ver detalles de ${pelicula.titulo}`}
        >
          Detalles
        </Link>
      </div>
    </div>
  ), []);
  
  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="loading-container text-center mt-5 text-white">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando cartelera...</span>
        </div>
        <p className="mt-2">Cargando cartelera...</p>
      </div>
    );
  }
  
  if (hasError) {
    return (
      <div className="error-container text-center mt-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Error al cargar los datos: {errorMessage}. Por favor, verifica la conexión.
        </div>
        <button 
          className="btn btn-primary mt-3"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  if (!peliculas?.length) {
    return (
      <div className="empty-container text-center mt-5 text-white">
        <i className="bi bi-film display-4 d-block mb-3"></i>
        <p>No hay películas disponibles en este momento.</p>
      </div>
    );
  }
  
  return (
    <>
      {/* Navegación */}
      <Navbar 
        cartCount={reservations.length} 
        showCartBadge={true} 
        variant="fixed" 
      />
      
      {/* Header principal */}
      {primeraPelicula && (
        <header
          className="header"
          style={{ 
            backgroundImage: `
              linear-gradient(
                135deg, 
                rgba(0,0,0,0.7) 0%, 
                rgba(0,0,0,0.5) 50%, 
                rgba(0,0,0,0.8) 100%
              ), 
              url(${primeraPelicula.poster})
            `,
          }}
          role="banner"
          aria-label="Película destacada"
        >
          <div className="header-content container">
            <div className="row align-items-center g-4">
              <div className="col-lg-5">
                <img 
                  src={primeraPelicula.poster}
                  alt={primeraPelicula.titulo}
                  className="img-fluid rounded shadow-lg"
                  style={{ 
                    maxHeight: '500px', 
                    width: '100%', 
                    objectFit: 'cover' 
                  }}
                  loading="eager"
                />
              </div>
              <div className="col-lg-7">
                <h1 className="display-3 fw-bold text-white mb-3">
                  {primeraPelicula.titulo}
                </h1>
                
                <div className="movie-meta mb-4">
                  <p className="lead text-white-50 mb-2">
                    <i className="bi bi-film me-2" aria-hidden="true"></i>
                    <span className="sr-only">Género:</span>
                    {primeraPelicula.genero}
                  </p>
                  <p className="lead text-white-50 mb-2">
                    <i className="bi bi-clock me-2" aria-hidden="true"></i>
                    <span className="sr-only">Duración:</span>
                    {primeraPelicula.duracion} min
                  </p>
                  <p className="lead text-white-50 mb-3">
                    <i className="bi bi-star-fill me-2" aria-hidden="true"></i>
                    <span className="sr-only">Clasificación:</span>
                    {primeraPelicula.clasificacion}
                  </p>
                </div>
                
                <p 
                  className="text-white mb-4" 
                  style={{ fontSize: '1.1rem', lineHeight: '1.6' }}
                >
                  {primeraPelicula.sinopsis}
                </p>
                
                <div className="d-flex flex-wrap gap-3">
                  <Link 
                    to={`/detalle/${primeraPelicula._id || primeraPelicula.id || 1}`} 
                    className="btn btn-primary btn-lg"
                    aria-label={`Ver funciones de ${primeraPelicula.titulo}`}
                  >
                    <i className="bi bi-play-fill me-2" aria-hidden="true"></i>
                    Ver Funciones
                  </Link>
                  <button 
                    className="btn btn-outline-light btn-lg"
                    onClick={handleShowCarrito}
                    aria-label="Abrir carrito de compras"
                  >
                    <i className="bi bi-cart-plus me-2" aria-hidden="true"></i>
                    Carrito
                    {reservations.length > 0 && (
                      <span className="ms-1 badge bg-danger">
                        {reservations.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}
      
      {/* Carrusel de películas próximas */}
      {peliculasProximasSemana.length > 0 && (
        <section 
          className="carousel-section mt-5 mb-5"
          aria-label="Funciones de esta semana"
        >
          <h2 className="text-white text-center mb-4">
            Funciones de esta semana
          </h2>
          
          <div className="carousel-container position-relative">
            <div className="carousel-wrapper overflow-hidden">
              <div 
                className="carousel-track d-flex transition-transform"
                style={{ 
                  transform: `translateX(-${currentSlide * 100}%)`,
                }}
                role="list"
                aria-live="polite"
              >
                {peliculasProximasSemana.map((pelicula) => (
                  <div 
                    key={pelicula._id} 
                    className="carousel-slide flex-shrink-0 w-100"
                    role="listitem"
                  >
                    <div className="row align-items-center">
                      <div className="col-md-4">
                        <img 
                          src={pelicula.poster} 
                          alt={pelicula.titulo}
                          className="img-fluid rounded shadow"
                          style={{ 
                            maxHeight: '400px', 
                            width: '100%', 
                            objectFit: 'cover' 
                          }}
                          loading="lazy"
                        />
                      </div>
                      <div className="col-md-8 text-white">
                        <h3 className="mb-3">{pelicula.titulo}</h3>
                        
                        <div className="movie-info mb-4">
                          <p className="text-secondary mb-2">
                            <i className="bi bi-film" aria-hidden="true"></i>
                            {' '}{pelicula.genero}
                          </p>
                          <p className="text-secondary mb-2">
                            <i className="bi bi-clock" aria-hidden="true"></i>
                            {' '}{pelicula.duracion} min
                          </p>
                          <p className="text-secondary mb-2">
                            <i className="bi bi-star" aria-hidden="true"></i>
                            {' '}{pelicula.clasificacion}
                          </p>
                        </div>
                        
                        <p className="mb-4">{pelicula.sinopsis}</p>
                        
                        <Link 
                          to={`/detalle/${pelicula._id}`} 
                          className="btn btn-primary btn-lg"
                          aria-label={`Ver funciones de ${pelicula.titulo}`}
                        >
                          <i className="bi bi-play-fill" aria-hidden="true"></i>
                          {' '}Ver Funciones
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Controles del carrusel */}
            <button 
              className="carousel-btn carousel-btn-prev"
              onClick={prevSlide}
              aria-label="Película anterior"
              aria-controls="carousel-content"
            >
              <i className="bi bi-chevron-left" aria-hidden="true"></i>
            </button>
            
            <button 
              className="carousel-btn carousel-btn-next"
              onClick={nextSlide}
              aria-label="Siguiente película"
              aria-controls="carousel-content"
            >
              <i className="bi bi-chevron-right" aria-hidden="true"></i>
            </button>
            
            {/* Indicadores */}
            <div 
              className="carousel-indicators"
              role="tablist"
              aria-label="Seleccionar película"
            >
              {peliculasProximasSemana.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-indicator ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  role="tab"
                  aria-selected={index === currentSlide}
                  aria-label={`Ir a película ${index + 1}`}
                  tabIndex={index === currentSlide ? 0 : -1}
                ></button>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Grid de películas */}
      <section 
        className="movies"
        aria-label="Todas las películas disponibles"
      >
        <h2>Todas las Películas</h2>
        <hr />
        
        <div className="box-container-1">
          {peliculasParaMostrar.map((pelicula, index) => (
            <MovieCard 
              key={pelicula._id || `movie-${index}`} 
              pelicula={pelicula} 
              index={index} 
            />
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer" role="contentinfo">
        <div className="container">
          <p className="mb-2">&copy; {new Date().getFullYear()} CINESOFT - Todos los derechos reservados</p>
          <p className="text-secondary small">
            Las imágenes y contenido son propiedad de sus respectivos dueños.
          </p>
        </div>
      </footer>
      
      {/* Modal del carrito */}
      <Carrito 
        show={showCarrito} 
        handleClose={handleCloseCarrito} 
      />
    </>
  );
};

export default Cartelera;