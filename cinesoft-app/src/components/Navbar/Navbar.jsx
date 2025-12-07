import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import './Navbar.css';

function Navbar({ cartCount = 0, showCartBadge = false, variant = 'main' }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className={`navbar navbar-expand-lg navbar-dark cinesoft-navbar ${variant === 'fixed' ? 'fixed-top' : ''}`}>
      <div className="container">
        
        {/* Toggle button for mobile */}
        <button 
          className="navbar-toggler order-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Logo centrado */}
        <Link className="navbar-brand cinesoft-logo mx-auto order-1 position-absolute start-50 translate-middle-x" to="/cartelera">
          CINESOFT
        </Link>

        {/* Navigation items */}
        <div className="collapse navbar-collapse order-2" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/cartelera')}`} to="/cartelera">
                <i className="bi bi-camera-reels me-1"></i>
                Cartelera
              </Link>
            </li>
            
            {user && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/mis-compras')}`} to="/mis-compras">
                  <i className="bi bi-receipt me-1"></i>
                  Mis Compras
                </Link>
              </li>
            )}
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link position-relative" to="/cartelera?carrito=1">
                <i className="bi bi-cart3 me-1"></i>
                Carrito
                {showCartBadge && cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger cart-badge">
                    {cartCount}
                  </span>
                )}
              </Link>
            </li>
            
            {user ? (
              <li className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle user-dropdown" 
                  href="#" 
                  id="userDropdown" 
                  role="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {user.name || user.email}
                </a>
                <ul className="dropdown-menu dropdown-menu-end user-dropdown-menu" aria-labelledby="userDropdown">
                  <li>
                    <Link className="dropdown-item" to="/mis-compras">
                      <i className="bi bi-receipt me-2"></i>
                      Mis Compras
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link login-link" to="/login">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Iniciar Sesión
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-outline-light btn-sm register-btn" to="/register">
                    Registrarse
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;