// Verificação simples de robots.txt (grupo "*"), para respeitar as regras do site.
const cache = new Map();

export function parseRobots(txt, agent = '*') {
    const groups = [];
    let cur = null;
    let lastWasAgent = false;
    for (const line of String(txt).split(/\r?\n/)) {
        const m = line.replace(/#.*/, '').trim().match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
        if (!m) continue;
        const [, k, v] = m;
        const key = k.toLowerCase();
        if (key === 'user-agent') {
            if (!lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
            cur.agents.push(v.toLowerCase());
            lastWasAgent = true;
        } else {
            lastWasAgent = false;
            if (cur && (key === 'allow' || key === 'disallow')) cur.rules.push({ allow: key === 'allow', path: v });
        }
    }
    const g = groups.find((x) => x.agents.includes(agent.toLowerCase())) ?? groups.find((x) => x.agents.includes('*'));
    return g ? g.rules.filter((r) => r.path !== '' || r.allow) : [];
}

function matches(path, rule) {
    const re = new RegExp('^' + rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    return re.test(path);
}

export function isAllowed(rules, path) {
    let best = null;
    for (const r of rules) {
        if (r.path && matches(path, r.path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
    }
    return best ? best.allow : true;
}

export async function checkRobots(url, { fetchImpl = fetch } = {}) {
    const u = new URL(url);
    if (!cache.has(u.origin)) {
        let rules = [];
        try {
            const res = await fetchImpl(`${u.origin}/robots.txt`, { signal: AbortSignal.timeout(15000) });
            if (res.ok) rules = parseRobots(await res.text());
        } catch { /* sem robots.txt = sem restrição */ }
        cache.set(u.origin, rules);
    }
    return isAllowed(cache.get(u.origin), u.pathname + u.search);
}
