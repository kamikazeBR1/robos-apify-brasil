import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUrl, normalizeJob, matchesFilters } from '../src/lib.js';
import { parseRobots, isAllowed } from '../src/robots.js';

const raw = {
    id: 12664935, name: 'Analista de Dados ', applicationDeadline: '2026-11-30T00:00:00.000Z', careerPageName: 'Porto',
    careerPageLogo: 'https://x/logo.jpg', careerPageUrl: '', type: 'vacancy_type_effective', publishedDate: '2026-10-02T21:08:09.808Z',
    workplaceType: 'on-site', city: 'São Paulo', state: 'São Paulo',
    jobUrl: 'https://porto.gupy.io/job/abc=?jobBoardSource=gupy_portal', disabilities: true, description: '<p>Olá&nbsp;mundo</p>',
};

test('monta URL da busca', () => {
    const u = new URL(buildUrl({ keyword: 'python', offset: 100, filters: { states: ['SP'], postedWithinDays: 2 } }));
    assert.equal(u.pathname, '/api/job-search/jobs');
    assert.equal(u.searchParams.get('jobName'), 'python');
    assert.equal(u.searchParams.get('offset'), '100');
    assert.equal(u.searchParams.get('state'), 'São Paulo');
    assert.equal(u.searchParams.get('sortBy'), 'publishedDate');
});

test('normaliza vaga', () => {
    const j = normalizeJob(raw, 'dados');
    assert.equal(j.title, 'Analista de Dados');
    assert.equal(j.stateCode, 'SP');
    assert.equal(j.careerPageUrl, null);
    assert.equal(j.url, 'https://porto.gupy.io/job/abc=');
    assert.equal(j.description, 'Olá mundo');
    assert.equal(j.acceptsPeopleWithDisabilities, true);
});

test('filtros locais', () => {
    const j = normalizeJob(raw);
    const now = Date.parse('2026-10-04T00:00:00Z');
    assert.ok(matchesFilters(j, { states: ['SP'], cities: ['sao paulo'], companies: ['port'] }, now));
    assert.ok(!matchesFilters(j, { states: ['RJ'] }, now));
    assert.ok(!matchesFilters(j, { workplaceTypes: ['remote'] }, now));
    assert.ok(matchesFilters(j, { postedWithinDays: 2 }, now));
    assert.ok(!matchesFilters(j, { postedWithinDays: 1 }, now));
});

test('robots.txt', () => {
    const rules = parseRobots('User-agent: *\nDisallow: /admin\nAllow: /admin/public\n\nUser-agent: other\nDisallow: /');
    assert.ok(isAllowed(rules, '/api/job-search/jobs'));
    assert.ok(!isAllowed(rules, '/admin/x'));
    assert.ok(isAllowed(rules, '/admin/public/y'));
    assert.ok(isAllowed(parseRobots('User-agent: *\nDisallow:'), '/anything'));
});
