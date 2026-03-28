export function buildBurgerLineKey({
  kind = "burger",
  burgerId,
  size,
  comboId,
  removedIds = [],
  extrasIds = [],
  papasIds = [],
}) {
  const cleanRemoved = (removedIds || []).filter(Boolean);
  const cleanExtras = (extrasIds || []).filter(Boolean);
  const cleanPapas = (papasIds || []).filter(Boolean);
  const removalSuffix = cleanRemoved.length
    ? `rm:${cleanRemoved.slice().sort().join("-")}`
    : "";
  const extrasSuffix = cleanExtras.length
    ? `ex:${cleanExtras.slice().sort().join("-")}`
    : "";
  const papasSuffix = cleanPapas.length
    ? `pp:${cleanPapas.slice().sort().join("-")}`
    : "";

  if (kind === "combo") {
    const parts = ["combo", comboId || "combo", burgerId || "burger"];
    if (removalSuffix) parts.push(removalSuffix);
    return parts.join(":");
  }

  const parts = ["burger", burgerId || "burger", size || "simple"];
  if (removalSuffix) parts.push(removalSuffix);
  if (extrasSuffix) parts.push(extrasSuffix);
  if (papasSuffix) parts.push(papasSuffix);
  return parts.join(":");
}
