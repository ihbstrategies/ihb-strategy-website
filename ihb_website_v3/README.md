# IHB Strategies — Website v2

> **Contexto para AI/Dev:** Este README documenta o estado atual do projeto, decisões de arquitetura e integrações. Leia antes de qualquer modificação.
> Última atualização: 2026-04-13

---

## Visão Geral do Projeto

Site institucional da **IHB Strategies** (ihbstrategies.com), empresa de consultoria em gestão de saúde.

- **Stack:** HTML puro + CSS + JS vanilla. Sem framework. Sem build step.
- **Hospedagem:** GitHub Pages, domínio customizado `ihbstrategies.com`
- **Repositório live:** pasta `ihb_website_git_final/` — **NÃO editar diretamente** (bug EDEADLK no filesystem)
- **Esta pasta (`ihb_website_v2/`):** staging/desenvolvimento. Testar aqui, depois promover para o repo live.
- **Desenvolvimento:** continuado no **Claude Code** (tarefas técnicas). Cowork reservado para conteúdo e estratégia.

---

## Estrutura de Arquivos

```
ihb_website_v2/
├── index.html                  # Página principal
├── climat.html                 # Ferramenta CLIMAT 2.0
├── README.md                   # Este arquivo
├── TASKS.md                    # Backlog técnico vivo
└── assets/
    ├── css/
    │   ├── styles.css          # Design system + estilos principais (17KB+)
    │   ├── icons.css           # Ícones DAET
    │   └── climat-tool.css     # Estilos do CLIMAT
    ├── js/
    │   ├── main.js             # Nav, scroll, animações
    │   └── climat-tool.js      # Lógica CLIMAT v2 + geração de PDF
    └── images/
        │
        │  — FOTOS (referenciadas como .jpg — versões otimizadas) —
        ├── doc_on_ipad.jpg                              # Hero index (~161KB)
        ├── doc_climat.jpg                               # Seção CLIMAT index (~171KB)
        ├── climat_hero.jpg                              # Hero climat.html (~155KB)
        ├── ChatGPT Image Apr 22, 2025, 04_37_49 PM.jpg # Seção Sobre (~138KB)
        │
        │  — ÍCONES DE SERVIÇO (referenciados como .webp — versões otimizadas) —
        ├── icon_diagnostics_and_metrics.webp
        ├── icon_dashboards_and_kpis.webp
        ├── icon_processes_operations.webp
        ├── icon_marketing.webp
        ├── icon_AI_and_cloud.webp
        ├── icon_comunication_automation.webp
        │
        │  — ÍCONES PENDENTES (referenciados no HTML, arquivos ainda não criados) —
        ├── icon_opme_dut.png          ⚠️ FALTANDO
        ├── icon_educacao_medica.png   ⚠️ FALTANDO
        ├── icon_pareceres.png         ⚠️ FALTANDO
        ├── icon_healthtechs_track.png ⚠️ FALTANDO
        │
        │  — LOGOS E MARCA —
        ├── Logo sem slogan sem fundo.png
        ├── Logo_cores_invertidas_final.png
        ├── healthcare_service_icon.png    # Header Track 1
        ├── whatsapp-icon.png
        │
        │  — DAET —
        ├── ihb_icon_1 - s: fundo.png     # Diagnóstico
        ├── ihb_icon_2 - s: fundo.png     # Arquitetura
        ├── ihb_icon_3 - s: fundo.png     # Execução
        ├── ihb_icon_4 - s: fundo.png     # Tração
        │
        │  — LEGADO / BACKUP (na pasta, não referenciados — OK manter) —
        ├── doc_on_ipad.png / doc_climat.png / climat_hero.png  # originais pré-otimização
        ├── icon_*.png                     # originais pré-otimização
        ├── icon_health_services_track.svg # alternativa Track 1 não usada
        ├── doc_climat_2.png               # imagem reserva
        ├── ChatGPT Image Apr 22, 2025, 03_27_53 PM.png  # não referenciada
        ├── ChatGPT Image Apr 22, 2025, 03_28_54 PM.png  # não referenciada
        ├── ChatGPT Image Apr 22, 2025, 04_42_33 PM.png  # não referenciada
        │
        ├── favicon/                       # Conjunto completo (ico, svg, 16/32/96px, manifests)
        └── thumbnails/                    # OG + Twitter Card (index e climat)
```

> **Regra de imagens:** Paths **relativos** (`assets/images/...`). PNG originais mantidos como backup — não deletar. Arquivos extras na pasta sem referência são legado — não precisam ser referenciados.

---

## Design System

```css
--primary-color:   #2F3E38   /* Verde escuro */
--accent-green:    #5B7766   /* Verde médio */
--secondary-color: #F3F0E6   /* Bege claro */
--text-dark:       #1a1a1a
--text-light:      #ffffff
```

**Fonte:** Inter (Google Fonts) — 300/400/500/600/700
**Regra de tom:** Zero emojis no site. Sempre ícones PNG/SVG/WebP.
**CSS principal:** `styles.css` tem 17KB+ — usar **Edit (diff)**, nunca Write (rewrite completo).

---

## Arquitetura de Serviços — 2 Tracks

### Track 1 — Para Provedores de Saúde
Header: `healthcare_service_icon.png` | Fundo: `#2F3E38`

| Serviço | Ícone |
|---|---|
| Diagnóstico e Métricas de Saúde | `icon_diagnostics_and_metrics.webp` |
| Dashboards e KPIs Clínicos | `icon_dashboards_and_kpis.webp` |
| Processos e Operações | `icon_processes_operations.webp` |
| Marketing e Captação | `icon_marketing.webp` |
| IA e Cloud em Saúde | `icon_AI_and_cloud.webp` |
| Automação de Comunicação | `icon_comunication_automation.webp` |
| OPME e DUT Advisory | `icon_opme_dut.png` ⚠️ FALTANDO |
| Educação Médica em Gestão | `icon_educacao_medica.png` ⚠️ FALTANDO |
| Pareceres e Avaliação Técnica | `icon_pareceres.png` ⚠️ FALTANDO |

### Track 2 — Para Healthtechs e Medtechs
Header: `icon_healthtechs_track.png` ⚠️ FALTANDO | Fundo: `#5B7766`

| Plano | Preço | Horas/mês |
|---|---|---|
| Seed | R$3.500/mês | 4h |
| Growth | R$7.000/mês | 10h |
| Scale | R$12.000/mês | 20h |

---

## Metodologia DAET

4 passos: Diagnóstico → Arquitetura → Execução → Tração
Ícones: `ihb_icon_1` a `ihb_icon_4 - s: fundo.png`
Estilos: `.icon-diagnostic`, `.icon-architecture`, `.icon-execution`, `.icon-traction` em `icons.css`

---

## Ferramenta CLIMAT 2.0

**Arquivos:** `climat.html` + `assets/js/climat-tool.js`
**Dependência CDN:** `jspdf.umd.min.js` (2.5.1 via cdnjs) — necessário para PDF

### Fluxo completo
1. Formulário multi-step — 3 seções + tela de resultados:
   - `#section-info` → nome, email, telefone, empresa
   - `#section-tech` → q1–q5 (Tecnologia, máx 25)
   - `#section-process` → q6–q10 (Processos, máx 25)
   - `#results` → exibição de resultados + download PDF
2. Navegação via `.btn-next` / `.btn-prev` com scroll via `getBoundingClientRect()` (não `offsetTop`)
3. Score total (máx 50) → perfil de maturidade:

| Range | Perfil |
|---|---|
| 10–25 | Iniciante |
| 26–35 | Em Desenvolvimento |
| 36–50 | Avançado |

4. Campos ocultos injetados no submit: `score_total`, `score_tecnologia`, `score_processos`, `perfil_maturidade`
5. **PDF download** client-side via jsPDF — botão `#btnDownloadPDF` na tela de resultados. Gera `CLIMAT_IHB_[Nome]_[Data].pdf` com header IHB, perfil colorido, scores com barras, recomendações e QR code apontando para o link de agendamento.

### Fluxo de follow-up (decisão tomada)
Lead capturado via Formspree → LFM/equipe acionam via **WhatsApp manual** com contexto do perfil CLIMAT. Sem automação de email. O PDF entregue na tela é o CTA principal.

---

## Integrações

| Integração | Detalhe |
|---|---|
| **Google Analytics** | G-FJ58D6ZMM3 — em ambas as páginas |
| **Formspree** | `https://formspree.io/f/xleqjwgn` — contato (index.html) + CLIMAT (climat.html) |
| **jsPDF** | CDN em `climat.html` — geração de PDF client-side |
| **Google Calendar** | `https://calendar.app.google/1X54FfuoWQFZYjFr6` — CTA agendamento + QR code no PDF |
| **WhatsApp** | Número `+55 11 99848-3317` hardcoded no footer/hero |

---

## Navegação

```
Home       → #hero
Sobre      → #about
Serviços   → #services
HealthTechs→ #healthtechs
DAET       → #daet
CLIMAT     → climat.html
Contato    → #contact
```

---

## Meta / SEO

- Title, description, keywords em ambas as páginas
- Open Graph + Twitter Cards completos
- **OG index:** `assets/images/thumbnails/social-thumbnail.png`
- **OG CLIMAT:** `assets/images/thumbnails/social-thumbnail-climat.png`
- Favicon completo em `assets/images/favicon/`
- GA4 via gtag.js CDN
- ⚠️ `<link rel="canonical">` ainda **não adicionado** (ver TASKS.md item 6)
- ⚠️ `og:url` no `climat.html` aponta para raiz — confirmar com LFM (ver TASKS.md item 7)

---

## Deploy para Produção

1. Confirmar que os 4 ícones pendentes estão em `assets/images/`
2. Testar `index.html` e `climat.html` localmente no browser
3. Testar fluxo completo do CLIMAT incluindo download do PDF
4. Copiar conteúdo desta pasta para `ihb_website_git_final/`
5. Commit e push → GitHub Pages deploya automaticamente
6. Validar em ihbstrategies.com

---

## Contexto de Desenvolvimento

- **Empresa:** IHB Strategies — consultoria em gestão de saúde
- **Responsável:** Luiz Fernando Michaelis (LFM) + Francesca (sócia, perspectiva clínica)
- **AI técnica:** Claude Code (tarefas de código, HTML, CSS, JS)
- **AI estratégica:** Claude Cowork (conteúdo, posts, estratégia de marketing)
- **Nota para AI:** Ler sempre README + TASKS.md antes de editar. Nunca usar Write para reescrever arquivos grandes — usar Edit (diff).
