import {
  STORE_CLOSED_INLINE_SUBTEXT,
  STORE_CLOSED_INLINE_TITLE,
  STORE_CLOSED_MODE,
} from "../../utils/storeClosedMode";
import styles from "./ClosedInlineNotice.module.css";

export default function ClosedInlineNotice({ className = "" }) {
  if (!STORE_CLOSED_MODE) return null;

  return (
    <div className={`${styles.notice} ${className}`.trim()}>
      <div className={styles.dot} aria-hidden />
      <div className={styles.textWrap}>
        <div className={styles.title}>{STORE_CLOSED_INLINE_TITLE}</div>
        <div className={styles.subtitle}>{STORE_CLOSED_INLINE_SUBTEXT}</div>
      </div>
    </div>
  );
}
