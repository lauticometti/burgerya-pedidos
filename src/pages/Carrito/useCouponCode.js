import React from "react";
import { toast } from "../../utils/toast";
import {
  couponStorage,
  evaluateCoupon,
  normalizeCouponInput,
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

  // Show error if applied coupon becomes invalid
  React.useEffect(() => {
    if (!appliedCoupon) return;
    if (discountResult?.error) {
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
  }, [couponCode, cartItems, cartTotal]);

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    totalDiscount,
    applyCoupon,
  };
}
