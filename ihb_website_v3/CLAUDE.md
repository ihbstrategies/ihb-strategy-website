# CLAUDE.md — Contexto para Claude Code

> Este arquivo é lido automaticamente pelo Claude Code ao abrir esta pasta.
> Para detalhes completos de arquitetura, leia `README.md`. Para tarefas abertas, leia `TASKS.md`.

---

## O que é este projeto

Site institucional da **IHB Strategies** — consultoria em gestão de saúde brasileira.
**URL:** ihbstrategies.com | **Hospedagem:** GitHub Pages
**Stack:** HTML + CSS + JS vanilla. Sem framework, sem build, sem node_modules.

---

## Regras críticas antes de editar

1. **Nunca usar Write para reescrever arquivos grandes** — usar sempre Edit (diff). `styles.css` tem 17KB+, `climat-tool.js` tem ~500 linhas.
2. **Paths de imagem são sempre relativos** — `assets/images/...` (não `/assets/...`). GitHub Pages serve da raiz.
3. **Zero emojis no HTML/CSS** — usar ícones PNG, WebP ou SVG.
4. **Pasta ATIVA = `ihb_website_v3/`** (esta). `ihb_website_v2/` está **congelada como legado** (rollback se houver quebra). `ihb_website_git_final/` — NÃO editar (bug EDEADLK). O commit final será feito num sibling fora do Google Drive.
5. **Pasta `_backoffice/`** — AppScript + CRM. Está no `.gitignore`, **NUNCA** vai para o GitHub Pages. Não referenciar no HTML.
6. **Imagens referenciadas no HTML** usam extensões `.webp` (fotos e ícones de serviço otimizados) e `.png` (ícones com transparência). Os originais ficam como `.png.bak` na pasta — não deletar até deploy validado, não referenciar.
7. **Deploy:** esta pasta NÃO é repo git. O repo oficial está no GitHub da IHB, acessível via GitHub Desktop. Para deploy, sincronizar o conteúdo desta pasta com um clone local do repo (fora do Google Drive) e fazer commit/push. Ver `TASKS.md` seção "🚀 PRÓXIMO PASSO — DEPLOY".

---

## Arquitetura de páginas

A home é um **roteador** que segmenta o visitante em duas trilhas.

```
index.html (roteador: Hero → Manifesto → Direcionador → Para quem → Contato)
├── servicos-saude.html  (Track 1: 9 serviços + DAET + CLIMAT) → pricing-saude.html
│                                                              └→ climat.html
└── healthtechs.html     (Track 2: Fractional CMO)             → pricing-healthtech.html
```

| Arquivo | Função |
|---|---|
| `index.html` | Home — roteador (2 trilhas). `body[data-home]` ativa o pop-up |
| `servicos-saude.html` | Trilha Saúde — serviços, DAET, CLIMAT teaser |
| `healthtechs.html` | Trilha Healthtech — Fractional CMO |
| `pricing-saude.html` | Jornadas de Maturidade (Track 1) |
| `pricing-healthtech.html` | Planos Fractional CMO (Track 2) |
| `climat.html` | Ferramenta CLIMAT 2.0 (só trilha Saúde) |
| `assets/css/styles.css` | Design system + estilos globais (inclui modal) |
| `assets/css/pricing.css` | Estilos das páginas de pricing |
| `assets/js/main.js` | Nav, scroll, cookies, `ihbDbSend`, newsletter |
| `assets/js/modal.js` | Modal único de contato + pop-up de 1ª visita |
| `assets/js/climat-tool.js` | Lógica CLIMAT: form, score, PDF |

**Nav (6 itens, todas as páginas):** Home · Sobre · Serviços de Saúde · Healthtechs · CLIMAT · Contato

---

## Design system (variáveis CSS)

```
--primary-color:   #2F3E38  (verde escuro)
--accent-green:    #5B7766  (verde médio)
--secondary-color: #F3F0E6  (bege)
```
Fonte: Inter (Google Fonts)

### Convenção de cores por seção (alternância bege/branco)

Cada página alterna as cores de fundo das seções. Modificadores por página:

| Modificador | Onde | Efeito |
|---|---|---|
| `.hero-home` | `index.html` hero | Mantém bege + reduz padding inferior (colado no manifesto) |
| `.hero-saude` | `servicos-saude.html` hero | Hero em **branco** (abre alternância da trilha) |
| `.hero-healthtech` | `healthtechs.html` hero | Hero em **branco** |
| `body[data-home] .contact` | seção Contato da home | Contato em **bege** (fecha alternância da home) |

Sequência home: `bege → branco → bege → branco → bege` (Hero · Manifesto · Direcionador · Para quem · Contato).
Trilhas: hero branco abre a alternância contra os blocos bege seguintes.

---

## Imagens — estado atual

Todas as imagens de produção estão **na pasta** e referenciadas pelo HTML:

- **4 ícones** (Track 1 + header Track 2): RGBA 1024×1024, recoloridos para
  `#2F3E38` (saúde) / `#F3F0E6` (healthtech header sobre fundo verde)
- **8 fotos editoriais** convertidas PNG → **WebP** (1600px max, q82):
  `home-hero`, `servicos-saude-hero`, `healthtechs-hero`, `climat-hero`,
  `about-manifesto`, `director-saude`, `director-healthtech`, `doc_climat`
- PNGs originais salvos como `*.png.bak` (apagar após validar deploy)

---

## CLIMAT 2.0 — pontos de atenção

- **CDN obrigatório:** `jspdf.umd.min.js` carregado no `climat.html` antes dos scripts locais — necessário para o PDF download.
- **Intro screen:** hero com explicação + botão `#btnIniciarClimat` "Iniciar Avaliação". Ao clicar, hero ganha `hidden`, `.climat-tool` (com `id="climatTool"` + `hidden` inicial) é exibido. Fluxo "virar a página" — intro + form em telas separadas.
- **Layout compacto:** cada seção do form cabe em ~1 viewport. Perguntas em grid horizontal (texto à esquerda + escala 1–5 à direita); info em grid 2 colunas (`.info-grid`).
- **Scroll:** usa `getBoundingClientRect() + pageYOffset - 150` (offset compensa o header fixo).
- **Seções do form:** `#section-info`, `#section-tech`, `#section-process`, `#results`
- **Submit:** `window.ihbDbSend()` (definido em `main.js`) → Apps Script com `form: 'climat'` + scores. Sempre chama `showResults()` mesmo se o envio falhar (não bloqueia PDF).
- **PDF:** gerado client-side, dispara via `#btnDownloadPDF`. QR code aponta para `https://www.ihbstrategies.com/pricing-saude.html`.

---

## Integrações ativas

| Serviço | Chave/URL |
|---|---|
| Google Analytics | G-FJ58D6ZMM3 |
| ~~Formspree~~ | **Desativado.** Substituído pelo Apps Script |
| AppScript DB | `.../AKfycby7e4PCvF5n6bGewwDAU0DJ3iBfZw-zvuhMwx6UNfbGhZrp6ELMjkVhJtI5UC4t7uXUuQ/exec` |
| Planilha banco | ID `1AS7oiR0_ha0U2z4NTC-DLyJgCB9yZd_BGSBeFVIBYqk` |
| ~~Google Calendar~~ | **Aposentado.** Substituído pelo modal único de contato |
| WhatsApp | `+55 11 99848-3317` |

### Modal único de necessidade (`modal.js`) — fluxo de contato

Não há mais agendamento por calendário. **Todo CTA de contato**
("Fale com a IHB", "Selecionar" plano, "Solicitar projeto") abre o
modal único (`assets/js/modal.js`, carregado em todas as páginas).
O modal captura o lead + a **janela de contato** (dias + período) e a
IHB liga de volta. Triggers: classe `.js-contato` com atributos
`data-segment` (saude/healthtech; ausente = pergunta), `data-plan`
(plano fixo) ou `data-projetos` (projeto pontual). Grava em `db_contato`.

### Integração com o banco (AppScript) — ATIVA

Os 3 formulários gravam via `window.ihbDbSend(payload)` (definido em
`main.js`): `fetch` com `mode:'no-cors'` + `Content-Type: text/plain` +
corpo JSON. O campo `form` roteia o destino:

| Form | `form:` | Handler |
|---|---|---|
| Contato | `contato` | `modal.js` (modal único — todas as páginas) |
| Newsletter | `newsletter` | `main.js` (footer de todas as páginas) |
| CLIMAT | `climat` | `climat-tool.js` |

`no-cors` = resposta não legível (esperado); sucesso/erro tratado
otimisticamente. Endpoint público por design. **Pendente:** `API_TOKEN`
do LFM — só para a leitura do CRM futuro, não afeta o envio.

---

## Precificação (definida — usar nas páginas de pricing)

> **Regra:** páginas institucionais (index) NÃO mostram valores — só vitrine.
> Preços ficam em páginas dedicadas: `pricing-saude.html` e `pricing-healthtech.html`.

**Track 1 — Serviços de Saúde (retainer mensal):**
| Plano | Preço | Horas | Público |
|---|---|---|---|
| Essencial | R$ 5.000/mês | 8h | Clínica iniciando profissionalização |
| Estratégico ⭐ | R$ 10.000/mês | 16h | Clínica estruturada / centro diagnóstico |
| Parceiro | R$ 15.000/mês | 25h | Hospital PME, startup saúde, operadora |

Projetos pontuais: Diagnóstico DAET R$ 8–12k · Dashboard/KPIs R$ 6–15k · Workshop R$ 3,5–5k

**Track 2 — Healthtechs (Fractional CMO):** Seed R$ 3.500 (4h) · Growth R$ 7.000 (10h) · Scale R$ 12.000 (20h)

---

## Estado atual — pronto para deploy

Todo o trabalho técnico do site e do backoffice está **concluído**. Próximos
passos são de deploy (não de código):

1. **Deploy do site** — push do conteúdo de `ihb_website_v3/` (exceto `_backoffice/`
   e `.bak`) para o repo do GitHub via GitHub Desktop. Ver `TASKS.md` § Deploy.
2. **Deploy do backoffice** — colar `Database.gs`, `Backoffice.gs` e
   `Backoffice_System.html` no projeto Apps Script existente, rodar
   `setupDatabase` (adiciona aba `db_faturamento` + colunas novas em
   db_contato/db_clientes/db_climat), publicar nova versão.

Itens de conteúdo (Educação Médica, posts LinkedIn) permanecem no Cowork.

---

## Owner

**Luiz Fernando Michaelis (LFM)** — IHB Strategies
Sócia: Francesca (perspectiva clínica)
