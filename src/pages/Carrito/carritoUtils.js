// Consolidated in src/utils/itemGrouping.js
export { CART_GROUP_ORDER, getCategory, groupItemsByCategory } from "../../utils/itemGrouping";

export function getUndoLabel(item) {
  if (!item) return "producto";
  if (item.meta?.type === "promo") return item.name || "promo";

  if (item.meta?.type === "papas") {
    const sizeLabel = item.meta?.size === "chica" ? "chicas" : "grandes";
    return `Papas ${sizeLabel}`;
  }

  if (item.meta?.burgerId === "cheese_promo") {
    return item.name;
  }

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

export function buildBebidaQuantitiesInitial(items = []) {
  return items.reduce((acc, item) => {
    acc[item.id] = 0;
    return acc;
  }, {});
}
