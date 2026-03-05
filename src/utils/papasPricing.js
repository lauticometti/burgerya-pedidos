// Keep cheddar pricing paid (no automatic freebies).
export function isCheddarFreeForPapas() {
  return false;
}

export function getPapasUpgradePrice(extra, context) {
  if (!extra) return 0;
  return extra.price || 0;
}
