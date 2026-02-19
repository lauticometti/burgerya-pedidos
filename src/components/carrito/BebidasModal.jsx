import { useEffect } from "react";
import Button from "../ui/Button";
import CloseButton from "../ui/CloseButton";
import baseStyles from "../ItemExtrasModal.module.css";
import styles from "./BebidasModal.module.css";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";

export default function BebidasModal({
  open,
  items,
  quantities,
  onChangeQty,
  onClose,
  onApply,
}) {
  useEffect(() => {
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

  const totalQty = (items || []).reduce((sum, item) => {
    if (isItemUnavailable(item)) return sum;
    return sum + (quantities?.[item.id] || 0);
  }, 0);

  return (
    <div className={baseStyles.backdrop} onMouseDown={onClose}>
      <div
        className={baseStyles.card}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <div className={baseStyles.header}>
          <div>
            <div className={baseStyles.title}>Bebidas</div>
            <div className={baseStyles.desc}>
              Sumá una bebida para acompañar tu pedido.
            </div>
          </div>
          <CloseButton onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className={baseStyles.list}>
          {items.map((item) => {
            const qty = quantities?.[item.id] || 0;
            const isUnavailable = isItemUnavailable(item);
            const unavailableReason = getUnavailableReason(item);
            return (
              <div
                key={item.id}
                className={`${baseStyles.row} ${styles.row} ${
                  isUnavailable ? styles.rowUnavailable : ""
                }`}
                data-unavailable-message={
                  isUnavailable ? unavailableReason : undefined
                }>
                <div className={styles.qtyControls}>
                  <Button
                    size="xs"
                    onClick={() => {
                      if (isUnavailable) return;
                      onChangeQty(item.id, -1);
                    }}
                    disabled={qty === 0 || isUnavailable}
                    title={isUnavailable ? unavailableReason : undefined}>
                    -
                  </Button>
                  <span className={styles.qty}>{qty}</span>
                  <Button
                    size="xs"
                    onClick={() => {
                      if (isUnavailable) return;
                      onChangeQty(item.id, 1);
                    }}
                    disabled={isUnavailable}
                    title={isUnavailable ? unavailableReason : undefined}>
                    +
                  </Button>
                </div>
                <span className={styles.nameWrap}>
                  <span className={baseStyles.rowName}>{item.name}</span>
                  {isUnavailable ? (
                    <span className={styles.unavailableHint}>
                      {unavailableReason}
                    </span>
                  ) : null}
                </span>
                <span className={baseStyles.rowPrice}>
                  +${item.price.toLocaleString("es-AR")}
                </span>
              </div>
            );
          })}
        </div>

        <div className={baseStyles.footer}>
          <Button
            variant="primary"
            type="button"
            onClick={onApply}
            disabled={totalQty === 0}>
            Agregar bebidas
          </Button>
        </div>
      </div>
    </div>
  );
}

