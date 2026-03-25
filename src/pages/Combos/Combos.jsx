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
import { buildBurgerLineKey } from "../../utils/cartKeys";
import styles from "./Combos.module.css";

const COMBOS = [
  {
    id: "combo-simple",
    title: "Combo Simple",
    size: "simple",
    price: 14000,
    sizeLabel: "1 burger simple a elección",
    img: "/burgers/american.svg",
    highlight: "Incluye papas + Coca 600ml",
  },
  {
    id: "combo-doble",
    title: "Combo Doble",
    size: "doble",
    price: 17000,
    sizeLabel: "1 burger doble a elección",
    img: "/burgers/bacon.svg",
    highlight: "Incluye papas + Coca 600ml",
  },
];

const COMBO_ALLOWED_BURGERS = ["lautiboom", "bacon", "american"];

export default function Combos() {
  const cart = useCart();

  const burgersBySize = useMemo(
    () => {
      const eligible = burgers.filter((b) => COMBO_ALLOWED_BURGERS.includes(b.id));
      return {
        simple: eligible.filter((b) => typeof b.prices?.simple === "number"),
        doble: eligible.filter((b) => typeof b.prices?.doble === "number"),
      };
    },
    [],
  );

  function addCombo(combo, burger) {
    if (isItemUnavailable(burger)) {
      toast.error(getUnavailableReason(burger) || "No disponible");
      return;
    }

    cart.add({
      key: buildBurgerLineKey({
        kind: "combo",
        comboId: combo.id,
        burgerId: burger.id,
        size: combo.size,
        removedIds: [],
      }),
      name: `${combo.title} · ${burger.name}`,
      qty: 1,
      unitPrice: combo.price,
      meta: {
        type: "combo",
        comboId: combo.id,
        burgerId: burger.id,
        size: combo.size || (combo.sizeLabel.includes("doble") ? "doble" : "simple"),
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
          <PageTitle>Combos</PageTitle>
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
                  combo.size || (combo.sizeLabel.includes("doble") ? "doble" : "simple")
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
            Cerrar pedido
          </Button>
        </Link>
      </StickyBar>
    </Page>
  );
}
