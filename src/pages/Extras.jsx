import { Link } from "react-router-dom";
import { extras } from "../data/menu";
import { useCart } from "../store/useCart";

export default function Extras() {
  const cart = useCart();

  function addExtra(x) {
    const key = `extra:${x.id}`;
    cart.add({
      key,
      name: x.name,
      qty: 1,
      unitPrice: x.price,
      meta: { type: "extra" },
    });
  }

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div className="row">
          <Link to="/">
            <button className="btn">⬅ Volver</button>
          </Link>
          <Link to="/checkout">
            <button className="btn">✅ Checkout</button>
          </Link>
        </div>
        <div style={{ opacity: 0.9 }}>
          <b>${cart.total}</b>
        </div>
      </div>

      <h1 style={{ margin: "6px 0 14px" }}>Agregados</h1>

      <div style={{ display: "grid", gap: 10 }}>
        {extras.map((x) => (
          <div key={x.id} className="card">
            <div className="row-between">
              <div>
                <b>{x.name}</b>
              </div>

              <button className="btn btnPrimary" onClick={() => addExtra(x)}>
                + ${x.price}
              </button>
            </div>
          </div>
        ))}
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
