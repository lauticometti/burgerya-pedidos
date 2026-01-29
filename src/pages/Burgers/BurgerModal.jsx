import React from "react";
import styles from "./BurgerModal.module.css";
import { isOpenNow, nextOpenText } from "../../utils/isOpenNow";

const SIZE_ORDER = ["simple", "doble", "triple"];
const SIZE_LABEL = { simple: "Simple", doble: "Doble", triple: "Triple" };

function formatMoney(n) {
  return `$${Number(n).toLocaleString("es-AR")}`;
}

export default function BurgerModal({ open, burger, onClose, onAdd }) {
  const [size, setSize] = React.useState(null);

  React.useEffect(() => {
    if (!open || !burger) return;
    const first = SIZE_ORDER.find((s) => burger.prices?.[s] != null) || null;
    setSize(first);
  }, [open, burger]);

  React.useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !burger) return null;

  const sizes = SIZE_ORDER.filter((s) => burger.prices?.[s] != null);
  const storeOpen = isOpenNow();

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <button className={styles.close} onClick={onClose} type="button">
          ✕
        </button>

        <img
          className={styles.img}
          src={burger.img || "/burgers/placeholder.jpg"}
          alt={burger.name}
        />

        <div className={styles.body}>
          <div className={styles.name}>{burger.name}</div>

          {burger.desc ? (
            <div className={styles.desc}>{burger.desc}</div>
          ) : null}

          <div className={styles.sizeRow}>
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.sizeBtn} ${
                  size === s ? styles.sizeBtnOn : ""
                }`}
                onClick={() => setSize(s)}>
                <div className={styles.sizeTop}>{SIZE_LABEL[s]}</div>
                <div className={styles.sizePrice}>
                  {formatMoney(burger.prices[s])}
                </div>
              </button>
            ))}
          </div>

          <button
            className={styles.addBtn}
            type="button"
            disabled={!size || !storeOpen}
            onClick={() => onAdd?.(burger, size)}>
            {storeOpen
              ? `Agregar ${size ? formatMoney(burger.prices[size]) : ""}`
              : `${nextOpenText()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
