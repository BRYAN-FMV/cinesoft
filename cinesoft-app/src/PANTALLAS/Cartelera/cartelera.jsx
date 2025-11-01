import { useFetch } from '../../hooks/useFetch'
import { useState } from 'react'
import { Link } from 'react-router-dom'; 
import './cartelera.css'

const INITIAL_COUNT = 4;
const LOAD_INCREMENT = 4;
const MAS_VISTAS_SIZE = 4;
const ACCION_SIZE = 4;
const ESTRENO_SIZE = 4;

const Cartelera = () => {
    const [visibleCount1, setVisibleCount1] = useState(INITIAL_COUNT);
    const [visibleCount2, setVisibleCount2] = useState(INITIAL_COUNT);
    const [visibleCount3, setVisibleCount3] = useState(INITIAL_COUNT);

    // quitado segundo argumento (hook ahora recibe solo la URL)
    const { data: peliculas, loading, error } = useFetch("http://localhost:3000/peliculas");

    const loadMore = (setCurrentCount, currentTotal) => {
        setCurrentCount(prevCount => Math.min(prevCount + LOAD_INCREMENT, currentTotal));
    };

    if (loading) return <div className="text-center mt-5 text-white">Cargando cartelera...</div>;
    if (error) return <div className="text-center mt-5 text-danger">Error: {error.message}. Verifica API.</div>;
    if (!peliculas || peliculas.length === 0) return <div className="text-center mt-5 text-white">No hay películas disponibles.</div>;

    let peliculasRepetidas = peliculas;
    if (peliculas.length === 1) {
        peliculasRepetidas = Array(12).fill(peliculas[0]);
    }

    const todasLasPeliculas = peliculasRepetidas;

    const primeraPelicula = todasLasPeliculas[0] || null;
    const peliculasMasVistas = todasLasPeliculas.slice(1, 1 + MAS_VISTAS_SIZE);
    const peliculasAccion = todasLasPeliculas.slice(1 + MAS_VISTAS_SIZE, 1 + MAS_VISTAS_SIZE + ACCION_SIZE);
    const peliculasEstreno = todasLasPeliculas.slice(1 + MAS_VISTAS_SIZE + ACCION_SIZE, 1 + MAS_VISTAS_SIZE + ACCION_SIZE + ESTRENO_SIZE);
    
    const headerBackgroundImage = primeraPelicula && primeraPelicula.poster ? primeraPelicula.poster : '';

    const MovieCard = ({ pelicula, boxClass, index }) => (
        // usar _id si existe, si no fallback al index
        <div key={pelicula._id ? pelicula._id : `movie-dup-${index}`} className={boxClass}> 
            <div className="content">
                <img
                    src={pelicula.poster}
                    alt={`Póster de ${pelicula.titulo || 'película'}`}
                />
                <h5 className="text-white mt-2">{pelicula.titulo || 'Sin Título'}</h5>
                <p className="text-secondary">{pelicula.genero || 'N/A'}</p>
                
                {/* enlace a /detalle/:id usando _id */}
                <Link to={`/detalle/${pelicula._id || pelicula.id || 1}`} className="btn btn-primary">Detalles</Link> 
            </div>
        </div>
    );

    return (
        <>
            {/* NAVBAR */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container-fluid">
                    <div className="container align-items-center"> 
                        <Link className="navbar-brand logo" to="/">CINESOFT</Link> 
                        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav">
                        <li className="nav-item"><a className="nav-link" href="#peliculas-populares">Cartelera</a></li>
                        <li className="nav-item"><a className="nav-link" href="#">Carrito</a></li>
                        </ul>

                        <ul className="navbar-nav ms-auto">
                        <li className="nav-item"><Link className="nav-link" to="/login">Iniciar sesión</Link></li>
                       <li className="nav-item"><Link className="nav-link" to="/register">Registro</Link></li>
                        </ul>
                    </div>

                    </div>
                </div>
            </nav>

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
                                {/* usar _id para el botón VER AHORA */}
                                <Link to={`/detalle/${primeraPelicula._id || primeraPelicula.id || 1}`} className="btn btn-primary me-3">VER AHORA</Link> 
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {/* SECCIÓN 1: MÁS VISTAS */}
            <section id="peliculas-populares" className="movies container">
                <h2>Películas más vistas</h2>
                <hr />
                <div className="box-container-1">
                    {peliculasMasVistas.slice(0, visibleCount1).map((pelicula, index) => (
                        <MovieCard pelicula={pelicula} boxClass="box-1" index={index} />
                    ))}
                </div>
                {visibleCount1 < peliculasMasVistas.length && (
                    <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <button onClick={() => loadMore(setVisibleCount1, peliculasMasVistas.length)} className="btn btn-primary">Cargar más</button>
                    </div>
                )}
            </section>

            {/* SECCIÓN 2: ACCIÓN */}
            <section className="movies container">
                <h2>Películas de Acción</h2>
                <hr />
                <div className="box-container-2">
                    {peliculasAccion.slice(0, visibleCount2).map((pelicula, index) => (
                        <MovieCard pelicula={pelicula} boxClass="box-2" index={index} />
                    ))}
                </div>
                {visibleCount2 < peliculasAccion.length && (
                    <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <button onClick={() => loadMore(setVisibleCount2, peliculasAccion.length)} className="btn btn-primary">Cargar más</button>
                    </div>
                )}
            </section>

            {/* SECCIÓN 3: ESTRENO */}
            <section className="movies container">
                <h2>Películas Estreno</h2>
                <hr />
                <div className="box-container-3">
                    {peliculasEstreno.slice(0, visibleCount3).map((pelicula, index) => (
                        <MovieCard pelicula={pelicula} boxClass="box-3" index={index} />
                    ))}
                </div>
                {visibleCount3 < peliculasEstreno.length && (
                    <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <button onClick={() => loadMore(setVisibleCount3, peliculasEstreno.length)} className="btn btn-primary">Cargar más</button>
                    </div>
                )}
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <p>&copy; 2025 CINESOFT - Todos los derechos reservados</p>
            </footer>
        </>
    );
};

export default Cartelera;