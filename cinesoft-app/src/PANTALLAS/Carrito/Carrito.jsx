import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import Productos from '../Productos/productos.jsx'; 

import './Carrito.css'; 

const Carrito = ({ show, handleClose }) => {

    const visible = typeof show === 'undefined' ? true : show;
    const carritoClass = `carrito-offcanvas ${visible ? 'open' : ''}`;

    const navigate = useNavigate();
    const onClose = handleClose ? handleClose : () => navigate(-1);

    const [showProducts, setShowProducts] = useState(false);
    
    // Usar el contexto del carrito 
    const { reservations, products, total, removeReservation, addProductsToCart, removeProduct } = useCart();

    const handleOpenProducts = () => {
        setShowProducts(true);
    };

    const handleCloseProducts = () => {
        setShowProducts(false);
    };

    const handleAddProductsToCart = (items) => {
        // Enviar los productos seleccionados al contexto
        addProductsToCart(items); 
        handleCloseProducts();
    };

    // 1. Mostrar la pantalla de Productos si showProducts es true
    if (showProducts) {
        return (
            <Productos
                onClose={handleCloseProducts}
                onAddToCart={handleAddProductsToCart}
            />
        );
    }

    // 2. Renderizar el carrito normal
    // Se considera vacío si no hay reservas NI productos
    const isCartEmpty = reservations.length === 0 && products.length === 0;

    return (
        <div className={carritoClass}> 
            <div className="carrito-header">
                <div className="carrito-title">
                    🛒Carrito de Compra ({reservations.length + products.length} items)
                </div>
                <button 
                    type="button" 
                    className="carrito-close-btn" 
                    onClick={onClose}
                >
                    &times;
                </button>
            </div>
            
            <div className="carrito-body">
                {isCartEmpty ? (
                    <div className="text-center text-white p-4">
                        <p>Tu carrito está vacío</p>
                        <small className="text-secondary">Selecciona asientos para comenzar tu reserva</small>
                    </div>
                ) : (
                    <> {/* Fragmento para agrupar todo el contenido */}

                        {/* BOTÓN PARA AGREGAR SNACKS/COMBOS */}
                        <button 
                            className="btn btn-primary w-100 mb-3"
                            onClick={handleOpenProducts}
                        >
                            + Agregar Snacks/Combos
                        </button>

                        {/* LISTA DE RESERVACIONES */}
                        {reservations.length > 0 && (
                            <>
                                <h4 className="text-white mt-3">Tickets</h4>
                                {reservations.map((reservation) => (
                                    <div key={reservation.id} className="carrito-item-pure d-flex justify-content-between align-items-center mb-3 p-3 rounded">
                                        <div className="item-info">
                                            <p className="mb-0 text-white fw-bold">
                                                                                                {reservation.selectedSeats.map((asiento, idx) => (
                                                                                                    <span key={asiento._id || idx} className="badge bg-secondary me-1">
                                                                                                        {asiento.codigo}
                                                                                                    </span>
                                                                                                ))} ({reservation.selectedSeats.length} asiento{reservation.selectedSeats.length > 1 ? 's' : ''})
                                            </p>
                                            <small className="text-secondary">{reservation.movieTitle}</small><br />
                                            <small className="text-secondary">{reservation.selectedDay} a las {reservation.selectedTime}</small><br />
                                            <small className="text-secondary">{reservation.idioma} - Sala: {reservation.sala}</small>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <p className="mb-0 text-white fw-bold carrito-price me-3">
                                                ${(reservation.precio * reservation.selectedSeats.length).toFixed(2)}
                                            </p>
                                            <button 
                                                className="btn btn-sm btn-trash" 
                                                onClick={() => removeReservation(reservation.id)}
                                            >
                                                [X]
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* LISTA DE PRODUCTOS (SNACKS) */}
                        {products.length > 0 && (
                            <>
                                <h4 className="text-white mt-3">Productos:</h4>
                                {products.map((product) => (
                                    <div key={product._id} className="carrito-item-pure d-flex justify-content-between align-items-center mb-3 p-3 rounded">
                                        <div className="item-info">
                                            <p className="mb-0 text-white fw-bold">
                                                {product.nombre} (x{product.cantidad})
                                            </p>
                                            <small className="text-secondary">{product.descripcion}</small>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <p className="mb-0 text-white fw-bold carrito-price me-3">
                                                ${(product.precio * product.cantidad).toFixed(2)}
                                            </p>
                                            <button 
                                                className="btn btn-sm btn-trash" 
                                                onClick={() => removeProduct(product._id)}
                                            >
                                                [X]
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                )}

                {/* FOOTER: Sólo se muestra si el carrito NO está vacío */}
                {!isCartEmpty && (
                    <>
                        <div className="carrito-footer">
                            <h5 className="text-white">Total a Pagar:</h5>
                            <h5 className="text-primary fw-bold">${total.toFixed(2)}</h5>
                        </div>

                        <button 
                            className="btn-checkout"
                            onClick={() => navigate('/resumen')}
                        >
                            Ver Resumen y Pagar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Carrito;