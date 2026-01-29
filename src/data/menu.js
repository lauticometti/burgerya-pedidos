export const WHATSAPP_NUMBER = "5491134158607";

// Burgers con precios (según flyers)
export const burgers = [
  // BASICAS
  {
    id: "cheese",
    name: "Cheese",
    tier: "BASICA",
    prices: { simple: 10500, doble: 13000, triple: 15500 },
    img: "/burgers/cheese.jpg",
  },
  {
    id: "cuarto",
    name: "Cuarto",
    tier: "BASICA",
    prices: { simple: 10500, doble: 13000, triple: 15500 },
    img: "/burgers/cuarto.jpg",
  },
  {
    id: "oklahoma",
    name: "Oklahoma",
    tier: "BASICA",
    prices: { simple: 10500, doble: 13000, triple: 15500 },
    img: "/burgers/oklahoma.jpg",
  },

  // PREMIUM
  {
    id: "lautiboom",
    name: "Lautiboom",
    tier: "PREMIUM",
    prices: { simple: 11000, doble: 13500, triple: 16000 },
    img: "/burgers/lautiboom.jpg",
  },
  {
    id: "american",
    name: "American",
    tier: "PREMIUM",
    prices: { simple: 11000, doble: 13500, triple: 16000 },
    img: "/burgers/american.jpg",
  },
  {
    id: "bacon",
    name: "Bacon",
    tier: "PREMIUM",
    prices: { simple: 11000, doble: 13500, triple: 16000 },
    img: "/burgers/bacon.jpg",
  },

  // DELUXE (incluye las 3 que faltaban)
  {
    id: "bbqueen",
    name: "BBQueen",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    img: "/burgers/bbqueen.jpg",
  },
  {
    id: "doritos",
    name: "Doritos",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    img: "/burgers/doritos.jpg",
  },
  {
    id: "cochina",
    name: "Cochina",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    img: "/burgers/cochina.jpg",
  },
  {
    id: "smoklahoma",
    name: "Smoklahoma",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    img: "/burgers/smoklahoma.jpg",
  }, // asumido
  {
    id: "sos",
    name: "SOS",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    img: "/burgers/sos.jpg",
  }, // asumido
  {
    id: "triunfos",
    name: "Triunfos",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    img: "/burgers/triunfos.jpg",
  }, // asumido

  // ESPECIALES (sin simple)
  {
    id: "titanica",
    name: "Titanica",
    tier: "ESPECIAL",
    prices: { doble: 17500, triple: 20000 },
    img: "/burgers/titanica.jpg",
  },
  {
    id: "bacon_deluxe",
    name: "Bacon Deluxe",
    tier: "ESPECIAL",
    prices: { doble: 16000, triple: 18500 },
    img: "/burgers/bacondeluxe.jpg",
  },
  {
    id: "big_smash",
    name: "Big Smash",
    tier: "ESPECIAL",
    prices: { doble: 14500, triple: 17000 },
    img: "/burgers/bigsmash.jpg",
  },
];

// Precios de promos (flyers)
export const promoPrices = {
  BASICA: {
    doble: { 2: 25000, 3: 37000, 4: 48000 },
    triple: { 2: 30000, 3: 44500, 4: 58000 },
  },
  PREMIUM: {
    doble: { 2: 26500, 3: 39000, 4: 51000 },
    triple: { 2: 31000, 3: 46000, 4: 61000 },
  },
  DELUXE: {
    doble: { 2: 27500, 3: 40500, 4: 53000 },
    triple: { 2: 32000, 3: 47000, 4: 62000 },
  },
};

// Reglas de qué puede elegir cada promo (como vos definiste)
export const promoRules = {
  BASICA: { allowedTiers: ["BASICA"] },
  PREMIUM: { allowedTiers: ["BASICA", "PREMIUM"] },
  DELUXE: { allowedTiers: ["BASICA", "PREMIUM", "DELUXE"] },
};

export const extras = [
  { id: "carne_cheddar", name: "Carne extra con cheddar", price: 3000 },
  { id: "carne_sin", name: "Carne extra sin cheddar", price: 2500 },
  { id: "cheddar_extra", name: "Cheddar extra (2 fetas)", price: 1000 },
  { id: "bacon_crocante", name: "Bacon crocante", price: 1500 },
  { id: "cebolla_caram", name: "Cebolla caramelizada", price: 600 },
  { id: "pepinos", name: "Pepinos en vinagre", price: 800 },
  { id: "huevo", name: "Huevo frito", price: 800 },
  { id: "doritos_burger", name: "Doritos en la burger", price: 800 },
  { id: "papas_burger", name: "Papas en la burger", price: 800 },
  { id: "lechuga", name: "Lechuga", price: 500 },
  { id: "tomate", name: "Tomate", price: 500 },
  { id: "cebolla", name: "Cebolla", price: 500 },
  { id: "salsas", name: "Salsas y aderezos", price: 500 },
];

export const papas = [
  { id: "cheddar_liq", name: "Cheddar líquido", price: 1500 },
  { id: "cheddar_liq_bacon", name: "Cheddar líquido + bacon", price: 3000 },
  { id: "porcion_extra", name: "Porción de papas extras", price: 3000 },

  { id: "porcion_grande_solas", name: "Porción grande solas", price: 9000 },
  {
    id: "porcion_grande_cheddar",
    name: "Porción grande con cheddar",
    price: 11000,
  },
  {
    id: "porcion_grande_cheddar_bacon",
    name: "Porción grande con cheddar y bacon",
    price: 13000,
  },

  { id: "dip_cheddar", name: "Dip de cheddar", price: 2500 },
  { id: "dip_mil_islas", name: "Dip de salsa mil islas", price: 1500 },
];
