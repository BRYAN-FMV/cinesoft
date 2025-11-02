import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SplashScreen.css';

const SplashScreen = () => {
  const [isAnimating, setIsAnimating] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        navigate('/cartelera');
      }, 1000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

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