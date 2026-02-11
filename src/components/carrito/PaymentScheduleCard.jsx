import Card from "../ui/Card";
import { useEffect, useState } from "react";
import { TextareaField } from "../ui/FormFields";
import styles from "./PaymentScheduleCard.module.css";
import TimeSlotModal from "./TimeSlotModal";

export default function PaymentScheduleCard({
  pay,
  whenMode,
  whenSlot,
  availableSlots,
  notes,
  onPayChange,
  onWhenModeChange,
  onWhenSlotChange,
  onNotesChange,
}) {
  const [slotOpen, setSlotOpen] = useState(false);

  useEffect(() => {
    if (whenMode !== "Más tarde") {
      setSlotOpen(false);
    }
  }, [whenMode]);

  return (
    <Card className={styles.card}>
      <div className={styles.fields}>
        <div className={styles.question}>Pago</div>
        <div className={styles.choiceRow}>
          <button
            type="button"
            className={`${styles.choiceButton} ${
              pay === "Efectivo" ? styles.choiceButtonActive : ""
            }`}
            aria-pressed={pay === "Efectivo"}
            onClick={() => onPayChange("Efectivo")}>
            Efectivo
          </button>
          <button
            type="button"
            className={`${styles.choiceButton} ${
              pay === "Transferencia" ? styles.choiceButtonActive : ""
            }`}
            aria-pressed={pay === "Transferencia"}
            onClick={() => onPayChange("Transferencia")}>
            Transferencia
          </button>
        </div>

        <div className={styles.question}>Horario</div>
        <div className={styles.choiceRow}>
          <button
            type="button"
            className={`${styles.choiceButton} ${
              whenMode === "Ahora" ? styles.choiceButtonActive : ""
            }`}
            aria-pressed={whenMode === "Ahora"}
            onClick={() => onWhenModeChange("Ahora")}>
            Lo antes posible
          </button>
          <button
            type="button"
            className={`${styles.choiceButton} ${
              whenMode === "Más tarde" ? styles.choiceButtonActive : ""
            }`}
            aria-pressed={whenMode === "Más tarde"}
            onClick={() => onWhenModeChange("Más tarde")}>
            Para más tarde
          </button>
        </div>

        {whenMode === "Más tarde" &&
          (availableSlots.length ? (
            <>
              <button
                type="button"
                className={styles.slotButton}
                onClick={() => setSlotOpen(true)}>
                {whenSlot || "Elegí horario"}
              </button>
              <TimeSlotModal
                open={slotOpen}
                slots={availableSlots}
                selectedValue={whenSlot}
                onSelect={(value) => {
                  onWhenSlotChange(value);
                  setSlotOpen(false);
                }}
                onClose={() => setSlotOpen(false)}
              />
            </>
          ) : (
            <div className={styles.emptySlots}>
              No hay horarios disponibles hoy.
            </div>
          ))}

        <TextareaField
          placeholder="Aclaraciones para la entrega (ej: tocar timbre 2)"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
        />
      </div>
    </Card>
  );
}

