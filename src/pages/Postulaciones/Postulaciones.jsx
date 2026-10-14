import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CAMPAIGN, QUESTIONS, classify } from "../../recruitment/schema";
import styles from "./Postulaciones.module.css";

export default function Postulaciones() {
  const [config, setConfig] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState({ name: "", phone: "", locality: "", notes: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");
  const id = useRef(null);
  const heading = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/postulaciones", { signal: controller.signal, cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setConfig).catch(e => { if (e.name !== "AbortError") setConfig({ open: false }); });
    return () => controller.abort();
  }, []);
  useEffect(() => { heading.current?.focus(); }, [step, receipt]);
  useEffect(() => { id.current = null; }, [answers, contact, consent]);
  const screening = classify(answers);
  function move(next) { setError(""); setStep(next); }
  async function submit(event) {
    event.preventDefault();
    if (sending) return;
    if (step < 2) { move(step + 1); return; }
    setSending(true); setError("");
    try {
      id.current ||= crypto.randomUUID();
      const submittedId = id.current;
      const response = await fetch("/api/postulaciones", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ ...contact, answers, consent, id: submittedId, campaign: CAMPAIGN.id, version: CAMPAIGN.version, shiftEnd: config.shiftEnd }),
      });
      const data = await response.json();
      if (!response.ok || data.ok !== true || data.id !== submittedId) throw new Error(data.error || "No pudimos confirmar la recepción. Reintentá sin recargar.");
      setReceipt(data.id); setContact({ name: "", phone: "", locality: "", notes: "", website: "" }); setAnswers({});
    } catch (e) { setError(e.name === "TimeoutError" || e instanceof TypeError ? "No pudimos confirmar el envío. Revisá tu conexión y reintentá sin recargar." : e.message); }
    finally { setSending(false); }
  }
  return <main className={styles.page}>
    <header className={styles.header}><Link to="/" aria-label="Burger Ya, ir al menú"><img src={`${import.meta.env.BASE_URL}logo.png`} alt="Burger Ya" /></Link><span>TRABAJÁ CON NOSOTROS</span></header>
    <p className={styles.eyebrow}>COCINA · HURLINGHAM</p>
    <h1>Tu próxima<br /><span>plancha.</span></h1>
    <p className={styles.intro}>Buscamos planchero/a para sostener la producción con orden, cuidado y autonomía.</p>
    <div className={styles.schedule}><strong>Miércoles a domingo + feriados correspondientes</strong><p>19:30, cambiado/a y listo/a para trabajar.{config?.open && ` Turno hasta las ${config.shiftEnd}, incluido el cierre.`}</p><p>Trabajo presencial en Hurlingham. Continuidad y cumplimiento del horario durante los días operativos.</p></div>
    {!config ? <p role="status">Consultando la búsqueda…</p> : !config.open ? <section className={styles.card}><h2>Postulaciones no disponibles por el momento</h2><p>Volvé más tarde para consultar la búsqueda. Todavía no estamos recibiendo datos desde esta página.</p></section> : receipt ? <section className={styles.card} aria-live="polite"><h2 ref={heading} tabIndex={-1}>Recibimos tu postulación</h2><p>El equipo revisará tus respuestas. Si avanzamos, te contactaremos al teléfono que dejaste. El envío no garantiza una entrevista.</p><p>Tu comprobante: <code>{receipt}</code></p><Link to="/">Volver a Burger Ya</Link></section> : <>
      <ol className={styles.steps} aria-label="Pasos de la postulación">{["Disponibilidad", "Experiencia", "Contacto"].map((label, i) => <li key={label} aria-current={i === step ? "step" : undefined}><span>{i + 1}</span>{label}</li>)}</ol>
      <form className={styles.card} onSubmit={submit}>
        <fieldset disabled={sending} className={styles.formBody}>
        <h2 ref={heading} tabIndex={-1}>{["Primero, los horarios", "Contanos cómo trabajás", "¿Cómo te contactamos?"][step]}</h2>
        <p> Paso {step + 1} de 3 · Las respuestas son obligatorias salvo donde se indique.</p>
        {step < 2 ? QUESTIONS.filter(q => step === 0 ? q.mandatory : !q.mandatory).map(q => <fieldset key={q.key}><legend>{q.title}</legend>{q.help && <p>{q.help}</p>}{q.options.map(([value, label]) => <label className={styles.option} key={value}><input type="radio" name={q.key} value={value} required checked={answers[q.key] === value} onChange={() => setAnswers(a => ({ ...a, [q.key]: value }))} /><span>{label}</span></label>)}</fieldset>) : <>
          {[["name", "Nombre y apellido", "text", "name", 100], ["phone", "Teléfono / WhatsApp con código de área", "tel", "tel", 30], ["locality", "Localidad o zona (sin dirección exacta)", "text", "address-level2", 100]].map(([key, label, type, auto, max]) => <label className={styles.field} key={key}>{label}<input required type={type} autoComplete={auto} maxLength={max} minLength={key === "phone" ? 8 : 2} value={contact[key]} onChange={e => setContact(c => ({ ...c, [key]: e.target.value }))} /></label>)}
          <label className={styles.field}>¿Querés aclarar algo? (opcional)<textarea maxLength={600} rows={4} value={contact.notes} onChange={e => setContact(c => ({ ...c, notes: e.target.value }))} /><small>Hasta 600 caracteres. No incluyas DNI, datos de salud ni información de otras personas.</small></label>
          <div className={styles.trap} aria-hidden="true"><label>Sitio web<input tabIndex={-1} autoComplete="off" value={contact.website} onChange={e => setContact(c => ({ ...c, website: e.target.value }))} /></label></div>
          <aside className={styles.notice}><strong>Antes de enviar</strong><p>{screening.reasons.length ? "Marcaste que no podés cumplir algún requisito operativo. Podés revisar tus respuestas o enviarlas para que el equipo conozca tu situación; esta búsqueda requiere cumplirlos." : screening.clarify.length ? "Hay condiciones que necesitás aclarar. El equipo podrá revisarlas con vos antes de avanzar." : "Declaraste disponibilidad para los requisitos de esta búsqueda. La experiencia se revisará en una entrevista y evaluación práctica."}</p><button type="button" className={styles.textButton} onClick={() => move(0)}>Revisar disponibilidad</button></aside>
          <details><summary>Cómo cuidamos tus datos</summary><p>Burger Ya usará tus respuestas únicamente para esta búsqueda y para contactarte. Solo el equipo responsable de selección tendrá acceso. No pedimos CV, foto, DNI, edad, estado civil ni datos de salud. No usamos decisiones automáticas de contratación.</p><p>Conservación para esta búsqueda: hasta 90 días desde el envío; luego eliminamos el registro operativo. Podés pedir corrección o eliminación a Burger Ya en el local de Malaspina 1602, Hurlingham, indicando tu comprobante. No guardamos postulaciones para otras búsquedas sin una nueva autorización.</p></details>
          <label className={styles.option}><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} /><span>Leí el uso de datos y autorizo a Burger Ya a revisar mi postulación y contactarme por esta búsqueda.</span></label>
        </>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <div className={styles.actions}>{step > 0 && <button type="button" disabled={sending} onClick={() => move(step - 1)}>Atrás</button>}<button type="submit" className={styles.primary} disabled={sending}>{sending ? "Enviando…" : step < 2 ? "Continuar" : "Enviar postulación"}</button></div>
        <p className={styles.small}>Tus respuestas no se guardan en este dispositivo. Si cerrás o recargás la página antes de enviar, se pierden.</p>
        </fieldset>
      </form>
    </>}
    <footer><Link to="/">Volver al menú de Burger Ya</Link></footer>
  </main>;
}
