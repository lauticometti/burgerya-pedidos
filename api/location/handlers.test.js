import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeDeliveryQuote } from "../../src/hooks/useDeliveryQuote";

// Coordenadas ya verificadas contra el motor real de zonas (mismas que
// useDeliveryQuote.test.js): Malaspina en Z1 ($1000) y Leloir fuera de
// cobertura.
const Z1 = { lat: -34.600409, lng: -58.64632975 };
const FUERA = { lat: -34.6489, lng: -58.6564 };
// ~600 m al oeste del limite de la cobertura (misma que googleLocation.test.js).
const APENAS_FUERA = { lat: -34.6, lng: -58.68 };

const ENV_KEYS = [
  "GOOGLE_PLACES_API_KEY",
  "MAX_ADDRESS_SEARCH_SESSIONS_PER_DAY",
  "RATE_LIMIT_BLOCK_SEARCHES",
  "RATE_LIMIT_REVERSE_PER_WINDOW",
  "MAX_REVERSE_LOOKUPS_PER_DAY",
  "RATE_LIMIT_REVERSE_BURST_MAX",
  "RATE_LIMIT_IP_NEW_SESSIONS_PER_HOUR",
];

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function makeReq(body, cookie) {
  return {
    method: "POST",
    headers: cookie ? { cookie } : {},
    socket: { remoteAddress: "10.0.0.1" },
    body,
  };
}

function cookieFrom(res) {
  const setCookie = res.headers["set-cookie"];
  return setCookie ? setCookie.split(";")[0] : null;
}

function googleOk(coords = Z1) {
  return vi.fn(async (url) => {
    // detalle: GET .../v1/places/<id>; autocomplete: POST .../v1/places:autocomplete
    const isDetails = /\/v1\/places\/[^:]/.test(String(url));
    const body = isDetails
      ? {
          id: "id-1",
          formattedAddress: "Malaspina 1602, B1688 Villa Tesei, Provincia de Buenos Aires, Argentina",
          location: { latitude: coords.lat, longitude: coords.lng },
        }
      : {
          suggestions: [
            {
              placePrediction: {
                placeId: "id-1",
                text: { text: "Malaspina 1602, Villa Tesei, Provincia de Buenos Aires, Argentina" },
                structuredFormat: {
                  mainText: { text: "Malaspina 1602" },
                  secondaryText: { text: "Villa Tesei, Provincia de Buenos Aires, Argentina" },
                },
                types: ["street_address", "geocode"],
              },
            },
          ],
        };
    return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
  });
}

async function loadHandlers(env = {}) {
  vi.resetModules();
  for (const key of ENV_KEYS) delete process.env[key];
  process.env.GOOGLE_PLACES_API_KEY = "test-google-key";
  for (const [key, val] of Object.entries(env)) {
    if (val == null) delete process.env[key];
    else process.env[key] = String(val);
  }
  const autocomplete = (await import("./autocomplete.js")).default;
  const retrieve = (await import("./retrieve.js")).default;
  const reverse = (await import("./reverse.js")).default;
  return { autocomplete, retrieve, reverse };
}

let fetchMock;

beforeEach(() => {
  fetchMock = googleOk();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("busqueda de direccion: Google -> lat/lng -> zona -> precio", () => {
  it("autocomplete + retrieve devuelven lat/lng y el motor de zonas cotiza Zona 1 a $1000", async () => {
    const { autocomplete, retrieve } = await loadHandlers();

    const r1 = makeRes();
    await autocomplete(makeReq({ input: "Malaspina 1602", sessionToken: "tok-1" }), r1);
    expect(r1.statusCode).toBe(200);
    expect(r1.body.suggestions).toEqual([{ id: "id-1", text: "Malaspina 1602, Villa Tesei" }]);
    const cookie = cookieFrom(r1);
    expect(cookie).toMatch(/^bya_sid=/);

    const r2 = makeRes();
    await retrieve(makeReq({ id: "id-1", sessionToken: "tok-1" }, cookie), r2);
    expect(r2.statusCode).toBe(200);
    expect(r2.body.lat).toBe(Z1.lat);
    expect(r2.body.lng).toBe(Z1.lng);

    const quote = computeDeliveryQuote({ lat: r2.body.lat, lng: r2.body.lng, source: "search" }, "Delivery");
    expect(quote.status).toBe("covered");
    expect(quote.deliveryPrice).toBe(1000);
    expect(quote.zoneLabel).toBe("Zona 1");
  });

  it("una direccion fuera de cobertura queda sin precio", async () => {
    fetchMock = googleOk(FUERA);
    vi.stubGlobal("fetch", fetchMock);
    const { retrieve } = await loadHandlers();

    const res = makeRes();
    await retrieve(makeReq({ id: "id-1", sessionToken: "tok-1" }), res);
    expect(res.statusCode).toBe(200);

    const quote = computeDeliveryQuote({ lat: res.body.lat, lng: res.body.lng, source: "search" }, "Delivery");
    expect(quote.status).toBe("uncovered");
    expect(quote.deliveryPrice).toBe(null);
  });

  it("apenas afuera de la cobertura: la busqueda la encuentra y se puede elegir; solo getDeliveryZone dice 'no cubierto'", async () => {
    fetchMock = googleOk(APENAS_FUERA);
    vi.stubGlobal("fetch", fetchMock);
    const { autocomplete, retrieve } = await loadHandlers();

    const r1 = makeRes();
    await autocomplete(makeReq({ input: "Ruta 4 1200", sessionToken: "tok-1" }), r1);
    expect(r1.statusCode).toBe(200);
    expect(r1.body.suggestions).toHaveLength(1); // Google la encontro: no se filtra por cobertura

    const r2 = makeRes();
    await retrieve(makeReq({ id: "id-1", sessionToken: "tok-1" }, cookieFrom(r1)), r2);
    expect(r2.statusCode).toBe(200);
    expect(r2.body).toMatchObject({ lat: APENAS_FUERA.lat, lng: APENAS_FUERA.lng });

    const quote = computeDeliveryQuote({ lat: r2.body.lat, lng: r2.body.lng, source: "search" }, "Delivery");
    expect(quote.status).toBe("uncovered");
    expect(quote.covered).toBe(false);
    expect(quote.deliveryPrice).toBe(null);
  });

  it("'Google no encuentra la direccion' y 'Burger Ya no llega' son resultados distintos", async () => {
    // Google sin resultados: lista vacia y NINGUNA cotizacion (idle), no "uncovered".
    fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => "{}" }));
    vi.stubGlobal("fetch", fetchMock);
    const { autocomplete } = await loadHandlers();
    const notFound = makeRes();
    await autocomplete(makeReq({ input: "Zzzz 99999", sessionToken: "tok-1" }), notFound);
    expect(notFound.statusCode).toBe(200);
    expect(notFound.body.suggestions).toEqual([]);
    expect(computeDeliveryQuote(null, "Delivery").status).toBe("idle");

    // Direccion encontrada pero fuera de cobertura: si hay cotizacion, y es "uncovered".
    expect(computeDeliveryQuote({ ...APENAS_FUERA, source: "search" }, "Delivery").status).toBe("uncovered");
  });

  it("el token de Google nunca aparece en lo que se le devuelve al navegador", async () => {
    const { autocomplete, retrieve } = await loadHandlers();
    const r1 = makeRes();
    await autocomplete(makeReq({ input: "Malaspina 1602", sessionToken: "tok-1" }), r1);
    const r2 = makeRes();
    await retrieve(makeReq({ id: "id-1", sessionToken: "tok-1" }, cookieFrom(r1)), r2);
    expect(JSON.stringify([r1.body, r1.headers, r2.body, r2.headers])).not.toContain("test-google-key");
  });
});

describe("rate limit ANTES de llamar a Google", () => {
  it("una persona probando 25 direcciones distintas a ritmo humano nunca queda cortada y Google recibe todas", async () => {
    vi.useFakeTimers();
    const { autocomplete } = await loadHandlers();

    let cookie = null;
    const statuses = [];
    for (let i = 1; i <= 25; i++) {
      const res = makeRes();
      await autocomplete(makeReq({ input: `Calle Falsa ${i} 123`, sessionToken: `tok-humano-${i}` }, cookie), res);
      cookie = cookie || cookieFrom(res);
      statuses.push(res.statusCode);
      vi.advanceTimersByTime(4000);
    }
    expect(statuses).toEqual(Array(25).fill(200));
    expect(fetchMock).toHaveBeenCalledTimes(25);
  });

  it("una rafaga automatizada de busquedas completas queda frenada con 429 suspicious_activity y Google deja de recibir requests", async () => {
    const { autocomplete } = await loadHandlers();

    let cookie = null;
    const results = [];
    for (let i = 1; i <= 12; i++) {
      const res = makeRes();
      await autocomplete(makeReq({ input: `Calle Falsa ${i} 123`, sessionToken: `tok-rafaga-${i}` }, cookie), res);
      cookie = cookie || cookieFrom(res);
      results.push(res);
    }

    expect(results.slice(0, 8).map((r) => r.statusCode)).toEqual(Array(8).fill(200));
    expect(results.slice(8).map((r) => r.statusCode)).toEqual([429, 429, 429, 429]);
    // Google solo vio las 8 primeras: de la 9 en adelante se cortaron antes.
    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(results[8].body.error).toBe("suspicious_activity");
  });

  it("un limite responde un ESTADO EXPLICITO con mensaje visible; nunca un fallo generico ni 'Google roto'", async () => {
    const { autocomplete } = await loadHandlers();
    let cookie = null;
    let blocked;
    for (let i = 1; i <= 12; i++) {
      const res = makeRes();
      await autocomplete(makeReq({ input: `Calle Falsa ${i} 123`, sessionToken: `tok-x-${i}` }, cookie), res);
      cookie = cookie || cookieFrom(res);
      if (res.statusCode === 429) { blocked = res; break; }
    }
    expect(blocked.statusCode).toBe(429);
    expect(["rate_limited", "suspicious_activity"]).toContain(blocked.body.error);
    expect(blocked.body.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.body.message).toMatch(/Estás haciendo muchas búsquedas seguidas\./);
    expect(blocked.body.message).toMatch(/Esperá unos segundos o elegí tu ubicación en el mapa\./);
    // no se disfraza de error del proveedor
    expect(["upstream_error", "not_configured", "service_unavailable", "provider_quota_exhausted", "session_blocked"]).not.toContain(blocked.body.error);
    // y una respuesta bloqueada no trae direcciones ni coordenadas que pisen algo del cliente
    expect(blocked.body).not.toHaveProperty("suggestions");
    expect(blocked.body).not.toHaveProperty("lat");
    expect(blocked.body).not.toHaveProperty("address");
  });

  it("cada rechazo deja en el log QUE limite fue (funcion y motivo)", async () => {
    const { autocomplete } = await loadHandlers();
    let cookie = null;
    for (let i = 1; i <= 10; i++) {
      const res = makeRes();
      await autocomplete(makeReq({ input: `Calle Falsa ${i} 123`, sessionToken: `tok-log-${i}` }, cookie), res);
      cookie = cookie || cookieFrom(res);
    }
    const lines = console.warn.mock.calls.map((c) => String(c[0]));
    expect(lines.some((l) => /\[rate-limit\] suspicious_activity scope=search reason=burst/.test(l))).toBe(true);
  });

  it("una persona escribiendo una sola direccion (mismo session token, varias letras) nunca se bloquea", async () => {
    const { autocomplete } = await loadHandlers();

    let cookie = null;
    const statuses = [];
    for (const q of ["Mala", "Malas", "Malaspi", "Malaspina", "Malaspina 16", "Malaspina 160", "Malaspina 1602"]) {
      const res = makeRes();
      await autocomplete(makeReq({ input: q, sessionToken: "tok-una-sola-busqueda" }, cookie), res);
      cookie = cookie || cookieFrom(res);
      statuses.push(res.statusCode);
    }
    expect(statuses).toEqual(Array(7).fill(200));
  });

  it("menos del minimo de caracteres no llama a Google ni cuenta como busqueda", async () => {
    const { autocomplete } = await loadHandlers();
    const res = makeRes();
    await autocomplete(makeReq({ input: "ab", sessionToken: "tok-1" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.suggestions).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("el fusible global diario corta la creacion de sesiones nuevas y Google deja de recibir requests", async () => {
    const { autocomplete } = await loadHandlers({ MAX_ADDRESS_SEARCH_SESSIONS_PER_DAY: 2 });

    const statuses = [];
    for (let i = 1; i <= 4; i++) {
      // sin cookie: cada request es una sesion nueva
      const res = makeRes();
      await autocomplete(makeReq({ input: `Calle Falsa ${i} 123`, sessionToken: `tok-${i}` }), res);
      statuses.push(res.statusCode);
    }
    expect(statuses).toEqual([200, 200, 429, 429]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("configuracion y errores del proveedor", () => {
  it("sin GOOGLE_PLACES_API_KEY responde 503 seguro y nunca hace una llamada de red", async () => {
    const { autocomplete } = await loadHandlers({ GOOGLE_PLACES_API_KEY: null });
    const res = makeRes();
    await autocomplete(makeReq({ input: "Malaspina 1602", sessionToken: "tok-1" }), res);
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe("not_configured");
    expect(res.body.message).toMatch(/WhatsApp/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("si Google responde 429 (cuota) se devuelve un 503 seguro y NO se reintenta", async () => {
    fetchMock = vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({}),
      text: async () => "Rate limit exceeded",
    }));
    vi.stubGlobal("fetch", fetchMock);
    const { autocomplete } = await loadHandlers();

    const res = makeRes();
    await autocomplete(makeReq({ input: "Malaspina 1602", sessionToken: "tok-1" }), res);
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe("provider_quota_exhausted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("solo acepta POST", async () => {
    const { autocomplete } = await loadHandlers();
    const res = makeRes();
    await autocomplete({ ...makeReq({}), method: "GET" }, res);
    expect(res.statusCode).toBe(405);
  });
});

describe("reverse: pin -> direccion, con costos acotados", () => {
  const PIN = { lat: -34.602288, lng: -58.64289 };
  const reverseOk = () =>
    vi.fn(async () => {
      const body = {
        status: "OK",
        results: [
          {
            types: ["street_address"],
            formatted_address: "Beethoven 1234, B1686 Hurlingham, Provincia de Buenos Aires, Argentina",
            address_components: [
              { long_name: "1234", types: ["street_number"] },
              { long_name: "Beethoven", types: ["route"] },
              { long_name: "Hurlingham", types: ["locality", "political"] },
              { long_name: "Argentina", types: ["country", "political"] },
            ],
          },
        ],
      };
      return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
    });

  it("devuelve la direccion del pin (calle + localidad) y no filtra el token", async () => {
    fetchMock = reverseOk();
    vi.stubGlobal("fetch", fetchMock);
    const { reverse } = await loadHandlers();

    const res = makeRes();
    await reverse(makeReq(PIN), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ address: "Beethoven 1234, Hurlingham", kind: "address" });
    expect(JSON.stringify([res.body, res.headers])).not.toContain("test-google-key");
  });

  it("un pin fuera del area de servicio responde sin direccion y NO llama a Google", async () => {
    fetchMock = reverseOk();
    vi.stubGlobal("fetch", fetchMock);
    const { reverse } = await loadHandlers();

    const res = makeRes();
    await reverse(makeReq({ lat: -27.4, lng: -55.9 }), res); // Posadas
    expect(res.statusCode).toBe(200);
    expect(res.body.address).toBe(null);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("coordenadas invalidas dan 400 sin llamar a Google", async () => {
    fetchMock = reverseOk();
    vi.stubGlobal("fetch", fetchMock);
    const { reverse } = await loadHandlers();

    for (const body of [{}, { lat: "x", lng: 1 }, { lat: NaN, lng: 1 }, { lat: null, lng: null }]) {
      const res = makeRes();
      await reverse(makeReq(body), res);
      expect(res.statusCode).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("pasado el tope por sesion responde 429 y Google deja de recibir requests", async () => {
    fetchMock = reverseOk();
    vi.stubGlobal("fetch", fetchMock);
    const { reverse } = await loadHandlers({ RATE_LIMIT_REVERSE_PER_WINDOW: 3 });

    let cookie = null;
    const statuses = [];
    for (let i = 0; i < 6; i++) {
      const res = makeRes();
      await reverse(makeReq({ lat: PIN.lat + i * 0.0001, lng: PIN.lng }, cookie), res);
      cookie = cookie || cookieFrom(res);
      statuses.push(res.statusCode);
    }
    expect(statuses).toEqual([200, 200, 200, 429, 429, 429]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("el tope global diario corta todas las consultas, sin importar la sesion", async () => {
    fetchMock = reverseOk();
    vi.stubGlobal("fetch", fetchMock);
    const { reverse } = await loadHandlers({ MAX_REVERSE_LOOKUPS_PER_DAY: 2 });

    const statuses = [];
    for (let i = 0; i < 4; i++) {
      const res = makeRes();
      await reverse(makeReq({ lat: PIN.lat + i * 0.0001, lng: PIN.lng }), res); // sin cookie: sesion nueva cada vez
      statuses.push(res.statusCode);
    }
    expect(statuses).toEqual([200, 200, 429, 429]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("con las BUSQUEDAS limitadas, el mapa sigue resolviendo la calle y la direccion ya elegida sigue resolviendose", async () => {
    const places = googleOk();
    const geocoding = reverseOk();
    fetchMock = vi.fn((url, init) => (String(url).includes("geocode/json") ? geocoding(url, init) : places(url, init)));
    vi.stubGlobal("fetch", fetchMock);
    const { autocomplete, retrieve, reverse } = await loadHandlers();

    let cookie = null;
    let lastSearch;
    for (let i = 1; i <= 12; i++) {
      lastSearch = makeRes();
      await autocomplete(makeReq({ input: `Calle Falsa ${i} 123`, sessionToken: `tok-${i}` }, cookie), lastSearch);
      cookie = cookie || cookieFrom(lastSearch);
    }
    expect(lastSearch.statusCode).toBe(429); // las busquedas estan limitadas
    const callsBefore = fetchMock.mock.calls.length;

    // ...pero el mapa sigue funcionando: reverse geocoding con su propio contador
    const rev = makeRes();
    await reverse(makeReq(PIN, cookie), rev);
    expect(rev.statusCode).toBe(200);
    expect(rev.body.address).toBeTruthy();

    // ...y una direccion ya elegida (busqueda anterior a la rafaga) se puede resolver
    const ret = makeRes();
    await retrieve(makeReq({ id: "id-1", sessionToken: "tok-1" }, cookie), ret);
    expect(ret.statusCode).toBe(200);
    expect(ret.body.lat).toBe(Z1.lat);

    expect(fetchMock.mock.calls.length).toBe(callsBefore + 2);

    // y el calculo de zona/precio es local: sigue funcionando pase lo que pase con Places
    const quote = computeDeliveryQuote({ lat: ret.body.lat, lng: ret.body.lng, source: "map" }, "Delivery");
    expect(quote).toMatchObject({ status: "covered", zoneLabel: "Zona 1", deliveryPrice: 1000 });
  });

  it("con el reverse geocoding limitado, la busqueda sigue funcionando y el mensaje explica que el pin y el precio siguen", async () => {
    fetchMock = googleOk();
    vi.stubGlobal("fetch", fetchMock);
    const { autocomplete, reverse } = await loadHandlers({ RATE_LIMIT_REVERSE_BURST_MAX: 3 });

    let cookie = null;
    let limited;
    for (let i = 0; i < 6; i++) {
      const res = makeRes();
      await reverse(makeReq({ lat: PIN.lat + i * 0.0001, lng: PIN.lng }, cookie), res);
      cookie = cookie || cookieFrom(res);
      if (res.statusCode === 429) { limited = res; break; }
    }
    expect(limited.body.error).toBe("suspicious_activity");
    expect(limited.body.message).toMatch(/el pin y el precio de envío siguen funcionando/);

    const search = makeRes();
    await autocomplete(makeReq({ input: "Malaspina 1602", sessionToken: "tok-s" }, cookie), search);
    expect(search.statusCode).toBe(200);
    expect(search.body.suggestions.length).toBe(1);
  });

  it("el limite de sesiones nuevas por IP tambien es explicito (rate_limited) y queda en el log", async () => {
    fetchMock = googleOk();
    vi.stubGlobal("fetch", fetchMock);
    const { reverse } = await loadHandlers({ RATE_LIMIT_IP_NEW_SESSIONS_PER_HOUR: 2 });

    const statuses = [];
    let last;
    for (let i = 0; i < 4; i++) {
      last = makeRes();
      await reverse(makeReq(PIN), last); // sin cookie: sesion nueva cada vez
      statuses.push(last.statusCode);
    }
    expect(statuses).toEqual([200, 200, 429, 429]);
    expect(last.body).toMatchObject({ error: "rate_limited", reason: "ip_limit" });
    expect(last.body.message).toBeTruthy();
    expect(console.warn.mock.calls.some((c) => /scope=new_session reason=ip_limit/.test(String(c[0])))).toBe(true);
  });

  it("sin token responde 503 seguro y no hace llamadas; un 429 de Google no se reintenta", async () => {
    fetchMock = reverseOk();
    vi.stubGlobal("fetch", fetchMock);
    let { reverse } = await loadHandlers({ GOOGLE_PLACES_API_KEY: null });
    let res = makeRes();
    await reverse(makeReq(PIN), res);
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock = vi.fn(async () => ({ ok: false, status: 429, json: async () => ({}), text: async () => "limit" }));
    vi.stubGlobal("fetch", fetchMock);
    ({ reverse } = await loadHandlers());
    res = makeRes();
    await reverse(makeReq(PIN), res);
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe("provider_quota_exhausted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
