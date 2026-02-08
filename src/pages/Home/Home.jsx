import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../store/useCart";
import { comboDomingo } from "../../data/menu";
import TopNav from "../../components/TopNav";
import { STORE_SCHEDULE_TEXT } from "../../utils/isOpenNow";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import CloseButton from "../../components/ui/CloseButton";
import HomeCard from "../../components/home/HomeCard";
import BrandLogo from "../../components/brand/BrandLogo";
import { formatMoney } from "../../utils/formatMoney";
import { toast } from "../../utils/toast";
import styles from "./Home.module.css";

const HOME_CARD_IMAGES = {
  burgers: "/home/card-burgers-home-foto.jpg",
  promos: "/home/card-promos-home-foto.jpg",
};

export default function Home() {
  const cart = useCart();
  const [imageStatus, setImageStatus] = useState({
    burgers: "loading",
    promos: "loading",
  });
  const [comboModalOpen, setComboModalOpen] = useState(false);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storage = window.sessionStorage;
    const seenKey = "burgerya_combo_modal_seen";
    if (storage?.getItem(seenKey)) return;

    const timer = window.setTimeout(() => {
      setComboModalOpen(true);
      storage?.setItem(seenKey, "1");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!comboModalOpen) return;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setComboModalOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [comboModalOpen]);

  function addComboToCart() {
    const key = "promo:domingo";
    cart.add({
      key,
      name: comboDomingo.cartLabel || comboDomingo.label,
      qty: 1,
      unitPrice: comboDomingo.price,
      meta: {
        type: "promo",
        special: "domingo",
        allowQty: true,
        description: comboDomingo.description,
        kitchenItems: comboDomingo.kitchenItems,
      },
    });

    toast.promo(`Combo agregado - ${formatMoney(comboDomingo.price)}`, {
      key: "promo-domingo-added",
    });
    setComboModalOpen(false);
  }

  const burgerImage =
    imageStatus.burgers === "loaded" ? HOME_CARD_IMAGES.burgers : null;
  const promosImage =
    imageStatus.promos === "loaded" ? HOME_CARD_IMAGES.promos : null;

  return (
    <Page>
      <BrandLogo />
      <TopNav />

      {comboModalOpen ? (
        <div
          className={styles.comboModalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setComboModalOpen(false)}>
          <div
            className={styles.comboModal}
            onClick={(event) => event.stopPropagation()}>
            <div className={styles.comboModalHeader}>
              <CloseButton onClick={() => setComboModalOpen(false)} />
            </div>

            <div className={styles.comboBody}>
              <div className={styles.comboMedia}>
                <img
                  src={comboDomingo.img}
                  alt={comboDomingo.label}
                  loading="lazy"
                />
              </div>
              <div className={styles.comboDetails}>
                <div className={styles.comboDescription}>
                  {comboDomingo.modalDescription || comboDomingo.description}
                </div>
                <div className={styles.comboPrice}>
                  {formatMoney(comboDomingo.price)}
                </div>
              </div>
            </div>

            <div className={styles.comboActions}>
              <Button variant="primary" onClick={addComboToCart}>
                Agregar al carrito
              </Button>
              <Button onClick={() => setComboModalOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.subtitle}>Elegí cómo querés armar tu pedido</div>
      <div className={styles.scheduleHint}>Horario: {STORE_SCHEDULE_TEXT}</div>

      <div className={styles.cards}>
        <HomeCard
          to="/burgers"
          title="Burgers"
          subtitle="Armar pedido por unidad"
          imageSrc={burgerImage}
          imageAlt="Burger Bacon"
          imagePosition="center 65%"
        />
        <HomeCard
          to="/promos"
          title="Promos"
          subtitle="2x / 3x / 4x (Dobles o Triples)"
          imageSrc={promosImage}
          imageAlt="Promos Premium"
          imagePosition="center 82%"
        />
        <HomeCard
          to="/papas"
          title="Papas, bebidas y más"
          subtitle="Papas grandes, bebidas y dips para acompañar"
        />
      </div>

      <StickyBar>
        <CartSummary total={cart.total} />
        <Link to="/carrito">
          <Button variant="primary" disabled={cart.items.length === 0}>
            Ir al carrito
          </Button>
        </Link>
      </StickyBar>
    </Page>
  );
}
