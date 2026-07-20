import React from "react";
import { useCart } from "../../store/useCart";
import { burgers, papas, DELIVERY_ENABLED } from "../../data/menu";
import ModifyIngredientsModal from "../../components/carrito/ModifyIngredientsModal";
import ModifyScopeDialog from "../../components/carrito/ModifyScopeDialog";
import PromoPickModifiersModal from "../../components/carrito/PromoPickModifiersModal";
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
import useBurgerCustomizeModal from "./useBurgerCustomizeModal";
import { extras as extrasData } from "../../data/menu";
import useCarritoCheckoutForm from "./useCarritoCheckoutForm";
import useCheckoutValidation from "./useCheckoutValidation";
import useCarritoTimeSlots from "./useCarritoTimeSlots";
import useCouponCode from "./useCouponCode";
import CartUpsellBanner, { shouldShowBebidaUpsell } from "./CartUpsellBanner";
import ClosedInlineNotice from "../../components/alerts/ClosedInlineNotice";
import { buildPapasMejoras } from "../../utils/papasUpgradeOptions";
import { useStoreStatus } from "../../utils/storeClosedMode";

export default function Carrito() {
  const cart = useCart();
  const { closedActionLabel, isClosed } = useStoreStatus();

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
  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    totalDiscount,
    giveawayTarget,
    applyCoupon,
    removeCoupon,
  } = useCouponCode(cart.items, cart.total, cart);

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

  const papasMejoras = React.useMemo(
    () => buildPapasMejoras(papas),
    [],
  );
  const { extrasModal, removeModal, bebidaModal } = useCarritoModals(
    cart,
    burgersById,
    papasMejoras,
  );

  const burgerCustomize = useBurgerCustomizeModal({
    cart,
    burgersById,
    extraItems: extrasData,
  });

  const [modifyOpen, setModifyOpen] = React.useState(false);
  const openModifyModal = React.useCallback((item, mode, pickIndex = null) => {
    if (pickIndex == null && item.meta?.type === "burger") {
      burgerCustomize.openCustomize(item);
      return;
    }
    extrasModal.openExtrasModal(item, mode ?? "extras", pickIndex);
    removeModal.openRemoveModal(item, pickIndex);
    setModifyOpen(true);
  }, [extrasModal, removeModal, burgerCustomize]);
  const closeModifyModal = React.useCallback(() => {
    setModifyOpen(false);
    extrasModal.closeExtrasModal();
    removeModal.closeRemoveModal();
  }, [extrasModal, removeModal]);

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
        <Button
          size="sm"
          isActive={step === 1}
          onClick={() => setStep(1)}
          className={`${styles.stepButton}${step === 1 ? ` ${styles.stepButtonActive}` : ""}`}>
          1. Chequear pedido
        </Button>
        <Button
          size="sm"
          isActive={step === 2}
          onClick={() => setStep(2)}
          disabled={!canContinue}
          className={`${styles.stepButton}${step === 2 ? ` ${styles.stepButtonActive}` : ""}`}>
          2. Datos de entrega y pago
        </Button>
      </div>

      {step === 1 ? (
        <>
          <CartUpsellBanner
            items={cart.items}
            onAddBebida={() => bebidaModal.openBebidaModal()}
          />
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
                onOpenModifyModal={openModifyModal}
                onSetPromoPicks={cart.setPromoPicks}
                burgersById={burgersById}
                classes={groupListClasses}
                giveawayTargetKey={giveawayTarget?.lineKey || null}
              />
            )}
          </div>
          {cart.items.length > 0 ? (
            <div className={styles.addRow}>
              <div className={styles.addLeft}>
                {!shouldShowBebidaUpsell(cart.items) ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className={styles.drinkCta}
                    onClick={() => bebidaModal.openBebidaModal()}>
                    Agregar bebidas
                  </Button>
                ) : null}
              </div>
              <div className={styles.addRight}>
                {!appliedCoupon ? (
                  <>
                    <input
                      className={styles.couponInput}
                      type="text"
                      placeholder="Código de descuento"
                      value={couponCode}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
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
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {appliedCoupon && giveawayTarget ? (
            <div className={styles.couponAppliedBlock}>
              <div className={styles.couponAppliedHeader}>✓ PREMIO APLICADO</div>
              <div className={styles.couponAppliedCode}>{appliedCoupon}</div>
              <div className={styles.couponAppliedBenefit}>
                {giveawayTarget.benefitLabel}
              </div>
              <div className={styles.couponAppliedDiscount}>
                Descuento: -{formatMoney(totalDiscount)}
              </div>
              <button
                type="button"
                className={styles.couponAppliedRemove}
                onClick={removeCoupon}>
                Quitar código
              </button>
            </div>
          ) : null}

          {totalDiscount > 0 ? (
            <div className={styles.totalBreakdown}>
              <div className={styles.totalBreakdownRow}>
                <span>Subtotal</span>
                <span>{formatMoney(cart.total)}</span>
              </div>
              <div className={styles.totalBreakdownRow}>
                <span>
                  {giveawayTarget?.burgerName
                    ? `Premio — ${giveawayTarget.burgerName}`
                    : "Descuento"}
                </span>
                <span>-{formatMoney(totalDiscount)}</span>
              </div>
              <div className={`${styles.totalBreakdownRow} ${styles.totalBreakdownFinal}`}>
                <span>Total</span>
                <span>{formatMoney(totalWithDiscount)}</span>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {DELIVERY_ENABLED ? (
            <DeliveryMapLink variant="compact" className={styles.deliveryLink} />
          ) : null}
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
              <div className={styles.stickyHint}>Agrega items para continuar.</div>
            ) : null}
          </div>
        ) : (
          <div className={styles.stickyRight}>
            {isClosed ? (
              <div className={styles.stickyHint}>Podés dejar tu pedido listo</div>
            ) : null}
            <a
              href={sendEnabled ? waHref : "#"}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                // Guard funcional: el local cerrado nunca debe poder enviar
                // el pedido por WhatsApp, sin importar el estado visual del botón.
                if (isClosed || !sendEnabled) {
                  event.preventDefault();
                  return;
                }
              }}>
              <Button variant="primary" disabled={!sendEnabled}>
                {isClosed ? closedActionLabel : "Enviar por WhatsApp"}
              </Button>
            </a>
          </div>
        )}
      </StickyBar>

      <PromoPickModifiersModal
        open={modifyOpen}
        title="Modificar ingredientes"
        extras={extrasModal.modalItems || []}
        selectedExtraIds={extrasModal.modalSelectedIds}
        onToggleExtra={extrasModal.toggleModalSelection}
        onApplyExtras={() => { extrasModal.applyModalSelection(); closeModifyModal(); }}
        onClearExtras={extrasModal.clearHandler}
        disableApplyExtras={extrasModal.disableApply}
        removableIngredients={removeModal.modalIngredients}
        removedIds={removeModal.modalSelectedIds}
        onToggleRemove={removeModal.toggleSelection}
        onApplyRemove={() => { removeModal.applySelection(); closeModifyModal(); }}
        onClearRemove={removeModal.clearSelection}
        onClose={closeModifyModal}
      />

      <ModifyScopeDialog
        open={burgerCustomize.scopeChoiceOpen}
        label={burgerCustomize.scopeChoiceLabel}
        onChooseOne={() => burgerCustomize.chooseScope("one")}
        onChooseAll={() => burgerCustomize.chooseScope("all")}
        onClose={burgerCustomize.cancelScopeChoice}
      />

      <ModifyIngredientsModal
        open={burgerCustomize.modalOpen}
        title="Personalizar burger"
        extras={burgerCustomize.extras}
        removableIngredients={burgerCustomize.removableIngredients}
        initialExtraIds={(burgerCustomize.modalItem?.extras || []).map((e) => e.id)}
        initialRemovedIds={(burgerCustomize.modalItem?.removedIngredients || []).map((i) => i.id)}
        initialNote={burgerCustomize.modalItem?.note || ""}
        onApply={burgerCustomize.applyChanges}
        onClose={burgerCustomize.closeModal}
      />
      <BebidasModal
        open={bebidaModal.bebidaOpen}
        items={bebidaModal.bebidaItems}
        quantities={bebidaModal.bebidaQuantities}
        onChangeQty={bebidaModal.adjustBebidaQty}
        onClose={bebidaModal.closeBebidaModal}
        onApply={bebidaModal.applyBebidaSelection}
      />
    </Page>
  );
}
