import Card from "../ui/Card";
import { AutoGrowTextField, TextInput } from "../ui/FormFields";
import { DELIVERY_ENABLED } from "../../data/menu";
import DeliveryLocationPicker from "./DeliveryLocationPicker";
import styles from "./DeliveryDetailsCard.module.css";

export default function DeliveryDetailsCard({
  deliveryMode,
  onDeliveryModeChange,
  name,
  address,
  cross,
  onNameChange,
  onAddressChange,
  onAddressLabel,
  selectedLocation,
  onLocationChange,
  onCrossChange,
  deliveryQuote,
}) {
  const hasDeliveryMode = !!deliveryMode;
  const isDelivery = deliveryMode === "Delivery";

  return (
    <Card className={styles.card}>
      <div className={styles.title}>Datos de entrega</div>
      <div className={styles.fields}>
        <div className={styles.question}>
          {DELIVERY_ENABLED ? "¿Delivery o retirás vos?" : "Retiro en el local"}
        </div>
        <div className={styles.modeRow}>
          {DELIVERY_ENABLED ? (
            <button
              type="button"
              className={`${styles.modeButton} ${
                deliveryMode === "Delivery" ? styles.modeButtonActive : ""
              }`}
              aria-pressed={deliveryMode === "Delivery"}
              onClick={() => onDeliveryModeChange("Delivery")}>
              Delivery
            </button>
          ) : null}
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
                <DeliveryLocationPicker
                  address={address}
                  onAddressChange={onAddressChange}
                  onAddressLabel={onAddressLabel}
                  selectedLocation={selectedLocation}
                  onLocationChange={onLocationChange}
                  deliveryQuote={deliveryQuote}
                />
                <AutoGrowTextField
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
