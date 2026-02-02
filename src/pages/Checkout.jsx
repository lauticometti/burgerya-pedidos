import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../store/useCart";
import { WHATSAPP_NUMBER } from "../data/menu";
import { extras } from "../data/menu"; // ajustá ruta si tu menu está en otra carpeta
import { toast } from "../utils/toast"; // ajustá ruta si ya lo importás distinto

function sizeToWord(size) {
  // para "4 cheeses dobles"
  if (size === "simple") return "simples";
  if (size === "doble") return "dobles";
  return "triples";
}

function pluralizeBurger(name, n) {
  // tu regla: "4 cheeses dobles" (sin paréntesis)
  // esto es “best effort” y simple. Si querés perfección, lo ajustamos por excepción.
  const base = name.toLowerCase();
  if (n === 1) return base;
  if (base.endsWith("s")) return base; // "doritos" no cambia
  if (base.endsWith("e")) return base + "s"; // cheese -> cheeses
  return base + "s";
}

/* ====== helpers horarios ====== */
function pad2(n) {
  return String(n).padStart(2, "0");
}
function minutesToHHMM(m) {
  const hh = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}
function buildTimeSlots() {
  const start = 20 * 60 + 30; // 20:30
  const end = 24 * 60; // 24:00 => 00:00
  const out = [];
  for (let m = start; m <= end; m += 15) out.push(m);
  return out;
}
function roundUpTo15(mins) {
  return Math.ceil(mins / 15) * 15;
}
function getAvailableSlotsMin30() {
  const slots = buildTimeSlots();
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const opening = 20 * 60 + 30;
  if (nowMins < opening) return slots;

  const minAllowed = roundUpTo15(nowMins + 30);
  return slots.filter((m) => m >= minAllowed);
}
/* ============================== */

function buildWhatsAppText({
  name,
  address,
  cross,
  pay,
  when,
  notes,
  items,
  total,
}) {
  const lines = [];
  lines.push("Pedido Burgerya 🍔");
  lines.push(`Nombre: ${name}`);
  lines.push(`Dirección: ${address} (${cross})`);
  lines.push(`Pago: ${pay}`);
  lines.push(`Horario: ${when}`);
  lines.push("");
  lines.push("Pedido:");

  const SIZE_WORD = { simple: "simple", doble: "doble", triple: "triple" };
  const SIZE_WORD_PL = {
    simple: "simples",
    doble: "dobles",
    triple: "triples",
  };

  function lower(s) {
    return String(s || "")
      .trim()
      .toLowerCase();
  }

  function pluralizeName(name) {
    const n = lower(name);
    if (!n) return n;
    // si termina en s (doritos) o es sigla tipo sos, no tocar
    if (n.endsWith("s")) return n;
    return n + "s";
  }

  function burgerLineText(name, size, qty) {
    const base = qty > 1 ? pluralizeName(name) : lower(name);
    const sizeWord = qty > 1 ? SIZE_WORD_PL[size] : SIZE_WORD[size];
    return `${qty} ${base} ${sizeWord}`.trim();
  }

  const burgers = items.filter((it) => it.meta?.type === "burger");
  const burgerlines = items.filter((it) => it.meta?.type === "burgerline");
  const children = items.filter((it) =>
    ["extra", "papasup"].includes(it.meta?.type),
  );

  // 1) mergeables
  for (const b of burgers) {
    lines.push(
      `- ${burgerLineText(b.meta?.burgerName || b.name, b.meta?.size, b.qty)}`,
    );
  }

  // 2) custom líneas con hijos
  for (const bl of burgerlines) {
    const lineId = bl.meta?.lineId;
    const name = bl.meta?.burgerName || bl.name;
    const size = bl.meta?.size;

    lines.push(`- ${burgerLineText(name, size, bl.qty)}`);

    const attached = children.filter((c) => c.meta?.parentLineId === lineId);

    for (const c of attached) {
      if (c.meta?.type === "extra") {
        lines.push(`  extra ${lower(c.name)}`);
      } else if (c.meta?.type === "papasup") {
        // acá ya guardamos "papas cheddar" / "papas cheddar y bacon" en minúscula
        lines.push(`  ${lower(c.name)}`);
      }
    }
  }

  if (notes && notes.trim()) {
    lines.push("");
    lines.push(`Aclaraciones: ${notes.trim()}`);
  }

  lines.push("");
  lines.push(`Total: $${total}`);

  return encodeURIComponent(lines.join("\n"));
}

export default function Checkout() {
  const cart = useCart();

  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [cross, setCross] = React.useState("");
  const [pay, setPay] = React.useState("Efectivo");

  const [notes, setNotes] = React.useState("");
  const [whenMode, setWhenMode] = React.useState("Ahora");
  const [whenSlot, setWhenSlot] = React.useState("");

  const [activeLine, setActiveLine] = React.useState(null);
  // { key, baseItem, burgerId, size, burgerName, basePrice, extrasIds, friesId }

  const [extrasOpen, setExtrasOpen] = React.useState(false);
  const [friesOpen, setFriesOpen] = React.useState(false);

  const [draftExtras, setDraftExtras] = React.useState([]); // array de ids
  const [draftFries, setDraftFries] = React.useState(null); // "papas_cheddar" | "papas_cheddar_bacon" | null

  // slots con refresh cada 60s
  const [availableSlots, setAvailableSlots] = React.useState(
    getAvailableSlotsMin30(),
  );
  React.useEffect(() => {
    const id = setInterval(
      () => setAvailableSlots(getAvailableSlotsMin30()),
      60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  // si cambia a "Mas tarde" y no hay slot elegido, autoselecciona el primero
  React.useEffect(() => {
    if (whenMode === "Mas tarde" && !whenSlot && availableSlots.length) {
      setWhenSlot(minutesToHHMM(availableSlots[0]));
    }
  }, [whenMode, whenSlot, availableSlots]);

  const when =
    whenMode === "Ahora" ? "Lo antes posible" : `Para más tarde (${whenSlot})`;

  const hasTimeOk = whenMode === "Ahora" || !!whenSlot;

  const canSend =
    cart.items.length > 0 &&
    name.trim() &&
    address.trim() &&
    cross.trim() &&
    pay.trim() &&
    hasTimeOk;

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppText({
    name,
    address,
    cross,
    pay,
    when,
    notes,
    items: cart.items,
    total: cart.total,
  })}`;

  const SIZE_PLURAL = { simple: "simples", doble: "dobles", triple: "triples" };

  const FRIES_UPGRADES = [
    { id: "papas_cheddar", label: "papas cheddar", price: 1500 },
    { id: "papas_cheddar_bacon", label: "papas cheddar y bacon", price: 3000 },
  ];

  function getExtraName(extraId) {
    const x = extras.find((e) => e.id === extraId);
    if (!x) return extraId;
    // "extra " + nombre en minúsculas (como pediste)
    return `extra ${String(x.name).toLowerCase()}`;
  }

  function getExtraPrice(extraId) {
    const x = extras.find((e) => e.id === extraId);
    return x?.price ?? 0;
  }

  function getFriesUpgrade(friesId) {
    return FRIES_UPGRADES.find((f) => f.id === friesId) || null;
  }

  function buildBurgerKey({ burgerId, size, extrasIds = [], friesId = null }) {
    const xs = extrasIds.slice().sort().join(",") || "-";
    const f = friesId || "-";
    return `burger:${burgerId}:${size}:x=${xs}:f=${f}`;
  }

  function formatBurgerLineName({ qty, burgerName, size }) {
    const n = String(burgerName || "").toLowerCase();
    const sizeWord = SIZE_PLURAL[size] || `${size}s`;

    if (qty > 1) return `${qty} ${n}s ${sizeWord}`; // "4 cheeses dobles"
    return `${qty} ${n} ${size}`; // "1 cheese doble"
  }

  /**
   * Reemplaza 1 unidad de una línea del carrito por otra “config”.
   * - Si qty>1: baja qty de la original y agrega una nueva línea qty=1
   * - Si qty==1: remueve original y agrega nueva línea qty=1
   */
  function replaceOneUnitLine({ it, nextMeta }) {
    const burgerId = it.meta?.burgerId;
    const size = it.meta?.size;
    if (!burgerId || !size) return; // seguridad

    // bajar/remover la original
    if (it.qty > 1) cart.setQty(it.key, it.qty - 1);
    else cart.remove(it.key);

    const basePrice = it.meta?.basePrice ?? it.unitPrice;
    const extrasIds = nextMeta.extrasIds || [];
    const friesId = nextMeta.friesId || null;

    const extrasPrice = extrasIds.reduce((s, id) => s + getExtraPrice(id), 0);
    const friesPrice = getFriesUpgrade(friesId)?.price ?? 0;

    const unitPrice = basePrice + extrasPrice + friesPrice;
    const key = buildBurgerKey({ burgerId, size, extrasIds, friesId });

    cart.add({
      key,
      qty: 1,
      unitPrice,
      name: it.meta?.burgerName || it.name,
      meta: {
        ...it.meta,
        type: "burger",
        burgerId,
        size,
        burgerName: it.meta?.burgerName || it.name,
        basePrice,
        extrasIds,
        friesId,
      },
    });
  }

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div className="row">
          <Link to="/">
            <button className="btn">⬅ Volver</button>
          </Link>
          <button className="btn" onClick={cart.clear}>
            Vaciar
          </button>
        </div>
      </div>

      <h1 style={{ margin: "6px 0 14px" }}>Checkout</h1>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <input
            className="input"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Dirección"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <input
            className="input"
            placeholder="Entre calles"
            value={cross}
            onChange={(e) => setCross(e.target.value)}
          />

          <select
            className="select"
            value={pay}
            onChange={(e) => setPay(e.target.value)}>
            <option>Efectivo</option>
            <option>Transferencia</option>
          </select>

          <select
            className="select"
            value={whenMode}
            onChange={(e) => setWhenMode(e.target.value)}>
            <option value="Ahora">Lo antes posible</option>
            <option value="Mas tarde">Para más tarde</option>
          </select>

          {whenMode === "Mas tarde" &&
            (availableSlots.length ? (
              <select
                className="select"
                value={whenSlot}
                onChange={(e) => setWhenSlot(e.target.value)}>
                {availableSlots.map((m) => {
                  const label = minutesToHHMM(m);
                  return (
                    <option key={m} value={label}>
                      {label}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                No hay horarios disponibles hoy (mínimo +30 min).
              </div>
            ))}

          <textarea
            className="textarea"
            placeholder="Aclaraciones (ej: sin cebolla, tocar timbre 2, etc.)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12, opacity: 0.9 }}>
        <b>Total:</b> ${cart.total}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {cart.items.length === 0 ? (
          <div className="card">No hay items.</div>
        ) : (
          cart.items.map((it) => (
            <div key={it.key} className="card">
              <div className="row-between">
                <div>
                  {it.meta?.type === "burger" ? (
                    <b>
                      {it.qty}{" "}
                      {String(it.meta?.burgerName || it.name).toLowerCase()}
                      {it.qty > 1 ? "s" : ""}{" "}
                      {it.meta?.size === "simple"
                        ? it.qty > 1
                          ? "simples"
                          : "simple"
                        : it.meta?.size === "doble"
                          ? it.qty > 1
                            ? "dobles"
                            : "doble"
                          : it.qty > 1
                            ? "triples"
                            : "triple"}
                    </b>
                  ) : (
                    <>
                      <b>{it.qty}x</b> {it.name}
                    </>
                  )}

                  {it.meta?.picks?.length ? (
                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                      • {it.meta.picks.join(" / ")}
                    </div>
                  ) : null}
                  {it.meta?.type === "burger" ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 10,
                        flexWrap: "wrap",
                      }}>
                      <button
                        className="btn"
                        style={{ cursor: "pointer" }}
                        type="button"
                        onClick={() => {
                          setActiveLine(it);
                          setDraftExtras(it.meta?.extrasIds || []);
                          setExtrasOpen(true);
                        }}>
                        Agregados
                      </button>

                      <button
                        className="btn"
                        style={{ cursor: "pointer" }}
                        type="button"
                        onClick={() => {
                          setActiveLine(it);
                          setDraftFries(it.meta?.friesId || null);
                          setFriesOpen(true);
                        }}>
                        Mejorar papas
                      </button>
                    </div>
                  ) : null}
                  {/* Preview de lo que tiene esa línea */}
                  {it.meta?.extrasIds?.length ? (
                    <div
                      style={{
                        fontSize: 13,
                        opacity: 0.85,
                        marginTop: 8,
                        display: "grid",
                        gap: 2,
                      }}>
                      {it.meta.extrasIds.map((id) => (
                        <div key={id}>• {getExtraName(id)}</div>
                      ))}
                    </div>
                  ) : null}

                  {it.meta?.friesId ? (
                    <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
                      • {getFriesUpgrade(it.meta.friesId)?.label}
                    </div>
                  ) : null}
                </div>
                <div>
                  <b>${(it.qty * it.unitPrice).toLocaleString("es-AR")}</b>
                </div>
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <button
                  className="btn"
                  onClick={() => cart.setQty(it.key, it.qty - 1)}>
                  -
                </button>
                <b>{it.qty}</b>
                <button
                  className="btn"
                  onClick={() => cart.setQty(it.key, it.qty + 1)}>
                  +
                </button>
                <button
                  className="btn"
                  onClick={() => cart.remove(it.key)}
                  style={{ marginLeft: 6 }}>
                  Quitar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="stickyBarSpacer" />

      <div className="stickyBar">
        <div className="stickyInner">
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Total</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>${cart.total}</div>
          </div>

          <a href={canSend ? waHref : "#"} target="_blank" rel="noreferrer">
            <button className="btn btnPrimary" disabled={!!canSend}>
              Enviar por WhatsApp
            </button>
          </a>
        </div>
      </div>
      {/* ===== MODAL EXTRAS ===== */}
      {extrasOpen && activeLine ? (
        <div className="modalBackdrop" onMouseDown={() => setExtrasOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}>
              <b>Agregados</b>
              <button
                className="btn"
                type="button"
                onClick={() => setExtrasOpen(false)}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {extras.map((x) => {
                const on = draftExtras.includes(x.id);
                return (
                  <button
                    key={x.id}
                    type="button"
                    className="btn"
                    style={{
                      justifyContent: "space-between",
                      display: "flex",
                      cursor: "pointer",
                      borderColor: on ? "rgba(255,198,42,0.6)" : undefined,
                    }}
                    onClick={() => {
                      setDraftExtras((prev) =>
                        prev.includes(x.id)
                          ? prev.filter((id) => id !== x.id)
                          : [...prev, x.id],
                      );
                    }}>
                    <span>{String(x.name).toLowerCase()}</span>
                    <b>${x.price.toLocaleString("es-AR")}</b>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setDraftExtras(activeLine.meta?.extrasIds || []);
                  setExtrasOpen(false);
                }}>
                Cancelar
              </button>

              <button
                className="btn btnPrimary"
                type="button"
                style={{ cursor: "pointer", flex: 1 }}
                onClick={() => {
                  replaceOneUnitLine({
                    it: activeLine,
                    nextMeta: {
                      extrasIds: draftExtras,
                      friesId: activeLine.meta?.friesId || null,
                    },
                  });
                  toast.success("Agregados aplicados");
                  setExtrasOpen(false);
                }}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ===== MODAL PAPAS ===== */}
      {friesOpen && activeLine ? (
        <div className="modalBackdrop" onMouseDown={() => setFriesOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}>
              <b>Mejorar papas</b>
              <button
                className="btn"
                type="button"
                onClick={() => setFriesOpen(false)}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <button
                type="button"
                className="btn"
                style={{
                  cursor: "pointer",
                  justifyContent: "space-between",
                  display: "flex",
                }}
                onClick={() => setDraftFries(null)}>
                <span>sin mejora</span>
                <b>$0</b>
              </button>

              {FRIES_UPGRADES.map((f) => {
                const on = draftFries === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    className="btn"
                    style={{
                      cursor: "pointer",
                      justifyContent: "space-between",
                      display: "flex",
                      borderColor: on ? "rgba(255,198,42,0.6)" : undefined,
                    }}
                    onClick={() => setDraftFries(f.id)}>
                    <span>{f.label}</span>
                    <b>${f.price.toLocaleString("es-AR")}</b>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setDraftFries(activeLine.meta?.friesId || null);
                  setFriesOpen(false);
                }}>
                Cancelar
              </button>

              <button
                className="btn btnPrimary"
                type="button"
                style={{ cursor: "pointer", flex: 1 }}
                onClick={() => {
                  replaceOneUnitLine({
                    it: activeLine,
                    nextMeta: {
                      extrasIds: activeLine.meta?.extrasIds || [],
                      friesId: draftFries,
                    },
                  });
                  toast.success("Papas mejoradas");
                  setFriesOpen(false);
                }}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
