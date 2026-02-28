import React from "react";
import styles from "./BurgerModal.module.css";
import { formatMoney } from "../../utils/formatMoney";
import { resolvePublicPath } from "../../utils/assetPath";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import CloseButton from "../../components/ui/CloseButton";
import useEscapeToClose from "../../hooks/useEscapeToClose";

const SIZE_ORDER = ["simple", "doble", "triple"];
const SIZE_LABEL = { simple: "Simple", doble: "Doble", triple: "Triple" };

export default function BurgerModal({ open, burger, onClose, onAdd }) {
  const [size, setSize] = React.useState(null);

  React.useEffect(() => {
    if (!open || !burger) return;
    const first = SIZE_ORDER.find((s) => burger.prices?.[s] != null) || null;
    setSize(first);
  }, [open, burger]);

  useEscapeToClose(open, onClose);

  if (!open || !burger) return null;

  const isTitanica = burger.id === "titanica";
  const sizes = SIZE_ORDER.filter((s) => burger.prices?.[s] != null);
  const selectedSize = isTitanica ? "triple" : size;
  const selectedPrice = selectedSize ? getBurgerPriceInfo(burger, selectedSize) : null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <CloseButton className={styles.closeButton} onClick={onClose} />

        <img
          className={styles.img}
          src={resolvePublicPath(burger.img || "/burgers/placeholder.jpg")}
          alt={burger.name}
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />

        <div className={styles.body}>
          <div className={styles.name}>
            {burger.name}
            <span className={styles.nameWithFries}> con papas</span>
          </div>

          {burger.desc ? <div className={styles.desc}>{burger.desc}</div> : null}

          {!isTitanica ? (
            <div className={styles.sizeRow}>
              {sizes.map((s) => {
                const price = getBurgerPriceInfo(burger, s);
                return (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.sizeBtn} ${size === s ? styles.sizeBtnOn : ""}`}
                    onClick={() => setSize(s)}>
                    <div className={styles.sizeTop}>{SIZE_LABEL[s]}</div>
                    <div className={styles.sizePriceWrap}>
                      {price.hasDiscount ? (
                        <div className={styles.sizePriceBase}>
                          {formatMoney(price.basePrice)}
                        </div>
                      ) : null}
                      <div className={styles.sizePrice}>
                        {formatMoney(price.finalPrice)}
                      </div>
                      {price.hasDiscount ? (
                        <div className={styles.sizePriceDiscount}>
                          -{formatMoney(price.discountAmount)}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          <button
            className={`${styles.addBtn} ${isTitanica ? styles.addBtnChallenge : ""}`}
            type="button"
            disabled={!selectedSize}
            onClick={() => onAdd?.(burger, selectedSize)}>
            {isTitanica && selectedPrice
              ? `Yo me animo - ${formatMoney(selectedPrice.finalPrice)}`
              : selectedPrice
              ? `Agregar ${formatMoney(selectedPrice.finalPrice)}`
              : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}


