import styles from "./Pill.module.css";

export default function Pill({ children, active = false, className = "" }) {
  const classes = [styles.pill, active ? styles.active : "", className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}

