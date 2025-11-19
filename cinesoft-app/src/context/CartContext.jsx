import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Reducer para manejar las acciones del carrito
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_RESERVATION':
      // Agregar una nueva reserva al carrito
      const newReservation = {
        id: Date.now().toString(), // ID único temporal
        funcionId: action.payload.funcionId,
        movieTitle: action.payload.movieTitle,
        selectedDay: action.payload.selectedDay,
        selectedTime: action.payload.selectedTime,
        selectedSeats: action.payload.selectedSeats,
        precio: action.payload.precio || 0,
        idioma: action.payload.idioma || 'No especificado',
        sala: action.payload.sala || 'No especificada',
        timestamp: new Date().toISOString(),
        status: 'pending' // pending, confirmed, expired
      };

      // Verificar si ya existe una reserva para la misma función
      const existingIndex = state.reservations.findIndex(
        res => res.funcionId === action.payload.funcionId
      );

      if (existingIndex !== -1) {
        // Actualizar reserva existente
        const updatedReservations = [...state.reservations];
        updatedReservations[existingIndex] = newReservation;
        return {
          ...state,
          reservations: updatedReservations,
          total: calculateTotal(updatedReservations, state.products)
        };
      } else {
        // Agregar nueva reserva
        const updatedReservations = [...state.reservations, newReservation];
        return {
          ...state,
          reservations: updatedReservations,
          total: calculateTotal(updatedReservations, state.products)
        };
      }

    case 'REMOVE_RESERVATION':
      const filteredReservations = state.reservations.filter(
        res => res.id !== action.payload.reservationId
      );
      return {
        ...state,
        reservations: filteredReservations,
        total: calculateTotal(filteredReservations, state.products)
      };

      case 'ADD_PRODUCTS': 
        const itemsToAdd = action.payload.products || [];
        let newProductsList = [...state.products];
        
        itemsToAdd.forEach(newItem => {
            const existingProductIndex = newProductsList.findIndex(p => p._id === newItem._id);
            
            if (existingProductIndex !== -1) {
                newProductsList[existingProductIndex] = {
                    ...newProductsList[existingProductIndex],
                    cantidad: newItem.cantidad
                };
            } else {
                // Si es nuevo, agregarlo
                newProductsList.push(newItem);
            }
        });

        // Aseguramos que no haya productos con cantidad 0
        const finalProductsList = newProductsList.filter(p => p.cantidad > 0);

        return {
            ...state,
            products: finalProductsList,
            total: calculateTotal(state.reservations, finalProductsList)
        };

    case 'REMOVE_PRODUCT':
        const productToRemoveId = action.payload.productId;
        const remainingProducts = state.products.filter(
            prod => prod._id !== productToRemoveId
        );
        return {
            ...state,
            products: remainingProducts,
            total: calculateTotal(state.reservations, remainingProducts)
        };

    case 'CLEAR_CART':
      return {
        ...state,
        reservations: [],
        products: [],
        total: 0
      };

    case 'LOAD_FROM_STORAGE':
      const loadedReservations = action.payload.reservations || [];
        const loadedProducts = action.payload.products || [];
      return {
        ...state,
        reservations: loadedReservations,
        products: loadedProducts,
        total: calculateTotal(loadedReservations, loadedProducts)
      };

    default:
      return state;
  }
};

// Función para calcular el total del carrito
const calculateTotal = (reservations, products) => {
    // Total de Reservas
    const reservationsTotal = reservations.reduce((total, reservation) => {
        const seatCount = reservation.selectedSeats.length;
        const pricePerSeat = reservation.precio || 0;
        return total + (seatCount * pricePerSeat);
    }, 0);
    // Total de Productos/Snacks
    const productsTotal = products.reduce((total, product) => {
        const quantity = product.cantidad || 0;
        const pricePerItem = product.precio || 0;
        return total + (quantity * pricePerItem);
    }, 0);

    return reservationsTotal + productsTotal; // Sumar ambos totales
};
// Estado inicial del carrito
const initialState = {
  reservations: [],
  products: [], 
  total: 0
};

// Provider del contexto del carrito
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    const savedCart = localStorage.getItem('cinesoft_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: { 
                reservations: parsedCart.reservations,
                products: parsedCart.products || [] 
            } });
      } catch (error) {
        console.error('[Cart] Error al cargar carrito desde localStorage:', error);
      }
    }
  }, []);

  // Guardar en localStorage cuando el estado cambie
  useEffect(() => {
    localStorage.setItem('cinesoft_cart', JSON.stringify(state));
  }, [state]);

  // Funciones de utilidad
  const addReservation = (reservationData) => {
    console.log('[Cart] Agregando reserva al carrito:', reservationData);
    dispatch({ type: 'ADD_RESERVATION', payload: reservationData });
  };

  const removeReservation = (reservationId) => {
    console.log('[Cart] Eliminando reserva del carrito:', reservationId);
    dispatch({ type: 'REMOVE_RESERVATION', payload: { reservationId } });
  };

  const addProductsToCart = (productsList) => {
        console.log('[Cart] Agregando/Actualizando productos:', productsList);
        dispatch({ type: 'ADD_PRODUCTS', payload: { products: productsList } });
    };

    // Nueva Función: Eliminar Producto
    const removeProduct = (productId) => {
        console.log('[Cart] Eliminando producto:', productId);
        dispatch({ type: 'REMOVE_PRODUCT', payload: { productId } });
    };

  const clearCart = () => {
    console.log('[Cart] Limpiando carrito');
    dispatch({ type: 'CLEAR_CART' });
  };

  const getReservationCount = () => {
    return state.reservations.length;
  };

  const getTotalSeats = () => {
    return state.reservations.reduce((total, reservation) => {
      return total + reservation.selectedSeats.length;
    }, 0);
  };

  const value = {
    ...state,
    products: state.products,
    addReservation,
    removeReservation,
    addProductsToCart,
    removeProduct,
    clearCart,
    getReservationCount,
    getTotalSeats
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook personalizado para usar el contexto del carrito
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export default CartContext;