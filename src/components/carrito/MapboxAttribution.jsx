import styles from "./MapboxAttribution.module.css";

// Atribucion de los resultados de busqueda de direcciones. Revisar los
// terminos de Mapbox (atribucion y uso de resultados de Search Box) antes de
// pasar a produccion.
export default function MapboxAttribution() {
  return (
    <div className={styles.attribution}>
      <span>Búsqueda por</span>
      <span className={styles.word}>Mapbox</span>
    </div>
  );
}
