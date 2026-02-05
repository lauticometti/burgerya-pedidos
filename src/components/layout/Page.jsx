import styles from "./Page.module.css";

export default function Page({ children, className = "" }) {
  const classes = [styles.page, className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

