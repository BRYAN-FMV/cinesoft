import { useFetch } from '../hooks/useFetch'
import { useState } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/vite.svg'
import './DetallePelicula.css'

function DetallePelicula() {
 
  const { data, loading, error } = useFetch('http://localhost:3000/peliculas');

  if (loading) return <div>Cargando películas...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <>
      {/* Sección para mostrar las películas */}
      <div className="movies-section">
        <h2>Películas disponibles:</h2>
        {data && data.length > 0 ? (
          <div className="movies-grid">
            {data.map((pelicula, index) => (
              <div key={index} className="movie-card">
                {/* Póster de la película */}
                <div className="movie-poster">
                  {pelicula.poster ? (
                    <img 
                      src={pelicula.poster} 
                      alt={`Póster de ${pelicula.titulo || 'película'}`}
                      className="poster-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="poster-placeholder" style={{display: pelicula.poster ? 'none' : 'flex'}}>
                    <span>Sin póster</span>
                  </div>
                </div>
                
                {/* Información de la película */}
                <div className="movie-info">
                  <h3>{pelicula.titulo || pelicula.title || 'Sin título'}</h3>
                  <p><strong>Género:</strong> {pelicula.genero || pelicula.genre || 'N/A'}</p>
                  <p><strong>Director:</strong> {pelicula.director || 'N/A'}</p>
                  <p><strong>Duración:</strong> {pelicula.duracion ? `${pelicula.duracion} min` : 'N/A'}</p>
                  <p><strong>Clasificación:</strong> {pelicula.clasificacion || 'N/A'}</p>
                  <p className="sinopsis"><strong>Sinopsis:</strong> {pelicula.sinopsis || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay películas disponibles</p>
        )}
      </div>
    </>
  )
}


export default DetallePelicula
