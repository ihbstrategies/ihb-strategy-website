// modal.js — Modal único de necessidade ("Fale com a IHB").
// Substitui "Agendar Conversa" (Google Calendar) e "Fale Conosco".
// A IHB captura o lead + a janela de contato e liga de volta — sem
// depender de calendário, com previsibilidade para os consultores.
//
// Triggers: qualquer elemento com a classe .js-contato. Atributos:
//   data-segment="saude" | "healthtech"   (ausente = pergunta no modal)
//   data-plan="..."                       (plano fixo — cards de pricing)
//   data-projetos                         (modo projeto pontual — select)
//
// Reusa window.ihbDbSend (main.js). Grava em db_contato.

document.addEventListener('DOMContentLoaded', function () {
  var triggers = document.querySelectorAll('.js-contato');
  if (!triggers.length) return;

  function chip(value, label) {
    return '<label class="ihb-chip"><input type="checkbox" value="' + value +
      '"><span>' + label + '</span></label>';
  }

  // --- Blocos de campos ---
  var SEGMENT_SELECT =
    '<div class="form-group"><label>Você é...</label>' +
      '<select name="segmento" class="js-seg-select" required>' +
        '<option value="">Selecione</option>' +
        '<option value="saude">Serviço de saúde (clínica, hospital, diagnóstico)</option>' +
        '<option value="healthtech">Healthtech / startup de saúde</option>' +
      '</select></div>';

  var COMMON =
    '<div class="form-group"><label>Nome completo</label>' +
      '<input type="text" name="name" placeholder="Seu nome completo" required></div>' +
    '<div class="form-group"><label>E-mail</label>' +
      '<input type="email" name="email" placeholder="seu@email.com" required></div>' +
    '<div class="form-group"><label>Telefone</label>' +
      '<input type="tel" name="phone" placeholder="(11) 99999-9999"></div>';

  var FIELDS_SAUDE =
    '<div class="form-group"><label>Especialidade</label>' +
      '<input type="text" name="specialty" placeholder="Ex: Cardiologia, Clínica Geral"></div>' +
    '<div class="form-group"><label>Porte da organização</label>' +
      '<select name="clinic_size">' +
        '<option value="">Selecione</option>' +
        '<option value="small">Pequena (1–10 profissionais)</option>' +
        '<option value="medium">Média (11–30 profissionais)</option>' +
        '<option value="large">Grande (mais de 30 profissionais)</option>' +
      '</select></div>';

  var FIELDS_HEALTHTECH =
    '<div class="form-group"><label>Nome da healthtech</label>' +
      '<input type="text" name="company" placeholder="Nome da sua empresa"></div>' +
    '<div class="form-group"><label>Seu cargo</label>' +
      '<select name="user_role">' +
        '<option value="">Selecione</option>' +
        '<option value="Fundador(a) / CEO">Fundador(a) / CEO</option>' +
        '<option value="C-level">C-level (CTO, CMO, COO...)</option>' +
        '<option value="Gestor(a)">Gestor(a)</option>' +
        '<option value="Investidor(a)">Investidor(a)</option>' +
        '<option value="Outro">Outro</option>' +
      '</select></div>' +
    '<div class="form-group"><label>Estágio da empresa</label>' +
      '<select name="estagio_startup">' +
        '<option value="">Selecione</option>' +
        '<option value="Ideação / Pré-seed">Ideação / Pré-seed</option>' +
        '<option value="Seed">Seed</option>' +
        '<option value="Série A">Série A</option>' +
        '<option value="Série B+ / Scale">Série B+ / Scale</option>' +
      '</select></div>' +
    '<div class="form-group"><label>Área do produto</label>' +
      '<select name="area_produto">' +
        '<option value="">Selecione</option>' +
        '<option value="Telemedicina">Telemedicina</option>' +
        '<option value="Gestão clínica / operacional">Gestão clínica / operacional</option>' +
        '<option value="Diagnóstico">Diagnóstico</option>' +
        '<option value="Dispositivos médicos">Dispositivos médicos</option>' +
        '<option value="Dados / IA">Dados / IA</option>' +
        '<option value="Outro">Outro</option>' +
      '</select></div>';

  var PROJETO_SELECT =
    '<div class="form-group"><label>Projeto de interesse</label>' +
      '<select name="projeto" required>' +
        '<option value="">Selecione o projeto</option>' +
        '<option value="Projeto pontual — Diagnóstico DAET completo (R$ 8.000–12.000)">Diagnóstico DAET completo (R$ 8.000–12.000)</option>' +
        '<option value="Projeto pontual — Implementação de dashboard / KPIs (R$ 6.000–15.000)">Implementação de dashboard / KPIs (R$ 6.000–15.000)</option>' +
        '<option value="Projeto pontual — Workshop gestão baseada em dados (R$ 3.500–5.000)">Workshop gestão baseada em dados (R$ 3.500–5.000)</option>' +
        '<option value="Projeto pontual — Sob demanda (a definir de acordo com a demanda)">Projeto sob demanda (a definir)</option>' +
      '</select></div>';

  var JANELA =
    '<div class="form-group"><label>Melhores dias para contato</label>' +
      '<div class="ihb-chips" data-group="dias">' +
        chip('Segunda', 'Seg') + chip('Terça', 'Ter') + chip('Quarta', 'Qua') +
        chip('Quinta', 'Qui') + chip('Sexta', 'Sex') +
      '</div></div>' +
    '<div class="form-group"><label>Melhor período</label>' +
      '<div class="ihb-chips" data-group="periodo">' +
        chip('Manhã (7h–12h)', 'Manhã') + chip('Tarde (12h–18h)', 'Tarde') +
        chip('Noite (após 18h)', 'Noite') +
      '</div></div>';

  var MESSAGE =
    '<div class="form-group"><label>Como podemos ajudar?</label>' +
      '<textarea name="message" rows="3" placeholder="Conte rapidamente sua necessidade"></textarea></div>';

  // --- Shell do modal (criado uma vez) ---
  var overlay = document.createElement('div');
  overlay.className = 'ihb-modal-overlay';
  overlay.setAttribute('hidden', '');
  overlay.innerHTML =
    '<div class="ihb-modal" role="dialog" aria-modal="true" aria-labelledby="ihbModalTitle">' +
      '<button type="button" class="ihb-modal-close" aria-label="Fechar">&times;</button>' +
      '<h3 id="ihbModalTitle">Fale com a IHB</h3>' +
      '<p class="ihb-modal-plan"></p>' +
      '<form class="ihb-modal-form" novalidate></form>' +
    '</div>';
  document.body.appendChild(overlay);

  var titleEl = overlay.querySelector('#ihbModalTitle');
  var planP = overlay.querySelector('.ihb-modal-plan');
  var form = overlay.querySelector('.ihb-modal-form');
  var state = { segment: '', plan: '', projeto: false };

  function trackFields(segment) {
    if (segment === 'healthtech') return FIELDS_HEALTHTECH;
    if (segment === 'saude') return FIELDS_SAUDE;
    return '';
  }

  function buildForm(askSegment, segment, projeto) {
    var html = '';
    if (askSegment) html += SEGMENT_SELECT;
    if (projeto) html += PROJETO_SELECT;
    html += COMMON;
    html += '<div class="ihb-track-fields">' + trackFields(segment) + '</div>';
    html += JANELA + MESSAGE;
    html += '<button type="submit" class="btn btn-primary">Enviar</button>';
    html += '<p class="ihb-modal-msg"></p>';
    form.innerHTML = html;

    if (askSegment) {
      var segSel = form.querySelector('.js-seg-select');
      segSel.addEventListener('change', function () {
        state.segment = segSel.value;
        form.querySelector('.ihb-track-fields').innerHTML = trackFields(segSel.value);
      });
    }
  }

  function openModal(trigger) {
    var seg = trigger.getAttribute('data-segment') || '';
    var plan = trigger.getAttribute('data-plan') || '';
    var projeto = trigger.hasAttribute('data-projetos');

    if (plan) seg = plan.indexOf('Healthtech') !== -1 ? 'healthtech' : 'saude';
    if (projeto) seg = 'saude';

    state.segment = seg;
    state.plan = plan;
    state.projeto = projeto;

    buildForm(!seg, seg, projeto);

    if (plan) {
      titleEl.textContent = 'Selecionar plano';
      planP.textContent = 'Plano: ' + plan;
      planP.style.display = '';
    } else if (projeto) {
      titleEl.textContent = 'Solicitar projeto pontual';
      planP.style.display = 'none';
    } else {
      titleEl.textContent = 'Fale com a IHB';
      planP.style.display = 'none';
    }

    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    var first = form.querySelector('input, select');
    if (first) first.focus();
  }

  function closeModal() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  triggers.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(btn);
    });
  });

  overlay.querySelector('.ihb-modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) closeModal();
  });

  // --- Submit ---
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('[type="submit"]');
    var msg = form.querySelector('.ihb-modal-msg');
    var orig = btn.textContent;

    function val(name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : '';
    }
    function chips(group) {
      var out = [];
      form.querySelectorAll('.ihb-chips[data-group="' + group + '"] input:checked')
        .forEach(function (c) { out.push(c.value); });
      return out.join(', ');
    }

    var segment = state.segment || val('segmento');
    if (!segment) {
      msg.style.color = '#C0392B';
      msg.textContent = 'Selecione se você é serviço de saúde ou healthtech.';
      return;
    }

    var name = val('name');
    var email = val('email');
    if (!name || !email || email.indexOf('@') < 1) {
      msg.style.color = '#C0392B';
      msg.textContent = 'Preencha nome e um e-mail válido.';
      return;
    }

    var plano = state.plan;
    if (state.projeto) {
      plano = val('projeto');
      if (!plano) {
        msg.style.color = '#C0392B';
        msg.textContent = 'Selecione o projeto de interesse.';
        return;
      }
    }
    if (typeof window.ihbDbSend !== 'function') {
      msg.style.color = '#C0392B';
      msg.textContent = 'Erro de configuração. Tente novamente mais tarde.';
      return;
    }

    var dias = chips('dias');
    var periodo = chips('periodo');
    var janela = '';
    if (dias) janela += 'Dias: ' + dias;
    if (periodo) janela += (janela ? ' | ' : '') + 'Período: ' + periodo;

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    var payload = {
      form: 'contato',
      name: name,
      email: email,
      phone: val('phone'),
      message: val('message') || (plano ? ('Interesse em: ' + plano) : 'Contato via site'),
      plano_interesse: plano,
      segmento: segment,
      janela_contato: janela
    };

    if (segment === 'healthtech') {
      payload.company = val('company');
      payload.user_role = val('user_role');
      payload.estagio_startup = val('estagio_startup');
      payload.area_produto = val('area_produto');
    } else {
      payload.company = val('company');
      payload.specialty = val('specialty');
      payload.clinic_size = val('clinic_size');
    }

    window.ihbDbSend(payload).then(function () {
      msg.style.color = '#5B7766';
      msg.textContent = 'Recebido! A IHB entra em contato na janela informada.';
      form.reset();
      setTimeout(closeModal, 2000);
    }).catch(function () {
      msg.style.color = '#C0392B';
      msg.textContent = 'Não foi possível enviar agora. Tente novamente.';
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = orig;
    });
  });
});

// --- Pop-up de 1ª visita (só na home, body[data-home]) ---
// Segmenta o visitante para a trilha certa. Não repete (localStorage).
document.addEventListener('DOMContentLoaded', function () {
  if (!document.body.hasAttribute('data-home')) return;
  try {
    if (localStorage.getItem('ihb_rota_escolhida')) return;
  } catch (e) { return; }

  function done() {
    try { localStorage.setItem('ihb_rota_escolhida', '1'); } catch (e) {}
  }

  function showRotaPopup() {
    var pop = document.createElement('div');
    pop.className = 'ihb-modal-overlay';
    pop.innerHTML =
      '<div class="ihb-modal ihb-rota-pop">' +
        '<button type="button" class="ihb-modal-close" aria-label="Fechar">&times;</button>' +
        '<h3>Por onde começar?</h3>' +
        '<p>Para te mostrar o conteúdo certo — você é:</p>' +
        '<div class="ihb-rota-options">' +
          '<a href="servicos-saude.html" class="btn btn-primary">Um serviço de saúde</a>' +
          '<a href="healthtechs.html" class="btn btn-secondary">Uma healthtech / startup</a>' +
        '</div>' +
      '</div>';

    function dismiss() {
      done();
      if (pop.parentNode) pop.remove();
      document.body.style.overflow = '';
    }
    pop.querySelector('.ihb-modal-close').addEventListener('click', dismiss);
    pop.addEventListener('click', function (e) { if (e.target === pop) dismiss(); });
    pop.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', done); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && pop.parentNode) dismiss();
    });

    document.body.appendChild(pop);
    document.body.style.overflow = 'hidden';
  }

  setTimeout(showRotaPopup, 900);
});
