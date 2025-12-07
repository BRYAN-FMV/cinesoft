import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import Navbar from '../../components/Navbar/Navbar.jsx';
import './MisCompras.css';

function MisCompras() {
  const { user, token } = useAuth();
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Auth state:', { user, token, hasUser: !!user, hasToken: !!token });
    
    if (!token || !user) {
      console.log('No auth data, checking localStorage...');
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      console.log('localStorage data:', { savedToken: !!savedToken, savedUser: !!savedUser });
      
      if (!savedToken || !savedUser) {
        setError('Debes iniciar sesión para ver tus compras');
        setLoading(false);
        return;
      }
    }
    
    fetchCompras();
  }, [token, user]);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      
      // Usar token del localStorage si no está disponible en el hook
      const authToken = token || localStorage.getItem('token');
      const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Fetching compras with:', { 
        authToken: !!authToken, 
        userId: currentUser._id || currentUser.id,
        user: currentUser 
      });
      
      if (!authToken) {
        setError('Token de autenticación no encontrado');
        setLoading(false);
        return;
      }
      
      // Intentar obtener las ventas del endpoint general primero
      const response = await fetch(`https://cine-web-api-tobi.vercel.app/api/ventaEnc`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Ventas response:', data);
        console.log('Current user ID:', currentUser._id);
        
        // Filtrar por usuario si obtenemos todas las ventas
        const userVentas = Array.isArray(data) ? 
          data.filter(venta => {
            console.log('Checking venta:', venta);
            return venta.userId === currentUser._id || venta.usuarioId === currentUser._id;
          }) : 
          [];
        
        console.log('User ventas found:', userVentas);

        // Obtener detalles para cada venta
        const comprasConDetalles = await Promise.all(
          userVentas.map(async (venta) => {
            try {
              // Obtener detalles de la venta
              const detallesResponse = await fetch(`https://cine-web-api-tobi.vercel.app/api/ventaDet`, {
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                }
              });

              if (detallesResponse.ok) {
                const allDetalles = await detallesResponse.json();
                // Filtrar detalles que pertenecen a esta venta
                const ventaDetalles = allDetalles.filter(detalle => detalle.ventaEnc === venta._id);
                
                return {
                  ...venta,
                  detalles: ventaDetalles
                };
              }
              
              return {
                ...venta,
                detalles: []
              };
            } catch (error) {
              console.error('Error fetching detalles for venta:', venta._id, error);
              return {
                ...venta,
                detalles: []
              };
            }
          })
        );

        console.log('Compras with detalles:', comprasConDetalles);
        setCompras(comprasConDetalles);
      } else {
        console.log('Response not OK:', response.status);
        // Para desarrollo, mostrar compras de ejemplo
        setCompras([
          {
            _id: 'example-1',
            fecha: new Date().toISOString(),
            pelicula: 'Ejemplo Película',
            funcion: 'Función de ejemplo',
            asientos: ['A1', 'A2'],
            productos: [{ nombre: 'Combo mediano', cantidad: 1 }],
            total: 25.00
          }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar compras:', error);
      setError('Error de conexión al cargar las compras');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="mis-compras-container">
        <Navbar variant="fixed" />

        <div className="content-wrapper">
          <div className="container-fluid text-center">
            <div className="alert alert-warning mt-5">
              <h4>Acceso restringido</h4>
              <p>Debes iniciar sesión para ver tus compras.</p>
              <Link to="/login" className="btn btn-primary">
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-compras-container">
      <Navbar variant="fixed" />

      <div className="content-wrapper">
        <div className="container-fluid mt-5 pt-4">
          <div className="row">
            <div className="col-12 compras-header-wrapper">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white">
                  <i className="bi bi-receipt me-2"></i>
                  Mis Compras
                </h2>
                <span className="text-secondary">
                  Usuario: {user.name}
                </span>
              </div>

              {loading && (
                <div className="text-center loading-state">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="text-white mt-3">Cargando tus compras...</p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger error-state">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {!loading && !error && compras.length === 0 && (
                <div className="text-center empty-state-wrapper">
                  <div className="empty-state">
                    <i className="bi bi-cart-x display-1 text-secondary"></i>
                    <h4 className="text-white mt-3">No tienes compras aún</h4>
                    <p className="text-secondary">
                      Cuando realices tu primera compra, aparecerá aquí.
                    </p>
                    <Link to="/cartelera" className="btn btn-primary">
                      Explorar películas
                    </Link>
                  </div>
                </div>
              )}

              {!loading && !error && compras.length > 0 && (
                <div className="compras-list">
                  {compras.map((compra, index) => (
                    <div key={compra._id || index} className="compra-card">
                      <div className="compra-header">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 className="compra-id">
                              <i className="bi bi-receipt-cutoff me-2"></i>
                              Compra #{compra._id ? compra._id.slice(-8) : index + 1}
                            </h5>
                            <p className="compra-fecha">
                              <i className="bi bi-calendar3 me-2"></i>
                              {formatDate(compra.fecha || compra.createdAt)}
                            </p>
                          </div>
                          <div className="compra-total">
                            <span className="total-label">Total</span>
                            <span className="total-amount">${compra.total?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="compra-details">
                        {(() => {
                          const detalles = compra.detalles || [];
                          const hasDetalles = Array.isArray(detalles) && detalles.length > 0;
                          
                          if (hasDetalles) {
                            return (
                              <>
                                <h6 className="details-title">
                                  <i className="bi bi-list-ul me-2"></i>
                                  Detalles de la compra:
                                </h6>
                                <div className="details-list">
                                  {detalles.map((detalle, idx) => (
                                    <div key={idx} className="detail-item">
                                      <div className="detail-info">
                                        <span className="detail-type">
                                          {detalle.tipo === 'entrada' ? (
                                            <i className="bi bi-ticket-perforated text-success"></i>
                                          ) : (
                                            <i className="bi bi-cup text-warning"></i>
                                          )}
                                          {detalle.tipo === 'entrada' ? ' Entrada' : ' Producto'}
                                        </span>
                                        {detalle.funcion && (
                                          <span className="detail-function">
                                            Función: {detalle.funcion}
                                          </span>
                                        )}
                                        {detalle.producto && (
                                          <span className="detail-product">
                                            Producto: {detalle.producto}
                                          </span>
                                        )}
                                        {detalle.asientoId && (
                                          <span className="detail-seat">
                                            Asiento: {detalle.asientoId}
                                          </span>
                                        )}
                                      </div>
                                      <div className="detail-price">
                                        <span className="quantity">x{detalle.cantidad || 1}</span>
                                        <span className="price">${(detalle.precio || 0).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            );
                          }
                          
                          return (
                            <div className="no-details">
                              <p className="text-secondary">
                                <i className="bi bi-info-circle me-2"></i>
                                Cargando detalles de la compra...
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer bg-dark text-white text-center p-3 mt-5">
        <p className="m-0">&copy; 2025 CINESOFT - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

export default MisCompras;