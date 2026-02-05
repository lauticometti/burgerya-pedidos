import styles from "./Card.module.css";

export default function Card({ className = "", ...props }) {
  const classes = [styles.card, className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
}

