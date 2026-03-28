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

      <div className={styles.cards}>
        <HomeCard
          to="/"
          title="Burgers"
          subtitle="Armar pedido por unidad - incluyen papas"
          imageSrc={burgerImage}
          imageAlt="Burger Bacon"
          imagePositionKey="burgers"
        />
        <HomeCard
          to="/promos"
          title="Promos"
          subtitle="2x / 3x / 4x (Dobles o Triples) - incluyen papas"
          imageSrc={promosImage}
          imageAlt="Promos Premium"
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
