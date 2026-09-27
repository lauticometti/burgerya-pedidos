import styles from "./GooglePlacesAttribution.module.css";

// Atribucion requerida por Google cuando se muestran resultados/predicciones
// de Places sin un mapa visible. Wordmark en texto (colores de marca) en vez
// de hotlinkear el asset oficial: revisar antes de produccion si conviene
// reemplazarlo por el logo alojado por Google.
export default function GooglePlacesAttribution() {
  return (
    <div className={styles.attribution}>
      <span className={styles.prefix}>Con la tecnología de</span>
      <span className={styles.word}>
        <span className={styles.blue}>G</span>
        <span className={styles.red}>o</span>
        <span className={styles.yellow}>o</span>
        <span className={styles.blue}>g</span>
        <span className={styles.green}>l</span>
        <span className={styles.red}>e</span>
      </span>
    </div>
  );
}
