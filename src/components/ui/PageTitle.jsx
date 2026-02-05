import styles from "./PageTitle.module.css";

export default function PageTitle({ children, className = "" }) {
  const classes = [styles.title, className].filter(Boolean).join(" ");
  return <h1 className={classes}>{children}</h1>;
}
