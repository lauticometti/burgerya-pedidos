import { describe, it, expect } from "vitest";
import mapPickerSource from "./DeliveryMapPicker.jsx?raw";
import geolocationPickerSource from "./DeliveryGeolocationPicker.jsx?raw";
import addressFieldSource from "./DeliveryAddressField.jsx?raw";
import locationPickerSource from "./DeliveryLocationPicker.jsx?raw";
import formHookSource from "../../pages/Carrito/useCarritoCheckoutForm.js?raw";
import googleMapsLoaderSource from "../../utils/googleMapsLoader.js?raw";
import schedulerSource from "../../utils/pinAddressScheduler.js?raw";
import quoteViewSource from "../../utils/deliveryQuoteView.js?raw";
import geolocationAccuracySource from "../../utils/geolocationAccuracy.js?raw";

// No hay infraestructura de render de componentes en este proyecto (sin
// @testing-library/react ni jsdom instalados), asi que estas garantias se
// dan por CONSTRUCCION: son guardrails estaticos sobre el codigo fuente
// contra una regresion futura que agregue sin querer una llamada de red o
// una llamada directa al proveedor desde el navegador.

describe("DeliveryMapPicker: mover/arrastrar el pin nunca llama a la busqueda de direcciones", () => {
  it("no referencia fetch() ni los endpoints /api/location", () => {
    expect(mapPickerSource).not.toMatch(/fetch\s*\(/);
    expect(mapPickerSource).not.toContain("/api/location");
  });

  it("no hace reverse geocoding ni usa el cliente de busqueda", () => {
    expect(mapPickerSource).not.toMatch(/reverse/i);
    expect(mapPickerSource).not.toContain("googleLocation");
  });

  it("carga el SDK de Google Maps de forma perezosa (dentro de un efecto), sin script estatico", () => {
    expect(mapPickerSource).toMatch(/useEffect\([\s\S]*loadGoogleMaps\(/);
    expect(mapPickerSource).not.toContain("maps.googleapis.com");
  });

  it("usa la key PUBLICA del navegador (VITE_GOOGLE_MAPS_API_KEY), nunca la de servidor", () => {
    expect(mapPickerSource).toContain("VITE_GOOGLE_MAPS_API_KEY");
    expect(mapPickerSource).not.toContain("GOOGLE_PLACES_API_KEY");
  });

  it("resuelve la cobertura con el motor local de zonas", () => {
    expect(mapPickerSource).toContain("getCoverageBounds");
  });
});

describe("DeliveryMapPicker: solo emite ubicacion al tocar o arrastrar el pin (pan y zoom no cuentan)", () => {
  it("escucha unicamente click, drag y dragend del pin; nunca pan/zoom/centro/limites del mapa", () => {
    expect(mapPickerSource).toContain('addListener("click"');
    expect(mapPickerSource).toContain('addListener("drag"');
    expect(mapPickerSource).toContain('addListener("dragend"');
    for (const noisy of ["center_changed", "bounds_changed", "zoom_changed", "dragstart", "tilesloaded", "mousemove"]) {
      expect(mapPickerSource).not.toContain(noisy);
    }
  });

  it("solo hay tres puntos de salida de ubicacion (click, drag, dragend) y el arrastre en curso va marcado moving", () => {
    expect(mapPickerSource.match(/onLocationChangeRef\.current\(/g)).toHaveLength(3);
    const dragBlock = mapPickerSource.slice(
      mapPickerSource.indexOf('addListener("drag"'),
      mapPickerSource.indexOf('addListener("dragend"'),
    );
    expect(dragBlock).toContain("moving: true");
    expect(dragBlock).toContain("requestAnimationFrame"); // como mucho una actualizacion por cuadro
    const dragendBlock = mapPickerSource.slice(mapPickerSource.indexOf('addListener("dragend"'));
    expect(dragendBlock.slice(0, dragendBlock.indexOf("markerRef.current = marker"))).not.toContain("moving");
  });

  it("no compite con el arrastre: ignora la sincronizacion externa del pin mientras se mueve", () => {
    expect(mapPickerSource).toMatch(/if \(moving\) return;/);
  });
});

describe("DeliveryGeolocationPicker: usar la ubicacion actual nunca llama a un servicio de busqueda", () => {
  it("no referencia fetch() ni los endpoints /api/location", () => {
    expect(geolocationPickerSource).not.toMatch(/fetch\s*\(/);
    expect(geolocationPickerSource).not.toContain("/api/location");
  });

  it("usa navigator.geolocation directo, con el muestreo de alta precision (que corta solo al terminar)", () => {
    expect(geolocationPickerSource).toContain("navigator.geolocation");
    expect(geolocationPickerSource).toContain("startGeolocationSampling");
    expect(geolocationAccuracySource).toContain("watchPosition");
    expect(geolocationAccuracySource).toContain("enableHighAccuracy: true");
    expect(geolocationAccuracySource).toContain("clearWatch"); // nunca queda escuchando sin parar
  });

  it("nunca emite una ubicacion por su cuenta: entrega la lectura con su precision y el padre decide", () => {
    expect(geolocationPickerSource).toContain("onFix(fix)");
    expect(geolocationPickerSource).not.toMatch(/onLocationChange/);
    expect(geolocationPickerSource).not.toMatch(/source:\s*["']geolocation["']/);
  });
});

describe("experiencia activa: Google, con Mapbox estacionado", () => {
  const activeUi = {
    DeliveryMapPicker: mapPickerSource,
    DeliveryGeolocationPicker: geolocationPickerSource,
    DeliveryAddressField: addressFieldSource,
    DeliveryLocationPicker: locationPickerSource,
  };

  for (const [name, source] of Object.entries(activeUi)) {
    it(`${name} no referencia Mapbox`, () => {
      expect(source).not.toMatch(/mapbox/i);
    });

    it(`${name} no llama al proveedor de busqueda directo desde el navegador (ni endpoints viejos /api/places)`, () => {
      expect(source).not.toMatch(/places\.googleapis|geocode\/json/);
      expect(source).not.toContain("/api/places");
    });
  }

  it("la busqueda de direcciones llama a los endpoints neutrales /api/location/*", () => {
    expect(addressFieldSource).toContain("/api/location/autocomplete");
    expect(addressFieldSource).toContain("/api/location/retrieve");
  });

  it("los resultados de la busqueda llevan la atribucion de Google", () => {
    expect(addressFieldSource).toContain("<GooglePlacesAttribution");
  });

  it("el picker usa el mapa de Google, no el de Mapbox estacionado", () => {
    expect(locationPickerSource).toContain('from "./DeliveryMapPicker"');
    expect(locationPickerSource).not.toContain("DeliveryMapboxMapPicker");
  });
});

describe("cargador de Google Maps: solo el mapa", () => {
  it("no pide la libreria places (la key del navegador queda restringida a Maps JavaScript API)", () => {
    expect(googleMapsLoaderSource).not.toMatch(/[?&]libraries=/);
    expect(googleMapsLoaderSource).toContain("maps.googleapis.com/maps/api/js");
  });
});

describe("DeliveryAddressField: la busqueda nunca falla en silencio", () => {
  it("si el proveedor devuelve cero sugerencias, le avisa al cliente y le ofrece el mapa", () => {
    expect(addressFieldSource).toMatch(/suggestions\.length === 0/);
    expect(addressFieldSource).toContain("No encontramos esa dirección");
    expect(addressFieldSource).toContain("en el mapa");
  });

  it("la direccion elegida usa el texto de la sugerencia (corto), no el de retrieve", () => {
    expect(addressFieldSource).toMatch(/const chosenText = suggestion\.text \|\| data\.formattedAddress;/);
    expect(addressFieldSource).toContain("onTextChange(chosenText)");
  });
});

describe("regresiones del uso desde celular (http en red local)", () => {
  it("el buscador no usa crypto.randomUUID directo (no existe por http): usa el UUID con respaldo", () => {
    expect(addressFieldSource).not.toContain("crypto.randomUUID");
    expect(addressFieldSource).toContain("safeRandomUUID");
  });

  it("la busqueda no puede quedar colgada en 'Buscando...': runSearch atrapa cualquier fallo", () => {
    expect(addressFieldSource).toMatch(/catch \{[\s\S]{0,200}setStatus\("unavailable"\)/);
  });

  it("la ubicacion actual avisa la causa real cuando el navegador la bloquea por no ser https", () => {
    expect(geolocationPickerSource).toContain("isSecureContext");
  });
});

describe("direccion del pin: solo la pide el picker, solo para ubicaciones confirmadas del mapa/ubicacion actual", () => {
  it("DeliveryLocationPicker tiene UN solo fetch (/api/location/reverse) y lo maneja el planificador, no un efecto suelto", () => {
    expect(locationPickerSource.match(/fetch\s*\(/g)).toHaveLength(1);
    expect(locationPickerSource).toContain("/api/location/reverse");
    expect(locationPickerSource).toContain("createPinAddressScheduler");
    expect(locationPickerSource).toContain("moving");
    expect(locationPickerSource).not.toMatch(/setTimeout\s*\(/);
  });

  it("el planificador solo consulta si needsReverseGeocode lo permite, con debounce, sin repetir el mismo punto y descartando respuestas viejas", () => {
    expect(schedulerSource).toContain("needsReverseGeocode");
    expect(schedulerSource).toContain("REVERSE_DEBOUNCE_MS");
    expect(schedulerSource).toContain("key === lastKey");
    expect(schedulerSource).toContain("mySeq !== seq");
  });

  it("no pisa lo que el cliente ya escribio", () => {
    expect(locationPickerSource).toMatch(/addressRef\.current !== ""/);
  });

  it("si Geocoding falla solo se marca el fallo: la ubicacion (lat/lng) y la cotizacion no se tocan", () => {
    expect(locationPickerSource).toContain("onFailed: (key, error) => setFailure(");
    expect(schedulerSource).not.toMatch(/onLocationChange|setSelectedLocation/);
  });

  it("un limite de uso de la direccion del pin se muestra con el mensaje del servidor, no como servicio caido", () => {
    expect(locationPickerSource).toContain("classifyLocationResponse");
    expect(locationPickerSource).toContain("error?.userMessage");
  });
});

describe("zona y precio: nunca dependen de Google", () => {
  it("el mensaje de no cubierto es distinto del de 'no encontramos esa direccion'", () => {
    expect(quoteViewSource).toContain("Todavía no llegamos a esta ubicación.");
    expect(addressFieldSource).toContain("No encontramos esa dirección");
    expect(addressFieldSource).not.toContain("Todavía no llegamos");
  });
});

describe("un limite de uso o un fallo de Google nunca borra lo que la persona ya tenia", () => {
  it("DeliveryAddressField: las ramas de error (buscar y elegir) solo informan; no tocan el texto ni la ubicacion", () => {
    const branches = [...addressFieldSource.matchAll(/if \(result\.kind !== "ok"[^{]*\{([\s\S]*?)return;\s*\}/g)];
    expect(branches).toHaveLength(2); // runSearch y handleSelectSuggestion
    for (const [, body] of branches) {
      expect(body).not.toMatch(/onTextChange\(|onResolved\(|onLocationChange\(/);
    }
  });

  it("la lista de sugerencias vuelve si fallo elegir una (para reintentar) y el session token se conserva", () => {
    expect(addressFieldSource).toContain("setSuggestions(previousSuggestions)");
    const failureBranch = addressFieldSource.slice(
      addressFieldSource.indexOf("const previousSuggestions"),
      addressFieldSource.indexOf("sessionTokenRef.current = null; // la busqueda termino"),
    );
    expect(failureBranch).not.toContain("sessionTokenRef.current = null");
  });

  it("los limites se muestran con su propio estado (limited), distinto del de servicio no disponible", () => {
    expect(addressFieldSource).toContain('status === "limited"');
    expect(addressFieldSource).toContain("classifyLocationResponse");
  });
});

describe("una lectura de geolocalizacion mala nunca decide delivery", () => {
  it("DeliveryLocationPicker solo cotiza una lectura confiable: decideGeolocation entrega la ubicacion, y confirm/poor no", () => {
    expect(locationPickerSource).toContain("decideGeolocation(fix)");
    expect(locationPickerSource).toContain("if (decision.location) handleLocationChange(decision.location)");
  });

  it("se pide confirmar (confirm) o marcar el pin (poor) con los textos pedidos", () => {
    expect(locationPickerSource).toContain("Tu ubicación es aproximada");
    expect(locationPickerSource).toContain("Confirmá que el pin esté en tu puerta");
    expect(locationPickerSource).toContain("No pudimos ubicarte con suficiente precisión.");
    expect(locationPickerSource).toContain("Ajustá tu ubicación en el mapa.");
  });

  it("apenas la persona toca o mueve el pin manual, la lectura de geolocalizacion deja de contar", () => {
    expect(locationPickerSource).toMatch(/location\?\.source === "map"\) setGeoFix\(null\)/);
  });

  it("el mapa dibuja el circulo de precision (solo dibuja: no cotiza)", () => {
    expect(mapPickerSource).toContain("Circle");
    expect(mapPickerSource).toContain("approx.accuracy");
    expect(mapPickerSource).not.toMatch(/onLocationChangeRef\.current\([^)]*approx/);
  });
});

describe("la ubicacion NO se guarda entre visitas", () => {
  it("useCarritoCheckoutForm no persiste ni restaura selectedLocation ni address", () => {
    expect(formHookSource).toContain("delete saved.selectedLocation");
    expect(formHookSource).toContain("delete saved.address");
    expect(formHookSource).toMatch(/selectedLocation: _location, address: _address, \.\.\.persistable/);
  });
});
