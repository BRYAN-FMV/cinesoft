import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import Navbar from '../../components/Navbar/Navbar';
import './ResumenCompra.css';

function ResumenCompra() {
  const navigate = useNavigate();
  const { reservations, products, total, clearCart } = useCart();
  const { token, user } = useAuth();
  const [procesando, setProcesando] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [numeroConfirmacion, setNumeroConfirmacion] = useState('');

  // Calcular subtotales y desglose
  const calcularDesglose = () => {
    let totalAsientos = 0;
    let subtotalReservas = 0;
    let subtotalProductos = 0;

    // Calcular total de reservas (entradas)
    reservations.forEach(reserva => {
      totalAsientos += reserva.selectedSeats.length;
      subtotalReservas += reserva.precio * reserva.selectedSeats.length;
    });

    // Calcular total de productos
    products.forEach(product => {
      subtotalProductos += product.precio * product.cantidad;
    });

    const subtotalGeneral = subtotalReservas + subtotalProductos;

    // Solo impuesto 15%
    const impuestos = subtotalGeneral * 0.15; // 15% IVA
    const totalFinal = subtotalGeneral + impuestos;

    return {
      totalAsientos,
      subtotalReservas,
      subtotalProductos,
      subtotalGeneral,
      impuestos,
      totalFinal
    };
  };

  const desglose = calcularDesglose();

  // Debug para verificar cálculos
  console.log('Desglose calculado:', desglose);
  console.log('Reservations:', reservations);
  console.log('Products:', products);

  // Función para generar número de confirmación
  const generarNumeroConfirmacion = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CONF-${timestamp}${random}`;
  };

  // Función para procesar el pago
  const handleProcesarPago = async () => {
    if (!token) {
      alert('Debes iniciar sesión para continuar con el pago');
      navigate('/login');
      return;
    }

    if (reservations.length === 0 && products.length === 0) {
      alert('No hay items en el carrito');
      return;
    }

    setProcesando(true);

    try {
      // Validar disponibilidad de asientos antes de procesar
      if (reservations.length > 0) {
        console.log('Validando disponibilidad de asientos...');
        for (const reserva of reservations) {
          try {
            const response = await fetch(`https://cine-web-api-tobi.vercel.app/api/funciones/${reserva.funcionId}/asientos`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const asientosActuales = await response.json();
              
              // Verificar cada asiento seleccionado
              for (const asientoSeleccionado of reserva.selectedSeats) {
                const asientoId = asientoSeleccionado._id || asientoSeleccionado;
                const asientoActual = asientosActuales.find(a => a._id === asientoId);
                
                if (!asientoActual || asientoActual.estado !== 'disponible') {
                  throw new Error(`El asiento ${asientoSeleccionado.codigo || asientoId} ya no está disponible. Por favor, selecciona otros asientos.`);
                }
              }
            }
          } catch (error) {
            console.error('Error validando asientos:', error);
            if (error.message.includes('ya no está disponible')) {
              throw error; // Re-lanzar errores de disponibilidad
            }
            // Continuar si es un error de red, pero mostrar advertencia
            console.warn('No se pudo validar la disponibilidad, continuando...');
          }
        }
      }

      // Construir el array de detalles (entradas y productos)
      const detalles = [];

      // Entradas
      reservations.forEach(reserva => {
        reserva.selectedSeats.forEach(asiento => {
          detalles.push({
            tipo: 'entrada',
            cantidad: 1,
            producto: null,
            funcion: reserva.funcionId,
            asientoId: asiento._id ? asiento._id : asiento,
            precio: reserva.precio,
            total: reserva.precio
          });
        });
      });

      // Productos
      products.forEach(product => {
        detalles.push({
          tipo: 'producto',
          cantidad: Number(product.cantidad) > 0 ? Number(product.cantidad) : 1,
          producto: product._id,
          funcion: null,
          asientoId: null,
          precio: product.precio,
          total: product.precio * (Number(product.cantidad) > 0 ? Number(product.cantidad) : 1)
        });
      });

      // 1. Crear encabezado de la venta
      const ventaEncData = {
        usuarioId: user._id || user.id,
        fecha: new Date().toISOString(),
        total: desglose.totalFinal
      };

      const responseEnc = await fetch('https://cine-web-api-tobi.vercel.app/api/ventaEnc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ventaEncData)
      });

      if (!responseEnc.ok) {
        const errorData = await responseEnc.json();
        throw new Error(errorData.message || 'Error al crear la venta');
      }

      const ventaEnc = await responseEnc.json();
      console.log('Respuesta ventaEnc:', ventaEnc);
      const ventaEncId = ventaEnc.venta?._id || ventaEnc._id || ventaEnc.id;
      console.log('VentaEncId extraído:', ventaEncId);

      if (!ventaEncId) {
        throw new Error('No se pudo obtener el ID del encabezado de venta');
      }

      // 2. Crear cada detalle asociado al encabezado
      console.log('Creando', detalles.length, 'detalles para ventaEncId:', ventaEncId);
      for (const detalle of detalles) {
        const detalleData = {
          ventaEnc: ventaEncId,
          ...detalle
        };
        console.log('Enviando detalle:', detalleData);
        const responseDet = await fetch('https://cine-web-api-tobi.vercel.app/api/ventaDet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(detalleData)
        });
        
        console.log('Response status:', responseDet.status);
        const responseText = await responseDet.text();
        console.log('Response text:', responseText);
        
        if (!responseDet.ok) {
          let errorDet;
          try {
            errorDet = JSON.parse(responseText);
          } catch (e) {
            errorDet = { message: responseText };
          }
          console.error('Detalle con error:', detalleData, errorDet);
          throw new Error(errorDet.message || 'Error al crear el detalle de venta');
        }
      }

      // Generar número de confirmación
      const confirmacion = generarNumeroConfirmacion();
      setNumeroConfirmacion(confirmacion);

      // Mostrar modal de éxito
      setShowSuccessModal(true);

      // Redirigir automáticamente después de 3 segundos y LUEGO limpiar carrito
      setTimeout(() => {
        setShowSuccessModal(false);
        clearCart();
        navigate('/cartelera');
      }, 3000);

    } catch (error) {
      console.error('Error al procesar el pago:', error);
      
      // Manejar errores específicos
      let mensajeError = error.message;
      
      if (error.message.includes('Asiento en estado: ocupado')) {
        mensajeError = 'Uno o más asientos seleccionados ya han sido reservados por otro usuario. Por favor, regresa al mapa de asientos y selecciona otros lugares disponibles.';
      } else if (error.message.includes('ya no está disponible')) {
        mensajeError = error.message; // Ya es un mensaje claro de la validación previa
      } else if (error.message.includes('Error al crear')) {
        mensajeError = 'Hubo un problema al procesar tu reserva. Por favor, intenta nuevamente.';
      }
      
      alert(`Error en la compra: ${mensajeError}`);
    } finally {
      setProcesando(false);
    }
  };

  if (reservations.length === 0 && products.length === 0) {
    return (
      <div className="resumen-container">
        <Navbar variant="fixed" />

        <div className="container content-wrapper text-center">
          <div className="alert alert-warning mt-5">
            <h4>Tu carrito está vacío</h4>
            <p>No hay items para procesar</p>
            <Link to="/cartelera" className="btn btn-primary mt-3">
              Volver a la cartelera
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="resumen-container">
      {/* Navbar */}
      <Navbar 
        cartCount={reservations.length + products.length} 
        showCartBadge={true} 
        variant="fixed" 
      />

      {/* Contenido principal */}
      <div className="container-fluid content-wrapper">
        <div className="row g-4 justify-content-center">
          {/* Columna izquierda - Detalles de reservas */}
          <div className="col-lg-7 col-12">
            <div className="card bg-dark text-white mb-4">
              <div className="card-header">
                <h4 className="mb-0">
                  <i className="bi bi-ticket-perforated me-2"></i>
                  Resumen de tu Compra
                </h4>
              </div>
              <div className="card-body">
                {reservations.map((reserva, index) => (
                  <div key={reserva.id} className="reserva-item mb-4 pb-4 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="text-warning mb-2">
                          {reserva.movieTitle}
                        </h5>
                        <div className="reserva-details">
                          <p className="mb-1">
                            <strong>Fecha:</strong> {reserva.selectedDay}
                          </p>
                          <p className="mb-1">
                            <strong>Horario:</strong> {reserva.selectedTime}
                          </p>
                          <p className="mb-1">
                            <strong>Sala:</strong> {reserva.sala}
                          </p>
                          <p className="mb-1">
                            <strong>Idioma:</strong> {reserva.idioma}
                          </p>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-info text-dark mb-2">
                          Reserva #{index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Asientos seleccionados */}
                    <div className="asientos-seleccionados mb-3">
                      <strong className="d-block mb-2">Asientos seleccionados:</strong>
                      <div className="d-flex flex-wrap gap-2">
                        {reserva.selectedSeats.map((asiento, idx) => (
                          <span key={asiento._id || idx} className="badge bg-success">
                            {asiento.codigo ? asiento.codigo : asiento}
                          </span>
                        ))}
                      </div>
                      <small className="text-secondary mt-2 d-block">
                        Total: {reserva.selectedSeats.length} asiento(s)
                      </small>
                    </div>

                    {/* Precio por reserva */}
                    <div className="precio-reserva">
                      <div className="d-flex justify-content-between">
                        <span>Precio por asiento:</span>
                        <span>${reserva.precio.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Cantidad de asientos:</span>
                        <span>× {reserva.selectedSeats.length}</span>
                      </div>
                      <div className="d-flex justify-content-between fw-bold text-warning mt-2">
                        <span>Subtotal:</span>
                        <span>${(reserva.precio * reserva.selectedSeats.length).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Productos/Snacks */}
                {products.length > 0 && (
                  <>
                    <div className="mt-4 pt-4 border-top">
                      <h4 className="text-info mb-3">
                        <i className="bi bi-bag-fill me-2"></i>
                        Productos / Snacks
                      </h4>
                    </div>

                    {products.map((product, index) => (
                      <div key={product._id} className="reserva-item mb-3 pb-3 border-bottom">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="text-white mb-2">{product.nombre}</h6>
                            <small className="text-secondary d-block mb-2">
                              {product.descripcion}
                            </small>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-secondary">
                              Producto #{index + 1}
                            </span>
                          </div>
                        </div>

                        <div className="precio-reserva mt-3">
                          <div className="d-flex justify-content-between">
                            <span>Precio unitario:</span>
                            <span>${product.precio.toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Cantidad:</span>
                            <span>× {product.cantidad}</span>
                          </div>
                          <div className="d-flex justify-content-between fw-bold text-info mt-2">
                            <span>Subtotal:</span>
                            <span>${(product.precio * product.cantidad).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha - Desglose de costos */}
          <div className="col-lg-5 col-12">
            <div className="card bg-dark text-white desglose-pago sticky-top">
              <div className="card-header bg-danger">
                <h5 className="mb-0">
                  <i className="bi bi-receipt me-2"></i>
                  Desglose de Pago
                </h5>
              </div>
              <div className="card-body">
                {/* Información del usuario */}
                {user && (
                  <div className="mb-3 pb-3 border-bottom">
                    <small className="text-secondary">Comprando como:</small>
                    <p className="mb-0 fw-bold">{user.name}</p>
                    <small className="text-secondary">{user.email}</small>
                  </div>
                )}

                {/* Resumen de ítems */}
                <div className="mb-3 pb-3 border-bottom">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Reservas:</span>
                    <span className="fw-bold">{reservations.length}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Asientos:</span>
                    <span className="fw-bold">{desglose.totalAsientos}</span>
                  </div>
                  {products.length > 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Productos:</span>
                      <span className="fw-bold">{products.length}</span>
                    </div>
                  )}
                </div>

                {/* Desglose de costos */}
                <div className="mb-3 pb-3 border-bottom">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Boletos:</span>
                    <span>${desglose.subtotalReservas.toFixed(2)}</span>
                  </div>
                  {products.length > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Productos:</span>
                      <span>${desglose.subtotalProductos.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between mb-2 fw-bold">
                    <span>Subtotal:</span>
                    <span>${desglose.subtotalGeneral.toFixed(2)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between">
                    <span>IVA (15%):</span>
                    <span>${desglose.impuestos.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total final */}
                <div className="total-final mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">TOTAL:</h5>
                    <h4 className="mb-0 text-success">
                      ${desglose.totalFinal.toFixed(2)}
                    </h4>
                  </div>
                </div>

                {/* Botones de acción */}
                <button 
                  className="btn btn-success w-100 mb-2 fw-bold"
                  onClick={handleProcesarPago}
                  disabled={procesando}
                >
                  {procesando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-credit-card me-2"></i>
                      Procesar Pago
                    </>
                  )}
                </button>

                <button 
                  className="btn btn-outline-light w-100"
                  onClick={() => navigate('/cartelera')}
                >
                  Seguir Comprando
                </button>
              </div>

              {/* Información adicional */}
              <div className="card-footer bg-transparent">
                <small className="text-secondary">
                  <i className="bi bi-shield-check me-1"></i>
                  Pago 100% seguro
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de éxito simple */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-modal-content text-center">
              <div className="success-icon mb-3">
                <i className="bi bi-check-circle-fill text-success" style={{fontSize: '4rem'}}></i>
              </div>
              
              <h2 className="success-title text-success mb-3">¡Compra Exitosa!</h2>
              
              <p className="success-message mb-4">
                Tu compra se procesó correctamente.<br/>
                <strong>Total pagado: ${desglose.totalFinal.toFixed(2)}</strong>
              </p>

              <div className="success-actions">
                <button 
                  className="btn btn-primary me-3"
                  onClick={() => {
                    setShowSuccessModal(false);
                    clearCart();
                    navigate('/cartelera');
                  }}
                >
                  Continuar
                </button>
                
                <button 
                  className="btn btn-outline-light"
                  onClick={() => {
                    setShowSuccessModal(false);
                    clearCart();
                    navigate('/mis-compras');
                  }}
                >
                  Ver mis compras
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer bg-dark text-white text-center p-3 mt-5">
        <p className="m-0">&copy; 2025 CINESOFT - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

export default ResumenCompra;