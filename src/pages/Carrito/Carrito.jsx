import React from "react";
import { useCart } from "../../store/useCart";
import { bebidas, burgers, extras, papas } from "../../data/menu";
import ItemExtrasModal from "../../components/ItemExtrasModal";
import { toast } from "../../utils/toast";
import { formatMoney } from "../../utils/formatMoney";
import { getAvailableSlotsMin30, minutesToHHMM } from "../../utils/timeSlots";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import CarritoHeader from "../../components/carrito/CarritoHeader";
import DeliveryDetailsCard from "../../components/carrito/DeliveryDetailsCard";
import PaymentScheduleCard from "../../components/carrito/PaymentScheduleCard";
import BebidasModal from "../../components/carrito/BebidasModal";
import CartGroupsList from "../../components/carrito/CartGroupsList";
import RemoveIngredientsModal from "../../components/carrito/RemoveIngredientsModal";
import PageTitle from "../../components/ui/PageTitle";
import BrandLogo from "../../components/brand/BrandLogo";
import DeliveryMapLink from "../../components/delivery/DeliveryMapLink";
import styles from "./Carrito.module.css";
import {
  CART_GROUP_ORDER,
  getUndoLabel,
  groupItemsByCategory,
} from "./carritoUtils";
import useCartUndo from "./useCartUndo";
import useBebidaModal from "./useBebidaModal";
import useItemExtrasModal from "./useItemExtrasModal";
import useRemoveIngredientsModal from "./useRemoveIngredientsModal";
import useCarritoCheckoutForm from "./useCarritoCheckoutForm";
import useCheckoutValidation from "./useCheckoutValidation";
import {
  couponStorage,
  evaluateCoupon,
  normalizeCouponInput,
} from "../../utils/coupons";
import useCartPromotions from "../../hooks/useCartPromotions";

export default function Carrito() {
  const cart = useCart();

  const [step, setStep] = React.useState(1); // 1: Chequear pedido, 2: Datos y pago
  const burgersById = React.useMemo(
    () =>
      burgers.reduce((acc, burger) => {
        acc[burger.id] = burger;
        return acc;
      }, {}),
    [],
  );
  const promoState = useCartPromotions(cart, { papasList: papas, manageGifts: false });
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
  const [appliedCoupon, setAppliedCoupon] = React.useState("");
  React.useEffect(() => {
    const id = setInterval(
      () => setAvailableSlots(getAvailableSlotsMin30()),
      60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (whenMode === "Más tarde" && !whenSlot && availableSlots.length) {
      setWhenSlot(minutesToHHMM(availableSlots[0]));
    }
  }, [whenMode, whenSlot, availableSlots, setWhenSlot]);

  const discountResult = React.useMemo(() => {
    if (!appliedCoupon) return { discount: 0 };
    return evaluateCoupon({
      code: appliedCoupon,
      cartItems: cart.items,
      cartTotal: cart.total,
      now: new Date(),
      storage: couponStorage,
      allowUsed: true,
      markUsed: false,
    });
  }, [appliedCoupon, cart.items, cart.total]);

  const totalDiscount = discountResult?.discount || 0;

  React.useEffect(() => {
    if (!appliedCoupon) return;
    if (discountResult?.error) {
      setAppliedCoupon("");
      toast.error(discountResult.error);
    }
  }, [appliedCoupon, discountResult?.error]);

  const totalWithDiscount = Math.max(0, cart.total - totalDiscount);

  const canContinue = cart.items.length > 0;
  const couponApplied = Boolean(appliedCoupon);
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
    const result = evaluateCoupon({
      code: couponCode,
      cartItems: cart.items,
      cartTotal: cart.total,
      now: new Date(),
      storage: couponStorage,
      allowUsed: false,
      markUsed: true,
    });

    if (result.error) {
      setAppliedCoupon("");
      toast.error(result.error);
      return;
    }

    if (result.persistUsageKey && couponStorage) {
      couponStorage.setItem(result.persistUsageKey, "1");
    }

    setAppliedCoupon(result.appliedCode || normalizeCouponInput(couponCode));
    setCouponCode(result.appliedCode || normalizeCouponInput(couponCode));
    toast.success(result.message || "Código aplicado");
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
    modalItem: removeModalItem,
    modalIngredients: removeModalIngredients,
    modalSelectedIds: removeModalSelectedIds,
    title: removeModalTitle,
    openRemoveModal,
    toggleSelection: toggleRemoveSelection,
    applySelection: applyRemoveSelection,
    closeRemoveModal,
  } = useRemoveIngredientsModal({ cart, burgersById });

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

  const upsellMessages = React.useMemo(() => {
    if (promoState.qualifiesGift) return [];

    const msgs = [];

    if (promoState.missingForGift > 0 && cart.items.length > 0) {
      msgs.push({
        id: "gift-progress",
        text: `Te faltan ${formatMoney(promoState.missingForGift)} para llevarte papas gratis`,
      });
    }

    if (promoState.insights?.burgers === 1) {
      msgs.push({
        id: "one-burger",
        text: "Sumá otra burger y rinde más",
      });
    } else if (promoState.insights?.doubles > 0) {
      msgs.push({
        id: "triple-upgrade",
        text: "Hacela triple hoy +$1500",
      });
    } else if (cart.total < 20000 && promoState.insights?.items >= 1) {
      msgs.push({
        id: "low-ticket",
        text: "Sumá algo más y cerrá el pedido",
      });
    }

    return msgs.slice(0, 2);
  }, [cart.items.length, cart.total, promoState]);

  return (
    <Page>
      <BrandLogo />
      <CarritoHeader onClear={cart.clear} />

      <PageTitle>Carrito</PageTitle>

      {upsellMessages.length ? (
        <div className={styles.upsellCard}>
          <div className={styles.upsellTitle}>Aprovechá hoy</div>
          <div className={styles.upsellRow}>
            {upsellMessages.map((msg) => (
              <div key={msg.id} className={styles.upsellLink}>
                {msg.text}
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
                onSetRemoved={cart.setRemovedIngredients}
                onSetQty={cart.setQty}
                onRemove={handleRemove}
                onOpenExtrasModal={openExtrasModal}
                onOpenRemoveModal={openRemoveModal}
                onSetPromoPicks={cart.setPromoPicks}
                burgersById={burgersById}
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
          <DeliveryMapLink variant="compact" className={styles.deliveryLink} />
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
      <RemoveIngredientsModal
        open={!!removeModalItem}
        title={removeModalTitle}
        ingredients={removeModalIngredients}
        selectedIds={removeModalSelectedIds}
        onToggle={toggleRemoveSelection}
        onApply={applyRemoveSelection}
        onClose={closeRemoveModal}
      />
    </Page>
  );
}
