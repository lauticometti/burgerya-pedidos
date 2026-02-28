export const CART_GROUP_ORDER = [
  { key: "promos", title: "PROMOS" },
  { key: "burgers", title: "BURGERS" },
  { key: "papas", title: "PAPAS" },
  { key: "dips", title: "DIPS" },
  { key: "bebidas", title: "BEBIDAS" },
];

export function getUndoLabel(item) {
  if (!item) return "producto";
  if (item.meta?.type === "promo") return item.name || "promo";

  const sizeLabel =
    item.meta?.size === "doble"
      ? "doble"
      : item.meta?.size === "triple"
        ? "triple"
        : item.meta?.size === "simple"
          ? "simple"
          : "";

  const baseName = item.name || "producto";
  return sizeLabel ? `${baseName} ${sizeLabel}` : baseName;
}

export function getCategory(item) {
  if (item.meta?.type === "promo") return "promos";
  if (item.meta?.type === "bebida") return "bebidas";
  if (item.meta?.type === "papas" && item.key?.startsWith("papas:dip_")) {
    return "dips";
  }
  if (item.meta?.type === "papas") return "papas";
  return "burgers";
}

export function groupItemsByCategory(items = []) {
  const grouped = {
    promos: [],
    burgers: [],
    papas: [],
    dips: [],
    bebidas: [],
  };

  for (const item of items) {
    const category = getCategory(item);
    grouped[category].push(item);
  }

  return grouped;
}

export function buildBebidaQuantitiesInitial(items = []) {
  return items.reduce((acc, item) => {
    acc[item.id] = 0;
    return acc;
  }, {});
}
