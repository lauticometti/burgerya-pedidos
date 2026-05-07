import styles from "./SwipeHint.module.css";

export default function SwipeHint({ visible }) {
  return (
    <div
      className={`${styles.wrap} ${visible ? styles.visible : styles.hidden}`}
      aria-hidden="true">
      <svg
        className={styles.icon}
        width="20"
        height="12"
        viewBox="0 0 20 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true">
        <line x1="0" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <polyline points="12,2 18,6 12,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className={styles.text}>Deslizá para ver más</span>
    </div>
  );
}
