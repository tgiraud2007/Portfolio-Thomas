/* ==========================================================================
   THOMAS GIRAUD - PORTFOLIO INTERACTION LOGIC (script.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    
    /* --- 1. LOCAL STORAGE SITE SETTINGS & THEME --- */
    const settings = {
        smoothScroll: true,
        customCursor: true,
        theme: "light" // "light", "dark", "system"
    };

    // Input elements declarations (hoisted out of Temporal Dead Zone)
    const smoothScrollCheck = document.getElementById("setting-smooth-scroll");
    const customCursorCheck = document.getElementById("setting-custom-cursor");

    // Hoist custom cursor elements out of Temporal Dead Zone
    const cursor = document.getElementById("custom-cursor");
    const cursorRing = document.getElementById("custom-cursor-ring");

    // Load saved preferences
    if (localStorage.getItem("tg_portfolio_settings")) {
        try {
            const saved = JSON.parse(localStorage.getItem("tg_portfolio_settings"));
            Object.assign(settings, saved);
        } catch (e) {
            console.error("Error loading settings:", e);
        }
    }

    // Apply settings on boot
    applyTheme(settings.theme);
    updateSettingsForm();
    applyCursorVisibility();
    applyScrollBehavior();

    /* --- 2. THEME MANAGER --- */
    function applyTheme(themeName) {
        settings.theme = themeName;
        const html = document.documentElement;
        
        if (themeName === "system") {
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            html.setAttribute("data-theme", isDark ? "dark" : "light");
        } else {
            html.setAttribute("data-theme", themeName);
        }
        
        // Update active class in settings modal buttons
        document.querySelectorAll(".theme-btn").forEach(btn => {
            if (btn.getAttribute("data-theme-val") === themeName) {
                btn.classList.add("is-active");
            } else {
                btn.classList.remove("is-active");
            }
        });
    }

    // Listen to OS theme changes if system theme is selected
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (settings.theme === "system") {
            document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
        }
    });

    /* --- 3. CUSTOM CURSOR (LERP SMOOTH TRACKING) --- */
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    // Mouse move tracking
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (settings.customCursor) {
            cursor.style.left = mouseX + "px";
            cursor.style.top = mouseY + "px";
            cursor.style.display = "block";
            cursorRing.style.display = "block";
        }
    });

    // Custom Cursor trailing LERP loop
    function updateCursorRing() {
        if (settings.customCursor) {
            // Lerp formula: current = current + (target - current) * ease
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            
            cursorRing.style.left = ringX + "px";
            cursorRing.style.top = ringY + "px";
        }
        requestAnimationFrame(updateCursorRing);
    }
    requestAnimationFrame(updateCursorRing);

    // Hover states for link scaling
    const hoverables = "a, button, .work-card, .service-card, .toggle-switch, .theme-btn";
    document.addEventListener("mouseover", (e) => {
        if (e.target.closest(hoverables)) {
            document.body.classList.add("cursor-hovering");
        }
    });
    document.addEventListener("mouseout", (e) => {
        if (e.target.closest(hoverables)) {
            document.body.classList.remove("cursor-hovering");
        }
    });

    function applyCursorVisibility() {
        if (settings.customCursor) {
            cursor.style.display = "block";
            cursorRing.style.display = "block";
            document.body.style.cursor = "none";
        } else {
            cursor.style.display = "none";
            cursorRing.style.display = "none";
            document.body.style.cursor = "auto";
        }
    }

    /* --- 4. SCROLL BEHAVIOR & SCROLLSPY --- */
    const sections = document.querySelectorAll("section[id], main > div[id]");
    const navLinks = document.querySelectorAll(".top-nav__link");
    const statusSection = document.getElementById("status-bar-section");
    const scrollPctText = document.getElementById("status-bar-scroll-pct");
    const scrollPctFill = document.getElementById("status-bar-scroll-fill");
    const backToTop = document.getElementById("back-to-top");

    function applyScrollBehavior() {
        document.documentElement.style.scrollBehavior = settings.smoothScroll ? "smooth" : "auto";
    }

    // Scroll progress calculations & active nav highlight
    window.addEventListener("scroll", () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        
        // Update Bottom Status Bar scroll info
        if (scrollPctText) scrollPctText.innerText = scrollPct;
        if (scrollPctFill) scrollPctFill.style.transform = `scaleX(${scrollPct / 100})`;
        
        // Show/hide Back to Top button
        if (scrollTop > 300) {
            backToTop.classList.add("is-visible");
        } else {
            backToTop.classList.remove("is-visible");
        }

        // Active Section ScrollSpy
        let currentSectionId = "accueil";
        let currentSectionTitle = "accueil";

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (scrollTop >= sectionTop && scrollTop < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute("id");
                
                // Format label for status bar
                switch(currentSectionId) {
                    case "hero": currentSectionTitle = "accueil"; break;
                    case "about": currentSectionTitle = "a_propos"; break;
                    case "work": currentSectionTitle = "projets_labs"; break;
                    case "services": currentSectionTitle = "competences"; break;
                    case "cv": currentSectionTitle = "mon_cv"; break;
                    case "contact": currentSectionTitle = "me_contacter"; break;
                    default: currentSectionTitle = currentSectionId;
                }
            }
        });

        // Update status bar path
        if (statusSection) {
            statusSection.innerText = currentSectionTitle;
        }

        // Update top nav links active class
        navLinks.forEach(link => {
            link.classList.remove("is-active");
            if (link.getAttribute("href") === `#${currentSectionId}` || 
               (currentSectionId === "hero" && link.getAttribute("href") === "#hero")) {
                link.classList.add("is-active");
            }
        });
    });

    // Smooth navigation links click handler
    document.querySelectorAll(".nav-link, .site-footer__link, .btn").forEach(link => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    // Close mobile menu if open
                    mobileMenu.classList.remove("is-open");
                    
                    const offsetTop = target.offsetTop - 60;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: settings.smoothScroll ? "smooth" : "auto"
                    });
                }
            });
        }
    });

    // Back to top button action
    backToTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: settings.smoothScroll ? "smooth" : "auto"
        });
    });

    /* --- 5. MOBILE DRAWER NAVIGATION MENU --- */
    const burgerBtn = document.getElementById("burger-btn");
    const closeMenuBtn = document.getElementById("close-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");

    if (burgerBtn && mobileMenu) {
        burgerBtn.addEventListener("click", () => {
            mobileMenu.classList.add("is-open");
        });
    }

    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener("click", () => {
            mobileMenu.classList.remove("is-open");
        });
    }

    // Close mobile drawer when clicking overlay links
    document.querySelectorAll(".top-nav__overlay-link").forEach(link => {
        link.addEventListener("click", () => {
            mobileMenu.classList.remove("is-open");
        });
    });

    /* --- 6. STATS NUMERICAL COUNT-UP ANIMATION --- */
    const counterValues = document.querySelectorAll(".animated-counter__value");
    
    const countObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetNum = parseInt(target.getAttribute("data-target"), 10);
                const suffix = target.innerText;
                let currentNum = 0;
                
                const duration = 1200; // Total count milliseconds
                const startTime = performance.now();
                
                function updateCount(timestamp) {
                    const elapsed = timestamp - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Eased count up
                    currentNum = Math.floor(progress * targetNum);
                    target.innerText = currentNum + (suffix === "%" || suffix === "+" ? suffix : "");
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateCount);
                    } else {
                        target.innerText = targetNum + (suffix === "%" || suffix === "+" ? suffix : "");
                    }
                }
                
                requestAnimationFrame(updateCount);
                observer.unobserve(target); // Run once
            }
        });
    }, { threshold: 0.5 });

    counterValues.forEach(val => {
        countObserver.observe(val);
    });

    /* --- 7. DYNAMIC LIVE STATUS BAR CLOCK --- */
    const clockElement = document.getElementById("status-bar-clock");
    
    function updateClock() {
        if (clockElement) {
            const now = new Date();
            const hrs = String(now.getHours()).padStart(2, '0');
            const mins = String(now.getMinutes()).padStart(2, '0');
            const secs = String(now.getSeconds()).padStart(2, '0');
            clockElement.innerText = `${hrs}:${mins}:${secs}`;
        }
    }
    setInterval(updateClock, 1000);
    updateClock(); // Initial boot update

    /* --- 8. SKILL BARS FILL TRIGGER --- */
    const skillFills = document.querySelectorAll(".cv-skill-bar__fill");
    
    const skillsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.getAttribute("data-width");
                bar.style.width = width;
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.2 });

    skillFills.forEach(bar => {
        skillsObserver.observe(bar);
    });

    /* --- 9. KEYBOARD SHORTCUTS CONTROLLER (VIM STYLE & JUMPS) --- */
    let lastKey = "";
    let keyTimeout;

    window.addEventListener("keydown", (e) => {
        // If typing inside form inputs, ignore shortcuts
        if (document.activeElement.tagName === "INPUT" || 
            document.activeElement.tagName === "TEXTAREA" ||
            document.activeElement.isContentEditable) {
            return;
        }

        const key = e.key;

        // Vim scroll down 'j'
        if (key === "j") {
            window.scrollBy({ top: 120, behavior: "smooth" });
        }
        // Vim scroll up 'k'
        else if (key === "k") {
            window.scrollBy({ top: -120, behavior: "smooth" });
        }
        // Vim go to bottom 'G'
        else if (key === "G") {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
        }
        // Open keyboard help overlay '?'
        else if (key === "?") {
            e.preventDefault();
            toggleModal(shortcutsModal);
        }
        // Close all modals with 'Esc'
        else if (key === "Escape") {
            closeAllModals();
        }

        // Two key sequences starting with 'g'
        if (key === "g") {
            lastKey = "g";
            clearTimeout(keyTimeout);
            keyTimeout = setTimeout(() => { lastKey = ""; }, 1000); // 1s window for double key
        } else if (lastKey === "g") {
            lastKey = "";
            clearTimeout(keyTimeout);
            
            // gg: Go to top
            if (key === "g") {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
            // gh: Jump to Home
            else if (key === "h") {
                jumpToSection("#hero");
            }
            // gp: Jump to Projects/Work
            else if (key === "p") {
                jumpToSection("#work");
            }
            // gs: Jump to Services/Skills
            else if (key === "s") {
                jumpToSection("#services");
            }
            // gv: Jump to Curriculum
            else if (key === "v") {
                jumpToSection("#cv");
            }
            // gc: Jump to Contact
            else if (key === "c") {
                jumpToSection("#contact");
            }
            // g,: Open Settings
            else if (key === ",") {
                toggleModal(settingsModal);
            }
        }
    });

    function jumpToSection(selector) {
        const target = document.querySelector(selector);
        if (target) {
            const offsetTop = target.offsetTop - 60;
            window.scrollTo({
                top: offsetTop,
                behavior: settings.smoothScroll ? "smooth" : "auto"
            });
        }
    }

    /* --- 10. MODALS LOGIC --- */
    const shortcutsModal = document.getElementById("shortcuts-modal");
    const settingsModal = document.getElementById("settings-modal");
    
    const closeShortcutsBtn = document.getElementById("close-shortcuts-btn");
    const closeSettingsBtn = document.getElementById("close-settings-btn");
    
    const statusBarHelpBtn = document.getElementById("status-bar-help-btn");
    const statusBarSettingsBtn = document.getElementById("status-bar-settings-btn");
    
    const footerShortcutsTrigger = document.getElementById("footer-shortcuts-trigger");
    const footerSettingsTrigger = document.getElementById("footer-settings-trigger");
    
    const saveSettingsBtn = document.getElementById("save-settings-btn");

    function openModal(modal) {
        closeAllModals();
        modal.classList.add("is-open");
        document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    function closeModal(modal) {
        modal.classList.remove("is-open");
        document.body.style.overflow = "auto";
    }

    function toggleModal(modal) {
        if (modal.classList.contains("is-open")) {
            closeModal(modal);
        } else {
            openModal(modal);
        }
    }

    function closeAllModals() {
        document.querySelectorAll(".modal-overlay").forEach(modal => {
            closeModal(modal);
        });
    }

    // Modal Close Triggers
    if (closeShortcutsBtn) closeShortcutsBtn.addEventListener("click", () => closeModal(shortcutsModal));
    if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", () => closeModal(settingsModal));

    // Project Modals Elements & Listeners
    const projectModals = document.querySelectorAll(".project-modal");
    const workCards = document.querySelectorAll(".work-card");

    workCards.forEach(card => {
        card.addEventListener("click", (e) => {
            e.preventDefault();
            const projectId = card.getAttribute("data-project");
            const modal = document.getElementById(`project-modal-${projectId}`);
            if (modal) {
                openModal(modal);
            }
        });
    });

    projectModals.forEach(modal => {
        const closeBtn = modal.querySelector(".modal-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => closeModal(modal));
        }
    });

    // Modal click outside close
    window.addEventListener("click", (e) => {
        if (e.target === shortcutsModal) closeModal(shortcutsModal);
        if (e.target === settingsModal) closeModal(settingsModal);
        projectModals.forEach(modal => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Help Panel Trigger Links
    if (statusBarHelpBtn) statusBarHelpBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleModal(shortcutsModal); });
    if (footerShortcutsTrigger) footerShortcutsTrigger.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openModal(shortcutsModal); });

    // Settings Panel Trigger Links
    if (statusBarSettingsBtn) statusBarSettingsBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleModal(settingsModal); });
    if (footerSettingsTrigger) footerSettingsTrigger.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openModal(settingsModal); });

    /* --- 11. OPTIONS PREFERENCES MANAGEMENT --- */
    function updateSettingsForm() {
        if (smoothScrollCheck) smoothScrollCheck.checked = settings.smoothScroll;
        if (customCursorCheck) customCursorCheck.checked = settings.customCursor;
    }

    // Save preferences clicked
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", () => {
            if (smoothScrollCheck) settings.smoothScroll = smoothScrollCheck.checked;
            if (customCursorCheck) settings.customCursor = customCursorCheck.checked;
            
            localStorage.setItem("tg_portfolio_settings", JSON.stringify(settings));
            
            applyCursorVisibility();
            applyScrollBehavior();
            closeModal(settingsModal);
        });
    }

    // Theme Selector Buttons inside options
    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const themeVal = btn.getAttribute("data-theme-val");
            applyTheme(themeVal);
            settings.theme = themeVal;
            localStorage.setItem("tg_portfolio_settings", JSON.stringify(settings));
        });
    });

    /* --- 12. TERMINAL CONTACT FORM VALIDATION --- */
    const contactForm = document.getElementById("console-contact-form");
    const successMsg = document.getElementById("form-success-msg");

    if (contactForm && successMsg) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector(".contact-form__submit-btn");
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Envoi en cours...';
            submitBtn.disabled = true;
            
            const data = new FormData(contactForm);
            
            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Hide form and show success message
                    contactForm.style.display = "none";
                    successMsg.style.display = "block";
                    contactForm.reset();
                    
                    // Smoothly scroll to the success message
                    successMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
                } else {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                    alert("Erreur lors de l'envoi du message. Veuillez réessayer ou m'écrire directement à tgiraud0604@gmail.com.");
                }
            } catch (error) {
                console.error("Form error:", error);
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                alert("Une erreur de communication est survenue. Veuillez réessayer ou m'écrire directement à tgiraud0604@gmail.com.");
            }
        });
    }

    /* --- 13. SISR DATA RAIN CANVAS ANIMATION (HERO) --- */
    const rainCanvas = document.getElementById("hero-rain-canvas");
    if (rainCanvas) {
        const ctx = rainCanvas.getContext("2d");
        let animationFrameId;

        // Networks & Systems technical characters + Japanese glyphs
        const glyphs = [
            "0", "1", "IP", "AD", "DNS", "NAT", "PAT", "VLAN", "FW", "CISC", "PING", "SYS", "NET", "SRV", "PORT", "LAN",
            "ｱ", "ｲ", "ｳ", "ｴ", "ｵ", "ｶ", "ｷ", "ｸ", "ｹ", "ｺ", "ｻ", "ｼ", "ｽ", "ｾ", "ｿ", "ﾀ", "ﾁ", "ﾂ", "ﾃ", "ﾄ", "ﾅ", "ﾆ"
        ];

        let fontSize = 13;
        let columns = 0;
        let drops = [];

        function initRain() {
            rainCanvas.width = rainCanvas.parentElement.offsetWidth;
            rainCanvas.height = rainCanvas.parentElement.offsetHeight;
            
            columns = Math.floor(rainCanvas.width / 22);
            drops = Array(columns).fill(1);
        }

        // Controlled FPS-based render loop for a beautifully legible and steady technical rain flow
        let lastTime = 0;
        const targetFps = 15; // 15 updates per second is ideal for legibility and aesthetic speed
        const interval = 1000 / targetFps;

        function drawRain(timestamp) {
            animationFrameId = requestAnimationFrame(drawRain);

            if (!timestamp) timestamp = performance.now();
            const elapsed = timestamp - lastTime;

            if (elapsed > interval) {
                lastTime = timestamp - (elapsed % interval);

                // Check active theme to clear canvas transparently
                const isDark = document.documentElement.getAttribute("data-theme") === "dark";
                ctx.fillStyle = isDark ? "rgba(10, 11, 13, 0.08)" : "rgba(244, 244, 244, 0.08)";
                ctx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);

                ctx.font = "bold " + fontSize + "px 'JetBrains Mono', monospace";

                for (let i = 0; i < drops.length; i++) {
                    const text = glyphs[Math.floor(Math.random() * glyphs.length)];
                    const x = i * 22;
                    const y = drops[i] * 16;

                    // Color schemes: Head is bright white, standard is soft blue, some technical keywords are orange
                    const isHead = Math.random() > 0.98;
                    const isOrange = Math.random() > 0.95;

                    if (isHead) {
                        ctx.fillStyle = isDark ? "#ffffff" : "#191818";
                    } else if (isOrange) {
                        ctx.fillStyle = isDark ? "rgba(232, 115, 75, 0.35)" : "rgba(226, 83, 39, 0.3)";
                    } else {
                        ctx.fillStyle = isDark ? "rgba(74, 127, 247, 0.16)" : "rgba(27, 93, 239, 0.12)";
                    }

                    ctx.fillText(text, x, y);

                    // Increment position
                    drops[i]++;

                    // Random drop reset
                    if (y > rainCanvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                }
            }
        }

        initRain();
        drawRain();

        // Handle window resizing
        window.addEventListener("resize", () => {
            cancelAnimationFrame(animationFrameId);
            initRain();
            drawRain();
        });
    }

    /* --- 14. DYNAMIC NETWORK CONSTELLATION CANVAS (ABOUT) --- */
    const networkCanvas = document.getElementById("about-network-canvas");
    if (networkCanvas) {
        const ctx = networkCanvas.getContext("2d");
        let animationFrameId;
        let particles = [];
        const maxParticles = 45;
        const connectionDist = 110;
        
        let width = 0;
        let height = 0;
        
        let mouse = { x: null, y: null, radius: 150 };
        
        const aboutSection = document.getElementById("about");
        if (aboutSection) {
            aboutSection.addEventListener("mousemove", (e) => {
                const rect = networkCanvas.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
            });
            aboutSection.addEventListener("mouseleave", () => {
                mouse.x = null;
                mouse.y = null;
            });
        }

        function initNetwork() {
            width = networkCanvas.width = networkCanvas.parentElement.offsetWidth;
            height = networkCanvas.height = networkCanvas.parentElement.offsetHeight;
            
            particles = [];
            for (let i = 0; i < maxParticles; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.22, // Extra slow, graceful floating speed
                    vy: (Math.random() - 0.5) * 0.22,
                    radius: Math.random() * 2 + 1.5,
                    color: Math.random() > 0.75 ? "orange" : "blue"
                });
            }
        }

        function drawNetwork() {
            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            
            // Clear canvas transparently
            ctx.clearRect(0, 0, width, height);

            // Fetch dynamic theme-based colors
            const blueColor = isDark ? "rgba(74, 127, 247, 0.45)" : "rgba(27, 93, 239, 0.35)";
            const orangeColor = isDark ? "rgba(232, 115, 75, 0.55)" : "rgba(226, 83, 39, 0.45)";

            // Update & Draw particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                // Move
                p.x += p.vx;
                p.y += p.vy;
                
                // Bounce on boundaries
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Draw node
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color === "orange" ? orangeColor : blueColor;
                ctx.fill();

                // Mouse interaction node connections
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < mouse.radius) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        // Make line stronger near mouse
                        const alpha = (1 - dist / mouse.radius) * 0.25;
                        ctx.strokeStyle = isDark ? `rgba(74, 127, 247, ${alpha})` : `rgba(27, 93, 239, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            // Draw links between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];
                    
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < connectionDist) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        
                        // Line opacity based on distance
                        const alpha = (1 - dist / connectionDist) * 0.45;
                        ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${alpha * 0.1})` : `rgba(25, 24, 24, ${alpha * 0.08})`;
                        ctx.lineWidth = 0.75;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(drawNetwork);
        }

        initNetwork();
        drawNetwork();

        window.addEventListener("resize", () => {
            cancelAnimationFrame(animationFrameId);
            initNetwork();
            drawNetwork();
        });
    }

    /* --- 15. AUTOMATIC SCROLL REVEAL & STAGGERED TRANSITIONS --- */
    const revealTargets = document.querySelectorAll(
        ".section-title, .section-subtitle, .work-card, .service-card, .cv-item, .contact-card, .counter-card"
    );

    // Assign scroll reveal base class
    revealTargets.forEach(el => {
        el.classList.add("reveal-on-scroll");
    });

    // Assign staggered delays to child grids dynamically
    const serviceCards = document.querySelectorAll(".services-grid .service-card");
    serviceCards.forEach((card, idx) => {
        card.style.transitionDelay = `${idx * 0.1}s`;
    });

    const workCardsList = document.querySelectorAll(".work-list .work-card");
    workCardsList.forEach((card, idx) => {
        card.style.transitionDelay = `${idx * 0.12}s`;
    });

    const cvItems = document.querySelectorAll(".cv-block .cv-item");
    cvItems.forEach((item, idx) => {
        item.style.transitionDelay = `${idx * 0.08}s`;
    });

    // IntersectionObserver reveal executor
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                
                // If it is a counter card, trigger pop pulse on completion
                if (entry.target.classList.contains("counter-card")) {
                    const valueEl = entry.target.querySelector(".animated-counter__value");
                    if (valueEl) {
                        setTimeout(() => {
                            valueEl.classList.add("pulse-pop");
                        }, 1250);
                    }
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: "0px 0px -100px 0px"
    });

    revealTargets.forEach(el => {
        revealObserver.observe(el);
    });
});
