export function formatMoney(n) {
  return `$${Number(n).toLocaleString("es-AR")}`;
}
