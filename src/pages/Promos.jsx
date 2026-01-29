import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { burgers, promoPrices, promoRules } from "../data/menu";
import { useCart } from "../store/useCart";
import { toast } from "../utils/toast.js";

export default function Promos() {
  const cart = useCart();

  const [tier, setTier] = useState(null); // BASICA | PREMIUM | DELUXE
  const [count, setCount] = useState(null); // 2 | 3 | 4
  const [size, setSize] = useState(null); // doble | triple
  const [picked, setPicked] = useState([]); // burger ids

  const allowed = useMemo(() => {
    if (!tier) return [];
    const allowedTiers = promoRules[tier].allowedTiers;
    return burgers.filter((b) => allowedTiers.includes(b.tier));
  }, [tier]);

  const price = useMemo(() => {
    if (!tier || !count || !size) return null;
    return promoPrices[tier][size][count];
  }, [tier, count, size]);

  const canPickMore = tier && count && size && picked.length < count;

  function chooseTier(t) {
    setTier(t);
    setCount(null);
    setSize(null);
    setPicked([]);
  }

  function chooseCount(n) {
    setCount(n);
    setPicked([]);
  }

  function chooseSize(s) {
    setSize(s);
    setPicked([]);
  }

  function pickBurger(id) {
    if (!canPickMore) return;
    setPicked((p) => [...p, id]);
  }

  function undoLast() {
    setPicked((p) => p.slice(0, -1));
  }

  function resetAll() {
    setTier(null);
    setCount(null);
    setSize(null);
    setPicked([]);
  }

  function addPromoToCart() {
    if (!tier || !count || !size || picked.length !== count) return;

    const names = picked.map(
      (id) => burgers.find((b) => b.id === id)?.name || id,
    );
    const key = `promo:${tier}:${count}:${size}:${names.join(",")}:${Date.now()}`;

    cart.add({
      key,
      name: `Promo ${tier} ${count}x (${size === "doble" ? "Dobles" : "Triples"})`,
      qty: 1,
      unitPrice: price,
      meta: { tier, count, size, picks: names },
    });

    toast.promo(`Promo agregada • $${Number(price).toLocaleString("es-AR")}`, {
      key: "promo-added",
      sound: true,
    });
    resetAll();
  }

  const pickedNames = picked.map(
    (id) => burgers.find((b) => b.id === id)?.name || id,
  );

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

      <h1 style={{ margin: "6px 0 14px" }}>Promos</h1>

      {/* 1) Promo tier */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 8, opacity: 0.85 }}>
          <b>Elegí promo</b>
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button
            className={`btn ${tier === "BASICA" ? "btnActive" : ""}`}
            onClick={() => chooseTier("BASICA")}>
            Básica
          </button>

          <button
            className={`btn ${tier === "PREMIUM" ? "btnActive" : ""}`}
            onClick={() => chooseTier("PREMIUM")}>
            Premium
          </button>

          <button
            className={`btn ${tier === "DELUXE" ? "btnActive" : ""}`}
            onClick={() => chooseTier("DELUXE")}>
            Deluxe
          </button>

          <button
            className="btn"
            onClick={resetAll}
            style={{ marginLeft: "auto" }}>
            Reset
          </button>
        </div>
      </div>

      {/* 2) Count */}
      {tier && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8, opacity: 0.85 }}>
            <b>¿2, 3 o 4?</b>
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                className={`btn ${count === n ? "btnActive" : ""}`}
                onClick={() => chooseCount(n)}>
                {n}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3) Size */}
      {tier && count && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8, opacity: 0.85 }}>
            <b>Dobles o Triples</b>
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {["doble", "triple"].map((s) => (
              <button
                key={s}
                className={`btn ${size === s ? "btnActive" : ""}`}
                onClick={() => chooseSize(s)}>
                {s === "doble" ? "Dobles" : "Triples"}
              </button>
            ))}
          </div>

          {size && price != null && (
            <div style={{ marginTop: 10, opacity: 0.9 }}>
              <b>Precio promo:</b> ${price}
            </div>
          )}
        </div>
      )}

      {/* 4) Picks */}
      {tier && count && size && (
        <>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <div style={{ opacity: 0.9 }}>
                <b>Elegí burgers</b> ({picked.length}/{count})
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>
                  Se pueden repetir.
                </div>
              </div>

              <button
                className="btn"
                onClick={undoLast}
                disabled={picked.length === 0}>
                ↩ Deshacer
              </button>
            </div>

            <div className="row" style={{ flexWrap: "wrap" }}>
              {allowed.map((b) => (
                <button
                  key={b.id}
                  className="btn"
                  onClick={() => pickBurger(b.id)}
                  disabled={!canPickMore}>
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 6, opacity: 0.85 }}>
              <b>Elegidas</b>
            </div>
            <div className="picksWrap">
              {pickedNames.length === 0 ? (
                <div style={{ opacity: 0.7 }}>—</div>
              ) : (
                pickedNames.map((n, i) => (
                  <span key={`${n}-${i}`} className="pill pillActive">
                    {n}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="row-between">
              <div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Listo para agregar
                </div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  ${price ?? 0}
                </div>
              </div>

              <button
                className="btn btnPrimary"
                type="button"
                onClick={addPromoToCart}
                disabled={picked.length !== count}>
                Agregar promo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
