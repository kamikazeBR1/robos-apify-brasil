import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cleanCnpj, isValidCnpj, formatCnpj, normalize, diff } from '../src/lib.js';
import { fetchCnpj } from '../src/sources.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/brasilapi.json', import.meta.url)));

test('valida CNPJ numérico', () => {
    assert.ok(isValidCnpj('00.000.000/0001-91'));
    assert.ok(isValidCnpj('33000167000101'));
    assert.ok(!isValidCnpj('00.000.000/0001-92'));
    assert.ok(!isValidCnpj('11111111111111'));
    assert.ok(!isValidCnpj('123'));
});

test('valida CNPJ alfanumérico (exemplo oficial da Receita)', () => {
    assert.ok(isValidCnpj('12.ABC.345/01DE-35'));
    assert.ok(!isValidCnpj('12.ABC.345/01DE-36'));
    assert.equal(cleanCnpj('12.abc.345/01de-35'), '12ABC34501DE35');
    assert.equal(formatCnpj('12ABC34501DE35'), '12.ABC.345/01DE-35');
});

test('normaliza resposta do BrasilAPI', () => {
    const n = normalize(fixture);
    assert.equal(n.cnpjFormatted, '00.000.000/0001-91');
    assert.equal(n.legalName, 'BANCO DO BRASIL SA');
    assert.equal(n.status, 'ATIVA');
    assert.equal(n.branchType, 'MATRIZ');
    assert.deepEqual(n.mainActivity, { code: '6422100', description: 'Bancos múltiplos, com carteira comercial' });
    assert.equal(n.secondaryActivities.length, 1);
    assert.deepEqual(n.phones, ['6134939002']);
    assert.equal(n.email, 'secex@bb.com.br');
    assert.equal(n.zipCode, '70040912');
    assert.equal(n.simplesNacional.optedIn, false);
    assert.equal(n.partners[0].name, 'TARCIANA PAULA GOMES MEDEIROS');
    assert.equal(normalize(fixture, { includePartners: false }).partners, undefined);
});

test('diff aponta mudanças', () => {
    const a = normalize(fixture);
    const b = normalize({ ...fixture, descricao_situacao_cadastral: 'BAIXADA', email: 'x@y.com' });
    assert.equal(diff(null, a), null);
    assert.deepEqual(diff(a, a), []);
    assert.deepEqual(diff(a, b).map((c) => c.field), ['status', 'email']);
});

const resp = (status, body) => ({ status, ok: status < 300, json: async () => body });

test('usa a segunda fonte quando a primeira falha', async () => {
    const calls = [];
    const r = await fetchCnpj('00000000000191', {
        retries: 0,
        fetchImpl: async (url) => { calls.push(url); return url.includes('brasilapi') ? resp(403, {}) : resp(200, fixture); },
    });
    assert.equal(r.source, 'minhareceita');
    assert.equal(calls.length, 2);
});

test('404 em todas as fontes = não encontrado', async () => {
    const r = await fetchCnpj('00000000000191', { retries: 0, fetchImpl: async () => resp(404, {}) });
    assert.deepEqual(r, { notFound: true });
});
