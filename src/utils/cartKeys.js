export function normalizeNote(note) {
  return String(note ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function dedupeSorted(ids = []) {
  return Array.from(new Set((ids || []).filter(Boolean))).sort();
}

export function buildBurgerLineKey({
  kind = "burger",
  burgerId,
  size,
  comboId,
  removedIds = [],
  extrasIds = [],
  papasIds = [],
  note = "",
}) {
  const sortedRemoved = dedupeSorted(removedIds);
  const sortedExtras = dedupeSorted(extrasIds);
  const sortedPapas = dedupeSorted(papasIds);
  const normalizedNote = normalizeNote(note);

  if (kind === "combo") {
    return [
      `combo:${comboId || "combo"}`,
      `burger:${burgerId || "burger"}`,
      `removed:${sortedRemoved.join(",")}`,
      `note:${encodeURIComponent(normalizedNote)}`,
    ].join("|");
  }

  return [
    `burger:${burgerId || "burger"}`,
    `size:${size || "simple"}`,
    `extras:${sortedExtras.join(",")}`,
    `removed:${sortedRemoved.join(",")}`,
    `papas:${sortedPapas.join(",")}`,
    `note:${encodeURIComponent(normalizedNote)}`,
  ].join("|");
}
