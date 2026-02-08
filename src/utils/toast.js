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

    // dedupe: si spamean el mismo toast muy rapido, lo ignoramos
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
    const now = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.06, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    g.connect(ctx.destination);

    const o1 = ctx.createOscillator();
    o1.type = "triangle";
    o1.frequency.setValueAtTime(523.25, now); // C5
    o1.connect(g);
    o1.start(now);
    o1.stop(now + 0.12);

    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(659.25, now + 0.12); // E5
    o2.connect(g);
    o2.start(now + 0.12);
    o2.stop(now + 0.24);

    setTimeout(() => {
      ctx.close();
    }, 300);
  } catch {
    // no-op
  }
}

