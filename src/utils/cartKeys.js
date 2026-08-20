export function normalizeNote(note) {
  return String(note ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function dedupeSorted(ids = []) {
  return Array.from(new Set((ids || []).filter(Boolean))).sort();
}

function toIds(list = []) {
  return (list || []).map((entry) => entry?.id).filter(Boolean);
}

/**
 * Fingerprint de una variante de burger: dos lineas del carrito con la misma
 * clave SON la misma variante y por lo tanto se mergean; si difieren en algo,
 * se splitean.
 *
 * Entra todo lo que diferencia operativamente una unidad de otra:
 * producto, talle, agregados de la burger, ingredientes quitados, mejora de
 * las papas incluidas (papasIds) y aclaracion.
 */
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

/**
 * Arma el draft de una variante de burger a partir del item base y de las
 * cuatro dimensiones que la definen. Devuelve la clave nueva y el item ya
 * consistente (arrays + meta apuntando a lo mismo).
 *
 * Es el unico lugar donde se derivan clave y meta de una variante: lo usan
 * tanto "Personalizar burger" como "Mejorar papas", asi ninguna de las dos
 * puede quedar con una clave que no represente su contenido real.
 */
export function buildBurgerVariantDraft(
  item,
  { extras = [], removedIngredients = [], papas = [], note = "" } = {},
) {
  const extrasIds = toIds(extras);
  const removedIds = toIds(removedIngredients);
  const papasIds = toIds(papas);

  return {
    key: buildBurgerLineKey({
      burgerId: item?.meta?.burgerId,
      size: item?.meta?.size,
      removedIds,
      extrasIds,
      papasIds,
      note,
    }),
    extras,
    removedIngredients,
    papas,
    note,
    meta: {
      ...item?.meta,
      extrasIds,
      removedIngredientIds: removedIds,
      papasIds,
      friesId: papasIds[0] || null,
    },
  };
}
