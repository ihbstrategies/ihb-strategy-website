# IHB Website v3 — Tarefas Pendentes

> **Uso:** Backlog técnico vivo. Atualizar ao concluir cada item ou ao iniciar nova sessão.
> **Ferramenta:** Claude Code (técnico) | Cowork Claude (conteúdo/estratégia)
> **Pasta ativa:** `ihb_website_v3/` — `v2/` é legado congelado (rollback)
> Última atualização: 2026-06-01 (rev 10 — handoff p/ deploy)

---

## 🚀 PRÓXIMO PASSO — DEPLOY (sessão nova com acesso ao Git)

O site v3 está **pronto para produção**. Esta pasta (`ihb_website_v3/`) é uma cópia
do Google Drive e **não é um repo git**. O repo oficial está no GitHub da IHB,
acessível via GitHub Desktop no CPU do LFM.

### A. Site público (GitHub Pages)
1. Abrir nova sessão Claude Code **a partir da pasta do clone local do repo do site**
   (a que o GitHub Desktop usa — fora do Google Drive).
2. Sincronizar conteúdo de `ihb_website_v3/` (Google Drive) → pasta do repo local.
   Excluir `_backoffice/` (já no `.gitignore`) e os `.bak` (originais PNG das imagens).
3. `git add . && git commit -m "v3 — roteador home, trilhas, backoffice CRM v3, imagens novas"`
4. Push pelo GitHub Desktop ou `git push origin master` (depende do default branch).
5. GitHub Pages publica automaticamente em ~1min em `ihbstrategies.com`.

### B. Backoffice (Apps Script)
Os 3 arquivos em `_backoffice/` precisam ser **colados no projeto Apps Script
existente** (substituir):
- `Database.gs` (schema atualizado — db_faturamento, valores, db_climat padronizado)
- `Backoffice.gs` (PLANOS, valor_final, snapshot mensal, delete, faturamento)
- `Backoffice_System.html` (form unificado seccionado, dashboard em abas, Valores, Apagar)

Depois:
1. Rodar **`setupDatabase`** no editor — adiciona a aba `db_faturamento` e as
   colunas novas em `db_contato` / `db_clientes` / `db_climat` (idempotente).
2. **Implantar → Gerenciar implantações → Editar → Nova versão** (URL `/exec`
   continua a mesma).
3. (Opcional) No backoffice: Dashboard → Faturamento → **Ativar fechamento
   automático** (pede autorização do `ScriptApp` da primeira vez — gatilho
   mensal dia 1 às 3h).

---

## Legenda — Esforço × Impacto

| Impacto | | Esforço | |
|---|---|---|---|
| 🟥 Crítico (bloqueia lançamento) | | 🔴 Alto (> 4h ou dep. externa) | |
| 🟧 Técnico (não bloqueador) | | 🟡 Médio (1–4h) | |
| 🟨 Decisão aberta | | 🟢 Baixo (< 1h) | |
| 🟩 Conteúdo / Marketing | | | |

---

## ⚡ To Do

| # | Tarefa | Impacto | Esforço | Owner | Onde |
|---|---|---|---|---|---|
| **A** | **Deploy do site** (push do v3 → GitHub) | 🟥 | 🟢 | LFM + Claude | Nova sessão c/ Git |
| **B** | **Deploy do backoffice** (colar 3 arquivos + setup + nova versão) | 🟥 | 🟢 | LFM | Apps Script |
| 8 | Definir formato e precificação — Educação Médica em Gestão | 🟩 | 🔴 | LFM | Cowork |
| 9 | Draft posts de lançamento LinkedIn (LFM + Francesca) | 🟩 | 🟡 | Claude + LFM | Cowork |
| F1 | Apagar `.bak` das imagens após validar visualmente em produção | 🟧 | 🟢 | Dev | — |
| F2 | OAuth Google p/ backoffice (perfis de acesso por e-mail IHB) | 🟧 | 🔴 | LFM + Dev | Apps Script |

---

## 🆕 Sessão atual (2026-06-01) — o que foi entregue

### Backoffice — expansão financeira e modal unificado
- **Schema** (`Database.gs`): nova aba `db_faturamento`; colunas `valor_base`,
  `desconto_pct`, `acrescimo_pct`, `valor_final`, `status_plano` em
  `db_contato`, `db_clientes`, `db_climat`; `db_climat` ganhou também
  `razao_social/cnpj/tipo/segmento/estagio_startup/plano_interesse/produto_desejado`
  (campos NÃO são pedidos no CLIMAT inbound — só preenchidos se o consultor
  editar o lead-CLIMAT pelo modal unificado).
- **Form unificado seccionado** (`Backoffice_System.html`): lead e cliente
  usam o **mesmo** `entityFormHtml(p, fase)` com seções nomeadas
  **Segmento · Empresa · Contato · Valores**. Selecionar **Plano vigente**
  auto-preenche Valor base; Valor final recalcula on-the-fly (= base −
  desconto% + acréscimo%). Server recalcula sempre via `bofApplyValores_`.
- **Catálogo de planos** (`BOF_PLANOS`): Saúde {Essencial 5k, Estratégico 10k,
  Parceiro 15k, Projeto pontual} · Healthtech {Seed 3,5k, Growth 7k, Scale 12k,
  Projeto pontual}.
- **Apagar:** botão hard-delete em lead e cliente (`bofDeleteLead` /
  `bofDeleteCliente` — cliente preserva pasta no Drive).
- **CLIMAT histórico no modal do lead** (saúde), organizado igual ao do cliente.
- **Faturamento subsystem:**
  - `bofSnapshotMes(mes)` — manual, idempotente (regrava o mês).
  - `bofMonthlyTrigger` + `bofEnsureMonthlyTrigger` — gatilho dia 1 às 3h
    fecha o mês anterior automaticamente.
  - `bofListFaturamento` — retorna snapshots + `ltvMonths`.
  - Dashboard em **abas Leads | Faturamento**.
  - Aba Leads ganhou KPI **Valor em negociação** (soma `valor_final` dos
    leads ativos no funil).
  - Aba Faturamento: KPIs Clientes ativos · Valor faturado no mês · Ticket
    médio · LTV (= ticket × `BOF_LTV_MONTHS = 24`, configurável); barras
    "Clientes ativos por segmento" + "Faturamento por mês (snapshots)".
- Logo IHB embutida em alta resolução (662×260 base64), display a 40px na
  topbar (sem alterar altura do header de 64px).

### Site público — finalização visual
- **4 ícones faltantes gerados, recoloridos** para `#2F3E38` (saúde) e
  `#F3F0E6` (healthtech track header sobre fundo verde escuro):
  `icon_opme_dut.png`, `icon_educacao_medica.png`, `icon_pareceres.png`,
  `icon_healthtechs_track.png` — todos RGBA 1024×1024.
- **Track 2 icon** renderizado 96×96 sem alterar a altura do header do box
  (técnica: container 56×56 + img position:absolute centrada + `max-width:none`
  para escapar da regra global `img{max-width:100%}`).
- **8 imagens novas** (heroes + manifesto + director cards + climat-callout)
  convertidas PNG → **WebP** (1600px max, q82): **15,3 MB → 0,7 MB (−95%)**
  e plugadas em `index.html`, `servicos-saude.html`, `healthtechs.html`,
  `climat.html`. Originais PNG salvos como `.png.bak`.
- **Header do site:** `padding: 10px → 0`; logo 110px → **132px** (+20%).
- **Hero images:** `.hero-image img max-width: 75% → 100%` (Home, Saúde,
  Healthtechs).
- **Director cards** (index.html): adicionadas imagens `director-saude.webp` e
  `director-healthtech.webp` no topo dos cards, com CSS `.director-img`
  (cover 200px, border-radius 10px).
- **Padding climat.html:** `.climat-hero padding-top: 140px → 160px` (header
  fixo de 132px + ~28px de respiro).
- **Seção CLIMAT em `servicos-saude.html`:** modelo antigo (`.tool`) substituído
  pelo novo `.climat-callout` (image left + text right + 1 CTA — mesmo layout
  do `climat-hero`, sem o padding-top do header fixo). CSS em `styles.css`
  (não em `climat-tool.css`, que só carrega na página do CLIMAT).
- Imagem nova `doc_climat.webp` no estilo editorial (gestora latino-americana
  em clínica brasileira, tablet com gauges CLIMAT 2,8/2,3 + recomendações).

---

## ✅ Concluído (rev 9 → rev 10)

Bloco de sessões anteriores condensado para histórico:

- Estrutura **v3** com **roteador home → 2 trilhas** (Saúde / Healthtech)
  + pop-up de 1ª visita
- Páginas dedicadas de pricing (`pricing-saude.html`, `pricing-healthtech.html`)
- **Migração Formspree → Apps Script:** contato, newsletter, CLIMAT
- **Modal único de necessidade** (`modal.js`) substitui Google Calendar
- CLIMAT compactado (intro screen + form em "tela única"), PDF client-side,
  QR para pricing-saude
- Banco Sheets criado, Web App publicado, `API_TOKEN` ativo
- **Backoffice v1** (HtmlService, auth por senha): Dashboard, Leads
  (Kanban + Tabela), Clientes (Drive folder), CLIMAT consultor, Newsletter
- **Backoffice v2 (DeAgro pattern):** conversão lead→cliente, status
  `convertido`, descrições dos níveis CLIMAT
- **Backoffice v2.5 (modelo de empresa):** `empresa_id` liga lead/cliente/
  CLIMAT, razão social, CNPJ, tipo por segmento, porte, estágio,
  produto desejado/ativo, busca de empresa no CLIMAT, histórico repetível
- **Backoffice v3 (esta sessão):** form unificado seccionado, Valores,
  Faturamento, Apagar, snapshot mensal (manual + auto), KPI valor em
  negociação, padronização `db_climat`
- Backoffice com logo IHB + favicon (URL hospedada, não data URI)
- 4 ícones faltantes (item 1) — **gerados, recoloridos, em produção**
- 8 imagens novas — **geradas, otimizadas, plugadas**
- Header e logos calibrados (site −20px de altura, logo +20%; backoffice
  logo 40px embutida em 662×260)

---

## 📂 Estrutura de arquivos (referência rápida)

```
ihb_website_v3/
├── index.html, servicos-saude.html, healthtechs.html,
│   pricing-saude.html, pricing-healthtech.html, climat.html
├── assets/
│   ├── css/   (styles.css · pricing.css · climat-tool.css · icons.css)
│   ├── js/    (main.js · modal.js · climat-tool.js · pricing.js)
│   └── images/  (heroes em .webp + originais .png.bak; 4 ícones novos)
├── _backoffice/    ← gitignored; cópia local do Apps Script
│   ├── Code.gs · Database.gs · Backoffice.gs · Backoffice_System.html · README.md
├── CLAUDE.md · README.md · TASKS.md (este arquivo)
└── .gitignore
```

---

## Owner

**Luiz Fernando Michaelis (LFM)** — IHB Strategies
Sócia: Francesca (perspectiva clínica)
