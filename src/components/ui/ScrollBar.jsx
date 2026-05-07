import styles from "./ScrollBar.module.css";

export default function ScrollBar({ progress }) {
  return (
    <div className={styles.track} aria-hidden="true">
      <div
        className={styles.fill}
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
