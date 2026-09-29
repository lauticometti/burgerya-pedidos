// Almacen persistente/atomico para los contadores de rate limit.
//
// - Si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN estan configuradas,
//   se usa Upstash Redis (REST API, sin SDK adicional — es solo HTTP) con
//   INCR + EXPIRE atomicos. Esto es lo que corre en produccion.
// - Si no estan configuradas, se cae a un Map en memoria del proceso. Esto
//   es CORRECTO en dev local (el server de Vite es un solo proceso Node que
//   vive mientras dura `npm run dev`, no hay cold starts ni instancias
//   multiples), pero NUNCA debe usarse en produccion real: cada invocacion
//   serverless de Vercel puede ser un proceso distinto y los contadores se
//   reiniciarian solos, exactamente lo que no queremos.
//
// isProductionWithoutRedis() sirve para que los endpoints puedan fallar
// cerrado (bloquear en vez de dejar pasar) si en produccion real falta la
// configuracion de Redis, en vez de degradar en silencio a memoria falsa.

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

export function isProductionWithoutRedis() {
  return process.env.VERCEL_ENV === "production" && !hasRedis;
}

export function usingMemoryStore() {
  return !hasRedis;
}

// ---- Upstash Redis (REST) ----
async function upstashCommand(parts) {
  const res = await fetch(`${UPSTASH_URL}/${parts.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function redisIncrWithTTL(key, ttlSeconds) {
  const count = await upstashCommand(["INCR", key]);
  if (count === 1) {
    // recien creada esta clave: le ponemos vencimiento
    await upstashCommand(["EXPIRE", key, String(ttlSeconds)]);
  }
  return count;
}

async function redisGet(key) {
  const val = await upstashCommand(["GET", key]);
  return val == null ? null : Number(val);
}

async function redisSetWithTTL(key, value, ttlSeconds) {
  await upstashCommand(["SET", key, String(value), "EX", String(ttlSeconds)]);
}

async function redisAddToSetWithTTL(key, member, ttlSeconds) {
  await upstashCommand(["SADD", key, member]);
  await upstashCommand(["EXPIRE", key, String(ttlSeconds)]);
  const size = await upstashCommand(["SCARD", key]);
  return size;
}

// ---- Memory fallback (solo dev local) ----
const memStore = new Map(); // key -> { value, expiresAt }
const memSets = new Map(); // key -> { members: Set, expiresAt }

function memPrune(key) {
  const entry = memStore.get(key);
  if (entry && entry.expiresAt <= Date.now()) memStore.delete(key);
  const setEntry = memSets.get(key);
  if (setEntry && setEntry.expiresAt <= Date.now()) memSets.delete(key);
}

function memIncrWithTTL(key, ttlSeconds) {
  memPrune(key);
  const entry = memStore.get(key);
  if (!entry) {
    memStore.set(key, { value: 1, expiresAt: Date.now() + ttlSeconds * 1000 });
    return 1;
  }
  entry.value += 1;
  return entry.value;
}

function memGet(key) {
  memPrune(key);
  const entry = memStore.get(key);
  return entry ? entry.value : null;
}

function memSetWithTTL(key, value, ttlSeconds) {
  memStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memAddToSetWithTTL(key, member, ttlSeconds) {
  memPrune(key);
  let entry = memSets.get(key);
  if (!entry) {
    entry = { members: new Set(), expiresAt: Date.now() + ttlSeconds * 1000 };
    memSets.set(key, entry);
  }
  entry.members.add(member);
  entry.expiresAt = Date.now() + ttlSeconds * 1000;
  return entry.members.size;
}

// ---- API publica (misma firma sea cual sea el backend) ----

/** Incrementa un contador atomico con TTL (se crea con TTL si no existia). */
export async function incrWithTTL(key, ttlSeconds) {
  return hasRedis ? redisIncrWithTTL(key, ttlSeconds) : memIncrWithTTL(key, ttlSeconds);
}

/** Lee un valor numerico guardado (o null si no existe / vencio). */
export async function getValue(key) {
  return hasRedis ? redisGet(key) : memGet(key);
}

/** Guarda un valor con TTL, pisando lo que hubiera. */
export async function setWithTTL(key, value, ttlSeconds) {
  return hasRedis ? redisSetWithTTL(key, value, ttlSeconds) : memSetWithTTL(key, value, ttlSeconds);
}

/** Agrega un miembro a un set con TTL deslizante, devuelve el tamano actual. */
export async function addToSetWithTTL(key, member, ttlSeconds) {
  return hasRedis ? redisAddToSetWithTTL(key, member, ttlSeconds) : memAddToSetWithTTL(key, member, ttlSeconds);
}
