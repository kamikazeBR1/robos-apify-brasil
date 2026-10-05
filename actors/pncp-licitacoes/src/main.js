import { Actor, log } from 'apify';
import { checkRobots } from './robots.js';
import { buildQueries, pageUrl, normalize, matches } from './lib.js';

const EVENT = 'tender-result';
await Actor.init();
const input = (await Actor.getInput()) ?? {};
const maxItems = Number(input.maxItems ?? 1000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const store = input.onlyNew ? await Actor.openKeyValueStore('brazil-pncp-monitor') : null;
const SEEN_KEY = `seen-${input.mode === 'published' ? 'published' : 'open'}`;
const seenBefore = new Set(store ? (await store.getValue(SEEN_KEY)) ?? [] : []);
const seenNow = new Set();
const delivered = [];

async function getJson(url) {
    for (let attempt = 0; attempt < 6; attempt++) {
        const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (compatible; brazil-public-tenders/0.1)' }, signal: AbortSignal.timeout(90000) }).catch((e) => ({ err: e }));
        if (!res.err && res.status === 204) return { data: [], paginasRestantes: 0 };
        if (!res.err && res.ok) return res.json();
        if (!res.err && res.status >= 400 && res.status < 429) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
        await sleep(3000 * 2 ** attempt);
    }
    throw new Error(`Failed after retries: ${url}`);
}

let pushed = 0, scanned = 0, stop = false;
const CONCURRENCY = 4;

async function handleRows(rows) {
    for (const r of rows) {
        if (stop) return;
        scanned++;
        const t = normalize(r);
        if (!t.id || seenNow.has(t.id)) continue;
        seenNow.add(t.id);
        if (seenBefore.has(t.id) || !matches(t, input)) continue;
        const charge = await Actor.pushData({ ...t, scrapedAt: new Date().toISOString() }, EVENT);
        pushed++;
        delivered.push(t.id);
        if (charge?.eventChargeLimitReached) { log.warning('Maximum cost per run reached, stopping.'); stop = true; return; }
        if (pushed >= maxItems) { stop = true; return; }
    }
}

const queries = buildQueries(input);
log.info(`${queries.length} PNCP queries to run.`);
for (const q of queries) {
    if (stop) break;
    if (!(await checkRobots(q))) { log.warning(`robots.txt disallows ${q}`); continue; }
    let first;
    try { first = await getJson(pageUrl(q, 1)); } catch (e) { log.warning(`${e.message} (${q})`); continue; }
    const totalPages = Number(first?.totalPaginas ?? 1);
    log.info(`${first?.totalRegistros ?? 0} tenders (${totalPages} pages) for ${new URL(q).search}`);
    await handleRows(first?.data ?? []);
    // Demais páginas em paralelo, processadas em ordem.
    for (let p = 2; p <= totalPages && !stop; p += CONCURRENCY) {
        const pages = [];
        for (let i = p; i < p + CONCURRENCY && i <= totalPages; i++) pages.push(i);
        const bodies = await Promise.all(pages.map((n) => getJson(pageUrl(q, n)).catch((e) => { log.warning(`${e.message} (p${n})`); return null; })));
        for (const b of bodies) if (b && !stop) await handleRows(b.data ?? []);
    }
}
if (store) {
    // Mantém o histórico limitado para não crescer sem fim.
    const all = [...new Set([...seenBefore, ...delivered])].slice(-200000);
    await store.setValue(SEEN_KEY, all);
}
log.info(`Done: scanned ${scanned}, returned ${pushed}.`);
await Actor.exit();
