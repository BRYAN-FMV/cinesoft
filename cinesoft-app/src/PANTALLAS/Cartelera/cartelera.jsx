// src/PANTALLAS/Cartelera/Cartelera.jsx

import { useFetch } from '../../hooks/useFetch';
import { useCart } from '../../context/CartContext.jsx';
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom'; 
import Navbar from '../../components/Navbar/Navbar.jsx';
import Carrito from '../Carrito/Carrito'; // Importa el componente Carrito
import './cartelera.css';

// --- Constantes de configuración ---
const INITIAL_COUNT = 4;
const LOAD_INCREMENT = 4;
// ---------------------------------

const Cartelera = () => {
    // Estados para el carrusel
    const [currentSlide, setCurrentSlide] = useState(0);
    const [peliculasProximasSemana, setPeliculasProximasSemana] = useState([]);
    
    // Cart context
    const { reservations } = useCart();
    
    // 2. Estados y funciones para el Carrito
    // Usamos un query param (?carrito=1) para abrir el carrito sin cambiar de página
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const carritoParam = searchParams.get('carrito');
    // Derivamos visibilidad directamente del query param para que
    // cambie inmediatamente cuando se actualiza la URL (sin recarga).
    const showCarrito = !!carritoParam;

    const handleShowCarrito = () => {
        setSearchParams({ carrito: '1' });
    };

    const handleCloseCarrito = () => {
        // Eliminamos el query param sin forzar recarga completa
        setSearchParams({});
    };

    // 3. Hook para obtener datos
    const { data: peliculas, loading, error } = useFetch("https://cine-web-api-tobi.vercel.app/api/peliculas");
    const { data: funciones, loading: loadingFunciones } = useFetch("https://cine-web-api-tobi.vercel.app/api/funciones");

    // 4. Efecto para filtrar películas con funciones en la próxima semana
    useEffect(() => {
        if (peliculas && funciones && peliculas.length > 0 && funciones.length > 0) {
            // Usar solo la fecha (sin horas) para comparar
            const hoy = new Date();
            const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()); // Inicio del día de hoy
            const proximaSemana = new Date(fechaHoy);
            proximaSemana.setDate(fechaHoy.getDate() + 7); // 7 días desde hoy

            // Filtrar funciones de la próxima semana (solo futuras o de hoy)
            const funcionesProximaSemana = funciones.filter(funcion => {
                if (!funcion.horario) return false;
                const fechaFuncion = new Date(funcion.horario);
                return fechaFuncion >= fechaHoy && fechaFuncion < proximaSemana;
            });

            // Obtener IDs únicos de películas con funciones próximas
            const peliculasIdsProximas = [...new Set(funcionesProximaSemana.map(funcion => {
                return typeof funcion.pelicula === 'object' ? funcion.pelicula._id : funcion.pelicula;
            }))];
            
            // Filtrar películas que tienen funciones próximas
            const peliculasFiltradas = peliculas.filter(pelicula => 
                peliculasIdsProximas.includes(pelicula._id)
            );
            
            setPeliculasProximasSemana(peliculasFiltradas);
        }
    }, [peliculas, funciones]);

    // 5. Funciones del carrusel
    const nextSlide = () => {
        setCurrentSlide((prev) => 
            prev === peliculasProximasSemana.length - 1 ? 0 : prev + 1
        );
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => 
            prev === 0 ? peliculasProximasSemana.length - 1 : prev - 1
        );
    };

    // 6. Manejo de estados de carga/error
    if (loading || loadingFunciones) return <div className="text-center mt-5 text-white">Cargando cartelera...</div>;
    if (error) return <div className="text-center mt-5 text-danger">Error: {error.message}. Verifica API.</div>;
    if (!peliculas || peliculas.length === 0) return <div className="text-center mt-5 text-white">No hay películas disponibles.</div>;

    // 7. Lógica de filtrado y duplicación de películas
    let peliculasRepetidas = peliculas;
    if (peliculas.length === 1) {
        peliculasRepetidas = Array(12).fill(peliculas[0]);
    }

    const todasLasPeliculas = peliculasRepetidas;
    const primeraPelicula = todasLasPeliculas[0] || null;
    
    const headerBackgroundImage = primeraPelicula && primeraPelicula.poster ? primeraPelicula.poster : '';

    // 8. Componente de tarjeta de película
    const MovieCard = ({ pelicula, boxClass, index }) => (
        <div key={pelicula._id ? pelicula._id : `movie-dup-${index}`} className={boxClass}>
            <div className="content">
                <img
                    src={pelicula.poster}
                    alt={`Póster de ${pelicula.titulo || 'película'}`}
                />
                <h5 className="text-white mt-2">{pelicula.titulo || 'Sin Título'}</h5>
                <p className="text-secondary">{pelicula.genero || 'N/A'}</p>
                
                <Link to={`/detalle/${pelicula._id || pelicula.id || 1}`} className="btn btn-primary">Detalles</Link>
            </div>
        </div>
    );

    return (
        <>
            {/* NAVBAR */}
            <Navbar 
                cartCount={reservations.length} 
                showCartBadge={true} 
                variant="fixed" 
            />

            {/* HEADER */}
            {primeraPelicula && (
                <header
                    className="header"
                    style={{ backgroundImage: `url(${headerBackgroundImage})` }}
                >
                    <div className="header-content container">
                        <div className="header-1">
                        </div>
                        <div className="header-2">
                            <h1>Las mejores <br /> películas </h1>
                            <h4>Descubre las últimas novedades y los clásicos imperdibles en nuestra cartelera.</h4>
                            <div>
                                <Link to={`/detalle/${primeraPelicula._id || primeraPelicula.id || 1}`} className="btn btn-primary me-3">VER AHORA</Link>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {/* CARRUSEL DE PELÍCULAS CON FUNCIONES PRÓXIMAS */}
            {peliculasProximasSemana.length > 0 && (
                <section className="carousel-section mt-5 mb-5">
                    <h2 className="text-white text-center mb-4">Funciones de esta semana</h2>
                    <div className="carousel-container position-relative">
                        <div className="carousel-wrapper overflow-hidden">
                            <div 
                                className="carousel-track d-flex transition-transform"
                                style={{ 
                                    transform: `translateX(-${currentSlide * 100}%)`,
                                    transition: 'transform 0.3s ease-in-out'
                                }}
                            >
                                {peliculasProximasSemana.map((pelicula, index) => (
                                    <div key={pelicula._id} className="carousel-slide flex-shrink-0 w-100">
                                        <div className="row align-items-center">
                                            <div className="col-md-4">
                                                <img 
                                                    src={pelicula.poster} 
                                                    alt={pelicula.titulo}
                                                    className="img-fluid rounded shadow"
                                                    style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div className="col-md-8 text-white">
                                                <h3 className="mb-3">{pelicula.titulo}</h3>
                                                <p className="text-secondary mb-2">
                                                    <i className="bi bi-film"></i> {pelicula.genero}
                                                </p>
                                                <p className="text-secondary mb-2">
                                                    <i className="bi bi-clock"></i> {pelicula.duracion} min
                                                </p>
                                                <p className="text-secondary mb-2">
                                                    <i className="bi bi-star"></i> {pelicula.clasificacion}
                                                </p>
                                                <p className="mb-4">{pelicula.sinopsis}</p>
                                                <Link 
                                                    to={`/detalle/${pelicula._id}`} 
                                                    className="btn btn-primary btn-lg"
                                                >
                                                    <i className="bi bi-play-fill"></i> Ver Funciones
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Botones de navegación */}
                        <button 
                            className="carousel-btn carousel-btn-prev position-absolute"
                            onClick={prevSlide}
                            style={{
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.7)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '50px',
                                height: '50px',
                                color: 'white',
                                fontSize: '18px',
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        
                        <button 
                            className="carousel-btn carousel-btn-next position-absolute"
                            onClick={nextSlide}
                            style={{
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.7)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '50px',
                                height: '50px',
                                color: 'white',
                                fontSize: '18px',
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                        
                        {/* Indicadores */}
                        <div className="carousel-indicators text-center mt-3">
                            {peliculasProximasSemana.map((_, index) => (
                                <button
                                    key={index}
                                    className={`carousel-indicator ${index === currentSlide ? 'active' : ''}`}
                                    onClick={() => setCurrentSlide(index)}
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        margin: '0 5px',
                                        background: index === currentSlide ? '#007bff' : 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer'
                                    }}
                                ></button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FOOTER */}
            <footer className="footer">
                <p>&copy; 2025 CINESOFT - Todos los derechos reservados</p>
            </footer>

            {/* Componente CARRITO: se monta sobre la página y no oscurece el contenido */}
            <Carrito 
                show={showCarrito} 
                handleClose={handleCloseCarrito} 
            />
        </>
    );
};

export default Cartelera;