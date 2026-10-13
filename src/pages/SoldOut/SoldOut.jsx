import { SOLD_OUT_MESSAGE } from "./soldOutConfig";
import styles from "./SoldOut.module.css";

export default function SoldOut() {
  return (
    <div className={styles.page}>
      <p className={styles.wordmark}>burger ya.</p>

      <h1 className={styles.title}>Sold out</h1>

      <p className={styles.subtitle}>
        <span className={styles.subtitleBar} aria-hidden="true" />
        {SOLD_OUT_MESSAGE}
        <span className={styles.subtitleBar} aria-hidden="true" />
      </p>

      <p className={styles.note}>Gracias por bancarnos.</p>
    </div>
  );
}
