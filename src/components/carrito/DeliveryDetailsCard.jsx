import Card from "../ui/Card";
import { TextInput } from "../ui/FormFields";
import styles from "./DeliveryDetailsCard.module.css";

export default function DeliveryDetailsCard({
  name,
  address,
  cross,
  onNameChange,
  onAddressChange,
  onCrossChange,
}) {
  return (
    <Card className={styles.card}>
      <div className={styles.title}>Datos de entrega</div>
      <div className={styles.fields}>
        <TextInput
          placeholder="Nombre"
          value={name}
          autoComplete="name"
          onChange={(e) => onNameChange(e.target.value)}
        />
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
      </div>
    </Card>
  );
}
