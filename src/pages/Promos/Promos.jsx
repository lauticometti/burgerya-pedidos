import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { burgers, promoPrices, promoRules } from "../../data/menu.js";
import { useCart } from "../../store/useCart.js";
import { toast } from "../../utils/toast.js";
import { formatMoney } from "../../utils/formatMoney.js";
import { getBurgerPrice } from "../../utils/burgerPricing.js";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability.js";
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

const PROMO_OPTIONS = [
  { tier: "BASICA", label: "Basica", rank: 1 },
  { tier: "PREMIUM", label: "Premium", rank: 2 },
  { tier: "DELUXE", label: "Deluxe", rank: 3 },
];

export default function Promos() {
  const cart = useCart();

  const [tier, setTier] = useState(null); // BASICA | PREMIUM | DELUXE
  const [count, setCount] = useState(null); // 2 | 3 | 4
  const [size, setSize] = useState(null); // doble | triple
  const [picked, setPicked] = useState([]); // { id, name, note }
  const promoOptions = useMemo(
    () => [...PROMO_OPTIONS].sort((a, b) => a.rank - b.rank),
    [],
  );
  const countRef = useRef(null);
  const sizeRef = useRef(null);
  const pickRef = useRef(null);

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
      const unit = getBurgerPrice(burger, size);
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
      ? "Elegi el tipo de promo."
      : step === 2
        ? "Defini cuantas burgers queres."
        : step === 3
          ? "Elegi tamano doble o triple."
          : "Selecciona las burgers para completar la promo.";

  const tierLabels = {
    BASICA: "de la promo basica:",
    PREMIUM: "de la promo premium:",
    DELUXE: "de la promo deluxe:",
  };
  const tierOrder = ["BASICA", "PREMIUM", "DELUXE"];

  function chooseTier(nextTier) {
    setTier(nextTier);
    setCount(null);
    setSize(null);
    setPicked([]);
  }

  function chooseCount(nextCount) {
    setCount(nextCount);
    setPicked([]);
  }

  function chooseSize(nextSize) {
    setSize(nextSize);
    setPicked([]);
  }

  function pickBurger(burger) {
    if (!canPickMore) return;
    if (isItemUnavailable(burger)) {
      const reason = getUnavailableReason(burger);
      toast.error(`${burger.name}: ${reason}`, {
        key: `promo-unavailable:${burger.id}`,
      });
      return;
    }
    setPicked((prev) => [...prev, { id: burger.id, name: burger.name, note: "" }]);
  }

  function undoLast() {
    setPicked((prev) => prev.slice(0, -1));
  }

  function removePick(index) {
    setPicked((prev) => prev.filter((_, i) => i !== index));
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

      function stepScroll(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, start + distance * ease);
        if (progress < 1) window.requestAnimationFrame(stepScroll);
      }

      window.requestAnimationFrame(stepScroll);
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

  function addPromoToCart() {
    if (!tier || !count || !size || picked.length !== count || price == null) return;

    const unavailablePick = picked.find((pick) =>
      isItemUnavailable(burgersById[pick.id]),
    );
    if (unavailablePick) {
      const reason = getUnavailableReason(burgersById[unavailablePick.id]);
      toast.error(`${unavailablePick.name}: ${reason}`, {
        key: `promo-unavailable:${unavailablePick.id}`,
      });
      return;
    }

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

  return (
    <Page>
      <BrandLogo />

      <TopNav />
      <PageTitle>Promos</PageTitle>
      <p className={styles.pageNote}>Todas las promos incluyen papas.</p>

      <PromoStepCard step={step} helpText={stepHelp} />

      <Card className={styles.card}>
        <div className={styles.sectionTitle}>Elegi promo</div>
        <div className={`${styles.row} ${styles.rowWrap}`}>
          {promoOptions.map((option) => (
            <Button
              key={option.tier}
              isActive={tier === option.tier}
              onClick={() => chooseTier(option.tier)}>
              {option.label}
            </Button>
          ))}
        </div>
      </Card>

      {tier && (
        <div ref={countRef}>
          <Card className={styles.card}>
            <div className={styles.sectionTitle}>Cuantas burgers?</div>
            <div className={`${styles.row} ${styles.rowWrap}`}>
              {[2, 3, 4].map((n) => (
                <Button key={n} isActive={count === n} onClick={() => chooseCount(n)}>
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
            <div className={styles.sectionTitle}>Dobles o triples?</div>
            <div className={`${styles.row} ${styles.rowWrap}`}>
              {["doble", "triple"].map((s) => (
                <Button key={s} isActive={size === s} onClick={() => chooseSize(s)}>
                  {s === "doble" ? "Dobles" : "Triples"}
                </Button>
              ))}
            </div>

            {size && price != null ? (
              <div className={styles.price}>
                <b>Precio promo:</b> {formatMoney(price)}
                {showSavings ? (
                  <div className={styles.savings}>
                    <span>Comprar sueltas: {formatMoney(pickedTotal)}</span>
                    <span
                      className={
                        savingsValue >= 0 ? styles.savingsPositive : styles.savingsNegative
                      }>
                      {savingsValue >= 0
                        ? `Ahorras ${formatMoney(savingsValue)}`
                        : `Promo +${formatMoney(Math.abs(savingsValue))}`}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {tier && count && size ? (
        <>
          <div ref={pickRef}>
            <Card className={styles.card}>
              <div className={styles.rowBetween}>
                <div>
                  <b>Elegi burgers</b> ({picked.length}/{count})
                  <div className={styles.subtle}>Se pueden repetir.</div>
                </div>

                <Button size="sm" onClick={undoLast} disabled={picked.length === 0}>
                  Deshacer
                </Button>
              </div>

              <div className={styles.pickGroups}>
                {tierOrder.map((tierKey) => {
                  const tierItems = allowedByTier[tierKey] || [];
                  if (!tierItems.length) return null;
                  return (
                    <div key={tierKey} className={styles.pickGroup}>
                      <div className={styles.pickGroupLabel}>{tierLabels[tierKey]}</div>
                      <div className={`${styles.row} ${styles.rowWrap} ${styles.pickRow}`}>
                        {tierItems.map((b) => {
                          const isUnavailable = isItemUnavailable(b);
                          const unavailableReason = getUnavailableReason(b);
                          return (
                            <Button
                              key={b.id}
                              onClick={() => pickBurger(b)}
                              disabled={!canPickMore}
                              aria-disabled={isUnavailable}
                              title={isUnavailable ? unavailableReason : undefined}
                              subLabel={isUnavailable ? unavailableReason : undefined}
                              className={isUnavailable ? styles.pickUnavailable : ""}>
                              {b.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              {picked.length === count ? (
                <div className={styles.remaining}>
                  Ya elegiste las {count} burgers de tu promo.
                </div>
              ) : null}
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
                    <Pill key={`${name}-${i}`} active className={styles.pickPill}>
                      <span>{name}</span>
                      <button
                        type="button"
                        className={styles.pickRemove}
                        aria-label={`Quitar ${name}`}
                        onClick={() => removePick(i)}>
                        x
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
                <div className={styles.totalPrice}>{formatMoney(price ?? 0)}</div>
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
      ) : null}

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
