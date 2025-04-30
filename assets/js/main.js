// Funções principais do site
document.addEventListener('DOMContentLoaded', function() {
    // Menu mobile toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
        });
    }
    
    // Smooth scroll para links de ancoragem
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Fecha o menu mobile se estiver aberto
                if (mobileMenuToggle && mobileMenuToggle.classList.contains('active')) {
                    mobileMenuToggle.classList.remove('active');
                    mainNav.classList.remove('active');
                }
                
                // Scroll suave
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Ajuste para o header fixo
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Controle do banner de cookies
    const cookieConsent = document.querySelector('.cookie-consent');
    const btnAccept = document.querySelector('.btn-accept');
    const btnDecline = document.querySelector('.btn-decline');
    
    // Verifica se o usuário já aceitou os cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    
    if (cookieConsent) {
        if (cookiesAccepted) {
            cookieConsent.style.display = 'none';
        } else {
            cookieConsent.style.display = 'flex';
            
            if (btnAccept) {
                btnAccept.addEventListener('click', function() {
                    localStorage.setItem('cookiesAccepted', 'true');
                    cookieConsent.style.display = 'none';
                });
            }
            
            if (btnDecline) {
                btnDecline.addEventListener('click', function() {
                    cookieConsent.style.display = 'none';
                });
            }
        }
    }
    
    // Formulário de contato
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        /*contactForm.addEventListener('submit', function(e) {
            e.preventDefault()
            
            // Simulação de envio de formulário
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
            
            // Simula uma requisição
            setTimeout(function() {
                submitButton.textContent = 'Mensagem Enviada!';
                
                // Registra conversão para Google Analytics
                if (typeof gtag === 'function') {
                    gtag('event', 'conversion', {
                        'send_to': 'G-XXXXXXXXXX/lead',
                        'event_category': 'contact',
                        'event_label': 'form_submission'
                    });
                }
                
                // Limpa o formulário
                contactForm.reset();
                
                // Restaura o botão após alguns segundos
                setTimeout(function() {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }, 3000);
            }, 1500);
        });
    }
    */
    // Formulário de newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulação de inscrição na newsletter
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            const emailInput = this.querySelector('input[type="email"]');
            
            submitButton.disabled = true;
            submitButton.textContent = 'Inscrevendo...';
            
            // Simula uma requisição
            setTimeout(function() {
                submitButton.textContent = 'Inscrito!';
                
                // Registra conversão para Google Analytics
                if (typeof gtag === 'function') {
                    gtag('event', 'conversion', {
                        'send_to': 'G-XXXXXXXXXX/newsletter',
                        'event_category': 'newsletter',
                        'event_label': 'subscription'
                    });
                }
                
                // Limpa o campo de email
                emailInput.value = '';
                
                // Restaura o botão após alguns segundos
                setTimeout(function() {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }, 3000);
            }, 1000);
        });
    }
    
    // Adiciona o ícone do WhatsApp
    const whatsappButton = document.createElement('a');
    whatsappButton.href = 'https://wa.me/5511930737730';
    whatsappButton.target = '_blank';
    whatsappButton.className = 'whatsapp-button';
    whatsappButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>';
    document.body.appendChild(whatsappButton);
    
    // Animação de scroll para elementos
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.service-item, .methodology-step, .about-content, .tool-content');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 100) {
                element.classList.add('animate');
            }
        });
    };
    
    // Adiciona classe para animação inicial
    document.querySelectorAll('.service-item, .methodology-step, .about-content, .tool-content').forEach(element => {
        element.classList.add('fade-in');
    });
    
    // Executa a animação no carregamento e no scroll
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
});
