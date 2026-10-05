// Fontes abertas consultadas em ordem. Ambas servem os dados abertos do CNPJ da Receita Federal.
export const SOURCES = [
    { name: 'brasilapi', url: (c) => `https://brasilapi.com.br/api/cnpj/v1/${c}` },
    { name: 'minhareceita', url: (c) => `https://minhareceita.org/${c}` },
];

const UA = 'Mozilla/5.0 (compatible; brazil-cnpj-lookup/0.1; +https://apify.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Limite de cortesia com as APIs gratuitas: no máximo ~3 consultas por segundo no total.
const MIN_INTERVAL_MS = 350;
let nextSlot = 0;
async function throttle() {
    const now = Date.now();
    const wait = Math.max(0, nextSlot - now);
    nextSlot = Math.max(now, nextSlot) + MIN_INTERVAL_MS;
    if (wait) await sleep(wait);
}

/**
 * Consulta o CNPJ nas fontes. Retorna { data, source } ou { notFound: true } ou lança erro.
 * 404 em todas as fontes = não encontrado. 429/5xx = tenta de novo com espera.
 */
export async function fetchCnpj(cnpj, { fetchImpl = fetch, retries = 3, log = console } = {}) {
    let notFoundVotes = 0;
    let lastErr;
    for (const src of SOURCES) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                await throttle();
                const res = await fetchImpl(src.url(cnpj), {
                    headers: { 'user-agent': UA, accept: 'application/json' },
                    signal: AbortSignal.timeout(30000),
                });
                if (res.status === 404 || res.status === 400) { notFoundVotes++; break; }
                if (res.status === 429 || res.status >= 500) {
                    lastErr = new Error(`${src.name} HTTP ${res.status}`);
                    await sleep(1500 * 2 ** attempt + Math.random() * 500);
                    continue;
                }
                if (!res.ok) { lastErr = new Error(`${src.name} HTTP ${res.status}`); break; }
                const data = await res.json();
                if (data && (data.cnpj || data.razao_social)) return { data, source: src.name };
                lastErr = new Error(`${src.name} unexpected body`);
                break;
            } catch (e) {
                lastErr = e;
                await sleep(1000 * 2 ** attempt);
            }
        }
        log.debug?.(`Fallback after ${src.name}: ${lastErr?.message ?? 'not found'}`);
    }
    if (notFoundVotes === SOURCES.length) return { notFound: true };
    throw lastErr ?? new Error('all sources failed');
}
