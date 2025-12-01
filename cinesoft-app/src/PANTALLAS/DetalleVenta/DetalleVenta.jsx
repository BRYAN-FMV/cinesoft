import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './DetalleVenta.css';

function DetalleVenta() {
  const { id } = useParams(); // id de la venta
  const [venta, setVenta] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVenta() {
      setLoading(true);
      try {
        // Encabezado
        const resEnc = await fetch(`https://cine-web-api-tobi.vercel.app/ventaEnc/${id}`);
        if (!resEnc.ok) throw new Error('No se encontró la venta');
        const ventaData = await resEnc.json();
        setVenta(ventaData);

        // Detalles
        const resDet = await fetch(`https://cine-web-api-tobi.vercel.app/ventaDet?ventaEnc=${id}`);
        if (!resDet.ok) throw new Error('No se encontraron los detalles');
        const detallesData = await resDet.json();
        setDetalles(detallesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchVenta();
  }, [id]);

  if (loading) return <div className="container mt-5 text-center">Cargando ticket...</div>;
  if (error) return <div className="container mt-5 text-center text-danger">{error}</div>;
  if (!venta) return null;

  return (
    <div className="container mt-5">
      <div className="card bg-dark text-white">
        <div className="card-header">
          <h3>Ticket de Compra</h3>
        </div>
        <div className="card-body">
          <p><strong>Usuario:</strong> {venta.usuarioId?.nombre || venta.usuarioId}</p>
          <p><strong>Fecha:</strong> {new Date(venta.fecha).toLocaleString()}</p>
          <p><strong>Total:</strong> ${venta.total}</p>
          <hr />
          <h5>Detalles:</h5>
          {detalles.length === 0 ? (
            <p>No hay detalles para esta venta.</p>
          ) : (
            <ul className="list-group">
              {detalles.map((det, idx) => (
                <li key={det._id || idx} className="list-group-item bg-dark text-white">
                  {det.tipo === 'entrada' ? (
                    <>
                      🎟️ <strong>Entrada</strong> - Función: {det.funcion} | Asiento: {det.asientoId} | Precio: ${det.precio}
                    </>
                  ) : (
                    <>
                      🍿 <strong>Producto</strong> - {det.producto} x{det.cantidad} | Precio: ${det.precio}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card-footer text-center">
          <Link to="/cartelera" className="btn btn-primary">Volver a la cartelera</Link>
        </div>
      </div>
    </div>
  );
}

export default DetalleVenta;
