import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1000); // 1 segundo para el fade out
    }, 4000); // 4 segundos de animación

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${!isAnimating ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="logo-container">
          <div className="netflix-style">
            <span className="logo-text">CINESOFT</span>
            <div className="shine-line"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen