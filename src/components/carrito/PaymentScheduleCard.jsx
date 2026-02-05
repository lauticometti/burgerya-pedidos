import Card from "../ui/Card";
import { SelectField, TextareaField } from "../ui/FormFields";
import styles from "./PaymentScheduleCard.module.css";

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
  return (
    <Card className={styles.card}>
      <div className={styles.title}>Pago y horario</div>
      <div className={styles.fields}>
        <SelectField value={pay} onChange={(e) => onPayChange(e.target.value)}>
          <option>Efectivo</option>
          <option>Transferencia</option>
        </SelectField>

        <SelectField
          value={whenMode}
          onChange={(e) => onWhenModeChange(e.target.value)}>
          <option value="Ahora">Lo antes posible</option>
          <option value="Más tarde">Para más tarde</option>
        </SelectField>

        {whenMode === "Más tarde" &&
          (availableSlots.length ? (
            <SelectField
              value={whenSlot}
              onChange={(e) => onWhenSlotChange(e.target.value)}>
              {availableSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </SelectField>
          ) : (
            <div className={styles.emptySlots}>
              No hay horarios disponibles hoy (mínimo +30 min).
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

