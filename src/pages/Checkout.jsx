import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../store/useCart";
import { WHATSAPP_NUMBER } from "../data/menu";

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

  for (const it of items) {
    lines.push(`- ${it.qty}x ${it.name}`);
    if (it.meta?.picks?.length) lines.push(`  • ${it.meta.picks.join(" / ")}`);
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
                  <b>{it.qty}x</b> {it.name}
                  {it.meta?.picks?.length ? (
                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                      • {it.meta.picks.join(" / ")}
                    </div>
                  ) : null}
                </div>
                <div>
                  <b>${it.unitPrice}</b>
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
    </div>
  );
}
