const PATTIES_PER_SIZE = {
  simple: 1,
  doble: 2,
  triple: 3,
};

export const MAX_PATTIES_PER_DAY = 160;

function pattiesForItem(item = {}) {
  const meta = item.meta || {};
  const qty = item.qty || 1;

  if (meta.type === "burger") {
    return qty * (PATTIES_PER_SIZE[meta.size] || 0);
  }

  if (meta.type === "promo") {
    const burgersCount = meta.count || 0;
    const pattiesPerBurger = meta.size === "doble" ? 2 : 3;
    return qty * burgersCount * pattiesPerBurger;
  }

  if (meta.type === "combo") {
    const pattiesPerBurger = meta.size === "doble" ? 2 : 1;
    return qty * pattiesPerBurger;
  }

  return 0;
}

export function getCartPattyCount(items = []) {
  return items.reduce((sum, item) => sum + pattiesForItem(item), 0);
}
