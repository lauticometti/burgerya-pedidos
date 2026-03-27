import {
  useStoreStatus,
} from "../../utils/storeClosedMode";
import styles from "./ClosedBanner.module.css";

export default function ClosedBanner() {
  const { bannerSubtitle, bannerTitle, showBanner, statusTone } = useStoreStatus();

  if (!showBanner) return null;

  const toneClass = {
    open: styles.bannerOpen,
    soon: styles.bannerSoon,
    promoSoon: styles.bannerPromoSoon,
    promoLive: styles.bannerPromoLive,
  }[statusTone] || "";

  return (
    <div
      className={`${styles.banner} ${toneClass}`.trim()}
      role="status"
      aria-live="polite">
      <div className={styles.lightBar} aria-hidden />
      <div className={styles.textWrap}>
        {bannerTitle ? <div className={styles.title}>{bannerTitle}</div> : null}
        <div className={bannerTitle ? styles.subtitle : styles.title}>
          {bannerSubtitle}
        </div>
      </div>
    </div>
  );
}
