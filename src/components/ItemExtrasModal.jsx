import React from "react";
import Button from "./ui/Button";
import CloseButton from "./ui/CloseButton";
import styles from "./ItemExtrasModal.module.css";
import useEscapeToClose from "../hooks/useEscapeToClose";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../utils/availability";

// Fila con stepper (-, cantidad, +) en vez de checkbox: para agregados que
// se pueden sumar varias veces (ej. "Carne c/cheddar"), acotados por
// `quantityCaps[item.id]`. El resto de los agregados sigue siendo on/off.
function QuantityRow({ item, count, max, onAdjust }) {
  return (
    <div className={`${styles.row} ${styles.rowQty}`}>
      <span className={styles.rowNameWrap}>
        <span className={styles.rowName}>{item.name}</span>
        <span className={styles.rowPriceEach}>
          +${item.price.toLocaleString("es-AR")} c/u
        </span>
      </span>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepperBtn}
          disabled={count <= 0}
          aria-label={`Sacar una unidad de ${item.name}`}
          onClick={() => onAdjust(item.id, -1)}>
          −
        </button>
        <span className={styles.stepperCount}>{count}</span>
        <button
          type="button"
          className={styles.stepperBtn}
          disabled={count >= max}
          aria-label={`Sumar una unidad de ${item.name}`}
          onClick={() => onAdjust(item.id, 1)}>
          +
        </button>
      </div>
    </div>
  );
}

export default function ItemExtrasModal({
  open,
  title,
  description,
  items,
  selectedIds,
  onToggle,
  onClose,
  onApply,
  applyLabel = "Aplicar",
  disableApply,
  onClear,
  clearLabel = "Limpiar",
  // { [itemId]: maxCantidad } — items con una entrada acá se muestran con
  // stepper en vez de checkbox. onAdjustQuantity(id, +1 | -1).
  quantityCaps = {},
  onAdjustQuantity,
}) {
  useEscapeToClose(open, onClose);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.card}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{title}</div>
            {description ? <div className={styles.desc}>{description}</div> : null}
          </div>
          <CloseButton onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className={styles.list}>
          {items.map((item) => {
            const hasQuantityCap = Object.prototype.hasOwnProperty.call(quantityCaps, item.id);
            if (hasQuantityCap) {
              const count = selectedIds.filter((id) => id === item.id).length;
              return (
                <QuantityRow
                  key={item.id}
                  item={item}
                  count={count}
                  max={quantityCaps[item.id]}
                  onAdjust={onAdjustQuantity}
                />
              );
            }

            const checked = selectedIds.includes(item.id);
            const isUnavailable = isItemUnavailable(item);
            const unavailableReason =
              getUnavailableReason(item);
            return (
              <label
                key={item.id}
                className={`${styles.row} ${isUnavailable ? styles.rowUnavailable : ""}`}
                data-unavailable-message={
                  isUnavailable ? unavailableReason : undefined
                }>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isUnavailable}
                  aria-disabled={isUnavailable}
                  title={isUnavailable ? unavailableReason : undefined}
                  onChange={() => {
                    if (isUnavailable) return;
                    onToggle(item.id);
                  }}
                  className={styles.checkbox}
                />
                <span className={styles.rowNameWrap}>
                  <span className={styles.rowName}>{item.name}</span>
                  {isUnavailable ? (
                    <span className={styles.unavailableHint}>
                      {unavailableReason}
                    </span>
                  ) : null}
                </span>
                <span className={styles.rowPrice}>
                  +${item.price.toLocaleString("es-AR")}
                </span>
              </label>
            );
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerPrimary}>
            <Button
              variant="primary"
              type="button"
              onClick={onApply}
              disabled={disableApply}>
              {applyLabel}
            </Button>
          </div>
          <div className={styles.footerSecondary}>
            {onClear ? (
              <Button type="button" onClick={onClear}>
                {clearLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
