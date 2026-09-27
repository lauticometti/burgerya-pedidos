import { CheckCircleIcon, AlertCircleIcon } from "../ui/icons";
import { describeQuote } from "../../utils/deliveryQuoteView";
import styles from "./DeliveryQuoteCard.module.css";

// Una sola linea: estado discreto + "Envío · Zona N" + precio destacado.
export default function DeliveryQuoteCard({ quote }) {
  const view = describeQuote(quote);

  if (view.kind === "idle") {
    return <div className={styles.hint}>{view.text}</div>;
  }

  if (view.kind === "uncovered") {
    return (
      <div className={styles.uncovered} role="status">
        <span className={styles.iconWarn}>
          <AlertCircleIcon size={16} />
        </span>
        <span>{view.text}</span>
      </div>
    );
  }

  return (
    <div className={styles.covered} role="status">
      <span className={styles.iconOk}>
        <CheckCircleIcon size={16} />
      </span>
      <span className={styles.label}>{view.label}</span>
      <span className={styles.price}>{view.price}</span>
    </div>
  );
}
