import { Link } from "react-router-dom";
import { useMemo } from "react";
import { burgers } from "../../data/menu";
import { useCart } from "../../store/useCart";
import { toast } from "../../utils/toast";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";
import BrandLogo from "../../components/brand/BrandLogo";
import TopNav from "../../components/TopNav";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
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
    img: "/burgers/american.svg",
    highlight: "Con papas + Coca\u00a0600ml",
  },
  {
    id: "combo-doble",
    title: "Combo Doble",
    price: 17000,
    sizeLabel: "1 burger doble a elección",
    img: "/burgers/bacon.svg",
    highlight: "Con papas + Coca\u00a0600ml",
  },
  {
    id: "combo-triple",
    title: "Combo Triple",
    price: 20000,
    sizeLabel: "1 burger triple a elección",
    img: "/burgers/bbqueen.svg",
    highlight: "Con papas + Coca\u00a0600ml",
  },
];

export default function Combos() {
  const cart = useCart();

  const burgersBySize = useMemo(
    () => ({
      simple: burgers.filter((b) => typeof b.prices?.simple === "number"),
      doble: burgers.filter((b) => typeof b.prices?.doble === "number"),
    }),
    [],
  );

  function addCombo(combo, burger) {
    if (isItemUnavailable(burger)) {
      toast.error(getUnavailableReason(burger) || "No disponible");
      return;
    }

    cart.add({
      key: `combo:${combo.id}:${burger.id}`,
      name: `${combo.title} · ${burger.name}`,
      qty: 1,
      unitPrice: combo.price,
      meta: {
        type: "combo",
        comboId: combo.id,
        burgerId: burger.id,
        size: combo.sizeLabel.includes("doble") ? "doble" : "simple",
        comboTitle: combo.title,
        burgerName: burger.name,
        includes: ["papas", "coca_600"],
      },
    });
    toast.success(`+ ${combo.title} con ${burger.name}`);
  }

  return (
    <Page>
      <BrandLogo />
      <TopNav />

      <header className={styles.hero}>
        <div>
          <p className={styles.heroKicker}>Nuevo</p>
          <PageTitle>Combos</PageTitle>
          <p className={styles.heroLead}>
            Llevá tu burger favorita con papas y Coca&nbsp;600ml en un solo clic.
          </p>
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
              <div className={styles.cardSides}>
                <img
                  className={`${styles.sideImage} ${styles.sideImageFries}`}
                  src={resolvePublicPath("/combos/4.png")}
                  alt="Papas"
                  loading="lazy"
                />
                <img
                  className={styles.sideImage}
                  src={resolvePublicPath("/combos/3.png")}
                  alt="Coca 600ml"
                  loading="lazy"
                />
              </div>
            </div>
            <div className={styles.cardFooter}>
              <div>
                <div className={styles.cardPriceLabel}>Precio combo</div>
                <div className={styles.cardPrice}>${combo.price.toLocaleString("es-AR")}</div>
              </div>
            </div>

            <div className={styles.picker}>
              <div className={styles.pickerTitle}>Elegí la burger</div>
              <div className={styles.pickerList}>
                {burgersBySize[
                  combo.sizeLabel.includes("doble") ? "doble" : "simple"
                ].map((burger) => {
                  const unavailable = isItemUnavailable(burger);
                  return (
                    <Button
                      key={burger.id}
                      size="sm"
                      className={styles.pickerButton}
                      disabled={unavailable}
                      subLabel={unavailable ? getUnavailableReason(burger) : undefined}
                      onClick={() => addCombo(combo, burger)}>
                      <span className={styles.pickerChoice}>
                        <img
                          className={styles.pickerThumb}
                          src={resolvePublicPath(
                            burger.img || "/burgers/placeholder.jpg",
                          )}
                          alt={burger.name}
                          loading="lazy"
                        />
                        <span className={styles.pickerName}>{burger.name}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
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
