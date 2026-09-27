import { useLayoutEffect, useRef } from "react";
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


// Campo de UNA linea logica que crece en altura para mostrar todo el texto
// (una direccion larga con su altura no queda cortada como en un input). Enter
// no agrega lineas y un salto de linea pegado se convierte en espacio. onChange
// recibe { target: { value } } como un input.
export function AutoGrowTextField({ className = "", value, onChange, onKeyDown, ...props }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [value]);
  const classes = [styles.input, styles.autoGrow, className].filter(Boolean).join(" ");
  return (
    <textarea
      ref={ref}
      rows={1}
      className={classes}
      value={value}
      onChange={(e) => onChange?.({ target: { value: e.target.value.replace(/\s*[\r\n]+\s*/g, " ") } })}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
        onKeyDown?.(e);
      }}
      {...props}
    />
  );
}
