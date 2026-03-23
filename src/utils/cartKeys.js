export function buildBurgerLineKey({
  kind = "burger",
  burgerId,
  size,
  comboId,
  removedIds = [],
}) {
  const cleanRemoved = (removedIds || []).filter(Boolean);
  const removalSuffix = cleanRemoved.length
    ? `rm:${cleanRemoved.slice().sort().join("-")}`
    : "";

  if (kind === "combo") {
    const parts = ["combo", comboId || "combo", burgerId || "burger"];
    if (removalSuffix) parts.push(removalSuffix);
    return parts.join(":");
  }

  const parts = ["burger", burgerId || "burger", size || "simple"];
  if (removalSuffix) parts.push(removalSuffix);
  return parts.join(":");
}
