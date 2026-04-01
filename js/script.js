document.addEventListener('DOMContentLoaded', () => {
    // 1. Core Variables & Lerp Math
    const lerp = (start, end, factor) => start + (end - start) * factor;
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let scrollY = window.scrollY;
    let targetScrollY = window.scrollY;

    const cursorEl = document.getElementById('custom-cursor');
    const cursorGlow = document.getElementById('cursor-glow-field');
    const bgGrid = document.getElementById('bg-grid');

    // Interaction Elements
    const magnetics = document.querySelectorAll('.magnetic');
    const interactives = document.querySelectorAll('a, button, input, textarea, .interactive-card');
    const parallaxElements = document.querySelectorAll('.mouse-parallax');
    const tiltCards = document.querySelectorAll('.interactive-card');

    // 2. Global Mouse Tracking
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        document.documentElement.style.setProperty('--mouse-x', `${mouse.x}px`);
        document.documentElement.style.setProperty('--mouse-y', `${mouse.y}px`);
    });

    window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY;
        document.body.classList.add('is-scrolling');
        clearTimeout(window.scrollTimeout);
        window.scrollTimeout = setTimeout(() => {
            document.body.classList.remove('is-scrolling');
        }, 150);
    });

    // 3. Main Render Loop (60fps Engine)
    const render = () => {
        cursor.x = lerp(cursor.x, mouse.x, 0.2);
        cursor.y = lerp(cursor.y, mouse.y, 0.2);

        if (cursorEl) cursorEl.style.transform = `translate(${cursor.x}px, ${cursor.y}px)`;
        if (cursorGlow) cursorGlow.style.transform = `translate(${cursor.x}px, ${cursor.y}px)`;

        // Scroll Velocity Logic - Faster scroll = stronger shift
        scrollY = lerp(scrollY, targetScrollY, 0.1);
        const velocity = targetScrollY - scrollY;
        const dynamicMultiplier = 1 + (Math.abs(velocity) * 0.02); // Adjusts strength based on speed

        if (bgGrid) bgGrid.style.transform = `translateY(${velocity * -0.3}px) scale(${1 + (Math.abs(velocity) * 0.0005)})`;

        // Parallax Ambient Orbs based on scroll
        const orb1 = document.getElementById('orb-1');
        const orb2 = document.getElementById('orb-2');
        if (orb1) orb1.style.transform = `translateY(${scrollY * 0.15}px)`;
        if (orb2) orb2.style.transform = `translateY(${scrollY * -0.1}px)`;

        parallaxElements.forEach(el => {
            const baseSpeed = el.getAttribute('data-speed') || 0.05;
            const speed = baseSpeed * dynamicMultiplier;
            const x = (window.innerWidth / 2 - cursor.x) * speed;
            const y = (window.innerHeight / 2 - cursor.y) * speed;
            el.style.transform = `translate(${x}px, ${y}px) rotate(12deg)`;
        });

        requestAnimationFrame(render);
    };

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(render);
    }

    // 4. Magnetic Buttons
    magnetics.forEach(btn => {
        btn.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;

            this.style.transform = `translate(${deltaX * 0.2}px, ${deltaY * 0.2}px) scale(1.02)`;
        });

        btn.addEventListener('mouseleave', function () {
            this.style.transform = `translate(0px, 0px) scale(1)`;
        });
    });

    // 5. Cursor States
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (cursorEl) cursorEl.classList.add('interactive');
        });
        el.addEventListener('mouseleave', () => {
            if (cursorEl) cursorEl.classList.remove('interactive');
        });
    });

    // 6. 3D Tilt Cards & Inner Parallax
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.style.setProperty('--card-mouse-x', `${x}px`);
            this.style.setProperty('--card-mouse-y', `${y}px`);

            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;
                this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

                // Inner Content Slight Parallax Shift
                const inner = this.querySelector('.card-inner');
                if (inner) {
                    inner.style.transform = `translate(${(x - centerX) * 0.03}px, ${(y - centerY) * 0.03}px)`;
                }
            }
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            const inner = this.querySelector('.card-inner');
            if (inner) inner.style.transform = `translate(0px, 0px)`;
        });
    });

    // 7. Intersection Observers (Reveals, Focus, Lines, Stats)
    const observerOptions = { root: null, rootMargin: '-10% 0px', threshold: 0.15 };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Staggered Reveals
                if (entry.target.classList.contains('reveal-element')) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }

                // Animated Dividers
                if (entry.target.classList.contains('divider-line')) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }

                // Stat Counters
                if (entry.target.classList.contains('stat-number')) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute('data-target'));
                    let count = 0;
                    const duration = 2000;
                    const increment = target / (duration / 16);

                    const updateCount = () => {
                        count += increment;
                        if (count < target) {
                            el.innerText = Math.ceil(count);
                            requestAnimationFrame(updateCount);
                        } else {
                            el.innerText = target;
                            // Subtle glow on finish based on parent group hover colors
                            el.parentElement.style.textShadow = "0 0 15px rgba(255,255,255,0.3)";
                        }
                    };
                    updateCount();
                    observer.unobserve(entry.target);
                }

                // Handle Section Focus Dimming
                if (entry.target.classList.contains('focus-section')) {
                    document.querySelectorAll('.focus-section').forEach(sec => sec.classList.remove('focus-active'));
                    entry.target.classList.add('focus-active');
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-element, .focus-section, .divider-line, .stat-number').forEach(el => {
        observer.observe(el);
    });

    const firstSection = document.querySelector('.focus-section');
    if (firstSection) firstSection.classList.add('focus-active');

    // 8. Testimonial Carousel Logic
    const testimonials = document.querySelectorAll('.testimonial-slide');
    if (testimonials.length > 0) {
        let currentTestimonial = 0;
        setInterval(() => {
            testimonials[currentTestimonial].classList.remove('opacity-100', 'scale-100');
            testimonials[currentTestimonial].classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            testimonials[currentTestimonial].classList.add('opacity-100', 'scale-100');
            testimonials[currentTestimonial].classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        }, 5000);
    }

    // 9. FAQ Accordion Logic
    document.querySelectorAll('.faq-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.nextElementSibling;
            const icon = btn.querySelector('.faq-icon');

            const isOpen = !content.classList.contains('max-h-0');

            // Close all others
            document.querySelectorAll('.faq-content').forEach(c => {
                c.classList.add('max-h-0', 'opacity-0');
                c.classList.remove('max-h-40', 'opacity-100');
            });
            document.querySelectorAll('.faq-icon').forEach(i => i.classList.remove('rotate-45'));

            // Toggle current
            if (!isOpen) {
                content.classList.remove('max-h-0', 'opacity-0');
                content.classList.add('max-h-40', 'opacity-100');
                icon.classList.add('rotate-45');
            }
        });
    });

    // 10. Advanced Form Experience
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = document.getElementById('submit-btn');
            const btnText = document.getElementById('btn-text');
            const btnIcon = document.getElementById('btn-icon');
            const header = document.getElementById('form-header');
            const successDiv = document.getElementById('form-success');

            btn.classList.add('pointer-events-none');
            btnText.textContent = "Establishing Connection...";
            btnIcon.setAttribute('icon', 'solar:refresh-circle-linear');
            btnIcon.classList.add('animate-spin-slow');

            setTimeout(() => {
                form.classList.add('form-fade-out');
                header.classList.add('form-fade-out');

                setTimeout(() => {
                    successDiv.classList.add('success-fade-in');
                }, 400);

            }, 1800);
        });
    }
});
