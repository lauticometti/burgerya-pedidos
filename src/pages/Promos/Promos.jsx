import { useMemo, useState } from "react";
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

export default function Promos() {
  const cart = useCart();

  const [tier, setTier] = useState(null); // BASICA | PREMIUM | DELUXE
  const [count, setCount] = useState(null); // 2 | 3 | 4
  const [size, setSize] = useState(null); // doble | triple
  const [picked, setPicked] = useState([]); // { id, name, note }

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

  return (
    <Page>
      <BrandLogo />

      <TopNav />
      <PageTitle>Promos</PageTitle>

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
      )}

      {tier && count && (
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
      )}

      {tier && count && size && (
        <>
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
