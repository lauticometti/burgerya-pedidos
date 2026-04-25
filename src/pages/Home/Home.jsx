import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../../components/brand/BrandLogo";
import CartSummary from "../../components/cart/CartSummary";
import HomeCard from "../../components/home/HomeCard";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import Button from "../../components/ui/Button";
import TopNav from "../../components/TopNav";
import { useCart } from "../../store/useCart";
import { useStoreStatus } from "../../utils/storeClosedMode";
import { addCortaSemanaPromo } from "../../utils/cortaSemanaPromo";
import styles from "./Home.module.css";

const HOME_CARD_IMAGES = {
  burgers: "/home/card-burgers-home-foto.jpg",
  promos: "/home/card-promos-home-foto.jpg",
};

export default function Home() {
  const cart = useCart();
  const {
    isTriplePromoVisible,
    promoHeroCtaLabel,
    promoHeroSubtitle,
    promoHeroTitle,
  } = useStoreStatus();
  const [imageStatus, setImageStatus] = useState({
    burgers: "loading",
    promos: "loading",
  });

  useEffect(() => {
    let isActive = true;

    Object.entries(HOME_CARD_IMAGES).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (!isActive) return;
        setImageStatus((prev) => ({ ...prev, [key]: "loaded" }));
      };
      img.onerror = () => {
        if (!isActive) return;
        setImageStatus((prev) => ({ ...prev, [key]: "error" }));
      };
    });

    return () => {
      isActive = false;
    };
  }, []);

  const burgerImage =
    imageStatus.burgers === "loaded" ? HOME_CARD_IMAGES.burgers : null;
  const promosImage =
    imageStatus.promos === "loaded" ? HOME_CARD_IMAGES.promos : null;

  return (
    <Page>
      <BrandLogo />
      <TopNav />

      <h1 className={styles.h1}>Hamburguesas smash en Hurlingham</h1>

      <div className={styles.infoBlock}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Zona:</span> Hurlingham, Villa Tesei, Morris, Altos de Podesta, Ciudad Jardín
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Horario:</span> Miércoles a domingos 20:00 a 00:00
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Cómo pedir:</span> Elegís en la web, pagás por WhatsApp
        </div>
      </div>

      <div className={styles.subtitle}>Elegi como queres armar tu pedido</div>

      {isTriplePromoVisible ? (
        <section className={styles.promoHero}>
          <h1 className={styles.promoTitle}>{promoHeroTitle}</h1>
          <div className={styles.promoSubtitle}>{promoHeroSubtitle}</div>
          <div className={styles.promoText}>Solo en burgers</div>
          {promoHeroCtaLabel ? (
            <Link to="/" className={styles.promoLink}>
              <Button variant="primary">{promoHeroCtaLabel}</Button>
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className={styles.comboHero}>
        <div className={styles.comboImageWrap}>
          <img
            src="/burgers/bacon.svg"
            alt="Bacon doble"
            className={styles.comboImageBack}
            loading="lazy"
            decoding="async"
          />
          <img
            src="/burgers/lautiboom.svg"
            alt="Lautiboom doble"
            className={styles.comboImageFront}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className={styles.comboContent}>
          <div className={styles.comboKicker}>CORTA LA SEMANA</div>
          <h2 className={styles.comboTitle}>Bacon doble + Lautiboom doble</h2>
          <div className={styles.comboSubtitle}>
            Incluye 2 papas + dip salsa secreta
          </div>
          <div className={styles.comboPrice}>$29.000</div>
          <Button
            variant="primary"
            onClick={() => addCortaSemanaPromo(cart)}>
            Pedir combo
          </Button>
        </div>
      </section>

      <div className={styles.cards}>
        <HomeCard
          to="/"
          title="Hamburguesas smash"
          subtitle="Armar pedido por unidad - incluyen papas"
          imageSrc={burgerImage}
          imageAlt="Hamburguesa smash con costra marcada y papas"
          imagePositionKey="burgers"
        />
        <HomeCard
          to="/promos"
          title="Combos de hamburguesas"
          subtitle="2x / 3x / 4x (Dobles o Triples) - incluyen papas"
          imageSrc={promosImage}
          imageAlt="Combo de hamburguesas smash con papas incluidas"
          imagePositionKey="promos"
        />
        <HomeCard
          to="/papas"
          title="Papas, bebidas y mas"
          subtitle="Papas grandes, bebidas y dips para acompanar"
        />
      </div>

      <StickyBar>
        <CartSummary total={cart.total} />
        <Link to="/carrito">
          <Button variant="primary" disabled={cart.items.length === 0}>
            Cerrar pedido
          </Button>
        </Link>
      </StickyBar>
    </Page>
  );
}
