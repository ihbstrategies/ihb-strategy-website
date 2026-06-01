# _backoffice — Infra interna IHB (NÃO vai para o GitHub)

Esta pasta está no `.gitignore`. Nada aqui é publicado no GitHub Pages.
Aqui mora o backend de captura de leads e (futuramente) o CRM/backoffice.

---

## Arquivos do Apps Script (4)

| Arquivo | Papel |
|---|---|
| `Code.gs` | **Ponto de entrada.** `doPost` (forms do site), `doGet` (API JSON + serve o Backoffice), `onOpen`, `setupDatabase`, `createDatabase`. |
| `Database.gs` | **Camada de dados.** Config, criação de abas, insert/list, helpers. Sem entry points. |
| `Backoffice.gs` | **CRM server-side.** Auth por senha + leitura/escrita dos módulos. Reusa helpers do `Database.gs`. |
| `Backoffice_System.html` | **CRM front-end** (HtmlService). Login + abas Leads / Clientes / CLIMAT / Newsletter. Crie um arquivo HTML chamado **`Backoffice_System`** no editor e cole. |

> ⚠️ **Nomes no GAS:** o Apps Script usa o nome-base (ignora a extensão).
> Por isso o HTML é `Backoffice_System` (não `Backoffice`) — senão colidiria
> com `Backoffice.gs`. O `Code.gs` referencia `createHtmlOutputFromFile('Backoffice_System')`.
>
> Os `.gs` compartilham o mesmo escopo global. Crie os **4** arquivos no
> projeto (3 `.gs` + 1 HTML `Backoffice_System`) e cole o conteúdo de cada um.

### Backoffice (CRM interno) — como acessar

1. No `Backoffice.gs`, troque `BOF_PASSWORD` por uma senha forte.
2. Publique o Web App (mesma implantação do site serve tudo).
3. Acesse a **URL `/exec` sem parâmetros** → abre o Backoffice (tela de senha).
   - `/exec?action=ping` e `/exec?action=list&...` continuam sendo a API JSON dos formulários.
4. Estrutura no padrão CRM (inspirado no DeAgro), cores IHB:
   - **Dashboard** — KPIs (total/ativos/convertidos/clientes) + **funil de leads** + pizza por segmento + barras por origem
   - **Leads** — visão **Pipeline (Kanban)** ou **Tabela** (busca/filtros/ordenação/paginação); modal **ver/editar**; **Converter em cliente** (lead sai do funil → status `convertido` → vira registro em `db_clientes` com pasta no Drive); novo lead manual
   - **Clientes/Contratos** — `db_clientes`, cards, modal com status do contrato + anotações + **arquivos no Google Drive** (pasta automática por cliente)
   - **CLIMAT (consultor)** — aplica o CLIMAT com **descrições dos níveis 1–5** por questão (para o consultor ler ao cliente). Funciona como **calculadora** e, após calcular, 3 ações: **Adicionar como lead** (`db_climat`, status novo) · **Adicionar como cliente** (`db_climat` status convertido + cria cliente/pasta Drive) · **Reset** (não salva). Backend: `bofSaveClimat`, `bofSaveClimatAsClient`
   - **Newsletter** — listagem + export CSV
   - **Relação Leads↔Clientes:** lead ganho → "Converter em cliente" cria o cliente e marca o lead como `convertido`.
> Segurança: a senha é validada **server-side** em toda chamada (`bofAuth_`). O HTML público só mostra a tela de login até a senha correta.
> **Drive:** no 1º uso de Clientes, o Apps Script pede autorização do Google Drive (cria a pasta raiz "IHB — Clientes"). Reautorize quando aparecer.
> **Schema:** `db_clientes` é nova aba — rode `setupDatabase` no redeploy para criá-la.

Backend que substitui o Formspree. Recebe os 3 formulários do site e
grava em uma planilha Google Sheets.

### Abas criadas pelo `setupDatabase()`

| Aba | Origem no site |
|---|---|
| `db_climat` | Formulário CLIMAT (`climat.html`) |
| `db_contato` | Formulário de contato (`index.html`) |
| `db_newsletter` | Newsletter (footer das duas páginas) |
| `db_log` | Log interno (erros, inserts) — diagnóstico |

### Instalação (resumo — detalhe no topo do `Code.gs`)

1. [script.google.com](https://script.google.com) → **Novo projeto** (script avulso)
2. Criar 2 arquivos: `Code.gs` e `Database.gs` → colar o conteúdo de cada
3. Em `Database.gs`, trocar `API_TOKEN` por um segredo
4. Rodar a função **`createDatabase`** → cria a planilha "IHB — Banco de
   Dados (CRM)" já com as abas e guarda o ID sozinha (Script Properties).
   URL/ID aparecem em **Execuções → Logs**
5. **Implantar → App da Web** → executar como você, acesso "qualquer pessoa"
6. Enviar a URL `/exec` **+ o API_TOKEN** para o Claude Code wirar o site

> `createDatabase()` = cria do zero (script avulso).
> `setupDatabase()` = só recria/atualiza abas numa planilha já existente
> (script vinculado, ou rodar de novo após `createDatabase`). Idempotente.

### Estado atual

- [x] `Code.gs` escrito (createDatabase + doGet + doPost + onOpen + setup + testes)
- [x] `Database.gs` v3 (config + abas + insert + list + helpers + `db_faturamento`
  + colunas de valores em db_contato/db_clientes/db_climat)
- [x] Planilha criada (`1AS7oiR0_ha0U2z4NTC-DLyJgCB9yZd_BGSBeFVIBYqk`) + Web App publicado
- [x] `API_TOKEN` = `ihb-7Kp9xQ2mZ4vB8nR3tL6wgY1` (publicado na versão nova)
- [x] JS do site migrado de Formspree → Apps Script (testado 2026-05-19)
- [x] **Backoffice v3** — todos os módulos prontos (Dashboard em abas Leads/Faturamento,
  Leads Kanban/Tabela, Clientes, CLIMAT empresa-first, Newsletter)
- [ ] **Deploy v3 pendente:** colar os 4 arquivos no Apps Script existente,
  rodar `setupDatabase`, publicar nova versão. Ver `TASKS.md` § Deploy.

---

## Backoffice v3 — feature set entregue

> Esta seção é o "o que existe hoje" — antes era especificação a construir.
> Tudo abaixo está implementado nos 4 arquivos desta pasta.

### Arquitetura (a decidir na hora de construir)

O `doGet(?action=list&form=...&token=...)` já devolve JSON. As opções de
front do backoffice (avaliar depois):
- **Apps Script HtmlService** — app web servido pelo próprio script
  (mesmo projeto, lê/escreve direto nas abas, suporta upload p/ Drive).
  Mais robusto para CRM com modais/upload.
- **Google Sites + embed** — mais simples, porém limitado para
  interações ricas (modais, upload, edição inline).

> Provável caminho: HtmlService para os módulos com escrita/upload;
> Sites só como portal/agregador. Confirmar com LFM ao iniciar.

### Módulos

**1. Newsletter**
- Fonte: aba `db_newsletter`
- Listagem simples (e-mail + data)
- Ação: **exportar CSV** dos e-mails

**2. Gestão de Leads (CRM simplificado)**
- Fontes: `db_contato` + `db_climat` + **inserção manual**
- **Origem do lead:** leads chegam de qualquer página do site, incl. as
  páginas de track/pricing (`pricing-saude.html`, `pricing-healthtech.html`).
  Os campos `origem` (arquivo) e `pagina` (título) já são gravados em
  todo envio — o card/modal deve **exibir a origem** e idealmente
  **segmentar por trilha** (Serviços de Saúde vs Healthtechs) para
  roteamento comercial correto
- UI: lista de **cards**; modal com detalhes do lead (incl. nota/score
  CLIMAT e perfil de maturidade)
- **Janela de contato:** o campo `janela_contato` (dias + período) vem
  de todo lead do modal único — o card deve destacá-lo para o consultor
  ligar no horário certo (a IHB inicia o contato, não o cliente)
- Pipeline de `status`: contato → fechamento (campo `status` já existe
  nas abas; definir estágios: novo → contatado → qualificado →
  ganho/perdido)
- Ação: criar lead manual (grava em aba apropriada)

**3. Gestão de Clientes / Contratos**
- Semelhante a Leads, mas focada na entrega do trabalho
- Campos extras: **anotações**, **upload de arquivos do cliente**
- Integração: cada cliente mapeado a uma **pasta no Google Drive**
  (criar/linkar pasta via Apps Script `DriveApp`)
- Provável nova aba: `db_clientes` (+ referência ao folder ID do Drive)

**4. Calculadora CLIMAT interna**
- Mesma ferramenta do site (`climat.html`), mas **aplicada pelo
  consultor IHB** com o cliente (não auto-serviço)
- Front idêntico; diferenciar a origem (ex.: `origem='backoffice'` ou
  flag `aplicado_por`) para separar de leads inbound em `db_climat`
- Reaproveitar `climat-tool.js` (lógica de score/perfil já pronta)

### Pendências de decisão (quando iniciar)
- Estágios exatos do pipeline de status
- Estrutura da aba `db_clientes` e convenção de pastas no Drive
- Autenticação do backoffice (quem acessa — conta Google IHB?)
- HtmlService vs Google Sites (ver Arquitetura acima)
