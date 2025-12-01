import { useFetch } from '../../hooks/useFetch'
import { useState, useEffect } from 'react'
import './productos.css'

const Productos = ({ onClose, onAddToCart }) => {
    // Estados para paginación y carrito
    const [visibleCombos, setVisibleCombos] = useState(4)
    const [visibleBebidas, setVisibleBebidas] = useState(4)
    const [visibleSnacks, setVisibleSnacks] = useState(4)
    const [visibleDulces, setVisibleDulces] = useState(4)
    const [selectedItems, setSelectedItems] = useState([])
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        console.log('Iniciando carga de productos...')
        fetch('https://cine-web-api-tobi.vercel.app/productos')
            .then(res => {
                console.log('Respuesta recibida:', res.status)
                if (!res.ok) throw new Error('Error al cargar productos')
                return res.json()
            })
            .then(data => {
                console.log('Datos recibidos:', data)
                console.log('Cantidad de productos:', data.length)
                setProductos(data)
                setLoading(false)
            })
            .catch(err => {
                console.error('Error en fetch:', err)
                setError(err.message)
                setLoading(false)
            })
    }, [])

    const loadMore = (setCurrentCount, currentTotal) => {
        setCurrentCount(prevCount => Math.min(prevCount + 4, currentTotal))
    }

    // Manejar selección de productos
    const handleAddProduct = (producto) => {
        setSelectedItems(prev => {
            const existing = prev.find(item => item._id === producto._id)
            if (existing) {
                return prev.map(item => 
                    item._id === producto._id 
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
                )
            }
            return [...prev, { ...producto, cantidad: 1 }]
        })
    }

    const handleRemoveProduct = (productoId) => {
        setSelectedItems(prev => 
            prev.map(item => 
                item._id === productoId && item.cantidad > 0
                ? { ...item, cantidad: item.cantidad - 1 }
                : item
            ).filter(item => item.cantidad > 0)
        )
    }

    const handleConfirm = () => {
        onAddToCart(selectedItems)
        onClose()
    }

    if (loading) return <div className="text-center mt-5">Cargando productos...</div>
    if (error) return <div className="text-center mt-5 text-danger">Error: {error.message}</div>
    if (!productos || productos.length === 0) return <div className="text-center mt-5">No hay productos disponibles.</div>

    // Filtrar productos por categoría
    const combos = productos.filter(p => p.categoria === 'combo')
    const bebidas = productos.filter(p => p.categoria === 'bebida')
    const snacks = productos.filter(p => p.categoria === 'snack')
    const dulces = productos.filter(p => p.categoria === 'dulce')

    const ProductCard = ({ producto }) => {
        const itemInCart = selectedItems.find(item => item._id === producto._id)
        const cantidad = itemInCart?.cantidad || 0

        return (
            <div className="producto-card">
                <div className="producto-imagen">
                    <img src={producto.imagen} alt={producto.nombre} />
                </div>
                <div className="producto-info">
                    <h3>{producto.nombre}</h3>
                    <p className="descripcion">{producto.descripcion}</p>
                    <p className="precio">${producto.precio}</p>
                    <div className="cantidad-control">
                        <button 
                            className="btn-cantidad" 
                            onClick={() => handleRemoveProduct(producto._id)}
                            disabled={!cantidad}
                        >
                            -
                        </button>
                        <span>{cantidad}</span>
                        <button 
                            className="btn-cantidad"
                            onClick={() => handleAddProduct(producto)}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="productos-modal">
            <div className="productos-modal-content">
                <button className="close-btn" onClick={onClose}>&times;</button>
                
                <header className="productos-header">
                    <h1>Agrega snacks a tu pedido</h1>
                </header>

                <main className="container">
                    {/* Sección Combos */}
                    <section className="productos-section">
                        <h2>Combos</h2>
                        <div className="productos-grid">
                            {combos.slice(0, visibleCombos).map(producto => (
                                <ProductCard producto={producto} key={producto._id} />
                            ))}
                        </div>
                        {visibleCombos < combos.length && (
                            <button 
                                className="btn-ver-mas"
                                onClick={() => loadMore(setVisibleCombos, combos.length)}
                            >
                                Ver más combos
                            </button>
                        )}
                    </section>

                    {/* Sección Bebidas */}
                    <section className="productos-section">
                        <h2>Bebidas</h2>
                        <div className="productos-grid">
                            {bebidas.slice(0, visibleBebidas).map(producto => (
                                <ProductCard producto={producto} key={producto._id} />
                            ))}
                        </div>
                        {visibleBebidas < bebidas.length && (
                            <button 
                                className="btn-ver-mas"
                                onClick={() => loadMore(setVisibleBebidas, bebidas.length)}
                            >
                                Ver más bebidas
                            </button>
                        )}
                    </section>

                    {/* Sección Snacks */}
                    <section className="productos-section">
                        <h2>Snacks</h2>
                        <div className="productos-grid">
                            {snacks.slice(0, visibleSnacks).map(producto => (
                                <ProductCard producto={producto} key={producto._id} />
                            ))}
                        </div>
                        {visibleSnacks < snacks.length && (
                            <button 
                                className="btn-ver-mas"
                                onClick={() => loadMore(setVisibleSnacks, snacks.length)}
                            >
                                Ver más snacks
                            </button>
                        )}
                    </section>

                    {/* Sección Dulces */}
                    <section className="productos-section">
                        <h2>Dulces</h2>
                        <div className="productos-grid">
                            {dulces.slice(0, visibleDulces).map(producto => (
                                <ProductCard producto={producto} key={producto._id} />
                            ))}
                        </div>
                        {visibleDulces < dulces.length && (
                            <button 
                                className="btn-ver-mas"
                                onClick={() => loadMore(setVisibleDulces, dulces.length)}
                            >
                                Ver más dulces
                            </button>
                        )}
                    </section>
                </main>

                <footer className="productos-footer">
                    <div className="cart-summary">
                        <span>{selectedItems.reduce((acc, item) => acc + item.cantidad, 0)} productos</span>
                        <span>Total: ${selectedItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)}</span>
                    </div>
                    <button 
                        className="btn-confirmar"
                        onClick={handleConfirm}
                        disabled={selectedItems.length === 0}
                    >
                        Confirmar selección
                    </button>
                </footer>
            </div>
        </div>
    )
}

export default Productos