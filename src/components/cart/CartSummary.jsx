import styles from "./CartSummary.module.css";
import { formatMoney } from "../../utils/formatMoney";

export default function CartSummary({ total, label = "Total del carrito" }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{label}</div>
      <div className={styles.total}>{formatMoney(total)}</div>
    </div>
  );
}
