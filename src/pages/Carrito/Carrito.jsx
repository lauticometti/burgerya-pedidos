import React from "react";
import { useCart } from "../../store/useCart";
import { burgers, papas } from "../../data/menu";
import ItemExtrasModal from "../../components/ItemExtrasModal";
import { formatMoney } from "../../utils/formatMoney";
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
import useCarritoModals from "./useCarritoModals";
import useCarritoCheckoutForm from "./useCarritoCheckoutForm";
import useCheckoutValidation from "./useCheckoutValidation";
import useCarritoTimeSlots from "./useCarritoTimeSlots";
import useCouponCode from "./useCouponCode";
import ClosedInlineNotice from "../../components/alerts/ClosedInlineNotice";
import { useStoreStatus } from "../../utils/storeClosedMode";

export default function Carrito() {
  const cart = useCart();
  const { closedActionLabel, closedToastText, isClosed, reopenText } =
    useStoreStatus();

  React.useEffect(() => {
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      metaRobots.setAttribute("content", "noindex, follow");
    }
    return () => {
      if (metaRobots) {
        metaRobots.setAttribute("content", "index, follow");
      }
    };
  }, []);

  const [step, setStep] = React.useState(1); // 1: Chequear pedido, 2: Datos y pago
  const burgersById = React.useMemo(
    () =>
      burgers.reduce((acc, burger) => {
        acc[burger.id] = burger;
        return acc;
      }, {}),
    [],
  );
  const promoState = React.useMemo(
    () => ({
      qualifiesGift: false,
      missingForGift: 0,
      insights: {},
    }),
    [],
  );
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

  const { slotOptions } = useCarritoTimeSlots(whenMode, whenSlot, setWhenSlot);
  const { couponCode, setCouponCode, appliedCoupon, totalDiscount, applyCoupon, removeCoupon, cheddarBenefitApplied } =
    useCouponCode(cart.items, cart.total, cart);

  const totalWithDiscount = Math.max(0, cart.total - totalDiscount);

  const canContinue = !isClosed && cart.items.length > 0;
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
  const sendEnabled = !isClosed && canSend;
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
  const { extrasModal, removeModal, bebidaModal } = useCarritoModals(
    cart,
    burgersById,
    papasMejoras,
  );

  const groupedItems = React.useMemo(() => {
    return groupItemsByCategory(cart.items);
  }, [cart.items]);

  const groupListClasses = {
    group: styles.group,
    groupTitle: styles.groupTitle,
    groupItems: styles.groupItems,
    undoBar: styles.undoBar,
    undoText: styles.undoText,
    undoButton: styles.undoButton,
  };

  const upsellMessages = React.useMemo(() => {
    if (promoState.qualifiesGift || cart.items.length === 0) return [];
    return [];
  }, [cart.items.length, promoState.missingForGift, promoState.qualifiesGift]);

  return (
    <Page>
      <BrandLogo />
      <CarritoHeader onClear={cart.clear} />

      <PageTitle>Carrito</PageTitle>
      <ClosedInlineNotice />

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
                onOpenExtrasModal={extrasModal.openExtrasModal}
                onOpenRemoveModal={removeModal.openRemoveModal}
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
                  disabled={isClosed}
                  onClick={() => {
                    if (isClosed) {
                      toast.error(closedToastText, {
                        key: "store-closed-bebidas",
                      });
                      return;
                    }
                    bebidaModal.openBebidaModal();
                  }}>
                  Agregar bebidas
                </Button>
              </div>
              <div className={styles.addRight}>
                <input
                  className={styles.couponInput}
                  type="text"
                  placeholder="Código de descuento"
                  value={couponCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCouponCode(val);
                    if (!val.trim() && cheddarBenefitApplied) {
                      removeCoupon();
                    }
                  }}
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
          {cheddarBenefitApplied && (
            <div className={styles.couponStatusLine}>
              Código aplicado
              <button
                type="button"
                className={styles.couponStatusRemove}
                onClick={removeCoupon}>
                Quitar
              </button>
            </div>
          )}
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
              {isClosed ? closedActionLabel : "Continuar"}
            </Button>
            {!canContinue ? (
              <div className={styles.stickyHint}>
                {isClosed ? reopenText : "Agrega items para continuar."}
              </div>
            ) : null}
          </div>
        ) : (
          <div className={styles.stickyRight}>
            <a
              href={sendEnabled ? waHref : "#"}
              target="_blank"
              rel="noreferrer">
              <Button variant="primary" disabled={!sendEnabled}>
                {isClosed ? closedActionLabel : "Enviar por WhatsApp"}
              </Button>
            </a>
            {isClosed ? (
              <div className={styles.stickyHint}>{reopenText}</div>
            ) : null}
          </div>
        )}
      </StickyBar>

      <ItemExtrasModal
        open={!!extrasModal.modalItem}
        title={extrasModal.title}
        description={extrasModal.description}
        items={extrasModal.modalItems}
        selectedIds={extrasModal.modalSelectedIds}
        onToggle={extrasModal.toggleModalSelection}
        onClose={extrasModal.closeExtrasModal}
        onApply={extrasModal.applyModalSelection}
        disableApply={extrasModal.disableApply}
        applyLabel={extrasModal.applyLabel}
        onClear={extrasModal.clearHandler}
        clearLabel={extrasModal.clearLabel}
      />
      <BebidasModal
        open={bebidaModal.bebidaOpen}
        items={bebidaModal.bebidaItems}
        quantities={bebidaModal.bebidaQuantities}
        onChangeQty={bebidaModal.adjustBebidaQty}
        onClose={bebidaModal.closeBebidaModal}
        onApply={bebidaModal.applyBebidaSelection}
      />
      <RemoveIngredientsModal
        open={!!removeModal.modalItem}
        title={removeModal.title}
        ingredients={removeModal.modalIngredients}
        selectedIds={removeModal.modalSelectedIds}
        onToggle={removeModal.toggleSelection}
        onApply={removeModal.applySelection}
        onClear={removeModal.clearSelection}
        onClose={removeModal.closeRemoveModal}
      />
    </Page>
  );
}
