import { getArgentinaTimeParts } from "./storeClosedMode";

// TEMP ARGENTINA MATCH DAY: flag única de campaña. Poner en true para reactivar el próximo partido.
export const MATCH_DAY_CAMPAIGN = false;

// Acento visual celeste en el banner de estado (identidad Argentina), sin
// texto ni mención a ningún partido. Independiente de MATCH_DAY_CAMPAIGN:
// se puede dejar prendido aunque no haya campaña de partido activa.
export const ARGENTINA_ACCENT_THEME = false;

// Override manual: si querés forzar otra burger un día puntual, poné el id
// acá (ej: "bacon") y la fecha en DAILY_FEATURE_OVERRIDE_DATE. Se aplica
// SOLO ese día: a partir de las 00hs del día siguiente se ignora solo y
// vuelve el mapping automático de siempre. null = sin override.
// ACTIVO 2026-07-23: se agotó la American (recomendada del miércoles), la
// reemplazamos por Cheese con su mismo descuento de siempre.
export const DAILY_FEATURE_OVERRIDE_ID = "cheese";
export const DAILY_FEATURE_OVERRIDE_DATE = "2026-07-23";

// Texto del eyebrow cuando usás override manual. null = muestra "RECOMENDADA DEL <DÍA>" normal.
export const DAILY_FEATURE_OVERRIDE_LABEL = null;

// Día del Amigo: fecha puntual con label especial en vez de DAILY_FEATURE_OVERRIDE_LABEL.
const FRIENDS_DAY_DATE_KEY = "2026-07-20";
const FRIENDS_DAY_OVERRIDE_LABEL = "PARA COMPARTIR CON AMIGOS";

// Fallback de stock: cuando se agota la burger del día, poné el id acá (ej: "cheese").
// null = sin fallback, se muestra la burger del día normal.
export const STOCK_FALLBACK_ID = null;

// Burgers adicionales que salen al precio promo del día (con tachado).
// { burgerId: precioOverride } — null = sin promos extras.
export const DAILY_FEATURE_EXTRA_PROMOS = null;

// Sets de precios promo del día.
const PRICES_PREMIUM = { simple: 11500, doble: 14000, triple: 18000 }; // original: 12000/15500/19000
const PRICES_DELUXE  = { simple: 12000, doble: 14500, triple: 18500 }; // original: 12500/16000/19500
const PRICES_CHEESE  = { simple: 10500, doble: 13500, triple: 17500 }; // original: 11000/14500/18000

// día (0=Dom..6=Sáb) → burger destacada + precios promo del día.
const DAILY_FEATURE_BY_WEEKDAY = {
  0: { burgerId: "lautiboom",  prices: PRICES_PREMIUM }, // Domingo
  1: { burgerId: "cheese",     prices: PRICES_CHEESE  }, // Lunes
  2: { burgerId: "smoklahoma", prices: PRICES_DELUXE  }, // Martes
  3: { burgerId: "american",   prices: PRICES_PREMIUM }, // Miércoles
  4: { burgerId: "smoklahoma", prices: PRICES_DELUXE  }, // Jueves
  5: { burgerId: "bbqueen",    prices: PRICES_DELUXE  }, // Viernes
  6: { burgerId: "bacon",      prices: PRICES_PREMIUM }, // Sábado
};

const WEEKDAY_LABELS = [
  "DOMINGO",
  "LUNES",
  "MARTES",
  "MIÉRCOLES",
  "JUEVES",
  "VIERNES",
  "SÁBADO",
];

// Si se usa override hacia una burger que aparece en otro día del mapping,
// reutilizamos ese set de precios. Si la burger override no está en el mapping,
// se destaca sin descuento (prices = null).
function findPricesForBurgerId(burgerId) {
  for (const entry of Object.values(DAILY_FEATURE_BY_WEEKDAY)) {
    if (entry.burgerId === burgerId) return entry.prices;
  }
  return null;
}

export function getDailyFeature(date = null) {
  const { day, dateKey } = getArgentinaTimeParts(date);
  const entry = DAILY_FEATURE_BY_WEEKDAY[day];
  if (!entry) return null;

  const overrideActive =
    DAILY_FEATURE_OVERRIDE_ID && dateKey === DAILY_FEATURE_OVERRIDE_DATE;

  if (overrideActive && DAILY_FEATURE_OVERRIDE_ID === "off") return null;

  if (overrideActive) {
    const eyebrow = dateKey === FRIENDS_DAY_DATE_KEY
      ? FRIENDS_DAY_OVERRIDE_LABEL
      : (DAILY_FEATURE_OVERRIDE_LABEL || null);
    return {
      burgerId: DAILY_FEATURE_OVERRIDE_ID,
      prices: findPricesForBurgerId(DAILY_FEATURE_OVERRIDE_ID),
      weekdayLabel: WEEKDAY_LABELS[day],
      eyebrow,
    };
  }

  if (STOCK_FALLBACK_ID && STOCK_FALLBACK_ID !== entry.burgerId) {
    return {
      burgerId: STOCK_FALLBACK_ID,
      prices: findPricesForBurgerId(STOCK_FALLBACK_ID),
      weekdayLabel: WEEKDAY_LABELS[day],
    };
  }

  return {
    burgerId: entry.burgerId,
    prices: entry.prices,
    weekdayLabel: WEEKDAY_LABELS[day],
  };
}

export function getDailyFeaturePrices(burgerId, date = null) {
  const feature = getDailyFeature(date);
  if (!feature) return null;
  if (feature.burgerId === burgerId) return feature.prices;
  if (DAILY_FEATURE_EXTRA_PROMOS?.[burgerId]) return DAILY_FEATURE_EXTRA_PROMOS[burgerId];
  return null;
}
