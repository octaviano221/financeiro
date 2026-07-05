# Gestao Financeira Inteligente

Sistema web MVP para gestao financeira pessoal/empresarial, com Node.js, Express, MySQL, JWT e frontend React responsivo.

## Funcionalidades entregues

- Cadastro e login com JWT
- Senhas criptografadas com bcrypt
- Separacao de dados por usuario autenticado
- CRUD de bancos, cartoes, dividas, receitas, despesas, metas e categorias
- Dashboard com saldo, dividas, cheque especial, cartoes, receitas, despesas, comprometimento de renda e saude financeira
- Alertas inteligentes calculados automaticamente
- Graficos de entradas x saidas, dividas e gastos por categoria
- Geracao de plano de acao com estrategias Avalanche, Bola de Neve, Emergencial e Personalizada
- Fluxo de caixa com comparativo previsto x realizado
- Calendario financeiro mensal/semanal/lista
- Simulador de renegociacao com calculo de parcela, total final e economia
- Configuracoes persistidas por usuario
- Compras parceladas no cartao com geracao automatica de parcelas futuras
- Relatorios visuais de resumo mensal, dividas e cartoes
- Seed de dados demonstrativos para preencher o dashboard
- Schema SQL MySQL completo

## Estrutura

```txt
backend/
  database/schema.sql
  src/config
  src/middlewares
  src/routes
  src/services
  src/utils
frontend/
  src/api
  src/components
  src/pages
  src/state
```

## Como rodar localmente

1. Crie o banco MySQL:

```bash
mysql -u root -p < backend/database/schema.sql
```

Se voce ja importou o banco antes desta versao, rode tambem:

```bash
mysql -u root -p < backend/database/002_user_settings.sql
```

2. Configure o backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

3. Configure o frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:3333/api`

## Endpoints principais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/charts`
- `GET /api/dashboard/alerts`
- `GET /api/dashboard/financial-health`
- CRUD: `/api/bank-accounts`, `/api/credit-cards`, `/api/card-transactions`, `/api/debts`, `/api/incomes`, `/api/expenses`, `/api/goals`, `/api/categories`
- `POST /api/action-plan/generate`
- `GET /api/action-plan`
- `GET /api/reports/monthly`
- `GET /api/reports/debts`
- `GET /api/reports/cards`
- `GET /api/tools/cash-flow`
- `GET /api/tools/calendar`
- `POST /api/tools/renegotiation/simulate`
- `GET /api/settings`
- `PUT /api/settings`
- `POST /api/demo/seed`

## Deploy na Hostinger ou servidor Node.js

1. Crie um banco MySQL e importe `backend/database/schema.sql`.
2. Suba a pasta `backend` para um servidor com Node.js.
3. Configure as variaveis de ambiente do backend com dados reais do MySQL e um `JWT_SECRET` forte.
4. Rode `npm install --omit=dev` no backend.
5. Inicie com `npm start` usando PM2, systemd ou o painel do provedor.
6. No frontend, configure `VITE_API_URL=https://seu-dominio.com/api`.
7. Rode `npm run build` em `frontend`.
8. Publique a pasta `frontend/dist` como site estatico.
9. Configure proxy/reverse proxy para a API, se frontend e backend estiverem no mesmo dominio.

## Observacao

As recomendacoes do plano de acao sao simulacoes de organizacao financeira e nao representam consultoria financeira oficial.
