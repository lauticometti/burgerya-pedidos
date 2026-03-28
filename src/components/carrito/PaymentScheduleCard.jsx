import Card from "../ui/Card";
import { TextareaField } from "../ui/FormFields";
import styles from "./PaymentScheduleCard.module.css";

export default function PaymentScheduleCard({
  pay,
  notes,
  onPayChange,
  onNotesChange,
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
