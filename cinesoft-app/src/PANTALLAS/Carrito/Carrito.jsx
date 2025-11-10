// src/PANTALLAS/Carrito/Carrito.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

import './Carrito.css'; 

const Carrito = ({ show, handleClose }) => {

    const visible = typeof show === 'undefined' ? true : show;
    const carritoClass = `carrito-offcanvas ${visible ? 'open' : ''}`;

  
    const navigate = useNavigate();
    const onClose = handleClose ? handleClose : () => navigate(-1);

    return (
        <div className={carritoClass}> 
            <div className="carrito-header">
                <div className="carrito-title">
                    🛒Carrito de Compra {/* Usamos un emoji simple */}
                </div>
                <button 
                    type="button" 
                    className="carrito-close-btn" 
                    onClick={onClose}
                >
                    &times; {/* Usamos el carácter X para cerrar */}
                </button>
            </div>
            
            <div className="carrito-body">
               

                {/* ITEM DE EJEMPLO para la vista */}
                <div className="carrito-item-pure d-flex justify-content-between align-items-center mb-3 p-3 rounded">
                    <div className="item-info">
                        <p className="mb-0 text-white fw-bold">Ticket Adulto (x1)</p>
                        <small className="text-secondary">Película: Ejemplo</small>
                    </div>
                    <div className="d-flex align-items-center">
                        <p className="mb-0 text-white fw-bold carrito-price me-3">$10.00</p>
                        <button 
                            className="btn btn-sm btn-trash" 
                            onClick={() => console.log('Eliminar item')}
                        >
                            [X] {/* Usamos texto simple para eliminar */}
                        </button>
                    </div>
                </div>
                
                <div className="carrito-footer">
                    <h5 className="text-white">Total a Pagar:</h5>
                    <h5 className="text-primary fw-bold">$10.00</h5>
                </div>

                <button className="btn-checkout">
                    Finalizar Compra
                </button>
            </div>
        </div>
    );
};

export default Carrito;