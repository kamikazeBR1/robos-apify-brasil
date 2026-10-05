# Gupy Jobs Scraper Brazil

**Extract job openings from [Gupy](https://portal.gupy.io)**, the recruiting platform used by thousands of Brazilian employers (Itaú, Ambev, Porto, Stefanini, Magalu…). Get clean, structured data for every job: title, company, city and state, remote / hybrid / on-site, publish date, application deadline, PcD (disability-friendly) flag and the full description.

🇧🇷 *Versão em português abaixo.*

## Features
- 🔎 Search by one or many **keywords**, or leave empty to list everything.
- 🧭 Filter by **state (UF)**, **city**, **company**, **workplace type** and **posted within N days**.
- 🗓️ **Daily monitoring**: schedule it with *Posted within (days) = 1* to get only new jobs. Results come sorted by newest and the run stops early, so it is fast and cheap.
- ⚡ HTTP-only, no browser: thousands of jobs per minute with minimal compute.
- 🧹 Duplicates across keywords are removed. HTML is stripped from descriptions.
- 💸 Pay only for jobs returned.

## Input example
```json
{
  "keywords": ["analista de dados", "python"],
  "states": ["SP", "RJ"],
  "workplaceTypes": ["remote", "hybrid"],
  "postedWithinDays": 7,
  "maxItems": 500
}
```

## Output example
```json
{
  "id": 12664935,
  "title": "Analista de Dados",
  "company": "Porto",
  "companyLogo": "https://attachments.gupy.io/.../companyLogoUrl.jpg",
  "url": "https://porto.gupy.io/job/eyJqb2JJZCI6MTI2NjQ5MzUsInNvdXJjZSI6Imd1cHlfcG9ydGFsIn0=",
  "workplaceType": "on-site",
  "isRemote": false,
  "city": "São Paulo",
  "state": "São Paulo",
  "stateCode": "SP",
  "country": null,
  "jobType": "vacancy_type_effective",
  "publishedAt": "2026-10-02T21:08:09.808Z",
  "applicationDeadline": "2026-11-30T00:00:00.000Z",
  "acceptsPeopleWithDisabilities": true,
  "description": "Buscamos um(a) Analista de Dados para integrar o time…",
  "searchKeyword": "analista de dados",
  "scrapedAt": "2026-10-05T01:39:28.892Z"
}
```

## Use cases
Job boards and aggregators, labor-market and salary research, recruiting agencies sourcing open roles, B2B sales (companies that are hiring are companies that are growing), career alerts by Telegram / e-mail via Apify integrations.

## Pricing
Pay per event: a fee per **job returned**. See the *Pricing* tab.

## Legal
Collects only publicly listed job openings shown on the public Gupy job portal, without login. The portal's robots.txt allows crawling and the Actor checks it at run time. No candidate or personal data is collected.

---

# 🇧🇷 Robô de Vagas da Gupy

**Extraia vagas de emprego da Gupy**, a plataforma de recrutamento usada por milhares de empresas no Brasil. Para cada vaga: cargo, empresa, cidade e estado, remoto / híbrido / presencial, data de publicação, prazo de inscrição, se aceita PcD e a descrição completa.

## Diferenciais
- Busca por várias **palavras-chave** de uma vez (ou todas as vagas).
- Filtros por **UF**, **cidade**, **empresa**, **modelo de trabalho** e **publicadas nos últimos N dias**.
- **Monitoramento diário**: agende com *Posted within (days) = 1* e receba só as vagas novas, ordenadas da mais recente.
- Rápido e barato (sem navegador). Remove duplicadas. Você paga só pelas vagas entregues.

## Como usar
1. Escreva as palavras-chave (ex.: `vendedor`, `enfermeiro`, `analista de dados`).
2. Escolha filtros se quiser.
3. Clique em **Start** e baixe em Excel, CSV ou JSON, ou conecte por API, Make, Zapier ou Google Sheets.

## Legal
Somente vagas públicas do portal de vagas da Gupy, sem login. Nenhum dado de candidatos é coletado.
