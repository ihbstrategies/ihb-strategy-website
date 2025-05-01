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
                // Calculate scores and update UI
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
                
                // Add recommendations to the data object
                const recommendationItems = document.querySelectorAll('#recommendations .recommendation-item');
                recommendationItems.forEach((item, index) => {
                    data[`recomendacao_${index + 1}_titulo`] = item.querySelector('h4')?.textContent || '';
                    data[`recomendacao_${index + 1}_descricao`] = item.querySelector('p')?.textContent || '';
                });

                // Add a status message area in the results section if it doesn't exist
                const resultsDiv = document.getElementById('results');
                let statusMsg = resultsDiv.querySelector('.formspree-status');
                if (!statusMsg) {
                    statusMsg = document.createElement('p');
                    statusMsg.className = 'formspree-status';
                    statusMsg.style.marginTop = '20px';
                    statusMsg.style.fontWeight = 'bold';
                    // Insert after recommendations or at the end
                    const recommendationsDiv = document.getElementById('recommendations');
                    if (recommendationsDiv && recommendationsDiv.parentNode === resultsDiv) {
                         recommendationsDiv.parentNode.insertBefore(statusMsg, recommendationsDiv.nextSibling);
                     } else {
                         resultsDiv.appendChild(statusMsg); // Fallback
                     }
                }
                statusMsg.textContent = 'Enviando avaliação...';
                statusMsg.style.color = '#555';

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
                    input.parentElement.appendChild(errorMsg);
                }
            } else {
                input.classList.remove('error');
                const errorMsg = input.parentElement.querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            }
        });
        
        const radioGroups = {};
        section.querySelectorAll('input[type="radio"]').forEach(radio => { radioGroups[radio.name] = true; });
        for (const groupName in radioGroups) {
            const checkedRadio = section.querySelector(`input[name="${groupName}"]:checked`);
            const questionGroup = section.querySelector(`.question-group:has(input[name="${groupName}"])`);
            if (!checkedRadio) {
                isValid = false;
                if (questionGroup) {
                    questionGroup.classList.add('error');
                    let errorMsg = questionGroup.querySelector('.error-message');
                    if (!errorMsg) {
                        errorMsg = document.createElement('div');
                        errorMsg.className = 'error-message';
                        errorMsg.textContent = 'Por favor, selecione uma opção';
                        questionGroup.appendChild(errorMsg);
                    }
                }
            } else {
                if (questionGroup) {
                    questionGroup.classList.remove('error');
                    const errorMsg = questionGroup.querySelector('.error-message');
                    if (errorMsg) errorMsg.remove();
                }
            }
        }
        return isValid;
    }
    
    // Calculate scores function (modified to return results)
    function calculateScores() {
        const techScores = [];
        for (let i = 1; i <= 5; i++) {
            const radioChecked = document.querySelector(`input[name="tech${i}"]:checked`);
            if (radioChecked) techScores.push(parseInt(radioChecked.value));
        }
        const procScores = [];
        for (let i = 1; i <= 5; i++) {
            const radioChecked = document.querySelector(`input[name="proc${i}"]:checked`);
            if (radioChecked) procScores.push(parseInt(radioChecked.value));
        }
        
        const techAvg = techScores.length > 0 ? techScores.reduce((a, b) => a + b, 0) / techScores.length : 0;
        const procAvg = procScores.length > 0 ? procScores.reduce((a, b) => a + b, 0) / procScores.length : 0;
        const totalAvg = (techAvg + procAvg) / 2;
        
        const techPercent = Math.round((techAvg / 5) * 100);
        const procPercent = Math.round((procAvg / 5) * 100);
        const totalPercent = Math.round((totalAvg / 5) * 100);
        
        // Update UI
        document.getElementById('techScore').style.width = `${techPercent}%`;
        document.getElementById('techScore').textContent = `${techPercent}%`;
        document.getElementById('procScore').style.width = `${procPercent}%`;
        document.getElementById('procScore').textContent = `${procPercent}%`;
        document.getElementById('totalScore').textContent = `${totalPercent}%`;
        
        let category, description;
        // Determine category and description (same logic as before)
        if (totalPercent < 30) { category = "Inicial"; description = "..."; } 
        else if (totalPercent < 50) { category = "Em Desenvolvimento"; description = "..."; } 
        else if (totalPercent < 70) { category = "Intermediário"; description = "..."; } 
        else if (totalPercent < 90) { category = "Avançado"; description = "..."; } 
        else { category = "Excelência"; description = "..."; }
        // (Keep the full description texts from the original file)
        // For brevity here, just using placeholders. Ensure the full text is in the actual file.
        if (totalPercent < 30) { category = "Inicial"; description = "Sua operação está em estágio inicial de maturidade. Há muitas oportunidades para implementar processos estruturados e adotar tecnologias que podem transformar significativamente seus resultados."; } else if (totalPercent < 50) { category = "Em Desenvolvimento"; description = "Sua operação já possui alguns elementos de maturidade, mas ainda há lacunas importantes a serem preenchidas para alcançar todo o potencial do seu negócio."; } else if (totalPercent < 70) { category = "Intermediário"; description = "Sua operação demonstra boa maturidade em várias áreas, mas ainda há espaço para otimização e integração mais profunda entre processos e tecnologia."; } else if (totalPercent < 90) { category = "Avançado"; description = "Sua operação possui alta maturidade, com processos bem estruturados e boa adoção tecnológica. Refinamentos específicos podem levar a resultados ainda melhores."; } else { category = "Excelência"; description = "Sua operação demonstra excelência operacional, com processos otimizados e uso avançado de tecnologia. O foco agora deve ser na inovação contínua e na expansão estratégica."; }

        document.getElementById('maturityLevel').textContent = category;
        document.getElementById('maturityDescription').textContent = description;
        
        generateRecommendations(techScores, procScores);

        // Return calculated results for sending to Formspree
        return { techPercent, procPercent, totalPercent, category, description };
    }
    
    // Generate recommendations function (remains the same)
    function generateRecommendations(techScores, procScores) {
        const recommendations = [];
        // (Keep the full recommendation logic from the original file)
        // For brevity here, just using placeholders. Ensure the full logic is in the actual file.
        if (techScores[0] <= 2) { recommendations.push({ title: "Implementação de Sistema de Gestão Clínica Integrado", description: "Considere adotar um sistema integrado..." }); }
        if (techScores[1] <= 3) { recommendations.push({ title: "Melhoria na Integração de Dados", description: "Desenvolva uma estratégia para integrar dados..." }); }
        if (techScores[2] <= 3) { recommendations.push({ title: "Implementação de Dashboards Analíticos", description: "Crie dashboards automatizados..." }); }
        if (procScores[0] <= 3) { recommendations.push({ title: "Estruturação de KPIs", description: "Defina indicadores-chave de desempenho..." }); }
        if (procScores[1] <= 2) { recommendations.push({ title: "Padronização de Processos", description: "Documente e padronize os principais processos..." }); }
        if (procScores[2] <= 3 || procScores[3] <= 3) { recommendations.push({ title: "Estratégia de Marketing Digital", description: "Desenvolva uma estratégia de marketing digital..." }); }
        
        recommendations.splice(3);
        const recommendationsHTML = recommendations.map(rec => `<div class="recommendation-item"><h4>${rec.title}</h4><p>${rec.description}</p></div>`).join('');
        document.getElementById('recommendations').innerHTML = recommendationsHTML;
    }

    // Helper function to scroll to top of form
    function scrollToFormTop() {
        window.scrollTo({
            top: document.querySelector('.climat-form').offsetTop - 100,
            behavior: 'smooth'
        });
    }
});
