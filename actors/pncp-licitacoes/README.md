# Brazil Public Tenders Monitor (PNCP licitações)

**Find Brazilian government tenders (licitações) worth bidding on**, straight from the **PNCP – Portal Nacional de Contratações Públicas**, the official portal where every federal, state and municipal body must publish its procurements under Law 14.133/2021.

🇧🇷 *Versão em português abaixo.*

## What you get
- 📬 **Open tenders receiving proposals right now**, or everything **published in a date range**.
- 🔎 **Keyword filter** on the tender object (accent- and case-insensitive) plus **exclude keywords**.
- 🗺️ Filters by **modality** (pregão eletrônico, concorrência, dispensa…), **state**, **city (IBGE code)**, **agency CNPJ** and **estimated value range**.
- 🔔 **Only new tenders since last run** – schedule it daily and receive just the new opportunities (send them to e-mail, Slack, Google Sheets or your CRM with Apify integrations).
- 🔗 Direct link to the tender page on PNCP, with documents (edital) and items.
- 💸 Pay only for tenders returned.

## Input example
```json
{
  "mode": "open",
  "keywords": ["notebook", "computador"],
  "excludeKeywords": ["locação"],
  "modalities": ["6", "4"],
  "states": ["SP", "MG"],
  "minValue": 50000,
  "onlyNew": true
}
```

## Output example
```json
{
  "id": "44430221000175-1-000016/2026",
  "url": "https://pncp.gov.br/app/editais/44430221000175/2026/16",
  "object": "registro de preço para futura e eventual aquisição de equipamentos de informática, compreendendo notebooks, computadores desktop…",
  "modality": "Pregão - Eletrônico",
  "disputeMode": "Aberto",
  "status": "Divulgada no PNCP",
  "isPriceRegistration": true,
  "estimatedValue": 857478.38,
  "proposalOpening": "2026-09-03T12:00:00",
  "proposalDeadline": "2026-10-15T08:30:00",
  "publishedAt": "2026-09-03T08:26:22",
  "agency": "MUNICIPIO DE MURUTINGA DO SUL",
  "agencyCnpj": "44430221000175",
  "sphere": "municipal",
  "city": "Murutinga do Sul",
  "state": "SP",
  "cityIbgeCode": "3532108",
  "legalBasis": "Lei 14.133/2021, Art. 28, I"
}
```

## Tips
- Narrow by **state** and **modality**: the PNCP API is slow, and every extra state × modality is another full listing to scan.
- Tenders with a confidential estimate have `estimatedValue: null`.

## Pricing
Pay per event: a fee per **tender returned**. See the *Pricing* tab.

## Data and legality
Uses only the **official public PNCP consultation API** (open government data, no login, no captcha). Requests are sequential per query with a small pool of parallel pages and back-off on errors.

---

# 🇧🇷 Monitor de Licitações do PNCP

**Encontre licitações abertas para a sua empresa** direto do **PNCP**, o portal oficial onde todos os órgãos federais, estaduais e municipais publicam as compras pela Lei 14.133/2021.

## O que faz
- Lista licitações **recebendo propostas agora** ou **publicadas num período**.
- Filtra por **palavras-chave** no objeto (sem diferenciar acento e maiúsculas) e **palavras para excluir**.
- Filtra por **modalidade**, **UF**, **município (código IBGE)**, **CNPJ do órgão** e **faixa de valor estimado**.
- **Só as novas desde a última execução**: agende todo dia e receba apenas as oportunidades novas por e-mail, Slack, Google Sheets ou no seu CRM.
- Link direto para a página da licitação no PNCP, com edital e itens.
- Você paga só pelas licitações entregues.

## Legal
Usa apenas a **API pública oficial de consultas do PNCP** (dados abertos, sem login e sem captcha).
