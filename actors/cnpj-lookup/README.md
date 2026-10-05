# Brazil CNPJ Lookup & Monitor

**Look up Brazilian companies by CNPJ in bulk** and get clean, English-named fields from the Receita Federal open data: legal and trade name, registration status, opening date, CNAE activities, full address, phones, e-mail, Simples Nacional / MEI, share capital, tax regime and partners (QSA).

🇧🇷 *Versão em português abaixo.*

## Why this Actor
- ✅ **Free validation** – CNPJs with a wrong check digit are flagged as `INVALID_CNPJ` and **never charged**.
- 🔤 **Ready for the new alphanumeric CNPJ** (Receita Federal, July 2026), e.g. `12.ABC.345/01DE-35`.
- 🔁 **Multiple open sources with automatic fallback and retries** (BrasilAPI → Minha Receita), so one source being down does not ruin your run.
- 🔔 **Change monitor** – schedule the Actor and get a `changes` list per company (status, address, partners, activities, Simples/MEI…). Turn on *Output only changed companies* to pay only for what changed.
- 💸 **You pay only for companies found.** Not found, invalid and failed lookups are free.

## Input
| Field | Description |
|---|---|
| `cnpjs` | List of CNPJs, with or without punctuation. Duplicates are removed. |
| `includePartners` | Include partners / shareholders (QSA). Default `true`. |
| `monitorChanges` | Remember results between runs and output a `changes` field. |
| `onlyChanged` | With monitoring, output only new or changed companies. |
| `maxConcurrency` | Parallel lookups (1–10, default 4). |

```json
{ "cnpjs": ["00.000.000/0001-91", "33000167000101"], "includePartners": true }
```

## Output (one item per CNPJ)
```json
{
  "cnpj": "00000000000191",
  "cnpjFormatted": "00.000.000/0001-91",
  "legalName": "BANCO DO BRASIL SA",
  "tradeName": "DIRECAO GERAL",
  "branchType": "MATRIZ",
  "status": "ATIVA",
  "statusDate": "2005-11-03",
  "openingDate": "1966-08-01",
  "legalNature": "Sociedade de Economia Mista",
  "companySize": "DEMAIS",
  "shareCapital": 120000000000,
  "mainActivity": { "code": "6422100", "description": "Bancos múltiplos, com carteira comercial" },
  "secondaryActivities": [{ "code": "6423900", "description": "Caixas econômicas" }],
  "street": "SAUS QUADRA 5 BLOCO B TORRE I, II, III",
  "number": "1",
  "neighborhood": "ASA NORTE",
  "city": "BRASILIA",
  "state": "DF",
  "zipCode": "70040912",
  "phones": ["6134939002"],
  "email": "secex@bb.com.br",
  "simplesNacional": { "optedIn": false, "optInDate": null, "exclusionDate": null },
  "mei": { "optedIn": false, "optInDate": null, "exclusionDate": null },
  "partners": [{ "name": "…", "qualification": "Presidente", "entryDate": "2023-01-16", "ageRange": "Entre 41 a 50 anos" }],
  "lookupStatus": "OK",
  "source": "brasilapi",
  "fetchedAt": "2026-10-05T02:00:00.000Z"
}
```
`lookupStatus` is one of `OK`, `NOT_FOUND`, `INVALID_CNPJ`, `ERROR`. Only `OK` items are charged.

## Pricing
Pay per event: a small start fee plus a fee per **company found**. See the *Pricing* tab.

## Use cases
KYC / supplier onboarding, lead enrichment for B2B sales in Brazil, CRM clean-up, compliance monitoring of customers and suppliers (status changes, partner changes).

## Data and legality
Only public data that Receita Federal publishes as open data (dados abertos do CNPJ), obtained through public open-data APIs. No login, no captcha bypassing. Partner names are part of the official public registry; process them according to the LGPD (Lei 13.709/2018) and use them only for legitimate purposes.

---

# 🇧🇷 Consulta e Monitor de CNPJ

**Consulte empresas brasileiras por CNPJ em lote**: razão social, nome fantasia, situação cadastral, data de abertura, CNAE principal e secundários, endereço completo, telefones, e-mail, Simples Nacional / MEI, capital social, regime tributário e quadro de sócios (QSA), a partir dos dados abertos da Receita Federal.

## Diferenciais
- ✅ **Validação grátis**: CNPJ com dígito errado sai como `INVALID_CNPJ` e **não é cobrado**.
- 🔤 **Pronto para o CNPJ alfanumérico** (Receita Federal, julho de 2026).
- 🔁 **Várias fontes abertas com fallback automático** (BrasilAPI → Minha Receita).
- 🔔 **Monitor de alterações**: agende o Actor e receba o campo `changes` com o que mudou (situação, endereço, sócios, atividades, Simples/MEI…). Com *Output only changed companies*, você paga só pelo que mudou.
- 💸 **Você paga só pelas empresas encontradas.** Não encontrado, inválido ou erro não são cobrados.

## Como usar
1. Cole a lista de CNPJs no campo **CNPJs** (com ou sem pontuação).
2. Clique em **Start**.
3. Baixe o resultado em Excel, CSV ou JSON, ou integre pela API.

Para monitorar uma carteira de clientes ou fornecedores, ligue **Monitor changes between runs** e crie um agendamento (Schedule) diário ou semanal.

## Dados e LGPD
Somente dados públicos dos dados abertos do CNPJ, obtidos por APIs públicas. Sem login e sem quebra de captcha. Nomes de sócios fazem parte do cadastro público oficial; trate-os conforme a LGPD e use-os apenas para finalidades legítimas.
