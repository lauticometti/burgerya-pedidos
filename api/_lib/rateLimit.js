import { incrWithTTL, getValue, setWithTTL } from "./rateLimitStore.js";

// Politica de limites. Objetivo: una PERSONA que prueba direcciones a mano
// (15, 25, 40 seguidas) nunca queda cortada; solo se frena comportamiento
// imposible para una persona (rafagas, ritmo de maquina, sesiones a lo loco).
//
// Cada funcion de la API tiene sus CONTADORES Y BLOQUEOS PROPIOS ("search",
// "retrieve", "reverse"): buscar muchas direcciones no le quita al mapa la
// posibilidad de resolver una calle, ni al reves. Los fusibles globales
// (sesiones nuevas por dia/mes, IP, consultas de pin por dia/mes) siguen igual.
//
// Toda decision negativa trae un `state` explicito para que el frontend lo
// muestre y no parezca que "Google esta roto":
//   - "rate_limited":         demasiado uso sostenido (esperar).
//   - "suspicious_activity":  ritmo imposible para una persona (rafaga).

export const RATE_LIMITED = "rate_limited";
export const SUSPICIOUS_ACTIVITY = "suspicious_activity";

// Todos los limites son configurables por env var, con estos defaults.
const cfg = {
  // --- Busquedas (autocomplete). Una "busqueda" = un session token nuevo. ---
  // Hasta `normalSearches` distintas en la ventana: uso normal. Entre
  // `normalSearches`+1 y `maxSearches`: se permite pero queda registrado como
  // uso alto. Por encima de `maxSearches`: rate_limited.
  normalSearches: Number(process.env.RATE_LIMIT_WARN_SEARCHES ?? 20),
  maxSearches: Number(process.env.RATE_LIMIT_BLOCK_SEARCHES ?? 40),
  windowSeconds: Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 600), // 10 min
  // Espera tras pasar `maxSearches` (antes era 1 hora: mucho para una persona).
  blockCooldownSeconds: Number(process.env.RATE_LIMIT_BLOCK_COOLDOWN_SECONDS ?? 300),
  // Rafagas: mas de N busquedas DISTINTAS en `burstSeconds` es imposible para
  // una persona (cada una exige tipear una direccion). Espera corta.
  searchBurstMax: Number(process.env.RATE_LIMIT_SEARCH_BURST_MAX ?? 8),
  burstSeconds: Number(process.env.RATE_LIMIT_BURST_SECONDS ?? 15),
  // Pedidos de autocomplete por minuto de una sesion (tipear con debounce no
  // pasa de ~2 por segundo).
  searchRequestsPerMinute: Number(process.env.RATE_LIMIT_SEARCH_REQUESTS_PER_MINUTE ?? 90),
  suspiciousCooldownSeconds: Number(process.env.RATE_LIMIT_SUSPICIOUS_COOLDOWN_SECONDS ?? 60),
  // --- Direccion elegida de la lista (retrieve): una por direccion elegida. ---
  retrievePerWindow: Number(process.env.RATE_LIMIT_RETRIEVE_PER_WINDOW ?? 60),
  retrieveBurstMax: Number(process.env.RATE_LIMIT_RETRIEVE_BURST_MAX ?? 12),
  // --- Geocodificacion inversa (pin -> direccion): una por pin confirmado. ---
  reversePerWindow: Number(process.env.RATE_LIMIT_REVERSE_PER_WINDOW ?? 60),
  reverseBurstMax: Number(process.env.RATE_LIMIT_REVERSE_BURST_MAX ?? 15),
  reverseWindowSeconds: Number(process.env.RATE_LIMIT_REVERSE_WINDOW_SECONDS ?? 600),
  maxReversePerDay: Number(process.env.MAX_REVERSE_LOOKUPS_PER_DAY ?? 2000),
  maxReversePerMonth: Number(process.env.MAX_REVERSE_LOOKUPS_PER_MONTH ?? 30000),
  // --- Sesiones nuevas (fusibles globales + por IP): sin cambios. ---
  ipNewSessionsPerHour: Number(process.env.RATE_LIMIT_IP_NEW_SESSIONS_PER_HOUR ?? 20),
  maxSessionsPerDay: Number(process.env.MAX_ADDRESS_SEARCH_SESSIONS_PER_DAY ?? 300),
  maxSessionsPerMonth: Number(process.env.MAX_ADDRESS_SEARCH_SESSIONS_PER_MONTH ?? 5000),
};

export function getRateLimitConfig() {
  return { ...cfg };
}

function todayKey(now = new Date()) {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}
function monthKey(now = new Date()) {
  return now.toISOString().slice(0, 7); // YYYY-MM
}

// ---- Bloqueos por sesion Y por funcion (nunca compartidos entre funciones) ----

const blockKey = (scope, state, sessionId) => `blocked:${scope}:${state}:${sessionId}`;

async function readBlock(scope, sessionId) {
  const now = Date.now();
  for (const state of [SUSPICIOUS_ACTIVITY, RATE_LIMITED]) {
    const until = await getValue(blockKey(scope, state, sessionId));
    if (until != null && until > now) {
      return { state, retryAfterSeconds: Math.ceil((until - now) / 1000) };
    }
  }
  return null;
}

async function setBlock(scope, state, sessionId, cooldownSeconds, reason) {
  await setWithTTL(blockKey(scope, state, sessionId), Date.now() + cooldownSeconds * 1000, cooldownSeconds);
  return { state, reason, retryAfterSeconds: cooldownSeconds };
}

/**
 * Fusible global: cuantas sesiones NUEVAS se crearon hoy/este mes, contra el
 * tope duro configurado. Es de solo lectura — no incrementa nada, para poder
 * chequearlo antes de decidir si vale la pena crear la sesion.
 */
export async function globalFuseStatus(now = new Date()) {
  const [day, month] = await Promise.all([
    getValue(`global:day:${todayKey(now)}`),
    getValue(`global:month:${monthKey(now)}`),
  ]);
  const dayCount = day ?? 0;
  const monthCount = month ?? 0;
  return {
    tripped: dayCount >= cfg.maxSessionsPerDay || monthCount >= cfg.maxSessionsPerMonth,
    dayCount,
    monthCount,
    maxPerDay: cfg.maxSessionsPerDay,
    maxPerMonth: cfg.maxSessionsPerMonth,
  };
}

/**
 * Registra una sesion nueva: chequea el fusible global y el limite por IP
 * ANTES de contarla, y si esta todo bien, incrementa los contadores.
 * Devuelve {allowed, state, reason} — solo se llenan cuando allowed=false.
 */
export async function registerNewSession(ipHash, now = new Date()) {
  const fuse = await globalFuseStatus(now);
  if (fuse.tripped) {
    return { allowed: false, state: RATE_LIMITED, reason: "global_limit" };
  }

  // Limite por IP: cuantas sesiones NUEVAS crea esta IP por hora. Esto es lo
  // que frena "borro la cookie y arranco de nuevo" — bloquea la creacion de
  // sesiones nuevas desde esa IP, no las ya existentes.
  const ipKey = `newsessions:ip:${ipHash}`;
  const ipCount = await incrWithTTL(ipKey, 3600);
  if (ipCount > cfg.ipNewSessionsPerHour) {
    return { allowed: false, state: RATE_LIMITED, reason: "ip_limit", retryAfterSeconds: 3600 };
  }

  await Promise.all([
    incrWithTTL(`global:day:${todayKey(now)}`, 60 * 60 * 24 * 2), // TTL generoso, se resetea solo por cambiar de key diaria
    incrWithTTL(`global:month:${monthKey(now)}`, 60 * 60 * 24 * 40),
  ]);

  return { allowed: true };
}

// Ritmo de una funcion (retrieve / reverse) por sesion: primero la rafaga
// (imposible para una persona -> suspicious_activity, espera corta) y despues
// el tope sostenido de la ventana (rate_limited).
async function guardScope(scope, sessionId, { burstMax, windowMax, windowSeconds }) {
  const blocked = await readBlock(scope, sessionId);
  if (blocked) return { allowed: false, ...blocked, reason: "cooldown" };

  const burst = await incrWithTTL(`${scope}:burst:${sessionId}`, cfg.burstSeconds);
  if (burst > burstMax) {
    return { allowed: false, ...(await setBlock(scope, SUSPICIOUS_ACTIVITY, sessionId, cfg.suspiciousCooldownSeconds, "burst")) };
  }

  const count = await incrWithTTL(`${scope}:count:${sessionId}`, windowSeconds);
  if (count > windowMax) {
    return { allowed: false, state: RATE_LIMITED, reason: "session_limit", retryAfterSeconds: windowSeconds };
  }
  return { allowed: true };
}

/**
 * Cuenta una direccion elegida de la lista (retrieve), con contadores propios.
 * Devuelve {allowed, state?, reason?, retryAfterSeconds?}.
 */
export async function registerRetrieve(sessionId) {
  return guardScope("retrieve", sessionId, {
    burstMax: cfg.retrieveBurstMax,
    windowMax: cfg.retrievePerWindow,
    windowSeconds: cfg.windowSeconds,
  });
}

/**
 * Cuenta una geocodificacion inversa ANTES de llamar al proveedor. Orden:
 * topes globales (dia/mes) -> ritmo de la sesion -> recien ahi se suma a los
 * contadores globales. Las llamadas rechazadas no gastan cuota. Contadores y
 * bloqueos PROPIOS: nada de lo que pase con las busquedas la afecta.
 * Devuelve {allowed, state?, reason?, retryAfterSeconds?}.
 */
export async function registerReverse(sessionId, now = new Date()) {
  const dayKey = `global:reverse:day:${todayKey(now)}`;
  const monthKeyStr = `global:reverse:month:${monthKey(now)}`;

  const [day, month] = await Promise.all([getValue(dayKey), getValue(monthKeyStr)]);
  if ((day ?? 0) >= cfg.maxReversePerDay || (month ?? 0) >= cfg.maxReversePerMonth) {
    return { allowed: false, state: RATE_LIMITED, reason: "global_limit" };
  }

  const decision = await guardScope("reverse", sessionId, {
    burstMax: cfg.reverseBurstMax,
    windowMax: cfg.reversePerWindow,
    windowSeconds: cfg.reverseWindowSeconds,
  });
  if (!decision.allowed) return decision;

  await Promise.all([
    incrWithTTL(dayKey, 60 * 60 * 24 * 2),
    incrWithTTL(monthKeyStr, 60 * 60 * 24 * 40),
  ]);
  return { allowed: true };
}

/**
 * Registra un pedido de autocomplete. `googleSessionToken` identifica la
 * busqueda (un token nuevo = una busqueda distinta, el mismo concepto con el
 * que Google factura); teclear mas letras de la misma direccion reusa el token
 * y no cuenta como otra busqueda.
 *
 * Devuelve:
 *   {blocked:false, distinctCount, usage: "normal"|"high"}
 *   {blocked:true, state, reason, retryAfterSeconds, distinctCount}
 * `usage: "high"` = entre normalSearches+1 y maxSearches: se permite y se
 * registra, no se bloquea.
 */
export async function registerSearch(sessionId, googleSessionToken) {
  const already = await readBlock("search", sessionId);
  if (already) {
    return { blocked: true, ...already, reason: "cooldown", distinctCount: null };
  }

  // 1) Ritmo de pedidos: tipear con debounce no pasa de ~2 por segundo.
  const perMinute = await incrWithTTL(`search:req:${sessionId}`, 60);
  if (perMinute > cfg.searchRequestsPerMinute) {
    const block = await setBlock("search", SUSPICIOUS_ACTIVITY, sessionId, cfg.suspiciousCooldownSeconds, "request_rate");
    return { blocked: true, ...block, distinctCount: null };
  }

  // 2) Es una busqueda nueva? (token nunca visto en la ventana). El token viene
  // del cliente: se acota el largo para no inflar claves.
  const tokenKey = `search:tok:${sessionId}:${String(googleSessionToken).slice(0, 64)}`;
  const isNewSearch = (await incrWithTTL(tokenKey, cfg.windowSeconds)) === 1;
  if (!isNewSearch) {
    const distinctCount = (await getValue(`search:distinct:${sessionId}`)) ?? 1;
    return { blocked: false, distinctCount, usage: distinctCount > cfg.normalSearches ? "high" : "normal" };
  }

  // 3) Rafaga de busquedas distintas: imposible para una persona.
  const burst = await incrWithTTL(`search:burst:${sessionId}`, cfg.burstSeconds);
  if (burst > cfg.searchBurstMax) {
    const block = await setBlock("search", SUSPICIOUS_ACTIVITY, sessionId, cfg.suspiciousCooldownSeconds, "burst");
    return { blocked: true, ...block, distinctCount: null };
  }

  // 4) Busquedas distintas en la ventana (ventana FIJA: no se estira mientras
  // la persona sigue usando la web).
  const distinctCount = await incrWithTTL(`search:distinct:${sessionId}`, cfg.windowSeconds);
  if (distinctCount > cfg.maxSearches) {
    const block = await setBlock("search", RATE_LIMITED, sessionId, cfg.blockCooldownSeconds, "too_many_searches");
    return { blocked: true, ...block, distinctCount };
  }

  return { blocked: false, distinctCount, usage: distinctCount > cfg.normalSearches ? "high" : "normal" };
}
