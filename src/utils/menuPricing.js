export function getMinPrice(prices = {}) {
  const values = Object.values(prices).filter((value) => typeof value === "number");
  return values.length ? Math.min(...values) : 0;
}

