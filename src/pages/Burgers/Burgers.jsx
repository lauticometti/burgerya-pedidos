import React from "react";
import { Link } from "react-router-dom";
import { burgers } from "../../data/menu";
import { useCart } from "../../store/useCart";
import BurgerModal from "./BurgerModal";
import { toast } from "../../utils/toast";
import TopNav from "../../components/TopNav";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import BrandLogo from "../../components/brand/BrandLogo";
import styles from "./Burgers.module.css";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import { resolvePublicPath } from "../../utils/assetPath";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";
import {
  buildBurgerAddedToastText,
  buildBurgerCartItem,
  notifyUnavailableBurger,
  scrollToBurgerCard,
} from "./burgersUtils";

const SHOWCASE_SECTIONS = [
  {
    id: "gustan",
    title: "Las que no fallan",
    subtitle: "Las más vendidas.",
    tone: "gustan",
    layout: "pairHero",
    items: [
      { id: "bacon", badge: "TOP #1", emphasis: "top" },
      { id: "cheese", badge: "TOP #2", emphasis: "top" },
    ],
  },
  {
    id: "rompen",
    title: "Las que la rompen",
    subtitle: "Más premium, más ingredientes.",
    tone: "rompen",
    layout: "pair",
    items: [
      { id: "american", emphasis: "mid" },
      { id: "lautiboom", emphasis: "mid" },
    ],
  },
  {
    id: "deluxe",
    title: "Burgers deluxe",
    subtitle: "Sabor de lujo.",
    tone: "deluxe",
    layout: "pair",
    items: [
      { id: "bbqueen", emphasis: "deluxe" },
      { id: "smoklahoma", emphasis: "deluxe" },
    ],
  },
  {
    id: "desafio",
    title: "El desafio",
    subtitle: "Titanica. Gigante, intensa y siempre triple.",
    tone: "desafio",
    layout: "single",
    items: [{ id: "titanica", emphasis: "challenge" }],
  },
];

const SECTION_CLASS = {
  gustan: styles.sectionGustan,
  rompen: styles.sectionRompen,
  deluxe: styles.sectionDeluxe,
  desafio: styles.sectionDesafio,
};

const LAYOUT_CLASS = {
  pairHero: styles.layoutPairHero,
  pair: styles.layoutPair,
  single: styles.layoutSingle,
};

const CARD_CLASS = {
  top: styles.cardTop,
  mid: styles.cardMid,
  deluxe: styles.cardDeluxe,
  challenge: styles.cardChallenge,
};

function mapBurgersById(list) {
  return list.reduce((acc, burger) => {
    acc[burger.id] = burger;
    return acc;
  }, {});
}

export default function Burgers() {
  const cart = useCart();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeBurger, setActiveBurger] = React.useState(null);
  const burgersById = React.useMemo(() => mapBurgersById(burgers), []);

  const sections = React.useMemo(
    () =>
      SHOWCASE_SECTIONS.map((section) => {
        const items = section.items
          .map((item) => {
            const burger = burgersById[item.id];
            if (!burger) return null;
            return { ...item, burger };
          })
          .filter(Boolean);

        if (!items.length) return null;
        return { ...section, items };
      }).filter(Boolean),
    [burgersById],
  );

  function openBurger(burger) {
    if (isItemUnavailable(burger)) {
      notifyUnavailableBurger(burger, getUnavailableReason(burger));
      return;
    }
    setActiveBurger(burger);
    setModalOpen(true);
  }

  function addBurgerToCart(burger, size) {
    const price = getBurgerPriceInfo(burger, size);
    cart.add(buildBurgerCartItem(burger, size, price));
    const addedText = buildBurgerAddedToastText(burger.name, size, price);
    toast.success(addedText);
    scrollToBurgerCard(burger.id);
  }

  return (
    <Page>
      <BrandLogo />
      <TopNav />

      {sections.map((section) => (
        <section
          key={section.id}
          className={`${styles.section} ${SECTION_CLASS[section.tone] || ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <p className={styles.sectionSubtitle}>{section.subtitle}</p>
          </div>

          <div
            className={`${styles.cards} ${LAYOUT_CLASS[section.layout] || ""}`}>
            {section.items.map((entry) => {
              const burger = entry.burger;
              const isUnavailable = isItemUnavailable(burger);
              const unavailableReason = getUnavailableReason(burger);

              return (
                <article
                  key={burger.id}
                  id={`burger-${burger.id}`}
                  className={`${styles.card} ${CARD_CLASS[entry.emphasis] || ""}`}>
                  <button
                    type="button"
                    className={styles.mediaWrap}
                    onClick={() => openBurger(burger)}
                    aria-label={`Ver opciones de ${burger.name}`}>
                    <img
                      className={styles.media}
                      src={resolvePublicPath(
                        burger.img || "/burgers/placeholder.jpg",
                      )}
                      alt={burger.name}
                      loading="lazy"
                    />
                    {entry.badge ? (
                      <span className={styles.badge}>{entry.badge}</span>
                    ) : null}
                  </button>

                  <div className={styles.cardBody}>
                    <div className={styles.cardTopRow}>
                      <h3 className={styles.cardTitle}>{burger.name}</h3>
                    </div>

                    {isUnavailable ? (
                      <p className={styles.unavailable}>{unavailableReason}</p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <BurgerModal
        open={modalOpen}
        burger={activeBurger}
        onClose={() => {
          setModalOpen(false);
          setActiveBurger(null);
        }}
        onAdd={(burger, size) => {
          addBurgerToCart(burger, size);
          setModalOpen(false);
          setActiveBurger(null);
        }}
      />

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
