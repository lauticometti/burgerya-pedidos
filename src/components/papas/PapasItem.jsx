import { formatMoney } from "../../utils/formatMoney";
import styles from "./PapasItem.module.css";

export default function PapasItem({ item, onAdd, actionLabel }) {
  return (
    <button type="button" className={styles.item} onClick={onAdd}>
      <div className={styles.name}>{item.name}</div>
      <div className={styles.pricePill}>
        {actionLabel ? actionLabel : `+ ${formatMoney(item.price)}`}
      </div>
    </button>
  );
}
