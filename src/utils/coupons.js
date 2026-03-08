const STORAGE_KEY = "burgerya_coupons_v1";

// Cupones desactivados.
const SEED_COUPONS = [];

function canUseLocalStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readStorage() {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(payload) {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

function normalizeCode(code) {
  return (code || "").trim().toLowerCase();
}

export function loadCoupons() {
  // Desactivados: devolver lista vacia y limpiar storage si existiera.
  if (canUseLocalStorage()) writeStorage(SEED_COUPONS);
  return [];
}

export function saveCoupons(list) {
  writeStorage(list);
}

export function upsertCoupon(coupon) {
  const coupons = loadCoupons();
  const code = normalizeCode(coupon.code);
  const clean = { ...coupon, code };
  const idx = coupons.findIndex((c) => normalizeCode(c.code) === code);
  const next = [...coupons];
  if (idx >= 0) next[idx] = { ...next[idx], ...clean };
  else next.push({ ...clean, usedBy: [], createdAt: Date.now(), active: true });
  saveCoupons(next);
  return next;
}

export function deleteCoupon(code) {
  const coupons = loadCoupons();
  const next = coupons.filter((c) => normalizeCode(c.code) !== normalizeCode(code));
  saveCoupons(next);
  return next;
}

export function toggleCoupon(code, active) {
  const coupons = loadCoupons();
  const next = coupons.map((c) =>
    normalizeCode(c.code) === normalizeCode(code) ? { ...c, active } : c,
  );
  saveCoupons(next);
  return next;
}

function hasScopeMatch(coupon, items) {
  if (coupon.scope === "general") return true;
  const targetIds = Array.isArray(coupon.scope) ? coupon.scope : [coupon.scope];
  return items.some((item) => {
    if (item.meta?.type !== "burger") return false;
    const burgerId = item.meta?.burgerId || item.meta?.id;
    return targetIds.includes(burgerId);
  });
}

export function validateCoupon({ code, phone, items, total }) {
  return { ok: false, reason: "Los codigos de descuento estan desactivados." };
}

export function consumeCoupon({ code, phone }) {
  // No-op porque los cupones estan desactivados.
  return loadCoupons();
}

export function getUsageSummary() {
  const coupons = loadCoupons();
  return coupons.map((c) => ({
    code: c.code,
    used: (c.usedBy || []).length,
    remaining: c.maxUses ? Math.max(0, c.maxUses - (c.usedBy || []).length) : null,
    active: c.active !== false,
  }));
}
