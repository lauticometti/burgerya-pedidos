import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../store/useCart";
import TopNav from "../../components/TopNav";
import { STORE_SCHEDULE_TEXT } from "../../utils/isOpenNow";
import ClosedInlineNotice from "../../components/alerts/ClosedInlineNotice";
import { STORE_CLOSED_MODE, STORE_REOPEN_TEXT } from "../../utils/storeClosedMode";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import HomeCard from "../../components/home/HomeCard";
import BrandLogo from "../../components/brand/BrandLogo";
import styles from "./Home.module.css";

const HOME_CARD_IMAGES = {
  burgers: "/home/card-burgers-home-foto.jpg",
  promos: "/home/card-promos-home-foto.jpg",
};

export default function Home() {
  const cart = useCart();
  const isClosed = STORE_CLOSED_MODE;
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
  const scheduleText = STORE_CLOSED_MODE
    ? `Cerrado hoy · ${STORE_REOPEN_TEXT}`
    : `Horario: ${STORE_SCHEDULE_TEXT}`;

  return (
    <Page>
      <BrandLogo />
      <TopNav />

      <div className={styles.subtitle}>Elegí cómo querés armar tu pedido</div>
      <div className={styles.scheduleHint}>{scheduleText}</div>
      <ClosedInlineNotice />

      <div className={styles.cards}>
        <HomeCard
          to="/burgers"
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
          title="Papas, bebidas y más"
          subtitle="Papas grandes, bebidas y dips para acompañar"
        />
      </div>

      <StickyBar>
        <CartSummary total={cart.total} />
        {isClosed ? (
          <Button variant="primary" disabled subLabel={STORE_REOPEN_TEXT}>
            Cerrado hoy
          </Button>
        ) : (
          <Link to="/carrito">
            <Button variant="primary" disabled={cart.items.length === 0}>
              Cerrar pedido
            </Button>
          </Link>
        )}
      </StickyBar>
    </Page>
  );
}
