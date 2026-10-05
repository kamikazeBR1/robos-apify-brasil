import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQueries, pageUrl, normalize, matches } from '../src/lib.js';

const raw = {
    orgaoEntidade: { cnpj: '44430221000175', razaoSocial: 'MUNICIPIO DE MURUTINGA DO SUL', esferaId: 'M' },
    unidadeOrgao: { ufSigla: 'SP', municipioNome: 'Murutinga do Sul', codigoIbge: '3532108', nomeUnidade: 'DEPTO' },
    anoCompra: 2026, sequencialCompra: 16, numeroControlePNCP: '44430221000175-1-000016/2026',
    objetoCompra: 'Aquisição de NOTEBOOKS e impressoras ', modalidadeNome: 'Pregão - Eletrônico', modalidadeId: 6,
    valorTotalEstimado: 857478.38, srp: true, dataEncerramentoProposta: '2026-10-15T08:30:00',
};

test('gera consultas por modalidade e UF', () => {
    const qs = buildQueries({ mode: 'open', states: ['sp', 'MG'], modalities: ['6'] }, new Date('2026-10-05T00:00:00Z'));
    assert.equal(qs.length, 2);
    const u = new URL(qs[0]);
    assert.equal(u.pathname, '/api/consulta/v1/contratacoes/proposta');
    assert.equal(u.searchParams.get('uf'), 'SP');
    assert.equal(u.searchParams.get('dataFinal'), '20271005');
    const p = new URL(buildQueries({ mode: 'published', dateFrom: '2026-10-01', dateTo: '2026-10-02' })[0]);
    assert.equal(p.pathname, '/api/consulta/v1/contratacoes/publicacao');
    assert.equal(p.searchParams.get('dataInicial'), '20261001');
    assert.equal(new URL(pageUrl(qs[0], 3)).searchParams.get('pagina'), '3');
});

test('normaliza contratação', () => {
    const t = normalize(raw);
    assert.equal(t.url, 'https://pncp.gov.br/app/editais/44430221000175/2026/16');
    assert.equal(t.object, 'Aquisição de NOTEBOOKS e impressoras');
    assert.equal(t.sphere, 'municipal');
    assert.equal(t.state, 'SP');
});

test('filtros de palavra e valor', () => {
    const t = normalize(raw);
    assert.ok(matches(t, { keywords: ['notebook'] }));
    assert.ok(matches(t, { keywords: ['aquisicao'] }));
    assert.ok(!matches(t, { keywords: ['merenda'] }));
    assert.ok(!matches(t, { keywords: ['notebook'], excludeKeywords: ['impressora'] }));
    assert.ok(matches(t, { minValue: 100000, maxValue: 1000000 }));
    assert.ok(!matches(t, { minValue: 1000000 }));
    const nov = { ...t, estimatedValue: 0 };
    assert.ok(matches(nov, { minValue: 10 }));
    assert.ok(!matches(nov, { minValue: 10, dropWithoutValue: true }));
});
