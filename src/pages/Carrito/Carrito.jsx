import React from "react";
import { useCart } from "../../store/useCart";
import { burgers, papas } from "../../data/menu";
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
import styles from "./Carrito.module.css";
import {
  CART_GROUP_ORDER,
  getUndoLabel,
  groupItemsByCategory,
} from "./carritoUtils";
import useCartUndo from "./useCartUndo";
import useCarritoModals from "./useCarritoModals";
import useBurgerCustomizeModal from "./useBurgerCustomizeModal";
import useFriesUpgradeModal from "./useFriesUpgradeModal";
import FriesUpgradeQtyModal from "../../components/carrito/FriesUpgradeQtyModal";
import { extras as extrasData } from "../../data/menu";
import useCarritoCheckoutForm from "./useCarritoCheckoutForm";
import useCheckoutValidation from "./useCheckoutValidation";
import useDeliveryQuote from "../../hooks/useDeliveryQuote";
import { computeCheckoutTotals } from "../../utils/checkoutTotals";
import useCarritoTimeSlots from "./useCarritoTimeSlots";
import useCouponCode from "./useCouponCode";
import useDbardoCodes from "./useDbardoCodes";
import { normalizeDbardoCode } from "../../utils/coupons";
import CartUpsellBanner, { shouldShowBebidaUpsell } from "./CartUpsellBanner";
import CartDipUpsellBanner from "./CartDipUpsellBanner";
import ClosedInlineNotice from "../../components/alerts/ClosedInlineNotice";
import { buildPapasMejoras } from "../../utils/papasUpgradeOptions";
import { getStoreNow, useStoreStatus } from "../../utils/storeClosedMode";
import { isCokePromoAvailable } from "../../utils/cokePromo";
import { toast } from "../../utils/toast";
import {
  REGALO_BADGE,
  REGALO_DISCOUNT_LABEL,
  getRegaloState,
  setRegaloWhen,
} from "../../utils/regaloCampaign";
import { getRegaloCartDiscount } from "../../utils/cartLineTotals";
import RegaloBanner from "../../components/promos/RegaloBanner";

// Oculta temporalmente el banner de upsell de bebida en el carrito (queda
// solo el del dip). No borra la lógica: para volver a mostrarlo, poner en true.
const SHOW_BEBIDA_UPSELL_BANNER = false;

// Resumen financiero: Subtotal, [Descuento], [Envío], Total. Solo aparece si
// hay algo entre el subtotal y el total (si no, el total del sticky alcanza).
// Todo sale de `totals` (computeCheckoutTotals): mismos numeros que el sticky,
// el pago y el WhatsApp.
function TotalsBreakdown({ totals, discountLabel, subtotalLabel = "Subtotal" }) {
  const { productsSubtotal, discountAmount, deliveryFee, grandTotal } = totals;
  if (discountAmount <= 0 && deliveryFee <= 0) return null;
  return (
    <div className={styles.totalBreakdown}>
      <div className={styles.totalBreakdownRow}>
        <span>{subtotalLabel}</span>
        <span>{formatMoney(productsSubtotal)}</span>
      </div>
      {discountAmount > 0 ? (
        <div className={styles.totalBreakdownRow}>
          <span>{discountLabel}</span>
          <span>-{formatMoney(discountAmount)}</span>
        </div>
      ) : null}
      {deliveryFee > 0 ? (
        <div className={styles.totalBreakdownRow}>
          <span>Envío</span>
          <span>{formatMoney(deliveryFee)}</span>
        </div>
      ) : null}
      <div className={`${styles.totalBreakdownRow} ${styles.totalBreakdownFinal}`}>
        <span>Total</span>
        <span>{formatMoney(grandTotal)}</span>
      </div>
    </div>
  );
}

export default function Carrito() {
  const cart = useCart();
  const { closedActionLabel, isClosed, dateKey, minutes } = useStoreStatus();

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
    setAddressLabel,
    selectedLocation,
    setSelectedLocation,
    cross,
    setCross,
    pay,
    setPay,
    payCashAmount,
    setPayCashAmount,
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
    appliedCoupon,
    totalDiscount: legacyCouponDiscount,
    totalSurcharge,
    giveawayTarget,
    freeMeatPromo,
    applyCoupon,
    revalidateCoupon,
    removeCoupon,
  } = useCouponCode(cart.items, cart.total, cart);
  const dbardo = useDbardoCodes(cart.items, cart.total);
  // Input de código compartido entre el cupón "de siempre" (uno solo por
  // pedido) y los códigos D BARDO (se acumulan varios). handleApplyCode, más
  // abajo, decide a cuál de los dos flujos mandar lo que se escribió.
  const [codeInput, setCodeInput] = React.useState("");
  const dbardoActive = dbardo.dbardoCodes.length > 0;
  const handleApplyCode = React.useCallback(() => {
    const text = codeInput.trim();
    if (!text) return;
    let applied = false;
    if (normalizeDbardoCode(text)) {
      if (appliedCoupon) {
        toast.error("Ya tenés un cupón aplicado: quitalo antes de sumar códigos D BARDO.");
      } else {
        applied = dbardo.addDbardoCode(text);
      }
    } else if (dbardoActive) {
      toast.error("Ya tenés códigos D BARDO aplicados: no se puede combinar con otro cupón.");
    } else {
      applied = applyCoupon(text);
    }
    if (applied) setCodeInput("");
  }, [codeInput, appliedCoupon, dbardoActive, dbardo, applyCoupon]);

  // Campaña regalo (hoy 30% OFF): estado segun la hora actual y el horario elegido. Se
  // recalcula en cada minuto (y al volver a la pestaña) via useStoreStatus.
  // regaloNonce: lo sube la revalidacion previa al envio para forzar el
  // recalculo con la hora de ese instante.
  const [regaloNonce, forceRegaloRefresh] = React.useReducer((n) => n + 1, 0);
  const regalo = React.useMemo(
    () => getRegaloState({ whenMode, whenSlot }),
    // dateKey/minutes/regaloNonce: re-evaluar en cada tick del reloj de la web.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [whenMode, whenSlot, dateKey, minutes, regaloNonce],
  );
  React.useEffect(() => {
    setRegaloWhen(whenMode, whenSlot);
  }, [whenMode, whenSlot]);
  // No acumulable: mientras la campaña esta activa no hay cupones.
  const couponsBlocked = regalo.campaignActive;
  React.useEffect(() => {
    if (couponsBlocked && appliedCoupon) removeCoupon();
  }, [couponsBlocked, appliedCoupon, removeCoupon]);
  React.useEffect(() => {
    if (couponsBlocked && dbardoActive) dbardo.clearDbardoCodes();
    // dbardo (el hook completo) cambia de identidad en cada render; solo nos
    // importa reaccionar cuando couponsBlocked o dbardoActive cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponsBlocked, dbardoActive]);
  const regaloDiscount = React.useMemo(
    () => (regalo.applies ? getRegaloCartDiscount(cart.items) : 0),
    [regalo.applies, cart.items],
  );

  const deliveryQuote = useDeliveryQuote(selectedLocation, deliveryMode);
  // Uno solo de los dos sistemas de cupón está activo a la vez (se bloquean
  // mutuamente en handleApplyCode), así que alcanza con elegir cuál manda.
  const totalDiscount = dbardoActive && !couponsBlocked
    ? dbardo.dbardoTotalDiscount
    : legacyCouponDiscount;
  // UNICA fuente de montos: resumen, sticky, pago, validacion y WhatsApp usan
  // este mismo objeto (grandTotal = productos - descuento + envio).
  const totals = React.useMemo(
    () =>
      computeCheckoutTotals({
        productsSubtotal: cart.total + (couponsBlocked ? 0 : totalSurcharge),
        discountAmount: regalo.applies
          ? regaloDiscount
          : couponsBlocked
            ? 0
            : totalDiscount,
        deliveryMode,
        deliveryQuote,
      }),
    [cart.total, couponsBlocked, totalSurcharge, regalo.applies, regaloDiscount, totalDiscount, deliveryMode, deliveryQuote],
  );
  const { grandTotal } = totals;
  const discountLabel = regalo.applies
    ? REGALO_DISCOUNT_LABEL
    : dbardoActive && !couponsBlocked
      ? `Descuento ${dbardo.dbardoCodes.join(", ")}`
      : giveawayTarget?.burgerName
        ? `Premio — ${giveawayTarget.burgerName}`
        : appliedCoupon
          ? `Descuento ${appliedCoupon}`
          : "Descuento";
  const subtotalLabel = regalo.applies ? "Subtotal habitual de productos" : "Subtotal";
  const giveawayTargetKeys = dbardoActive && !couponsBlocked
    ? dbardo.dbardoGiveawayTargets.map((t) => t.lineKey)
    : giveawayTarget?.lineKey
      ? [giveawayTarget.lineKey]
      : [];

  const canContinue = cart.items.length > 0;
  const couponApplied = Boolean(appliedCoupon) && !couponsBlocked;
  const { canSend, missingFields, waHref } = useCheckoutValidation({
    deliveryMode,
    name,
    address,
    cross,
    pay,
    payCashAmount,
    notes,
    whenMode,
    whenSlot,
    items: cart.items,
    totals,
    couponCode: dbardoActive && !couponsBlocked
      ? dbardo.dbardoCodes.join(", ")
      : couponApplied
        ? appliedCoupon
        : "",
    discountLabel: regalo.applies ? REGALO_DISCOUNT_LABEL : null,
    freeMeatPromo: couponsBlocked ? null : freeMeatPromo,
    deliveryQuote,
    location: selectedLocation,
    burgersById,
  });
  const sendEnabled = !isClosed && canSend;

  // Revalida la campaña con la hora de este instante, justo antes de abrir
  // WhatsApp: una pestaña abierta desde antes de las 21:00 (o con un horario
  // que ya paso) no puede mandar el descuento si ya no corresponde. Si el estado
  // cambio, se frena el envio y se re-renderiza con los montos correctos.
  const revalidateRegalo = React.useCallback(() => {
    const fresh = getRegaloState({ whenMode, whenSlot, date: getStoreNow() });
    if (fresh.applies === regalo.applies && fresh.campaignActive === regalo.campaignActive) {
      return true;
    }
    forceRegaloRefresh();
    toast.error(
      fresh.campaignActive
        ? `${fresh.message || "Cambió el descuento de tu pedido."} Revisá el total y volvé a enviarlo.`
        : `Terminó el ${REGALO_BADGE}. Actualizamos tu pedido al precio habitual: revisá el total y volvé a enviarlo.`,
      { key: "regalo-revalidate", ms: 6000 },
    );
    return false;
  }, [whenMode, whenSlot, regalo.applies, regalo.campaignActive]);

  // Coca de regalo: revalidar con la hora de este instante antes de abrir
  // WhatsApp. Si la promo ya termino (21:00) se sacan los regalos del carrito
  // (nunca se cobran) y se frena el envio para que el cliente vea el pedido.
  const revalidateCokeGift = React.useCallback(() => {
    const gifts = cart.items.filter((it) => it.meta?.isCokePromo);
    if (!gifts.length || isCokePromoAvailable(getStoreNow())) return true;
    gifts.forEach((it) => cart.remove(it.key));
    toast.error(
      "La promo de Coca de regalo terminó a las 21. Sacamos las Cocas de regalo: revisá tu pedido y volvé a enviarlo.",
      { key: "coke-gift-revalidate", ms: 6000 },
    );
    return false;
  }, [cart]);
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

  const friesUpgrade = useFriesUpgradeModal(cart);
  // Mismo nombre + talle que usa la barra de deshacer, para no reescribir el
  // armado del label (ProductName ya resuelve el nombre argentino).
  const friesUpgradeLabel = React.useMemo(
    () => getUndoLabel(friesUpgrade.item),
    [friesUpgrade.item],
  );

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

      {regalo.campaignActive ? (
        <RegaloBanner
          compact
          message={regalo.applies ? `${REGALO_BADGE} aplicado a tu pedido.` : regalo.message}
          tone={regalo.status === "ineligible" ? "warn" : "info"}
        />
      ) : null}

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
          {SHOW_BEBIDA_UPSELL_BANNER ? (
            <CartUpsellBanner
              items={cart.items}
              onAddBebida={() => bebidaModal.openBebidaModal()}
            />
          ) : null}
          <CartDipUpsellBanner
            items={cart.items}
            onAddDip={(item) => {
              cart.add(item);
              toast.added(item.name);
            }}
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
                onToggleFriesUpgrade={friesUpgrade.toggle}
                burgersById={burgersById}
                classes={groupListClasses}
                giveawayTargetKeys={giveawayTargetKeys}
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
                {(!appliedCoupon || dbardoActive) && !couponsBlocked ? (
                  <>
                    <input
                      className={styles.couponInput}
                      type="text"
                      placeholder="Código de descuento"
                      value={codeInput}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      onChange={(e) => {
                        setCodeInput(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCode();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className={styles.couponApply}
                      onClick={handleApplyCode}>
                      Aplicar
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {dbardoActive && !couponsBlocked ? (
            <>
              {dbardo.dbardoEntries.map((entry) => (
                <div key={entry.code} className={styles.couponAppliedBlock}>
                  <div className={styles.couponAppliedHeader}>
                    {entry.tier === "burger" ? "✓ PREMIO D BARDO" : "✓ DESCUENTO D BARDO"}
                  </div>
                  <div className={styles.couponAppliedCode}>{entry.code}</div>
                  <div className={styles.couponAppliedBenefit}>
                    {entry.tier === "burger"
                      ? `${entry.targetBurgerName} doble gratis`
                      : `${entry.tier}% off`}
                  </div>
                  <div className={styles.couponAppliedDiscount}>
                    Descuento: -{formatMoney(entry.discount)}
                  </div>
                  <button
                    type="button"
                    className={styles.couponAppliedRemove}
                    onClick={() => dbardo.removeDbardoCode(entry.code)}>
                    Quitar código
                  </button>
                </div>
              ))}
              {dbardo.dbardoCapped ? (
                <div className={styles.couponStatusLine}>
                  Llegaste al tope de $30.000 de descuento por pedido.
                </div>
              ) : null}
            </>
          ) : null}

          {couponApplied && giveawayTarget ? (
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

          {freeMeatPromo && !couponsBlocked ? (
            <div className={styles.couponAppliedBlock}>
              <div className={styles.couponAppliedHeader}>
                {freeMeatPromo.message}
              </div>
              {/* Doble que venía con precio promo: solo el mensaje, sin detalle. */}
              {!freeMeatPromo.surcharge ? (
                <>
                  <div className={styles.couponAppliedCode}>{freeMeatPromo.code}</div>
                  <div className={styles.couponAppliedBenefit}>
                    {freeMeatPromo.burgerName} doble → triple
                  </div>
                  <div className={styles.couponAppliedDiscount}>
                    +1 carne: {formatMoney(0)}
                  </div>
                </>
              ) : null}
              <button
                type="button"
                className={styles.couponAppliedRemove}
                onClick={removeCoupon}>
                Quitar código
              </button>
            </div>
          ) : null}

          <TotalsBreakdown totals={totals} discountLabel={discountLabel} subtotalLabel={subtotalLabel} />

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
            onAddressLabel={setAddressLabel}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            onCrossChange={setCross}
            deliveryQuote={deliveryQuote}
          />

          <TotalsBreakdown totals={totals} discountLabel={discountLabel} subtotalLabel={subtotalLabel} />

          <PaymentScheduleCard
            pay={pay}
            payCashAmount={payCashAmount}
            total={grandTotal}
            whenMode={whenMode}
            whenSlot={whenSlot}
            availableSlots={slotOptions}
            notes={notes}
            onPayChange={setPay}
            onPayCashAmountChange={setPayCashAmount}
            onWhenModeChange={setWhenMode}
            onWhenSlotChange={setWhenSlot}
            onNotesChange={setNotes}
          />
          {regalo.campaignActive && !regalo.applies && regalo.message ? (
            <div
              className={`${styles.regaloScheduleNotice}${regalo.status === "ineligible" ? ` ${styles.regaloScheduleNoticeWarn}` : ""}`}
              role="status">
              {regalo.message}
            </div>
          ) : null}
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
        <CartSummary total={grandTotal} label="Total" />
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
              <div className={styles.stickyHint}>Envía tu pedido desde las 19:30</div>
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
                // Campaña regalo: revalidar hora y horario en este instante.
                if (!revalidateRegalo()) {
                  event.preventDefault();
                  return;
                }
                // Coca de regalo vencida: no se envía el regalo.
                if (!revalidateCokeGift()) {
                  event.preventDefault();
                  return;
                }
                // Cupón vencido con el carrito abierto: no se envía la promo.
                if (!couponsBlocked && !revalidateCoupon()) {
                  event.preventDefault();
                  return;
                }
                // Códigos D BARDO: alguno pudo vencer o quedarse sin burger
                // doble para regalar mientras el carrito estaba abierto.
                if (!couponsBlocked && !dbardo.revalidateDbardoCodes()) {
                  event.preventDefault();
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
        quantityCaps={extrasModal.quantityCaps}
        onAdjustQuantity={extrasModal.adjustQuantity}
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

      <FriesUpgradeQtyModal
        open={friesUpgrade.open}
        mode={friesUpgrade.mode}
        name={friesUpgradeLabel.name}
        nameSuffix={friesUpgradeLabel.suffix}
        count={friesUpgrade.count}
        maxCount={friesUpgrade.maxCount}
        onChangeCount={friesUpgrade.changeCount}
        onConfirm={friesUpgrade.confirm}
        onClose={friesUpgrade.close}
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
        quantityCaps={burgerCustomize.quantityCaps}
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
