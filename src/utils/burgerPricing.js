// No active offers.
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
  let best = null;
  const basePrice = burger?.prices?.[size];

  for (const offer of BURGER_PRICE_OFFERS) {
    if (!matchesOffer(offer, burger, size)) continue;
    const finalFromOffer =
      typeof offer?.computeFinalPrice === "function"
        ? offer.computeFinalPrice(burger, size)
        : offer?.finalPrice;
    const discountAmount =
      typeof offer?.discountAmount === "function"
        ? offer.discountAmount(burger, size)
        : offer?.discountAmount;

    const candidateFinal =
      typeof finalFromOffer === "number" && finalFromOffer >= 0
        ? finalFromOffer
        : typeof discountAmount === "number"
          ? Math.max((basePrice || 0) - discountAmount, 0)
          : null;

    if (candidateFinal == null || basePrice == null) continue;
    if (candidateFinal >= basePrice) continue;

    const currentBestFinal = best?.finalPrice ?? Number.POSITIVE_INFINITY;
    if (candidateFinal < currentBestFinal) {
      best = { ...offer, finalPrice: candidateFinal };
    }
  }

  return best;
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
  const finalPrice =
    typeof activeOffer?.finalPrice === "number"
      ? activeOffer.finalPrice
      : Math.max(basePrice - Math.max(activeOffer?.discountAmount || 0, 0), 0);
  const discountAmount = Math.max(basePrice - finalPrice, 0);
  const hasDiscount = discountAmount > 0;

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
