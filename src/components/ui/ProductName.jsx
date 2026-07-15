import styles from "./ProductName.module.css";
import { getArgentinaName } from "../../utils/argentinaNames";

// Muestra el nombre original tachado (si hay mapeo argentino vigente) con el
// nombre argentino destacado debajo. Si no hay mapeo (campaña apagada, o
// burger sin traducción, ej. Lautiboom), muestra solo el nombre original.
// `suffix` (ej. "doble", una etiqueta) se agrega pegado al nombre que queda
// como protagonista, para que no quede flotando en la línea del tachado.
// `inline`: para cuando el nombre va en medio de una oración corrida (ej. un
// toast "Se eliminó X.") — mantiene tachado + nombre en una sola línea en vez
// de apilarlos, para no romper el flujo del texto.
// eslint-disable-next-line no-unused-vars -- Tag is used as a JSX tag below; the base eslint config lacks JSX-uses-vars detection.
export default function ProductName({
  name,
  as: Tag = "span",
  className = "",
  suffix = null,
  inline = false,
}) {
  const argentinaName = getArgentinaName(name);

  if (!argentinaName) {
    return (
      <Tag className={className}>
        {name}
        {suffix}
      </Tag>
    );
  }

  if (inline) {
    return (
      <Tag className={`${styles.inlineWrap} ${className}`}>
        <span className={styles.original}>{name}</span>{" "}
        <span className={styles.argentina}>
          {argentinaName}
          {suffix}
        </span>
      </Tag>
    );
  }

  return (
    <Tag className={`${styles.wrap} ${className}`}>
      <span className={styles.original}>{name}</span>
      <span className={styles.argentina}>
        {argentinaName}
        {suffix}
      </span>
    </Tag>
  );
}
