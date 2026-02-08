import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  burgers,
  comboDomingo,
  promoPrices,
  promoRules,
} from "../../data/menu.js";
import { useCart } from "../../store/useCart.js";
import { toast } from "../../utils/toast.js";
import { formatMoney } from "../../utils/formatMoney.js";
import TopNav from "../../components/TopNav.jsx";
import Page from "../../components/layout/Page.jsx";
import StickyBar from "../../components/layout/StickyBar.jsx";
import CartSummary from "../../components/cart/CartSummary.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Pill from "../../components/ui/Pill.jsx";
import PromoStepCard from "../../components/promos/PromoStepCard.jsx";
import PageTitle from "../../components/ui/PageTitle.jsx";
import styles from "./Promos.module.css";
import BrandLogo from "../../components/brand/BrandLogo";

const PROMO_FLYERS = [
  {
    tier: "BASICA",
    label: "Básica",
    img: "/promos/basica.jpg",
    tone: "Basica",
    rank: 1,
    badge: "Más elegida",
  },
  {
    tier: "PREMIUM",
    label: "Premium",
    img: "/promos/premium.jpg",
    tone: "Premium",
    rank: 2,
  },
  {
    tier: "DELUXE",
    label: "Deluxe",
    img: "/promos/deluxe.jpg",
    tone: "Deluxe",
    rank: 3,
  },
];

export default function Promos() {
  const cart = useCart();

  const [tier, setTier] = useState(null); // BASICA | PREMIUM | DELUXE
  const [count, setCount] = useState(null); // 2 | 3 | 4
  const [size, setSize] = useState(null); // doble | triple
  const [picked, setPicked] = useState([]); // { id, name, note }
  const [flyerPreviewIndex, setFlyerPreviewIndex] = useState(null);
  const [flyerStatus, setFlyerStatus] = useState(() =>
    PROMO_FLYERS.reduce((acc, flyer) => {
      acc[flyer.tier] = "loading";
      return acc;
    }, {}),
  );
  const orderedFlyers = useMemo(
    () => [...PROMO_FLYERS].sort((a, b) => a.rank - b.rank),
    [],
  );
  const flyerCount = orderedFlyers.length;
  const countRef = useRef(null);
  const sizeRef = useRef(null);
  const pickRef = useRef(null);
  const swipeStartX = useRef(null);
  const swipeStartY = useRef(null);
  const swipeActive = useRef(false);

  const allowedByTier = useMemo(() => {
    if (!tier) return { BASICA: [], PREMIUM: [], DELUXE: [] };
    const allowedTiers = promoRules[tier].allowedTiers;
    const grouped = { BASICA: [], PREMIUM: [], DELUXE: [] };
    burgers.forEach((burger) => {
      if (allowedTiers.includes(burger.tier)) {
        grouped[burger.tier].push(burger);
      }
    });
    return grouped;
  }, [tier]);

  const burgersById = useMemo(() => {
    return burgers.reduce((acc, burger) => {
      acc[burger.id] = burger;
      return acc;
    }, {});
  }, []);

  const price = useMemo(() => {
    if (!tier || !count || !size) return null;
    return promoPrices[tier][size][count];
  }, [tier, count, size]);

  const pickedTotal = useMemo(() => {
    if (!size || picked.length === 0) return null;
    return picked.reduce((sum, pick) => {
      const burger = burgersById[pick.id];
      const unit = burger?.prices?.[size] || 0;
      return sum + unit;
    }, 0);
  }, [picked, size, burgersById]);

  const showSavings = picked.length === count && price != null && pickedTotal;
  const savingsValue = showSavings ? pickedTotal - price : null;

  const canPickMore = tier && count && size && picked.length < count;
  const step = !tier ? 1 : !count ? 2 : !size ? 3 : 4;
  const remaining = count ? Math.max(count - picked.length, 0) : 0;
  const remainingText =
    remaining === 0
      ? "Listo para agregar"
      : `Te faltan ${remaining} burger${remaining === 1 ? "" : "s"}`;

  const stepHelp =
    step === 1
      ? "Elegí el tipo de promo."
      : step === 2
        ? "Definí cuántas burgers querés."
        : step === 3
          ? "Elegí tamaño doble o triple."
          : "Seleccioná las burgers para completar la promo.";

  const tierLabels = {
    BASICA: "de la promo basica:",
    PREMIUM: "de la promo premium:",
    DELUXE: "de la promo deluxe:",
  };
  const tierOrder = ["BASICA", "PREMIUM", "DELUXE"];

  function chooseTier(t) {
    setTier(t);
    setCount(null);
    setSize(null);
    setPicked([]);
  }

  function chooseCount(n) {
    setCount(n);
    setPicked([]);
  }

  function chooseSize(s) {
    setSize(s);
    setPicked([]);
  }

  function pickBurger(burger) {
    if (!canPickMore) return;
    setPicked((p) => [...p, { id: burger.id, name: burger.name, note: "" }]);
  }

  function undoLast() {
    setPicked((p) => p.slice(0, -1));
  }

  function removePick(index) {
    setPicked((p) => p.filter((_, i) => i !== index));
  }

  function resetAll() {
    setTier(null);
    setCount(null);
    setSize(null);
    setPicked([]);
  }

  function goPrevFlyer() {
    setFlyerPreviewIndex((prev) => {
      if (prev == null) return 0;
      return (prev - 1 + flyerCount) % flyerCount;
    });
  }

  function goNextFlyer() {
    setFlyerPreviewIndex((prev) => {
      if (prev == null) return 0;
      return (prev + 1) % flyerCount;
    });
  }

  function scrollToRef(ref) {
    if (!ref?.current) return;
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const offset = 96;
      const target = rect.top + window.scrollY - offset;
      const start = window.scrollY;
      const distance = target - start;

      if (Math.abs(distance) < 8) {
        window.scrollTo(0, target);
        return;
      }

      const duration = 500;
      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, start + distance * ease);
        if (progress < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }, 80);
  }

  useEffect(() => {
    if (tier) scrollToRef(countRef);
  }, [tier]);

  useEffect(() => {
    if (count) scrollToRef(sizeRef);
  }, [count]);

  useEffect(() => {
    if (size) scrollToRef(pickRef);
  }, [size]);

  useEffect(() => {
    let isActive = true;

    orderedFlyers.forEach((flyer) => {
      const img = new Image();
      img.src = flyer.img;
      img.onload = () => {
        if (!isActive) return;
        setFlyerStatus((prev) => ({ ...prev, [flyer.tier]: "loaded" }));
      };
      img.onerror = () => {
        if (!isActive) return;
        setFlyerStatus((prev) => ({ ...prev, [flyer.tier]: "error" }));
      };
    });

    return () => {
      isActive = false;
    };
  }, [orderedFlyers]);

  useEffect(() => {
    if (flyerPreviewIndex == null) return;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setFlyerPreviewIndex(null);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevFlyer();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNextFlyer();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flyerPreviewIndex]);

  function handleSwipeStart(event) {
    const point = event.touches ? event.touches[0] : event;
    swipeStartX.current = point.clientX;
    swipeStartY.current = point.clientY;
    swipeActive.current = true;
  }

  function handleSwipeEnd(event) {
    if (!swipeActive.current) return;
    const point = event.changedTouches ? event.changedTouches[0] : event;
    const deltaX = point.clientX - swipeStartX.current;
    const deltaY = point.clientY - swipeStartY.current;
    const threshold = 48;

    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goNextFlyer();
      } else {
        goPrevFlyer();
      }
    }

    swipeActive.current = false;
    swipeStartX.current = null;
    swipeStartY.current = null;
  }

  function addSpecialPromoToCart() {
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
  }

  function addPromoToCart() {
    if (!tier || !count || !size || picked.length !== count) return;

    const names = picked.map((pick) => pick.name || pick.id);
    const key = `promo:${tier}:${count}:${size}:${names.join(",")}:${Date.now()}`;
    const sizeLabel = size === "doble" ? "DOBLES" : "TRIPLES";
    const tierLabel =
      tier === "BASICA" ? "BASICAS" : tier === "PREMIUM" ? "PREMIUM" : "DELUXE";
    const promoLabel = `${count} ${sizeLabel} ${tierLabel}`;

    cart.add({
      key,
      name: promoLabel,
      qty: 1,
      unitPrice: price,
      meta: {
        type: "promo",
        tier,
        count,
        size,
        picks: picked,
      },
    });

    toast.promo(`Promo agregada - ${formatMoney(price)}`, {
      key: "promo-added",
    });
    resetAll();
  }

  const flyersAllLoaded = orderedFlyers.every(
    (flyer) => flyerStatus[flyer.tier] === "loaded",
  );
  const flyersAnyError = orderedFlyers.some(
    (flyer) => flyerStatus[flyer.tier] === "error",
  );
  const showFlyerSection = flyersAllLoaded && !flyersAnyError;
  const currentFlyer =
    flyerPreviewIndex != null ? orderedFlyers[flyerPreviewIndex] : null;

  return (
    <Page>
      <BrandLogo />

      <TopNav />
      <PageTitle>Promos</PageTitle>

      <section className={styles.comboSection}>
        <div className={styles.comboHeader}>
          <div className={styles.sectionTitle}>Solo hoy. Domingo 8.</div>
        </div>
        <Card className={styles.comboCard}>
          <div className={styles.comboMedia}>
            <img
              src={comboDomingo.img}
              alt={comboDomingo.label}
              loading="lazy"
            />
          </div>
          <Button variant="primary" onClick={addSpecialPromoToCart}>
            Agregar al carrito
          </Button>
        </Card>
      </section>

      {showFlyerSection ? (
        <section className={styles.flyerSection}>
          <div className={styles.flyerHeader}>
            <div className={styles.sectionTitle}>Promos más pedidas</div>
            <div className={styles.subtle}>
              Mirá los flyers y elegí el tipo de promo para empezar.
            </div>
          </div>

          <div className={styles.flyerGrid}>
            {orderedFlyers.map((flyer, index) => (
              <Card
                key={flyer.tier}
                className={`${styles.flyerCard} ${
                  styles[`flyer${flyer.tone}`]
                } ${tier === flyer.tier ? styles.flyerSelected : ""}`}>
                <button
                  type="button"
                  className={styles.flyerButton}
                  onClick={() => setFlyerPreviewIndex(index)}
                  aria-label={`Ver promo ${flyer.label} en grande`}>
                  <div className={styles.flyerMedia}>
                    {flyer.badge ? (
                      <div className={styles.flyerBadge}>{flyer.badge}</div>
                    ) : null}
                    <img
                      src={flyer.img}
                      alt={`Promo ${flyer.label}`}
                      loading="lazy"
                      onError={() =>
                        setFlyerStatus((prev) => ({
                          ...prev,
                          [flyer.tier]: "error",
                        }))
                      }
                    />
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {currentFlyer && showFlyerSection ? (
        <div
          className={styles.flyerModalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setFlyerPreviewIndex(null)}>
          <div
            className={styles.flyerModal}
            onClick={(event) => event.stopPropagation()}>
            <div className={styles.flyerModalContent}>
              <div
                className={styles.flyerModalCarousel}
                onTouchStart={handleSwipeStart}
                onTouchEnd={handleSwipeEnd}
                onMouseDown={handleSwipeStart}
                onMouseUp={handleSwipeEnd}>
                <button
                  type="button"
                  className={`${styles.flyerNavButton} ${styles.flyerNavLeft}`}
                  onClick={goPrevFlyer}
                  aria-label="Ver flyer anterior">
                  <svg
                    className={styles.flyerNavIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false">
                    <path d="M15 18 9 12l6-6" />
                  </svg>
                </button>
                <img
                  className={styles.flyerModalImage}
                  src={currentFlyer.img}
                  alt={`Promo ${currentFlyer.label}`}
                  draggable="false"
                />
                <button
                  type="button"
                  className={`${styles.flyerNavButton} ${styles.flyerNavRight}`}
                  onClick={goNextFlyer}
                  aria-label="Ver flyer siguiente">
                  <svg
                    className={styles.flyerNavIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
              <div className={styles.flyerDots} role="tablist">
                {orderedFlyers.map((flyer, index) => (
                  <button
                    key={flyer.tier}
                    type="button"
                    className={`${styles.flyerDot} ${
                      index === flyerPreviewIndex ? styles.flyerDotActive : ""
                    }`}
                    onClick={() => setFlyerPreviewIndex(index)}
                    aria-label={`Ver promo ${flyer.label}`}
                  />
                ))}
              </div>
              <div className={styles.flyerModalActions}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    chooseTier(currentFlyer.tier);
                    setFlyerPreviewIndex(null);
                  }}>
                  Elegir {currentFlyer.label.toLowerCase()}
                </Button>
                <Button size="sm" onClick={() => setFlyerPreviewIndex(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <PromoStepCard step={step} helpText={stepHelp} />

      <Card className={styles.card}>
        <div className={styles.sectionTitle}>Elegí promo</div>
        <div className={`${styles.row} ${styles.rowWrap}`}>
          {orderedFlyers.map((flyer) => (
            <Button
              key={flyer.tier}
              isActive={tier === flyer.tier}
              onClick={() => chooseTier(flyer.tier)}>
              {flyer.label}
            </Button>
          ))}
        </div>
      </Card>

      {tier && (
        <div ref={countRef}>
          <Card className={styles.card}>
            <div className={styles.sectionTitle}>¿Cuántas burgers?</div>
            <div className={`${styles.row} ${styles.rowWrap}`}>
              {[2, 3, 4].map((n) => (
                <Button
                  key={n}
                  isActive={count === n}
                  onClick={() => chooseCount(n)}>
                  {n}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tier && count && (
        <div ref={sizeRef}>
          <Card className={styles.card}>
            <div className={styles.sectionTitle}>¿Dobles o triples?</div>
            <div className={`${styles.row} ${styles.rowWrap}`}>
              {["doble", "triple"].map((s) => (
                <Button
                  key={s}
                  isActive={size === s}
                  onClick={() => chooseSize(s)}>
                  {s === "doble" ? "Dobles" : "Triples"}
                </Button>
              ))}
            </div>

            {size && price != null && (
              <div className={styles.price}>
                <b>Precio promo:</b> {formatMoney(price)}
                {showSavings ? (
                  <div className={styles.savings}>
                    <span>Comprar sueltas: {formatMoney(pickedTotal)}</span>
                    <span
                      className={
                        savingsValue >= 0
                          ? styles.savingsPositive
                          : styles.savingsNegative
                      }>
                      {savingsValue >= 0
                        ? `Ahorrás ${formatMoney(savingsValue)}`
                        : `Promo +${formatMoney(Math.abs(savingsValue))}`}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </Card>
        </div>
      )}

      {tier && count && size && (
        <>
          <div ref={pickRef}>
            <Card className={styles.card}>
              <div className={styles.rowBetween}>
                <div>
                  <b>Elegí burgers</b> ({picked.length}/{count})
                  <div className={styles.subtle}>Se pueden repetir.</div>
                </div>

                <Button
                  size="sm"
                  onClick={undoLast}
                  disabled={picked.length === 0}>
                  Deshacer
                </Button>
              </div>

              <div className={styles.pickGroups}>
                {tierOrder.map((tierKey) => {
                  const tierItems = allowedByTier[tierKey] || [];
                  if (!tierItems.length) return null;
                  return (
                    <div key={tierKey} className={styles.pickGroup}>
                      <div className={styles.pickGroupLabel}>
                        {tierLabels[tierKey]}
                      </div>
                      <div
                        className={`${styles.row} ${styles.rowWrap} ${styles.pickRow}`}>
                        {tierItems.map((b) => (
                          <Button
                            key={b.id}
                            onClick={() => pickBurger(b)}
                            disabled={!canPickMore}>
                            {b.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {picked.length === count && (
                <div className={styles.remaining}>
                  Ya elegiste las {count} burgers de tu promo.
                </div>
              )}
            </Card>
          </div>

          <Card className={styles.card}>
            <div className={styles.sectionTitle}>Elegidas</div>
            <div className={styles.picksWrap}>
              {picked.length === 0 ? (
                <div className={styles.empty}>-</div>
              ) : (
                picked.map((pick, i) => {
                  const name = pick.name || pick.id;
                  return (
                    <Pill
                      key={`${name}-${i}`}
                      active
                      className={styles.pickPill}>
                      <span>{name}</span>
                      <button
                        type="button"
                        className={styles.pickRemove}
                        aria-label={`Quitar ${name}`}
                        onClick={() => removePick(i)}>
                        ×
                      </button>
                    </Pill>
                  );
                })
              )}
            </div>
          </Card>

          <Card>
            <div className={styles.rowBetween}>
              <div>
                <div className={styles.subtle}>Listo para agregar</div>
                <div className={styles.totalPrice}>
                  {formatMoney(price ?? 0)}
                </div>
              </div>

              <Button
                variant="primary"
                type="button"
                onClick={addPromoToCart}
                disabled={picked.length !== count}
                subLabel={remainingText}>
                Agregar promo
              </Button>
            </div>
          </Card>
        </>
      )}

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
