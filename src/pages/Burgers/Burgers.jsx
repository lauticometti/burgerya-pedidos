import React from "react";
import { Link } from "react-router-dom";
import { burgers } from "../../data/menu";
import ClosedInlineNotice from "../../components/alerts/ClosedInlineNotice";
import BrandLogo from "../../components/brand/BrandLogo";
import CartSummary from "../../components/cart/CartSummary";
import DeliveryMapLink from "../../components/delivery/DeliveryMapLink";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import TopNav from "../../components/TopNav";
import Button from "../../components/ui/Button";
import { useCart } from "../../store/useCart";
import { resolvePublicPath } from "../../utils/assetPath";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";
import {
  getBurgerPriceInfo,
} from "../../utils/burgerPricing";
import { formatMoney } from "../../utils/formatMoney";
import {
  useStoreStatus,
} from "../../utils/storeClosedMode";
import { toast } from "../../utils/toast";
import BurgerModal from "./BurgerModal";
import styles from "./Burgers.module.css";
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
    subtitle: "Las mas vendidas.",
    tone: "gustan",
    layout: "pairHero",
    items: [
      { id: "bacon", badge: "TOP", emphasis: "top" },
      { id: "cheese", badge: "TOP", emphasis: "top" },
    ],
  },
  {
    id: "rompen",
    title: "Las que la rompen",
    subtitle: "Mas premium, mas ingredientes.",
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
  const {
    canPreviewMenu,
    closedActionLabel,
    closedToastText,
    isClosed,
    reopenText,
  } = useStoreStatus();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeBurger, setActiveBurger] = React.useState(null);
  const [modalOrigin, setModalOrigin] = React.useState(null);
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
    if (isClosed && !canPreviewMenu) {
      notifyUnavailableBurger(burger, reopenText);
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

  function addBurgerToCart(
    burger,
    size,
    { removedIngredients = [], extras = [], papas = [] } = {},
  ) {
    if (isClosed) {
      toast.error(closedToastText, {
        key: "store-closed-burger",
      });
      return;
    }

    const price = getBurgerPriceInfo(burger, size);
    cart.add(
      buildBurgerCartItem(burger, size, price, removedIngredients, extras, papas),
    );
    toast.success(buildBurgerAddedToastText(burger.name, size), {
      key: `burger-added:${burger.id}:${size}`,
      ms: 1300,
    });
    scrollToBurgerCard(burger.id);
  }

  return (
    <Page>
      <BrandLogo />
      <TopNav />
      <ClosedInlineNotice />

      {sections.map((section, sectionIndex) => (
        <section
          key={section.id}
          className={`${styles.section} ${SECTION_CLASS[section.tone] || ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <p className={styles.sectionSubtitle}>{section.subtitle}</p>
          </div>

          <div className={`${styles.cards} ${LAYOUT_CLASS[section.layout] || ""}`}>
            {section.items.map((entry, itemIndex) => {
              const burger = entry.burger;
              const isStoreLocked = isClosed && !canPreviewMenu;
              const isUnavailable = isStoreLocked || isItemUnavailable(burger);
              const unavailableReason = isStoreLocked
                ? reopenText
                : getUnavailableReason(burger);
              const globalIndex = (sectionOffsets[sectionIndex] || 0) + itemIndex;
              const isPriorityImage = globalIndex < 2;
              const simplePrice = getBurgerPriceInfo(burger, "simple");
              const doublePrice = getBurgerPriceInfo(burger, "doble");
              const triplePrice = getBurgerPriceInfo(burger, "triple");
              const cardSignalLabel = entry.badge || null;
              const cardSignalClass = entry.badge ? styles.signalTop : "";

              return (
                <article
                  key={burger.id}
                  id={`burger-${burger.id}`}
                  className={`${styles.card} ${CARD_CLASS[entry.emphasis] || ""}`}>
                  <button
                    type="button"
                    className={styles.mediaWrap}
                    onClick={(event) => openBurger(burger, event)}
                    aria-label={`Ver opciones de ${burger.name}`}>
                    <img
                      className={styles.media}
                      src={resolvePublicPath(burger.img || "/burgers/placeholder.jpg")}
                      alt={burger.name}
                      loading={isPriorityImage ? "eager" : "lazy"}
                      fetchPriority={isPriorityImage ? "high" : "auto"}
                      decoding="async"
                    />
                    {cardSignalLabel ? (
                      <span className={`${styles.signalBadge} ${cardSignalClass}`.trim()}>
                        {cardSignalLabel}
                      </span>
                    ) : null}
                  </button>

                  <div className={styles.cardBody}>
                    <div className={styles.cardTopRow}>
                      <h3 className={styles.cardTitle}>{burger.name}</h3>
                      {burger.desc && (
                        <p className={styles.cardDesc}>{burger.desc}</p>
                      )}
                    </div>

                    <div className={styles.cardPricePreview}>
                      {typeof simplePrice.basePrice === "number" &&
                      simplePrice.basePrice > 0 ? (
                        <span className={styles.cardPriceItem}>
                          <span className={styles.cardPriceLabel}>Simple</span>
                          <span className={styles.cardPriceValue}>
                            {formatMoney(simplePrice.finalPrice)}
                          </span>
                        </span>
                      ) : null}
                      {typeof doublePrice.basePrice === "number" &&
                      doublePrice.basePrice > 0 ? (
                        <span className={styles.cardPriceItem}>
                          <span className={styles.cardPriceLabel}>Doble</span>
                          <span className={styles.cardPriceValue}>
                            {formatMoney(doublePrice.finalPrice)}
                          </span>
                        </span>
                      ) : null}
                      {typeof triplePrice.basePrice === "number" &&
                      triplePrice.basePrice > 0 ? (
                        <span className={styles.cardPriceItem}>
                          <span className={styles.cardPriceLabel}>Triple</span>
                          <span className={styles.cardPriceValue}>
                            {formatMoney(triplePrice.finalPrice)}
                          </span>
                        </span>
                      ) : null}
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
        onAdd={(burger, size, customization) => {
          addBurgerToCart(burger, size, customization);
          setModalOpen(false);
          setActiveBurger(null);
          setModalOrigin(null);
        }}
      />

      <StickyBar>
        <CartSummary total={cart.total} />
        {isClosed ? (
          <Button variant="primary" disabled subLabel={reopenText}>
            {closedActionLabel}
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
