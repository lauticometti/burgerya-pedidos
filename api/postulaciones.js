import { createHmac } from "node:crypto";
import { incrWithTTL, usingMemoryStore } from "./_lib/rateLimitStore.js";
import { CAMPAIGN, QUESTIONS, validateApplication } from "../src/recruitment/schema.js";

function settings() {
  const env = process.env;
  // Horario confirmado por Lautaro el 15/10/2026, incluido el cierre.
  const end = env.RECRUITMENT_SHIFT_END || "01:30";
  const origin = env.RECRUITMENT_ORIGIN || "";
  const webhook = env.RECRUITMENT_SHEETS_URL || "";
  const secret = env.RECRUITMENT_SECRET || "";
  const configured = env.RECRUITMENT_ENABLED === "true" && /^([01]\d|2[0-3]):[0-5]\d$/.test(end)
    && /^https:\/\/[^/]+$/.test(origin) && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(webhook)
    && secret.length >= 32 && !usingMemoryStore();
  return { end, origin, webhook, secret, configured };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const cfg = settings();
  if (req.method === "GET") return res.status(200).json({ open: cfg.configured, campaign: CAMPAIGN, shiftEnd: cfg.configured ? cfg.end : null });
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "Método no permitido." }); }
  if (!cfg.configured) return res.status(503).json({ error: "La recepción de postulaciones no está habilitada. Volvé más tarde." });
  if (req.headers.origin !== cfg.origin) return res.status(403).json({ error: "Origen no permitido." });
  if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] || "")) return res.status(415).json({ error: "Formato no admitido." });
  let body;
  try {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (!raw || Buffer.byteLength(raw) > 8192) return res.status(413).json({ error: "Formulario demasiado grande." });
    body = typeof req.body === "string" ? JSON.parse(raw) : req.body;
  } catch { return res.status(400).json({ error: "Formulario inválido." }); }
  if (body?.website) return res.status(400).json({ error: "No pudimos procesar el formulario." });
  const result = validateApplication(body, cfg.end);
  if (result.error) return res.status(400).json({ error: result.error });
  try {
    // Vercel overwrites x-vercel-forwarded-for. No raw IP or contact data in Redis/logs.
    const ip = req.headers["x-vercel-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    const hash = createHmac("sha256", cfg.secret).update(String(ip)).digest("hex");
    const [count, global] = await Promise.all([
      incrWithTTL(`recruitment:ip:${hash}`, 3600),
      incrWithTTL(`recruitment:day:${new Date().toISOString().slice(0, 10)}`, 172800),
    ]);
    if (!Number.isFinite(count) || !Number.isFinite(global)) throw new Error("rate store unavailable");
    if (count > 10 || global > 500) {
      res.setHeader("Retry-After", "3600");
      return res.status(429).json({ error: "Llegamos al límite de envíos. Probá más tarde." });
    }
    const { data, classification } = result;
    const record = { ...data, classification, receivedAt: new Date().toISOString(),
      responseLabels: QUESTIONS.map(q => q.options.find(([id]) => id === data.answers[q.key])[1]) };
    const response = await fetch(cfg.webhook, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: cfg.secret, record }), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("storage unavailable");
    const receipt = await response.json();
    if (receipt.ok !== true || receipt.id !== data.id) throw new Error("missing receipt");
    return res.status(201).json({ ok: true, id: data.id });
  } catch {
    // Never log the request, upstream response, secrets or candidate data.
    return res.status(503).json({ error: "No pudimos confirmar la recepción. Conservamos tus respuestas en esta pantalla: reintentá sin recargar." });
  }
}
