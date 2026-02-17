import React from "react";
import Button from "./ui/Button";
import CloseButton from "./ui/CloseButton";
import styles from "./ItemExtrasModal.module.css";

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
}) {
  React.useEffect(() => {
    if (!open || typeof window === "undefined") return;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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
            const checked = selectedIds.includes(item.id);
            const isUnavailable = item.isAvailable === false;
            const unavailableReason =
              item.unavailableReason || "no disponible por hoy";
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
          {onClear ? (
            <Button type="button" onClick={onClear}>
              {clearLabel}
            </Button>
          ) : null}
          <Button
            variant="primary"
            type="button"
            onClick={onApply}
            disabled={disableApply}>
            {applyLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

