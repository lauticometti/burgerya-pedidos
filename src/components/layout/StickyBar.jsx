import styles from "./StickyBar.module.css";

export default function StickyBar({ children }) {
  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <div className={styles.bar}>
        <div className={styles.inner}>{children}</div>
      </div>
    </>
  );
}

