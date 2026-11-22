import { getPapasUpgradePrice } from "./papasPricing";
import { burgers } from "../data/menu";
import { getBurgerPrice } from "./burgerPricing";
import {
  giveawayCoupons,
  GIVEAWAY_COUPON_EXPIRY_TS,
} from "../data/giveawayCoupons";
import {
  dbardoCoupons,
  DBARDO_COUPON_EXPIRY_TS,
  DBARDO_DISCOUNT_CAP,
} from "../data/dbardoCoupons";

// Texto explicativo del beneficio del premio, reutilizado por el bloque de
// cupón aplicado y por la etiqueta en la línea del carrito.
export function getGiveawayBenefitLabel({ targetBurgerName, targetSize }) {
  if (!targetBurgerName) return "";
  if (targetSize === "triple") {
    return `Premio aplicado: valor de ${targetBurgerName} doble`;
  }
  return `${targetBurgerName}${targetSize ? ` ${targetSize}` : ""} gratis`;
}

export const COUPON_CODES = {
  combo: "COMBOYA",
  oneTimeAmerican: "JUANSINLECHUGA",
  percent25: "JUAN25",
  weekend20: "20SABADO",
  prode: "PRODE",
  matiAmerican: "MATI.AMERICAN",
  cheese10Lucas: "CHEESE10LUCAS",
  miercoles16: "MIERCOLES16",
  jueves17: "JUEVES17",
  tedebemosuna: "TEDEBEMOSUNA",
  volveya: "VOLVEYA",
  regalito: "REGALITO",
  triple: "TRIPLE",
  charly5: "CHARLY5",
  burger10: "BURGER10",
  unamas: "UNAMAS",
  cortasemana10: "CORTASEMANA10",
  felipe: "FELIPE",
};

// Variantes toleradas para que los clientes puedan escribir "combo ya" con espacios o guiones.
const COMBO_CODE_VARIANTS = ["COMBOYA", "COMBO YA", "COMBO-YA", "COMBO_YA"];

const ONE_TIME_STORAGE_KEY = "coupon:juansinlechuga:used:v2";
const WEEKEND_COUPON_EXPIRY_TS = new Date(2026, 2, 22, 0, 1, 0).getTime(); // domingo 22/03/2026 00:01 (BA)
const PRODE_COUPON_EXPIRY_TS = new Date(2026, 6, 17, 0, 1, 0).getTime(); // viernes 17/07/2026 00:01 (BA) -> vence jueves 16/7
const MATI_AMERICAN_COUPON_EXPIRY_TS = new Date(2026, 7, 7, 21, 0, 0).getTime(); // viernes 07/08/2026 21:00 (BA)
const MIERCOLES16_COUPON_EXPIRY_TS = new Date(2026, 8, 17, 0, 0, 0).getTime(); // jueves 17/09/2026 00:00 (BA) -> vence miércoles 16/9 a las 00hs
const JUEVES17_COUPON_EXPIRY_TS = new Date(2026, 8, 18, 0, 0, 0).getTime(); // viernes 18/09/2026 00:00 (BA) -> vence jueves 17/9 a las 00hs
// Offset -03:00 explícito: vence a las 00:00 de BA aunque el celular del cliente tenga otra zona horaria.
const TEDEBEMOSUNA_COUPON_EXPIRY_TS = Date.parse("2026-10-02T00:00:00-03:00"); // viernes 02/10/2026 00:00 (BA) -> vale miércoles 30/9 y jueves 1/10
const VOLVEYA_COUPON_EXPIRY_TS = Date.parse("2026-10-02T00:00:00-03:00"); // viernes 02/10/2026 00:00 (BA) -> vale miércoles 30/9 y jueves 1/10
const REGALITO_COUPON_EXPIRY_TS = Date.parse("2026-10-02T00:00:00-03:00"); // viernes 02/10/2026 00:00 (BA) -> vale miércoles 30/9 y jueves 1/10
const TRIPLE_COUPON_EXPIRY_TS = Date.parse("2026-10-09T00:00:00-03:00"); // viernes 09/10/2026 00:00 (BA) -> vale miércoles 7/10 y jueves 8/10
const CHARLY5_COUPON_EXPIRY_TS = Date.parse("2026-10-05T00:00:00-03:00"); // lunes 05/10/2026 00:00 (BA) -> vale solo domingo 4/10
const BURGER10_COUPON_START_TS = Date.parse("2026-11-04T00:00:00-03:00"); // miércoles 04/11/2026 00:00 (BA)
const BURGER10_COUPON_EXPIRY_TS = Date.parse("2026-11-06T00:00:00-03:00"); // vence viernes 06/11/2026 00:00 (BA) -> vale miércoles 4/11 y jueves 5/11
const UNAMAS_COUPON_EXPIRY_TS = Date.parse("2026-10-21T23:50:00-03:00"); // vale solo miércoles 21/10/2026 hasta las 23:50 (BA)
const CORTASEMANA10_COUPON_START_TS = Date.parse("2026-10-28T00:00:00-03:00"); // miércoles 28/10/2026 00:00 (BA)
const CORTASEMANA10_COUPON_EXPIRY_TS = Date.parse("2026-10-30T00:00:00-03:00"); // vence viernes 30/10/2026 00:00 (BA) -> vale miércoles 28/10 y jueves 29/10

// ============================================================================
// FELIPE — descuento de fin de semana (sábado 21 y domingo 22/11/2026).
// ÚNICO lugar para dar de baja el código a mano antes de que venza solo:
// poner FELIPE_COUPON_ENABLED en false. No hace falta tocar nada más.
const FELIPE_COUPON_ENABLED = true;
// Vence lunes 23/11/2026 00:00 (hora de Argentina, -03:00) -> vale todo el
// sábado 21 y el domingo 22 hasta las 23:59.
const FELIPE_COUPON_EXPIRY_TS = Date.parse("2026-11-23T00:00:00-03:00");
// ============================================================================

const COMBO_TARGETS = { simple: 12990, doble: 15990 };
const CHEESE_10_LUCAS_TARGET = 10000;

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

const NORMALIZED_MATI_AMERICAN_CODE = normalizeCouponInput(
  COUPON_CODES.matiAmerican,
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

function computeCheese10LucasDiscount(cartItems = []) {
  return cartItems.reduce((sum, it) => {
    if (it.meta?.type !== "burger") return sum;
    if ((it.meta?.burgerId || "").toLowerCase() !== "cheese") return sum;
    if (it.meta?.size !== "doble") return sum;
    const diff = Math.max(0, (it.unitPrice || 0) - CHEESE_10_LUCAS_TARGET);
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

function isMatiAmericanCouponActive(nowTs = Date.now()) {
  return nowTs < MATI_AMERICAN_COUPON_EXPIRY_TS;
}

function isMiercoles16CouponActive(nowTs = Date.now()) {
  return nowTs < MIERCOLES16_COUPON_EXPIRY_TS;
}

function isJueves17CouponActive(nowTs = Date.now()) {
  return nowTs < JUEVES17_COUPON_EXPIRY_TS;
}

function isCharly5CouponActive(nowTs = Date.now()) {
  return nowTs < CHARLY5_COUPON_EXPIRY_TS;
}

function isBurger10CouponActive(nowTs = Date.now()) {
  return nowTs >= BURGER10_COUPON_START_TS && nowTs < BURGER10_COUPON_EXPIRY_TS;
}

function isCortasemana10CouponActive(nowTs = Date.now()) {
  return (
    nowTs >= CORTASEMANA10_COUPON_START_TS &&
    nowTs < CORTASEMANA10_COUPON_EXPIRY_TS
  );
}

// Códigos "doble -> triple gratis" (código -> vencimiento). Para sumar otro
// código con el mismo beneficio, agregarlo acá con su fecha.
const FREE_MEAT_COUPON_EXPIRY = {
  [COUPON_CODES.tedebemosuna]: TEDEBEMOSUNA_COUPON_EXPIRY_TS,
  [COUPON_CODES.volveya]: VOLVEYA_COUPON_EXPIRY_TS,
  [COUPON_CODES.regalito]: REGALITO_COUPON_EXPIRY_TS,
  [COUPON_CODES.triple]: TRIPLE_COUPON_EXPIRY_TS,
  [COUPON_CODES.unamas]: UNAMAS_COUPON_EXPIRY_TS,
};

export const FREE_MEAT_PROMO_MESSAGE =
  "Promo aplicada: tu doble se convierte en triple gratis 🍔";
// Cuando la doble elegida venía con precio promo (ej. promo del día).
export const FREE_MEAT_REPRICED_MESSAGE = "Código aplicado: tu doble pasa a triple 🍔";

// Mensaje fijo por código (opcional). Sin entrada: depende de si la doble
// venía con precio promo.
const FREE_MEAT_COUPON_MESSAGE = {
  [COUPON_CODES.regalito]: FREE_MEAT_REPRICED_MESSAGE,
  [COUPON_CODES.triple]: FREE_MEAT_REPRICED_MESSAGE,
  [COUPON_CODES.unamas]: FREE_MEAT_REPRICED_MESSAGE,
};

// 1 carne extra gratis por pedido sobre una burger doble. No descuenta plata:
// el cliente paga la doble y la cocina la hace triple. Prefiere una doble a
// precio normal; si todas tienen precio promo, usa la primera.
function findFreeMeatTarget(cartItems = []) {
  const dobles = cartItems.filter(
    (it) => it.meta?.type === "burger" && it.meta?.size === "doble" && it.qty > 0,
  );
  return dobles.find((it) => getOfferSurcharge(it) === 0) || dobles[0] || null;
}

// Lo que le falta a 1 unidad para volver a su precio normal (0 si no tiene
// oferta). Los beneficios no se acumulan: la doble que pasa a triple se
// cobra a precio normal; el resto de la línea conserva su oferta.
function getOfferSurcharge(item) {
  const basePrice = item.meta?.basePrice;
  if (typeof basePrice !== "number") return 0;
  return Math.max(0, Math.round(basePrice - (item.unitPrice || 0)));
}

function hasBurger(cartItems = []) {
  return cartItems.some((it) => it.meta?.type === "burger");
}

// burgerId null/undefined = aplica a cualquier burger, no a una en particular.
// excludeBurgerIds: ids que quedan afuera aunque matcheen burgerId (o "cualquiera").
// includeExtras: false deja afuera los agregados (ej. carne extra) de la base
// del descuento; las papas (parte de la burger, no un "agregado" aparte para
// el cliente) siempre entran.
function computeBurgerPercentDiscount(
  cartItems = [],
  burgerId,
  percent,
  excludeBurgerIds = [],
  includeExtras = true,
) {
  return cartItems.reduce((sum, it) => {
    if (it.meta?.type !== "burger") return sum;
    const itemBurgerId = (it.meta?.burgerId || "").toLowerCase();
    if (burgerId && itemBurgerId !== burgerId) return sum;
    if (excludeBurgerIds.includes(itemBurgerId)) return sum;

    const papasContext = { size: it.meta?.size, itemType: it.meta?.type };
    const extrasTotal = includeExtras
      ? (it.extras || []).reduce(
          (extrasSum, extra) => extrasSum + extra.price,
          0,
        )
      : 0;
    const papasTotal = (it.papas || []).reduce(
      (papasSum, extra) => papasSum + getPapasUpgradePrice(extra, papasContext),
      0,
    );
    const lineTotal = it.qty * (it.unitPrice + extrasTotal + papasTotal);
    return sum + Math.round(lineTotal * percent);
  }, 0);
}

// BURGER10 se calcula solo sobre la burger, nunca sobre agregados o papas.
// Si ya tiene una oferta, completa hasta el 10% del precio habitual sin
// acumular porcentajes. Una oferta mayor se conserva, sin recargo.
// Se mantiene separado del helper historico para no cambiar otros cupones.
function computeBurger10Discount(cartItems = []) {
  return cartItems.reduce((sum, item) => {
    if (item.meta?.type !== "burger" || !(item.qty > 0)) return sum;
    const unitPrice = item.unitPrice || 0;
    const existingDiscount = getOfferSurcharge(item);
    const regularPrice = unitPrice + existingDiscount;
    const targetDiscount = Math.round(item.qty * regularPrice * 0.1);
    return sum + Math.max(0, targetDiscount - item.qty * existingDiscount);
  }, 0);
}

const NORMALIZED_GIVEAWAY_COUPONS = new Map(
  giveawayCoupons.map((c) => [normalizeCouponInput(c.code), c]),
);

function isGiveawayCouponActive(nowTs = Date.now()) {
  return nowTs < GIVEAWAY_COUPON_EXPIRY_TS;
}

const NORMALIZED_DBARDO_COUPONS = new Map(
  dbardoCoupons.map((c) => [normalizeCouponInput(c.code), c]),
);

function isDbardoCouponActive(nowTs = Date.now()) {
  return nowTs < DBARDO_COUPON_EXPIRY_TS;
}

const burgersById = burgers.reduce((acc, b) => {
  acc[b.id] = b;
  return acc;
}, {});

// Código D BARDO válido -> su forma "oficial" (ej. "db bt3n" -> "DB-BT3N"),
// o null si no es un código D BARDO. Único punto de entrada para reconocer
// estos códigos desde la UI (Carrito/useDbardoCodes).
export function normalizeDbardoCode(code) {
  const dbardo = NORMALIZED_DBARDO_COUPONS.get(normalizeCouponInput(code));
  return dbardo ? dbardo.code : null;
}

// Evalúa una PILA de códigos D BARDO aplicados juntos sobre el mismo pedido
// (un cliente puede tener varios stickers y canjearlos todos). Cada código
// aporta su descuento de forma independiente:
//   - porcentaje: % sobre cartTotal (no se recalcula en cascada sobre lo que
//     ya descontaron los códigos anteriores, se suman los porcentajes).
//   - "burger": regala UNA unidad doble disponible del carrito (la más cara
//     primero); si hay varios códigos "burger", cada uno se lleva una unidad
//     distinta del pool, nunca la misma.
// El conjunto se tapea en DBARDO_DISCOUNT_CAP ($30.000) TOTAL por pedido, no
// por código individual.
export function evaluateDbardoStack({
  codes = [],
  cartItems = [],
  cartTotal = 0,
  now = new Date(),
}) {
  const nowTs = now.getTime();
  const active = isDbardoCouponActive(nowTs);

  // Pool de unidades "doble" disponibles para regalar, de la más cara a la
  // más barata. Cada código "burger" reclama una unidad; si hay 2 unidades
  // en la misma línea (qty 2), cada una se puede regalar por separado.
  const doblePool = [];
  for (const item of cartItems) {
    if (item.meta?.type !== "burger" || item.meta?.size !== "doble" || !item.qty) {
      continue;
    }
    const burger = burgersById[item.meta?.burgerId];
    const unitPrice = burger
      ? getBurgerPrice(burger, "doble", now)
      : item.unitPrice || 0;
    if (!(unitPrice > 0)) continue;
    for (let i = 0; i < item.qty; i++) {
      doblePool.push({
        lineKey: item.key,
        burgerId: item.meta?.burgerId || null,
        burgerName: burger?.name || item.name || "",
        unitPrice,
      });
    }
  }
  doblePool.sort((a, b) => b.unitPrice - a.unitPrice);
  let poolIndex = 0;

  const seen = new Set();
  const entries = [];
  let rawTotal = 0;

  for (const rawCode of codes) {
    const normalized = normalizeCouponInput(rawCode);
    const dbardo = NORMALIZED_DBARDO_COUPONS.get(normalized);
    if (!dbardo) {
      entries.push({ code: rawCode, error: "Código inválido" });
      continue;
    }
    if (seen.has(normalized)) {
      entries.push({ code: dbardo.code, error: "Ese código ya está aplicado" });
      continue;
    }
    seen.add(normalized);
    if (!active) {
      entries.push({ code: dbardo.code, error: "Ese código de D BARDO venció" });
      continue;
    }

    if (dbardo.tier === "burger") {
      if (poolIndex >= doblePool.length) {
        entries.push({
          code: dbardo.code,
          error: "No hay más burgers dobles en el carrito para regalar: agregá otra doble",
        });
        continue;
      }
      const target = doblePool[poolIndex++];
      rawTotal += target.unitPrice;
      entries.push({
        code: dbardo.code,
        tier: "burger",
        discount: target.unitPrice,
        targetLineKey: target.lineKey,
        targetBurgerId: target.burgerId,
        targetBurgerName: target.burgerName,
        targetSize: "doble",
      });
    } else {
      const discount = computePercentDiscount(cartTotal, dbardo.tier / 100);
      rawTotal += discount;
      entries.push({ code: dbardo.code, tier: dbardo.tier, discount });
    }
  }

  const totalDiscount = Math.min(rawTotal, DBARDO_DISCOUNT_CAP);
  const giveawayTargets = entries
    .filter((e) => e.targetLineKey)
    .map((e) => ({
      lineKey: e.targetLineKey,
      burgerId: e.targetBurgerId,
      burgerName: e.targetBurgerName,
      size: e.targetSize,
    }));

  return {
    entries,
    totalDiscount,
    rawTotal,
    capped: rawTotal > DBARDO_DISCOUNT_CAP,
    giveawayTargets,
  };
}

// El premio regala una burger: simple/doble se descuentan enteras, la triple
// solo hasta el precio de la doble de esa misma burger (el cliente paga la
// diferencia). Se aplica sobre la línea que le da mayor descuento al cliente.
function computeGiveawayBurgerDiscount(item, date = new Date()) {
  const burger = burgersById[item.meta?.burgerId];
  if (!burger) return 0;
  const size = item.meta?.size;
  const unitPrice = getBurgerPrice(burger, size, date) || item.unitPrice || 0;
  if (size === "triple") {
    const doublePrice = getBurgerPrice(burger, "doble", date);
    if (typeof doublePrice !== "number") return 0;
    return Math.min(doublePrice, unitPrice);
  }
  if (size === "simple" || size === "doble") {
    return unitPrice;
  }
  return 0;
}

// Busca, entre las líneas de burger del carrito, la que produce el mayor
// descuento posible y devuelve tanto el importe como los datos para
// identificarla en la UI y en el mensaje de WhatsApp.
function findBestGiveawayTarget(cartItems = [], date = new Date()) {
  let best = null;
  for (const item of cartItems) {
    if (item.meta?.type !== "burger") continue;
    if (!item.qty) continue;
    const lineDiscount = computeGiveawayBurgerDiscount(item, date);
    if (lineDiscount > 0 && lineDiscount > (best?.discount || 0)) {
      const burger = burgersById[item.meta?.burgerId];
      best = {
        discount: lineDiscount,
        targetLineKey: item.key,
        targetBurgerId: item.meta?.burgerId || null,
        targetBurgerName: burger?.name || item.name || "",
        targetSize: item.meta?.size || null,
        giveawayBaseSize: item.meta?.size === "triple" ? "doble" : item.meta?.size || null,
      };
    }
  }
  return best;
}

// FELIPE: descuenta el precio BASE de catálogo (sin ofertas del día activas)
// de la doble de UNA sola burger por pedido. Solo entran líneas doble o
// superior (las simples no participan); si hay varias, gana la de doble más
// cara. Si la línea elegida es triple (o más), el descuento queda en el
// valor de SU doble, así que el cliente paga la diferencia con lo que esa
// unidad cuesta hoy (ver findBestFelipeTarget / evaluateCoupon).
function findBestFelipeTarget(cartItems = []) {
  let best = null;
  for (const item of cartItems) {
    if (item.meta?.type !== "burger" || !item.qty) continue;
    const size = item.meta?.size;
    if (!size || size === "simple") continue;
    const burger = burgersById[item.meta?.burgerId];
    const doubleBasePrice = burger?.prices?.doble;
    if (typeof doubleBasePrice !== "number") continue;
    // Tope defensivo: nunca descuenta mas de lo que esa linea cuesta hoy en
    // la practica (cubre el caso raro de una oferta activa que la deje mas
    // barata que su propia doble).
    const value = Math.min(doubleBasePrice, item.unitPrice || 0);
    if (value > (best?.discount || 0)) {
      best = {
        discount: value,
        targetLineKey: item.key,
        targetBurgerId: item.meta?.burgerId || null,
        targetBurgerName: burger?.name || item.name || "",
        targetSize: size,
        giveawayBaseSize: "doble",
      };
    }
  }
  return best;
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

  if (normalized === COUPON_CODES.charly5) {
    if (!isCharly5CouponActive(nowTs)) {
      return {
        error: `${COUPON_CODES.charly5} venció: era 5% off, válido solo el domingo 4/10 (BA)`,
        discount: 0,
      };
    }
    const discount = computePercentDiscount(cartTotal, 0.05);
    return {
      appliedCode: COUPON_CODES.charly5,
      discount,
      message: `${COUPON_CODES.charly5} aplicado: 5% off`,
    };
  }

  if (normalized === COUPON_CODES.prode) {
    if (!isProdeCouponActive(nowTs)) {
      return {
        error: "PRODE venció: era 10% off en Cheese hasta el jueves 16/7 (BA)",
        discount: 0,
      };
    }
    const discount = computeBurgerPercentDiscount(cartItems, "cheese", 0.1);
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

  if (normalized === NORMALIZED_MATI_AMERICAN_CODE) {
    if (!isMatiAmericanCouponActive(nowTs)) {
      return {
        error: `${COUPON_CODES.matiAmerican} venció: era 10% off en American hasta el viernes 07/08 21:00 (BA)`,
        discount: 0,
      };
    }
    const discount = computeBurgerPercentDiscount(cartItems, "american", 0.1);
    if (discount <= 0) {
      return {
        error: `${COUPON_CODES.matiAmerican} es 10% off en American: agregá una American al carrito`,
        discount: 0,
      };
    }
    return {
      appliedCode: COUPON_CODES.matiAmerican,
      discount,
      message: `${COUPON_CODES.matiAmerican} aplicado: 10% off en American hasta el viernes 07/08 21:00 (BA)`,
    };
  }

  if (normalized === COUPON_CODES.cheese10Lucas) {
    const discount = computeCheese10LucasDiscount(cartItems);
    if (discount <= 0) {
      return {
        error: `${COUPON_CODES.cheese10Lucas} es Cheese doble a $10.000: agregá una Cheese doble al carrito`,
        discount: 0,
      };
    }
    return {
      appliedCode: COUPON_CODES.cheese10Lucas,
      discount,
      message: `${COUPON_CODES.cheese10Lucas} aplicado: Cheese doble con papas a $10.000`,
    };
  }

  if (normalized === COUPON_CODES.miercoles16) {
    if (!isMiercoles16CouponActive(nowTs)) {
      return {
        error: `${COUPON_CODES.miercoles16} venció: era 15% off en todas las burgers hasta el miércoles 16/9 00:00 (BA)`,
        discount: 0,
      };
    }
    const discount = computeBurgerPercentDiscount(cartItems, null, 0.15);
    if (discount <= 0) {
      return {
        error: `${COUPON_CODES.miercoles16} es 15% off en burgers: agregá una burger al carrito`,
        discount: 0,
      };
    }
    return {
      appliedCode: COUPON_CODES.miercoles16,
      discount,
      message: `${COUPON_CODES.miercoles16} aplicado: 15% off en todas las burgers hasta hoy 00:00 (BA)`,
    };
  }

  if (normalized === COUPON_CODES.jueves17) {
    if (!isJueves17CouponActive(nowTs)) {
      return {
        error: `${COUPON_CODES.jueves17} venció: era 10% off en burgers (menos Smoklahoma) hasta el jueves 17/9 00:00 (BA)`,
        discount: 0,
      };
    }
    const discount = computeBurgerPercentDiscount(cartItems, null, 0.1, [
      "smoklahoma",
    ]);
    if (discount <= 0) {
      return {
        error: `${COUPON_CODES.jueves17} es 10% off en burgers (menos Smoklahoma): agregá una burger al carrito`,
        discount: 0,
      };
    }
    return {
      appliedCode: COUPON_CODES.jueves17,
      discount,
      message: `${COUPON_CODES.jueves17} aplicado: 10% off en burgers (no aplica a Smoklahoma) hasta hoy 00:00 (BA)`,
    };
  }

  if (normalized === COUPON_CODES.burger10) {
    if (!isBurger10CouponActive(nowTs)) {
      return {
        error: `${COUPON_CODES.burger10} es válido miércoles 4/11 y jueves 5/11 (BA)`,
        discount: 0,
      };
    }
    const discount = computeBurger10Discount(cartItems);
    if (!cartItems.some((item) => item.meta?.type === "burger" && item.qty > 0 && item.unitPrice > 0)) {
      return {
        error: `${COUPON_CODES.burger10} es 10% off en burgers: agregá una burger al carrito`,
        discount: 0,
      };
    }
    return {
      appliedCode: COUPON_CODES.burger10,
      discount,
      message: discount > 0
        ? `${COUPON_CODES.burger10} aplicado: 10% off en todas las burgers`
        : `${COUPON_CODES.burger10}: se mantienen las promociones de mayor o igual descuento`,
    };
  }

  if (normalized === COUPON_CODES.cortasemana10) {
    if (!isCortasemana10CouponActive(nowTs)) {
      return {
        error: `${COUPON_CODES.cortasemana10} es válido miércoles 28/10 y jueves 29/10 (BA)`,
        discount: 0,
      };
    }
    const discount = computeBurgerPercentDiscount(
      cartItems,
      null,
      0.1,
      [],
      false,
    );
    if (discount <= 0) {
      return {
        error: `${COUPON_CODES.cortasemana10} es 10% off en burgers: agregá una burger al carrito`,
        discount: 0,
      };
    }
    return {
      appliedCode: COUPON_CODES.cortasemana10,
      discount,
      message: `${COUPON_CODES.cortasemana10} aplicado: 10% off en todas las burgers`,
    };
  }

  if (normalized === COUPON_CODES.felipe) {
    if (!FELIPE_COUPON_ENABLED || nowTs >= FELIPE_COUPON_EXPIRY_TS) {
      return { error: "este código ya venció", discount: 0 };
    }
    const target = findBestFelipeTarget(cartItems);
    if (!target) {
      return {
        error: "este código aplica a burgers dobles o superiores",
        discount: 0,
      };
    }
    return {
      appliedCode: COUPON_CODES.felipe,
      discount: target.discount,
      targetLineKey: target.targetLineKey,
      targetBurgerId: target.targetBurgerId,
      targetBurgerName: target.targetBurgerName,
      targetSize: target.targetSize,
      giveawayBaseSize: target.giveawayBaseSize,
      message: `${COUPON_CODES.felipe} aplicado`,
    };
  }

  if (Object.prototype.hasOwnProperty.call(FREE_MEAT_COUPON_EXPIRY, normalized)) {
    if (nowTs >= FREE_MEAT_COUPON_EXPIRY[normalized]) {
      return {
        error: `La promo ${normalized} finalizó`,
        discount: 0,
      };
    }
    const target = findFreeMeatTarget(cartItems);
    if (!target) {
      return {
        error: `${normalized} es para hamburguesas dobles: agregá una doble al carrito`,
        discount: 0,
      };
    }
    const surcharge = getOfferSurcharge(target);
    // Valor de la carne regalada = triple - doble a precio habitual. El
    // mensaje de WhatsApp lo muestra como descuento entre Subtotal y Total.
    const targetPrices = burgersById[target.meta?.burgerId]?.prices || {};
    const meatValue =
      typeof targetPrices.triple === "number" && typeof targetPrices.doble === "number"
        ? Math.max(0, targetPrices.triple - targetPrices.doble)
        : 0;
    const message =
      FREE_MEAT_COUPON_MESSAGE[normalized] ||
      (surcharge > 0 ? FREE_MEAT_REPRICED_MESSAGE : FREE_MEAT_PROMO_MESSAGE);
    return {
      appliedCode: normalized,
      discount: 0,
      surcharge,
      freeMeat: {
        lineKey: target.key,
        burgerName:
          burgersById[target.meta?.burgerId]?.name || target.name || "",
        lineQty: target.qty,
        surcharge,
        meatValue,
        message,
      },
      message,
    };
  }

  const giveaway = NORMALIZED_GIVEAWAY_COUPONS.get(normalized);
  if (giveaway) {
    if (!isGiveawayCouponActive(nowTs)) {
      return { error: "Ese código de premio venció", discount: 0 };
    }
    const target = findBestGiveawayTarget(cartItems, now);
    if (!target) {
      return {
        error: "Agregá una burger al carrito para usar el premio",
        discount: 0,
      };
    }
    return {
      appliedCode: giveaway.code,
      discount: target.discount,
      targetLineKey: target.targetLineKey,
      targetBurgerId: target.targetBurgerId,
      targetBurgerName: target.targetBurgerName,
      targetSize: target.targetSize,
      giveawayBaseSize: target.giveawayBaseSize,
      message: "✓ Premio aplicado",
    };
  }

  // Los códigos D BARDO (DB-XXXX) ya no pasan por acá: se acumulan de a
  // varios por pedido y se evalúan juntos con evaluateDbardoStack, más abajo
  // en este archivo. normalizeDbardoCode()/evaluateDbardoStack() son el punto
  // de entrada real, usado por useDbardoCodes (Carrito).

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
