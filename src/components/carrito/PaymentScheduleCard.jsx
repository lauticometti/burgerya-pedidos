import Card from "../ui/Card";
import { TextareaField } from "../ui/FormFields";
import styles from "./PaymentScheduleCard.module.css";

export default function PaymentScheduleCard({
  pay,
  notes,
  onPayChange,
  onNotesChange,
  whenMode,
  whenSlot,
  availableSlots = [],
  onWhenModeChange,
  onWhenSlotChange,
}) {
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

        <div className={styles.question}>Cuándo</div>
        <div className={styles.choiceRow}>
          <button
            type="button"
            className={`${styles.choiceButton} ${
              whenMode === "Ahora" ? styles.choiceButtonActive : ""
            }`}
            aria-pressed={whenMode === "Ahora"}
            onClick={() => onWhenModeChange("Ahora")}>
            Ahora
          </button>
          <button
            type="button"
            className={`${styles.choiceButton} ${
              whenMode === "Mas tarde" ? styles.choiceButtonActive : ""
            }`}
            aria-pressed={whenMode === "Mas tarde"}
            onClick={() => onWhenModeChange("Mas tarde")}>
            Más tarde
          </button>
        </div>
        {whenMode === "Mas tarde" && (
          <div className={styles.slotSelector}>
            <select
              value={whenSlot || ""}
              onChange={(e) => onWhenSlotChange(e.target.value)}>
              <option value="">Selecciona horario</option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        )}

        <TextareaField
          placeholder="Aclaraciones para la entrega"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
        />
      </div>
    </Card>
  );
}
