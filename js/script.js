/* ==========================================================================
   THOMAS GIRAUD - PORTFOLIO INTERACTION & ACCESSIBILITY LOGIC (script.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    
    /* --- 1. LOCAL STORAGE SITE SETTINGS & THEME --- */
    const settings = {
        smoothScroll: true,
        customCursor: true,
        theme: "system" // "light", "dark", "system"
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;

    // Load saved preferences
    try {
        const raw = localStorage.getItem("tg_portfolio_settings");
        if (raw) Object.assign(settings, JSON.parse(raw));
    } catch (e) {
        console.error("Error loading settings:", e);
    }

    function saveSettings() {
        try {
            localStorage.setItem("tg_portfolio_settings", JSON.stringify(settings));
        } catch (e) {
            console.error("Error saving settings:", e);
        }
    }

    // Custom cursor variables
    const cursor = document.getElementById("custom-cursor");
    const cursorRing = document.getElementById("custom-cursor-ring");
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let cursorRAF = null;

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const smoothScrollCheck = document.getElementById("setting-smooth-scroll");
    const customCursorCheck = document.getElementById("setting-custom-cursor");

    // Initialize Settings on boot
    applyTheme(settings.theme);
    updateSettingsForm();
    applyCursorVisibility();
    applyScrollBehavior();

    /* --- 2. THEME MANAGER --- */
    function applyTheme(themeName) {
        settings.theme = themeName;
        const html = document.documentElement;
        
        let effectiveTheme = themeName;
        if (themeName === "system") {
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            effectiveTheme = isDark ? "dark" : "light";
        }
        
        html.setAttribute("data-theme", effectiveTheme);
        syncThemeColor();

        // Update active class in all theme buttons (modals & drawer)
        document.querySelectorAll(".theme-btn").forEach(btn => {
            btn.classList.toggle("is-active", btn.getAttribute("data-theme-val") === themeName);
        });
    }

    // Quick toggle in nav header (toggles between light and dark)
    const quickThemeBtn = document.getElementById("theme-quick-toggle");
    if (quickThemeBtn) {
        quickThemeBtn.addEventListener("click", () => {
            const currentEffective = document.documentElement.getAttribute("data-theme") || "light";
            const nextTheme = currentEffective === "dark" ? "light" : "dark";
            applyTheme(nextTheme);
            saveSettings();
            showToast(nextTheme === "dark" ? "Thème Sombre activé" : "Thème Clair activé");
        });
    }

    // Listen to OS theme changes if system theme is selected
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (settings.theme === "system") {
            document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
            syncThemeColor();
        }
    });

    function syncThemeColor() {
        if (!themeColorMeta) return;
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        themeColorMeta.setAttribute("content", isDark ? "#0a0b0e" : "#f5f4f0");
    }

    /* --- 3. CUSTOM CURSOR (SMOOTH LERP LOOP) --- */
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (settings.customCursor && isFinePointer && !prefersReducedMotion.matches) {
            if (cursor) {
                cursor.style.left = mouseX + "px";
                cursor.style.top = mouseY + "px";
                cursor.style.display = "block";
            }
            if (cursorRing) {
                cursorRing.style.display = "block";
            }
        }
    });

    function updateCursorRing() {
        if (settings.customCursor && isFinePointer && !prefersReducedMotion.matches) {
            ringX += (mouseX - ringX) * 0.16;
            ringY += (mouseY - ringY) * 0.16;

            if (cursorRing) {
                cursorRing.style.left = ringX + "px";
                cursorRing.style.top = ringY + "px";
            }
            cursorRAF = requestAnimationFrame(updateCursorRing);
        } else {
            cursorRAF = null;
        }
    }

    function startCursorLoop() {
        if (cursorRAF !== null || !settings.customCursor || !isFinePointer || prefersReducedMotion.matches) return;
        cursorRAF = requestAnimationFrame(updateCursorRing);
    }

    function stopCursorLoop() {
        if (cursorRAF !== null) {
            cancelAnimationFrame(cursorRAF);
            cursorRAF = null;
        }
    }

    startCursorLoop();

    // Hover states for cursor scaling
    const hoverables = "a, button, .work-card, .service-card, .counter-card, .toggle-switch, .theme-btn, .mini-copy-btn";
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
        if (settings.customCursor && isFinePointer && !prefersReducedMotion.matches) {
            if (cursor) cursor.style.display = "block";
            if (cursorRing) cursorRing.style.display = "block";
            document.body.style.cursor = "none";
            startCursorLoop();
        } else {
            if (cursor) cursor.style.display = "none";
            if (cursorRing) cursorRing.style.display = "none";
            document.body.style.cursor = "auto";
            stopCursorLoop();
        }
    }

    /* --- 4. TOAST NOTIFICATION UTILITY --- */
    const toastEl = document.getElementById("toast-notification");
    const toastMsg = document.getElementById("toast-message");
    let toastTimer = null;

    function showToast(message) {
        if (!toastEl || !toastMsg) return;
        toastMsg.textContent = message;
        toastEl.classList.add("is-visible");
        toastEl.setAttribute("aria-hidden", "false");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove("is-visible");
            toastEl.setAttribute("aria-hidden", "true");
        }, 2800);
    }

    // Copy Email handler
    document.querySelectorAll(".copy-email-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const email = btn.getAttribute("data-email") || "tgiraud0604@gmail.com";
            
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(email);
                } else {
                    const temp = document.createElement("textarea");
                    temp.value = email;
                    document.body.appendChild(temp);
                    temp.select();
                    document.execCommand("copy");
                    document.body.removeChild(temp);
                }
                showToast("Adresse e-mail copiée : " + email);
            } catch (err) {
                showToast("E-mail : " + email);
            }
        });
    });

    /* --- 5. SCROLL BEHAVIOR & SCROLLSPY --- */
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".top-nav__link, .top-nav__overlay-link");
    const statusSection = document.getElementById("status-bar-section");
    const scrollPctText = document.getElementById("status-bar-scroll-pct");
    const scrollPctFill = document.getElementById("status-bar-scroll-fill");
    const readingBar = document.getElementById("reading-progress-bar");
    const backToTop = document.getElementById("back-to-top");

    function applyScrollBehavior() {
        document.documentElement.style.scrollBehavior = 
            prefersReducedMotion.matches ? "auto" : (settings.smoothScroll ? "smooth" : "auto");
    }

    function getScrollBehavior() {
        return prefersReducedMotion.matches ? "auto" : (settings.smoothScroll ? "smooth" : "auto");
    }

    let scrollTicking = false;
    window.addEventListener("scroll", () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                updateScrollState();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    updateScrollState();

    function updateScrollState() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPct = docHeight > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100))) : 0;

        // Update progress indicators
        if (scrollPctText) scrollPctText.innerText = scrollPct;
        if (scrollPctFill) scrollPctFill.style.transform = `scaleX(${scrollPct / 100})`;
        if (readingBar) readingBar.style.transform = `scaleX(${scrollPct / 100})`;

        // Back to top button
        if (backToTop) {
            backToTop.classList.toggle("is-visible", scrollTop > 320);
        }

        // Active Section ScrollSpy
        let currentSectionId = "hero";
        let currentSectionLabel = "accueil";

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (scrollTop >= sectionTop && scrollTop < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute("id");
                
                switch(currentSectionId) {
                    case "hero": currentSectionLabel = "accueil"; break;
                    case "about": currentSectionLabel = "a_propos"; break;
                    case "services": currentSectionLabel = "competences"; break;
                    case "work": currentSectionLabel = "projets_labs"; break;
                    case "cv": currentSectionLabel = "curriculum_vitae"; break;
                    case "contact": currentSectionLabel = "contact"; break;
                    default: currentSectionLabel = currentSectionId;
                }
            }
        });

        if (statusSection) {
            statusSection.innerText = currentSectionLabel;
        }

        navLinks.forEach(link => {
            const href = link.getAttribute("href");
            const isActive = href === `#${currentSectionId}`;
            link.classList.toggle("is-active", isActive);
            if (isActive) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    }

    // Smooth navigation links click handler
    document.querySelectorAll(".nav-link, .site-footer__link, .btn").forEach(link => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#") && href.length > 1) {
            link.addEventListener("click", (e) => {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    closeMobileMenu({ restoreFocus: false });

                    target.scrollIntoView({ behavior: getScrollBehavior(), block: "start" });
                    target.setAttribute("tabindex", "-1");
                    target.focus({ preventScroll: true });
                }
            });
        }
    });

    if (backToTop) {
        backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: getScrollBehavior() });
        });
    }

    /* --- 6. MOBILE DRAWER NAVIGATION MENU --- */
    const mobileMenu = document.getElementById("mobile-menu");
    const burgerBtn = document.getElementById("burger-btn");
    const closeMenuBtn = document.getElementById("close-menu-btn");
    const mainContent = document.getElementById("main-content");
    const siteFooter = document.querySelector(".site-footer");
    let mobileMenuOpener = null;

    function openMobileMenu() {
        if (!mobileMenu) return;
        mobileMenuOpener = document.activeElement;
        mobileMenu.classList.add("is-open");
        mobileMenu.removeAttribute("inert");
        mobileMenu.setAttribute("aria-hidden", "false");
        if (burgerBtn) burgerBtn.setAttribute("aria-expanded", "true");

        if (mainContent) mainContent.setAttribute("inert", "");
        if (siteFooter) siteFooter.setAttribute("inert", "");
        document.body.style.overflow = "hidden";

        closeMenuBtn?.focus();
    }

    function closeMobileMenu({ restoreFocus = true } = {}) {
        if (!mobileMenu || !mobileMenu.classList.contains("is-open")) return;
        mobileMenu.classList.remove("is-open");
        mobileMenu.setAttribute("aria-hidden", "true");
        mobileMenu.setAttribute("inert", "");
        if (burgerBtn) burgerBtn.setAttribute("aria-expanded", "false");

        if (mainContent) mainContent.removeAttribute("inert");
        if (siteFooter) siteFooter.removeAttribute("inert");
        document.body.style.overflow = "";

        if (restoreFocus && mobileMenuOpener && typeof mobileMenuOpener.focus === "function") {
            mobileMenuOpener.focus();
        }
        mobileMenuOpener = null;
    }

    if (burgerBtn) burgerBtn.addEventListener("click", openMobileMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener("click", () => closeMobileMenu());

    if (mobileMenu) {
        mobileMenu.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                closeMobileMenu();
            }
        });
    }

    /* --- 7. STATS NUMERICAL COUNT-UP ANIMATION --- */
    const counterValues = document.querySelectorAll(".animated-counter__value");

    const countObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetNum = parseInt(target.getAttribute("data-target"), 10);

                if (prefersReducedMotion.matches || Number.isNaN(targetNum)) {
                    target.innerText = targetNum + "+";
                    observer.unobserve(target);
                    return;
                }

                let currentNum = 0;
                const duration = 1200;
                const startTime = performance.now();

                function updateCount(timestamp) {
                    const elapsed = timestamp - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic

                    currentNum = Math.floor(easeProgress * targetNum);
                    target.innerText = currentNum + (progress >= 1 && targetNum > 4 ? "+" : "");

                    if (progress < 1) {
                        requestAnimationFrame(updateCount);
                    } else {
                        target.innerText = targetNum + (targetNum > 4 ? "+" : "");
                    }
                }

                requestAnimationFrame(updateCount);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.3 });

    counterValues.forEach(val => countObserver.observe(val));

    /* --- 8. TYPEWRITER EFFECT (HERO ROLE) --- */
    const heroRole = document.getElementById("hero-typed-role");
    if (heroRole && !prefersReducedMotion.matches && isFinePointer) {
        const fullText = heroRole.textContent.trim();
        const caret = document.createElement("span");
        caret.className = "type-caret";
        caret.setAttribute("aria-hidden", "true");
        heroRole.setAttribute("aria-label", fullText);
        heroRole.textContent = "";
        heroRole.appendChild(caret);
        
        let charIndex = 0;
        const typeInterval = setInterval(() => {
            if (charIndex < fullText.length) {
                caret.before(document.createTextNode(fullText[charIndex]));
                charIndex++;
            } else {
                clearInterval(typeInterval);
            }
        }, 32);
    }

    /* --- 9. MODALS MANAGEMENT (DEEP LINKING & ACCESSIBLE FOCUS TRAP) --- */
    const shortcutsModal = document.getElementById("shortcuts-modal");
    const settingsModal = document.getElementById("settings-modal");
    const allModals = document.querySelectorAll(".modal-overlay");
    const projectModals = document.querySelectorAll(".project-modal");
    const workCards = document.querySelectorAll(".work-card");

    const FOCUSABLE_SELECTOR = [
        'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
        'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function getFocusable(container) {
        return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
            .filter(el => el.getClientRects().length > 0 || el === document.activeElement);
    }

    function openModalDirectly(modal) {
        if (!modal) return;
        modal.classList.add("is-open");
        document.body.style.overflow = "hidden";
        modal._lastFocus = document.activeElement;

        if (mainContent) mainContent.setAttribute("inert", "");
        if (siteFooter) siteFooter.setAttribute("inert", "");

        const focusables = getFocusable(modal);
        const closeBtn = modal.querySelector(".modal-close");
        (closeBtn || focusables[0] || modal).focus();

        if (!modal._trapBound) {
            modal.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    closeActiveModal();
                    return;
                }
                if (e.key !== "Tab") return;
                const items = getFocusable(modal);
                if (items.length === 0) return;
                const firstEl = items[0];
                const lastEl = items[items.length - 1];
                if (e.shiftKey && document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                } else if (!e.shiftKey && document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            });
            modal._trapBound = true;
        }
    }

    function closeModalDirectly(modal) {
        if (!modal) return;
        modal.classList.remove("is-open");

        const anyOpen = Array.from(allModals).some(m => m.classList.contains("is-open"));
        if (!anyOpen) {
            document.body.style.overflow = "";
            if (mainContent) mainContent.removeAttribute("inert");
            if (siteFooter) siteFooter.removeAttribute("inert");
        }

        const opener = modal._lastFocus;
        if (opener && typeof opener.focus === "function") {
            opener.focus();
        }
        modal._lastFocus = null;
    }

    function closeActiveModal() {
        const hash = window.location.hash;
        if (hash && (hash.startsWith("#project-") || hash === "#shortcuts" || hash === "#settings")) {
            if (window.history.replaceState) {
                window.history.replaceState(null, "", window.location.pathname + window.location.search);
            }
        }
        allModals.forEach(modal => closeModalDirectly(modal));
    }

    function openModalViaHash(hash) {
        if (window.history.pushState) {
            window.history.pushState({ tgModal: hash }, "", "#" + hash);
            handleHashChange();
        } else {
            window.location.hash = hash;
        }
    }

    function handleHashChange() {
        const hash = window.location.hash;
        let targetModal = null;

        if (hash.startsWith("#project-")) {
            const projectId = hash.replace("#project-", "");
            targetModal = document.getElementById(`project-modal-${projectId}`);
        } else if (hash === "#shortcuts") {
            targetModal = shortcutsModal;
        } else if (hash === "#settings") {
            targetModal = settingsModal;
        }

        allModals.forEach(m => {
            if (m !== targetModal && m.classList.contains("is-open")) {
                closeModalDirectly(m);
            }
        });

        if (targetModal && !targetModal.classList.contains("is-open")) {
            openModalDirectly(targetModal);
        }
    }

    window.addEventListener("hashchange", handleHashChange);
    if (window.location.hash) {
        handleHashChange();
    }

    // Trigger binding for project cards
    workCards.forEach(card => {
        const openProject = (e) => {
            e.preventDefault();
            const projectId = card.getAttribute("data-project");
            openModalViaHash(`project-${projectId}`);
        };
        card.addEventListener("click", openProject);
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openProject(e);
            }
        });
    });

    // Close buttons binding
    document.querySelectorAll(".modal-close, .btn--close-modal").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            closeActiveModal();
        });
    });

    // Click outside modal backdrop to close
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            closeActiveModal();
        }
    });

    // Navigation and footer trigger buttons
    document.getElementById("nav-shortcuts-btn")?.addEventListener("click", () => openModalViaHash("shortcuts"));
    document.getElementById("footer-shortcuts-trigger")?.addEventListener("click", () => openModalViaHash("shortcuts"));
    document.getElementById("status-bar-help-btn")?.addEventListener("click", () => openModalViaHash("shortcuts"));

    document.getElementById("footer-settings-trigger")?.addEventListener("click", () => openModalViaHash("settings"));
    document.getElementById("status-bar-settings-btn")?.addEventListener("click", () => openModalViaHash("settings"));

    /* --- 10. KEYBOARD SHORTCUTS CONTROLLER (VIM STYLE + JUMPS) --- */
    let lastKey = "";
    let keyTimeout;

    window.addEventListener("keydown", (e) => {
        if (document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA" ||
            document.activeElement.isContentEditable) {
            return;
        }

        const key = e.key;

        // Vim scroll down 'j'
        if (key === "j") {
            window.scrollBy({ top: 120, behavior: getScrollBehavior() });
        }
        // Vim scroll up 'k'
        else if (key === "k") {
            window.scrollBy({ top: -120, behavior: getScrollBehavior() });
        }
        // Vim go to bottom 'G'
        else if (key === "G") {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: getScrollBehavior() });
        }
        // Open keyboard help '?'
        else if (key === "?") {
            e.preventDefault();
            const isOpen = shortcutsModal?.classList.contains("is-open");
            if (isOpen) closeActiveModal();
            else openModalViaHash("shortcuts");
        }
        // Two-key jump sequences starting with 'g'
        else if (key === "g") {
            if (lastKey === "g") {
                lastKey = "";
                clearTimeout(keyTimeout);
                window.scrollTo({ top: 0, behavior: getScrollBehavior() });
            } else {
                lastKey = "g";
                clearTimeout(keyTimeout);
                keyTimeout = setTimeout(() => { lastKey = ""; }, 1000);
            }
        } else if (lastKey === "g") {
            lastKey = "";
            clearTimeout(keyTimeout);
            
            if (key === "h") jumpToSection("#hero");
            else if (key === "a") jumpToSection("#about");
            else if (key === "s") jumpToSection("#services");
            else if (key === "p") jumpToSection("#work");
            else if (key === "v") jumpToSection("#cv");
            else if (key === "c") jumpToSection("#contact");
            else if (key === ",") openModalViaHash("settings");
        }
    });

    function jumpToSection(selector) {
        const target = document.querySelector(selector);
        if (target) {
            target.scrollIntoView({ behavior: getScrollBehavior(), block: "start" });
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
        }
    }

    /* --- 11. SETTINGS PREFERENCES FORM --- */
    function updateSettingsForm() {
        if (smoothScrollCheck) smoothScrollCheck.checked = settings.smoothScroll;
        if (customCursorCheck) customCursorCheck.checked = settings.customCursor;
    }

    document.getElementById("save-settings-btn")?.addEventListener("click", () => {
        if (smoothScrollCheck) settings.smoothScroll = smoothScrollCheck.checked;
        if (customCursorCheck) settings.customCursor = customCursorCheck.checked;

        saveSettings();
        applyCursorVisibility();
        applyScrollBehavior();
        closeActiveModal();
        showToast("Paramètres sauvegardés avec succès");
    });

    // Theme selector buttons inside modal and drawer
    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const themeVal = btn.getAttribute("data-theme-val");
            applyTheme(themeVal);
            saveSettings();
        });
    });

    /* --- 12. SCROLL REVEAL OBSERVER --- */
    const revealTargets = document.querySelectorAll(
        ".section-title, .section-subtitle, .about-card, .service-card, .work-card, .cv-preview-card, .contact-card, .contact-info-card, .counter-card"
    );

    revealTargets.forEach(el => el.classList.add("reveal-on-scroll"));

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px"
    });

    revealTargets.forEach(el => revealObserver.observe(el));

    /* --- 13. DATA RAIN CANVAS ANIMATION (HERO) --- */
    const rainCanvas = document.getElementById("hero-rain-canvas");
    if (rainCanvas) {
        const ctx = rainCanvas.getContext("2d");
        let rainAnimId;
        const glyphs = [
            "0", "1", "IP", "AD", "DNS", "NAT", "PAT", "VLAN", "FW", "CISC", "PING", "SYS", "NET", "SRV", "PORT", "LAN", "DHCP", "GPO", "SSH"
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

        let lastTime = 0;
        const targetFps = 15;
        const interval = 1000 / targetFps;

        function drawRain(timestamp) {
            rainAnimId = requestAnimationFrame(drawRain);
            if (!timestamp) timestamp = performance.now();
            const elapsed = timestamp - lastTime;

            if (elapsed > interval) {
                lastTime = timestamp - (elapsed % interval);
                const isDark = document.documentElement.getAttribute("data-theme") === "dark";
                ctx.fillStyle = isDark ? "rgba(10, 11, 14, 0.16)" : "rgba(245, 244, 240, 0.16)";
                ctx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);

                ctx.font = "bold " + fontSize + "px 'JetBrains Mono', monospace";

                for (let i = 0; i < drops.length; i++) {
                    const text = glyphs[Math.floor(Math.random() * glyphs.length)];
                    const x = i * 22;
                    const y = drops[i] * 16;

                    const isHead = Math.random() > 0.98;
                    const isOrange = Math.random() > 0.95;

                    if (isHead) {
                        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(21, 22, 24, 0.85)";
                    } else if (isOrange) {
                        ctx.fillStyle = isDark ? "rgba(232, 115, 75, 0.35)" : "rgba(194, 67, 24, 0.28)";
                    } else {
                        ctx.fillStyle = isDark ? "rgba(74, 127, 247, 0.18)" : "rgba(27, 93, 239, 0.12)";
                    }

                    ctx.fillText(text, x, y);
                    drops[i]++;

                    if (y > rainCanvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                }
            }
        }

        let rainRunning = false;
        function startRain() {
            if (rainRunning || prefersReducedMotion.matches) return;
            rainRunning = true;
            drawRain();
        }
        function stopRain() {
            rainRunning = false;
            cancelAnimationFrame(rainAnimId);
        }

        initRain();
        startRain();

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) stopRain();
            else startRain();
        });

        const heroSection = document.getElementById("hero");
        if (heroSection) {
            const heroObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) startRain();
                    else stopRain();
                });
            }, { threshold: 0 });
            heroObserver.observe(heroSection);
        }

        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                stopRain();
                initRain();
                startRain();
            }, 200);
        });
    }

    /* --- 14. DYNAMIC NETWORK CONSTELLATION (ABOUT SECTION) --- */
    const networkCanvas = document.getElementById("about-network-canvas");
    if (networkCanvas) {
        const ctx = networkCanvas.getContext("2d");
        let netAnimId;
        let particles = [];
        const maxParticles = 26;
        const connectionDist = 120;
        let width = 0;
        let height = 0;
        let mouse = { x: null, y: null, radius: 140 };

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
                    vx: (Math.random() - 0.5) * 0.25,
                    vy: (Math.random() - 0.5) * 0.25,
                    radius: Math.random() * 2 + 1.5,
                    color: Math.random() > 0.7 ? "orange" : "blue"
                });
            }
        }

        function drawNetwork() {
            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            ctx.clearRect(0, 0, width, height);

            const blueColor = isDark ? "rgba(74, 127, 247, 0.4)" : "rgba(27, 93, 239, 0.3)";
            const orangeColor = isDark ? "rgba(232, 115, 75, 0.45)" : "rgba(194, 67, 24, 0.35)";

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color === "orange" ? orangeColor : blueColor;
                ctx.fill();

                if (mouse.x !== null && mouse.y !== null) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < mouse.radius) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        const alpha = (1 - dist / mouse.radius) * 0.2;
                        ctx.strokeStyle = isDark ? `rgba(74, 127, 247, ${alpha})` : `rgba(27, 93, 239, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

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
                        const alpha = (1 - dist / connectionDist) * 0.15;
                        ctx.strokeStyle = isDark ? `rgba(244, 244, 244, ${alpha})` : `rgba(25, 24, 24, ${alpha})`;
                        ctx.lineWidth = 0.75;
                        ctx.stroke();
                    }
                }
            }

            netAnimId = requestAnimationFrame(drawNetwork);
        }

        let netRunning = false;
        function startNetwork() {
            if (netRunning || prefersReducedMotion.matches) return;
            netRunning = true;
            drawNetwork();
        }
        function stopNetwork() {
            netRunning = false;
            cancelAnimationFrame(netAnimId);
        }

        initNetwork();
        startNetwork();

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) stopNetwork();
            else startNetwork();
        });

        if (aboutSection) {
            const aboutObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) startNetwork();
                    else stopNetwork();
                });
            }, { threshold: 0 });
            aboutObserver.observe(aboutSection);
        }
    }

    /* --- 15. CONTACT FORM ASYNC SUBMISSION --- */
    const contactForm = document.getElementById("console-contact-form");
    const successMsg = document.getElementById("form-success-msg");

    if (contactForm && successMsg) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Honeypot spam check
            const honeypot = contactForm.querySelector('[name="_gotcha"]');
            if (honeypot && honeypot.value) return;

            const submitBtn = contactForm.querySelector(".contact-form__submit-btn");
            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<svg aria-hidden="true" class="icon-inline icon-inline--spin" style="margin-right: 8px;" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/></svg> Envoi en cours...';
            submitBtn.disabled = true;

            const data = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    contactForm.style.display = "none";
                    successMsg.style.display = "block";
                    contactForm.reset();
                    showToast("Message envoyé avec succès !");
                    successMsg.scrollIntoView({ behavior: getScrollBehavior(), block: "nearest" });
                } else {
                    submitBtn.innerHTML = originalBtnHtml;
                    submitBtn.disabled = false;
                    alert("Erreur lors de l'envoi. Vous pouvez m'écrire directement à tgiraud0604@gmail.com.");
                }
            } catch (err) {
                console.error("Form submit error:", err);
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
                alert("Une erreur de communication est survenue. Vous pouvez m'écrire à tgiraud0604@gmail.com.");
            }
        });
    }
});
