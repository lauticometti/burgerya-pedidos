import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
import { CAMPAIGN, QUESTIONS, classify, validateApplication } from '../../src/recruitment/schema.js';
vi.mock('../_lib/rateLimitStore.js', () => ({ incrWithTTL: vi.fn(), usingMemoryStore: vi.fn() }));
import { incrWithTTL, usingMemoryStore } from '../_lib/rateLimitStore.js';
import handler from '../postulaciones.js';
const sample = () => ({ id: '12345678-1234-1234-1234-123456789abc', campaign: CAMPAIGN.id, version: CAMPAIGN.version, shiftEnd: '01:00', name: 'Persona de prueba', phone: '+54 9 11 5555 1234', locality: 'Hurlingham', notes: '', consent: true, answers: Object.fromEntries(QUESTIONS.map(q => [q.key, q.options[0][0]])) });
async function call(body = sample(), overrides = {}) {
  const req = { method: 'POST', headers: { origin: 'https://burgerya.com.ar', 'content-type': 'application/json' }, body, ...overrides };
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(data) { this.data = data; return this; } };
  await handler(req, res); return res;
}
beforeEach(() => {
  vi.stubEnv('RECRUITMENT_ENABLED', 'true'); vi.stubEnv('RECRUITMENT_SHIFT_END', '01:00');
  vi.stubEnv('RECRUITMENT_ORIGIN', 'https://burgerya.com.ar');
  vi.stubEnv('RECRUITMENT_SHEETS_URL', 'https://script.google.com/macros/s/test/exec');
  vi.stubEnv('RECRUITMENT_SECRET', 's'.repeat(64));
  usingMemoryStore.mockReturnValue(false); incrWithTTL.mockResolvedValue(1);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, id: sample().id }) }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('operational screening', () => {
  it('only uses mandatory availability, never experience or locality', () => {
    const data = sample(); expect(classify(data.answers).status).toBe('Cumple disponibilidad declarada');
    data.locality = 'Otra localidad'; data.answers.experiencia = 'sin'; data.answers.autonomia = 'aprender';
    expect(validateApplication(data, '01:00').classification.reasons).toEqual([]);
  });
  it.each(QUESTIONS.filter(q => q.mandatory).map(q => [q.key]))('identifies no and uncertain for %s', key => {
    const data = sample(); data.answers[key] = 'no'; expect(classify(data.answers).reasons).toEqual([key]);
    data.answers[key] = 'consultar'; expect(classify(data.answers).clarify).toEqual([key]);
  });
  it('rejects missing/forged answers, consent and stale shift', () => {
    for (const patch of [{ consent: false }, { answers: {} }, { shiftEnd: '00:00' }, { campaign: 'fake' }, { phone: 'abc12345' }, { notes: 'x'.repeat(601) }]) expect(validateApplication({ ...sample(), ...patch }, '01:00').error).toBeTruthy();
  });
});
describe('private intake', () => {
  it('returns configuration only, never submitted data', async () => {
    const res = await call(sample(), { method: 'GET' });
    expect(res.data).toEqual({ open: true, campaign: CAMPAIGN, shiftEnd: '01:00' }); expect(fetch).not.toHaveBeenCalled();
  });
  it('fails closed without setup or durable rate limits', async () => {
    usingMemoryStore.mockReturnValue(true); expect((await call()).code).toBe(503);
    expect((await call(null, { method: 'GET' })).data.open).toBe(false); expect(fetch).not.toHaveBeenCalled();
  });
  it('fails closed after search closes', async () => {
    vi.stubEnv('RECRUITMENT_ENABLED', 'false'); expect((await call()).code).toBe(503);
  });
  it('rejects cross origin, unsupported methods, malformed/large content and honeypot', async () => {
    expect((await call(sample(), { headers: { origin: 'https://other.example' } })).code).toBe(403);
    expect((await call(sample(), { method: 'DELETE' })).code).toBe(405);
    expect((await call(sample(), { headers: { origin: 'https://burgerya.com.ar', 'content-type': 'text/plain' } })).code).toBe(415);
    expect((await call('{bad')).code).toBe(400);
    expect((await call({ ...sample(), notes: 'x'.repeat(9000) })).code).toBe(413);
    expect((await call({ ...sample(), website: 'bot' })).code).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('ignores forged classification and extra fields; confirms only durable receipt', async () => {
    const data = sample(); data.answers.dias = 'no';
    const res = await call({ ...data, classification: { status: 'Approved' }, dni: 'discard' });
    expect(res.code).toBe(201); const sent = JSON.parse(fetch.mock.calls[0][1].body).record;
    expect(sent.classification.reasons).toEqual(['dias']); expect(sent.dni).toBeUndefined();
    expect(res.data).toEqual({ ok: true, id: data.id });
  });
  it('limits abusive submissions without writing', async () => {
    incrWithTTL.mockResolvedValue(501); expect((await call()).code).toBe(429); expect(fetch).not.toHaveBeenCalled();
  });
  it('fails closed on Redis failure', async () => {
    incrWithTTL.mockRejectedValue(new Error('secret detail')); expect((await call()).code).toBe(503); expect(fetch).not.toHaveBeenCalled();
  });
  it('never reports success on missing receipt, wrong ID, timeout, or upstream failure', async () => {
    for (const response of [{ ok: false }, { ok: true, json: async () => ({ ok: false }) }, { ok: true, json: async () => ({ ok: true, id: 'other' }) }]) {
      fetch.mockResolvedValue(response); expect((await call()).code).toBe(503);
    }
    fetch.mockRejectedValue(new Error('timeout')); expect((await call()).code).toBe(503);
  });
});
describe('Apps Script receiver (simulated Google services)', () => {
  function script() {
    const rows = [['ID']]; let locked = false;
    const sheet = { getLastRow: () => rows.length, getRange: (start, col, count) => ({
      getValue: () => rows[0][0], getValues: () => rows.slice(start - 1, start - 1 + count).map(row => [row[col - 1]]),
      createTextFinder: id => ({ matchEntireCell: () => ({ findNext: () => rows.find(row => row[0] === id) }) }),
    }), appendRow: row => rows.push(row), deleteRow: n => rows.splice(n - 1, 1) };
    const context = vm.createContext({ Date, JSON, Number, String, Array,
      PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === 'RECRUITMENT_SECRET' ? 's'.repeat(64) : 'sheet' }) },
      SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush: () => {} },
      LockService: { getScriptLock: () => ({ tryLock: () => { locked = true; return true; }, waitLock: () => { locked = true; }, hasLock: () => locked, releaseLock: () => { locked = false; } }) },
      ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
    });
    vm.runInContext(fs.readFileSync(new URL('../../integrations/recruitment/Code.gs', import.meta.url), 'utf8'), context);
    const valid = validateApplication(sample(), '01:00');
    const payload = { secret: 's'.repeat(64), record: { ...valid.data, classification: valid.classification, responseLabels: Array(9).fill('Sí'), receivedAt: new Date().toISOString() } };
    const send = p => context.doPost({ postData: { contents: JSON.stringify(p) } });
    return { context, rows, payload, send, isLocked: () => locked };
  }
  it('requires secret, appends once, deduplicates retries, releases lock', () => {
    const { rows, payload, send, isLocked } = script();
    expect(send({ ...payload, secret: 'wrong' }).ok).toBe(false); expect(rows).toHaveLength(1);
    expect(send(payload)).toEqual({ ok: true, id: sample().id }); expect(send(payload).ok).toBe(true);
    expect(rows).toHaveLength(2); expect(rows[1]).toHaveLength(24); expect(isLocked()).toBe(false);
  });
  it('neutralizes formulas and deletes only expired rows', () => {
    const { context, rows, payload, send } = script();
    payload.record.name = ' =IMPORTXML("malicious")'; send(payload);
    expect(rows[1][8].startsWith("'")).toBe(true);
    rows.push(['old', '2020-01-01T00:00:00Z']);
    context.deleteExpiredApplications(); expect(rows).toHaveLength(2); expect(rows[1][0]).toBe(sample().id);
  });
});
