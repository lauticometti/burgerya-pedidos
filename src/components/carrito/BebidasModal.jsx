import Button from "../ui/Button";
import CloseButton from "../ui/CloseButton";
import baseStyles from "../ItemExtrasModal.module.css";
import styles from "./BebidasModal.module.css";

export default function BebidasModal({
  open,
  items,
  quantities,
  onChangeQty,
  onClose,
  onApply,
}) {
  if (!open) return null;

  const totalQty = Object.values(quantities || {}).reduce(
    (sum, qty) => sum + qty,
    0,
  );

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
            return (
              <div key={item.id} className={`${baseStyles.row} ${styles.row}`}>
                <div className={styles.qtyControls}>
                  <Button
                    size="xs"
                    onClick={() => onChangeQty(item.id, -1)}
                    disabled={qty === 0}>
                    -
                  </Button>
                  <span className={styles.qty}>{qty}</span>
                  <Button size="xs" onClick={() => onChangeQty(item.id, 1)}>
                    +
                  </Button>
                </div>
                <span className={baseStyles.rowName}>{item.name}</span>
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
