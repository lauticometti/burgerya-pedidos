import React from "react";
import { burgers, papas as papasData, bebidas, dips, cervezas } from "../../data/menu";
import ClosedInlineNotice from "../../components/alerts/ClosedInlineNotice";
import ArgentinaNamesNotice from "../../components/alerts/ArgentinaNamesNotice";
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
import { createDipItem } from "../../utils/cartItemBuilders";
import { useListingPageActions } from "../../hooks/useListingPageActions";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import { useCarouselControls } from "../../hooks/useCarouselControls";
import { TOAST_KEYS } from "../../constants/toastKeys";
import ScrollBar from "../../components/ui/ScrollBar";
import ProductName from "../../components/ui/ProductName";
import BurgerDelDia from "../Burgers/BurgerDelDia";
import BurgerModal from "../Burgers/BurgerModal";
import BurgerNotice from "../../components/burgers/BurgerNotice";
import PapasOptionModal from "../../components/papas/PapasOptionModal";
import SectionNav from "./SectionNav";
import { MATCH_DAY_CAMPAIGN } from "../../utils/dailyFeaturePromo";
import styles from "./Menu.module.css";

// TEMP ARGENTINA MATCH DAY: chip temático por sección. Quitar (o MATCH_DAY_CAMPAIGN=false) para revertir.
function MatchDayBadge({ children }) {
  if (!MATCH_DAY_CAMPAIGN) return null;
  return <span className={styles.matchDayBadge}>{children}</span>;
}
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

function ChevronBtn({ dir, disabled, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.arrowBtn} ${dir === "left" ? styles.arrowLeft : styles.arrowRight}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={dir === "left" ? "Anterior" : "Siguiente"}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        {dir === "left"
          ? <polyline points="8,1 3,6 8,11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          : <polyline points="4,1 9,6 4,11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </button>
  );
}

const BURGER_ROWS = [
  { id: "cheese", emphasis: "top", badge: "TOP" },
  { id: "bacon", emphasis: "top", badge: "TOP" },
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
    dailyFeatureEyebrow,
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
  const dipsRef = React.useRef(null);
  const bebidasRef = React.useRef(null);

  // Scroll row refs (progress bar + nudge)
  const burgersScrollRef = React.useRef(null);
  const papasScrollRef = React.useRef(null);
  const dipsScrollRef = React.useRef(null);
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
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aUnavail = isItemUnavailable(a.burger) ? 1 : 0;
        const bUnavail = isItemUnavailable(b.burger) ? 1 : 0;
        return aUnavail - bUnavail;
      }),
    [burgersById],
  );

  const papasById = React.useMemo(() => indexPapasById(papasData), []);
  const papasBase = React.useMemo(() => buildPapasBase(papasById), [papasById]);
  const optionsBySize = React.useMemo(
    () => buildPapasOptionsBySize(papasById),
    [papasById],
  );
  const dipItems = dips;

  // Scroll progress (0..1) per row
  const burgerProgress = useScrollProgress(burgersScrollRef);
  const papasProgress = useScrollProgress(papasScrollRef);
  const dipsProgress = useScrollProgress(dipsScrollRef);
  const bebidasProgress = useScrollProgress(bebidasScrollRef);

  // Desktop carousel controls (arrows, wheel, drag)
  const burgersControls = useCarouselControls(burgersScrollRef, 320);
  const papasControls = useCarouselControls(papasScrollRef, 260);
  const dipsControls = useCarouselControls(dipsScrollRef, 220);
  const bebidasControls = useCarouselControls(bebidasScrollRef, 220);

  // Marcar sección activa: elegir la sección cuyo tope cruzó la línea
  // de activación (40% del viewport). Robusto para secciones cortas como Dips.
  React.useEffect(() => {
    const refs = [
      { id: "burgers", ref: burgersRef },
      { id: "papas", ref: papasRef },
      { id: "dips", ref: dipsRef },
      { id: "bebidas", ref: bebidasRef },
    ];

    function updateActive() {
      const line = window.innerHeight * 0.4;
      let current = refs[0].id;
      for (const { id, ref } of refs) {
        const el = ref.current;
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = id;
      }
      setActiveSection(current);
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
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
    const map = { burgers: burgersRef, papas: papasRef, dips: dipsRef, bebidas: bebidasRef };
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
          imageSrc: resolvePublicPath(burger.img || "/burgers/placeholder.svg"),
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
    if (isItemUnavailable(burger)) {
      notifyUnavailableBurger(burger, getUnavailableReason(burger));
      return;
    }
    const price = getBurgerPriceInfo(burger, size);
    const cartItem = buildBurgerCartItem(burger, size, price, removedIngredients, extras, papas);
    cart.add(cartItem);
    const hasCustomizations = removedIngredients.length > 0 || extras.length > 0 || papas.length > 0;
    toast.added(buildBurgerAddedToastText(burger.name, size, burger.id), {
      ms: hasCustomizations ? 1300 : 2200,
    });
    if (!skipScroll) scrollToBurgerCard(burger.id);
  }

  // Papas actions
  function openPapasModal(size) {
    if (!canAddItem()) return;
    const options = optionsBySize[size] || [];
    if (options.length === 1) {
      const [only] = options;
      if (showUnavailableError(only, TOAST_KEYS.PAPAS_OPTION_UNAVAILABLE?.(size, only.id))) return;
      const cartItem = buildPapasCartItem(size, only);
      if (!cartItem) return;
      cart.add(cartItem);
      toast.added(cartItem.name);
      return;
    }
    setActiveSize(size);
    setSelectedOptionId("sola");
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
    toast.added(cartItem.name);
    closePapasModal();
  }

  return (
    <Page>
      <BrandLogo />
      <ArgentinaNamesNotice />
      <SectionNav active={activeSection} onSelect={scrollToSection} />
      <ClosedInlineNotice />

      {/* ── BURGERS ── */}
      <section
        ref={burgersRef}
        id="section-burgers"
        className={styles.section}>
        {featuredBurger ? (
          <div className={styles.featuredWrap}>
            <BurgerDelDia
              burger={featuredBurger}
              weekdayLabel={dailyFeatureWeekdayLabel}
              eyebrow={dailyFeatureEyebrow}
              unavailable={isItemUnavailable(featuredBurger)}
              unavailableReason={getUnavailableReason(featuredBurger)}
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

        {/* TEMP ARGENTINA MATCH DAY: cinta temática entre el hero y el listado. Quitar (o MATCH_DAY_CAMPAIGN=false) para revertir. */}
        {MATCH_DAY_CAMPAIGN ? (
          <div className={styles.matchDayRibbon}>
            <svg className={styles.matchDayRibbonIcon} viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" />
              <path d="M12 6.5 15.5 9l-1.3 4H9.8L8.5 9Z" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            <span>ARMÁ TU PEDIDO ANTES DEL PARTIDO</span>
          </div>
        ) : null}

        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            Burgers
            <span className={styles.sectionTitleSide}>con papas</span>
          </h2>
          <p className={styles.sectionSub}>Smash. Cheddar. Punto.</p>
          <MatchDayBadge>Las titulares</MatchDayBadge>
        </div>

        <div className={styles.carouselWrap}>
          <ChevronBtn dir="left" disabled={!burgersControls.canScrollLeft} onClick={burgersControls.scrollPrev} />
          <ChevronBtn dir="right" disabled={!burgersControls.canScrollRight} onClick={burgersControls.scrollNext} />
        <div
          className={styles.hscroll}
          ref={burgersScrollRef}
          data-section="burgers"
          onMouseDown={burgersControls.onMouseDown}
          onMouseMove={burgersControls.onMouseMove}
          onMouseUp={burgersControls.onMouseUp}
          onMouseLeave={burgersControls.onMouseLeave}>
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
                    className={`${styles.burgerImg}${burger.id === "smoklahoma" ? ` ${styles.burgerImgSmoklahoma}` : ""}`}
                    src={resolvePublicPath(burger.img || "/burgers/placeholder.svg")}
                    alt={burger.name}
                    loading={i < 2 ? "eager" : "lazy"}
                    fetchPriority={i < 2 ? "high" : "auto"}
                    decoding="async"
                  />
                </div>
                <div className={styles.burgerBody}>
                  <ProductName
                    as="h3"
                    className={styles.burgerName}
                    name={burger.shortName || burger.name}
                  />
                  {burger.notice ? (
                    <BurgerNotice notice={burger.notice} className={styles.burgerNotice} />
                  ) : null}
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
                            addBurgerToCart(burger, size, {}, { skipScroll: true });
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
        </div>
        <ScrollBar progress={burgerProgress} />
      </section>

      {/* ── PAPAS ── */}
      <section
        ref={papasRef}
        id="section-papas"
        className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Papas extra</h2>
          <p className={styles.sectionSub}>Las burgers del menú ya incluyen papas. Estas son porciones extra.</p>
          <MatchDayBadge>Para compartir</MatchDayBadge>
        </div>
        <div className={styles.carouselWrap}>
          <ChevronBtn dir="left" disabled={!papasControls.canScrollLeft} onClick={papasControls.scrollPrev} />
          <ChevronBtn dir="right" disabled={!papasControls.canScrollRight} onClick={papasControls.scrollNext} />
        <div
          className={`${styles.hscroll} ${styles.hscrollCompact}`}
          ref={papasScrollRef}
          data-section="papas"
          onMouseDown={papasControls.onMouseDown}
          onMouseMove={papasControls.onMouseMove}
          onMouseUp={papasControls.onMouseUp}
          onMouseLeave={papasControls.onMouseLeave}>
          {papasBase.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.img ? styles.bebidaCard : styles.papasCard}
              disabled={isClosed}
              onClick={() => openPapasModal(item.size)}>
              {item.img ? (
                <>
                  <div className={styles.bebidaInfo}>
                    <span className={styles.bebidaName}>{item.label}</span>
                    <span className={styles.bebidaPrice}>
                      {isClosed ? reopenText : formatMoney(item.basePrice)}
                    </span>
                  </div>
                  <div className={styles.bebidaImgWrap}>
                    <img
                      src={resolvePublicPath(item.img)}
                      alt={item.label}
                      className={styles.bebidaImg}
                    />
                  </div>
                </>
              ) : (
                <>
                  <span className={styles.papasName}>{item.label}</span>
                  <span className={styles.papasPrice}>
                    {isClosed ? reopenText : formatMoney(item.basePrice)}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
        </div>
        <ScrollBar progress={papasProgress} />
      </section>

      {/* ── DIPS ── */}
      <section
        ref={dipsRef}
        id="section-dips"
        className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            Dips
            <MatchDayBadge>Para mojar todo</MatchDayBadge>
          </h2>
        </div>
        <div className={styles.carouselWrap}>
          <ChevronBtn dir="left" disabled={!dipsControls.canScrollLeft} onClick={dipsControls.scrollPrev} />
          <ChevronBtn dir="right" disabled={!dipsControls.canScrollRight} onClick={dipsControls.scrollNext} />
        <div
          className={`${styles.hscroll} ${styles.hscrollSmall}`}
          ref={dipsScrollRef}
          data-section="dips"
          onMouseDown={dipsControls.onMouseDown}
          onMouseMove={dipsControls.onMouseMove}
          onMouseUp={dipsControls.onMouseUp}
          onMouseLeave={dipsControls.onMouseLeave}>
          {dipItems.map((item) => {
            const unavailable = isClosed || isItemUnavailable(item);
            return (
              <button
                key={item.id}
                type="button"
                className={styles.bebidaCard}
                disabled={unavailable}
                onClick={() => {
                  if (!canAddItem()) return;
                  if (showUnavailableError(item, `dip-unavailable:${item.id}`)) return;
                  cart.add(createDipItem(item));
                  toast.added(item.name);
                }}>
                <div className={styles.bebidaInfo}>
                  <span className={styles.bebidaName}>{item.name}</span>
                  {item.desc ? (
                    <span className={styles.dipDesc}>{item.desc}</span>
                  ) : null}
                  {item.ingredients ? (
                    <span className={styles.dipIngredients}>{item.ingredients}</span>
                  ) : null}
                  <span className={styles.bebidaPrice}>
                    {unavailable
                      ? isClosed
                        ? reopenText
                        : item.unavailableReason || "no disponible"
                      : formatMoney(item.price)}
                  </span>
                </div>
                {item.img && (
                  <div className={styles.bebidaImgWrap}>
                    <img
                      src={resolvePublicPath(item.img)}
                      alt={item.name}
                      className={styles.bebidaImg}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        </div>
        <ScrollBar progress={dipsProgress} />
      </section>

      {/* ── BEBIDAS ── */}
      <section
        ref={bebidasRef}
        id="section-bebidas"
        className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            Bebidas
            <MatchDayBadge>Sumá bebida</MatchDayBadge>
          </h2>
        </div>
        <div className={styles.carouselWrap}>
          <ChevronBtn dir="left" disabled={!bebidasControls.canScrollLeft} onClick={bebidasControls.scrollPrev} />
          <ChevronBtn dir="right" disabled={!bebidasControls.canScrollRight} onClick={bebidasControls.scrollNext} />
        <div
          className={`${styles.hscroll} ${styles.hscrollSmall}`}
          ref={bebidasScrollRef}
          data-section="bebidas"
          onMouseDown={bebidasControls.onMouseDown}
          onMouseMove={bebidasControls.onMouseMove}
          onMouseUp={bebidasControls.onMouseUp}
          onMouseLeave={bebidasControls.onMouseLeave}>
          {[...cervezas, ...bebidas].map((item) => {
            const isCerveza = item.subtitle !== undefined;
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
                    key: `${isCerveza ? "cerveza" : "bebida"}:${item.id}`,
                    name: item.orderName || item.name,
                    qty: 1,
                    unitPrice: item.price,
                    meta: { type: isCerveza ? "cerveza" : "bebida" },
                  });
                  toast.added(item.name);
                }}>
                <div className={styles.bebidaInfo}>
                  <span className={styles.bebidaName}>{item.name}</span>
                  {item.subtitle ? (
                    <span className={styles.bebidaPrice} style={{ opacity: 0.4, fontSize: "11px" }}>{item.subtitle}</span>
                  ) : null}
                  <span className={styles.bebidaPrice}>
                    {unavailable
                      ? isClosed
                        ? reopenText
                        : getUnavailableReason(item)
                      : formatMoney(item.price)}
                  </span>
                </div>
                {item.img && (
                  <div className={styles.bebidaImgWrap}>
                    <img
                      src={resolvePublicPath(item.img)}
                      alt={item.name}
                      className={`${styles.bebidaImg}${item.id === "coca_225" ? ` ${styles.bebidaLarge}` : ""}`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
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
        visible={cart.items.length > 0 && !modalOpen}
      />
    </Page>
  );
}
