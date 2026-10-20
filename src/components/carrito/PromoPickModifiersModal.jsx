import { useState } from "react";
import Button from "../ui/Button";
import CloseButton from "../ui/CloseButton";
import styles from "./ModifyIngredientsModal.module.css";
import useEscapeToClose from "../../hooks/useEscapeToClose";
import { getUnavailableReason, isItemUnavailable } from "../../utils/availability";

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

export default function PromoPickModifiersModal({
  open,
  title,
  extras = [],
  selectedExtraIds = [],
  onToggleExtra,
  onApplyExtras,
  onClearExtras,
  disableApplyExtras,
  // { [itemId]: maxCantidad } — items con una entrada acá se muestran con
  // stepper en vez de checkbox. onAdjustQuantity(id, +1 | -1).
  quantityCaps = {},
  onAdjustQuantity,
  removableIngredients = [],
  removedIds = [],
  onToggleRemove,
  onApplyRemove,
  onClearRemove,
  onClose,
}) {
  const hasExtras = extras.length > 0;
  const hasRemovable = removableIngredients.length > 0;
  const defaultTab = hasExtras ? "extras" : "remove";
  const [tab, setTab] = useState(defaultTab);

  useEscapeToClose(open, onClose);

  if (!open) return null;

  const showTabs = hasExtras && hasRemovable;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Modificar ingredientes"}
        onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>{title || "Modificar ingredientes"}</div>
          <CloseButton onClick={onClose} aria-label="Cerrar" />
        </div>

        {showTabs ? (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === "extras" ? styles.tabActive : ""}`}
              onClick={() => setTab("extras")}
              type="button">
              Agregar extras
            </button>
            <button
              className={`${styles.tab} ${tab === "remove" ? styles.tabActive : ""}`}
              onClick={() => setTab("remove")}
              type="button">
              Quitar ingredientes
            </button>
          </div>
        ) : null}

        {(!showTabs && hasExtras) || (showTabs && tab === "extras") ? (
          <>
            {!showTabs ? (
              <div className={styles.sectionLabel}>Agregar extras</div>
            ) : null}
            <div className={styles.list}>
              {extras.map((item) => {
                const hasQuantityCap = Object.prototype.hasOwnProperty.call(quantityCaps, item.id);
                if (hasQuantityCap) {
                  const count = selectedExtraIds.filter((id) => id === item.id).length;
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

                const checked = selectedExtraIds.includes(item.id);
                const unavailable = isItemUnavailable(item);
                const reason = getUnavailableReason(item);
                return (
                  <label
                    key={item.id}
                    className={`${styles.row} ${unavailable ? styles.rowUnavailable : ""}`}
                    data-unavailable-message={unavailable ? reason : undefined}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={checked}
                      disabled={unavailable}
                      aria-disabled={unavailable}
                      title={unavailable ? reason : undefined}
                      onChange={() => {
                        if (unavailable) return;
                        onToggleExtra?.(item.id);
                      }}
                    />
                    <span className={styles.rowNameWrap}>
                      <span className={styles.rowName}>{item.name}</span>
                      {unavailable ? (
                        <span className={styles.unavailableHint}>{reason}</span>
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
                  onClick={onApplyExtras}
                  disabled={disableApplyExtras}>
                  Aplicar
                </Button>
              </div>
              <div className={styles.footerSecondary}>
                {onClearExtras ? (
                  <Button type="button" onClick={onClearExtras}>
                    Limpiar
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        {(!showTabs && hasRemovable) || (showTabs && tab === "remove") ? (
          <>
            {!showTabs ? (
              <div className={styles.sectionLabel}>Quitar ingredientes</div>
            ) : null}
            <div className={styles.list}>
              {removableIngredients.map((ing) => {
                const checked = removedIds.includes(ing.id);
                return (
                  <label
                    key={ing.id}
                    className={`${styles.row} ${checked ? styles.rowOn : ""}`}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={checked}
                      onChange={() => onToggleRemove?.(ing.id)}
                    />
                    <span className={styles.rowName}>{ing.label}</span>
                  </label>
                );
              })}
              {!removableIngredients.length ? (
                <div className={styles.empty}>Sin ingredientes removibles.</div>
              ) : null}
            </div>
            <div className={styles.footer}>
              <div className={styles.footerPrimary}>
                <Button variant="primary" type="button" onClick={onApplyRemove}>
                  Aplicar
                </Button>
              </div>
              <div className={styles.footerSecondary}>
                <Button type="button" onClick={onClearRemove}>
                  Limpiar
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
