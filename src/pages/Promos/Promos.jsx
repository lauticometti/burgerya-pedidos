import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { burgers, promoPrices, promoRules } from "../../data/menu.js";
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
  },
  {
    tier: "PREMIUM",
    label: "Premium",
    img: "/promos/premium.jpg",
    tone: "Premium",
  },
  {
    tier: "DELUXE",
    label: "Deluxe",
    img: "/promos/deluxe.jpg",
    tone: "Deluxe",
  },
];

export default function Promos() {
  const cart = useCart();

  const [tier, setTier] = useState(null); // BASICA | PREMIUM | DELUXE
  const [count, setCount] = useState(null); // 2 | 3 | 4
  const [size, setSize] = useState(null); // doble | triple
  const [picked, setPicked] = useState([]); // { id, name, note }
  const [flyerPreview, setFlyerPreview] = useState(null);
  const [flyerStatus, setFlyerStatus] = useState(() =>
    PROMO_FLYERS.reduce((acc, flyer) => {
      acc[flyer.tier] = "loading";
      return acc;
    }, {}),
  );
  const countRef = useRef(null);
  const sizeRef = useRef(null);
  const pickRef = useRef(null);

  const allowed = useMemo(() => {
    if (!tier) return [];
    const allowedTiers = promoRules[tier].allowedTiers;
    return burgers.filter((b) => allowedTiers.includes(b.tier));
  }, [tier]);

  const price = useMemo(() => {
    if (!tier || !count || !size) return null;
    return promoPrices[tier][size][count];
  }, [tier, count, size]);

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

  function resetAll() {
    setTier(null);
    setCount(null);
    setSize(null);
    setPicked([]);
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

    PROMO_FLYERS.forEach((flyer) => {
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
  }, []);

  useEffect(() => {
    if (!flyerPreview) return;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setFlyerPreview(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flyerPreview]);

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
      sound: true,
    });
    resetAll();
  }

  const pickedNames = picked.map((pick) => pick.name || pick.id);
  const flyersAllLoaded = PROMO_FLYERS.every(
    (flyer) => flyerStatus[flyer.tier] === "loaded",
  );
  const flyersAnyError = PROMO_FLYERS.some(
    (flyer) => flyerStatus[flyer.tier] === "error",
  );
  const showFlyerSection = flyersAllLoaded && !flyersAnyError;

  return (
    <Page>
      <BrandLogo />

      <TopNav />
      <PageTitle>Promos</PageTitle>

      {showFlyerSection ? (
        <section className={styles.flyerSection}>
          <div className={styles.flyerHeader}>
            <div className={styles.sectionTitle}>Promos más pedidas</div>
            <div className={styles.subtle}>
              Mirá los flyers y elegí el tipo de promo para empezar.
            </div>
          </div>

          <div className={styles.flyerGrid}>
            {PROMO_FLYERS.map((flyer) => (
              <Card
                key={flyer.tier}
                className={`${styles.flyerCard} ${
                  styles[`flyer${flyer.tone}`]
                } ${tier === flyer.tier ? styles.flyerSelected : ""}`}>
                <button
                  type="button"
                  className={styles.flyerButton}
                  onClick={() => setFlyerPreview(flyer)}
                  aria-label={`Ver promo ${flyer.label} en grande`}>
                  <div className={styles.flyerMedia}>
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

      {flyerPreview && showFlyerSection ? (
        <div
          className={styles.flyerModalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setFlyerPreview(null)}>
          <div
            className={styles.flyerModal}
            onClick={(event) => event.stopPropagation()}>
            <img
              className={styles.flyerModalImage}
              src={flyerPreview.img}
              alt={`Promo ${flyerPreview.label}`}
            />
            <div className={styles.flyerModalActions}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  chooseTier(flyerPreview.tier);
                  setFlyerPreview(null);
                }}>
                Elegir {flyerPreview.label}
              </Button>
              <Button size="sm" onClick={() => setFlyerPreview(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <PromoStepCard step={step} helpText={stepHelp} />

      <Card className={styles.card}>
        <div className={styles.sectionTitle}>Elegí promo</div>
        <div className={`${styles.row} ${styles.rowWrap}`}>
          <Button
            isActive={tier === "BASICA"}
            onClick={() => chooseTier("BASICA")}>
            Básica
          </Button>
          <Button
            isActive={tier === "PREMIUM"}
            onClick={() => chooseTier("PREMIUM")}>
            Premium
          </Button>
          <Button
            isActive={tier === "DELUXE"}
            onClick={() => chooseTier("DELUXE")}>
            Deluxe
          </Button>
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

              <div className={`${styles.row} ${styles.rowWrap}`}>
                {allowed.map((b) => (
                  <Button
                    key={b.id}
                    onClick={() => pickBurger(b)}
                    disabled={!canPickMore}>
                    {b.name}
                  </Button>
                ))}
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
              {pickedNames.length === 0 ? (
                <div className={styles.empty}>-</div>
              ) : (
                pickedNames.map((name, i) => (
                  <Pill key={`${name}-${i}`} active>
                    {name}
                  </Pill>
                ))
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
        <CartSummary total={cart.total} lastAdded={cart.lastAdded} />
        <Link to="/carrito">
          <Button variant="primary" disabled={cart.items.length === 0}>
            Ir al carrito
          </Button>
        </Link>
      </StickyBar>
    </Page>
  );
}
