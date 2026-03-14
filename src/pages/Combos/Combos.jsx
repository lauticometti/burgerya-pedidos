import { Link } from "react-router-dom";
import BrandLogo from "../../components/brand/BrandLogo";
import TopNav from "../../components/TopNav";
import Page from "../../components/layout/Page";
import Button from "../../components/ui/Button";
import PageTitle from "../../components/ui/PageTitle";
import { resolvePublicPath } from "../../utils/assetPath";
import styles from "./Combos.module.css";

const COMBOS = [
  {
    id: "combo-simple",
    title: "Combo Simple",
    price: 14000,
    sizeLabel: "1 burger simple a elección",
    img: "/burgers/cheese.svg",
    highlight: "Con papas + Coca 600ml",
  },
  {
    id: "combo-doble",
    title: "Combo Doble",
    price: 17000,
    sizeLabel: "1 burger doble a elección",
    img: "/burgers/bacon.svg",
    highlight: "Con papas + Coca 600ml",
  },
];

export default function Combos() {
  return (
    <Page>
      <BrandLogo />
      <TopNav />

      <header className={styles.hero}>
        <div>
          <p className={styles.heroKicker}>Nuevo</p>
          <PageTitle>Combos</PageTitle>
          <p className={styles.heroLead}>
            Elegí tu burger favorita y llevate papas + Coca 600ml en un solo clic.
          </p>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>Miércoles a domingo</span>
            <span className={styles.badge}>20:00 a 00:00</span>
            <span className={styles.badge}>Delivery Hurlingham</span>
          </div>
          <div className={styles.heroActions}>
            <Link to="/">
              <Button variant="primary">Elegir burger</Button>
            </Link>
            <Link to="/carrito">
              <Button>Ir al carrito</Button>
            </Link>
          </div>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.sauceDrop} />
          <div className={styles.sauceTrail} />
        </div>
      </header>

      <div className={styles.cards}>
        {COMBOS.map((combo) => (
          <article key={combo.id} className={styles.card}>
            <div className={styles.cardMeta}>
              <span className={styles.cardTag}>{combo.title}</span>
              <h3 className={styles.cardTitle}>{combo.sizeLabel}</h3>
              <p className={styles.cardHighlight}>{combo.highlight}</p>
            </div>
            <div className={styles.cardVisual}>
              <img
                className={styles.cardImage}
                src={resolvePublicPath(combo.img)}
                alt={combo.title}
                loading="lazy"
              />
              <div className={styles.cardBundle}>
                <span>+ Papas</span>
                <span>+ Coca 600</span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <div>
                <div className={styles.cardPriceLabel}>Precio combo</div>
                <div className={styles.cardPrice}>${combo.price.toLocaleString("es-AR")}</div>
              </div>
              <Link to="/">
                <Button variant="primary" size="sm">
                  Armar con esta
                </Button>
              </Link>
            </div>
          </article>
        ))}
      </div>

      <section className={styles.faq}>
        <h4>Cómo funciona</h4>
        <ul>
          <li>Elegís cualquier burger del menú con el tamaño indicado.</li>
          <li>Sumamos papas + Coca 600ml al combo.</li>
          <li>Disponible de miércoles a domingo, 20:00 a 00:00 (delivery Hurlingham).</li>
          <li>Los combos no tienen descuento adicional con otras promos.</li>
        </ul>
      </section>
    </Page>
  );
}
