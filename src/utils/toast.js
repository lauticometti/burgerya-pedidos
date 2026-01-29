let subs = [];
const lastByKey = new Map();

function emit(t) {
  subs.forEach((fn) => fn(t));
}

export const toast = {
  show(message, opts = {}) {
    const {
      kind = "success", // success | error | promo
      ms = 2200,
      key, // para dedupe
      sound = false,
    } = opts;

    const now = Date.now();
    const dedupeKey = key || `${kind}:${message}`;
    const last = lastByKey.get(dedupeKey) || 0;

    // dedupe: si spamean el mismo toast muy rápido, lo ignoramos
    if (now - last < 650) return;
    lastByKey.set(dedupeKey, now);

    const id = `${now}-${Math.random().toString(16).slice(2)}`;
    emit({ id, message, kind, ms, sound });
  },

  success(message, opts = {}) {
    this.show(message, { ...opts, kind: "success" });
  },

  error(message, opts = {}) {
    this.show(message, { ...opts, kind: "error" });
  },

  promo(message, opts = {}) {
    this.show(message, { ...opts, kind: "promo" });
  },

  _subscribe(fn) {
    subs.push(fn);
    return () => {
      subs = subs.filter((x) => x !== fn);
    };
  },
};

// sonido simple (sin archivos)
export function playToastSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 70);
  } catch {
    // no-op
  }
}
