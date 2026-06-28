import { getArgentinaTimeParts } from "./storeClosedMode";

// Override manual: si querés forzar otra burger un día puntual,
// poné el id acá (ej: "bacon"). null = usar el mapping automático por día.
export const DAILY_FEATURE_OVERRIDE_ID = null;

// Fallback de stock: cuando se agota la burger del día, poné el id acá (ej: "cheese").
// null = sin fallback, se muestra la burger del día normal.
export const STOCK_FALLBACK_ID = null;

// Sets de precios promo del día.
const PRICES_PREMIUM = { simple: 11000, doble: 13500, triple: 17500 }; // original: 11500/15000/18500
const PRICES_DELUXE  = { simple: 11500, doble: 14000, triple: 18000 }; // original: 12000/15500/19000
const PRICES_CHEESE  = { simple: 10000, doble: 13000, triple: 17000 }; // original: 10500/14000/17500
const PRICES_DORITOS = { simple: 12000, doble: 14500, triple: 18500 }; // original: 12500/16000/19500

// día (0=Dom..6=Sáb) → burger destacada + precios promo del día.
const DAILY_FEATURE_BY_WEEKDAY = {
  0: { burgerId: "lautiboom",  prices: PRICES_PREMIUM }, // Domingo
  1: { burgerId: "cheese",     prices: PRICES_CHEESE  }, // Lunes
  2: { burgerId: "cheese",     prices: PRICES_CHEESE  }, // Martes
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
  const { day } = getArgentinaTimeParts(date);
  const entry = DAILY_FEATURE_BY_WEEKDAY[day];
  if (!entry) return null;

  if (DAILY_FEATURE_OVERRIDE_ID === "off") return null;

  if (DAILY_FEATURE_OVERRIDE_ID && DAILY_FEATURE_OVERRIDE_ID !== entry.burgerId) {
    return {
      burgerId: DAILY_FEATURE_OVERRIDE_ID,
      prices: findPricesForBurgerId(DAILY_FEATURE_OVERRIDE_ID),
      weekdayLabel: WEEKDAY_LABELS[day],
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
  if (!feature || feature.burgerId !== burgerId) return null;
  return feature.prices;
}
