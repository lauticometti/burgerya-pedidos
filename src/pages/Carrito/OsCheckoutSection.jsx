import React from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { TextInput } from "../../components/ui/FormFields";
import {
  buildOsPayload,
  cartToOsLines,
  createOsOrder,
  idempotencyKeyFor,
  trackingUrl,
} from "../../utils/osCheckout";
import styles from "./OsCheckoutSection.module.css";

// Solo se muestra con VITE_OS_FUNCTIONS_URL (pruebas locales de Burger Ya OS).
// El pedido se guarda en el servidor ANTES de mostrar el alias: el alias y el
// botón YA TRANSFERÍ están en la página de seguimiento que devuelve el servidor.
// El botón de WhatsApp sigue debajo como contingencia.

export default function OsCheckoutSection({ form, items, totals, hasPromo, canSend, isClosed }) {
  const [phone, setPhone] = React.useState("");
  const [consent, setConsent] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);

  const { lines, unsupported } = React.useMemo(() => cartToOsLines(items), [items]);
  const reason = hasPromo ? "tu pedido tiene un descuento o promo" : unsupported;
  const phoneOk = String(phone).replace(/\D/g, "").length >= 8;

  if (reason) {
    return (
      <Card className={styles.card}>
        <div className={styles.note}>Este pedido va por WhatsApp ({reason}).</div>
      </Card>
    );
  }

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const base = buildOsPayload({ idempotencyKey: "", form, phone, consent, lines, grandTotal: totals.grandTotal });
      const { idempotencyKey: _ignored, ...withoutKey } = base;
      const payload = { ...base, idempotencyKey: idempotencyKeyFor(withoutKey) };
      const result = await createOsOrder(payload);
      window.location.assign(trackingUrl(result.token));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Card className={styles.card}>
      <div className={styles.title}>Confirmar pedido (prueba Burger Ya OS)</div>
      <TextInput
        placeholder="Teléfono (obligatorio)"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <label className={styles.consent}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        Quiero recibir avisos de mi pedido por WhatsApp
      </label>
      <Button variant="primary" disabled={isClosed || !canSend || !phoneOk || busy} onClick={submit}>
        {busy ? "Registrando…" : "Confirmar pedido"}
      </Button>
      {error ? <div className={styles.error}>{error}</div> : null}
      <div className={styles.note}>
        Te mostramos el seguimiento y, si pagás por transferencia, los datos para transferir.
      </div>
    </Card>
  );
}
