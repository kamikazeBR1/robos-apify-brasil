export const BASE = 'https://pncp.gov.br/api/consulta/v1';
export const PAGE_SIZE = 50;

export const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ymd = (d) => d.replace(/-/g, '').slice(0, 8);

/** Gera as URLs de consulta (uma combinação por modalidade × UF × município × órgão). */
export function buildQueries(input, today = new Date()) {
    const mode = input.mode === 'published' ? 'published' : 'open';
    const modalities = input.modalities?.length ? input.modalities : ['6', '4'];
    const states = input.states?.length ? input.states.map((s) => String(s).toUpperCase().trim()) : [null];
    const cities = input.cityIbgeCodes?.length ? input.cityIbgeCodes.map((c) => String(c).replace(/\D/g, '')) : [null];
    const cnpjs = input.agencyCnpjs?.length ? input.agencyCnpjs.map((c) => String(c).replace(/\D/g, '')) : [null];
    const iso = (d) => d.toISOString().slice(0, 10);
    const dateTo = input.dateTo ? input.dateTo.slice(0, 10) : iso(today);
    const dateFrom = input.dateFrom ? input.dateFrom.slice(0, 10) : iso(new Date(today.getTime() - 7 * 86400000));
    // Para "abertas", a API pede uma data final de recebimento de propostas: usamos um horizonte de 1 ano.
    const openUntil = iso(new Date(today.getTime() + 365 * 86400000));
    const out = [];
    for (const m of modalities) for (const uf of states) for (const city of cities) for (const cnpj of cnpjs) {
        const u = new URL(`${BASE}/contratacoes/${mode === 'open' ? 'proposta' : 'publicacao'}`);
        if (mode === 'open') u.searchParams.set('dataFinal', ymd(openUntil));
        else { u.searchParams.set('dataInicial', ymd(dateFrom)); u.searchParams.set('dataFinal', ymd(dateTo)); }
        u.searchParams.set('codigoModalidadeContratacao', String(m));
        if (uf) u.searchParams.set('uf', uf);
        if (city) u.searchParams.set('codigoMunicipioIbge', city);
        if (cnpj) u.searchParams.set('cnpj', cnpj);
        u.searchParams.set('tamanhoPagina', String(PAGE_SIZE));
        out.push(u.toString());
    }
    return out;
}

export function pageUrl(base, page) {
    const u = new URL(base);
    u.searchParams.set('pagina', String(page));
    return u.toString();
}

const nz = (v) => (v === undefined || v === null || v === '' ? null : v);

export function normalize(r) {
    const o = r.orgaoEntidade ?? {};
    const un = r.unidadeOrgao ?? {};
    const id = r.numeroControlePNCP;
    return {
        id,
        url: o.cnpj && r.anoCompra && r.sequencialCompra ? `https://pncp.gov.br/app/editais/${o.cnpj}/${r.anoCompra}/${r.sequencialCompra}` : null,
        object: nz(r.objetoCompra?.trim()),
        additionalInfo: nz(r.informacaoComplementar?.trim()),
        modality: nz(r.modalidadeNome),
        modalityCode: r.modalidadeId ?? null,
        disputeMode: nz(r.modoDisputaNome),
        status: nz(r.situacaoCompraNome),
        isPriceRegistration: r.srp ?? null,
        estimatedValue: typeof r.valorTotalEstimado === 'number' ? r.valorTotalEstimado : null,
        homologatedValue: typeof r.valorTotalHomologado === 'number' ? r.valorTotalHomologado : null,
        proposalOpening: nz(r.dataAberturaProposta),
        proposalDeadline: nz(r.dataEncerramentoProposta),
        publishedAt: nz(r.dataPublicacaoPncp),
        updatedAt: nz(r.dataAtualizacaoGlobal ?? r.dataAtualizacao),
        processNumber: nz(r.processo),
        purchaseNumber: nz(r.numeroCompra),
        year: r.anoCompra ?? null,
        agency: nz(o.razaoSocial),
        agencyCnpj: nz(o.cnpj),
        sphere: { F: 'federal', E: 'state', M: 'municipal', D: 'district' }[o.esferaId] ?? nz(o.esferaId),
        unit: nz(un.nomeUnidade),
        city: nz(un.municipioNome),
        state: nz(un.ufSigla),
        cityIbgeCode: nz(un.codigoIbge),
        legalBasis: nz(r.amparoLegal?.nome),
        originSystemUrl: nz(r.linkSistemaOrigem),
        electronicProcessUrl: nz(r.linkProcessoEletronico),
    };
}

export function matches(t, input) {
    const text = fold(`${t.object ?? ''} ${t.additionalInfo ?? ''}`);
    const kws = (input.keywords ?? []).map(fold).filter(Boolean);
    if (kws.length && !kws.some((k) => text.includes(k))) return false;
    const ex = (input.excludeKeywords ?? []).map(fold).filter(Boolean);
    if (ex.some((k) => text.includes(k))) return false;
    const v = t.estimatedValue;
    const hasRange = input.minValue != null || input.maxValue != null;
    if (hasRange) {
        if (!v) return !input.dropWithoutValue;
        if (input.minValue != null && v < input.minValue) return false;
        if (input.maxValue != null && v > input.maxValue) return false;
    }
    return true;
}
