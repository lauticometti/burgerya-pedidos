import styles from "./CloseButton.module.css";

export default function CloseButton({
  className = "",
  "aria-label": ariaLabel,
  ...props
}) {
  const classes = [styles.button, className].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      aria-label={ariaLabel || "Cerrar"}
      className={classes}
      {...props}>
      ×
    </button>
  );
}
