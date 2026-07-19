import Button from "../ui/Button";
import CloseButton from "../ui/CloseButton";
import { formatMoney } from "../../utils/formatMoney";
import styles from "./PapasOptionModal.module.css";
import useEscapeToClose from "../../hooks/useEscapeToClose";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";

export default function PapasOptionModal({
  open,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  onConfirm,
}) {
  useEscapeToClose(open, onClose);

  if (!open) return null;
  const selectedOption = options.find((item) => item.id === selectedId);
  const disableConfirm = !selectedId || isItemUnavailable(selectedOption);

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
          {options.map((item) => {
            const isUnavailable = isItemUnavailable(item);
            const unavailableReason = getUnavailableReason(item);
            return (
              <label
                key={item.id}
                className={`${styles.row} ${
                  isUnavailable ? styles.rowUnavailable : ""
                }`}
                data-unavailable-message={
                  isUnavailable ? unavailableReason : undefined
                }>
                <input
                  type="radio"
                  name="papas-option"
                  checked={selectedId === item.id}
                  disabled={isUnavailable}
                  aria-disabled={isUnavailable}
                  title={isUnavailable ? unavailableReason : undefined}
                  onChange={() => {
                    if (isUnavailable) return;
                    onSelect?.(item.id);
                  }}
                  className={styles.radio}
                />
                <span className={styles.rowNameWrap}>
                  <span className={styles.rowName}>{item.label}</span>
                  {isUnavailable ? (
                    <span className={styles.unavailableHint}>
                      {unavailableReason}
                    </span>
                  ) : null}
                </span>
                <span className={styles.rowPrice}>{formatMoney(item.price)}</span>
              </label>
            );
          })}
        </div>

        <div className={styles.footer}>
          <Button
            variant="primary"
            type="button"
            onClick={onConfirm}
            disabled={disableConfirm}>
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}
