import React from "react";
import { useCart } from "../../store/useCart";
import { bebidas, extras, papas } from "../../data/menu";
import ItemExtrasModal from "../../components/ItemExtrasModal";
import { toast } from "../../utils/toast";
import { formatMoney } from "../../utils/formatMoney";
import { getAvailableSlotsMin30, minutesToHHMM } from "../../utils/timeSlots";
import { isItemUnavailable } from "../../utils/availability";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import CarritoHeader from "../../components/carrito/CarritoHeader";
import DeliveryDetailsCard from "../../components/carrito/DeliveryDetailsCard";
import PaymentScheduleCard from "../../components/carrito/PaymentScheduleCard";
import { getPapasUpgradePrice } from "../../utils/papasPricing";
import BebidasModal from "../../components/carrito/BebidasModal";
import CartGroupsList from "../../components/carrito/CartGroupsList";
import PageTitle from "../../components/ui/PageTitle";
import BrandLogo from "../../components/brand/BrandLogo";
import styles from "./Carrito.module.css";
import {
  CART_GROUP_ORDER,
  getUndoLabel,
  groupItemsByCategory,
} from "./carritoUtils";
import useCartUndo from "./useCartUndo";
import useBebidaModal from "./useBebidaModal";
import useItemExtrasModal from "./useItemExtrasModal";
import useCarritoCheckoutForm from "./useCarritoCheckoutForm";
import useCheckoutValidation from "./useCheckoutValidation";

const VALID_COUPON_CODE = "COMBOYA";
const ONE_TIME_COUPON = "JUANSINLECHUGA";
const ONE_TIME_STORAGE_KEY = "coupon:juansinlechuga:used:v2";
const PERCENT_COUPON = "JUAN25";
const normalizeCouponInput = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\s_-]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

export default function Carrito() {
  const cart = useCart();

  const [step, setStep] = React.useState(1); // 1: Chequear pedido, 2: Datos y pago
  const {
    deliveryMode,
    setDeliveryMode,
    name,
    setName,
    address,
    setAddress,
    cross,
    setCross,
    pay,
    setPay,
    notes,
    setNotes,
    whenMode,
    setWhenMode,
    whenSlot,
    setWhenSlot,
  } = useCarritoCheckoutForm();
  const { undoItem, handleRemove, handleUndo } = useCartUndo(cart);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const [availableSlots, setAvailableSlots] = React.useState(
    getAvailableSlotsMin30(),
  );
  const [couponCode, setCouponCode] = React.useState("");
  const [couponApplied, setCouponApplied] = React.useState(false);
  const [appliedCoupon, setAppliedCoupon] = React.useState("");
  const [oneTimeUsed, setOneTimeUsed] = React.useState(false);
  React.useEffect(() => {
    const id = setInterval(
      () => setAvailableSlots(getAvailableSlotsMin30()),
      60 * 1000,
    );
    return () => clearInterval(id);
  }, []);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    // reset legacy key so everyone tiene una nueva chance
    window.localStorage.removeItem("coupon:juansinlechuga:used");
    const usedFlag = window.localStorage.getItem(ONE_TIME_STORAGE_KEY);
    setOneTimeUsed(usedFlag === "1");
  }, []);

  React.useEffect(() => {
    if (whenMode === "Más tarde" && !whenSlot && availableSlots.length) {
      setWhenSlot(minutesToHHMM(availableSlots[0]));
    }
  }, [whenMode, whenSlot, availableSlots, setWhenSlot]);

  function isComboWindowNow() {
    const now = new Date();
    const minutesSinceWeekStart =
      now.getDay() * 24 * 60 + now.getHours() * 60 + now.getMinutes();
    const comboWindowStart = 2 * 24 * 60; // martes 00:00 (fudge para que siempre esté activo en miércoles locales)
    const comboWindowEnd = 5 * 24 * 60 + 1; // viernes 00:01
    return (
      minutesSinceWeekStart >= comboWindowStart &&
      minutesSinceWeekStart <= comboWindowEnd
    );
  }

  const comboWindowActive = isComboWindowNow();

  const comboTargets = { simple: 12990, doble: 15990 };
  const combosDiscount = React.useMemo(() => {
    if (!couponApplied || appliedCoupon !== VALID_COUPON_CODE) return 0;
    if (!comboWindowActive) return 0;
    return cart.items.reduce((sum, it) => {
      if (it.meta?.type !== "combo") return sum;
      const size = it.meta?.size || "simple";
      const target = comboTargets[size];
      if (!target) return sum;
      const diff = Math.max(0, (it.unitPrice || 0) - target);
      return sum + diff * (it.qty || 0);
    }, 0);
  }, [cart.items, couponApplied, appliedCoupon, comboWindowActive]);

  const oneTimeDiscount =
    couponApplied && appliedCoupon === ONE_TIME_COUPON
      ? (() => {
          const american = cart.items.find(
            (it) =>
              it.meta?.type === "burger" &&
              (it.meta?.burgerId || "").toLowerCase() === "american" &&
              it.qty > 0,
          );
          if (!american) return 0;

          const papasContext = {
            size: american.meta?.size,
            itemType: american.meta?.type,
          };
          const extrasTotal = (american.extras || []).reduce(
            (sum, extra) => sum + extra.price,
            0,
          );
          const papasTotal = (american.papas || []).reduce(
            (sum, extra) => sum + getPapasUpgradePrice(extra, papasContext),
            0,
          );
          const picksExtrasTotal = (american.meta?.picks || []).reduce(
            (picksSum, pick) => {
              const pickExtras = (pick.extras || []).reduce(
                (pickSum, extra) => pickSum + extra.price,
                0,
              );
              const pickPapas = (pick.papas || []).reduce(
                (pickSum, extra) => pickSum + getPapasUpgradePrice(extra, papasContext),
                0,
              );
              return picksSum + pickExtras + pickPapas;
            },
            0,
          );
          const unitTotal =
            american.unitPrice + extrasTotal + papasTotal + picksExtrasTotal;
          return Math.round(unitTotal * 0.5);
        })()
      : 0;

  const percentCouponDiscount =
    couponApplied && appliedCoupon === PERCENT_COUPON
      ? Math.round(cart.total * 0.25)
      : 0;

  const totalDiscount =
    appliedCoupon === VALID_COUPON_CODE
      ? combosDiscount
      : appliedCoupon === ONE_TIME_COUPON
        ? oneTimeDiscount
        : appliedCoupon === PERCENT_COUPON
          ? percentCouponDiscount
          : 0;

  const totalWithDiscount = Math.max(0, cart.total - totalDiscount);

  const canContinue = cart.items.length > 0;
  const normalizedCouponCode = normalizeCouponInput(couponCode);
  const { canSend, missingFields, waHref } = useCheckoutValidation({
    deliveryMode,
    name,
    address,
    cross,
    pay,
    notes,
    whenMode,
    whenSlot,
    items: cart.items,
    total: totalWithDiscount,
    couponCode: couponApplied ? appliedCoupon : "",
    discountAmount: totalDiscount,
    totalBefore: cart.total,
  });
  React.useEffect(() => {
    if (!canContinue && step !== 1) {
      setStep(1);
    }
  }, [canContinue, step]);

  React.useEffect(() => {
    if (step !== 2 || typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [step]);

  function applyCoupon() {
    const code = normalizeCouponInput(couponCode);
    if (code === VALID_COUPON_CODE) {
      const hasCombos = cart.items.some((it) => it.meta?.type === "combo");
      if (!hasCombos) {
        setCouponApplied(false);
        setAppliedCoupon("");
        toast.error("Solo aplica a combos con Coca");
        return;
      }
      setCouponApplied(true);
      setAppliedCoupon(VALID_COUPON_CODE);
      setCouponCode(VALID_COUPON_CODE);
      toast.success(`${VALID_COUPON_CODE} aplicado`);
      return;
    }

    if (code === ONE_TIME_COUPON) {
      const american = cart.items.find(
        (it) =>
          it.meta?.type === "burger" &&
          (it.meta?.burgerId || "").toLowerCase() === "american" &&
          it.qty > 0,
      );
      if (!american) {
        setCouponApplied(false);
        setAppliedCoupon("");
        toast.error("Solo aplica a una American");
        return;
      }
      if (oneTimeUsed) {
        setCouponApplied(false);
        setAppliedCoupon("");
        toast.error("Este código ya fue usado en este dispositivo");
        return;
      }
      setCouponApplied(true);
      setAppliedCoupon(ONE_TIME_COUPON);
      setCouponCode(ONE_TIME_COUPON);
      setOneTimeUsed(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ONE_TIME_STORAGE_KEY, "1");
      }
      toast.success(`${ONE_TIME_COUPON} aplicado: 50% off en 1 American`);
      return;
    }

    if (code === PERCENT_COUPON) {
      setCouponApplied(true);
      setAppliedCoupon(PERCENT_COUPON);
      setCouponCode(PERCENT_COUPON);
      toast.success(`${PERCENT_COUPON} aplicado: 25% off en todo el pedido`);
      return;
    }

    setCouponApplied(false);
    setAppliedCoupon("");
    toast.error("Código inválido");
  }

  const papasMejoras = React.useMemo(() => {
    const cheddar = papas.find((item) => item.id === "cheddar_liq");
    const bacon = papas.find((item) => item.id === "papas_bacon");
    const cheddarSolo = cheddar
      ? {
          ...cheddar,
          id: "papas_cheddar",
          name: "Cheddar",
          price: cheddar.price || 1500,
          isAvailable: 1,
        }
      : null;
    const cheddarBacon =
      cheddar && bacon
        ? {
            ...cheddar,
            id: "papas_cheddar_bacon",
            name: "Cheddar y bacon",
            price: (cheddar.price || 0) + (bacon.price || 0) || 3000,
            isAvailable: 1,
          }
        : null;
    return [cheddarSolo, cheddarBacon].filter(Boolean);
  }, []);
  const bebidaItems = bebidas || [];
  const {
    modalItem,
    modalItems,
    modalSelectedIds,
    openExtrasModal,
    toggleModalSelection,
    applyModalSelection,
    closeExtrasModal,
    disableApply: disableExtrasApply,
    applyLabel: extrasApplyLabel,
    clearLabel: extrasClearLabel,
    clearHandler: onClearExtrasSelection,
    title: extrasModalTitle,
    description: extrasModalDescription,
  } = useItemExtrasModal({
    cart,
    papasMejoras,
    extraItems: extras,
  });

  const {
    bebidaOpen,
    bebidaQuantities,
    openBebidaModal,
    closeBebidaModal,
    adjustBebidaQty,
    applyBebidaSelection,
  } = useBebidaModal({
    cart,
    bebidaItems,
  });

  const groupedItems = React.useMemo(() => {
    return groupItemsByCategory(cart.items);
  }, [cart.items]);

  const slotOptions = availableSlots.map((m) => ({
    value: minutesToHHMM(m),
    label: minutesToHHMM(m),
  }));

  const groupListClasses = {
    group: styles.group,
    groupTitle: styles.groupTitle,
    groupItems: styles.groupItems,
    undoBar: styles.undoBar,
    undoText: styles.undoText,
    undoButton: styles.undoButton,
  };

  return (
    <Page>
      <BrandLogo />
      <CarritoHeader onClear={cart.clear} />

      <PageTitle>Carrito</PageTitle>

      <div className={styles.steps}>
        <Button size="sm" isActive={step === 1} onClick={() => setStep(1)}>
          1. Chequear pedido
        </Button>
        <Button
          size="sm"
          isActive={step === 2}
          onClick={() => setStep(2)}
          disabled={!canContinue}>
          2. Datos de entrega y pago
        </Button>
      </div>

      {step === 1 ? (
        <>
          <div className={styles.items}>
            {cart.items.length === 0 ? (
              <div>No hay items.</div>
            ) : (
              <CartGroupsList
                groups={CART_GROUP_ORDER}
                groupedItems={groupedItems}
                undoItem={undoItem}
                getUndoLabel={getUndoLabel}
                onUndo={handleUndo}
                onSetItemNote={cart.setNote}
                onSetQty={cart.setQty}
                onRemove={handleRemove}
                onOpenExtrasModal={openExtrasModal}
                onSetPromoPicks={cart.setPromoPicks}
                classes={groupListClasses}
              />
            )}
          </div>
          {cart.items.length > 0 ? (
            <div className={styles.addRow}>
              <div className={styles.addLeft}>
                <Button
                  size="sm"
                  variant="secondary"
                  className={styles.drinkCta}
                  onClick={openBebidaModal}>
                  Agregar bebidas
                </Button>
              </div>
              <div className={styles.addRight}>
                <input
                  className={styles.couponInput}
                  type="text"
                  placeholder="Código de descuento"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyCoupon();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className={styles.couponApply}
                  onClick={applyCoupon}>
                  Aplicar
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <DeliveryDetailsCard
            deliveryMode={deliveryMode}
            onDeliveryModeChange={setDeliveryMode}
            name={name}
            address={address}
            cross={cross}
            onNameChange={setName}
            onAddressChange={setAddress}
            onCrossChange={setCross}
          />

          <PaymentScheduleCard
            pay={pay}
            whenMode={whenMode}
            whenSlot={whenSlot}
            availableSlots={slotOptions}
            notes={notes}
            onPayChange={setPay}
            onWhenModeChange={setWhenMode}
            onWhenSlotChange={setWhenSlot}
            onNotesChange={setNotes}
          />
        </>
      )}
      {step === 2 ? (
        <div className={styles.sendInfo}>
          <div className={styles.stickyHint}>
            Se abrirá WhatsApp con tu pedido listo para enviar.
          </div>
          {missingFields.length > 0 && (
            <div className={styles.missing}>
              Falta completar: {missingFields.join(", ")}.
            </div>
          )}
        </div>
      ) : null}

      <StickyBar>
        <CartSummary total={totalWithDiscount} label="Total" />
        {step === 1 ? (
          <div className={styles.stickyRight}>
            <Button
              variant="primary"
              disabled={!canContinue}
              onClick={() => setStep(2)}>
              Continuar
            </Button>
            {!canContinue ? (
              <div className={styles.stickyHint}>
                Agrega items para continuar.
              </div>
            ) : null}
          </div>
        ) : (
          <div className={styles.stickyRight}>
            <a href={canSend ? waHref : "#"} target="_blank" rel="noreferrer">
              <Button variant="primary" disabled={!canSend}>
                Enviar por WhatsApp
              </Button>
            </a>
          </div>
        )}
      </StickyBar>

      <ItemExtrasModal
        open={!!modalItem}
        title={extrasModalTitle}
        description={extrasModalDescription}
        items={modalItems}
        selectedIds={modalSelectedIds}
        onToggle={toggleModalSelection}
        onClose={closeExtrasModal}
        onApply={applyModalSelection}
        disableApply={disableExtrasApply}
        applyLabel={extrasApplyLabel}
        onClear={onClearExtrasSelection}
        clearLabel={extrasClearLabel}
      />
      <BebidasModal
        open={bebidaOpen}
        items={bebidaItems}
        quantities={bebidaQuantities}
        onChangeQty={adjustBebidaQty}
        onClose={closeBebidaModal}
        onApply={applyBebidaSelection}
      />
    </Page>
  );
}
