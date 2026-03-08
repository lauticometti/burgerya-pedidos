const STORAGE_KEY = "burgerya_coupons_v1";

// Seed codes provided by the user for el finde
const SEED_COUPONS = [
  {
    code: "bacon-5-usx",
    scope: ["bacon"],
    type: "fixed",
    value: 5000,
    minOrder: 45000,
    maxUses: 1,
    active: true,
    note: "$5000 en Bacon, mínimo $45.000",
  },
  { code: "bacon-10-sas", scope: ["bacon"], type: "percent", value: 10, maxUses: 1, active: true },
  { code: "bacon-15-ujc", scope: ["bacon"], type: "percent", value: 15, maxUses: 1, active: true },
  { code: "cheese-5-kio", scope: ["cheese"], type: "fixed", value: 5000, minOrder: 45000, maxUses: 1, active: true },
  { code: "cheese-10-off", scope: ["cheese"], type: "percent", value: 10, maxUses: 1, active: true },
  { code: "cheese-20-off", scope: ["cheese"], type: "percent", value: 20, maxUses: 1, active: true },
  { code: "titanica-20-off", scope: ["titanica"], type: "percent", value: 20, maxUses: 1, active: true },
  { code: "general-5-poi", scope: "general", type: "percent", value: 5, maxUses: 1, active: true },
  { code: "general-10-ssa", scope: "general", type: "percent", value: 10, maxUses: 1, active: true },
  { code: "general-15-ssx", scope: "general", type: "percent", value: 15, maxUses: 1, active: true },
];

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
  const stored = readStorage();
  if (Array.isArray(stored) && stored.length) return stored;
  writeStorage(SEED_COUPONS);
  return SEED_COUPONS;
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
  const coupons = loadCoupons();
  const found = coupons.find((c) => normalizeCode(c.code) === normalizeCode(code));
  if (!found) return { ok: false, reason: "Código inválido o no existe." };
  if (!found.active) return { ok: false, reason: "Código pausado." };
  const usedBy = found.usedBy || [];
  if (!phone || phone.trim().length < 6) {
    return { ok: false, reason: "Ingresa un teléfono válido para usar el código." };
  }
  const phoneKey = phone.trim();
  if (usedBy.includes(phoneKey)) {
    return { ok: false, reason: "Ese teléfono ya usó este código." };
  }
  if (found.maxUses && usedBy.length >= found.maxUses) {
    return { ok: false, reason: "El código ya fue usado." };
  }
  if (found.expiresAt && Date.now() > found.expiresAt) {
    return { ok: false, reason: "El código venció." };
  }
  if (!hasScopeMatch(found, items)) {
    return { ok: false, reason: "El código no aplica a este pedido." };
  }
  if (found.minOrder && total < found.minOrder) {
    return { ok: false, reason: `Mínimo de compra ${found.minOrder.toLocaleString("es-AR")}.` };
  }

  const discount =
    found.type === "fixed"
      ? Math.min(found.value || 0, total)
      : Math.min(Math.round((total * (found.value || 0)) / 100), total);

  if (discount <= 0) {
    return { ok: false, reason: "El código no genera descuento en este pedido." };
  }

  return {
    ok: true,
    coupon: found,
    discount,
    finalTotal: Math.max(0, total - discount),
  };
}

export function consumeCoupon({ code, phone }) {
  const coupons = loadCoupons();
  const phoneKey = (phone || "").trim();
  const next = coupons.map((c) => {
    if (normalizeCode(c.code) !== normalizeCode(code)) return c;
    const usedBy = c.usedBy || [];
    if (!phoneKey) return { ...c, usedBy };
    if (usedBy.includes(phoneKey)) return c;
    return { ...c, usedBy: [...usedBy, phoneKey] };
  });
  saveCoupons(next);
  return next;
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
