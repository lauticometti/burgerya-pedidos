function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `burgerya_order_${yyyy}-${mm}-${dd}`;
}

export function getNextOrderId() {
  if (typeof window === "undefined" || !window.localStorage) return "1";
  const key = getTodayKey();
  const raw = window.localStorage.getItem(key);
  const current = Number.parseInt(raw || "0", 10);
  const next = Number.isNaN(current) ? 1 : current + 1;
  window.localStorage.setItem(key, String(next));
  return String(next);
}
