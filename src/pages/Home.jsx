import { Link } from "react-router-dom";
import { useCart } from "../store/useCart";

export default function Home() {
  const cart = useCart();

  return (
    <div className="page">
      <h1 style={{ margin: "6px 0 14px" }}>Burgerya</h1>

      <div style={{ display: "grid", gap: 12 }}>
        <Link to="/burgers">
          <div className="card">
            <b style={{ fontSize: 18 }}>🍔 Burgers</b>
            <div style={{ opacity: 0.75, marginTop: 4 }}>
              Armar pedido por unidad
            </div>
          </div>
        </Link>

        <Link to="/promos">
          <div className="card">
            <b style={{ fontSize: 18 }}>🔥 Promos</b>
            <div style={{ opacity: 0.75, marginTop: 4 }}>
              2x / 3x / 4x (Dobles o Triples)
            </div>
          </div>
        </Link>

        <Link to="/papas">
          <div className="card">
            <b style={{ fontSize: 18 }}>🍟 Papas y Más</b>
            <div style={{ opacity: 0.75, marginTop: 4 }}>
              Porciones + cheddar/bacon
            </div>
          </div>
        </Link>

        <Link to="/extras">
          <div className="card">
            <b style={{ fontSize: 18 }}>➕ Agregados</b>
            <div style={{ opacity: 0.75, marginTop: 4 }}>Extras para sumar</div>
          </div>
        </Link>
      </div>

      <div className="stickyBarSpacer" />

      <div className="stickyBar">
        <div className="stickyInner">
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Total carrito</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>${cart.total}</div>
          </div>

          <Link to="/checkout">
            <button
              className="btn btnPrimary"
              disabled={cart.items.length === 0}>
              Ir a Checkout
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
