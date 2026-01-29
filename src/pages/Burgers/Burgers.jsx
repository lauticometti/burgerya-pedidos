import React from "react";
import { Link } from "react-router-dom";
import { burgers } from "../../data/menu"; // ajustá path
import { useCart } from "../../store/useCart";
import styles from "./Burgers.module.css";
import BurgerModal from "./BurgerModal";
import { toast } from "../../utils/toast";
import { formatMoney } from "../../utils/formatMoney";

function minPrice(prices) {
  const vals = Object.values(prices || {}).filter((v) => typeof v === "number");
  return vals.length ? Math.min(...vals) : 0;
}

export default function Burgers() {
  const cart = useCart();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeBurger, setActiveBurger] = React.useState(null);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.leftBtns}>
          <Link to="/">
            <button className={styles.btn}>← Volver</button>
          </Link>
          <Link to="/checkout">
            <button className={styles.btn}>✅ Checkout</button>
          </Link>
        </div>

        <div className={styles.totalPill}>
          <div className={styles.totalLabel}>Total</div>
          <div className={styles.totalValue}>{formatMoney(cart.total)}</div>
        </div>
      </div>

      <h1 className={styles.title}>Burgers</h1>
      <div className={styles.list}>
        {["BASICA", "PREMIUM", "DELUXE", "ESPECIAL"].map((tier) => {
          const list = burgers.filter((b) => b.tier === tier);
          const title =
            tier === "BASICA"
              ? "Básicas"
              : tier === "PREMIUM"
                ? "Premium"
                : tier === "DELUXE"
                  ? "Deluxe"
                  : "Bestias";
          if (!list.length) return null;

          return (
            <div key={tier} className={styles.section}>
              <div className={styles.sectionTitle}>{title}</div>
              <div className={styles.list}>
                {list.map((b) => (
                  <button
                    key={b.id}
                    className={styles.item}
                    onClick={() => {
                      setActiveBurger(b);
                      setModalOpen(true);
                    }}
                    type="button">
                    <div className={styles.itemLeft}>
                      <div className={styles.itemName}>{b.name}</div>
                      <div className={styles.itemPrices}>
                        Desde {formatMoney(minPrice(b.prices))}
                      </div>
                    </div>

                    <div className={styles.thumbWrap}>
                      <img
                        className={styles.thumb}
                        src={b.img || "/burgers/placeholder.jpg"}
                        alt={b.name}
                        loading="lazy"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <BurgerModal
        open={modalOpen}
        burger={activeBurger}
        onClose={() => setModalOpen(false)}
        onAdd={(burger, size) => {
          const key = `burger:${burger.id}:${size}`;
          cart.add({
            key,
            name: `${burger.name} (${size})`,
            qty: 1,
            unitPrice: burger.prices[size],
            meta: { type: "burger", burgerId: burger.id, size },
          });
          // no cerramos el modal (como pediste)
          toast.success(
            `Agregado: ${burger.name} (${size}) — ${formatMoney(burger.prices[size])}`,
          );
        }}
      />
    </div>
  );
}
