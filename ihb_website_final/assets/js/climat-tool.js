// JavaScript for CLIMAT Tool

document.addEventListener('DOMContentLoaded', function() {
    // Form Navigation
    const formSections = document.querySelectorAll('.form-section');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const submitButton = document.querySelector('.submit-btn');
    
    // Next button functionality
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get current active section
            const currentSection = document.querySelector('.form-section.active');
            
            // Validate current section
            if (validateSection(currentSection)) {
                // Hide current section
                currentSection.classList.remove('active');
                
                // Show next section
                currentSection.nextElementSibling.classList.add('active');
                
                // Scroll to top
                window.scrollTo({
                    top: document.querySelector('.climat-form').offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Previous button functionality
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get current active section
            const currentSection = document.querySelector('.form-section.active');
            
            // Hide current section
            currentSection.classList.remove('active');
            
            // Show previous section
            currentSection.previousElementSibling.classList.add('active');
            
            // Scroll to top
            window.scrollTo({
                top: document.querySelector('.climat-form').offsetTop - 100,
                behavior: 'smooth'
            });
        });
    });
    
    // Submit button functionality
    if (submitButton) {
        submitButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get current active section
            const currentSection = document.querySelector('.form-section.active');
            
            // Validate current section
            if (validateSection(currentSection)) {
                // Calculate scores
                calculateScores();
                
                // Hide current section
                currentSection.classList.remove('active');
                
                // Show results section
                document.getElementById('results').classList.add('active');
                
                // Scroll to top
                window.scrollTo({
                    top: document.querySelector('.climat-form').offsetTop - 100,
                    behavior: 'smooth'
                });
                
                // Track completion in Google Analytics
                if (typeof gtag === 'function') {
                    gtag('event', 'climat_assessment_complete', {
                        'event_category': 'engagement',
                        'event_label': 'assessment_tool'
                    });
                }
            }
        });
    }
    
    // Download report button
    const downloadReportBtn = document.getElementById('downloadReport');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', function() {
            // Get form data
            const formData = new FormData(document.getElementById('climatForm'));
            const formDataObj = {};
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Simulate report request
            alert('Seu relatório será enviado para o e-mail informado em breve!');
            
            // Track report request in Google Analytics
            if (typeof gtag === 'function') {
                gtag('event', 'climat_report_request', {
                    'event_category': 'conversion',
                    'event_label': 'report_download'
                });
            }
        });
    }
    
    // Validation function
    function validateSection(section) {
        let isValid = true;
        
        // Get all required inputs in the section
        const requiredInputs = section.querySelectorAll('input[required], select[required]');
        
        // Check if all required fields are filled
        requiredInputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                input.classList.add('error');
                
                // Add error message if it doesn't exist
                let errorMsg = input.parentElement.querySelector('.error-message');
                if (!errorMsg) {
                    errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = 'Este campo é obrigatório';
                    input.parentElement.appendChild(errorMsg);
                }
            } else {
                input.classList.remove('error');
                
                // Remove error message if it exists
                const errorMsg = input.parentElement.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }
        });
        
        // Check if all radio button groups have a selection
        const radioGroups = {};
        section.querySelectorAll('input[type="radio"]').forEach(radio => {
            radioGroups[radio.name] = true;
        });
        
        for (const groupName in radioGroups) {
            const checkedRadio = section.querySelector(`input[name="${groupName}"]:checked`);
            if (!checkedRadio) {
                isValid = false;
                
                // Find the question group
                const questionGroup = section.querySelector(`.question-group:has(input[name="${groupName}"])`);
                if (questionGroup) {
                    questionGroup.classList.add('error');
                    
                    // Add error message if it doesn't exist
                    let errorMsg = questionGroup.querySelector('.error-message');
                    if (!errorMsg) {
                        errorMsg = document.createElement('div');
                        errorMsg.className = 'error-message';
                        errorMsg.textContent = 'Por favor, selecione uma opção';
                        questionGroup.appendChild(errorMsg);
                    }
                }
            } else {
                // Find the question group
                const questionGroup = section.querySelector(`.question-group:has(input[name="${groupName}"])`);
                if (questionGroup) {
                    questionGroup.classList.remove('error');
                    
                    // Remove error message if it exists
                    const errorMsg = questionGroup.querySelector('.error-message');
                    if (errorMsg) {
                        errorMsg.remove();
                    }
                }
            }
        }
        
        return isValid;
    }
    
    // Calculate scores function
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
        
        // Update UI
        document.getElementById('techScore').style.width = `${techPercent}%`;
        document.getElementById('techScore').textContent = `${techPercent}%`;
        
        document.getElementById('procScore').style.width = `${procPercent}%`;
        document.getElementById('procScore').textContent = `${procPercent}%`;
        
        document.getElementById('totalScore').textContent = `${totalPercent}%`;
        
        // Determine category
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
        
        // Generate recommendations
        generateRecommendations(techScores, procScores);
    }
    
    // Generate recommendations function
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
        
        // Process recommendations
        if (procScores[0] <= 3) {
            recommendations.push({
                title: "Estruturação de KPIs",
                description: "Defina indicadores-chave de desempenho alinhados aos objetivos estratégicos do negócio e implemente um sistema de monitoramento regular."
            });
        }
        
        if (procScores[1] <= 2) {
            recommendations.push({
                title: "Padronização de Processos",
                description: "Documente e padronize os principais processos operacionais para garantir consistência, qualidade e facilitar o treinamento de novos colaboradores."
            });
        }
        
        if (procScores[2] <= 3 || procScores[3] <= 3) {
            recommendations.push({
                title: "Estratégia de Marketing Digital",
                description: "Desenvolva uma estratégia de marketing digital estruturada, com funil de conversão bem definido e métricas para acompanhamento de resultados."
            });
        }
        
        // Limit to 3 recommendations
        recommendations.splice(3);
        
        // Update recommendations UI
        const recommendationsHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
            </div>
        `).join('');
        
        document.getElementById('recommendations').innerHTML = recommendationsHTML;
    }
});
