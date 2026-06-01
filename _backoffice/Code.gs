/**
 * ============================================================================
 *  IHB STRATEGIES — Code.gs  (PONTO DE ENTRADA)
 *  Backoffice / captura de leads — Google Apps Script + Google Sheets.
 *
 *  Este e o arquivo que o Google EXECUTA:
 *    - createDatabase() -> CRIA a planilha do zero ja com as abas (rode 1x)
 *    - doPost(e)  -> recebe os formularios do site (Web App)
 *    - doGet(e)   -> ping de saude + leitura para o CRM futuro (Web App)
 *    - onOpen()   -> cria o menu "IHB Backoffice" (se script vinculado)
 *    - setupDatabase() -> recria/atualiza abas numa planilha existente
 *
 *  A LOGICA DE DADOS (config, abas, insert, list) fica em  Database.gs.
 *  Os dois arquivos compartilham o mesmo escopo global do projeto Apps Script.
 *
 *  ---------------------------------------------------------------------------
 *  INSTALACAO RESUMIDA (recomendado: script avulso)
 *  1. https://script.google.com -> Novo projeto.
 *  2. Crie 2 arquivos: Code.gs (este) e Database.gs. Cole o conteudo.
 *  3. Em Database.gs troque API_TOKEN por um segredo.
 *  4. Selecione a funcao  createDatabase  -> Run -> autorize.
 *     Ela cria a planilha "IHB — Banco de Dados (CRM)" com todas as abas
 *     e guarda o ID sozinha. Veja a URL/ID em Execucoes > Logs.
 *  5. Implantar > Nova implantacao > "App da Web":
 *        Executar como: Eu  |  Acesso: Qualquer pessoa
 *     Copie a URL /exec e envie (com o API_TOKEN) para o Claude Code.
 *
 *  (Alternativa: se preferir vincular o script a uma planilha que ja existe,
 *   pule o passo 4 e rode setupDatabase — ou use o menu "IHB Backoffice".)
 * ============================================================================
 */

/** Menu na planilha — facilita rodar o setup sem abrir o editor. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('IHB Backoffice')
    .addItem('Configurar / atualizar banco', 'setupDatabase')
    .addSeparator()
    .addItem('Testar inserção (CLIMAT)', 'testClimat')
    .addItem('Testar contato + newsletter', 'testContatoNewsletter')
    .addToUi();
}

/**
 * CRIA O BANCO DO ZERO — rode esta funcao UMA VEZ no inicio.
 * Cria uma planilha nova ja com todas as abas e cabecalhos, e faz o
 * script "lembrar" o ID dela (Script Properties) — nao precisa editar
 * SPREADSHEET_ID na mao nem vincular o script a uma planilha.
 *
 * Use quando o script for AVULSO (script.google.com).
 * Se o script ja estiver vinculado a uma planilha, use setupDatabase().
 */
function createDatabase() {
  var ss = SpreadsheetApp.create('IHB — Banco de Dados (CRM)');
  ensureAllSheets_(ss);              // cria abas nesta planilha (Database.gs)
  rememberDbId_(ss.getId());         // grava o ID nas Script Properties

  var info = 'Banco criado com sucesso.'
    + '\n\nNome: IHB — Banco de Dados (CRM)'
    + '\nURL:  ' + ss.getUrl()
    + '\nID:   ' + ss.getId()
    + '\n\nAbas: ' + Object.keys(HEADERS).join(', ')
    + '\n\nProximo passo: Implantar > App da Web e me enviar a URL /exec.';
  Logger.log(info);
  return info;
}

/**
 * Cria/atualiza as abas numa planilha QUE JA EXISTE (vinculada ou via
 * SPREADSHEET_ID / Script Property). Idempotente. Tambem disponivel no menu.
 * Para criar o banco do zero, use createDatabase().
 */
function setupDatabase() {
  var msg = ensureAllSheets_(); // definido em Database.gs
  try { SpreadsheetApp.getActive().toast(msg, 'IHB Backoffice', 5); } catch (ignore) {}
  Logger.log(msg);
  return msg;
}

/* ===========================  WEB APP — POST  =========================== */
/**
 * Recebe os envios do site. Roteia pelo campo "form":
 *   form = "climat" | "contato" | "newsletter"
 * Corpo aceito: JSON (text/plain) ou form-urlencoded.
 */
function doPost(e) {
  try {
    var payload = parsePayload_(e);

    // Honeypot anti-spam (mesmo padrao do Formspree: campo _gotcha).
    if (payload._gotcha) {
      return jsonOut_({ ok: true, skipped: 'honeypot' });
    }

    var form = String(payload.form || '').toLowerCase().trim();
    var result = dbInsert_(form, payload, e); // definido em Database.gs
    return jsonOut_(result);

  } catch (err) {
    log_('error', 'doPost', String(err), e && e.postData ? e.postData.contents : '');
    return jsonOut_({ ok: false, error: String(err) });
  }
}

/* ===========================  WEB APP — GET  ============================ */
/**
 * Usos:
 *   ?action=ping                         -> teste de saude
 *   ?action=list&form=climat&token=XXX   -> lista registros (CRM futuro)
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = String(p.action || '');

  if (action === 'ping') {
    return jsonOut_({ ok: true, service: 'IHB Database', time: nowISO_() });
  }

  if (action === 'list') {
    if (p.token !== API_TOKEN) {
      return jsonOut_({ ok: false, error: 'token invalido' });
    }
    var result = dbList_(String(p.form || '').toLowerCase()); // Database.gs
    return jsonOut_(result);
  }

  // Sem action de API → serve o Backoffice (HtmlService).
  return HtmlService.createHtmlOutputFromFile('Backoffice_System')
    .setTitle('IHB Backoffice')
    .setFaviconUrl('https://www.ihbstrategies.com/assets/images/favicon/favicon-96x96.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* =============================  TESTES  ================================= */

/** Simula um envio do CLIMAT — rode para validar a base sem usar o site. */
function testClimat() {
  var fake = {
    postData: {
      contents: JSON.stringify({
        form: 'climat',
        clinic_name: 'Clinica Teste', user_name: 'Dr. Teste',
        user_role: 'Diretor', email: 'teste@exemplo.com', phone: '11999999999',
        clinic_size: 'medium', specialty: 'Cardiologia',
        q1: 3, q2: 4, q3: 2, q4: 3, q5: 1, q6: 4, q7: 3, q8: 2, q9: 3, q10: 4,
        score_tecnologia: 13, score_processos: 16, score_total: 29,
        perfil_maturidade: 'Em Desenvolvimento',
        origem: 'climat.html', pagina: 'climat', user_agent: 'teste-manual'
      })
    }
  };
  Logger.log(doPost(fake).getContent());
}

/** Simula contato + newsletter. */
function testContatoNewsletter() {
  Logger.log(doPost({ postData: { contents: JSON.stringify({
    form: 'contato', name: 'Fulano', email: 'fulano@x.com', phone: '11988887777',
    company: 'Clinica X', message: 'Quero saber mais.', origem: 'index.html', pagina: 'home'
  }) } }).getContent());

  Logger.log(doPost({ postData: { contents: JSON.stringify({
    form: 'newsletter', email: 'news@x.com', origem: 'index.html', pagina: 'home'
  }) } }).getContent());
}
