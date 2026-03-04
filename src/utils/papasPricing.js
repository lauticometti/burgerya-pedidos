// Temporary promo: cheddar upgrade on fries is free for double/triple burgers.
export function isCheddarFreeForPapas(context) {
  const size = context?.size;
  return size === "doble" || size === "triple";
}

export function getPapasUpgradePrice(extra, context) {
  if (!extra) return 0;
  if (extra.id === "cheddar_liq" && isCheddarFreeForPapas(context)) {
    return 0;
  }
  return extra.price || 0;
}
