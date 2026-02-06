import { useEffect } from "react";
import CloseButton from "../ui/CloseButton";
import baseStyles from "../ItemExtrasModal.module.css";
import styles from "./TimeSlotModal.module.css";

export default function TimeSlotModal({
  open,
  slots,
  selectedValue,
  onSelect,
  onClose,
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

  return (
    <div className={baseStyles.backdrop} onMouseDown={onClose}>
      <div
        className={`${baseStyles.card} ${styles.card}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <div className={baseStyles.header}>
          <div>
            <div className={baseStyles.title}>Elegí un horario</div>
            <div className={baseStyles.desc}>
              Seleccioná un horario disponible.
            </div>
          </div>
          <CloseButton onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className={baseStyles.list}>
          {slots.map((slot) => {
            const isSelected = slot.value === selectedValue;
            return (
              <button
                key={slot.value}
                type="button"
                className={`${styles.slotRow} ${
                  isSelected ? styles.slotRowSelected : ""
                }`}
                onClick={() => onSelect(slot.value)}>
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
