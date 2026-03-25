export const PROMO_CAMPAIGN = {
  tripleUpgrade: {
    id: "triple-upgrade-1500",
    extra: 1500,
    label: "Hoy triple por +$1500",
    appliesToTiers: ["BASICA", "PREMIUM", "DELUXE"],
  },
  thresholdGift: {
    id: "gift-papas-30k",
    cartKey: "gift:papas:30k",
    amount: 30000,
    papasItemId: "porcion_extra",
    fallbackPrice: 3000,
    label: "Papas gratis",
    description: "Regalo por superar los $30.000",
  },
};

export function isGiftItem(item) {
  return item?.meta?.promoGiftId === PROMO_CAMPAIGN.thresholdGift.id;
}

export function calcMissingAmount(total, target) {
  const missing = Math.max((target || 0) - (total || 0), 0);
  return Math.round(missing);
}
