import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [animationStep, setAnimationStep] = useState(1);

  useEffect(() => {
    const stepTimer = setTimeout(() => setAnimationStep(2), 900);
    const stepTimer2 = setTimeout(() => setAnimationStep(3), 1800);
    const stepTimer3 = setTimeout(() => setAnimationStep(4), 2600);

    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1000);
    }, 4500);

    return () => {
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${!isAnimating ? 'fade-out' : ''}`}>

      {/* Fondo con partículas */}
      <div className="particle-background">
        {[...Array(18)].map((_, i) => (
          <div key={i} className="particle" style={{
            '--i': i,
            '--delay': `${i * 0.15}s`,
            '--size': `${Math.random() * 5 + 3}px`
          }} />
        ))}
      </div>

      <div className="splash-content">

        {/* LOGO DE CINE */}
        <div className={`cinema-logo ${animationStep >= 2 ? 'logo-active' : ''}`}>
          <div className="film-roll"></div>
          <div className="film-hole h1"></div>
          <div className="film-hole h2"></div>
          <div className="film-hole h3"></div>
        </div>

        {/* TEXTO PRINCIPAL */}
        <div className={`netflix-style ${animationStep >= 3 ? 'logo-visible' : ''}`}>
          <span className="logo-text">CINESOFT</span>
          <div className="shine-line"></div>
        </div>

        {/* SUBTEXTO */}
        <div className={`logo-tagline ${animationStep >= 4 ? 'tagline-visible' : ''}`}>
          <span>Experiencia Cinematográfica</span>
        </div>

        {/* BARRA DE CARGA */}
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>

      </div>
    </div>
  );
};

export default SplashScreen;
