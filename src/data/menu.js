export const WHATSAPP_NUMBER = "5491134158607";

// Deshabilita la opción Delivery en el checkout: solo se puede retirar en
// el local. Poner en true para reactivar delivery.
export const DELIVERY_ENABLED = true;

// Burgers con precios
export const burgers = [
  // BASICAS
  {
    id: "cheese",
    name: "Cheese",
    tier: "BASICA",
    prices: { simple: 11500, doble: 15500, triple: 19500 },
    desc: "Pan de papa, carne smash, cheddar",
    removableIngredients: [{ id: "cheddar", label: "Cheddar" }],
    img: "/burgers/cheese.svg",
    isAvailable: 1,
  },

  // PREMIUM
  {
    id: "lautiboom",
    name: "Lautiboom",
    tier: "PREMIUM",
    prices: { simple: 12500, doble: 16500, triple: 20500 },
    desc: "Cebolla caramelizada · Salsa especial",
    notice: "Sin mil islas",
    noticeSince: "2026-10-01",
    noticeShift: "noche",
    removableIngredients: [
      { id: "cheddar", label: "Cheddar" },
      { id: "mil_islas", label: "Salsa Mil Islas" },
      { id: "caramelized_onion", label: "Cebolla caramelizada" },
    ],
    img: "/burgers/lautiboom.svg",
    isAvailable: 1,
  },
  {
    id: "american",
    name: "American",
    tier: "PREMIUM",
    prices: { simple: 12500, doble: 16500, triple: 20500 },
    desc: "Lechuga · Tomate · Cebolla · Pepinos · Salsa especial",
    notice: "Sin mil islas",
    noticeSince: "2026-10-01",
    noticeShift: "noche",
    removableIngredients: [
      { id: "cheddar", label: "Cheddar" },
      { id: "pickles", label: "Pepinos agridulces" },
      { id: "tomato", label: "Tomate" },
      { id: "lettuce", label: "Lechuga" },
      { id: "onion", label: "Cebolla" },
      { id: "mil_islas", label: "Salsa Mil Islas" },
    ],
    img: "/burgers/american.svg",
    isAvailable: 1,
  },
  {
    id: "bacon",
    name: "Bacon",
    tier: "PREMIUM",
    prices: { simple: 12500, doble: 16500, triple: 20500 },
    desc: "Doble cheddar · Bacon crocante",
    removableIngredients: [
      { id: "cheddar", label: "Cheddar" },
      { id: "bacon", label: "Bacon" },
    ],
    img: "/burgers/bacon.svg",
    isAvailable: 1,
  },

  // DELUXE
  {
    id: "bbqueen",
    name: "BBQueen",
    tier: "DELUXE",
    prices: { simple: 13000, doble: 17000, triple: 21000 },
    desc: "Bacon · Cebolla caramelizada · Tomate · Salsa barbacoa",
    notice: "Sin ceb. caramelizada",
    noticeSince: "2026-09-25",
    noticeShift: "noche",
    removableIngredients: [
      { id: "cheddar", label: "Cheddar" },
      { id: "bacon", label: "Bacon" },
      { id: "bbq_sauce", label: "Salsa barbacoa" },
      { id: "tomato", label: "Tomate" },
      { id: "caramelized_onion", label: "Cebolla caramelizada" },
    ],
    img: "/burgers/bbqueen.svg",
    isAvailable: 1,
  },
  {
    id: "smoklahoma",
    name: "Smoklahoma",
    tier: "DELUXE",
    prices: { simple: 13000, doble: 17000, triple: 21000 },
    desc: "Carne con cebolla ultrafina · Bacon · Salsa especial",
    notice: "Sin mil islas",
    noticeSince: "2026-10-01",
    noticeShift: "noche",
    removableIngredients: [
      { id: "cheddar", label: "Cheddar" },
      { id: "onion", label: "Cebolla" },
      { id: "mil_islas", label: "Salsa Mil Islas" },
      { id: "bacon", label: "Bacon" },
    ],
    img: "/burgers/smoklahoma.svg",
    isAvailable: 1,
  },
];

// Precios de promos (flyers)
export const promoPrices = {
  BASICA: {
    doble: { 2: 29000, 3: 43000, 4: 57000 },
    triple: { 2: 37000, 3: 54500, 4: 72000 },
  },
  PREMIUM: {
    doble: { 2: 31000, 3: 46000, 4: 61000 },
    triple: { 2: 39000, 3: 57500, 4: 76000 },
  },
  DELUXE: {
    doble: { 2: 32000, 3: 47000, 4: 62000 },
    triple: { 2: 40000, 3: 59000, 4: 78000 },
  },
};

// Reglas de qué puede elegir cada promo
export const promoRules = {
  BASICA: { allowedTiers: ["BASICA"] },
  PREMIUM: { allowedTiers: ["BASICA", "PREMIUM"] },
  DELUXE: { allowedTiers: ["BASICA", "PREMIUM", "DELUXE"] },
};

export const extras = [
  {
    id: "carne_cheddar",
    name: "Carne c/cheddar",
    price: 4000,
    isAvailable: 1,
  },
  { id: "bacon_crocante", name: "Bacon", price: 1500, isAvailable: 1 },
  { id: "cheddar", name: "Extra cheddar", price: 500, isAvailable: 1 },
  {
    id: "cebolla_caram",
    name: "Cebolla caramelizada",
    price: 500,
    isAvailable: 0,
    unavailableReason: "Sin stock",
    unavailableSince: "2026-09-11",
    unavailableShift: "noche",
  },
  { id: "pepinos", name: "Pepinos", price: 500, isAvailable: 1 },
  { id: "lechuga", name: "Lechuga", price: 500, isAvailable: 1 },
  { id: "tomate", name: "Tomate", price: 500, isAvailable: 1 },
  { id: "cebolla", name: "Cebolla", price: 500, isAvailable: 1 },
  {
    id: "salsa_mil_islas",
    name: "Mil Islas",
    price: 500,
    isAvailable: 0,
    unavailableReason: "Sin stock",
    unavailableSince: "2026-10-01",
    unavailableShift: "noche",
  },
  { id: "salsa_bbq", name: "Barbacoa", price: 500, isAvailable: 1 },
];

export const papas = [
  {
    id: "porcion_extra",
    name: "Porción de papas extras",
    price: 3000,
    isAvailable: 1,
  },
  {
    id: "porcion_grande_solas",
    name: "Porción grande sola",
    price: 9000,
    isAvailable: 1,
    img: "/papas/papas-grandes.png",
  },
];

export const dips = [
  {
    id: "dip_mil_islas",
    name: "Dip de salsa secreta",
    ingredients: "Mayonesa, ketchup, mostaza y algo más.",
    price: 1000,
    img: "/dips/dip-salsa-secreta.svg",
    isAvailable: 1,
  },
];

export const bebidas = [
  {
    id: "coca_600",
    name: "Coca Cola 600ml",
    price: 2500,
    isAvailable: 1,
    img: "/bebidas/coca-cola-600ml.webp",
  },
  {
    id: "coca_zero_600",
    name: "Coca Cola Zero 600ml",
    orderName: "Coca Zero 600",
    price: 2500,
    isAvailable: 1,
    img: "/bebidas/coca-cola-zero-600.webp",
  },
  {
    id: "coca_175",
    name: "Coca Cola 1.75L",
    orderName: "Coca 1.75",
    price: 4500,
    isAvailable: 0,
    unavailableReason: "Sin stock",
    unavailableSince: "2026-10-01",
    unavailableShift: "noche",
    img: "/bebidas/coca-cola-175l.webp",
  },
  {
    id: "coca_zero_175",
    name: "Coca Cola Zero 1.75L",
    orderName: "Coca Zero 1.75",
    price: 4500,
    isAvailable: 1,
    img: "/bebidas/coca-cola-zero-175l.webp",
  },
];

export const cervezas = [];
