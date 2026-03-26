import {
  useStoreStatus,
} from "../../utils/storeClosedMode";
import styles from "./ClosedBanner.module.css";

export default function ClosedBanner() {
  const { bannerSubtitle, bannerTitle, showBanner, statusTone } = useStoreStatus();

  if (!showBanner) return null;

  const toneClass =
    statusTone === "open"
      ? styles.bannerOpen
      : statusTone === "soon"
        ? styles.bannerSoon
        : "";

  return (
    <div
      className={`${styles.banner} ${toneClass}`.trim()}
      role="status"
      aria-live="polite">
      <div className={styles.lightBar} aria-hidden />
      <div className={styles.textWrap}>
        <div className={styles.title}>{bannerTitle}</div>
        <div className={styles.subtitle}>{bannerSubtitle}</div>
      </div>
    </div>
  );
}
