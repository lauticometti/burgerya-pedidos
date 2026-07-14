import { getPapasUpgradePrice } from "./papasPricing";

export const COUPON_CODES = {
  combo: "COMBOYA",
  oneTimeAmerican: "JUANSINLECHUGA",
  percent25: "JUAN25",
  weekend20: "20SABADO",
  prode: "PRODE",
};

// Variantes toleradas para que los clientes puedan escribir "combo ya" con espacios o guiones.
const COMBO_CODE_VARIANTS = ["COMBOYA", "COMBO YA", "COMBO-YA", "COMBO_YA"];

const ONE_TIME_STORAGE_KEY = "coupon:juansinlechuga:used:v2";
const WEEKEND_COUPON_EXPIRY_TS = new Date(2026, 2, 22, 0, 1, 0).getTime(); // domingo 22/03/2026 00:01 (BA)
const PRODE_COUPON_EXPIRY_TS = new Date(2026, 6, 17, 0, 1, 0).getTime(); // viernes 17/07/2026 00:01 (BA) -> vence jueves 16/7
const COMBO_TARGETS = { simple: 12990, doble: 15990 };

export function normalizeCouponInput(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\s_-]/g, "")
    .replace(/[^\w]/g, "") // tolera signos sueltos (.,!,/)
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

const NORMALIZED_COMBO_CODES = new Set(
  COMBO_CODE_VARIANTS.map((code) => normalizeCouponInput(code)),
);

function isComboWindowActive(now = new Date()) {
  const minutesSinceWeekStart =
    now.getDay() * 24 * 60 + now.getHours() * 60 + now.getMinutes();
  const comboWindowStart = 2 * 24 * 60; // martes 00:00
  const comboWindowEnd = 5 * 24 * 60 + 1; // viernes 00:01
  return (
    minutesSinceWeekStart >= comboWindowStart &&
    minutesSinceWeekStart <= comboWindowEnd
  );
}

function hasCombos(cartItems = []) {
  return cartItems.some((it) => it.meta?.type === "combo");
}

function computeComboDiscount(cartItems = []) {
  return cartItems.reduce((sum, it) => {
    if (it.meta?.type !== "combo") return sum;
    const size = it.meta?.size || "simple";
    const target = COMBO_TARGETS[size];
    if (!target) return sum;
    const diff = Math.max(0, (it.unitPrice || 0) - target);
    return sum + diff * (it.qty || 0);
  }, 0);
}

function findAmerican(cartItems = []) {
  return cartItems.find(
    (it) =>
      it.meta?.type === "burger" &&
      (it.meta?.burgerId || "").toLowerCase() === "american" &&
      it.qty > 0,
  );
}

function computeAmericanLineDiscount(item) {
  if (!item) return 0;
  const papasContext = { size: item.meta?.size, itemType: item.meta?.type };
  const extrasTotal = (item.extras || []).reduce(
    (sum, extra) => sum + extra.price,
    0,
  );
  const papasTotal = (item.papas || []).reduce(
    (sum, extra) => sum + getPapasUpgradePrice(extra, papasContext),
    0,
  );
  const picksExtrasTotal = (item.meta?.picks || []).reduce((picksSum, pick) => {
    const pickExtras = (pick.extras || []).reduce(
      (pickSum, extra) => pickSum + extra.price,
      0,
    );
    const pickPapas = (pick.papas || []).reduce(
      (pickSum, extra) => pickSum + getPapasUpgradePrice(extra, papasContext),
      0,
    );
    return picksSum + pickExtras + pickPapas;
  }, 0);

  const unitTotal =
    item.unitPrice + extrasTotal + papasTotal + picksExtrasTotal;
  return Math.round(unitTotal * 0.5);
}

function computePercentDiscount(total = 0, percent = 0) {
  return Math.round(total * percent);
}

function isWeekendCouponActive(nowTs = Date.now()) {
  return nowTs < WEEKEND_COUPON_EXPIRY_TS;
}

function isProdeCouponActive(nowTs = Date.now()) {
  return nowTs < PRODE_COUPON_EXPIRY_TS;
}

function hasBurger(cartItems = []) {
  return cartItems.some((it) => it.meta?.type === "burger");
}

function computeCheeseDiscount(cartItems = []) {
  return cartItems.reduce((sum, it) => {
    if (it.meta?.type !== "burger") return sum;
    if ((it.meta?.burgerId || "").toLowerCase() !== "cheese") return sum;

    const papasContext = { size: it.meta?.size, itemType: it.meta?.type };
    const extrasTotal = (it.extras || []).reduce(
      (extrasSum, extra) => extrasSum + extra.price,
      0,
    );
    const papasTotal = (it.papas || []).reduce(
      (papasSum, extra) => papasSum + getPapasUpgradePrice(extra, papasContext),
      0,
    );
    const lineTotal = it.qty * (it.unitPrice + extrasTotal + papasTotal);
    return sum + Math.round(lineTotal * 0.1);
  }, 0);
}

/**
 * Evaluate a coupon against the current cart.
 * @param {Object} params
 * @param {string} params.code
 * @param {Array} params.cartItems
 * @param {number} params.cartTotal
 * @param {Date} params.now
 * @param {Storage|null} params.storage
 * @param {boolean} params.allowUsed - allow one-time coupons already marked used (for recalculation)
 * @param {boolean} params.markUsed - persist usage when applicable
 */
export function evaluateCoupon({
  code,
  cartItems = [],
  cartTotal = 0,
  now = new Date(),
  storage = null,
  allowUsed = false,
  markUsed = false,
}) {
  const normalized = normalizeCouponInput(code);
  if (!normalized) {
    return { error: "Código inválido", discount: 0 };
  }

  const nowTs = now.getTime();

  if (NORMALIZED_COMBO_CODES.has(normalized)) {
    return { error: "Ese código expiró", discount: 0 };
  }

  if (normalized === COUPON_CODES.oneTimeAmerican) {
    return { error: 'Ese código expiró', discount: 0 };
  }

  if (normalized === COUPON_CODES.percent25) {
    return { error: 'Ese código expiró', discount: 0 };
  }
if (normalized === COUPON_CODES.weekend20) {
    if (!isWeekendCouponActive(nowTs)) {
      return {
        error: "20SABADO venció: activo hasta sábado 21 23:59 (BA)",
        discount: 0,
      };
    }
    const discount = computePercentDiscount(cartTotal, 0.2);
    return {
      appliedCode: COUPON_CODES.weekend20,
      discount,
      message: `${COUPON_CODES.weekend20} aplicado: 20% off hasta sábado 21 (BA)`,
    };
  }

  if (normalized === COUPON_CODES.prode) {
    if (!isProdeCouponActive(nowTs)) {
      return {
        error: "PRODE venció: era 10% off en Cheese hasta el jueves 16/7 (BA)",
        discount: 0,
      };
    }
    const discount = computeCheeseDiscount(cartItems);
    if (discount <= 0) {
      return {
        error: "PRODE es 10% off en Cheese: agregá una Cheese al carrito",
        discount: 0,
      };
    }
    return {
      appliedCode: COUPON_CODES.prode,
      discount,
      message: `${COUPON_CODES.prode} aplicado: 10% off en Cheese hasta el lunes 20/7 (BA)`,
    };
  }

  return { error: "Código inválido", discount: 0 };
}

export const couponStorage = (() => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
})();

const ADMIN_COUPONS_KEY = "burgerya:coupons";

function readAdminCoupons(storage = couponStorage) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(ADMIN_COUPONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error leyendo cupones admin", e);
    return [];
  }
}

function persistAdminCoupons(list, storage = couponStorage) {
  if (!storage) return list;
  try {
    storage.setItem(ADMIN_COUPONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Error guardando cupones admin", e);
  }
  return list;
}

export function loadCoupons() {
  return readAdminCoupons();
}

export function upsertCoupon(coupon) {
  const all = readAdminCoupons().filter((c) => c.code !== coupon.code);
  all.push(coupon);
  return persistAdminCoupons(all);
}

export function deleteCoupon(code) {
  const all = readAdminCoupons().filter((c) => c.code !== code);
  return persistAdminCoupons(all);
}

export function toggleCoupon(code, active) {
  const all = readAdminCoupons().map((c) =>
    c.code === code ? { ...c, active } : c,
  );
  return persistAdminCoupons(all);
}
