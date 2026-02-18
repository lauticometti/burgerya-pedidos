export const WHATSAPP_NUMBER = "5491134158607";

// Burgers con precios
export const burgers = [
  // BASICAS
  {
    id: "cheese",
    name: "Cheese",
    tier: "BASICA",
    prices: { simple: 10500, doble: 13000, triple: 15500 },
    desc: "Pan de papa · Carne smash · Cheddar",
    img: "/burgers/cheese.jpg",
  },
  {
    id: "cuarto",
    name: "Cuarto",
    tier: "BASICA",
    prices: { simple: 10500, doble: 13000, triple: 15500 },
    desc: "Pan de papa · Carne smash · Ketchup · Mostaza · Cebolla · Cheddar",
    img: "/burgers/cuarto.jpg",
  },
  {
    id: "oklahoma",
    name: "Oklahoma",
    tier: "BASICA",
    prices: { simple: 10500, doble: 13000, triple: 15500 },
    desc: "Pan de papa · Carne smash con cebolla ultrafina · Cheddar",
    img: "/burgers/oklahoma.jpg",
  },

  // PREMIUM
  {
    id: "lautiboom",
    name: "Lautiboom",
    tier: "PREMIUM",
    prices: { simple: 11000, doble: 13500, triple: 16000 },
    desc: "Pan de papa · Carne smash · Cebolla caramelizada · Cheddar · Mil Islas.",
    img: "/burgers/lautiboom.jpg",
  },
  {
    id: "american",
    name: "American",
    tier: "PREMIUM",
    prices: { simple: 11000, doble: 13500, triple: 16000 },
    desc: "Pan de papa · Carne smash · Lechuga · Tomate · Cebolla · Pepinos · Cheddar · Mil Islas",
    img: "/burgers/american.jpg",
  },
  {
    id: "bacon",
    name: "Bacon",
    tier: "PREMIUM",
    prices: { simple: 11000, doble: 13500, triple: 16000 },
    desc: "Pan de papa · Carne smash · Bacon · Cheddar",
    img: "/burgers/bacon.jpg",
  },

  // DELUXE (incluye las 3 que faltaban)
  {
    id: "bbqueen",
    name: "BBQueen",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    desc: "Pan de papa · Carne smash · Bacon · Tomate · Cebolla caramelizada · Cheddar · Barbacoa",
    img: "/burgers/bbqueen.jpg",
  },
  {
    id: "doritos",
    name: "Doritos",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    desc: "Pan de papa · Carne smash · Bacon · Doritos · Cheddar · Barbacoa",
    img: "/burgers/doritos.jpg",
    isAvailable: false,
    unavailableReason: "no disponible por hoy",
  },
  {
    id: "cochina",
    name: "Cochina",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    desc: "Pan de papa · Carne smash · Huevo frito · Papas · Cheddar",
    img: "/burgers/cochina.jpg",
  },
  {
    id: "smoklahoma",
    name: "Smoklahoma",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    desc: "Pan de papa · Carne smash con cebolla ultrafina · Bacon · Cheddar · Mil Islas",
    img: "/burgers/smoklahoma.jpg",
  }, // asumido
  {
    id: "sos",
    name: "SOS",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    desc: "Pan de papa · Carne smash · Bacon · Huevo frito · Papas · Cheddar",
    img: "/burgers/sos.jpg",
  }, // asumido
  {
    id: "triunfos",
    name: "Triunfos",
    tier: "DELUXE",
    prices: { simple: 11500, doble: 14000, triple: 16500 },
    desc: "Pan de papa · Carne Smash · Bacon · Cebolla caramelizada · Cheddar · Mil Islas.",
    img: "/burgers/triunfos.jpg",
  }, // asumido

  // ESPECIALES (sin simple)
  {
    id: "titanica",
    name: "Titanica",
    tier: "ESPECIAL",
    prices: { doble: 17500, triple: 20000 },
    desc: "Doble pan de papa relleno con cheddar · Carne smash · Bacon abajo y arriba · Cebolla caramelizada · Cheddar · Mil Islas",
    img: "/burgers/titanica.jpg",
  },
  {
    id: "bacon_deluxe",
    name: "Bacon Deluxe",
    tier: "ESPECIAL",
    prices: { doble: 16000, triple: 18500 },
    desc: "Pan de papa · Carne smash · Bacon en todas las carnes · Mil Islas",
    img: "/burgers/bacondeluxe.jpg",
  },
  {
    id: "big_smash",
    name: "Big Smash",
    tier: "ESPECIAL",
    prices: { doble: 14500, triple: 17000 },
    desc: "Pan de papa especial · Carne smash · Lechuga · Pepinos · Cheddar · Mil Islas",
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
  { id: "carne_cheddar", name: "Carne extra c/ cheddar", price: 3000 },
  { id: "cheddar_extra", name: "Cheddar extra (2 fetas)", price: 1000 },
  { id: "bacon_crocante", name: "Bacon", price: 1500 },
  { id: "cebolla_caram", name: "Cebolla caramelizada", price: 600 },
  { id: "pepinos", name: "Pepinos", price: 800 },
  { id: "huevo", name: "Huevo frito", price: 800 },
  {
    id: "doritos_burger",
    name: "Doritos",
    price: 800,
    isAvailable: false,
    unavailableReason: "no disponible por hoy",
  },
  { id: "papas_burger", name: "Papas", price: 800 },
  {
    id: "lechuga",
    name: "Lechuga",
    price: 500,
  },
  {
    id: "tomate",
    name: "Tomate",
    price: 500,
  },
  { id: "cebolla", name: "Cebolla", price: 500 },
  { id: "salsa_mil_islas", name: "Mil Islas", price: 500 },
  { id: "salsa_bbq", name: "Barbacoa", price: 500 },
  { id: "salsa_ketchup", name: "Ketchup", price: 500 },
  { id: "salsa_mostaza", name: "Mostaza", price: 500 },
];

export const papas = [
  {
    id: "cheddar_liq",
    name: "Cheddar",
    price: 1500,
    isAvailable: false,
    unavailableReason: "no disponible por hoy",
  },
  { id: "papas_bacon", name: "Bacon", price: 1500 },
  { id: "porcion_extra", name: "Porción de papas extras", price: 3000 },

  { id: "porcion_grande_solas", name: "Porción grande sola", price: 9000 },
  {
    id: "porcion_grande_cheddar",
    name: "Porción grande con cheddar",
    price: 11000,
    isAvailable: false,
    unavailableReason: "no disponible por hoy",
  },
  {
    id: "porcion_grande_cheddar_bacon",
    name: "Porción grande con cheddar y bacon",
    price: 13000,
    isAvailable: false,
    unavailableReason: "no disponible por hoy",
  },

  {
    id: "dip_cheddar",
    name: "Dip de cheddar",
    price: 2000,
    isAvailable: false,
    unavailableReason: "no disponible por hoy",
  },
  { id: "dip_mil_islas", name: "Dip de Mil Islas", price: 1500 },
];
export const bebidas = [
  {
    id: "coca_600",
    name: "Coca Cola 600ml",
    price: 2500,
    isAvailable: false,
    unavailableReason: "no disponible por hoy",
  },
  { id: "coca_225", name: "Coca Cola 2.25L", price: 6000 },
];





