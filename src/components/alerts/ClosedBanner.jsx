import {
  STORE_CLOSED_BANNER_SUBTITLE,
  STORE_CLOSED_BANNER_TITLE,
  STORE_CLOSED_MODE,
} from "../../utils/storeClosedMode";
import styles from "./ClosedBanner.module.css";

export default function ClosedBanner() {
  if (!STORE_CLOSED_MODE) return null;

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <div className={styles.lightBar} aria-hidden />
      <div className={styles.textWrap}>
        <div className={styles.title}>{STORE_CLOSED_BANNER_TITLE}</div>
        <div className={styles.subtitle}>{STORE_CLOSED_BANNER_SUBTITLE}</div>
      </div>
    </div>
  );
}
