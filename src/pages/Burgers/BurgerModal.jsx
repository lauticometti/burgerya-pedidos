import React from "react";
import styles from "./BurgerModal.module.css";
import { formatMoney } from "../../utils/formatMoney";
import { resolvePublicPath } from "../../utils/assetPath";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import CloseButton from "../../components/ui/CloseButton";
import useEscapeToClose from "../../hooks/useEscapeToClose";
import { STORE_CLOSED_MODE, STORE_REOPEN_TEXT } from "../../utils/storeClosedMode";

const SIZE_ORDER = ["simple", "doble", "triple"];
const SIZE_LABEL = { simple: "Simple", doble: "Doble", triple: "Triple" };

export default function BurgerModal({ open, burger, origin, onClose, onAdd }) {
  const [size, setSize] = React.useState(null);
  const [show, setShow] = React.useState(false);
  const [removedIds, setRemovedIds] = React.useState([]);

  React.useEffect(() => {
    if (!open || !burger) return;
    const first = SIZE_ORDER.find((s) => burger.prices?.[s] != null) || null;
    setSize(first);
    setRemovedIds([]);
  }, [open, burger]);

  useEscapeToClose(open, onClose);

  React.useEffect(() => {
    if (!open) {
      setShow(false);
      return;
    }
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open || !burger) return null;

  const isTitanica = burger.id === "titanica";
  const sizes = SIZE_ORDER.filter((s) => burger.prices?.[s] != null);
  const selectedSize = isTitanica ? "triple" : size;
  const selectedPrice = selectedSize ? getBurgerPriceInfo(burger, selectedSize) : null;
  const removableIngredients = burger.removableIngredients || [];
  const selectedRemovals = removableIngredients.filter((ing) =>
    removedIds.includes(ing.id),
  );
  const originStyle = origin
    ? { "--origin-x": `${origin.x}px`, "--origin-y": `${origin.y}px` }
    : undefined;
  const burgerImg =
    origin?.imageSrc ||
    resolvePublicPath(burger.img || "/burgers/placeholder.jpg");
  const isClosed = STORE_CLOSED_MODE;
  const addDisabled = !selectedSize || isClosed;

  return (
    <div
      className={`${styles.backdrop} ${show ? styles.backdropShow : ""}`}
      style={originStyle}
      onMouseDown={onClose}>
      <span className={styles.burst} aria-hidden />
      <div
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <CloseButton className={styles.closeButton} onClick={onClose} />

        <div className={styles.body}>
          <div className={styles.content}>
            <img
              className={styles.img}
              src={burgerImg}
              alt={burger.name}
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />

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
                        {price.offerLabel ? (
                          <div className={styles.sizeOffer}>{price.offerLabel}</div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {removableIngredients.length ? (
              <div className={styles.customizer}>
                <div className={styles.customizerTitle}>Sacale lo que no quieras</div>
                <div className={styles.customizerSubtitle}>Tocá para quitar:</div>
                <div className={styles.customizerGrid}>
                  {removableIngredients.map((ingredient) => {
                    const checked = removedIds.includes(ingredient.id);
                    return (
                      <label
                        key={ingredient.id}
                        className={`${styles.customizerOption} ${checked ? styles.customizerOptionOn : ""}`}>
                        <input
                          type="checkbox"
                          className={styles.customizerCheckbox}
                          checked={checked}
                          onChange={() =>
                            setRemovedIds((prev) =>
                              prev.includes(ingredient.id)
                                ? prev.filter((id) => id !== ingredient.id)
                                : [...prev, ingredient.id],
                            )
                          }
                        />
                        <span className={styles.customizerLabel}>{ingredient.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.footer}>
            <button
              className={`${styles.addBtn} ${isTitanica ? styles.addBtnChallenge : ""}`}
              type="button"
              disabled={addDisabled}
              onClick={() => onAdd?.(burger, selectedSize, selectedRemovals)}>
              {isClosed
                ? `Cerrado hoy · ${STORE_REOPEN_TEXT}`
                : isTitanica && selectedPrice
                  ? `Yo me animo - ${formatMoney(selectedPrice.finalPrice)}`
                  : selectedPrice
                    ? `Sumar al pedido · ${formatMoney(selectedPrice.finalPrice)}`
                    : "Sumar al pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


