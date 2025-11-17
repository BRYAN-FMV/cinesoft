import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import './Boletos.css';
import Productos from '../Productos/productos.jsx'; 

// Precios de los boletos
const PRECIOS = {
    adulto: 150,
    nino: 100,
};

function Boletos() {
    const { id: funcionId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // 1. Obtener parámetros de la URL desde MapaAsientos
    const seatsList = searchParams.get('seats') || ''; // Ej: "A1,A2,B3"
    const selectedDay = searchParams.get('day');
    const selectedTime = searchParams.get('time');
    const movieTitleParam = searchParams.get('title');
    const movieTitle = movieTitleParam ? decodeURIComponent(movieTitleParam) : 'Película Desconocida';
    
    // Convertir la lista de asientos a un array para contar
    const selectedSeats = seatsList.split(',').filter(seat => seat);
    const seatCount = selectedSeats.length;

    // 2. Estado para la cantidad de boletos
    const [quantities, setQuantities] = useState({
        adulto: seatCount > 0 ? 1 : 0, // Inicia con 1 si hay asientos, o 0
        nino: 0,
    });
    
    // 3. Estado para manejar el mensaje de error o límite
    const [alertMessage, setAlertMessage] = useState('');

    // 4. Estado para manejar la selección de productos
    const [showProductos, setShowProductos] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);

    // Función para actualizar la cantidad de boletos
    const updateQuantity = (type, delta) => {
        setAlertMessage('');
        setQuantities(prev => {
            const newQuantity = Math.max(0, prev[type] + delta);
            const currentTotal = (type === 'adulto' ? newQuantity : prev.adulto) + (type === 'nino' ? newQuantity : prev.nino);
            
            // Validar que la suma no exceda los asientos seleccionados
            if (currentTotal > seatCount) {
                setAlertMessage(`No puedes seleccionar más de ${seatCount} boletos, que es el número de asientos reservados.`);
                return prev;
            }

            // Validar que la cantidad de boletos no sea 0
            if (newQuantity === 0 && currentTotal > 0) {
                 setAlertMessage(`Debe haber al menos un boleto de la otra categoría.`);
            }

            return { ...prev, [type]: newQuantity };
        });
    };

    // 5. Calcular el total a pagar
    const totalAmount = useMemo(() => {
        return (quantities.adulto * PRECIOS.adulto) + (quantities.nino * PRECIOS.nino);
    }, [quantities]);

    // 6. Verificar si la cantidad total de boletos coincide con los asientos
    const totalBoletos = quantities.adulto + quantities.nino;
    const isTotalValid = totalBoletos === seatCount && totalAmount > 0;
    
    // 7. Función para finalizar la compra (simulada)
    const handleFinalize = () => {
        if (!isTotalValid) {
            setAlertMessage(`Debes seleccionar un total de ${seatCount} boletos para continuar. Total actual: ${totalBoletos}.`);
            return;
        }
        // Lógica de navegación a la pantalla de pago o resumen
        alert("¡Compra finalizada! (Simulación de pago exitoso)"); 
        // En una app real, navegarías a la confirmación: navigate('/confirmacion');
    };

    // 8. Función para manejar la adición de productos
    const handleAddProducts = (products) => {
        setSelectedProducts(products);
        // Aquí puedes calcular el total incluyendo los productos
    };

    // 9. Renderizar el selector de cantidad para cada tipo de boleto
    const renderTicketSelector = (type, label, price) => (
        <div className="boleto-selector" key={type}>
            <div>
                <p className="mb-0">{label} (L. {price})</p>
                <small className="text-secondary">Boletos seleccionados: {quantities[type]}</small>
            </div>
            <div className="boleto-selector-control">
                <button 
                    className="btn btn-sm btn-outline-dark" 
                    onClick={() => updateQuantity(type, -1)} 
                    disabled={quantities[type] === 0}
                >
                    -
                </button>
                <span className="fw-bold mx-2">{quantities[type]}</span>
                <button 
                    className="btn btn-sm btn-outline-dark" 
                    onClick={() => updateQuantity(type, 1)}
                    disabled={totalBoletos >= seatCount} // Deshabilitar si ya se alcanzó el límite de asientos
                >
                    +
                </button>
            </div>
        </div>
    );

    return (
        // Utilizamos la clase para forzar el fondo negro en la página
        <div className="boletos-page-container">
            {/* Navbar (se mantiene igual que en MapaAsientos) */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
                <div className="container-fluid">
                    <div className="container align-items-center d-flex">
                        <div className="me-3">
                            {/* Regresar a MapaAsientos con los parámetros correctos */}
                            <Link to={`/asientos/${funcionId}?day=${selectedDay}&time=${selectedTime}&title=${movieTitleParam}`} className="btn-link" aria-label="Atrás">Atrás</Link>
                        </div>
                        <Link className="navbar-brand logo me-auto" to="/">CINESOFT</Link>
                        <div className="d-flex align-items-center ms-auto">
                            <Link to="/auth" className="btn-link icon-btn" aria-label="Iniciar sesión / Registrarse" style={{ gap: '8px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z" />
                                    <path fillRule="evenodd" d="M8 8a3 3 0 100-6 3 3 0 000 6z" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Contenido principal centrado */}
            <div className="container content-wrapper text-center">
                <br /><br />
                 <br /><br />
                <h2>Selecciona tus boletos</h2>
                <div className="text-white mb-4">
                    <p className="mb-0 fw-bold">{movieTitle}</p>
                    <p className="mb-0">{selectedDay} a las {selectedTime}</p>
                    <p className="mb-3 text-warning">Asientos: {selectedSeats.join(', ')} ({seatCount} total)</p>
                </div>

                {/* Contenedor del formulario con fondo blanco (boletos-form-card) */}
                <div className="boletos-form-card mx-auto">
                    <h4>Elige la cantidad de boletos para cada categoría.</h4>
                    
                    {/* Selector de boletos */}
                    {renderTicketSelector('adulto', 'Adulto', PRECIOS.adulto)}
                    {renderTicketSelector('nino', 'Niño', PRECIOS.nino)}
                    
                    {/* Mensaje de Alerta */}
                    {alertMessage && (
                        <div className="alert alert-danger mt-3" role="alert">
                            {alertMessage}
                        </div>
                    )}
                    
                    {/* Total */}
                    <div className="total-display mt-4">
                        Total: L. {totalAmount.toFixed(2)}
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="d-flex justify-content-between mt-4 gap-3">
                        <button 
                            className="btn btn-snacks flex-grow-1" 
                            onClick={() => setShowProductos(true)}
                        >
                            Añadir comida y snacks
                        </button>
                        <button 
                            className="btn btn-comprar flex-grow-1" 
                            onClick={handleFinalize}
                            disabled={!isTotalValid}
                        >
                            Finalizar compra
                        </button>
                    </div>

                    {/* Componente de selección de productos */}
                    {showProductos && (
                        <Productos 
                            onClose={() => setShowProductos(false)}
                            onAddToCart={handleAddProducts}
                        />
                    )}
                    
                    {/* Mostrar productos seleccionados */}
                    {selectedProducts.length > 0 && (
                        <div className="productos-seleccionados mt-4">
                            <h4>Productos seleccionados:</h4>
                            {selectedProducts.map(item => (
                                <div key={item._id} className="producto-item">
                                    {item.cantidad}x {item.nombre} - ${item.precio * item.cantidad}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <footer className="footer">
                <p>&copy; 2025 CINESOFT - Todos los derechos reservados</p>
            </footer>
        </div>
    );
}

export default Boletos;
