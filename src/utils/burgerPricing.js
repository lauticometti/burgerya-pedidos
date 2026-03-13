// Add future burger offers here (example: size/tier/id based discounts).
export const BURGER_PRICE_OFFERS = [];

function matchesOffer(offer, burger, size) {
  if (Array.isArray(offer?.sizes) && !offer.sizes.includes(size)) return false;
  if (Array.isArray(offer?.tiers) && !offer.tiers.includes(burger?.tier)) {
    return false;
  }
  if (Array.isArray(offer?.burgerIds) && !offer.burgerIds.includes(burger?.id)) {
    return false;
  }
  return true;
}

function getActiveOffer(burger, size) {
  return BURGER_PRICE_OFFERS.find((offer) => matchesOffer(offer, burger, size)) || null;
}

export function getBurgerPriceInfo(burger, size) {
  const basePrice = burger?.prices?.[size];
  if (typeof basePrice !== "number") {
    return {
      basePrice: 0,
      finalPrice: 0,
      discountAmount: 0,
      hasDiscount: false,
      offerId: null,
      offerLabel: null,
    };
  }

  const activeOffer = getActiveOffer(burger, size);
  const discountAmount = Math.max(activeOffer?.discountAmount || 0, 0);
  const hasDiscount = discountAmount > 0;
  const finalPrice = Math.max(basePrice - discountAmount, 0);

  return {
    basePrice,
    finalPrice,
    discountAmount,
    hasDiscount,
    offerId: activeOffer?.id || null,
    offerLabel: activeOffer?.label || null,
  };
}

export function getBurgerPrice(burger, size) {
  return getBurgerPriceInfo(burger, size).finalPrice;
}
