import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { suggest, retrieve, reverse, isConfigured, GooglePlacesError } from "./googleLocation.js";
import { SEARCH_BIAS } from "./searchArea.js";
import { getCoverageBounds, getDeliveryZone } from "../../src/utils/deliveryZones";

function jsonResponse(body, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

let fetchMock;

beforeEach(() => {
  process.env.GOOGLE_PLACES_API_KEY = "test-google-key";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  delete process.env.GOOGLE_PLACES_API_KEY;
  vi.unstubAllGlobals();
});

const prediction = (placeId, main, secondary, types) => ({
  placePrediction: {
    placeId,
    text: { text: `${main}, ${secondary}` },
    structuredFormat: { mainText: { text: main }, secondaryText: { text: secondary } },
    ...(types ? { types } : {}),
  },
});

describe("isConfigured", () => {
  it("es false sin GOOGLE_PLACES_API_KEY y true con ella", () => {
    expect(isConfigured()).toBe(true);
    delete process.env.GOOGLE_PLACES_API_KEY;
    expect(isConfigured()).toBe(false);
  });
});

describe("suggest (Places API New: autocomplete)", () => {
  it("hace POST con la key en header, session token, espanol, Argentina y SESGO (no restriccion) hacia la cobertura", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ suggestions: [] }));
    await suggest("Beethoven 1234", "sess-uuid-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places:autocomplete");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Goog-Api-Key"]).toBe("test-google-key");

    const body = JSON.parse(init.body);
    expect(body.input).toBe("Beethoven 1234");
    expect(body.sessionToken).toBe("sess-uuid-1");
    expect(body.languageCode).toBe("es");
    expect(body.includedRegionCodes).toEqual(["ar"]);
    expect(body.locationBias.circle).toEqual({
      center: SEARCH_BIAS.center,
      radius: SEARCH_BIAS.radiusMeters,
    });
    // La key va en el header, nunca en la URL.
    expect(url).not.toContain("test-google-key");
  });

  it("NUNCA restringe la busqueda a la cobertura: no manda locationRestriction (una direccion apenas afuera igual tiene que aparecer)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ suggestions: [] }));
    await suggest("Beethoven 1234", "t");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).not.toHaveProperty("locationRestriction");
    expect(JSON.stringify(body)).not.toMatch(/restriction/i);
  });

  it("el sesgo es fuerte pero valido: el circulo cubre TODA la cobertura de reparto y respeta el maximo de Google (50 km)", () => {
    const rad = (d) => (d * Math.PI) / 180;
    const metersFromCenter = (lat, lng) => {
      const dLat = rad(lat - SEARCH_BIAS.center.latitude);
      const dLng = rad(lng - SEARCH_BIAS.center.longitude);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(SEARCH_BIAS.center.latitude)) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2;
      return 2 * 6371000 * Math.asin(Math.sqrt(a));
    };
    const b = getCoverageBounds();
    for (const [lat, lng] of [
      [b.north, b.west],
      [b.north, b.east],
      [b.south, b.west],
      [b.south, b.east],
    ]) {
      expect(metersFromCenter(lat, lng)).toBeLessThan(SEARCH_BIAS.radiusMeters);
    }
    expect(SEARCH_BIAS.radiusMeters).toBeGreaterThan(0);
    expect(SEARCH_BIAS.radiusMeters).toBeLessThanOrEqual(50000);
  });

  it("una direccion apenas afuera de la cobertura igual aparece en la busqueda; el motor de zonas despues dice que no llegamos", async () => {
    // Punto ~600 m al oeste del limite de la cobertura, dentro del sesgo.
    const justOutside = { lat: -34.6, lng: -58.68 };
    expect(getDeliveryZone(justOutside.lat, justOutside.lng).covered).toBe(false);

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        suggestions: [prediction("afuera-1", "Ruta 4 1200", "William C. Morris, Provincia de Buenos Aires, Argentina", ["street_address", "geocode"])],
      }),
    );
    // La busqueda devuelve la sugerencia: Google la encontro, sin filtrar por cobertura.
    expect(await suggest("Ruta 4 1200", "t")).toEqual([{ id: "afuera-1", text: "Ruta 4 1200, William C. Morris" }]);

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        formattedAddress: "Ruta 4 1200, William C. Morris, Buenos Aires, Argentina",
        location: { latitude: justOutside.lat, longitude: justOutside.lng },
      }),
    );
    // Y se puede elegir: retrieve devuelve sus coordenadas (no las descarta por estar fuera).
    expect(await retrieve("afuera-1", "t")).toMatchObject({ lat: justOutside.lat, lng: justOutside.lng });
  });

  it("manda origin (el centro del sesgo) para que Google devuelva la distancia de cada sugerencia", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ suggestions: [] }));
    await suggest("Vergara 1799", "t");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).origin).toEqual(SEARCH_BIAS.center);
  });

  it("sube las sugerencias de la zona de reparto sin descartar las lejanas (caso Vergara 1799: Florida venia primero)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        suggestions: [
          { placePrediction: { ...prediction("florida", "Gobernador Valentín Vergara 1799", "Florida, Provincia de Buenos Aires, Argentina", ["street_address"]).placePrediction, distanceMeters: 15200 } },
          { placePrediction: { ...prediction("tesei", "Avenida Gobernador Vergara 1799", "Villa Tesei, Provincia de Buenos Aires, Argentina", ["street_address"]).placePrediction, distanceMeters: 1100 } },
          { placePrediction: { ...prediction("sin-dist", "Vergara 1799", "Otra, Argentina", ["street_address"]).placePrediction } },
        ],
      }),
    );
    expect((await suggest("Gobernador Vergara 1799", "t")).map((x) => x.id)).toEqual(["tesei", "florida", "sin-dist"]);
  });

  it("devuelve id + calle/altura + localidad, sin codigo postal, provincia ni pais", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        suggestions: [
          prediction("pid-1", "Beethoven 1234", "B1686 Hurlingham, Provincia de Buenos Aires, Argentina", ["street_address", "geocode"]),
          prediction("pid-2", "Malaspina 1602", "Villa Tesei, Provincia de Buenos Aires, Argentina", ["premise", "geocode"]),
        ],
      }),
    );
    expect(await suggest("Beethoven 1234", "t")).toEqual([
      { id: "pid-1", text: "Beethoven 1234, Hurlingham" },
      { id: "pid-2", text: "Malaspina 1602, Villa Tesei" },
    ]);
  });

  it("no ofrece calles sin altura (un unico punto para toda la calle puede dar otro precio de envio)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        suggestions: [
          prediction("calle", "Beethoven", "Hurlingham, Provincia de Buenos Aires, Argentina", ["route", "geocode"]),
          prediction("casa", "Beethoven 1234", "Hurlingham, Provincia de Buenos Aires, Argentina", ["street_address", "geocode"]),
        ],
      }),
    );
    expect((await suggest("Beethoven", "t")).map((s) => s.id)).toEqual(["casa"]);
  });

  it("conserva locales/comercios y las predicciones que no traen tipos", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        suggestions: [
          prediction("local", "Burger Ya", "Hurlingham, Provincia de Buenos Aires, Argentina", ["establishment", "point_of_interest", "route"]),
          prediction("sin-tipos", "Roca 1500", "Villa Tesei, Provincia de Buenos Aires, Argentina"),
        ],
      }),
    );
    expect((await suggest("Roca", "t")).map((s) => s.id)).toEqual(["local", "sin-tipos"]);
  });

  it("ignora sugerencias que no son de lugar (queryPrediction) y respuestas vacias", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ suggestions: [{ queryPrediction: { text: { text: "algo" } } }] }));
    expect(await suggest("algo", "t")).toEqual([]);
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    expect(await suggest("algo", "t")).toEqual([]);
  });

  it("un 429 se propaga como GooglePlacesError y NO se reintenta", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: { status: "RESOURCE_EXHAUSTED" } }, { status: 429 }));
    const err = await suggest("Beethoven 1234", "t").catch((e) => e);
    expect(err).toBeInstanceOf(GooglePlacesError);
    expect(err.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sin key falla antes de hacer cualquier llamada de red", async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    await expect(suggest("Beethoven 1234", "t")).rejects.toThrow(/no configurada/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("retrieve (Places API New: detalle del lugar)", () => {
  it("pide solo id/direccion/ubicacion con el mismo session token y devuelve lat/lng", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: "pid-1", formattedAddress: "Beethoven 1234, B1686 Hurlingham, Buenos Aires, Argentina", location: { latitude: -34.602288, longitude: -58.64289 } }),
    );
    const place = await retrieve("pid-1", "sess-uuid-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("https://places.googleapis.com/v1/places/pid-1");
    expect(new URL(url).searchParams.get("sessionToken")).toBe("sess-uuid-1");
    expect(init.headers["X-Goog-FieldMask"]).toBe("id,formattedAddress,location");
    expect(init.headers["X-Goog-Api-Key"]).toBe("test-google-key");
    expect(url).not.toContain("test-google-key");
    expect(place).toEqual({
      formattedAddress: "Beethoven 1234, B1686 Hurlingham, Buenos Aires, Argentina",
      lat: -34.602288,
      lng: -58.64289,
    });
  });

  it("codifica el placeId en la URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ location: { latitude: 1, longitude: 2 } }));
    await retrieve("a/b c", "t");
    expect(fetchMock.mock.calls[0][0]).toContain("/places/a%2Fb%20c?");
  });

  it("sin coordenadas validas devuelve null", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ formattedAddress: "x" }));
    expect(await retrieve("pid", "t")).toBe(null);
  });

  it("un error de Google se propaga sin reintentar", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 403 }));
    const err = await retrieve("pid", "t").catch((e) => e);
    expect(err).toBeInstanceOf(GooglePlacesError);
    expect(err.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("reverse (Geocoding API: pin -> direccion)", () => {
  const geocode = (results, status = "OK") => jsonResponse({ status, results });
  const components = (route, number, locality) => [
    ...(number ? [{ long_name: number, types: ["street_number"] }] : []),
    ...(route ? [{ long_name: route, types: ["route"] }] : []),
    ...(locality ? [{ long_name: locality, types: ["locality", "political"] }] : []),
    { long_name: "Provincia de Buenos Aires", types: ["administrative_area_level_1", "political"] },
    { long_name: "Argentina", types: ["country", "political"] },
  ];

  it("arma la URL con latlng, espanol, Argentina y tipos de resultado; la key va como parametro del servidor", async () => {
    fetchMock.mockResolvedValue(geocode([]));
    await reverse(-34.602288, -58.64289);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe("https://maps.googleapis.com/maps/api/geocode/json");
    expect(url.searchParams.get("latlng")).toBe("-34.602288,-58.64289");
    expect(url.searchParams.get("language")).toBe("es");
    expect(url.searchParams.get("region")).toBe("ar");
    expect(url.searchParams.get("result_type")).toBe("street_address|premise|route");
    expect(url.searchParams.get("key")).toBe("test-google-key");
  });

  it("devuelve calle + altura + localidad, sin provincia ni pais", async () => {
    fetchMock.mockResolvedValue(
      geocode([{ types: ["street_address"], address_components: components("Beethoven", "1234", "Hurlingham") }]),
    );
    expect(await reverse(1, 2)).toEqual({ address: "Beethoven 1234, Hurlingham", kind: "address" });
  });

  it("prefiere la direccion con altura aunque Google la devuelva despues de la calle", async () => {
    fetchMock.mockResolvedValue(
      geocode([
        { types: ["route"], address_components: components("Beethoven", null, "Hurlingham") },
        { types: ["street_address"], address_components: components("Beethoven", "1234", "Hurlingham") },
      ]),
    );
    expect((await reverse(1, 2)).address).toBe("Beethoven 1234, Hurlingham");
  });

  it("si solo hay calle devuelve el nombre sin numero (la UI le pide la altura al cliente)", async () => {
    fetchMock.mockResolvedValue(geocode([{ types: ["route"], address_components: components("Paso Morales", null, "Hurlingham") }]));
    expect(await reverse(1, 2)).toEqual({ address: "Paso Morales", kind: "street" });
  });

  it("descarta los caminos sin nombre ('Unnamed Road') y usa la siguiente opcion; si no hay otra devuelve null", async () => {
    fetchMock.mockResolvedValueOnce(
      geocode([
        { types: ["route"], address_components: components("Unnamed Road", null, "Hurlingham") },
        { types: ["route"], address_components: components("Ruta Provincial 201", null, "Hurlingham") },
      ]),
    );
    expect(await reverse(1, 2)).toEqual({ address: "Ruta Provincial 201", kind: "street" });

    fetchMock.mockResolvedValueOnce(
      geocode([{ types: ["route"], address_components: components("Unnamed Road", null, "Hurlingham") }]),
    );
    expect(await reverse(1, 2)).toBe(null);
  });

  it("sin localidad devuelve solo calle y altura", async () => {
    fetchMock.mockResolvedValue(geocode([{ types: ["street_address"], address_components: components("Beethoven", "1234", null) }]));
    expect(await reverse(1, 2)).toEqual({ address: "Beethoven 1234", kind: "address" });
  });

  it("ZERO_RESULTS o lista vacia devuelve null", async () => {
    fetchMock.mockResolvedValueOnce(geocode([], "ZERO_RESULTS"));
    expect(await reverse(1, 2)).toBe(null);
    fetchMock.mockResolvedValueOnce(geocode([]));
    expect(await reverse(1, 2)).toBe(null);
  });

  it("los errores que Google manda con HTTP 200 se propagan sin reintentar (cuota -> 429, key rechazada -> 403)", async () => {
    fetchMock.mockResolvedValueOnce(geocode([], "OVER_QUERY_LIMIT"));
    const quota = await reverse(1, 2).catch((e) => e);
    expect(quota).toBeInstanceOf(GooglePlacesError);
    expect(quota.status).toBe(429);

    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "REQUEST_DENIED", results: [], error_message: "API key invalida" }));
    const denied = await reverse(1, 2).catch((e) => e);
    expect(denied.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("un HTTP 429 tambien se propaga; siempre es UNA sola llamada por pin", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 429 }));
    const err = await reverse(1, 2).catch((e) => e);
    expect(err.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(geocode([{ types: ["route"], address_components: components("Calle 5", null, "Haedo") }]));
    await reverse(1, 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sin key falla antes de hacer cualquier llamada de red", async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    await expect(reverse(1, 2)).rejects.toThrow(/no configurada/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
