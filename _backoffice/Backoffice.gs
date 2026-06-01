/**
 * ============================================================================
 *  IHB STRATEGIES — Backoffice.gs  (CRM interno — server-side)
 *  App HtmlService servido por doGet (Code.gs) → arquivo HTML "Backoffice".
 *  Protegido por senha (BOF_PASSWORD). Reusa helpers de Database.gs
 *  (SHEETS, HEADERS, getSheet_, rowFromPayload_, nowISO_).
 *
 *  Módulos: (1) Gestão de Leads  (2) Newsletter
 * ============================================================================
 */

// Senha do backoffice. TROQUE antes de usar. (Ideal mover para Script Property.)
var BOF_PASSWORD = 'Va$4Ft&Muf@Zc9:)H6Ho';

// Estágios do pipeline de leads. "convertido" = virou cliente (sai do funil).
var BOF_STATUS = ['novo', 'contatado', 'qualificado', 'ganho', 'perdido', 'convertido'];

// Estágios de contrato (clientes).
var BOF_CLIENTE_STATUS = ['ativo', 'pausado', 'encerrado'];

// Planos por trilha (Track 1 = saúde, Track 2 = healthtech) + valor base (R$).
// "Projeto pontual" usa valor manual (valor base editável). Mantém a ordem.
var BOF_PLANOS = {
  saude: [
    { id: 'essencial',  label: 'Essencial',   valor: 5000 },
    { id: 'estrategico', label: 'Estratégico', valor: 10000 },
    { id: 'parceiro',   label: 'Parceiro',    valor: 15000 },
    { id: 'pontual',    label: 'Projeto pontual', valor: 0 }
  ],
  healthtech: [
    { id: 'seed',    label: 'Seed',    valor: 3500 },
    { id: 'growth',  label: 'Growth',  valor: 7000 },
    { id: 'scale',   label: 'Scale',   valor: 12000 },
    { id: 'pontual', label: 'Projeto pontual', valor: 0 }
  ]
};

// Status do plano (Valores) — usado no snapshot de faturamento.
var BOF_STATUS_PLANO = ['ativo', 'inativo'];

// LTV = ticket médio × horizonte (meses). Ajuste aqui se quiser outro horizonte.
var BOF_LTV_MONTHS = 24;

/** Valida a senha; lança erro se incorreta. */
function bofAuth_(token) {
  if (String(token) !== BOF_PASSWORD) throw new Error('Senha incorreta.');
}

/** Login — usado pela tela inicial. Retorna true/false sem lançar. */
function bofLogin(token) {
  return String(token) === BOF_PASSWORD;
}

/** Config para a UI (estágios do pipeline, planos, etc.). */
function bofConfig(token) {
  bofAuth_(token);
  return {
    status: BOF_STATUS,
    clienteStatus: BOF_CLIENTE_STATUS,
    statusPlano: BOF_STATUS_PLANO,
    planos: BOF_PLANOS,
    ltvMonths: BOF_LTV_MONTHS
  };
}

/** Gera um ID de empresa estável (liga lead/cliente/CLIMAT da mesma empresa). */
function bofNewId_() { return 'emp-' + Utilities.getUuid().slice(0, 8); }

/** Valor final = base − desconto% + acréscimo%. Sempre recalculado no servidor. */
function bofCalcValorFinal_(base, descPct, acrePct) {
  base = Number(base) || 0;
  descPct = Number(descPct) || 0;
  acrePct = Number(acrePct) || 0;
  var v = base - (base * descPct / 100) + (base * acrePct / 100);
  return Math.round(v * 100) / 100;
}

/** Garante valor_final coerente num objeto de campos (lead ou cliente). */
function bofApplyValores_(obj) {
  if (!obj) return obj;
  var has = ('valor_base' in obj) || ('desconto_pct' in obj) || ('acrescimo_pct' in obj);
  if (has) obj.valor_final = bofCalcValorFinal_(obj.valor_base, obj.desconto_pct, obj.acrescimo_pct);
  return obj;
}

/* ============================  NEWSLETTER  ============================== */

function bofListNewsletter(token) {
  bofAuth_(token);
  return readSheetObjects_(SHEETS.newsletter);
}

/* ==============================  LEADS  ================================= */

/** Leads do funil: db_contato + CLIMAT INBOUND (origem != backoffice).
 *  CLIMAT aplicado no backoffice é HISTÓRICO (não vira lead). Dedupe por
 *  empresa_id (ou e-mail) — cada empresa aparece uma vez. */
function bofListLeads(token) {
  bofAuth_(token);
  var contato = readSheetObjects_(SHEETS.contato).map(function (r) { r._src = 'contato'; return r; });
  var climat = readSheetObjects_(SHEETS.climat)
    .filter(function (r) { return String(r.origem || '') !== 'backoffice'; })
    .map(function (r) { r._src = 'climat'; return r; });
  var all = contato.concat(climat).sort(function (a, b) {
    return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
  });
  var seen = {}, out = [];
  all.forEach(function (r) {
    var key = r.empresa_id ? ('id:' + r.empresa_id)
            : (r.email ? ('em:' + String(r.email).toLowerCase()) : ('uid:' + r._src + r._row));
    if (seen[key]) return;
    seen[key] = 1; out.push(r);
  });
  return out;
}

/** Busca empresas (leads + clientes) por nome/razão/CNPJ/e-mail. Para o CLIMAT. */
function bofSearchEmpresas(token, q) {
  bofAuth_(token);
  q = String(q || '').toLowerCase();
  var res = [];
  function push(r, fase, src) {
    res.push({
      empresa_id: r.empresa_id || '', fase: fase, _src: src, _row: r._row,
      company: r.company || '', razao_social: r.razao_social || '', cnpj: r.cnpj || '',
      name: r.name || '', email: r.email || '',
      segmento: r.segmento || (src === 'climat' ? 'saude' : '')
    });
  }
  readSheetObjects_(SHEETS.clientes).forEach(function (r) { push(r, 'cliente', 'clientes'); });
  readSheetObjects_(SHEETS.contato).forEach(function (r) { push(r, 'lead', 'contato'); });
  readSheetObjects_(SHEETS.climat)
    .filter(function (r) { return String(r.origem || '') !== 'backoffice'; })
    .forEach(function (r) { push(r, 'lead', 'climat'); });
  if (q) res = res.filter(function (e) {
    return (e.company + ' ' + e.razao_social + ' ' + e.cnpj + ' ' + e.name + ' ' + e.email).toLowerCase().indexOf(q) >= 0;
  });
  var seen = {}, out = [];
  res.forEach(function (e) {
    var key = e.empresa_id ? ('id:' + e.empresa_id) : (e.email ? ('em:' + e.email.toLowerCase()) : ('uid:' + e._src + e._row));
    if (seen[key]) return; seen[key] = 1; out.push(e);
  });
  return out.slice(0, 50);
}

/** Garante empresa_id num registro (backfill se faltar). Retorna dados base. */
function bofEnsureEmpresaId(token, fase, src, row) {
  bofAuth_(token);
  var sheetName = (fase === 'cliente') ? SHEETS.clientes : (src === 'climat' ? SHEETS.climat : SHEETS.contato);
  var rec = readSheetObjects_(sheetName).filter(function (r) { return r._row == Number(row); })[0];
  if (!rec) throw new Error('Registro não encontrado.');
  var id = rec.empresa_id;
  if (!id) {
    id = bofNewId_();
    var sh = getSheet_(sheetName);
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var col = headers.indexOf('empresa_id') + 1;
    if (col > 0) sh.getRange(Number(row), col).setValue(id);
  }
  return {
    empresa_id: id, company: rec.company || '', name: rec.name || '', email: rec.email || '',
    segmento: rec.segmento || (src === 'climat' ? 'saude' : ''),
    clinic_size: rec.clinic_size || '', specialty: rec.specialty || ''
  };
}

/** Histórico de CLIMAT de uma empresa (por empresa_id; fallback por e-mail). */
function bofClimatHistory(token, empresaId, email) {
  bofAuth_(token);
  email = String(email || '').toLowerCase();
  return readSheetObjects_(SHEETS.climat).filter(function (r) {
    if (empresaId && r.empresa_id === empresaId) return true;
    if (!r.empresa_id && email && String(r.email || '').toLowerCase() === email) return true;
    return false;
  }).sort(function (a, b) { return String(b.timestamp || '').localeCompare(String(a.timestamp || '')); });
}

/** Atualiza o status de um lead na aba/linha corretas. */
function bofUpdateStatus(token, src, row, status) {
  bofAuth_(token);
  if (BOF_STATUS.indexOf(status) < 0) throw new Error('status invalido');
  var sheetName = (src === 'climat') ? SHEETS.climat : SHEETS.contato;
  var sh = getSheet_(sheetName);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var col = headers.indexOf('status') + 1;
  if (col < 1) throw new Error('coluna "status" nao encontrada em ' + sheetName);
  sh.getRange(Number(row), col).setValue(status);
  return true;
}

/** Insere um lead em db_contato. Gera empresa_id. Retorna o id. */
function bofAddLead(token, lead) {
  bofAuth_(token);
  lead = lead || {};
  lead.empresa_id = lead.empresa_id || bofNewId_();
  lead.timestamp = nowISO_();
  lead.status = lead.status || 'novo';
  lead.origem = lead.origem || 'manual';
  lead.pagina = 'backoffice';
  lead.user_agent = 'backoffice';
  bofApplyValores_(lead);
  getSheet_(SHEETS.contato).appendRow(rowFromPayload_(HEADERS[SHEETS.contato], lead));
  return { ok: true, empresa_id: lead.empresa_id };
}

/** Atualiza campos arbitrários de um lead (edição no modal). */
function bofUpdateLead(token, src, row, fields) {
  bofAuth_(token);
  fields = fields || {};
  bofApplyValores_(fields);
  var sheetName = (src === 'climat') ? SHEETS.climat : SHEETS.contato;
  var sh = getSheet_(sheetName);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  Object.keys(fields).forEach(function (k) {
    var col = headers.indexOf(k) + 1;
    if (col > 0) sh.getRange(Number(row), col).setValue(fields[k]);
  });
  return true;
}

/** Apaga um lead (hard delete) da aba/linha correspondente. */
function bofDeleteLead(token, src, row) {
  bofAuth_(token);
  var sheetName = (src === 'climat') ? SHEETS.climat : SHEETS.contato;
  getSheet_(sheetName).deleteRow(Number(row));
  return { ok: true };
}

/** Converte um lead em cliente: cria registro em db_clientes (+ pasta Drive)
 *  e marca o lead como "convertido" (sai do funil). */
function bofConvertLeadToClient(token, src, row) {
  bofAuth_(token);
  var sheetName = (src === 'climat') ? SHEETS.climat : SHEETS.contato;
  var lead = readSheetObjects_(sheetName).filter(function (r) { return r._row == Number(row); })[0];
  if (!lead) throw new Error('Lead não encontrado.');
  var empresaId = lead.empresa_id || bofNewId_();
  if (!lead.empresa_id) bofUpdateLead(token, src, row, { empresa_id: empresaId });
  var res = bofAddCliente(token, {
    empresa_id: empresaId,
    company: lead.company || '', razao_social: lead.razao_social || '', cnpj: lead.cnpj || '',
    name: lead.name || '', cargo: lead.user_role || '', email: lead.email || '', phone: lead.phone || '',
    segmento: lead.segmento || (src === 'climat' ? 'saude' : ''), tipo: lead.tipo || '',
    clinic_size: lead.clinic_size || '', estagio: lead.estagio_startup || '', specialty: lead.specialty || '',
    plano: lead.plano_interesse || '', produto_ativo: lead.produto_desejado || '',
    valor_base: lead.valor_base || '', desconto_pct: lead.desconto_pct || '',
    acrescimo_pct: lead.acrescimo_pct || '', valor_final: lead.valor_final || '',
    status_plano: lead.status_plano || 'ativo',
    anotacoes: 'Convertido de lead (' + (src === 'climat' ? 'CLIMAT' : 'Contato') +
               (lead.timestamp ? ', ' + lead.timestamp : '') + ').'
  });
  bofUpdateStatus(token, src, row, 'convertido');
  return res;
}

/* ====================  CLIENTES / CONTRATOS  =========================== */

function bofListClientes(token) {
  bofAuth_(token);
  return readSheetObjects_(SHEETS.clientes);
}

/** Cria cliente + pasta no Drive (sob "IHB — Clientes"). */
function bofAddCliente(token, c) {
  bofAuth_(token);
  c = c || {};
  c.empresa_id = c.empresa_id || bofNewId_();
  var nome = String(c.company || c.name || 'Cliente');
  var folder = bofClientsRoot_().createFolder(nome + ' — ' + nowISO_().slice(0, 10));
  c.created = nowISO_();
  c.updated = nowISO_();
  c.status = c.status || 'ativo';
  c.drive_folder_id = folder.getId();
  c.drive_folder_url = folder.getUrl();
  c.status_plano = c.status_plano || 'ativo';
  bofApplyValores_(c);
  getSheet_(SHEETS.clientes).appendRow(rowFromPayload_(HEADERS[SHEETS.clientes], c));
  return { ok: true, empresa_id: c.empresa_id, folderUrl: folder.getUrl() };
}

/** Atualiza campos de um cliente (anotações, status, plano, valores...). */
function bofUpdateCliente(token, row, fields) {
  bofAuth_(token);
  fields = fields || {};
  bofApplyValores_(fields);
  var sh = getSheet_(SHEETS.clientes);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  Object.keys(fields).forEach(function (k) {
    var col = headers.indexOf(k) + 1;
    if (col > 0) sh.getRange(Number(row), col).setValue(fields[k]);
  });
  var uc = headers.indexOf('updated') + 1;
  if (uc > 0) sh.getRange(Number(row), uc).setValue(nowISO_());
  return true;
}

/** Apaga um cliente (hard delete). NÃO apaga a pasta do Drive (preserva arquivos). */
function bofDeleteCliente(token, row) {
  bofAuth_(token);
  getSheet_(SHEETS.clientes).deleteRow(Number(row));
  return { ok: true };
}

/** Lista arquivos da pasta Drive do cliente. */
function bofClienteFiles(token, folderId) {
  bofAuth_(token);
  if (!folderId) return [];
  var it = DriveApp.getFolderById(folderId).getFiles();
  var out = [];
  while (it.hasNext()) {
    var f = it.next();
    out.push({ name: f.getName(), url: f.getUrl(), id: f.getId() });
  }
  return out;
}

/** Upload de um arquivo (base64) para a pasta do cliente. */
function bofUploadFile(token, folderId, name, mime, b64) {
  bofAuth_(token);
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), mime || 'application/octet-stream', name || 'arquivo');
  var f = DriveApp.getFolderById(folderId).createFile(blob);
  return { name: f.getName(), url: f.getUrl(), id: f.getId() };
}

/** Pasta raiz "IHB — Clientes" (cria 1x, guarda ID em Script Property). */
function bofClientsRoot_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('CLIENTS_ROOT_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var folder = DriveApp.createFolder('IHB — Clientes');
  props.setProperty('CLIENTS_ROOT_ID', folder.getId());
  return folder;
}

/* ====================  CLIMAT APLICADO (consultor)  ==================== */

/** Salva um CLIMAT aplicado pelo consultor em db_climat (origem=backoffice).
 *  Vira um LEAD no funil (status "novo"). */
function bofSaveClimat(token, payload) {
  bofAuth_(token);
  payload = payload || {};
  payload.timestamp = nowISO_();
  payload.status = payload.status || 'novo';
  payload.origem = 'backoffice';
  payload.pagina = 'backoffice';
  payload.user_agent = 'backoffice';
  getSheet_(SHEETS.climat).appendRow(rowFromPayload_(HEADERS[SHEETS.climat], payload));
  return true;
}

/** Salva o CLIMAT (status "convertido") E cria o cliente + pasta no Drive. */
function bofSaveClimatAsClient(token, payload) {
  bofAuth_(token);
  payload = payload || {};
  payload.timestamp = nowISO_();
  payload.status = 'convertido';
  payload.origem = 'backoffice';
  payload.pagina = 'backoffice';
  payload.user_agent = 'backoffice';
  getSheet_(SHEETS.climat).appendRow(rowFromPayload_(HEADERS[SHEETS.climat], payload));
  return bofAddCliente(token, {
    company: payload.company || '',
    name: payload.name || '',
    email: payload.email || '',
    phone: payload.phone || '',
    segmento: payload.segmento || 'saude',
    anotacoes: 'Origem: CLIMAT aplicado (backoffice). Perfil: ' +
               (payload.perfil_maturidade || '—') + ' · Score ' + (payload.score_total || 0) + '/50.'
  });
}

/* ==========================  FATURAMENTO  ============================== */

/** Fecha o mês: grava um snapshot de TODOS os clientes ativos em db_faturamento.
 *  Idempotente — regrava o mês se já existir. mes no formato 'YYYY-MM'. */
function bofSnapshotMes(token, mes) {
  bofAuth_(token);
  return bofSnapshotMesInternal_(mes);
}

function bofSnapshotMesInternal_(mes) {
  mes = mes || nowISO_().slice(0, 7); // YYYY-MM
  var clientes = readSheetObjects_(SHEETS.clientes).filter(function (c) {
    return (c.status || 'ativo') === 'ativo';
  });
  bofDeleteFaturamentoMes_(mes); // evita duplicar o mês
  var sh = getSheet_(SHEETS.faturamento);
  var snap = nowISO_();
  clientes.forEach(function (c) {
    sh.appendRow(rowFromPayload_(HEADERS[SHEETS.faturamento], {
      mes: mes, snapshot_em: snap, empresa_id: c.empresa_id || '',
      company: c.company || c.name || '', segmento: c.segmento || '',
      plano: c.plano || '',
      valor_final: Number(c.valor_final) || 0,
      status_plano: c.status_plano || 'ativo',
      origem: 'snapshot'
    }));
  });
  return { ok: true, mes: mes, count: clientes.length };
}

/** Remove as linhas de um mês específico em db_faturamento (idempotência). */
function bofDeleteFaturamentoMes_(mes) {
  var sh = getSheet_(SHEETS.faturamento);
  var values = sh.getDataRange().getValues();
  var head = values[0] || [];
  var col = head.indexOf('mes');
  if (col < 0) return;
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][col]) === String(mes)) sh.deleteRow(i + 1);
  }
}

/** Lista o histórico de faturamento (snapshots mensais) + config de LTV. */
function bofListFaturamento(token) {
  bofAuth_(token);
  return { ok: true, rows: readSheetObjects_(SHEETS.faturamento), ltvMonths: BOF_LTV_MONTHS };
}

/** Cria (uma vez) o gatilho mensal que fecha o mês automaticamente. */
function bofEnsureMonthlyTrigger(token) {
  bofAuth_(token);
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'bofMonthlyTrigger';
  });
  if (!exists) {
    ScriptApp.newTrigger('bofMonthlyTrigger').timeBased().onMonthDay(1).atHour(3).create();
  }
  return { ok: true, created: !exists };
}

/** Gatilho automático: roda no dia 1 e fecha o mês ANTERIOR. */
function bofMonthlyTrigger() {
  var d = new Date();
  d.setDate(0); // último dia do mês anterior
  var mes = Utilities.formatDate(d, 'America/Sao_Paulo', 'yyyy-MM');
  bofSnapshotMesInternal_(mes);
}

/* =============================  HELPERS  =============================== */

/** Lê uma aba como array de objetos, com _row (nº da linha na planilha). */
function readSheetObjects_(sheetName) {
  var sh = getSheet_(sheetName);
  var values = sh.getDataRange().getValues();
  var head = values.shift() || [];
  return values.map(function (r, i) {
    var o = { _row: i + 2 }; // linha 1 = cabeçalho; dados começam na 2
    head.forEach(function (h, c) {
      var v = r[c];
      o[h] = (v instanceof Date)
        ? Utilities.formatDate(v, 'America/Sao_Paulo', 'yyyy-MM-dd HH:mm')
        : v;
    });
    return o;
  });
}
