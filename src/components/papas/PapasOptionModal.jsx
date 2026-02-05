import Button from "../ui/Button";
import CloseButton from "../ui/CloseButton";
import { formatMoney } from "../../utils/formatMoney";
import styles from "./PapasOptionModal.module.css";

export default function PapasOptionModal({
  open,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  onConfirm,
}) {
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
            <div className={styles.desc}>Elegí una opción</div>
          </div>
          <CloseButton onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className={styles.list}>
          {options.map((item) => (
            <label key={item.id} className={styles.row}>
              <input
                type="radio"
                name="papas-option"
                checked={selectedId === item.id}
                onChange={() => onSelect?.(item.id)}
                className={styles.radio}
              />
              <span className={styles.rowName}>{item.label}</span>
              <span className={styles.rowPrice}>{formatMoney(item.price)}</span>
            </label>
          ))}
        </div>

        <div className={styles.footer}>
          <Button
            variant="primary"
            type="button"
            onClick={onConfirm}
            disabled={!selectedId}>
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}
