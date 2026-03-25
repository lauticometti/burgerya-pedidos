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
import DeliveryMapLink from "../../components/delivery/DeliveryMapLink";
import ClosedInlineNotice from "../../components/alerts/ClosedInlineNotice";
import styles from "./Burgers.module.css";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import { resolvePublicPath } from "../../utils/assetPath";
import { formatMoney } from "../../utils/formatMoney";
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
import {
  PROMO_CAMPAIGN,
  calcMissingAmount,
} from "../../utils/promosCampaign";
import {
  STORE_CLOSED_MODE,
  STORE_REOPEN_TEXT,
} from "../../utils/storeClosedMode";

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
  const isClosed = STORE_CLOSED_MODE;

  const SHOW_PROMO_HERO = false;
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeBurger, setActiveBurger] = React.useState(null);
  const [modalOrigin, setModalOrigin] = React.useState(null);
  const burgersById = React.useMemo(() => mapBurgersById(burgers), []);
  const promoConfig = PROMO_CAMPAIGN;
  const hasGift = React.useMemo(
    () =>
      cart.items.some(
        (item) =>
          item.meta?.promoGiftId && item.meta.promoGiftId === promoConfig.thresholdGift.id,
      ),
    [cart.items, promoConfig.thresholdGift.id],
  );
  const missingForGift = React.useMemo(
    () => calcMissingAmount(cart.total, promoConfig.thresholdGift.amount),
    [cart.total, promoConfig.thresholdGift.amount],
  );
  const giftProgress = Math.min(
    Math.max(
      ((promoConfig.thresholdGift.amount - missingForGift) /
        promoConfig.thresholdGift.amount) *
        100,
      0,
    ),
    100,
  );

  function jumpToDoubleBurger() {
    const targetId = "bacon";
    scrollToBurgerCard(targetId);
  }

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
  const sectionOffsets = React.useMemo(() => {
    return sections
      .reduce(
        (acc, section) => {
          acc.offsets.push(acc.total);
          acc.total += section.items.length;
          return acc;
        },
        { offsets: [], total: 0 },
      )
      .offsets;
  }, [sections]);

  function openBurger(burger, evt) {
    if (isClosed) {
      notifyUnavailableBurger(burger, STORE_REOPEN_TEXT);
      return;
    }
    if (isItemUnavailable(burger)) {
      notifyUnavailableBurger(burger, getUnavailableReason(burger));
      return;
    }
    const rect = evt?.currentTarget?.getBoundingClientRect();
    const origin = rect
      ? {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          imageSrc: resolvePublicPath(burger.img || "/burgers/placeholder.jpg"),
        }
      : null;
    setModalOrigin(origin);
    setActiveBurger(burger);
    setModalOpen(true);
  }

  function addBurgerToCart(burger, size, removedIngredients = []) {
    if (STORE_CLOSED_MODE) {
      toast.error(`Cerrado hoy · ${STORE_REOPEN_TEXT}`, {
        key: "store-closed-burger",
      });
      return;
    }
    const price = getBurgerPriceInfo(burger, size);
    cart.add(buildBurgerCartItem(burger, size, price, removedIngredients));
    const addedText = buildBurgerAddedToastText(burger.name, size, price);
    toast.success(addedText);
    scrollToBurgerCard(burger.id);
  }

  return (
    <Page>
      <BrandLogo />
      <TopNav />
      <ClosedInlineNotice />

      {SHOW_PROMO_HERO ? (
        <section className={styles.promoHero}>
          <div className={styles.promoHeader}>
            <div>
              <p className={styles.promoKicker}>PROMOS DE HOY</p>
              <h1 className={styles.promoTitle}>Pedí más y aprovechá</h1>
              <p className={styles.promoSubtitle}>Activas hasta las 00:00</p>
            </div>
          </div>

          <div className={styles.promoGrid}>
            <article className={styles.promoCard}>
              <div className={styles.promoTag}>Upgrade inmediato</div>
              <div className={styles.promoCardTitle}>Hacela triple hoy +$1500</div>
              <Button className={styles.promoButtonGhost} onClick={jumpToDoubleBurger}>
                Pasar a triple
              </Button>
            </article>

            <article className={styles.promoCard}>
              <div className={styles.promoTag}>Regalo por umbral</div>
              <div className={styles.promoCardTitle}>
                {hasGift ? "Papas extra incluidas" : "Papas gratis desde $30.000"}
              </div>
              <div className={styles.progressWrap}>
                <div className={styles.progressBar}>
                  <span style={{ width: `${giftProgress}%` }} />
                </div>
                <div className={styles.progressText}>
                  {hasGift
                    ? "Papas extra incluidas"
                    : `Te faltan ${formatMoney(missingForGift)}`}
                </div>
              </div>
              {!hasGift ? (
                <Button
                  className={styles.promoButtonGhost}
                  onClick={() => scrollToBurgerCard("bacon")}>
                  Sumar y llevar papas gratis
                </Button>
              ) : null}
            </article>
          </div>
        </section>
      ) : null}

      {sections.map((section, sectionIndex) => (
        <section
          key={section.id}
          className={`${styles.section} ${SECTION_CLASS[section.tone] || ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <p className={styles.sectionSubtitle}>{section.subtitle}</p>
          </div>

          <div
            className={`${styles.cards} ${LAYOUT_CLASS[section.layout] || ""}`}>
            {section.items.map((entry, itemIndex) => {
              const burger = entry.burger;
              const isUnavailable = isClosed || isItemUnavailable(burger);
              const unavailableReason = isClosed
                ? STORE_REOPEN_TEXT
                : getUnavailableReason(burger);
              const globalIndex =
                (sectionOffsets[sectionIndex] || 0) + itemIndex;
              const isPriorityImage = globalIndex < 2;

              return (
                <article
                  key={burger.id}
                  id={`burger-${burger.id}`}
                  className={`${styles.card} ${CARD_CLASS[entry.emphasis] || ""}`}>
                  <button
                    type="button"
                    className={styles.mediaWrap}
                    onClick={(e) => openBurger(burger, e)}
                    aria-label={`Ver opciones de ${burger.name}`}>
                    <img
                      className={styles.media}
                      src={resolvePublicPath(
                        burger.img || "/burgers/placeholder.jpg",
                      )}
                      alt={burger.name}
                      loading={isPriorityImage ? "eager" : "lazy"}
                      fetchpriority={isPriorityImage ? "high" : "auto"}
                      decoding="async"
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

      <DeliveryMapLink className={styles.deliveryLinkBottom} />

      <BurgerModal
        open={modalOpen}
        burger={activeBurger}
        origin={modalOrigin}
        onClose={() => {
          setModalOpen(false);
          setActiveBurger(null);
          setModalOrigin(null);
        }}
        onAdd={(burger, size, removed) => {
          addBurgerToCart(burger, size, removed);
          setModalOpen(false);
          setActiveBurger(null);
          setModalOrigin(null);
        }}
      />

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
