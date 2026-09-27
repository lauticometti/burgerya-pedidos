import Card from "../ui/Card";
import { TextareaField, TextInput } from "../ui/FormFields";
import { resolveMixedPayment } from "../../utils/checkoutTotals";
import styles from "./PaymentScheduleCard.module.css";

function digitsOnly(value) {
  return value.replace(/[^\d]/g, "");
}

export default function PaymentScheduleCard({
  pay,
  payCashAmount,
  total = 0,
  notes,
  onPayChange,
  onPayCashAmountChange,
  onNotesChange,
  whenMode,
  whenSlot,
  availableSlots = [],
  onWhenModeChange,
  onWhenSlotChange,
}) {
  const isMixed = pay === "Mixto";
  // Mixto: se guarda solo el efectivo; la transferencia es siempre
  // total - efectivo. Si el total cambia (otra zona de envio, otro descuento)
  // el efectivo se conserva y la transferencia se recalcula sola.
  const mixed = resolveMixedPayment({ cashInput: payCashAmount, total });

  function selectMixed() {
    onPayChange("Mixto");
    if (!mixed.valid) onPayCashAmountChange(String(total));
  }

  function handleCashChange(raw) {
    onPayCashAmountChange(digitsOnly(raw));
  }

  function handleTransferChange(raw) {
    const clean = digitsOnly(raw);
    if (clean === "") {
      onPayCashAmountChange("");
      return;
    }
    const transferNum = Math.min(Number(clean), total);
    onPayCashAmountChange(String(Math.max(total - transferNum, 0)));
  }

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
          <button
            type="button"
            className={`${styles.choiceButton} ${
              isMixed ? styles.choiceButtonActive : ""
            }`}
            aria-pressed={isMixed}
            onClick={selectMixed}>
            Efectivo + Transferencia
          </button>
        </div>

        {isMixed ? (
          <div className={styles.splitPayRow}>
            <div className={styles.splitPayField}>
              <label className={styles.splitPayLabel}>Efectivo</label>
              <TextInput
                type="text"
                inputMode="numeric"
                placeholder="$0"
                value={mixed.cash == null ? payCashAmount : String(mixed.cash)}
                onChange={(e) => handleCashChange(e.target.value)}
              />
            </div>
            <div className={styles.splitPayField}>
              <label className={styles.splitPayLabel}>Transferencia</label>
              <TextInput
                type="text"
                inputMode="numeric"
                placeholder="$0"
                value={mixed.transfer == null ? "" : String(mixed.transfer)}
                onChange={(e) => handleTransferChange(e.target.value)}
              />
            </div>
          </div>
        ) : null}

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
              {availableSlots.map((slot, idx) => (
                <option key={`${slot.value}-${idx}`} value={slot.value}>
                  {slot.label}
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
