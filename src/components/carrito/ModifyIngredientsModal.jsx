import { useEffect, useState } from "react";
import Button from "../ui/Button";
import CloseButton from "../ui/CloseButton";
import { TextareaField } from "../ui/FormFields";
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

export default function ModifyIngredientsModal({
  open,
  title,
  extras = [],
  removableIngredients = [],
  initialExtraIds = [],
  initialRemovedIds = [],
  initialNote = "",
  showNote = true,
  // { [itemId]: maxCantidad } — items con una entrada acá se muestran con
  // stepper en vez de checkbox.
  quantityCaps = {},
  onApply,
  onClose,
}) {
  const hasExtras = extras.length > 0;
  const hasRemovable = removableIngredients.length > 0;
  const [tab, setTab] = useState("extras");
  const [extraIds, setExtraIds] = useState(initialExtraIds);
  const [removedIds, setRemovedIds] = useState(initialRemovedIds);
  const [note, setNote] = useState(initialNote);

  useEscapeToClose(open, onClose);

  useEffect(() => {
    if (!open) return;
    setTab(hasExtras ? "extras" : "remove");
    setExtraIds(initialExtraIds);
    setRemovedIds(initialRemovedIds);
    setNote(initialNote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const showTabs = hasExtras && hasRemovable;

  function toggleExtra(id) {
    const item = extras.find((e) => e.id === id);
    if (isItemUnavailable(item)) return;
    setExtraIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  }

  function adjustExtraQuantity(id, delta) {
    setExtraIds((prev) => {
      if (delta > 0) {
        const count = prev.filter((x) => x === id).length;
        if (count >= (quantityCaps[id] ?? 0)) return prev;
        return [...prev, id];
      }
      const idx = prev.lastIndexOf(id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }

  function toggleRemove(id) {
    setRemovedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  }

  function handleApply() {
    // .map sobre extraIds (no .filter del catalogo) para conservar
    // agregados repetidos, ej. varias "Carne c/cheddar".
    const selectedExtras = extraIds
      .map((id) => extras.find((item) => item.id === id))
      .filter((item) => item && !isItemUnavailable(item));
    const selectedRemoved = removableIngredients.filter((ing) =>
      removedIds.includes(ing.id),
    );
    onApply?.({
      extras: selectedExtras,
      removedIngredients: selectedRemoved,
      note,
    });
  }

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Personalizar burger"}
        onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>{title || "Personalizar burger"}</div>
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
                  const count = extraIds.filter((id) => id === item.id).length;
                  return (
                    <QuantityRow
                      key={item.id}
                      item={item}
                      count={count}
                      max={quantityCaps[item.id]}
                      onAdjust={adjustExtraQuantity}
                    />
                  );
                }

                const checked = extraIds.includes(item.id);
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
                      onChange={() => toggleExtra(item.id)}
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
                      onChange={() => toggleRemove(ing.id)}
                    />
                    <span className={styles.rowName}>{ing.label}</span>
                  </label>
                );
              })}
              {!removableIngredients.length ? (
                <div className={styles.empty}>Sin ingredientes removibles.</div>
              ) : null}
            </div>
          </>
        ) : null}

        {showNote ? (
          <div className={styles.noteSection}>
            <div className={styles.sectionLabel}>
              Aclaración para esta burger (opcional)
            </div>
            <TextareaField
              placeholder="Ej: bien cocida, cortar al medio"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              className={styles.noteInput}
            />
          </div>
        ) : null}

        <div className={styles.footer}>
          <div className={styles.footerPrimary}>
            <Button variant="primary" type="button" onClick={handleApply}>
              Aplicar cambios
            </Button>
          </div>
          <div className={styles.footerSecondary}>
            <Button type="button" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
