export const WHATSAPP_NUMBER = "5491134158607";

// Burgers con precios
export const burgers = [
  // BASICAS
  {
    id: "cheese",
    name: "Cheese",
    tier: "BASICA",
    prices: { simple: 10500, doble: 13500, triple: 16500 },
    desc: "Pan de papa · Carne smash · Cheddar",
    img: "/burgers/cheese.svg",
    isAvailable: 1,
  },

  // PREMIUM
  {
    id: "lautiboom",
    name: "Lautiboom",
    tier: "PREMIUM",
    prices: { simple: 11500, doble: 14500, triple: 17500 },
    desc: "Pan de papa · Carne smash · Cebolla caramelizada · Cheddar · Mil Islas.",
    img: "/burgers/lautiboom.svg",
    isAvailable: 1,
  },
  {
    id: "american",
    name: "American",
    tier: "PREMIUM",
    prices: { simple: 11500, doble: 14500, triple: 17500 },
    desc: "Pan de papa · Carne smash · Lechuga · Tomate · Cebolla · Pepinos · Cheddar · Mil Islas",
    img: "/burgers/american.svg",
    isAvailable: 1,
  },
  {
    id: "bacon",
    name: "Bacon",
    tier: "PREMIUM",
    prices: { simple: 11500, doble: 14500, triple: 17500 },
    desc: "Pan de papa · Carne smash · Bacon · Cheddar",
    img: "/burgers/bacon.svg",
    isAvailable: 1,
  },

  // DELUXE
  {
    id: "bbqueen",
    name: "BBQueen",
    tier: "DELUXE",
    prices: { simple: 12000, doble: 15000, triple: 18000 },
    desc: "Pan de papa · Carne smash · Bacon · Tomate · Cebolla caramelizada · Cheddar · Barbacoa",
    img: "/burgers/bbqueen.svg",
    isAvailable: 1,
  },
  {
    id: "smoklahoma",
    name: "Smoklahoma",
    tier: "DELUXE",
    prices: { simple: 12000, doble: 15000, triple: 18000 },
    desc: "Pan de papa · Carne smash con cebolla ultrafina · Bacon · Cheddar · Mil Islas",
    img: "/burgers/smoklahoma.svg",
    isAvailable: 0,
  },

  // ESPECIALES (sin simple)
  {
    id: "titanica",
    name: "Titanica",
    tier: "ESPECIAL",
    prices: { triple: 27000 },
    desc: "Doble pan de papa relleno con cheddar · Carne smash · Bacon abajo y arriba · Cebolla caramelizada · Cheddar · Mil Islas",
    img: "/burgers/titanica.svg",
    isAvailable: 1,
  },
];

// Precios de promos (flyers)
export const promoPrices = {
  BASICA: {
    doble: { 2: 26500, 3: 39500, 4: 52500 },
    triple: { 2: 32000, 3: 47500, 4: 63000 },
  },
  PREMIUM: {
    doble: { 2: 28000, 3: 41500, 4: 55000 },
    triple: { 2: 34000, 3: 50000, 4: 66000 },
  },
  DELUXE: {
    doble: { 2: 29000, 3: 43000, 4: 57000 },
    triple: { 2: 35000, 3: 51000, 4: 68000 },
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
    name: "Carne extra c/ cheddar",
    price: 3000,
    isAvailable: 1,
  },
  {
    id: "cheddar_extra",
    name: "Cheddar extra (2 fetas)",
    price: 1000,
    isAvailable: 1,
  },
  { id: "bacon_crocante", name: "Bacon", price: 1500, isAvailable: 1 },
  {
    id: "cebolla_caram",
    name: "Cebolla caramelizada",
    price: 600,
    isAvailable: 1,
  },
  { id: "pepinos", name: "Pepinos", price: 800, isAvailable: 1 },
  { id: "huevo", name: "Huevo frito", price: 800, isAvailable: 1 },
  { id: "papas_burger", name: "Papas", price: 800, isAvailable: 1 },
  { id: "lechuga", name: "Lechuga", price: 500, isAvailable: 1 },
  { id: "tomate", name: "Tomate", price: 500, isAvailable: 1 },
  { id: "cebolla", name: "Cebolla", price: 500, isAvailable: 1 },
  { id: "salsa_mil_islas", name: "Mil Islas", price: 500, isAvailable: 1 },
  { id: "salsa_bbq", name: "Barbacoa", price: 500, isAvailable: 1 },
  { id: "salsa_ketchup", name: "Ketchup", price: 500, isAvailable: 1 },
  { id: "salsa_mostaza", name: "Mostaza", price: 500, isAvailable: 1 },
];

export const papas = [
  {
    id: "cheddar_liq",
    name: "Cheddar",
    price: 1500,
    isAvailable: 1,
    unavailableReason: undefined,
  },
  { id: "papas_bacon", name: "Bacon", price: 1500, isAvailable: 1 },
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
  },
  {
    id: "porcion_grande_cheddar",
    name: "Porción grande con cheddar",
    price: 11000,
    isAvailable: 1,
    unavailableReason: undefined,
  },
  {
    id: "porcion_grande_cheddar_bacon",
    name: "Porción grande con cheddar y bacon",
    price: 13000,
    isAvailable: 1,
    unavailableReason: undefined,
  },
  {
    id: "dip_cheddar",
    name: "Dip de cheddar",
    price: 2000,
    isAvailable: 1,
    unavailableReason: undefined,
  },
  {
    id: "dip_mil_islas",
    name: "Dip de Mil Islas",
    price: 1500,
    isAvailable: 1,
  },
];

export const bebidas = [
  { id: "coca_600", name: "Coca Cola 600ml", price: 2500, isAvailable: 1 },
  { id: "coca_225", name: "Coca Cola 2.25L", price: 6000, isAvailable: 1 },
];
