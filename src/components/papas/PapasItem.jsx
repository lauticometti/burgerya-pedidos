import { formatMoney } from "../../utils/formatMoney";
import styles from "./PapasItem.module.css";

export default function PapasItem({
  item,
  onAdd,
  actionLabel,
  isUnavailable = false,
  unavailableReason = "no disponible por hoy",
}) {
  return (
    <button
      type="button"
      className={`${styles.item} ${isUnavailable ? styles.itemUnavailable : ""}`}
      data-unavailable-message={isUnavailable ? unavailableReason : undefined}
      aria-disabled={isUnavailable}
      title={isUnavailable ? unavailableReason : undefined}
      onClick={() => onAdd?.()}>
      <div className={styles.name}>{item.name}</div>
      <div
        className={`${styles.pricePill} ${
          isUnavailable ? styles.pricePillUnavailable : ""
        }`}>
        {actionLabel
          ? actionLabel
          : isUnavailable
            ? unavailableReason
            : `+ ${formatMoney(item.price)}`}
      </div>
    </button>
  );
}
