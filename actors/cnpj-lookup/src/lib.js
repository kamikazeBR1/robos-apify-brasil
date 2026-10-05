// Funções puras: validação de CNPJ (numérico e alfanumérico), normalização e diff.

const W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/** Remove pontuação e deixa maiúsculo. Aceita o CNPJ alfanumérico (a partir de jul/2026). */
export function cleanCnpj(raw) {
    return String(raw ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function dv(base, weights) {
    const sum = [...base].reduce((acc, ch, i) => acc + (ch.charCodeAt(0) - 48) * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
}

export function isValidCnpj(raw) {
    const c = cleanCnpj(raw);
    if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return false;
    if (/^(\d)\1{13}$/.test(c)) return false;
    const d1 = dv(c.slice(0, 12), W1);
    const d2 = dv(c.slice(0, 12) + d1, W2);
    return c.endsWith(`${d1}${d2}`);
}

export function formatCnpj(c) {
    return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

const nz = (v) => (v === undefined || v === null || v === '' ? null : v);
const isoDate = (v) => {
    if (!v) return null;
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s.split('/').reverse().join('-');
    return s;
};
const phone = (v) => {
    const d = String(v ?? '').replace(/\D/g, '');
    return d.length >= 10 ? d : null;
};
const strBool = (v) => (v === true || v === 'S' || v === 'SIM' ? true : v === false || v === 'N' || v === 'NAO' ? false : null);

/** Normaliza a resposta do BrasilAPI / Minha Receita (mesmo esquema) para campos em inglês. */
export function normalize(r, { includePartners = true } = {}) {
    const c = cleanCnpj(r.cnpj);
    const street = [r.descricao_tipo_de_logradouro, r.logradouro].filter(Boolean).join(' ').trim();
    const out = {
        cnpj: c,
        cnpjFormatted: formatCnpj(c),
        legalName: nz(r.razao_social),
        tradeName: nz(r.nome_fantasia),
        branchType: nz(r.descricao_identificador_matriz_filial) ?? (r.identificador_matriz_filial === 1 ? 'MATRIZ' : r.identificador_matriz_filial === 2 ? 'FILIAL' : null),
        status: nz(r.descricao_situacao_cadastral),
        statusDate: isoDate(r.data_situacao_cadastral),
        statusReason: nz(r.descricao_motivo_situacao_cadastral),
        specialStatus: nz(r.situacao_especial),
        openingDate: isoDate(r.data_inicio_atividade),
        legalNature: nz(r.natureza_juridica),
        legalNatureCode: nz(r.codigo_natureza_juridica),
        companySize: nz(r.porte ?? r.descricao_porte),
        shareCapital: typeof r.capital_social === 'number' ? r.capital_social : r.capital_social ? Number(r.capital_social) : null,
        mainActivity: r.cnae_fiscal ? { code: String(r.cnae_fiscal), description: nz(r.cnae_fiscal_descricao) } : null,
        secondaryActivities: (r.cnaes_secundarios ?? [])
            .filter((a) => a && a.codigo)
            .map((a) => ({ code: String(a.codigo), description: nz(a.descricao) })),
        street: nz(street),
        number: nz(r.numero),
        complement: nz(r.complemento),
        neighborhood: nz(r.bairro),
        city: nz(r.municipio),
        state: nz(r.uf),
        zipCode: nz(r.cep ? String(r.cep).replace(/\D/g, '').padStart(8, '0') : null),
        ibgeCityCode: nz(r.codigo_municipio_ibge),
        phones: [r.ddd_telefone_1, r.ddd_telefone_2].map(phone).filter(Boolean),
        fax: phone(r.ddd_fax),
        email: nz(r.email ? String(r.email).toLowerCase() : null),
        simplesNacional: {
            optedIn: strBool(r.opcao_pelo_simples),
            optInDate: isoDate(r.data_opcao_pelo_simples),
            exclusionDate: isoDate(r.data_exclusao_do_simples),
        },
        mei: {
            optedIn: strBool(r.opcao_pelo_mei),
            optInDate: isoDate(r.data_opcao_pelo_mei),
            exclusionDate: isoDate(r.data_exclusao_do_mei),
        },
        taxRegimes: (r.regime_tributario ?? []).map((t) => ({
            year: t.ano ?? null,
            regime: nz(t.forma_de_tributacao),
        })),
    };
    if (includePartners) {
        out.partners = (r.qsa ?? []).map((p) => ({
            name: nz(p.nome_socio),
            document: nz(p.cnpj_cpf_do_socio),
            qualification: nz(p.qualificacao_socio),
            entryDate: isoDate(p.data_entrada_sociedade),
            ageRange: nz(p.faixa_etaria),
            country: nz(p.pais),
            legalRepresentative: nz(p.nome_representante_legal),
        }));
    }
    return out;
}

// Campos acompanhados no modo monitor.
const WATCHED = ['legalName', 'tradeName', 'status', 'statusReason', 'specialStatus', 'legalNature', 'companySize',
    'shareCapital', 'mainActivity', 'secondaryActivities', 'street', 'number', 'complement', 'neighborhood', 'city',
    'state', 'zipCode', 'phones', 'email', 'simplesNacional', 'mei', 'partners'];

/** Lista o que mudou entre dois snapshots normalizados. */
export function diff(prev, curr) {
    if (!prev) return null;
    const changes = [];
    for (const k of WATCHED) {
        if (!(k in curr) && !(k in prev)) continue;
        const a = JSON.stringify(prev[k] ?? null);
        const b = JSON.stringify(curr[k] ?? null);
        if (a !== b) changes.push({ field: k, previous: prev[k] ?? null, current: curr[k] ?? null });
    }
    return changes;
}
