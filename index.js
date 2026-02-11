// Construction Modal Functions
        function openConstructionModal() {
            document.getElementById('constructionModal').classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }

        function closeConstructionModal() {
            document.getElementById('constructionModal').classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }

        // Close modal on outside click
        document.getElementById('constructionModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeConstructionModal();
            }
        });

        // Investment Calculator (tasa anual)
        function calculateReturn() {
            const amount = parseFloat(document.getElementById('investAmount').value);
            const period = parseInt(document.getElementById('investPeriod').value);
            const annualRate = parseFloat(document.getElementById('investRate').value);

            if (!amount || !period || amount < 0 || period < 1) {
                return;
            }

            // Convertir tasa anual a mensual
            const monthlyRate = annualRate / 100 / 12;
            const totalAmount = amount * Math.pow(1 + monthlyRate, period);
            const earnings = totalAmount - amount;

            const formatter = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            });

            document.getElementById('totalEarnings').textContent = formatter.format(earnings);
            document.getElementById('totalAmount').textContent = formatter.format(totalAmount);
            document.getElementById('calculatorResult').classList.add('active');
        }

        document.getElementById('investAmount').addEventListener('input', calculateReturn);
        document.getElementById('investPeriod').addEventListener('input', calculateReturn);
        document.getElementById('investRate').addEventListener('change', calculateReturn);
        window.addEventListener('load', calculateReturn);

        // FAQ Toggle
        function toggleFAQ(element) {
            const faqItem = element.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                faqItem.classList.add('active');
            }
        }

        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });