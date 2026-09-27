import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ENV_KEYS = [
  "MAX_ADDRESS_SEARCH_SESSIONS_PER_DAY",
  "MAX_ADDRESS_SEARCH_SESSIONS_PER_MONTH",
  "RATE_LIMIT_IP_NEW_SESSIONS_PER_HOUR",
  "RATE_LIMIT_WARN_SEARCHES",
  "RATE_LIMIT_BLOCK_SEARCHES",
  "RATE_LIMIT_BLOCK_COOLDOWN_SECONDS",
  "RATE_LIMIT_WINDOW_SECONDS",
  "RATE_LIMIT_SEARCH_BURST_MAX",
  "RATE_LIMIT_BURST_SECONDS",
  "RATE_LIMIT_SEARCH_REQUESTS_PER_MINUTE",
  "RATE_LIMIT_SUSPICIOUS_COOLDOWN_SECONDS",
  "RATE_LIMIT_RETRIEVE_PER_WINDOW",
  "RATE_LIMIT_RETRIEVE_BURST_MAX",
  "RATE_LIMIT_REVERSE_PER_WINDOW",
  "RATE_LIMIT_REVERSE_BURST_MAX",
  "RATE_LIMIT_REVERSE_WINDOW_SECONDS",
  "MAX_REVERSE_LOOKUPS_PER_DAY",
];

// Cada test necesita su propia config y su propio almacen en memoria, sin
// contaminarse entre tests. vi.resetModules() + import dinamico logra ambas
// cosas: rateLimit.js relee sus env vars al cargarse, y arrastra una
// instancia nueva de rateLimitStore.js (Maps en memoria vacios).
async function freshRateLimit(envOverrides = {}) {
  vi.resetModules();
  for (const key of ENV_KEYS) delete process.env[key];
  for (const [key, val] of Object.entries(envOverrides)) {
    process.env[key] = String(val);
  }
  return import("./rateLimit.js");
}

// Ritmo de una persona: una busqueda nueva cada varios segundos.
const HUMAN_PACE_MS = 4000;
const pace = () => vi.advanceTimersByTime(HUMAN_PACE_MS);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-24T15:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  for (const key of ENV_KEYS) delete process.env[key];
});

describe("registerNewSession", () => {
  it("permite crear sesiones nuevas en condiciones normales", async () => {
    const { registerNewSession } = await freshRateLimit();
    const result = await registerNewSession("ip-hash-normal");
    expect(result.allowed).toBe(true);
  });

  it("dispara el fusible global diario y bloquea sesiones nuevas a partir del limite", async () => {
    const { registerNewSession } = await freshRateLimit({ MAX_ADDRESS_SEARCH_SESSIONS_PER_DAY: 2 });
    const r1 = await registerNewSession("ip-a");
    const r2 = await registerNewSession("ip-b");
    const r3 = await registerNewSession("ip-c");
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
    expect(r3.reason).toBe("global_limit");
    expect(r3.state).toBe("rate_limited"); // explicito, nunca un fallo generico
  });

  it("bloquea por IP cuando una misma IP crea demasiadas sesiones nuevas seguidas", async () => {
    const { registerNewSession } = await freshRateLimit({ RATE_LIMIT_IP_NEW_SESSIONS_PER_HOUR: 2 });
    const ip = "misma-ip-hasheada";
    const r1 = await registerNewSession(ip);
    const r2 = await registerNewSession(ip);
    const r3 = await registerNewSession(ip);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
    expect(r3.reason).toBe("ip_limit");
    expect(r3.state).toBe("rate_limited");
  });

  it("IPs distintas no comparten el contador de limite por IP", async () => {
    const { registerNewSession } = await freshRateLimit({ RATE_LIMIT_IP_NEW_SESSIONS_PER_HOUR: 1 });
    const r1 = await registerNewSession("ip-x");
    const r2 = await registerNewSession("ip-y");
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });
});

describe("registerSearch: una busqueda = un session token, no un keystroke", () => {
  it("reusar el mismo session token (varias letras tipeadas) no suma busquedas distintas", async () => {
    const { registerSearch } = await freshRateLimit();
    const sessionId = "sess-tipeo-lento";
    const r1 = await registerSearch(sessionId, "token-unico");
    const r2 = await registerSearch(sessionId, "token-unico");
    const r3 = await registerSearch(sessionId, "token-unico");
    expect(r1.distinctCount).toBe(1);
    expect(r2.distinctCount).toBe(1);
    expect(r3.distinctCount).toBe(1);
    expect(r3.blocked).toBe(false);
    expect(r3.usage).toBe("normal");
  });

  it("sesiones distintas no comparten contador de busquedas", async () => {
    const { registerSearch } = await freshRateLimit({ RATE_LIMIT_BLOCK_SEARCHES: 2 });
    for (const t of ["a", "b"]) expect((await registerSearch("sess-1", t)).blocked).toBe(false);
    const other = await registerSearch("sess-2", "c");
    expect(other.blocked).toBe(false);
    expect(other.distinctCount).toBe(1);
  });
});

describe("politica para una PERSONA: nunca queda cortada probando direcciones", () => {
  it("20 busquedas distintas a ritmo humano siguen funcionando, todas como uso normal", async () => {
    const { registerSearch } = await freshRateLimit();
    for (let i = 1; i <= 20; i++) {
      const r = await registerSearch("persona", `tok-${i}`);
      expect(r.blocked).toBe(false);
      expect(r.usage).toBe("normal");
      pace();
    }
  });

  it("25 busquedas humanas siguen funcionando: de la 21 en adelante se registran como uso alto, sin bloquear", async () => {
    const { registerSearch } = await freshRateLimit();
    const usages = [];
    for (let i = 1; i <= 25; i++) {
      const r = await registerSearch("persona", `tok-${i}`);
      expect(r.blocked).toBe(false);
      usages.push(r.usage);
      pace();
    }
    expect(usages.slice(0, 20).every((u) => u === "normal")).toBe(true);
    expect(usages.slice(20)).toEqual(Array(5).fill("high"));
  });

  it("40 busquedas en 10 minutos todavia se permiten; la 41 es rate_limited con espera de minutos", async () => {
    const { registerSearch } = await freshRateLimit();
    let last;
    for (let i = 1; i <= 40; i++) {
      last = await registerSearch("persona", `tok-${i}`);
      expect(last.blocked).toBe(false);
      pace();
    }
    expect(last.usage).toBe("high");

    const over = await registerSearch("persona", "tok-41");
    expect(over.blocked).toBe(true);
    expect(over.state).toBe("rate_limited");
    expect(over.reason).toBe("too_many_searches");
    expect(over.retryAfterSeconds).toBeGreaterThan(0);
    expect(over.retryAfterSeconds).toBeLessThanOrEqual(300); // minutos, no 1 hora
  });

  it("la ventana es fija: seguir usando la web pasados los 10 minutos NO acumula contra el limite", async () => {
    const { registerSearch } = await freshRateLimit();
    // 30 busquedas, esperar 11 minutos, 30 mas: nunca mas de 30 en una ventana.
    for (let i = 1; i <= 30; i++) {
      expect((await registerSearch("persona", `a-${i}`)).blocked).toBe(false);
      pace();
    }
    vi.advanceTimersByTime(11 * 60 * 1000);
    for (let i = 1; i <= 30; i++) {
      const r = await registerSearch("persona", `b-${i}`);
      expect(r.blocked).toBe(false);
      pace();
    }
  });

  it("el bloqueo es temporal: pasada la espera la persona vuelve a poder buscar", async () => {
    const { registerSearch } = await freshRateLimit({ RATE_LIMIT_BLOCK_SEARCHES: 2, RATE_LIMIT_BLOCK_COOLDOWN_SECONDS: 120 });
    await registerSearch("persona", "t1");
    pace();
    await registerSearch("persona", "t2");
    pace();
    const blocked = await registerSearch("persona", "t3");
    expect(blocked.blocked).toBe(true);
    expect(blocked.retryAfterSeconds).toBe(120);

    // mientras dura la espera sigue bloqueada, sin llegar a contar nada
    const still = await registerSearch("persona", "t4");
    expect(still.blocked).toBe(true);
    expect(still.distinctCount).toBe(null);

    vi.advanceTimersByTime(121 * 1000);
    // ventana de 10 min sigue vigente con 3 tokens contados > 2, pero tras la
    // espera se vuelve a evaluar: con el mismo token (misma busqueda) no cuenta de nuevo
    const again = await registerSearch("persona", "t1");
    expect(again.blocked).toBe(false);
  });
});

describe("comportamiento automatizado: ahi si se protege, con estado explicito", () => {
  it("una rafaga de busquedas completas en segundos es suspicious_activity, con espera corta", async () => {
    const { registerSearch } = await freshRateLimit();
    const results = [];
    for (let i = 1; i <= 12; i++) results.push(await registerSearch("bot", `rafaga-${i}`)); // sin pausas
    expect(results.slice(0, 8).every((r) => !r.blocked)).toBe(true);
    const blocked = results[8];
    expect(blocked.blocked).toBe(true);
    expect(blocked.state).toBe("suspicious_activity");
    expect(blocked.reason).toBe("burst");
    expect(blocked.retryAfterSeconds).toBe(60);
    expect(results.slice(9).every((r) => r.blocked && r.state === "suspicious_activity")).toBe(true);
  });

  it("frecuencia imposible con un mismo token (martillar el endpoint) tambien es suspicious_activity", async () => {
    const { registerSearch } = await freshRateLimit({ RATE_LIMIT_SEARCH_REQUESTS_PER_MINUTE: 30 });
    let blockedAt = null;
    for (let i = 1; i <= 40; i++) {
      const r = await registerSearch("bot", "mismo-token");
      if (r.blocked && blockedAt == null) {
        blockedAt = i;
        expect(r.state).toBe("suspicious_activity");
        expect(r.reason).toBe("request_rate");
      }
    }
    expect(blockedAt).toBe(31);
  });

  it("tipear una direccion (muchos pedidos con el mismo token) a ritmo humano nunca se bloquea", async () => {
    const { registerSearch } = await freshRateLimit();
    for (let i = 0; i < 40; i++) {
      expect((await registerSearch("persona", "una-direccion")).blocked).toBe(false);
      vi.advanceTimersByTime(700); // ~ debounce + tipeo
    }
  });

  it("pasada la espera corta de una rafaga se puede volver a buscar", async () => {
    const { registerSearch } = await freshRateLimit();
    for (let i = 1; i <= 9; i++) await registerSearch("bot", `r-${i}`);
    expect((await registerSearch("bot", "r-10")).blocked).toBe(true);
    vi.advanceTimersByTime(61 * 1000);
    expect((await registerSearch("bot", "otra-busqueda")).blocked).toBe(false);
  });
});

describe("contadores SEPARADOS: buscar, elegir y geocodificar no se pisan", () => {
  it("una sesion con las busquedas limitadas SIGUE pudiendo geocodificar el pin y elegir una direccion", async () => {
    const { registerSearch, registerReverse, registerRetrieve } = await freshRateLimit();
    for (let i = 1; i <= 10; i++) await registerSearch("persona", `r-${i}`); // rafaga: busquedas bloqueadas
    expect((await registerSearch("persona", "otra")).blocked).toBe(true);

    expect((await registerReverse("persona")).allowed).toBe(true);
    expect((await registerRetrieve("persona")).allowed).toBe(true);
  });

  it("el limite de reverse geocoding no bloquea la busqueda", async () => {
    const { registerSearch, registerReverse } = await freshRateLimit({ RATE_LIMIT_REVERSE_BURST_MAX: 3 });
    for (let i = 0; i < 6; i++) await registerReverse("persona");
    expect((await registerReverse("persona")).allowed).toBe(false);

    const search = await registerSearch("persona", "busqueda-normal");
    expect(search.blocked).toBe(false);
  });

  it("cada funcion cuenta lo suyo: 30 busquedas no gastan el cupo de reverse", async () => {
    const { registerSearch, registerReverse } = await freshRateLimit({ RATE_LIMIT_REVERSE_PER_WINDOW: 2 });
    for (let i = 1; i <= 30; i++) {
      await registerSearch("persona", `t-${i}`);
      pace();
    }
    expect((await registerReverse("persona")).allowed).toBe(true);
    expect((await registerReverse("persona")).allowed).toBe(true);
    expect((await registerReverse("persona")).allowed).toBe(false); // recien aca, por SUS propios 2
  });

  it("distintas sesiones no comparten cupos de reverse ni de retrieve", async () => {
    const { registerReverse, registerRetrieve } = await freshRateLimit({ RATE_LIMIT_REVERSE_PER_WINDOW: 1, RATE_LIMIT_RETRIEVE_PER_WINDOW: 1 });
    expect((await registerReverse("a")).allowed).toBe(true);
    expect((await registerReverse("a")).allowed).toBe(false);
    expect((await registerReverse("b")).allowed).toBe(true);
    expect((await registerRetrieve("a")).allowed).toBe(true);
    expect((await registerRetrieve("a")).allowed).toBe(false);
    expect((await registerRetrieve("b")).allowed).toBe(true);
  });
});

describe("registerReverse", () => {
  it("una persona moviendo el pin a ritmo humano (60 veces en 10 minutos) nunca queda cortada", async () => {
    const { registerReverse } = await freshRateLimit();
    for (let i = 1; i <= 60; i++) {
      const r = await registerReverse("persona");
      expect(r.allowed).toBe(true);
      vi.advanceTimersByTime(3000);
    }
  });

  it("pasado el tope sostenido de la ventana responde rate_limited (no suspicious) con espera de minutos", async () => {
    const { registerReverse } = await freshRateLimit({ RATE_LIMIT_REVERSE_PER_WINDOW: 5 });
    for (let i = 1; i <= 5; i++) {
      expect((await registerReverse("persona")).allowed).toBe(true);
      vi.advanceTimersByTime(3000);
    }
    const over = await registerReverse("persona");
    expect(over.allowed).toBe(false);
    expect(over.state).toBe("rate_limited");
    expect(over.reason).toBe("session_limit");
    expect(over.retryAfterSeconds).toBeGreaterThan(90);
  });

  it("una rafaga imposible para una persona es suspicious_activity con espera corta", async () => {
    const { registerReverse } = await freshRateLimit({ RATE_LIMIT_REVERSE_BURST_MAX: 5 });
    const results = [];
    for (let i = 1; i <= 8; i++) results.push(await registerReverse("bot"));
    expect(results.slice(0, 5).every((r) => r.allowed)).toBe(true);
    expect(results[5]).toMatchObject({ allowed: false, state: "suspicious_activity", reason: "burst", retryAfterSeconds: 60 });
  });

  it("el tope global diario sigue vigente y las llamadas rechazadas no gastan cuota", async () => {
    const { registerReverse } = await freshRateLimit({ MAX_REVERSE_LOOKUPS_PER_DAY: 2 });
    expect((await registerReverse("a")).allowed).toBe(true);
    expect((await registerReverse("b")).allowed).toBe(true);
    const r3 = await registerReverse("c");
    expect(r3).toMatchObject({ allowed: false, state: "rate_limited", reason: "global_limit" });
  });
});

describe("registerRetrieve", () => {
  it("elegir direcciones a ritmo humano no se bloquea; una rafaga si", async () => {
    const { registerRetrieve } = await freshRateLimit();
    for (let i = 0; i < 20; i++) {
      expect((await registerRetrieve("persona")).allowed).toBe(true);
      vi.advanceTimersByTime(4000);
    }
    const results = [];
    for (let i = 0; i < 15; i++) results.push(await registerRetrieve("bot"));
    expect(results[12]).toMatchObject({ allowed: false, state: "suspicious_activity" });
  });
});

describe("globalFuseStatus", () => {
  it("no esta activado con contadores en cero", async () => {
    const { globalFuseStatus } = await freshRateLimit();
    const status = await globalFuseStatus();
    expect(status.tripped).toBe(false);
    expect(status.dayCount).toBe(0);
    expect(status.monthCount).toBe(0);
  });

  it("se activa cuando el contador diario alcanza el maximo configurado", async () => {
    const { globalFuseStatus, registerNewSession } = await freshRateLimit({
      MAX_ADDRESS_SEARCH_SESSIONS_PER_DAY: 1,
    });
    await registerNewSession("ip-1");
    const status = await globalFuseStatus();
    expect(status.tripped).toBe(true);
  });
});
