// CLIMAT Tool — IHB Strategy v2
// Melhorias v2: captura de score no envio, perfis de maturidade, recomendações por perfil

document.addEventListener('DOMContentLoaded', function() {

  const formSections = document.querySelectorAll('.form-section');
  const climatForm = document.getElementById('climatForm');
  let currentSection = 0;

  // Dados do lead capturados no momento do submit (antes de qualquer reset de form)
  let storedLeadData = {};

  // --- Scroll utilitário: posiciona no topo do formulário ---
  function scrollToForm() {
    const form = document.getElementById('climatForm');
    if (!form) return;
    const top = form.getBoundingClientRect().top + window.pageYOffset - 150;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  // --- Navegação entre seções ---
  // scroll=false na inicialização para não pular ao topo no carregamento
  function showSection(index, scroll = true) {
    formSections.forEach((section, i) => {
      section.classList.toggle('active', i === index);
    });
    currentSection = index;
    if (scroll) scrollToForm();
  }

  // Botões "Próximo"
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', function() {
      if (validateSection(currentSection)) {
        showSection(currentSection + 1);
      }
    });
  });

  // Botões "Anterior"
  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', function() {
      showSection(currentSection - 1);
    });
  });

  // --- Validação por seção ---
  function validateSection(sectionIndex) {
    const section = formSections[sectionIndex];
    let valid = true;

    // Valida campos de texto/email/tel/select
    section.querySelectorAll('input[required], select[required]').forEach(field => {
      field.classList.remove('error');
      const existingError = field.parentNode.querySelector('.error-message');
      if (existingError) existingError.remove();

      if (!field.value.trim()) {
        field.classList.add('error');
        const errMsg = document.createElement('span');
        errMsg.className = 'error-message';
        errMsg.textContent = 'Este campo é obrigatório.';
        field.parentNode.appendChild(errMsg);
        valid = false;
      }
    });

    // Valida grupos de radio buttons
    section.querySelectorAll('.question-group').forEach(group => {
      group.classList.remove('error');
      const existingError = group.querySelector('.error-message');
      if (existingError) existingError.remove();

      const radios = group.querySelectorAll('input[type="radio"]');
      const answered = Array.from(radios).some(r => r.checked);
      if (!answered) {
        group.classList.add('error');
        const errMsg = document.createElement('span');
        errMsg.className = 'error-message';
        errMsg.textContent = 'Por favor, selecione uma opção.';
        group.appendChild(errMsg);
        valid = false;
      }
    });

    return valid;
  }

  // --- Cálculo de Score ---
  function calcScore(questionNames) {
    let score = 0;
    questionNames.forEach(name => {
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      if (checked) score += parseInt(checked.value);
    });
    return score;
  }

  // Valor selecionado de um grupo de radios (q1..q10)
  function radioVal(name) {
    const c = document.querySelector(`input[name="${name}"]:checked`);
    return c ? c.value : '';
  }

  // --- Perfil de maturidade ---
  function getProfile(total) {
    if (total <= 25) return 'iniciante';
    if (total <= 35) return 'em-desenvolvimento';
    return 'avancado';
  }

  const profileData = {
    'iniciante': {
      label: '🌱 Iniciante',
      description: 'Seu negócio de saúde está no início da jornada de maturidade operacional e tecnológica. Há grandes oportunidades de ganho de eficiência e competitividade.',
      color: '#e67e22',
      recommendations: [
        {
          title: 'Diagnóstico Inicial Completo',
          text: 'Antes de qualquer iniciativa, estruture um diagnóstico completo de processos e tecnologia para identificar as prioridades de maior impacto.'
        },
        {
          title: 'Implantação de Sistema de Gestão Clínica',
          text: 'Priorize a adoção de um prontuário eletrônico integrado com agendamento e faturamento. Este é o alicerce de todas as demais iniciativas.'
        },
        {
          title: 'Mapeamento dos Processos Críticos',
          text: 'Documente os fluxos de agendamento, atendimento e cobrança. A padronização é fundamental para escalar com qualidade.'
        },
        {
          title: 'Dashboards Básicos de KPIs',
          text: 'Implante indicadores mínimos: taxa de ocupação, ticket médio, NPS e inadimplência. O que não é medido não pode ser melhorado.'
        }
      ]
    },
    'em-desenvolvimento': {
      label: '📈 Em Desenvolvimento',
      description: 'Seu negócio já tem fundamentos sólidos e está evoluindo. O foco agora é integrar, automatizar e criar uma cultura de decisão baseada em dados.',
      color: '#2980b9',
      recommendations: [
        {
          title: 'Integração de Dados entre Sistemas',
          text: 'Elimine os silos de informação. Integre prontuário, financeiro e marketing para ter uma visão 360° do seu negócio.'
        },
        {
          title: 'Automação de Comunicação e Pós-consulta',
          text: 'Implemente automações para confirmação de consultas, pós-consulta e retenção de pacientes via WhatsApp e e-mail.'
        },
        {
          title: 'Funil de Aquisição de Pacientes',
          text: 'Estruture métricas de CAC, LTV e conversão para ter clareza sobre o desempenho do marketing e reduzir dependência de indicações.'
        },
        {
          title: 'Cultura de Melhoria Contínua',
          text: 'Implante reuniões de análise de indicadores e ciclos de melhoria de processos. Envolva a equipe na busca por eficiência.'
        }
      ]
    },
    'avancado': {
      label: '🚀 Avançado',
      description: 'Seu negócio está na vanguarda da gestão em saúde. O próximo nível é escalar com inteligência artificial, análise preditiva e governança avançada.',
      color: '#27ae60',
      recommendations: [
        {
          title: 'Análise Preditiva e IA Generativa',
          text: 'Explore machine learning para previsão de demanda, risco de cancelamento e otimização de agenda. A IA já é acessível para clínicas.'
        },
        {
          title: 'Interoperabilidade e Ecossistema Digital',
          text: 'Avance na integração com sistemas de saúde suplementar, laboratórios e hospitais parceiros para criar um ecossistema integrado.'
        },
        {
          title: 'Governança de Dados e LGPD',
          text: 'Implante um programa formal de governança de dados, compliance com LGPD e gestão de riscos cibernéticos.'
        },
        {
          title: 'Expansão e Benchmarking',
          text: 'Use seus dados para estruturar uma estratégia de expansão geográfica ou de serviços com base em evidências.'
        }
      ]
    }
  };

  // --- Exibe resultados ---
  function showResults(techScore, processScore) {
    const total = techScore + processScore;
    const profile = getProfile(total);
    const data = profileData[profile];

    // Scores
    document.getElementById('totalScore').textContent = total + '/50';
    document.getElementById('techScore').textContent = techScore;
    document.getElementById('processScore').textContent = processScore;

    // Barras de progresso
    const techPct = Math.round((techScore / 25) * 100);
    const processPct = Math.round((processScore / 25) * 100);

    const techFill = document.getElementById('techScoreFill');
    const processFill = document.getElementById('processScoreFill');
    if (techFill) { techFill.style.width = techPct + '%'; techFill.textContent = techScore + '/25'; }
    if (processFill) { processFill.style.width = processPct + '%'; processFill.textContent = processScore + '/25'; }

    // Perfil
    const profileLabel = document.getElementById('profileLabel');
    const profileDesc = document.getElementById('profileDescription');
    if (profileLabel) { profileLabel.textContent = data.label; profileLabel.style.color = data.color; }
    if (profileDesc) profileDesc.textContent = data.description;

    // Recomendações
    const recContainer = document.getElementById('recommendationsList');
    if (recContainer) {
      recContainer.innerHTML = '';
      data.recommendations.forEach(rec => {
        const div = document.createElement('div');
        div.className = 'recommendation-item';
        div.innerHTML = `<h4>${rec.title}</h4><p>${rec.text}</p>`;
        recContainer.appendChild(div);
      });
    }

    // Mostra seção de resultados
    formSections.forEach(s => s.classList.remove('active'));
    document.getElementById('results').classList.add('active');
    scrollToForm();
  }

  // --- Envio do formulário ---
  if (climatForm) {
    climatForm.addEventListener('submit', function(e) {
      e.preventDefault();

      if (!validateSection(currentSection)) return;

      // Captura dados do lead antes de qualquer reset de form
      storedLeadData = {
        clinicName:  (document.getElementById('clinic_name')  || {}).value || '',
        userName:    (document.getElementById('user_name')    || {}).value || '',
        userRole:    (document.getElementById('user_role')    || {}).value || '',
        clinicSize:  (document.getElementById('clinic_size')  || {}).value || '',
        specialty:   (document.getElementById('specialty')    || {}).value || '',
      };

      // Calcula scores
      const techScore = calcScore(['q1','q2','q3','q4','q5']);
      const processScore = calcScore(['q6','q7','q8','q9','q10']);
      const total = techScore + processScore;
      const profile = getProfile(total);

      // Monta o payload para o banco IHB (Apps Script — form "climat")
      const payload = {
        form: 'climat',
        company: storedLeadData.clinicName,
        name: storedLeadData.userName,
        user_role: storedLeadData.userRole,
        email: (document.getElementById('user_email') || {}).value || '',
        phone: (document.getElementById('user_phone') || {}).value || '',
        clinic_size: storedLeadData.clinicSize,
        specialty: storedLeadData.specialty,
        q1: radioVal('q1'), q2: radioVal('q2'), q3: radioVal('q3'),
        q4: radioVal('q4'), q5: radioVal('q5'), q6: radioVal('q6'),
        q7: radioVal('q7'), q8: radioVal('q8'), q9: radioVal('q9'),
        q10: radioVal('q10'),
        score_tecnologia: techScore,
        score_processos: processScore,
        score_total: total,
        perfil_maturidade: profileData[profile].label
      };

      const submitBtn = climatForm.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando...'; }

      // Sempre exibe os resultados (não bloqueia o usuário nem o PDF),
      // mesmo se o envio falhar por rede.
      if (window.ihbDbSend) {
        window.ihbDbSend(payload)
          .then(() => showResults(techScore, processScore))
          .catch(() => showResults(techScore, processScore));
      } else {
        showResults(techScore, processScore);
      }
    });
  }

  // --- Geração de PDF do relatório ---
  function generatePDF(leadData, techScore, processScore, profile) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const pageH = 297;
    const margin = 18;
    const contentW = pageW - margin * 2;
    const data = profileData[profile];

    const colPrimary  = [47, 62, 56];    // #2F3E38
    const colAccent   = [91, 119, 102];  // #5B7766
    const colBeige    = [243, 240, 230]; // #F3F0E6
    const colWhite    = [255, 255, 255];
    const colGray     = [100, 100, 100];

    // Semáforo ancorado na marca IHB no nível mais alto
    const profileColors = {
      'iniciante':          [192, 57,  43],  // #C0392B terracota
      'em-desenvolvimento': [196, 134, 10],  // #C4860A âmbar
      'avancado':           [47,  62,  56]   // #2F3E38 IHB verde
    };
    const colProfile = profileColors[profile] || colAccent;

    const profileLabels = {
      'iniciante':          'Iniciante',
      'em-desenvolvimento': 'Em Desenvolvimento',
      'avancado':           'Avancado'
    };

    const clinicSizeLabels = {
      'small':  'Pequena (1-10 profissionais)',
      'medium': 'Media (11-30 profissionais)',
      'large':  'Grande (mais de 30 profissionais)'
    };

    const today = new Date().toLocaleDateString('pt-BR');
    const total = techScore + processScore;

    // Nome do arquivo usa o nome da clínica
    const safeClinic = (leadData.clinicName || 'Clinica')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove acentos
      .replace(/[^a-zA-Z0-9 _-]/g, '')
      .trim().replace(/\s+/g, '_');

    // ── HEADER ─────────────────────────────────────────────
    doc.setFillColor(...colPrimary);
    doc.rect(0, 0, pageW, 42, 'F');

    doc.setTextColor(...colWhite);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CLIMAT 2.0', margin, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Relatorio de Maturidade Operacional e Tecnologica', margin, 25);

    doc.setFontSize(9);
    doc.text('IHB Strategy  |  ihbstrategies.com', pageW - margin, 17, { align: 'right' });
    doc.text(today, pageW - margin, 25, { align: 'right' });

    // linha accent abaixo do header
    doc.setFillColor(...colAccent);
    doc.rect(0, 42, pageW, 2, 'F');

    let y = 54;

    // ── DADOS DA CLÍNICA ────────────────────────────────────
    doc.setTextColor(...colGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const infoLines = [
      leadData.clinicName  ? `Clinica: ${leadData.clinicName}`                              : null,
      leadData.userName    ? `Responsavel: ${leadData.userName}${leadData.userRole ? ' — ' + leadData.userRole : ''}` : null,
      leadData.clinicSize  ? `Porte: ${clinicSizeLabels[leadData.clinicSize] || leadData.clinicSize}` : null,
      leadData.specialty   ? `Especialidade: ${leadData.specialty}`                         : null,
    ].filter(Boolean);

    infoLines.forEach((line, i) => {
      doc.text(line, margin, y + i * 6);
    });
    y += infoLines.length * 6 + 10;

    // ── PROFILE BADGE ───────────────────────────────────────
    doc.setFillColor(...colProfile);
    doc.roundedRect(margin, y, contentW, 16, 3, 3, 'F');
    doc.setTextColor(...colWhite);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`Perfil: ${profileLabels[profile]}`, pageW / 2, y + 10.5, { align: 'center' });
    y += 24;

    // ── SCORES ──────────────────────────────────────────────
    doc.setTextColor(...colPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Score Total: ${total}/50`, margin, y);
    y += 8;

    // Tech bar
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...colGray);
    doc.text(`Tecnologia e Automações: ${techScore}/25`, margin, y);
    y += 4;
    doc.setFillColor(210, 210, 210);
    doc.roundedRect(margin, y, contentW, 5, 1, 1, 'F');
    doc.setFillColor(...colAccent);
    doc.roundedRect(margin, y, contentW * (techScore / 25), 5, 1, 1, 'F');
    y += 10;

    // Process bar
    doc.text(`Processos e Operações: ${processScore}/25`, margin, y);
    y += 4;
    doc.setFillColor(210, 210, 210);
    doc.roundedRect(margin, y, contentW, 5, 1, 1, 'F');
    doc.setFillColor(...colAccent);
    doc.roundedRect(margin, y, contentW * (processScore / 25), 5, 1, 1, 'F');
    y += 14;

    // Profile description
    doc.setTextColor(...colGray);
    doc.setFontSize(9);
    const descClean = data.description.replace(/[^\x00-\x7FÀ-ÿ .,!?:;()\-]/g, '').trim();
    const descLines = doc.splitTextToSize(descClean, contentW);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 10;

    // ── RECOMMENDATIONS ─────────────────────────────────────
    doc.setTextColor(...colPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Recomendações Personalizadas', margin, y);
    y += 7;

    data.recommendations.forEach((rec) => {
      const titleLines = doc.splitTextToSize(rec.title, contentW - 8);
      const textClean = rec.text.replace(/[^\x00-\x7FÀ-ÿ .,!?:;()\-]/g, '').trim();
      const textLines = doc.splitTextToSize(textClean, contentW - 8);
      const boxH = titleLines.length * 5 + textLines.length * 4.5 + 10;

      if (y + boxH > pageH - 60) { doc.addPage(); y = 20; }

      doc.setFillColor(...colBeige);
      doc.roundedRect(margin, y, contentW, boxH, 2, 2, 'F');

      doc.setTextColor(...colPrimary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(titleLines, margin + 5, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colGray);
      doc.setFontSize(8.5);
      doc.text(textLines, margin + 5, y + 7 + titleLines.length * 5);

      y += boxH + 4;
    });

    // ── CTA + QR CODE ────────────────────────────────────────
    if (y + 50 > pageH - 15) { doc.addPage(); y = 20; }
    y += 4;

    const siteUrl = 'https://www.ihbstrategies.com/pricing-saude.html';
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(siteUrl)}&color=ffffff&bgcolor=2F3E38&margin=1`;

    const ctaBoxH = 48;
    doc.setFillColor(...colPrimary);
    doc.roundedRect(margin, y, contentW, ctaBoxH, 3, 3, 'F');

    doc.setTextColor(...colWhite);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Pronto para evoluir?', margin + 5, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const ctaText = 'Fale com a IHB Strategy e descubra como acelerar a maturidade operacional do seu negócio de saúde.';
    const ctaLines = doc.splitTextToSize(ctaText, contentW - 48);
    doc.text(ctaLines, margin + 5, y + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Escaneie o QR Code para falar com a IHB', margin + 5, y + 38);

    // ── FOOTER ───────────────────────────────────────────────
    doc.setTextColor(160, 160, 160);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('IHB Strategy — Where insights become Healthcare impact  |  ihbstrategies.com', pageW / 2, pageH - 8, { align: 'center' });

    // ── QR CODE (async via imagem) ────────────────────────────
    function finalize(qrDataUrl) {
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', pageW - margin - 36, y + 6, 32, 32);
      }
      doc.save(`CLIMAT_IHB_${safeClinic}_${today.replace(/\//g, '-')}.pdf`);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        finalize(canvas.toDataURL('image/png'));
      } catch (e) {
        finalize(null); // CORS block — gera o PDF sem QR
      }
    };
    img.onerror = function () { finalize(null); };
    img.src = qrApiUrl;
  }

  // Botão de download — ativado após showResults()
  document.getElementById('btnDownloadPDF').addEventListener('click', function () {
    this.textContent = 'Gerando PDF...';
    this.disabled = true;
    const self = this;

    // Perfil lido do DOM já renderizado
    const label = (document.getElementById('profileLabel') || {}).textContent || '';
    let profile = 'iniciante';
    if (label.includes('Desenvolvimento')) profile = 'em-desenvolvimento';
    else if (label.includes('vancado'))    profile = 'avancado';

    const tech    = parseInt((document.getElementById('techScore')    || {}).textContent) || 0;
    const process = parseInt((document.getElementById('processScore') || {}).textContent) || 0;

    generatePDF(storedLeadData, tech, process, profile);
    setTimeout(() => { self.textContent = 'Baixar Relatório em PDF'; self.disabled = false; }, 2500);
  });

  // Botão "Iniciar Avaliação" — troca a tela do hero pelo formulário
  var btnIniciar = document.getElementById('btnIniciarClimat');
  if (btnIniciar) {
    btnIniciar.addEventListener('click', function () {
      var hero = document.querySelector('.climat-hero');
      var tool = document.getElementById('climatTool');
      if (hero) hero.hidden = true;
      if (tool) tool.hidden = false;
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }

  // Inicializa primeira seção sem scroll (página carrega na posição normal)
  showSection(0, false);
});
