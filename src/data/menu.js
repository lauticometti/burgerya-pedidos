export const WHATSAPP_NUMBER = "5491134158607";

// Burgers con precios
export const burgers = [
  // ESPECIAL DEL DIA
  {
    id: "cheese_promo",
    name: "Cheese simple sin papas",
    shortName: "Cheese simple",
    tier: "ESPECIAL",
    prices: { simple: 7000 },
    desc: "pan de papa, carne smash, doble cheddar. sin papas.",
    removableIngredients: [{ id: "cheddar", label: "Cheddar" }],
    img: "/burgers/cheese-simple-promo.png",
    isAvailable: 1,
  },

  // BASICAS
  {
    id: "cheese",
    name: "Cheese",
    tier: "BASICA",
    prices: { simple: 11000, doble: 14500, triple: 18000 },
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
    prices: { simple: 12000, doble: 15500, triple: 19000 },
    desc: "Cebolla caramelizada · Salsa especial",
    removableIngredients: [
      { id: "cheddar", label: "Cheddar" },
      { id: "mil_islas", label: "Salsa Mil Islas" },
      { id: "caramelized_onion", label: "Cebolla caramelizada" },
    ],
    img: "/burgers/lautiboom.svg",
    isAvailable: 0,
    unavailableReason: "hoy solo cheese y bacon",
  },
  {
    id: "american",
    name: "American",
    tier: "PREMIUM",
    prices: { simple: 12000, doble: 15500, triple: 19000 },
    desc: "Lechuga · Tomate · Cebolla · Pepinos · Salsa especial",
    removableIngredients: [
      { id: "cheddar", label: "Cheddar" },
      { id: "pickles", label: "Pepinos agridulces" },
      { id: "tomato", label: "Tomate" },
      { id: "lettuce", label: "Lechuga" },
      { id: "onion", label: "Cebolla" },
      { id: "mil_islas", label: "Salsa Mil Islas" },
    ],
    img: "/burgers/american.svg",
    isAvailable: 0,
    unavailableReason: "hoy solo cheese y bacon",
  },
  {
    id: "bacon",
    name: "Bacon",
    tier: "PREMIUM",
    prices: { simple: 12000, doble: 15500, triple: 19000 },
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
    prices: { simple: 12500, doble: 16000, triple: 19500 },
    desc: "Bacon · Cebolla caramelizada · Tomate · Salsa barbacoa",
    removableIngredients: [
      { id: "cheddar", label: "Cheddar" },
      { id: "bacon", label: "Bacon" },
      { id: "bbq_sauce", label: "Salsa barbacoa" },
      { id: "tomato", label: "Tomate" },
      { id: "caramelized_onion", label: "Cebolla caramelizada" },
    ],
    img: "/burgers/bbqueen.svg",
    isAvailable: 0,
    unavailableReason: "hoy solo cheese y bacon",
  },
  {
    id: "smoklahoma",
    name: "Smoklahoma",
    tier: "DELUXE",
    prices: { simple: 12500, doble: 16000, triple: 19500 },
    desc: "Carne con cebolla ultrafina · Bacon · Salsa especial",
    removableIngredients: [
      { id: "cheddar", label: "Cheddar" },
      { id: "onion", label: "Cebolla" },
      { id: "mil_islas", label: "Salsa Mil Islas" },
      { id: "bacon", label: "Bacon" },
    ],
    img: "/burgers/smoklahoma.svg",
    isAvailable: 0,
    unavailableReason: "hoy solo cheese y bacon",
  },
];

// Precios de promos (flyers)
export const promoPrices = {
  BASICA: {
    doble: { 2: 27000, 3: 40000, 4: 53000 },
    triple: { 2: 34000, 3: 50000, 4: 66000 },
  },
  PREMIUM: {
    doble: { 2: 29000, 3: 43000, 4: 57000 },
    triple: { 2: 36000, 3: 53000, 4: 70000 },
  },
  DELUXE: {
    doble: { 2: 30000, 3: 44000, 4: 58000 },
    triple: { 2: 37000, 3: 54500, 4: 72000 },
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
    price: 3500,
    isAvailable: 1,
  },
  { id: "bacon_crocante", name: "Bacon", price: 1500, isAvailable: 1 },
  { id: "cheddar", name: "Extra cheddar", price: 500, isAvailable: 1 },
  {
    id: "cebolla_caram",
    name: "Cebolla caramelizada",
    price: 500,
    isAvailable: 1,
  },
  { id: "pepinos", name: "Pepinos", price: 500, isAvailable: 1 },
  { id: "lechuga", name: "Lechuga", price: 500, isAvailable: 1 },
  { id: "tomate", name: "Tomate", price: 500, isAvailable: 1 },
  { id: "cebolla", name: "Cebolla", price: 500, isAvailable: 1 },
  { id: "salsa_mil_islas", name: "Mil Islas", price: 500, isAvailable: 1 },
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
    img: "/bebidas/coca-cola-600ml.svg",
  },
  {
    id: "coca_225",
    name: "Coca Cola 2.25L",
    orderName: "Coca 2.25",
    price: 6000,
    isAvailable: 0,
    unavailableReason: "coca no nos mando de 2.25",
    img: "/bebidas/coca-cola-225l.svg",
  },
];

export const cervezas = [];
