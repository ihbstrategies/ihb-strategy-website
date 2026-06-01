/**
 * ============================================================================
 *  IHB STRATEGIES — Database.gs  (CAMADA DE DADOS)
 *  Config + persistencia no Google Sheets. Substitui o Formspree.
 *
 *  NAO contem doGet/doPost — esses ficam em Code.gs (ponto de entrada).
 *  Os dois arquivos compartilham o mesmo escopo global do projeto.
 *
 *  Funcoes publicas usadas pelo Code.gs:
 *    ensureAllSheets_()         -> cria/atualiza todas as abas (setup)
 *    dbInsert_(form, payload,e) -> valida e grava 1 registro
 *    dbList_(form)              -> le todos os registros (CRM futuro)
 *  Helpers compartilhados: parsePayload_, jsonOut_, nowISO_, log_, getSheet_
 * ============================================================================
 */

/* ===========================  CONFIGURACAO  =============================== */

// Deixe vazio para usar a planilha onde o script esta vinculado (recomendado).
// Ou cole o ID de uma planilha especifica (parte da URL entre /d/ e /edit).
var SPREADSHEET_ID = '';

// Token para proteger a leitura via doGet (CRM/backoffice futuro).
// Usado SO na leitura (?action=list&token=...). O envio dos forms nao usa.
var API_TOKEN = 'ihb-7Kp9xQ2mZ4vB8nR3tL6wgY1';

// Nomes das abas (uma por tipo de formulario) + aba de log.
var SHEETS = {
  climat:      'db_climat',
  contato:     'db_contato',
  newsletter:  'db_newsletter',
  clientes:    'db_clientes',
  faturamento: 'db_faturamento',
  log:         'db_log'
};

// Cabecalhos de cada aba — a ORDEM define a ordem das colunas.
var HEADERS = {
  db_climat: [
    'timestamp', 'company', 'name', 'user_role', 'email', 'phone',
    'clinic_size', 'specialty',
    'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10',
    'score_tecnologia', 'score_processos', 'score_total', 'perfil_maturidade',
    'origem', 'pagina', 'user_agent', 'status', 'empresa_id',
    // Padronização p/ fluxo de cards no backoffice — NÃO são pedidos no CLIMAT
    // inbound (campos sempre vazios na entrada). Preenchidos só se o consultor
    // editar o lead-CLIMAT no modal unificado.
    'razao_social', 'cnpj', 'tipo', 'segmento', 'estagio_startup',
    'plano_interesse', 'produto_desejado',
    'valor_base', 'desconto_pct', 'acrescimo_pct', 'valor_final', 'status_plano'
  ],
  db_contato: [
    'timestamp', 'name', 'email', 'phone', 'company', 'message',
    'origem', 'pagina', 'user_agent', 'status', 'plano_interesse',
    'specialty', 'clinic_size',
    'user_role', 'estagio_startup', 'area_produto', 'segmento',
    'janela_contato',
    'empresa_id', 'razao_social', 'cnpj', 'tipo', 'produto_desejado',
    'valor_base', 'desconto_pct', 'acrescimo_pct', 'valor_final', 'status_plano'
  ],
  db_newsletter: [
    'timestamp', 'email', 'origem', 'pagina', 'user_agent', 'status'
  ],
  db_clientes: [
    'created', 'updated', 'empresa_id', 'company', 'razao_social', 'cnpj',
    'name', 'cargo', 'email', 'phone',
    'segmento', 'tipo', 'clinic_size', 'estagio', 'specialty',
    'plano', 'produto_ativo', 'status', 'anotacoes',
    'valor_base', 'desconto_pct', 'acrescimo_pct', 'valor_final', 'status_plano',
    'drive_folder_id', 'drive_folder_url'
  ],
  db_faturamento: [
    'mes', 'snapshot_em', 'empresa_id', 'company', 'segmento',
    'plano', 'valor_final', 'status_plano', 'origem'
  ],
  db_log: [
    'timestamp', 'level', 'form', 'message', 'raw'
  ]
};

// "status" comeca como "novo" — usado depois no CRM (novo/contatado/...).
var DEFAULT_STATUS = 'novo';

// Cor do cabecalho das abas (verde IHB).
var HEADER_BG = '#2F3E38';

/* ============================  SETUP / DDL  ============================== */

/**
 * Cria/garante todas as abas com cabecalho e formatacao.
 * Idempotente: pode rodar varias vezes sem duplicar nada.
 * Chamada por setupDatabase() em Code.gs.
 */
function ensureAllSheets_(ss) {
  ss = ss || getSpreadsheet_();
  Object.keys(HEADERS).forEach(function (sheetName) {
    ensureSheet_(ss, sheetName, HEADERS[sheetName]);
  });
  // Remove a aba "Pagina1"/"Sheet1" padrao se estiver vazia e sobrando.
  var def = ss.getSheetByName('Pagina1') || ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) {
    ss.deleteSheet(def);
  }
  log_('info', 'setup', 'ensureAllSheets_ concluido', '');
  return 'OK — abas criadas/atualizadas: ' + Object.keys(HEADERS).join(', ');
}

/** Garante que uma aba existe com o cabecalho correto e formatado. */
function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  var range = sh.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground(HEADER_BG);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, headers.length);
  return sh;
}

/* ==========================  DATA — INSERT  ============================= */

/**
 * Valida o "form" e grava um registro na aba correspondente.
 * Retorna objeto { ok, ... } — o Code.gs encapsula em jsonOut_.
 */
function dbInsert_(form, payload, e) {
  if (!SHEETS[form] || form === 'log' || form === 'faturamento') {
    log_('warn', form || '?', 'form invalido ou ausente', JSON.stringify(payload));
    return { ok: false, error: 'campo "form" invalido. Use climat | contato | newsletter' };
  }

  var sheetName = SHEETS[form];
  var headers = HEADERS[sheetName];

  // Enriquecimento automatico.
  payload.timestamp = nowISO_();
  payload.status = DEFAULT_STATUS;
  if (!payload.user_agent) {
    payload.user_agent = (e && e.parameter && e.parameter.ua) || '';
  }

  var row = rowFromPayload_(headers, payload);
  getSheet_(sheetName).appendRow(row);

  log_('info', form, 'registro inserido', payload.email || payload.clinic_name || '');
  return { ok: true, form: form, stored: sheetName };
}

/* ===========================  DATA — LIST  ============================= */

/** Le todos os registros de uma aba como array de objetos (CRM futuro). */
function dbList_(form) {
  var sheetName = SHEETS[form];
  if (!sheetName || form === 'log') {
    return { ok: false, error: 'form invalido' };
  }
  var sh = getSheet_(sheetName);
  var values = sh.getDataRange().getValues();
  var head = values.shift() || [];
  var rows = values.map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = r[i]; });
    return o;
  });
  return { ok: true, form: form, count: rows.length, data: rows };
}

/* =============================  HELPERS  ================================ */

/**
 * Abre a planilha do banco, resolvendo nesta ordem:
 *   1. constante SPREADSHEET_ID (se preenchida manualmente)
 *   2. Script Property 'SPREADSHEET_ID' (gravada por createDatabase())
 *   3. planilha vinculada/ativa (script container-bound)
 * Se nada existir, orienta a rodar createDatabase().
 */
function getSpreadsheet_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);

  var propId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (propId) return SpreadsheetApp.openById(propId);

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  throw new Error('Banco nao encontrado. Rode a funcao createDatabase() uma vez para criar a planilha, ou preencha SPREADSHEET_ID.');
}

/** Grava o ID da planilha do banco nas Script Properties. */
function rememberDbId_(id) {
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
}

/** Retorna a aba pelo nome, criando-a se necessario. */
function getSheet_(name) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ensureSheet_(ss, name, HEADERS[name] || ['timestamp', 'raw']);
  return sh;
}

/** Le o corpo do POST: JSON (text/plain) ou form-urlencoded. */
function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    try {
      return JSON.parse(raw);
    } catch (ignore) {
      var obj = {};
      raw.split('&').forEach(function (pair) {
        var kv = pair.split('=');
        if (kv[0]) obj[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
      });
      return obj;
    }
  }
  return (e && e.parameter) ? e.parameter : {};
}

/** Monta a linha na ordem dos cabecalhos; ignora chaves desconhecidas. */
function rowFromPayload_(headers, payload) {
  return headers.map(function (h) {
    var v = payload[h];
    return (v === undefined || v === null) ? '' : v;
  });
}

/** Resposta JSON. */
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Timestamp ISO no fuso de Sao Paulo. */
function nowISO_() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', "yyyy-MM-dd'T'HH:mm:ss");
}

/** Log interno na aba db_log (best-effort, nunca quebra o fluxo). */
function log_(level, form, message, raw) {
  try {
    var sh = getSheet_(SHEETS.log);
    sh.appendRow([nowISO_(), level, form, message, String(raw).slice(0, 4000)]);
  } catch (ignore) {}
}
