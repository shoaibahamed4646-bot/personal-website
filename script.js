// script.js
// Client-side interactions for Shoaib Mahin's portfolio

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });

        // Close mobile menu when a navigation link is clicked
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
            });
        });
    }

    // 2. Scroll Spy - Active Navigation Link
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('nav.main-nav ul li a');

    function highlightNavigation() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            // If scrolled past the top of the section (offset by header height)
            if (scrollPosition >= (sectionTop - 150)) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSectionId}`) {
                item.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation(); // Run once initially

    // 3. Static Contact Form Submission via Web3Forms
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (contactForm && formMessage) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Clear previous states
            formMessage.style.display = 'none';
            formMessage.className = 'form-message';
            formMessage.textContent = 'Sending message...';
            formMessage.style.display = 'block';

            const formData = new FormData(contactForm);
            
            // Check if access_key is filled, warn if it's still the default placeholder
            const accessKey = formData.get('access_key');
            if (accessKey === 'YOUR_ACCESS_KEY_HERE') {
                formMessage.className = 'form-message error';
                formMessage.textContent = 'Please configure your Web3Forms Access Key in index.html first!';
                return;
            }

            // Convert form data to JSON
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
            .then(async (response) => {
                let res = await response.json();
                if (response.status === 200) {
                    formMessage.className = 'form-message success';
                    formMessage.textContent = 'Thank you! Your message has been sent successfully.';
                    contactForm.reset();
                } else {
                    console.error(response);
                    formMessage.className = 'form-message error';
                    formMessage.textContent = res.message || 'Something went wrong. Please try again.';
                }
            })
            .catch(error => {
                console.error(error);
                formMessage.className = 'form-message error';
                formMessage.textContent = 'Server connection failed. Please check your internet connection.';
            });
        });
    }
});
