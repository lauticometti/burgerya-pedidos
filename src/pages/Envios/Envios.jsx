import { Link } from "react-router-dom";
import BrandLogo from "../../components/brand/BrandLogo";
import TopNav from "../../components/TopNav";
import Page from "../../components/layout/Page";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import styles from "./Envios.module.css";

const MAP_EMBED =
  "https://www.google.com/maps/d/u/0/embed?mid=1beWW2H8NuOwD8NjOphwqSHLPHgFoHJs&ehbc=2E312F&noprof=1";
const MAP_FULL =
  "https://www.google.com/maps/d/u/0/viewer?mid=1beWW2H8NuOwD8NjOphwqSHLPHgFoHJs&ehbc=2E312F&noprof=1";

export default function Envios() {
  return (
    <Page className={styles.page}>
      <BrandLogo />
      <TopNav />

      <PageTitle>Envios</PageTitle>
      <p className={styles.lead}>
        Ingresando tu direccion en el mapa podes ver si llegamos hasta tu casa
        y el costo exacto del envio. Es una referencia para vos; no modifica el
        total del pedido automaticamente.
      </p>

      <div className={styles.mapCard}>
        <div className={styles.mapHeader}>
          <div>
            <div className={styles.mapTitle}>Mapa interactivo</div>
            <div className={styles.mapHint}>
              Usa la lupa del mapa, escribe calle y altura y toca Enter.
            </div>
          </div>
          <a
            className={styles.mapLink}
            href={MAP_FULL}
            target="_blank"
            rel="noreferrer">
            Abrir en nueva pestana
          </a>
        </div>
        <div className={styles.mapFrame}>
          <iframe
            title="Zonas de envio"
            src={MAP_EMBED}
            loading="lazy"
            allowFullScreen
          />
        </div>
        <div className={styles.mapFoot}>
          <div className={styles.tag}>Referencia</div>
          <p className={styles.disclaimer}>
            Los valores del envio son informativos; confirmamos el monto final
            cuando tomamos tu pedido.
          </p>
        </div>
      </div>

      <div className={styles.tips}>
        <div className={styles.tip}>
          <span className={styles.tipBadge}>1</span>
          <div className={styles.tipBody}>
            Escribe la direccion completa (ej: "Av. Siempre Viva 742") para que
            el mapa calcule la zona correcta.
          </div>
        </div>
        <div className={styles.tip}>
          <span className={styles.tipBadge}>2</span>
          <div className={styles.tipBody}>
            Si quedas muy cerca del borde entre zonas, escribinos por WhatsApp y
            te confirmamos el valor final.
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Link to="/carrito">
          <Button variant="primary">Volver al carrito</Button>
        </Link>
        <Link to="/">
          <Button variant="ghost">Volver al menu</Button>
        </Link>
        <a href={MAP_FULL} target="_blank" rel="noreferrer">
          <Button variant="ghost">Abrir mapa completo</Button>
        </a>
      </div>
    </Page>
  );
}
