import styles from "./FormFields.module.css";

export function TextInput({ className = "", ...props }) {
  const classes = [styles.input, className].filter(Boolean).join(" ");
  return <input className={classes} {...props} />;
}

export function SelectField({ className = "", ...props }) {
  const classes = [styles.select, className].filter(Boolean).join(" ");
  return <select className={classes} {...props} />;
}

export function TextareaField({ className = "", ...props }) {
  const classes = [styles.textarea, className].filter(Boolean).join(" ");
  return <textarea className={classes} {...props} />;
}

