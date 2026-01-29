import { Link } from "react-router-dom";
import { papas } from "../../data/menu";
import { useCart } from "../../store/useCart";
import styles from "./Papas.module.css";
import { toast } from "../../utils/toast";

export default function Papas() {
  const cart = useCart();

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.leftBtns}>
          <Link to="/">
            <button className={styles.btn} type="button">
              ⬅ Volver
            </button>
          </Link>
          <Link to="/checkout">
            <button className={styles.btn} type="button">
              ✅ Checkout
            </button>
          </Link>
        </div>

        <div className={styles.totalPill}>
          <div className={styles.totalLabel}>Total</div>
          <div className={styles.totalValue}>
            ${cart.total.toLocaleString("es-AR")}
          </div>
        </div>
      </div>

      <h1 className={styles.title}>Papas y más</h1>

      <div className={styles.list}>
        {papas.map((x) => (
          <button
            key={x.id}
            type="button"
            className={styles.item}
            onClick={() => {
              cart.add({
                key: `papas:${x.id}`,
                name: x.name,
                qty: 1,
                unitPrice: x.price,
                meta: { type: "papas" },
              });

              toast(`+ ${x.name}`);
            }}>
            <div className={styles.itemName}>{x.name}</div>
            <div className={`${styles.pricePill} ${styles.pricePillStrong}`}>
              + ${x.price.toLocaleString("es-AR")}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
