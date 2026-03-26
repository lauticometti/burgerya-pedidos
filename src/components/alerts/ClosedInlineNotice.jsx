import {
  useStoreStatus,
} from "../../utils/storeClosedMode";
import styles from "./ClosedInlineNotice.module.css";

export default function ClosedInlineNotice({ className = "" }) {
  const { inlineSubtext, inlineTitle, showInlineNotice } = useStoreStatus();

  if (!showInlineNotice) return null;

  return (
    <div className={`${styles.notice} ${className}`.trim()}>
      <div className={styles.dot} aria-hidden />
      <div className={styles.textWrap}>
        <div className={styles.title}>{inlineTitle}</div>
        <div className={styles.subtitle}>{inlineSubtext}</div>
      </div>
    </div>
  );
}
