// ============================================================================
// FUENTE ÚNICA DE VERDAD DE HORARIOS — Burger Ya
// ============================================================================
// Este archivo es SOLO datos: no hay que tocar storeClosedMode.js para
// cambiar un horario. Todos los horarios están en formato "HH:MM".
//
// Cómo funciona:
//  1. WEEKLY_SCHEDULE define el horario normal de cada día de la semana.
//  2. DATE_OVERRIDES define excepciones para una fecha puntual (feriado,
//     evento especial, cierre extra, apertura extra, etc.) que REEMPLAZAN
//     por completo el horario normal de ese día.
//
// Un turno con open y close define de qué hora a qué hora se puede pedir.
// "cookingStart" es opcional: si no se pone, la cocina arranca 30 minutos
// después de abrir (ventana de pre-pedido normal). Si se pone, la cocina
// arranca a esa hora exacta (por ej. para aperturas de urgencia sin ventana
// de pre-pedido).
// ============================================================================

// ---------------------------------------------------------------------------
// 1) HORARIO SEMANAL NORMAL
// ---------------------------------------------------------------------------
// Un array vacío [] = cerrado ese día.
// Para cambiar el horario habitual, editá los horarios acá.
export const WEEKLY_SCHEDULE = {
  domingo:   [{ open: "20:00", close: "00:00" }],
  lunes:     [],
  martes:    [],
  miercoles: [{ open: "20:00", close: "00:00" }],
  jueves:    [{ open: "20:00", close: "00:00" }],
  viernes:   [{ open: "20:00", close: "00:00" }],
  sabado:    [{ open: "20:00", close: "00:00" }],
};

// ---------------------------------------------------------------------------
// 2) EXCEPCIONES POR FECHA PUNTUAL
// ---------------------------------------------------------------------------
// Formato de fecha: "YYYY-MM-DD" (hora Argentina). Reemplaza por completo el
// horario normal de ese día (no se suma, se pisa entero).
//
// Usos típicos:
//  - Abrir un día que normalmente está cerrado (ej: final de Copa
//    Libertadores un martes): agregá la fecha con el turno que corresponda.
//  - Cerrar un día que normalmente abre: agregá la fecha con array vacío [].
//  - Cambiar el horario de un día puntual (evento especial, feriado con
//    horario distinto, etc.).
//
// Ejemplo para abrir un martes especial (ej. final de Copa Libertadores):
//   "2026-11-24": [{ open: "20:00", close: "00:00" }],
//
// Ejemplo para cerrar un miércoles que normalmente abre:
//   "2026-08-05": [],
//
// Ejemplo de apertura de urgencia sin ventana de pre-pedido (cocina arranca
// junto con la apertura, no 30 min después):
//   "2026-09-10": [{ open: "21:00", close: "00:00", cookingStart: "21:00" }],
export const DATE_OVERRIDES = {
  // Sin excepciones activas por ahora. Agregá acá las próximas.
};

// ---------------------------------------------------------------------------
// 3) FERIADOS NACIONALES ARGENTINA 2026
// ---------------------------------------------------------------------------
// Todo feriado de esta lista abre automáticamente con HOLIDAY_SCHEDULE
// (por defecto, el mismo horario noche 20:00-00:00), incluso si cae lunes o
// martes (días normalmente cerrados). Si un feriado puntual necesita otro
// horario (o cerrar), cargá una excepción en DATE_OVERRIDES para esa fecha:
// tiene prioridad sobre esta lista.
export const HOLIDAY_SCHEDULE = [{ open: "20:00", close: "00:00" }];

export const FERIADOS_2026 = [
  "2026-01-01", // Año Nuevo
  "2026-02-16", // Carnaval
  "2026-02-17", // Carnaval
  "2026-03-24", // Día de la Memoria
  "2026-04-02", // Malvinas
  "2026-04-03", // Viernes Santo
  "2026-05-01", // Día del Trabajador
  "2026-05-25", // Revolución de Mayo
  "2026-06-15", // Paso a la Inmortalidad de Güemes
  "2026-06-20", // Paso a la Inmortalidad de Belgrano
  "2026-07-09", // Independencia
  "2026-08-17", // Paso a la Inmortalidad de San Martín
  "2026-10-12", // Día del Respeto a la Diversidad Cultural
  "2026-11-23", // Día de la Soberanía Nacional
  "2026-12-08", // Inmaculada Concepción de María
  "2026-12-25", // Navidad
];
