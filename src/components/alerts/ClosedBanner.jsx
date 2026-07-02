import { useStoreStatus } from "../../utils/storeClosedMode";
import styles from "./ClosedBanner.module.css";

export default function ClosedBanner() {
  const { bannerState } = useStoreStatus();

  if (!bannerState) return null;

  const bannerClass = [styles.banner, styles[bannerState.type]]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={bannerClass} role="status">
      <svg
        className={styles.icon}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span className={styles.text}>{bannerState.message}</span>
    </div>
  );
}
