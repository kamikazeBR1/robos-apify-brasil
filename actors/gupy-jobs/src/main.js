import { Actor, log } from 'apify';
import { checkRobots } from './robots.js';
import { buildUrl, normalizeJob, matchesFilters } from './lib.js';

const EVENT = 'job-result';
await Actor.init();
const input = (await Actor.getInput()) ?? {};
const keywords = (input.keywords?.length ? input.keywords : ['']).map((k) => String(k).trim());
const maxItems = Number(input.maxItems ?? 100);
const filters = {
    workplaceTypes: input.workplaceTypes ?? [],
    states: (input.states ?? []).map((s) => String(s).toUpperCase()),
    cities: input.cities ?? [],
    postedWithinDays: input.postedWithinDays ?? null,
    companies: input.companies ?? [],
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const seen = new Set();
let pushed = 0;
let stop = false;

async function getJson(url) {
    for (let attempt = 0; attempt < 5; attempt++) {
        const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (compatible; gupy-jobs-scraper/0.1)' }, signal: AbortSignal.timeout(30000) }).catch((e) => ({ err: e }));
        if (res.err) { await sleep(2000 * 2 ** attempt); continue; }
        if (res.status === 429 || res.status >= 500) { await sleep(2000 * 2 ** attempt); continue; }
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return res.json();
    }
    throw new Error(`Failed after retries: ${url}`);
}

for (const kw of keywords) {
    if (stop) break;
    let offset = 0;
    const limit = 100;
    let emptyPages = 0;
    while (!stop && pushed < maxItems) {
        const url = buildUrl({ keyword: kw, offset, limit, filters });
        if (!(await checkRobots(url))) { log.warning(`robots.txt disallows ${url}, skipping.`); break; }
        const body = await getJson(url);
        const jobs = body?.data ?? [];
        if (offset === 0) log.info(`Searching "${kw || "(all jobs)"}"...`);
        if (!jobs.length) break;
        if (offset === 0 && kw === keywords[0]) log.debug(`Raw: ${JSON.stringify({ ...jobs[0], description: undefined })} pag: ${JSON.stringify(body.pagination)}`);
        let pagePushed = 0;
        for (const raw of jobs) {
            if (seen.has(raw.id)) continue;
            seen.add(raw.id);
            const job = normalizeJob(raw, kw);
            if (!matchesFilters(job, filters)) continue;
            const charge = await Actor.pushData(job, EVENT);
            pushed++; pagePushed++;
            if (charge?.eventChargeLimitReached) { log.warning('Maximum cost per run reached, stopping.'); stop = true; break; }
            if (pushed >= maxItems) break;
        }
        emptyPages = pagePushed ? 0 : emptyPages + 1;
        if (emptyPages >= 20) { log.info('No matches in the last 20 pages, moving on.'); break; }
        offset += jobs.length;
        if (jobs.length < limit) break;
        // Com filtro de recência a busca vem ordenada por data: parar quando a página já for antiga.
        const last = jobs[jobs.length - 1]?.publishedDate;
        if (filters.postedWithinDays && last && Date.now() - Date.parse(last) > filters.postedWithinDays * 86400000) break;
        await sleep(300);
    }
}
log.info(`Done: ${pushed} jobs.`);
await Actor.exit();
