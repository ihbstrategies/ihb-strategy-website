// JavaScript for CLIMAT Tool

document.addEventListener('DOMContentLoaded', function() {
    // Form Navigation
    const formSections = document.querySelectorAll('.form-section');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const submitButton = document.querySelector('.submit-btn');
    const climatForm = document.getElementById('climatForm'); // Get form element

    // Next button functionality
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentSection = document.querySelector('.form-section.active');
            if (validateSection(currentSection)) {
                currentSection.classList.remove('active');
                currentSection.nextElementSibling.classList.add('active');
                scrollToFormTop();
            }
        });
    });

    // Previous button functionality
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentSection = document.querySelector('.form-section.active');
            currentSection.classList.remove('active');
            currentSection.previousElementSibling.classList.add('active');
            scrollToFormTop();
        });
    });

    // Submit button functionality
    if (submitButton && climatForm) {
        submitButton.addEventListener('click', function(e) {
            e.preventDefault(); // Keep preventing default submission

            const currentSection = document.querySelector('.form-section.active');

            if (validateSection(currentSection)) {
                // Calculate scores and update UI based on OLD JS logic
                const results = calculateScores(); // Get calculated results

                // Hide current section and show results section
                currentSection.classList.remove('active');
                document.getElementById('results').classList.add('active');
                scrollToFormTop();

                // Track completion in Google Analytics
                if (typeof gtag === 'function') {
                    gtag('event', 'climat_assessment_complete', {
                        'event_category': 'engagement',
                        'event_label': 'assessment_tool'
                    });
                }

                // --- Send data to Formspree using Fetch --- 
                const formAction = climatForm.action; // Get endpoint URL from form
                const formData = new FormData(climatForm);
                const data = {};
                formData.forEach((value, key) => {
                    data[key] = value;
                });

                // Add calculated results to the data object
                data['resultado_pontuacao_tecnologia'] = results.techPercent + '%';
                data['resultado_pontuacao_processos'] = results.procPercent + '%';
                data['resultado_pontuacao_total'] = results.totalPercent + '%';
                data['resultado_categoria'] = results.category;
                data['resultado_descricao_categoria'] = results.description;

                // Add recommendations to the data object (using the generated HTML)
                const recommendationsDiv = document.getElementById('recommendationList');
                if (recommendationsDiv) {
                    const recommendationItems = recommendationsDiv.querySelectorAll('.recommendation-item');
                    recommendationItems.forEach((item, index) => {
                        data[`recomendacao_${index + 1}_titulo`] = item.querySelector('h4')?.textContent || '';
                        data[`recomendacao_${index + 1}_descricao`] = item.querySelector('p')?.textContent || '';
                    });
                }

                // Add a status message area in the results section
                const resultsDiv = document.getElementById('results');
                let statusMsg = resultsDiv.querySelector('.formspree-status');
                if (!statusMsg) {
                    statusMsg = document.createElement('div'); // Changed to div for better styling
                    statusMsg.className = 'formspree-status';
                    // Insert after recommendations or at the end
                    const recommendationsContainer = resultsDiv.querySelector('.recommendations'); // Find the container
                    if (recommendationsContainer) {
                         recommendationsContainer.parentNode.insertBefore(statusMsg, recommendationsContainer.nextSibling);
                     } else {
                         resultsDiv.appendChild(statusMsg); // Fallback
                     }
                }
                statusMsg.textContent = 'Enviando avaliação...';
                statusMsg.style.color = '#555'; // Neutral color

                // Send data using fetch
                fetch(formAction, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    if (response.ok) {
                        console.log('Dados do CLIMAT enviados com sucesso para o Formspree!');
                        statusMsg.textContent = 'Avaliação enviada com sucesso!';
                        statusMsg.style.color = 'green';
                    } else {
                        response.json().then(data => {
                            console.error('Erro ao enviar dados do CLIMAT para o Formspree:', data);
                            statusMsg.textContent = 'Erro ao enviar avaliação. Tente novamente mais tarde.';
                            statusMsg.style.color = 'red';
                        }).catch(error => {
                             console.error('Erro ao processar resposta de erro do Formspree:', error);
                             statusMsg.textContent = 'Erro ao enviar avaliação. Resposta inválida do servidor.';
                             statusMsg.style.color = 'red';
                        });
                    }
                }).catch(error => {
                    console.error('Erro de rede ao enviar dados do CLIMAT para o Formspree:', error);
                    statusMsg.textContent = 'Erro de rede ao enviar avaliação. Verifique sua conexão.';
                    statusMsg.style.color = 'red';
                });
            }
        });
    }

    // Download report button (remains the same, just simulates)
    const downloadReportBtn = document.getElementById('downloadReport');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', function() {
            alert('Seu relatório será enviado para o e-mail informado em breve!');
            if (typeof gtag === 'function') {
                gtag('event', 'climat_report_request', {
                    'event_category': 'conversion',
                    'event_label': 'report_download'
                });
            }
        });
    }

    // Validation function (remains the same)
    function validateSection(section) {
        let isValid = true;
        // Clear previous errors within the section
        section.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        section.querySelectorAll('.error-message').forEach(el => el.remove());

        const requiredInputs = section.querySelectorAll('input[required], select[required]');
        requiredInputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                input.classList.add('error');
                let errorMsg = input.parentElement.querySelector('.error-message');
                if (!errorMsg) {
                    errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = 'Este campo é obrigatório';
                    // Insert after the input/select element
                    input.parentNode.insertBefore(errorMsg, input.nextSibling);
                }
            }
        });

        const radioGroups = {};
        section.querySelectorAll('input[type="radio"]').forEach(radio => { radioGroups[radio.name] = true; });
        for (const groupName in radioGroups) {
            const checkedRadio = section.querySelector(`input[name="${groupName}"]:checked`);
            // Find the question group containing the radio buttons
            const questionGroup = section.querySelector(`input[name="${groupName}"]`)?.closest('.question-group');
            if (!checkedRadio) {
                isValid = false;
                if (questionGroup) {
                    questionGroup.classList.add('error'); // Add error class to the group
                    let errorMsg = questionGroup.querySelector('.error-message');
                    if (!errorMsg) {
                        errorMsg = document.createElement('div');
                        errorMsg.className = 'error-message';
                        errorMsg.textContent = 'Por favor, selecione uma opção';
                        // Append error message at the end of the question group
                        questionGroup.appendChild(errorMsg);
                    }
                }
            }
        }
        return isValid;
    }

    // Calculate scores function (Merged: UI updates from OLD, returns results for AJAX)
    function calculateScores() {
        // Get all tech scores
        const techScores = [];
        for (let i = 1; i <= 5; i++) {
            const radioChecked = document.querySelector(`input[name="tech${i}"]:checked`);
            if (radioChecked) {
                techScores.push(parseInt(radioChecked.value));
            }
        }

        // Get all process scores
        const procScores = [];
        for (let i = 1; i <= 5; i++) {
            const radioChecked = document.querySelector(`input[name="proc${i}"]:checked`);
            if (radioChecked) {
                procScores.push(parseInt(radioChecked.value));
            }
        }

        // Calculate average scores
        const techAvg = techScores.length > 0 ? techScores.reduce((a, b) => a + b, 0) / techScores.length : 0;
        const procAvg = procScores.length > 0 ? procScores.reduce((a, b) => a + b, 0) / procScores.length : 0;
        const totalAvg = (techAvg + procAvg) / 2;

        // Convert to percentages
        const techPercent = Math.round((techAvg / 5) * 100);
        const procPercent = Math.round((procAvg / 5) * 100);
        const totalPercent = Math.round((totalAvg / 5) * 100);

        // Update UI (Using IDs from climat.html and old CSS structure)
        const techScoreEl = document.getElementById('techScore');
        if (techScoreEl) {
            techScoreEl.style.width = `${techPercent}%`;
            techScoreEl.textContent = `${techPercent}%`;
        }
        const procScoreEl = document.getElementById('procScore');
        if (procScoreEl) {
            procScoreEl.style.width = `${procPercent}%`;
            procScoreEl.textContent = `${procPercent}%`;
        }
        const totalScoreEl = document.getElementById('totalScore');
        if (totalScoreEl) {
            totalScoreEl.textContent = `${totalPercent}%`;
        }

        // Determine category and description (Using full text from OLD JS)
        let category, description;
        if (totalPercent < 30) {
            category = "Inicial";
            description = "Sua operação está em estágio inicial de maturidade. Há muitas oportunidades para implementar processos estruturados e adotar tecnologias que podem transformar significativamente seus resultados.";
        } else if (totalPercent < 50) {
            category = "Em Desenvolvimento";
            description = "Sua operação já possui alguns elementos de maturidade, mas ainda há lacunas importantes a serem preenchidas para alcançar todo o potencial do seu negócio.";
        } else if (totalPercent < 70) {
            category = "Intermediário";
            description = "Sua operação demonstra boa maturidade em várias áreas, mas ainda há espaço para otimização e integração mais profunda entre processos e tecnologia.";
        } else if (totalPercent < 90) {
            category = "Avançado";
            description = "Sua operação possui alta maturidade, com processos bem estruturados e boa adoção tecnológica. Refinamentos específicos podem levar a resultados ainda melhores.";
        } else {
            category = "Excelência";
            description = "Sua operação demonstra excelência operacional, com processos otimizados e uso avançado de tecnologia. O foco agora deve ser na inovação contínua e na expansão estratégica.";
        }

         // Update category
         document.getElementById('resultCategory').innerHTML = `
         <h3>Categoria: ${category}</h3>
         <p>${description}</p>
     `;

        // Generate and display recommendations (Using logic from OLD JS)
        generateRecommendations(techScores, procScores);

        // Return calculated results for sending to Formspree
        return { techPercent, procPercent, totalPercent, category, description };
    }

    // Generate recommendations function (Using full logic from OLD JS)
    function generateRecommendations(techScores, procScores) {
        const recommendations = [];

        // Tech recommendations
        if (techScores[0] <= 2) {
            recommendations.push({
                title: "Implementação de Sistema de Gestão Clínica Integrado",
                description: "Considere adotar um sistema integrado que combine agendamento, prontuário eletrônico e faturamento para eliminar processos manuais e reduzir erros."
            });
        }
        if (techScores[1] <= 3) {
            recommendations.push({
                title: "Melhoria na Integração de Dados",
                description: "Desenvolva uma estratégia para integrar dados entre diferentes sistemas, eliminando silos de informação e permitindo uma visão holística da operação."
            });
        }
        if (techScores[2] <= 3) {
            recommendations.push({
                title: "Implementação de Dashboards Analíticos",
                description: "Crie dashboards automatizados com KPIs relevantes para monitorar o desempenho do negócio em tempo real e facilitar a tomada de decisões baseadas em dados."
            });
        }
        // Added missing tech recommendations from old JS if needed (assuming 5 tech questions)
        if (techScores.length > 3 && techScores[3] <= 3) { // Example: Check 4th tech score
             recommendations.push({
                 title: "Otimização da Automação de Processos",
                 description: "Identifique processos manuais críticos e avalie ferramentas para automatizá-los, como confirmação de consultas ou comunicação com pacientes."
             });
        }
         if (techScores.length > 4 && techScores[4] <= 2) { // Example: Check 5th tech score
             recommendations.push({
                 title: "Exploração de Tecnologias Avançadas",
                 description: "Comece a explorar o potencial de tecnologias como telemedicina, IA para suporte diagnóstico ou análise preditiva para otimizar a gestão."
             });
        }

        // Process recommendations
        if (procScores[0] <= 3) {
            recommendations.push({
                title: "Estruturação de KPIs e Metas",
                description: "Defina indicadores-chave de desempenho (KPIs) claros e mensuráveis para as áreas críticas do negócio e estabeleça metas realistas."
            });
        }
        if (procScores[1] <= 2) {
            recommendations.push({
                title: "Padronização e Documentação de Processos",
                description: "Mapeie, documente e padronize os principais processos operacionais (agendamento, atendimento, faturamento) para garantir consistência e eficiência."
            });
        }
        if (procScores[2] <= 3) { // Assuming proc3 relates to patient journey
             recommendations.push({
                 title: "Melhoria da Jornada do Paciente",
                 description: "Mapeie a jornada do paciente e identifique pontos de atrito. Implemente melhorias na comunicação, agendamento e experiência geral."
             });
        }
        if (procScores.length > 3 && procScores[3] <= 3) { // Assuming proc4 relates to marketing
            recommendations.push({
                title: "Desenvolvimento de Estratégia de Marketing",
                description: "Crie uma estratégia de marketing digital focada na atração e conversão de pacientes, utilizando canais adequados e mensurando resultados."
            });
        }
         if (procScores.length > 4 && procScores[4] <= 3) { // Assuming proc5 relates to team management
             recommendations.push({
                 title: "Gestão e Desenvolvimento de Equipe",
                 description: "Invista em treinamento, defina papéis e responsabilidades claras e crie um ambiente de trabalho positivo para engajar e reter talentos."
             });
        }

        // Shuffle and limit to 3 recommendations
        // Shuffle array
        for (let i = recommendations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [recommendations[i], recommendations[j]] = [recommendations[j], recommendations[i]];
        }
        recommendations.splice(3);

        // Update recommendations UI (Using ID from climat.html)
        const recommendationsHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
            </div>
        `).join('');

        const recommendationsDiv = document.getElementById('recommendationList');
        if (recommendationsDiv) {
            recommendationsDiv.innerHTML = recommendationsHTML;
        } else {
             console.warn("Element with ID 'recommendationList' not found in HTML. Recommendations not displayed.");
        }
    }

    // Helper function to scroll to top of form
    function scrollToFormTop() {
        const formTop = document.querySelector('.climat-form')?.offsetTop;
        if (formTop !== undefined) {
             window.scrollTo({
                 top: formTop - 100, // Adjust offset as needed
                 behavior: 'smooth'
             });
        }
    }
});

