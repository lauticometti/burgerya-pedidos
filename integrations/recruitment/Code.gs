// Bound Google Apps Script: paste into Extensions > Apps Script in a PRIVATE Sheet.
// Properties: RECRUITMENT_SECRET (same as Vercel), SPREADSHEET_ID.
// No candidate data is ever returned. No doGet/list endpoint exists.
const HEADERS = ['ID', 'Recibida UTC', 'Búsqueda', 'Versión', 'Salida informada', 'Clasificación', 'Motivos', 'Aclarar', 'Nombre', 'Teléfono', 'Localidad', 'Presencial', 'Días', '19:30 listo', 'Turno completo', 'Continuidad', 'Experiencia', 'Autonomía', 'Alta demanda', 'Inicio', 'Aclaración', 'Consentimiento', 'Estado de revisión', 'Notas internas'];
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function sheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(id).getSheetByName('Postulaciones');
}
function safeCell_(value) {
  // Prevent spreadsheet formula injection, including whitespace-prefixed formulas.
  const text = String(value == null ? '' : value);
  return /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
}
function doPost(e) {
  let lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 16000) return json_({ ok: false });
    const input = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('RECRUITMENT_SECRET');
    if (!secret || secret.length < 32 || input.secret !== secret) return json_({ ok: false });
    const r = input.record;
    if (!r || !/^[a-f0-9-]{36}$/i.test(r.id) || !Array.isArray(r.responseLabels) || r.responseLabels.length !== 9 || r.consent !== true || !Number.isFinite(Date.parse(r.receivedAt))) return json_({ ok: false });
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return json_({ ok: false });
    const sheet = sheet_();
    if (!sheet || sheet.getRange(1, 1).getValue() !== 'ID') return json_({ ok: false });
    // Atomic duplicate detection + append. Retry after a lost response never duplicates a row.
    if (sheet.getLastRow() > 1) {
      const match = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(r.id).matchEntireCell(true).findNext();
      if (match) return json_({ ok: true, id: r.id });
    }
    const row = [r.id, r.receivedAt, r.campaign, r.version, r.shiftEnd,
      r.classification.status, r.classification.reasons.join(', '), r.classification.clarify.join(', '),
      r.name, r.phone, r.locality].concat(r.responseLabels, [r.notes, 'Sí · aviso v1', 'Nueva', '']);
    sheet.appendRow(row.map(safeCell_));
    SpreadsheetApp.flush();
    return json_({ ok: true, id: r.id });
  } catch (_) { return json_({ ok: false }); }
  finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
function setupRecruitment() {
  const book = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
  const sheet = book.getSheetByName('Postulaciones') || book.insertSheet('Postulaciones');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#ffc62a');
    sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length).createFilter();
  }
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'deleteExpiredApplications')) {
    ScriptApp.newTrigger('deleteExpiredApplications').timeBased().everyDays(1).create();
  }
}
function deleteExpiredApplications() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = sheet_();
    if (!sheet || sheet.getLastRow() < 2) return;
    const dates = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
    const cutoff = Date.now() - 90 * 86400000;
    for (let i = dates.length - 1; i >= 0; i--) {
      if (Date.parse(dates[i][0]) < cutoff) sheet.deleteRow(i + 2);
    }
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}
