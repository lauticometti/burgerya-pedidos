import React from "react";
import { toast } from "../../utils/toast";
import {
  couponStorage,
  evaluateCoupon,
  normalizeCouponInput,
} from "../../utils/coupons";

function cartHasBenefit(cartItems = []) {
  return cartItems.some((it) =>
    (it.papas || []).some((p) => p.benefitJuernes16),
  );
}

export default function useCouponCode(cartItems, cartTotal, cartApi) {
  const [couponCode, setCouponCode] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState("");
  const [cheddarBenefitApplied, setCheddarBenefitApplied] = React.useState(false);

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

  React.useEffect(() => {
    if (!appliedCoupon) return;
    if (discountResult?.error && discountResult.error.trim()) {
      setAppliedCoupon("");
      toast.error(discountResult.error);
    }
  }, [appliedCoupon, discountResult?.error]);

  // Si el beneficio ya no está en el carrito (usuario removió la burger, etc.), resetear
  React.useEffect(() => {
    if (!cheddarBenefitApplied) return;
    if (!cartHasBenefit(cartItems)) {
      setCheddarBenefitApplied(false);
      setAppliedCoupon("");
    }
  }, [cartItems, cheddarBenefitApplied]);

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
      setCheddarBenefitApplied(false);
      toast.error(result.error);
      return;
    }

    if (result.persistUsageKey && couponStorage) {
      couponStorage.setItem(result.persistUsageKey, "1");
    }

    if (result.isHiddenBenefit) {
      if (cheddarBenefitApplied) return;
      if (cartApi?.applyCheddarBenefit) {
        cartApi.applyCheddarBenefit();
      }
      setAppliedCoupon(result.appliedCode);
      setCouponCode(result.appliedCode);
      setCheddarBenefitApplied(true);
      return;
    }

    setAppliedCoupon(result.appliedCode || normalizeCouponInput(couponCode));
    setCouponCode(result.appliedCode || normalizeCouponInput(couponCode));

    if (result.message) {
      toast.success(result.message);
    }
  }, [couponCode, cartItems, cartTotal, cartApi, cheddarBenefitApplied]);

  const removeCoupon = React.useCallback(() => {
    if (cheddarBenefitApplied && cartApi?.removeCheddarBenefit) {
      cartApi.removeCheddarBenefit();
    }
    setCheddarBenefitApplied(false);
    setAppliedCoupon("");
    setCouponCode("");
  }, [cheddarBenefitApplied, cartApi]);

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    totalDiscount,
    applyCoupon,
    removeCoupon,
    cheddarBenefitApplied,
    setCheddarBenefitApplied,
  };
}
