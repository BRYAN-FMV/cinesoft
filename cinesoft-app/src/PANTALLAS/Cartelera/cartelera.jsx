import { useFetch } from '../../hooks/useFetch'
import { useState } from 'react'
import { Link } from 'react-router-dom'; 
import './cartelera.css'

const INITIAL_COUNT = 4;
const LOAD_INCREMENT = 4;

const Cartelera = () => {
    const [visibleCount1, setVisibleCount1] = useState(INITIAL_COUNT);
    const [visibleCount2, setVisibleCount2] = useState(INITIAL_COUNT);
    const [visibleCount3, setVisibleCount3] = useState(INITIAL_COUNT);

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

    const todasLasPeliculas = peliculasRepetidas.length > 13 ? peliculasRepetidas.slice(0, 13) : peliculasRepetidas;

    const primeraPelicula = todasLasPeliculas[0];
    const peliculasMasVistas = todasLasPeliculas.slice(1, 5);
    const peliculasAccion = todasLasPeliculas.slice(5, 9);
    const peliculasEstreno = todasLasPeliculas.slice(9, 13);
    
    const headerBackgroundImage = primeraPelicula && primeraPelicula.poster ? primeraPelicula.poster : '';


    const MovieCard = ({ pelicula, boxClass, index }) => (
        <div key={pelicula.id ? pelicula.id : `movie-dup-${index}`} className={boxClass}> 
            <div className="content">
                <img
                    src={pelicula.poster}
                    alt={`Póster de ${pelicula.titulo || 'película'}`}
                />
                <h5 className="text-white mt-2">{pelicula.titulo || 'Sin Título'}</h5>
                <p className="text-secondary">{pelicula.genero || 'N/A'}</p>
                
                <Link to={`/detalle/${pelicula.id || 1}`} className="btn btn-primary">Detalles</Link> 
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
                            <ul className="navbar-nav ms-auto">
                                <li className="nav-item"><a className="nav-link" href="#peliculas-populares">Cartelera</a></li>
                                <li className="nav-item"><a className="nav-link" href="#">Carrito</a></li>
                                <li className="nav-item"><a className="nav-link" href="#">Login</a></li>
                                <li className="nav-item"><a className="nav-link" href="#">Registro</a></li>
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
                                <Link to={`/detalle/${primeraPelicula.id || 1}`} className="btn btn-primary me-3">VER AHORA</Link> 
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
                        <MovieCard key={index} pelicula={pelicula} boxClass="box-1" index={index} />
                    ))}
                </div>
            </section>

            {/* SECCIÓN 2: ACCIÓN */}
            <section className="movies container">
                <h2>Películas de Acción</h2>
                <hr />
                <div className="box-container-2">
                    {peliculasAccion.slice(0, visibleCount2).map((pelicula, index) => (
                        <MovieCard key={index} pelicula={pelicula} boxClass="box-2" index={index} />
                    ))}
                </div>
            </section>

            {/* SECCIÓN 3: ESTRENO */}
            <section className="movies container">
                <h2>Películas Estreno</h2>
                <hr />
                <div className="box-container-3">
                    {peliculasEstreno.slice(0, visibleCount3).map((pelicula, index) => (
                        <MovieCard key={index} pelicula={pelicula} boxClass="box-3" index={index} />
                    ))}
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <p>&copy; 2025 CINESOFT - Todos los derechos reservados</p>
            </footer>
        </>
    );
};

export default Cartelera;