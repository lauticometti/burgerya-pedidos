import React from "react";
import CloseButton from "../../components/ui/CloseButton";
import useEscapeToClose from "../../hooks/useEscapeToClose";
import { resolvePublicPath } from "../../utils/assetPath";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import { formatMoney } from "../../utils/formatMoney";
import { useStoreStatus } from "../../utils/storeClosedMode";
import styles from "./BurgerModal.module.css";

const SIZE_ORDER = ["simple", "doble", "triple"];
const SIZE_LABEL = { simple: "Simple", doble: "Doble", triple: "Triple" };

export default function BurgerModal({ open, burger, origin, onClose, onAdd }) {
  const [size, setSize] = React.useState(null);
  const [show, setShow] = React.useState(false);
  const [removedIds, setRemovedIds] = React.useState([]);
  const { closedActionLabel, isClosed, reopenText } = useStoreStatus();

  React.useEffect(() => {
    if (!open || !burger) return;
    const first = SIZE_ORDER.find((candidate) => burger.prices?.[candidate] != null) || null;
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
  const sizes = SIZE_ORDER.filter((candidate) => burger.prices?.[candidate] != null);
  const selectedSize = isTitanica ? "triple" : size;
  const selectedPrice = selectedSize ? getBurgerPriceInfo(burger, selectedSize) : null;
  const removableIngredients = burger.removableIngredients || [];
  const selectedRemovals = removableIngredients.filter((ingredient) =>
    removedIds.includes(ingredient.id),
  );
  const originStyle = origin
    ? { "--origin-x": `${origin.x}px`, "--origin-y": `${origin.y}px` }
    : undefined;
  const burgerImg =
    origin?.imageSrc || resolvePublicPath(burger.img || "/burgers/placeholder.jpg");
  const addDisabled = !selectedSize || isClosed;

  return (
    <div
      className={`${styles.backdrop} ${show ? styles.backdropShow : ""}`}
      style={originStyle}
      onMouseDown={onClose}>
      <span className={styles.burst} aria-hidden />
      <div
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
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
              fetchPriority="high"
            />

            <div className={styles.name}>
              <span>{burger.name}</span>
              <span className={styles.nameSide}>con papas</span>
            </div>

            {!isTitanica ? (
              <div className={styles.sizeRow}>
                {sizes.map((candidate) => {
                  return (
                    <button
                      key={candidate}
                      type="button"
                      className={`${styles.sizeBtn} ${
                        size === candidate ? styles.sizeBtnOn : ""
                      }`}
                      onClick={() => setSize(candidate)}>
                      <div className={styles.sizeTop}>{SIZE_LABEL[candidate]}</div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selectedPrice ? (
              <div className={styles.pricePanel}>
                {selectedPrice.hasDiscount ? (
                  <div className={styles.priceBase}>
                    {formatMoney(selectedPrice.basePrice)}
                  </div>
                ) : null}
                <div className={styles.priceValue}>
                  {formatMoney(selectedPrice.finalPrice)}
                </div>
              </div>
            ) : null}

            {removableIngredients.length ? (
              <div className={styles.customizer}>
                <div className={styles.customizerTitle}>Sacale lo que no quieras</div>
                <div className={styles.customizerSubtitle}>Toca para quitar:</div>
                <div className={styles.customizerGrid}>
                  {removableIngredients.map((ingredient) => {
                    const checked = removedIds.includes(ingredient.id);
                    return (
                      <label
                        key={ingredient.id}
                        className={`${styles.customizerOption} ${
                          checked ? styles.customizerOptionOn : ""
                        }`}>
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

            <details className={styles.details}>
              <summary className={styles.detailsSummary}>Ver ingredientes</summary>
              <div className={styles.detailsBody}>
                {burger.desc ? <div className={styles.desc}>{burger.desc}</div> : null}
              </div>
            </details>
          </div>

          <div className={styles.footer}>
            <button
              className={`${styles.addBtn} ${isTitanica ? styles.addBtnChallenge : ""}`}
              type="button"
              disabled={addDisabled}
              onClick={() => onAdd?.(burger, selectedSize, selectedRemovals)}>
              {isClosed
                ? closedActionLabel || reopenText
                : isTitanica
                  ? "Yo me animo"
                  : "Sumar al pedido"}
            </button>
            {isClosed ? <div className={styles.footerNote}>{reopenText}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
