// src/PANTALLAS/Carrito/Carrito.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';

import './Carrito.css'; 

const Carrito = ({ show, handleClose }) => {

    const visible = typeof show === 'undefined' ? true : show;
    const carritoClass = `carrito-offcanvas ${visible ? 'open' : ''}`;

    const navigate = useNavigate();
    const onClose = handleClose ? handleClose : () => navigate(-1);
    
    // Usar el contexto del carrito
    const { reservations, total, removeReservation } = useCart();

    return (
        <div className={carritoClass}> 
            <div className="carrito-header">
                <div className="carrito-title">
                    🛒Carrito de Compra ({reservations.length} reservas)
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
                {reservations.length === 0 ? (
                    <div className="text-center text-white p-4">
                        <p>Tu carrito está vacío</p>
                        <small className="text-secondary">Selecciona asientos para comenzar tu reserva</small>
                    </div>
                ) : (
                    reservations.map((reservation) => (
                        <div key={reservation.id} className="carrito-item-pure d-flex justify-content-between align-items-center mb-3 p-3 rounded">
                            <div className="item-info">
                                <p className="mb-0 text-white fw-bold">
                                    {reservation.selectedSeats.join(', ')} ({reservation.selectedSeats.length} asiento{reservation.selectedSeats.length > 1 ? 's' : ''})
                                </p>
                                <small className="text-secondary">
                                    {reservation.movieTitle}
                                </small>
                                <br />
                                <small className="text-secondary">
                                    {reservation.selectedDay} a las {reservation.selectedTime}
                                </small>
                                <br />
                                <small className="text-secondary">
                                    {reservation.idioma} - Sala: {reservation.sala}
                                </small>
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
                    ))
                )}
                
                {reservations.length > 0 && (
                    <>
                        <div className="carrito-footer">
                            <h5 className="text-white">Total a Pagar:</h5>
                            <h5 className="text-primary fw-bold">${total.toFixed(2)}</h5>
                        </div>

                        <button className="btn-checkout">
                            Finalizar Compra
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Carrito;