import React from "react";
import { toast } from "../../utils/toast";
import {
  couponStorage,
  evaluateCoupon,
  normalizeCouponInput,
  getGiveawayBenefitLabel,
} from "../../utils/coupons";

export default function useCouponCode(cartItems, cartTotal) {
  const [couponCode, setCouponCode] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState("");

  const discountResult = React.useMemo(() => {
    if (!appliedCoupon) return { discount: 0 };
    return evaluateCoupon({
      code: appliedCoupon,
      cartItems,
      cartTotal,
      now: new Date(),
      storage: couponStorage,
      allowUsed: true,
      markUsed: false,
    });
  }, [appliedCoupon, cartItems, cartTotal]);

  const totalDiscount = discountResult?.discount || 0;
  // Recargo del cupón (ej. la doble que pasa a triple vuelve a precio normal).
  const totalSurcharge = discountResult?.surcharge || 0;
  const giveawayTarget = appliedCoupon && discountResult?.targetLineKey
    ? {
        lineKey: discountResult.targetLineKey,
        burgerId: discountResult.targetBurgerId,
        burgerName: discountResult.targetBurgerName,
        size: discountResult.targetSize,
        baseSize: discountResult.giveawayBaseSize,
        benefitLabel: getGiveawayBenefitLabel({
          targetBurgerName: discountResult.targetBurgerName,
          targetSize: discountResult.targetSize,
        }),
      }
    : null;
  const freeMeatPromo = React.useMemo(
    () =>
      appliedCoupon && discountResult?.freeMeat
        ? { ...discountResult.freeMeat, code: appliedCoupon }
        : null,
    [appliedCoupon, discountResult],
  );

  React.useEffect(() => {
    if (!appliedCoupon) return;
    if (discountResult?.error && discountResult.error.trim()) {
      setAppliedCoupon("");
      toast.error(discountResult.error);
    }
  }, [appliedCoupon, discountResult?.error]);

  const applyCoupon = React.useCallback(() => {
    const result = evaluateCoupon({
      code: couponCode,
      cartItems,
      cartTotal,
      now: new Date(),
      storage: couponStorage,
      allowUsed: false,
      markUsed: true,
    });

    if (result.silent) {
      return;
    }

    if (result.error && result.error.trim()) {
      setAppliedCoupon("");
      toast.error(result.error);
      return;
    }

    if (result.persistUsageKey && couponStorage) {
      couponStorage.setItem(result.persistUsageKey, "1");
    }

    setAppliedCoupon(result.appliedCode || normalizeCouponInput(couponCode));
    setCouponCode(result.appliedCode || normalizeCouponInput(couponCode));

    if (result.message) {
      toast.success(result.message);
    }
  }, [couponCode, cartItems, cartTotal]);

  // Revalida el cupón aplicado con la hora actual, justo antes de enviar. El
  // memo de arriba solo recalcula cuando cambia el carrito: si el cupón venció
  // con el carrito abierto, se quita y se avisa para que el cliente vea el
  // total/mensaje actualizado antes de volver a enviar.
  const revalidateCoupon = React.useCallback(() => {
    if (!appliedCoupon) return true;
    const result = evaluateCoupon({
      code: appliedCoupon,
      cartItems,
      cartTotal,
      now: new Date(),
      storage: couponStorage,
      allowUsed: true,
      markUsed: false,
    });
    if (!result.error?.trim()) return true;
    setAppliedCoupon("");
    setCouponCode("");
    toast.error(`${result.error}. Revisá tu pedido y volvé a enviarlo.`);
    return false;
  }, [appliedCoupon, cartItems, cartTotal]);

  const removeCoupon = React.useCallback(() => {
    setAppliedCoupon("");
    setCouponCode("");
  }, []);

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    totalDiscount,
    totalSurcharge,
    giveawayTarget,
    freeMeatPromo,
    applyCoupon,
    revalidateCoupon,
    removeCoupon,
  };
}
