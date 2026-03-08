import styles from "./CartSummary.module.css";
import { formatMoney } from "../../utils/formatMoney";

export default function CartSummary({
  total,
  label = "Total del carrito",
  couponCode,
  discount = 0,
  finalTotal,
}) {
  const hasDiscount = discount > 0 && typeof finalTotal === "number";

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{label}</div>
      <div className={styles.total}>{formatMoney(total)}</div>
      {hasDiscount ? (
        <>
          <div className={styles.couponLine}>
            {couponCode ? `Código ${couponCode}` : "Descuento"}: -
            {formatMoney(discount)}
          </div>
          <div className={styles.finalTotal}>
            Total con descuento: {formatMoney(finalTotal)}
          </div>
        </>
      ) : null}
    </div>
  );
}
