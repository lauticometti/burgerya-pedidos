import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { suggest, retrieve, reverse, isConfigured, MapboxSearchError } from "./mapboxSearch.js";
import { SEARCH_BBOX } from "./searchArea.js";
import { getCoverageBounds } from "../../src/utils/deliveryZones";

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
  process.env.MAPBOX_SEARCH_TOKEN = "test-search-token";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  delete process.env.MAPBOX_SEARCH_TOKEN;
  vi.unstubAllGlobals();
});

describe("isConfigured", () => {
  it("es false sin MAPBOX_SEARCH_TOKEN y true con el", () => {
    expect(isConfigured()).toBe(true);
    delete process.env.MAPBOX_SEARCH_TOKEN;
    expect(isConfigured()).toBe(false);
  });
});

describe("suggest", () => {
  it("arma la URL de /suggest con session_token, token, pais AR, idioma, proximity, solo direcciones y limite 5", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ suggestions: [] }));
    await suggest("Beethoven 1234", "sess-uuid-1");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe("https://api.mapbox.com/search/searchbox/v1/suggest");
    expect(url.searchParams.get("q")).toBe("Beethoven 1234");
    expect(url.searchParams.get("session_token")).toBe("sess-uuid-1");
    expect(url.searchParams.get("access_token")).toBe("test-search-token");
    expect(url.searchParams.get("country")).toBe("ar");
    expect(url.searchParams.get("language")).toBe("es");
    expect(url.searchParams.get("types")).toBe("address");
    expect(url.searchParams.get("limit")).toBe("5");
    // Mapbox usa lng,lat: la longitud de Hurlingham es ~-58, la latitud ~-34
    expect(url.searchParams.get("proximity")).toMatch(/^-58\.\d+,-34\.\d+$/);
    expect(url.searchParams.get("bbox")).toBe(SEARCH_BBOX);
  });

  it("el bbox de busqueda contiene TODA la cobertura de reparto con margen (no se ciñe al poligono)", () => {
    const [minLng, minLat, maxLng, maxLat] = SEARCH_BBOX.split(",").map(Number);
    const c = getCoverageBounds();
    const MARGEN_MINIMO = 0.03; // ~3 km
    expect(c.west - minLng).toBeGreaterThanOrEqual(MARGEN_MINIMO);
    expect(c.south - minLat).toBeGreaterThanOrEqual(MARGEN_MINIMO);
    expect(maxLng - c.east).toBeGreaterThanOrEqual(MARGEN_MINIMO);
    expect(maxLat - c.north).toBeGreaterThanOrEqual(MARGEN_MINIMO);
    // ...pero sigue siendo local: no es media provincia
    expect(maxLng - minLng).toBeLessThan(0.5);
    expect(maxLat - minLat).toBeLessThan(0.5);
  });

  it("mapea la respuesta a { id, text } neutral de proveedor y descarta sugerencias sin mapbox_id", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        suggestions: [
          { mapbox_id: "id-1", name: "Beethoven 1234", place_formatted: "Villa Tesei, Buenos Aires", full_address: "Beethoven 1234, Villa Tesei, Buenos Aires, Argentina" },
          { mapbox_id: "id-2", name: "Beethoven 1240", place_formatted: "Villa Tesei, Buenos Aires" },
          { name: "sin id" },
        ],
      }),
    );
    const result = await suggest("Beethoven", "s");
    expect(result).toEqual([
      { id: "id-1", text: "Beethoven 1234, Villa Tesei, Buenos Aires, Argentina" },
      { id: "id-2", text: "Beethoven 1240, Villa Tesei, Buenos Aires" },
    ]);
  });

  it("sin token configurado falla antes de hacer cualquier llamada de red", async () => {
    delete process.env.MAPBOX_SEARCH_TOKEN;
    await expect(suggest("Beethoven 1234", "s")).rejects.toThrow(/no configurado/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("un 429 de Mapbox se propaga como MapboxSearchError y NO se reintenta", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Rate limit exceeded" }, { status: 429 }));
    const err = await suggest("Beethoven 1234", "s").catch((e) => e);
    expect(err).toBeInstanceOf(MapboxSearchError);
    expect(err.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("retrieve", () => {
  it("arma la URL de /retrieve/{id} con el mismo session_token y devuelve lat/lng desde [lng, lat]", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        features: [
          {
            geometry: { type: "Point", coordinates: [-58.639888, -34.604852] },
            properties: { full_address: "Malaspina 1602, Villa Tesei, Buenos Aires, Argentina", name: "Malaspina 1602" },
          },
        ],
      }),
    );
    const place = await retrieve("id con/espacios", "sess-uuid-1");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/search/searchbox/v1/retrieve/id%20con%2Fespacios");
    expect(url.searchParams.get("session_token")).toBe("sess-uuid-1");
    expect(url.searchParams.get("access_token")).toBe("test-search-token");
    expect(place).toEqual({
      formattedAddress: "Malaspina 1602, Villa Tesei, Buenos Aires, Argentina",
      lat: -34.604852,
      lng: -58.639888,
    });
  });

  it("sin features o con coordenadas invalidas devuelve null (nunca coordenadas inventadas)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ features: [] }));
    expect(await retrieve("x", "s")).toBe(null);

    fetchMock.mockResolvedValueOnce(jsonResponse({ features: [{ geometry: { coordinates: [] }, properties: {} }] }));
    expect(await retrieve("x", "s")).toBe(null);
  });

  it("un error HTTP se propaga con su status", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Forbidden" }, { status: 403 }));
    const err = await retrieve("x", "s").catch((e) => e);
    expect(err).toBeInstanceOf(MapboxSearchError);
    expect(err.status).toBe(403);
  });
});

describe("reverse (pin -> direccion)", () => {
  const PIN = { lat: -34.602288, lng: -58.64289 };
  // ~0.00001 grados de latitud = 1.11 m
  const addressFeature = (fullAddress, metersNorth) => ({
    geometry: { type: "Point", coordinates: [PIN.lng, PIN.lat + metersNorth / 111195] },
    properties: { feature_type: "address", full_address: fullAddress },
  });
  const streetFeature = (name) => ({
    geometry: { type: "Point", coordinates: [PIN.lng, PIN.lat] },
    properties: { feature_type: "street", name, full_address: `${name}, Hurlingham, Provincia de Buenos Aires, B1686, Argentina` },
  });
  const urlOfCall = (n) => new URL(fetchMock.mock.calls[n][0]);

  it("primero pide SOLO direcciones (con varias candidatas) para poder mostrar el numero", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ features: [] }));
    await reverse(PIN.lat, PIN.lng);

    const url = urlOfCall(0);
    expect(url.origin + url.pathname).toBe("https://api.mapbox.com/search/geocode/v6/reverse");
    expect(url.searchParams.get("latitude")).toBe(String(PIN.lat));
    expect(url.searchParams.get("longitude")).toBe(String(PIN.lng));
    expect(url.searchParams.get("language")).toBe("es");
    expect(url.searchParams.get("country")).toBe("ar");
    expect(url.searchParams.get("types")).toBe("address");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.get("access_token")).toBe("test-search-token");
  });

  it("con una direccion a <= 50 m la devuelve (calle + altura + localidad, sin provincia/CP/pais) en UNA sola llamada", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ features: [addressFeature("Beethoven 1202, Hurlingham, Provincia de Buenos Aires, B1686, Argentina", 22)] }),
    );
    expect(await reverse(PIN.lat, PIN.lng)).toEqual({ address: "Beethoven 1202, Hurlingham", kind: "address" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("elige la direccion MAS CERCANA aunque Mapbox la devuelva en otro orden", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        features: [
          addressFeature("Coraceros 2999, Hurlingham, Provincia de Buenos Aires, Argentina", 45),
          addressFeature("Beethoven 1202, Hurlingham, Provincia de Buenos Aires, Argentina", 22),
        ],
      }),
    );
    expect((await reverse(PIN.lat, PIN.lng)).address).toBe("Beethoven 1202, Hurlingham");
  });

  it("si la direccion mas cercana esta a mas de 50 m no la usa: pide la calle y devuelve solo su nombre, sin numero", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ features: [addressFeature("Tres Arroyos 329, Haedo, Provincia de Buenos Aires, Argentina", 159)] }),
      )
      .mockResolvedValueOnce(jsonResponse({ features: [streetFeature("Calle 5")] }));

    expect(await reverse(PIN.lat, PIN.lng)).toEqual({ address: "Calle 5", kind: "street" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(urlOfCall(1).searchParams.get("types")).toBe("street");
    expect(urlOfCall(1).searchParams.get("limit")).toBe("1");
  });

  it("sin ninguna direccion cerca cae a la calle; sin nada de nada devuelve null", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ features: [] }))
      .mockResolvedValueOnce(jsonResponse({ features: [streetFeature("Paso Morales")] }));
    expect(await reverse(PIN.lat, PIN.lng)).toEqual({ address: "Paso Morales", kind: "street" });

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ features: [] }))
      .mockResolvedValueOnce(jsonResponse({ features: [] }));
    expect(await reverse(PIN.lat, PIN.lng)).toBe(null);
  });

  it("un 429 se propaga sin reintentar y sin llamar de nuevo", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 429 }));
    const err = await reverse(PIN.lat, PIN.lng).catch((e) => e);
    expect(err).toBeInstanceOf(MapboxSearchError);
    expect(err.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("un 429 en la segunda llamada (calle) tambien se propaga", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ features: [] }))
      .mockResolvedValueOnce(jsonResponse({}, { status: 429 }));
    const err = await reverse(PIN.lat, PIN.lng).catch((e) => e);
    expect(err).toBeInstanceOf(MapboxSearchError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sin token falla antes de hacer cualquier llamada de red", async () => {
    delete process.env.MAPBOX_SEARCH_TOKEN;
    await expect(reverse(1, 2)).rejects.toThrow(/no configurado/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
