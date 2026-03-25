// Add future burger offers here (example: size/tier/id based discounts).
// Final price can be derived from base prices when computeFinalPrice returns a number.
export const BURGER_PRICE_OFFERS = [
  {
    id: "triple-upgrade-1500",
    label: "Hoy triple por +$1500",
    sizes: ["triple"],
    tiers: ["BASICA", "PREMIUM", "DELUXE"],
    computeFinalPrice: (burger) => {
      const doublePrice = burger?.prices?.doble;
      const triplePrice = burger?.prices?.triple;
      if (typeof doublePrice !== "number" || typeof triplePrice !== "number") {
        return null;
      }
      const upgraded = doublePrice + 1500;
      return upgraded < triplePrice ? upgraded : null;
    },
  },
];

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
