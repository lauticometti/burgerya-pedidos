// Consolidated in src/utils/itemGrouping.js
export { CART_GROUP_ORDER, getCategory, groupItemsByCategory } from "../../utils/itemGrouping";

// Devuelve { name, suffix } en vez de un string armado, para que la UI pueda
// mostrar `name` con el componente ProductName (tachado + nombre argentino)
// y `suffix` (talle, etc.) aparte.
export function getUndoLabel(item) {
  if (!item) return { name: "producto", suffix: "" };
  if (item.meta?.type === "promo") return { name: item.name || "promo", suffix: "" };

  if (item.meta?.type === "papas") {
    const sizeLabel = item.meta?.size === "chica" ? "chicas" : "grandes";
    return { name: `Papas ${sizeLabel}`, suffix: "" };
  }

  if (item.meta?.burgerId === "cheese_promo") {
    return { name: item.name, suffix: "" };
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
  return { name: baseName, suffix: sizeLabel ? ` ${sizeLabel}` : "" };
}

export function buildBebidaQuantitiesInitial(items = []) {
  return items.reduce((acc, item) => {
    acc[item.id] = 0;
    return acc;
  }, {});
}
