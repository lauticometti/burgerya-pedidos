// Carga perezosa del SDK de Google Maps JavaScript API (solo el mapa — NO
// Places: no pedimos `libraries=places` a proposito, esta key debe quedar
// restringida a Maps JavaScript API unicamente). Se llama recien cuando el
// usuario toca "Elegir en el mapa", nunca al entrar al checkout.

const CALLBACK_NAME = "__burgeryaGoogleMapsReady";
let loadPromise = null;

export function loadGoogleMaps(apiKey) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No hay window disponible"));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    window[CALLBACK_NAME] = () => {
      delete window[CALLBACK_NAME];
      resolve(window.google.maps);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${CALLBACK_NAME}&loading=async&language=es&region=AR`;
    script.async = true;
    script.onerror = () => {
      delete window[CALLBACK_NAME];
      loadPromise = null;
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
