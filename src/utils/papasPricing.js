export function getPapasUpgradePrice(extra) {
  if (!extra) return 0;
  return extra.price || 0;
}
