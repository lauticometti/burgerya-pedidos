import styles from "./CartSummary.module.css";
import { formatMoney } from "../../utils/formatMoney";

export default function CartSummary({
  total,
  lastAdded,
  label = "Total del carrito",
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{label}</div>
      <div className={styles.total}>{formatMoney(total)}</div>
      {lastAdded ? (
        <div className={styles.lastAdded}>Último agregado: {lastAdded}</div>
      ) : null}
    </div>
  );
}


