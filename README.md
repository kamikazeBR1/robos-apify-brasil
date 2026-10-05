# robos-apify-brasil

Actors da [Apify Store](https://apify.com/store) para fontes de dados brasileiras.
Cada pasta em `actors/` é um Actor independente (Node.js 22, Apify SDK 3).

## Comandos
```bash
cd actors/<nome>
npm install
npm test          # testes offline com fixtures
npx apify run     # roda localmente (precisa de rede)
npx apify push    # publica na sua conta (precisa de APIFY_TOKEN)
```

## Regras
- Só dados públicos, preferindo APIs oficiais/abertas.
- Respeitar robots.txt e termos de uso; nada de dados pessoais em massa (LGPD).
- O token da Apify fica só na variável de ambiente `APIFY_TOKEN`, nunca no repositório.
