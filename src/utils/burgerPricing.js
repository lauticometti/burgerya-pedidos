const DISCOUNT_TIERS = new Set(["BASICA", "PREMIUM"]);

export const BURGER_TRIPLE_DISCOUNT = 1500;

export function isTripleDiscountEligible(burger) {
  return DISCOUNT_TIERS.has(burger?.tier);
}

export function getBurgerPriceInfo(burger, size) {
  const basePrice = burger?.prices?.[size];
  if (typeof basePrice !== "number") {
    return {
      basePrice: 0,
      finalPrice: 0,
      discountAmount: 0,
      hasDiscount: false,
    };
  }

  const hasDiscount = size === "triple" && isTripleDiscountEligible(burger);
  const discountAmount = hasDiscount ? BURGER_TRIPLE_DISCOUNT : 0;
  const finalPrice = Math.max(basePrice - discountAmount, 0);

  return {
    basePrice,
    finalPrice,
    discountAmount,
    hasDiscount,
  };
}

export function getBurgerPrice(burger, size) {
  return getBurgerPriceInfo(burger, size).finalPrice;
}
