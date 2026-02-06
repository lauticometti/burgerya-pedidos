import Card from "../ui/Card";
import { TextInput } from "../ui/FormFields";
import styles from "./DeliveryDetailsCard.module.css";

export default function DeliveryDetailsCard({
  deliveryMode,
  onDeliveryModeChange,
  name,
  address,
  cross,
  onNameChange,
  onAddressChange,
  onCrossChange,
}) {
  const hasDeliveryMode = !!deliveryMode;
  const isDelivery = deliveryMode === "Delivery";

  return (
    <Card className={styles.card}>
      <div className={styles.title}>Datos de entrega</div>
      <div className={styles.fields}>
        <div className={styles.question}>¿Delivery o retirás vos?</div>
        <div className={styles.modeRow}>
          <button
            type="button"
            className={`${styles.modeButton} ${
              deliveryMode === "Delivery" ? styles.modeButtonActive : ""
            }`}
            aria-pressed={deliveryMode === "Delivery"}
            onClick={() => onDeliveryModeChange("Delivery")}>
            Delivery
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${
              deliveryMode === "Retiro" ? styles.modeButtonActive : ""
            }`}
            aria-pressed={deliveryMode === "Retiro"}
            onClick={() => onDeliveryModeChange("Retiro")}>
            Retiro
          </button>
        </div>
        {hasDeliveryMode ? (
          <>
            <TextInput
              placeholder="Nombre"
              value={name}
              autoComplete="name"
              onChange={(e) => onNameChange(e.target.value)}
            />
            {isDelivery ? (
              <>
                <TextInput
                  placeholder="Calle y altura"
                  value={address}
                  autoComplete="street-address"
                  onChange={(e) => onAddressChange(e.target.value)}
                />
                <TextInput
                  placeholder="Entre calles (opcional, pero ponelas)"
                  value={cross}
                  autoComplete="address-line2"
                  onChange={(e) => onCrossChange(e.target.value)}
                />
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </Card>
  );
}
