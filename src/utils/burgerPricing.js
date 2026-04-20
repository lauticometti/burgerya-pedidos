import {
  FRIDAY_TRIPLE_PROMO_BADGE_TEXT,
  FRIDAY_TRIPLE_PROMO_DATE_KEY,
  FRIDAY_TRIPLE_PROMO_OFFER_ID,
  getStoreStatus,
} from "./storeClosedMode";

// Configurable manual offers remain empty unless explicitly activated.
export const BURGER_PRICE_OFFERS = [];

function getAutomaticOffer(burger, size, date = new Date()) {
  const status = getStoreStatus(date);
  const doublePrice = burger?.prices?.doble;
  const triplePrice = burger?.prices?.triple;

  if (!status.isTriplePromoPricingActive) return null;
  if (size !== "triple") return null;
  if (typeof doublePrice !== "number" || typeof triplePrice !== "number") {
    return null;
  }
  if (doublePrice >= triplePrice) return null;

  return {
    id: FRIDAY_TRIPLE_PROMO_OFFER_ID,
    finalPrice: doublePrice,
    label:
      status.dateKey === FRIDAY_TRIPLE_PROMO_DATE_KEY
        ? "Hoy conviene este"
        : "Promo viernes",
    badgeText: FRIDAY_TRIPLE_PROMO_BADGE_TEXT,
  };
}

export function isTriplePromoEligibleBurger(burger) {
  return (
    typeof burger?.prices?.doble === "number" &&
    typeof burger?.prices?.triple === "number"
  );
}

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

function getActiveOffer(burger, size, date = new Date()) {
  let best = null;
  const basePrice = burger?.prices?.[size];
  const offers = [getAutomaticOffer(burger, size, date), ...BURGER_PRICE_OFFERS].filter(
    Boolean,
  );

  for (const offer of offers) {
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

export function getBurgerPriceInfo(burger, size, date = new Date()) {
  const basePrice = burger?.prices?.[size];
  if (typeof basePrice !== "number") {
    return {
      basePrice: 0,
      finalPrice: 0,
      discountAmount: 0,
      hasDiscount: false,
      offerId: null,
      offerLabel: null,
      offerBadgeText: null,
    };
  }

  const activeOffer = getActiveOffer(burger, size, date);
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
    offerBadgeText: activeOffer?.badgeText || null,
  };
}

export function getBurgerPrice(burger, size, date = new Date()) {
  return getBurgerPriceInfo(burger, size, date).finalPrice;
}
