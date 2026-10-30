export const CAMPAIGN = { id: "planchero-2026-10", version: 1, title: "Planchero/a" };
const availability = [["si", "Sí"], ["no", "No"], ["consultar", "Necesito aclararlo"]];
export const QUESTIONS = [
  { key: "presencial", title: "¿Podés trabajar presencialmente en Hurlingham?", options: availability, mandatory: true },
  { key: "dias", title: "¿Podés trabajar de miércoles a domingo y los feriados que correspondan a la operación?", options: availability, mandatory: true },
  { key: "puntualidad", title: "¿Podés estar cambiado/a y listo/a para trabajar a las 19:30?", help: "Necesitás llegar antes para prepararte. Las 19:30 son el inicio del trabajo.", options: availability, mandatory: true },
  { key: "turno", title: "¿Tenés disponibilidad para todo el turno nocturno, incluido el cierre?", options: availability, mandatory: true },
  { key: "continuidad", title: "¿Podés sostener estos días y horarios de forma continua?", options: availability, mandatory: true },
  { key: "experiencia", title: "¿Cuánta experiencia tenés trabajando con plancha en gastronomía?", options: [["sin", "Todavía no tengo"], ["menos6", "Menos de 6 meses"], ["6a12", "De 6 meses a 1 año"], ["mas1", "Más de 1 año"]] },
  { key: "autonomia", title: "¿Qué nivel de autonomía tenés en plancha?", options: [["aprender", "Necesito aprender desde el inicio"], ["apoyo", "Puedo producir con acompañamiento"], ["autonomo", "Puedo organizar y sostener la producción siguiendo recetas y procedimientos"]] },
  { key: "demanda", title: "Cuando se acumulan comandas, ¿qué harías primero?", options: [["ordenar", "Ordenar la tanda, comunicar demoras y pedir apoyo sin saltear controles"], ["acelerar", "Acelerar todo aunque deje controles para después"], ["solo", "Intentar resolver todo sin avisar"], ["sin", "No viví esa situación; necesitaría acompañamiento"]] },
  { key: "inicio", title: "¿Cuándo podrías comenzar?", options: [["inmediato", "Disponibilidad inmediata"], ["semana", "Dentro de una semana"], ["quincena", "Dentro de dos semanas"], ["acordar", "Necesito acordar una fecha"]] },
];
export function classify(answers) {
  const missing = QUESTIONS.filter(q => q.mandatory && answers[q.key] === "no").map(q => q.key);
  const clarify = QUESTIONS.filter(q => q.mandatory && answers[q.key] === "consultar").map(q => q.key);
  return { status: missing.length ? "No cumple requisitos operativos" : clarify.length ? "Disponibilidad por aclarar" : "Cumple disponibilidad declarada", reasons: missing, clarify };
}
export function validateApplication(input, shiftEnd) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Formulario inválido." };
  if (input.campaign !== CAMPAIGN.id || input.version !== CAMPAIGN.version || input.shiftEnd !== shiftEnd) return { error: "La búsqueda cambió. Recargá la página antes de enviar." };
  if (typeof input.id !== "string" || !/^[a-f0-9-]{36}$/i.test(input.id)) return { error: "Identificador inválido. Recargá la página." };
  const limits = { name: [2, 100], phone: [8, 30], locality: [2, 100], notes: [0, 600] };
  const data = { id: input.id, campaign: CAMPAIGN.id, version: CAMPAIGN.version, shiftEnd };
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (typeof input[key] !== "string" || input[key].trim().length < min || input[key].length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(input[key])) return { error: "Revisá los datos de contacto y los límites de texto." };
    data[key] = input[key].trim();
  }
  if (!/^[+()\d\s-]+$/.test(data.phone) || data.phone.replace(/\D/g, "").length < 8 || data.phone.replace(/\D/g, "").length > 15) return { error: "Ingresá un teléfono válido con código de área." };
  data.answers = {};
  for (const q of QUESTIONS) {
    const value = input.answers?.[q.key];
    if (!q.options.some(([id]) => id === value)) return { error: "Respondé todas las preguntas de opción múltiple." };
    data.answers[q.key] = value;
  }
  if (input.consent !== true) return { error: "Necesitamos tu autorización para revisar la postulación." };
  data.consent = true;
  return { data, classification: classify(data.answers) };
}
