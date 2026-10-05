export const API = 'https://portal.gupy.io/api/job-search/jobs';

export function buildUrl({ keyword, offset = 0, limit = 100, filters = {} }) {
    const u = new URL(API);
    if (keyword) u.searchParams.set('jobName', keyword);
    u.searchParams.set('offset', String(offset));
    u.searchParams.set('limit', String(limit));
    // Filtros que a API aceita direto quando há um único valor; o resto é filtrado localmente.
    if (filters.workplaceTypes?.length === 1) u.searchParams.set('workplaceType', filters.workplaceTypes[0]);
    if (filters.states?.length === 1) u.searchParams.set('state', STATE_NAMES[filters.states[0]] ?? filters.states[0]);
    if (filters.cities?.length === 1) u.searchParams.set('city', filters.cities[0]);
    if (filters.postedWithinDays) { u.searchParams.set('sortBy', 'publishedDate'); u.searchParams.set('sortOrder', 'desc'); }
    return u.toString();
}

export const STATE_NAMES = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
    ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
    PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};
const NAME_TO_UF = Object.fromEntries(Object.entries(STATE_NAMES).map(([k, v]) => [fold(v), k]));

export function fold(s) {
    return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const nz = (v) => (v === undefined || v === null || v === '' ? null : v);
const stripHtml = (s) => (s ? String(s).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : null);

export function normalizeJob(r, keyword = '') {
    const state = nz(r.state);
    const uf = state ? (state.length === 2 ? state.toUpperCase() : NAME_TO_UF[fold(state)] ?? null) : null;
    return {
        id: r.id,
        title: nz(r.name?.trim()),
        company: nz(r.careerPageName),
        companyId: nz(r.companyId),
        companyLogo: nz(r.careerPageLogo),
        careerPageUrl: nz(r.careerPageUrl),
        url: r.jobUrl ? String(r.jobUrl).replace(/\?jobBoardSource=gupy_portal$/, '') : null,
        workplaceType: nz(r.workplaceType),
        isRemote: r.isRemoteWork ?? (r.workplaceType === 'remote'),
        city: nz(r.city),
        state,
        stateCode: uf,
        country: nz(r.country),
        jobType: nz(r.type),
        publishedAt: nz(r.publishedDate),
        applicationDeadline: nz(r.applicationDeadline),
        acceptsPeopleWithDisabilities: r.disabilities ?? null,
        skills: Array.isArray(r.skills) ? r.skills.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean) : [],
        description: stripHtml(r.description),
        searchKeyword: keyword || null,
        scrapedAt: new Date().toISOString(),
    };
}

export function matchesFilters(job, f, now = Date.now()) {
    if (f.workplaceTypes?.length && !f.workplaceTypes.includes(job.workplaceType)) return false;
    if (f.states?.length && !f.states.includes(job.stateCode)) return false;
    if (f.cities?.length && !f.cities.map(fold).includes(fold(job.city))) return false;
    if (f.companies?.length && !f.companies.some((c) => fold(job.company).includes(fold(c)))) return false;
    if (f.postedWithinDays && job.publishedAt) {
        const age = (now - Date.parse(job.publishedAt)) / 86400000;
        if (age > f.postedWithinDays) return false;
    }
    return true;
}
