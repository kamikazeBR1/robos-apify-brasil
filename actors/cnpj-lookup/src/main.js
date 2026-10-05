import { Actor, log } from 'apify';
import { cleanCnpj, isValidCnpj, formatCnpj, normalize, diff } from './lib.js';
import { fetchCnpj } from './sources.js';

const EVENT = 'company-result';

await Actor.init();
const input = (await Actor.getInput()) ?? {};
const { includePartners = true, monitorChanges = false, onlyChanged = false } = input;
const maxConcurrency = Math.min(Math.max(Number(input.maxConcurrency) || 4, 1), 10);

const raw = [...(input.cnpjs ?? [])].flatMap((s) => String(s).split(/[\s,;]+/)).filter(Boolean);
const seen = new Set();
const queue = [];
let invalid = 0;
for (const r of raw) {
    const c = cleanCnpj(r);
    if (seen.has(c)) continue;
    seen.add(c);
    if (!isValidCnpj(c)) {
        invalid++;
        await Actor.pushData({ input: r, cnpj: c, lookupStatus: 'INVALID_CNPJ' });
        continue;
    }
    queue.push(c);
}
log.info(`${queue.length} valid CNPJs to look up, ${invalid} invalid (not charged).`);

const store = monitorChanges ? await Actor.openKeyValueStore('brazil-cnpj-monitor') : null;
let stop = false;
let ok = 0, notFound = 0, failed = 0;

async function worker() {
    while (!stop && queue.length) {
        const c = queue.shift();
        try {
            const res = await fetchCnpj(c, { log });
            if (res.notFound) {
                notFound++;
                await Actor.pushData({ cnpj: c, cnpjFormatted: formatCnpj(c), lookupStatus: 'NOT_FOUND' });
                continue;
            }
            const item = normalize(res.data, { includePartners });
            let changes;
            if (store) {
                const prev = await store.getValue(c);
                changes = diff(prev, item);
                await store.setValue(c, item);
                if (onlyChanged && changes && changes.length === 0) { ok++; continue; }
            }
            const out = {
                ...item,
                ...(store ? { isNew: changes === null, changes: changes ?? [] } : {}),
                lookupStatus: 'OK',
                source: res.source,
                fetchedAt: new Date().toISOString(),
            };
            const charge = await Actor.pushData(out, EVENT);
            ok++;
            if (charge?.eventChargeLimitReached) {
                log.warning('Maximum cost per run reached, stopping.');
                stop = true;
            }
        } catch (e) {
            failed++;
            log.warning(`${c}: ${e.message}`);
            await Actor.pushData({ cnpj: c, cnpjFormatted: formatCnpj(c), lookupStatus: 'ERROR', error: e.message });
        }
    }
}

await Promise.all(Array.from({ length: maxConcurrency }, worker));
const summary = { valid: seen.size - invalid, invalid, ok, notFound, failed };
log.info('Done', summary);
await Actor.setValue('SUMMARY', summary);
await Actor.exit();
