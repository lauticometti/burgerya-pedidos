import React from "react";
import { burgers, papas as papasData, bebidas } from "../../data/menu";
import ClosedInlineNotice from "../../components/alerts/ClosedInlineNotice";
import BrandLogo from "../../components/brand/BrandLogo";
import DeliveryMapLink from "../../components/delivery/DeliveryMapLink";
import Page from "../../components/layout/Page";
import FloatingCartPill from "../../components/cart/FloatingCartPill";
import { useCart } from "../../store/useCart";
import { resolvePublicPath } from "../../utils/assetPath";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import { formatMoney } from "../../utils/formatMoney";
import { indexById } from "../../utils/indexing";
import { useStoreStatus } from "../../utils/storeClosedMode";
import { toast } from "../../utils/toast";
import { createPapasItem } from "../../utils/cartItemBuilders";
import { useListingPageActions } from "../../hooks/useListingPageActions";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import { TOAST_KEYS } from "../../constants/toastKeys";
import ScrollBar from "../../components/ui/ScrollBar";
import BurgerDelDia from "../Burgers/BurgerDelDia";
import BurgerModal from "../Burgers/BurgerModal";
import PapasOptionModal from "../../components/papas/PapasOptionModal";
import SectionNav from "./SectionNav";
import styles from "./Menu.module.css";
import {
  buildBurgerAddedToastText,
  buildBurgerCartItem,
  notifyUnavailableBurger,
  scrollToBurgerCard,
} from "../Burgers/burgersUtils";
import {
  buildPapasBase,
  buildPapasCartItem,
  buildPapasOptionsBySize,
  indexPapasById,
} from "../Papas/papasUtils";

const BURGER_ROWS = [
  { id: "bacon", emphasis: "top", badge: "TOP" },
  { id: "cheese", emphasis: "top", badge: "TOP" },
  { id: "lautiboom", emphasis: "mid" },
  { id: "american", emphasis: "mid" },
  { id: "bbqueen", emphasis: "deluxe" },
  { id: "smoklahoma", emphasis: "deluxe" },
];

export default function Menu() {
  const cart = useCart();
  const {
    canPreviewMenu,
    closedActionLabel,
    closedToastText,
    isClosed,
    reopenText,
    dailyFeatureBurgerId,
    dailyFeatureWeekdayLabel,
  } = useStoreStatus();
  const { canAddItem, showUnavailableError } = useListingPageActions({
    toastKey: TOAST_KEYS.STORE_CLOSED_PAPAS,
  });

  // Burger modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeBurger, setActiveBurger] = React.useState(null);
  const [modalOrigin, setModalOrigin] = React.useState(null);
  const [modalSkipScroll, setModalSkipScroll] = React.useState(false);

  // Papas modal state
  const [papasModalOpen, setPapasModalOpen] = React.useState(false);
  const [activeSize, setActiveSize] = React.useState(null);
  const [selectedOptionId, setSelectedOptionId] = React.useState("solas");

  // Section nav active tracking
  const [activeSection, setActiveSection] = React.useState("burgers");
  const burgersRef = React.useRef(null);
  const papasRef = React.useRef(null);
  const bebidasRef = React.useRef(null);

  // Scroll row refs (progress bar + nudge)
  const burgersScrollRef = React.useRef(null);
  const papasScrollRef = React.useRef(null);
  const bebidasScrollRef = React.useRef(null);

  const burgersById = React.useMemo(() => indexById(burgers), []);
  const featuredBurger = dailyFeatureBurgerId
    ? burgersById[dailyFeatureBurgerId]
    : null;

  const burgerItems = React.useMemo(
    () =>
      BURGER_ROWS.map((entry) => {
        const burger = burgersById[entry.id];
        if (!burger) return null;
        return { ...entry, burger };
      }).filter(Boolean),
    [burgersById],
  );

  const papasById = React.useMemo(() => indexPapasById(papasData), []);
  const papasBase = React.useMemo(() => buildPapasBase(papasById), [papasById]);
  const optionsBySize = React.useMemo(
    () => buildPapasOptionsBySize(papasById),
    [papasById],
  );
  const dipItems = React.useMemo(
    () => papasData.filter((item) => item.id.startsWith("dip_")),
    [],
  );

  // Scroll progress (0..1) per row
  const burgerProgress = useScrollProgress(burgersScrollRef);
  const papasProgress = useScrollProgress(papasScrollRef);
  const bebidasProgress = useScrollProgress(bebidasScrollRef);

  // IntersectionObserver para marcar sección activa
  React.useEffect(() => {
    const refs = [
      { id: "burgers", ref: burgersRef },
      { id: "papas", ref: papasRef },
      { id: "bebidas", ref: bebidasRef },
    ];

    const observers = refs.map(({ id, ref }) => {
      if (!ref.current) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
      );
      observer.observe(ref.current);
      return observer;
    });

    return () => observers.forEach((obs) => obs?.disconnect());
  }, []);

  // Nudge animation on burger row at mount (once, after 600ms)
  React.useEffect(() => {
    const el = burgersScrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const TARGET = 72, DURATION = 420, RETURN_DELAY = 180;
      el.style.scrollSnapType = "none";
      let start = null, rafId;
      function ease(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }
      function animateForward(ts) {
        if (!start) start = ts;
        const t = Math.min((ts - start) / DURATION, 1);
        el.scrollLeft = ease(t) * TARGET;
        if (t < 1) { rafId = requestAnimationFrame(animateForward); }
        else { setTimeout(() => { start = null; rafId = requestAnimationFrame(animateBack); }, RETURN_DELAY); }
      }
      function animateBack(ts) {
        if (!start) start = ts;
        const t = Math.min((ts - start) / DURATION, 1);
        el.scrollLeft = TARGET * (1 - ease(t));
        if (t < 1) { rafId = requestAnimationFrame(animateBack); }
        else { el.style.scrollSnapType = ""; el.scrollLeft = 0; }
      }
      rafId = requestAnimationFrame(animateForward);
      return () => { cancelAnimationFrame(rafId); el.style.scrollSnapType = ""; };
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  function scrollToSection(id) {
    const map = { burgers: burgersRef, papas: papasRef, bebidas: bebidasRef };
    map[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Burger actions
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
    { skipScroll = false } = {},
  ) {
    if (isClosed) {
      toast.error(closedToastText, { key: "store-closed-burger" });
      return;
    }
    const price = getBurgerPriceInfo(burger, size);
    const cartItem = buildBurgerCartItem(burger, size, price, removedIngredients, extras, papas);
    cart.add(cartItem);
    const hasCustomizations = removedIngredients.length > 0 || extras.length > 0 || papas.length > 0;
    toast.success("Agregado al pedido", {
      replaceGroup: "burger-added",
      ms: hasCustomizations ? 1300 : 3500,
      subtitle: buildBurgerAddedToastText(burger.name, size, burger.id),
      actionLabel: hasCustomizations ? null : "Agregar otro igual",
      onAction: hasCustomizations ? null : () => cart.add(cartItem),
    });
    if (!skipScroll) scrollToBurgerCard(burger.id);
  }

  // Papas actions
  function openPapasModal(size) {
    if (!canAddItem()) return;
    setActiveSize(size);
    setSelectedOptionId("solas");
    setPapasModalOpen(true);
  }

  function closePapasModal() {
    setPapasModalOpen(false);
    setActiveSize(null);
  }

  function addSelectedPapas() {
    if (!canAddItem()) return;
    if (!activeSize) return;
    const options = optionsBySize[activeSize] || [];
    const picked = options.find((opt) => opt.id === selectedOptionId);
    if (!picked) return;
    if (showUnavailableError(picked, TOAST_KEYS.PAPAS_OPTION_UNAVAILABLE?.(activeSize, picked.id))) return;
    const cartItem = buildPapasCartItem(activeSize, picked);
    if (!cartItem) return;
    cart.add(cartItem);
    toast.success(`+ ${cartItem.name}`);
    closePapasModal();
  }

  return (
    <Page>
      <BrandLogo />
      <SectionNav active={activeSection} onSelect={scrollToSection} />
      <ClosedInlineNotice />

      {/* ── BURGERS ── */}
      <section
        ref={burgersRef}
        id="section-burgers"
        className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Burgers</h2>
          <p className={styles.sectionSub}>Smash. Cheddar. Punto.</p>
        </div>
        {featuredBurger ? (
          <div className={styles.featuredWrap}>
            <BurgerDelDia
              burger={featuredBurger}
              weekdayLabel={dailyFeatureWeekdayLabel}
              onOpen={(evt) => {
                setModalSkipScroll(true);
                openBurger(featuredBurger, evt);
              }}
              onAddToCart={(burger, size) =>
                addBurgerToCart(burger, size, {}, { skipScroll: true })
              }
            />
          </div>
        ) : null}

        <div className={styles.hscroll} ref={burgersScrollRef} data-section="burgers">
          {burgerItems.map((entry, i) => {
            const burger = entry.burger;
            const isStoreLocked = isClosed && !canPreviewMenu;
            const isUnavailable = isStoreLocked || isItemUnavailable(burger);
            const unavailableReason = isStoreLocked
              ? reopenText
              : getUnavailableReason(burger);

            const simplePrice = getBurgerPriceInfo(burger, "simple");
            const doublePrice = getBurgerPriceInfo(burger, "doble");
            const triplePrice = getBurgerPriceInfo(burger, "triple");

            return (
              <article
                key={burger.id}
                id={`burger-${burger.id}`}
                className={`${styles.burgerCard} ${isUnavailable ? styles.cardUnavailable : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`Ver opciones de ${burger.name}`}
                onClick={(evt) => openBurger(burger, evt)}
                onKeyDown={(evt) => {
                  if (evt.key === "Enter" || evt.key === " ") {
                    evt.preventDefault();
                    openBurger(burger, evt);
                  }
                }}>
                {entry.badge ? (
                  <span className={styles.badge}>{entry.badge}</span>
                ) : null}
                <div className={styles.burgerImgWrap}>
                  <img
                    className={styles.burgerImg}
                    src={resolvePublicPath(burger.img || "/burgers/placeholder.jpg")}
                    alt={burger.name}
                    loading={i < 2 ? "eager" : "lazy"}
                    fetchPriority={i < 2 ? "high" : "auto"}
                    decoding="async"
                  />
                </div>
                <div className={styles.burgerBody}>
                  <h3 className={styles.burgerName}>{burger.shortName || burger.name}</h3>
                  {burger.desc ? (
                    <p className={styles.burgerDesc}>{burger.desc}</p>
                  ) : null}
                  <div className={styles.burgerPrices}>
                    {[
                      { size: "simple", label: "Simple", info: simplePrice },
                      { size: "doble", label: "Doble", info: doublePrice },
                      { size: "triple", label: "Triple", info: triplePrice },
                    ]
                      .filter(({ info }) => typeof info.basePrice === "number" && info.basePrice > 0)
                      .map(({ size, label, info }) => (
                        <button
                          key={size}
                          type="button"
                          className={styles.priceBtn}
                          disabled={isUnavailable}
                          aria-label={`Agregar ${burger.name} ${label} por ${formatMoney(info.finalPrice)}`}
                          onClick={(evt) => {
                            evt.stopPropagation();
                            if (isUnavailable) {
                              notifyUnavailableBurger(burger, unavailableReason);
                              return;
                            }
                            addBurgerToCart(burger, size);
                          }}>
                          <span className={styles.priceBtnLabel}>{label}</span>
                          {info.hasDiscount ? (
                            <span className={styles.priceBtnOriginal}>
                              {formatMoney(info.basePrice)}
                            </span>
                          ) : null}
                          <span className={styles.priceBtnValue}>
                            {formatMoney(info.finalPrice)}
                          </span>
                        </button>
                      ))}
                  </div>
                  {isUnavailable ? (
                    <p className={styles.unavailableMsg}>{unavailableReason}</p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
        <ScrollBar progress={burgerProgress} />
      </section>

      {/* ── PAPAS ── */}
      <section
        ref={papasRef}
        id="section-papas"
        className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Papas</h2>
          <p className={styles.sectionSub}>Chicas o grandes. Con bacon o solas.</p>
        </div>
        <div className={`${styles.hscroll} ${styles.hscrollCompact}`} ref={papasScrollRef} data-section="papas">
          {papasBase.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.papasCard}
              disabled={isClosed}
              onClick={() => openPapasModal(item.size)}>
              <span className={styles.papasName}>{item.label}</span>
              <span className={styles.papasPrice}>
                {isClosed ? reopenText : `desde ${formatMoney(item.basePrice)}`}
              </span>
            </button>
          ))}
          {dipItems.map((item) => {
            const unavailable = isClosed || isItemUnavailable(item);
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.papasCard} ${styles.papasCardDip}`}
                disabled={unavailable}
                onClick={() => {
                  if (!canAddItem()) return;
                  if (showUnavailableError(item, `papas-dip-unavailable:${item.id}`)) return;
                  cart.add(createPapasItem(item));
                  toast.success(`+ ${item.name}`);
                }}>
                <span className={styles.papasName}>{item.name}</span>
                <span className={styles.papasPrice}>
                  {unavailable ? (isClosed ? reopenText : item.unavailableReason || "no disponible") : `+ ${formatMoney(item.price)}`}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar progress={papasProgress} />
      </section>

      {/* ── BEBIDAS ── */}
      <section
        ref={bebidasRef}
        id="section-bebidas"
        className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Bebidas</h2>
        </div>
        <div className={`${styles.hscroll} ${styles.hscrollSmall}`} ref={bebidasScrollRef} data-section="bebidas">
          {bebidas.map((item) => {
            const unavailable = isClosed || isItemUnavailable(item);
            return (
              <button
                key={item.id}
                type="button"
                className={styles.bebidaCard}
                disabled={unavailable}
                onClick={() => {
                  if (isClosed) {
                    toast.error(closedToastText, { key: "store-closed-bebida" });
                    return;
                  }
                  if (isItemUnavailable(item)) {
                    toast.error(`${item.name}: ${getUnavailableReason(item)}`, {
                      key: `bebida-unavailable:${item.id}`,
                    });
                    return;
                  }
                  cart.add({
                    key: `bebida:${item.id}`,
                    name: item.name,
                    qty: 1,
                    unitPrice: item.price,
                    meta: { type: "bebida" },
                  });
                  toast.success(`+ ${item.name}`);
                }}>
                <span className={styles.bebidaName}>{item.name}</span>
                <span className={styles.bebidaPrice}>
                  {unavailable
                    ? isClosed
                      ? reopenText
                      : item.unavailableReason || "no disponible"
                    : `+ ${formatMoney(item.price)}`}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar progress={bebidasProgress} />
      </section>

      <DeliveryMapLink className={styles.deliveryLink} />

      <BurgerModal
        open={modalOpen}
        burger={activeBurger}
        origin={modalOrigin}
        onClose={() => {
          setModalOpen(false);
          setActiveBurger(null);
          setModalOrigin(null);
          setModalSkipScroll(false);
        }}
        onAdd={(burger, size, customization, opts = {}) => {
          addBurgerToCart(burger, size, customization, { skipScroll: modalSkipScroll });
          if (opts.wantsPapas && burger.id === "cheese_promo") {
            const porcion = papasData.find((p) => p.id === "porcion_extra");
            if (porcion) {
              const mejoras = opts.papasImprovements || [];
              const papasItems = mejoras
                .map((id) => {
                  if (id === "bacon") return papasData.find((p) => p.id === "papas_bacon");
                  return null;
                })
                .filter(Boolean);
              const papasPrice = papasItems.reduce((sum, p) => sum + p.price, 0);
              const papasOptionId = mejoras.length === 0 ? "solas" : mejoras.sort().join("_");
              const papasLabel =
                mejoras.length === 0
                  ? "Papas chicas solas"
                  : `Papas chicas con ${mejoras.map(() => "bacon").join(" y ")}`;
              cart.add({
                key: `papas:chica:${papasOptionId}`,
                name: papasLabel,
                qty: 1,
                unitPrice: porcion.price + papasPrice,
                extras: [],
                papas: papasItems,
                removedIngredientes: [],
                meta: { type: "papas", size: "chica", option: papasOptionId },
              });
            }
          }
          setModalOpen(false);
          setActiveBurger(null);
          setModalOrigin(null);
          setModalSkipScroll(false);
        }}
      />

      <PapasOptionModal
        open={papasModalOpen}
        title={activeSize === "chica" ? "Papas chicas" : "Papas grandes"}
        options={activeSize ? optionsBySize[activeSize] : []}
        selectedId={selectedOptionId}
        onSelect={setSelectedOptionId}
        onClose={closePapasModal}
        onConfirm={addSelectedPapas}
        isClosed={isClosed}
        closedActionLabel={closedActionLabel}
        reopenText={reopenText}
      />

      <FloatingCartPill
        total={cart.total}
        itemCount={cart.items.reduce((sum, i) => sum + (i.qty ?? 1), 0)}
        visible={cart.items.length > 0}
      />
    </Page>
  );
}
