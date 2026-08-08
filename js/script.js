/* ==========================================================================
   THOMAS GIRAUD - PORTFOLIO INTERACTION LOGIC (script.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    
    /* --- 1. LOCAL STORAGE SITE SETTINGS & THEME --- */
    const settings = {
        smoothScroll: true,
        customCursor: true,
        theme: "system" // "light", "dark", "system"
    };

    // Input elements declarations (hoisted out of Temporal Dead Zone)
    const smoothScrollCheck = document.getElementById("setting-smooth-scroll");
    const customCursorCheck = document.getElementById("setting-custom-cursor");

    // Hoist custom cursor elements out of Temporal Dead Zone
    const cursor = document.getElementById("custom-cursor");
    const cursorRing = document.getElementById("custom-cursor-ring");

    // Load saved preferences (protégé : un stockage bloqué ne doit pas tuer le site)
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

    // --- Position initiale de la souris (déclarée AVANT applyCursorVisibility,
    // appelée au boot : sinon TDZ "Cannot access 'mouseX' before initialization") ---
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    // Idem pour l'ID de la boucle rAF du curseur (utilisée dès le boot).
    let cursorRAF = null;
    // Idem pour la meta theme-color (synchronisée dès le boot via applyTheme).
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

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

        syncThemeColor();

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
            syncThemeColor();
        }
    });

    // La barre d'onglet mobile suit le thème (meta theme-color)
    function syncThemeColor() {
        if (!themeColorMeta) return;
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        themeColorMeta.setAttribute("content", isDark ? "#0a0b0d" : "#f4f4f4");
    }

    /* --- 3. CUSTOM CURSOR (LERP SMOOTH TRACKING) --- */
    // (mouseX/mouseY/ringX/ringY sont déclarés en tête de fichier, avant le boot)

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

    // Custom Cursor trailing LERP loop (boucle pilotée : arrêtée quand désactivée)
    // (cursorRAF est déclaré en tête de fichier, avant le boot)

    function updateCursorRing() {
        if (settings.customCursor) {
            // Lerp formula: current = current + (target - current) * ease
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;

            cursorRing.style.left = ringX + "px";
            cursorRing.style.top = ringY + "px";
            cursorRAF = requestAnimationFrame(updateCursorRing);
        } else {
            cursorRAF = null;
        }
    }

    function startCursorLoop() {
        if (cursorRAF !== null || !settings.customCursor) return;
        cursorRAF = requestAnimationFrame(updateCursorRing);
    }

    function stopCursorLoop() {
        if (cursorRAF !== null) {
            cancelAnimationFrame(cursorRAF);
            cursorRAF = null;
        }
    }

    startCursorLoop();

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
            // Position initiale immédiate (le premier mousemove suivra)
            cursor.style.left = mouseX + "px";
            cursor.style.top = mouseY + "px";
            cursorRing.style.left = ringX + "px";
            cursorRing.style.top = ringY + "px";
            cursor.style.display = "block";
            cursorRing.style.display = "block";
            document.body.style.cursor = "none";
            startCursorLoop();
        } else {
            cursor.style.display = "none";
            cursorRing.style.display = "none";
            document.body.style.cursor = "auto";
            stopCursorLoop();
        }
    }

    /* --- 4. SCROLL BEHAVIOR & SCROLLSPY --- */
    const sections = document.querySelectorAll("section[id], main > div[id]");
    const navLinks = document.querySelectorAll(".top-nav__link, .top-nav__overlay-link");
    const statusSection = document.getElementById("status-bar-section");
    const scrollPctText = document.getElementById("status-bar-scroll-pct");
    const scrollPctFill = document.getElementById("status-bar-scroll-fill");
    const backToTop = document.getElementById("back-to-top");

    // Hoisted early: referenced by nav-link click handlers below.
    const mobileMenu = document.getElementById("mobile-menu");
    const burgerBtn = document.getElementById("burger-btn");
    const closeMenuBtn = document.getElementById("close-menu-btn");
    const mobileMenuBackground = document.querySelectorAll(
        "body > main, body > footer, body > .status-bar, body > .back-to-top, .top-nav__inner"
    );
    let mobileMenuOpener = null;
    let mobileMenuPreviousOverflow = "";

    function setMobileMenuBackgroundInert(state) {
        mobileMenuBackground.forEach(element => {
            if (state) element.setAttribute("inert", "");
            else element.removeAttribute("inert");
        });
    }

    function openMobileMenu() {
        if (!mobileMenu) return;

        mobileMenuOpener = document.activeElement;
        mobileMenuPreviousOverflow = document.body.style.overflow;
        mobileMenu.classList.add("is-open");
        mobileMenu.removeAttribute("inert");
        mobileMenu.setAttribute("aria-hidden", "false");
        setMobileMenuBackgroundInert(true);
        document.body.style.overflow = "hidden";
        closeMenuBtn?.focus();
    }

    function closeMobileMenu({ restoreFocus = true } = {}) {
        if (!mobileMenu) return;

        mobileMenu.classList.remove("is-open");
        mobileMenu.setAttribute("aria-hidden", "true");
        mobileMenu.setAttribute("inert", "");
        setMobileMenuBackgroundInert(false);
        document.body.style.overflow = mobileMenuPreviousOverflow;
        if (burgerBtn) burgerBtn.setAttribute("aria-expanded", "false");

        const opener = mobileMenuOpener;
        mobileMenuOpener = null;
        if (restoreFocus && opener && typeof opener.focus === "function") {
            opener.focus();
        }
    }

    function trapMobileMenuFocus(event) {
        if (!mobileMenu?.classList.contains("is-open")) return;

        if (event.key === "Escape") {
            event.preventDefault();
            closeMobileMenu();
            return;
        }

        if (event.key !== "Tab") return;
        const items = getFocusable(mobileMenu);
        if (items.length === 0) return;

        const currentIndex = items.indexOf(document.activeElement);
        const direction = event.shiftKey ? -1 : 1;
        const nextIndex = currentIndex === -1
            ? (event.shiftKey ? items.length - 1 : 0)
            : (currentIndex + direction + items.length) % items.length;
        event.preventDefault();
        items[nextIndex].focus();
    }

    function applyScrollBehavior() {
        document.documentElement.style.scrollBehavior = settings.smoothScroll ? "smooth" : "auto";
    }

    // La préférence reduced-motion prime toujours sur le scroll fluide.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function getScrollBehavior() {
        return prefersReducedMotion.matches ? "auto" : (settings.smoothScroll ? "smooth" : "auto");
    }

    // Scroll progress calculations & active nav highlight (rAF-throttled)
    let scrollTicking = false;
    window.addEventListener("scroll", () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                updateScrollState();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    });
    updateScrollState(); // état initial après refresh (position restaurée)

    function updateScrollState() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

        // Update Bottom Status Bar scroll info
        if (scrollPctText) scrollPctText.innerText = scrollPct;
        if (scrollPctFill) scrollPctFill.style.transform = `scaleX(${scrollPct / 100})`;

        // Reading progress bar (top of screen)
        const scrollFillTop = document.getElementById("reading-progress-bar");
        if (scrollFillTop) scrollFillTop.style.transform = `scaleX(${scrollPct / 100})`;

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
            const isActive = link.getAttribute("href") === `#${currentSectionId}` ||
                (currentSectionId === "hero" && link.getAttribute("href") === "#hero");
            link.classList.toggle("is-active", isActive);
            // Annonce aux lecteurs d'écran la section courante
            if (isActive) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    }

    // Smooth navigation links click handler
    document.querySelectorAll(".nav-link, .site-footer__link, .btn").forEach(link => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    // Close mobile menu if open without stealing focus from the target section.
                    closeMobileMenu({ restoreFocus: false });

                    const offsetTop = target.offsetTop - 60;
                    window.scrollTo({ top: offsetTop, behavior: getScrollBehavior() });

                    // Déplace le focus sur la section cible (lecteurs d'écran)
                    target.setAttribute("tabindex", "-1");
                    target.focus({ preventScroll: true });
                }
            });
        }
    });

    // Back to top button action
    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: getScrollBehavior() });
    });

    /* --- 5. MOBILE DRAWER NAVIGATION MENU --- */
    // (les éléments du menu sont déclarés plus haut, car les liens de
    // navigation peuvent fermer le menu avant cette section.)

    if (burgerBtn && mobileMenu) {
        burgerBtn.addEventListener("click", openMobileMenu);
    }

    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener("click", () => closeMobileMenu());
        mobileMenu.addEventListener("keydown", trapMobileMenuFocus);
    }

    // Close mobile drawer when clicking overlay links
    document.querySelectorAll(".top-nav__overlay-link").forEach(link => {
        link.addEventListener("click", () => {
            closeMobileMenu({ restoreFocus: false });
        });
    });

    // Close mobile drawer when tapping the overlay backdrop
    if (mobileMenu) {
        mobileMenu.addEventListener("click", (e) => {
            if (e.target === mobileMenu) {
                closeMobileMenu();
            }
        });
    }

    /* --- 6. STATS NUMERICAL COUNT-UP ANIMATION --- */
    const counterValues = document.querySelectorAll(".animated-counter__value");
    const skipCountForReducedMotion = prefersReducedMotion.matches;

    const countObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetNum = parseInt(target.getAttribute("data-target"), 10);

                // reduced-motion : affichage direct, sans animation
                if (skipCountForReducedMotion || Number.isNaN(targetNum)) {
                    target.innerText = Number.isNaN(targetNum) ? "0" : targetNum;
                    observer.unobserve(target);
                    return;
                }

                let currentNum = 0;
                const duration = 1200; // Total count milliseconds
                const startTime = performance.now();

                function updateCount(timestamp) {
                    const elapsed = timestamp - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Eased count up
                    currentNum = Math.floor(progress * targetNum);
                    target.innerText = currentNum;

                    if (progress < 1) {
                        requestAnimationFrame(updateCount);
                    } else {
                        target.innerText = targetNum;
                    }
                }

                requestAnimationFrame(updateCount);
                observer.unobserve(target); // Run once
            }
        });
    }, { threshold: 0.5 });

    if ("IntersectionObserver" in window) {
        counterValues.forEach(val => {
            countObserver.observe(val);
        });
    } else {
        // Environnement sans IntersectionObserver : valeurs affichées directement.
        counterValues.forEach(val => {
            const n = parseInt(val.getAttribute("data-target"), 10);
            val.innerText = Number.isNaN(n) ? "0" : n;
        });
    }

    /* --- 9. KEYBOARD SHORTCUTS CONTROLLER (VIM STYLE & JUMPS) --- */
    let lastKey = "";
    let keyTimeout;

    // Respecte la préférence reduced-motion : pas de scroll fluide forcé.
    const reducedMotionScroll = () => getScrollBehavior();

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
            window.scrollBy({ top: 120, behavior: reducedMotionScroll() });
        }
        // Vim scroll up 'k'
        else if (key === "k") {
            window.scrollBy({ top: -120, behavior: reducedMotionScroll() });
        }
        // Vim go to bottom 'G'
        else if (key === "G") {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reducedMotionScroll() });
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
            if (lastKey === "g") {
                lastKey = "";
                clearTimeout(keyTimeout);
                window.scrollTo({ top: 0, behavior: reducedMotionScroll() });
            } else {
                lastKey = "g";
                clearTimeout(keyTimeout);
                keyTimeout = setTimeout(() => { lastKey = ""; }, 1000); // 1s window for double key
            }
        } else if (lastKey === "g") {
            lastKey = "";
            clearTimeout(keyTimeout);
            
            // gh: Jump to Home
            if (key === "h") {
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
            window.scrollTo({ top: offsetTop, behavior: getScrollBehavior() });
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
        }
    }

    /* --- 10. MODALS LOGIC (HASH ROUTING & MOBILE UX INTEGRATED) --- */
    const shortcutsModal = document.getElementById("shortcuts-modal");
    const settingsModal = document.getElementById("settings-modal");
    
    const closeShortcutsBtn = document.getElementById("close-shortcuts-btn");
    const closeSettingsBtn = document.getElementById("close-settings-btn");
    
    const statusBarHelpBtn = document.getElementById("status-bar-help-btn");
    const statusBarSettingsBtn = document.getElementById("status-bar-settings-btn");
    
    const footerShortcutsTrigger = document.getElementById("footer-shortcuts-trigger");
    const footerSettingsTrigger = document.getElementById("footer-settings-trigger");
    
    const saveSettingsBtn = document.getElementById("save-settings-btn");
    const projectModals = document.querySelectorAll(".project-modal");
    const workCards = document.querySelectorAll(".work-card");

    // Snapshot des réglages pour « Annuler » (déclaré ici : utilisé par
    // handleHashChange au chargement initial, avant la section des réglages).
    let settingsBackup = null;

    // --- Focus management for accessible modals ---
    // Mémorise le déclencheur de CHAQUE modale (Map par élément : une pile
    // évite d'écraser le déclencheur quand deux modales se chevauchent).
    // (le slot est stocké sur modal._lastFocus)
    const backgroundForInert = document.querySelectorAll("body > main, body > header, body > footer, .status-bar, .back-to-top");

    function setBackgroundInert(state) {
        backgroundForInert.forEach(el => {
            if (state) el.setAttribute("inert", "");
            else el.removeAttribute("inert");
        });
    }

    // Sélecteur d'éléments focalisables (couvre la plupart des cas).
    const FOCUSABLE_SELECTOR = [
        'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
        'input:not([disabled])', 'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function getFocusable(container) {
        return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
            // offsetParent est null pour les éléments positionnés en fixed,
            // même lorsqu'ils sont visibles (menu mobile et modales).
            .filter(el => el.getClientRects().length > 0 || el === document.activeElement);
    }

    function openModalDirectly(modal) {
        modal.classList.add("is-open");
        document.body.style.overflow = "hidden"; // Prevent background scroll

        // Sauvegarde du déclencheur de cette modale
        modal._lastFocus = document.activeElement;
        setBackgroundInert(true);

        // Focus initial dans la modale
        const focusables = getFocusable(modal);
        const first = focusables[0] || modal;
        // Le bouton de fermeture est le plus pertinent en premier focus
        const closeBtn = modal.querySelector(".modal-close");
        (closeBtn || first).focus();

        // Focus trap : Tab et Shift+Tab restent dans la modale
        if (!modal._trapBound) {
            modal.addEventListener("keydown", (e) => {
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
        modal.classList.remove("is-open");

        // Re-synchronise le formulaire d'options : le « staging » des toggles
        // n'est pas commité sans « Appliquer ». Échap/× annulent aussi l'aperçu
        // du thème (même sémantique que « Annuler »).
        if (modal === settingsModal) {
            if (settingsBackup) {
                settings.theme = settingsBackup.theme;
                applyTheme(settings.theme);
            }
            updateSettingsForm();
        }

        // Restore background scroll ONLY if no other modal is open
        const anyOpen = Array.from(document.querySelectorAll(".modal-overlay")).some(m => m.classList.contains("is-open"));
        if (!anyOpen) {
            document.body.style.overflow = "auto";
            setBackgroundInert(false);
        }

        // Restaure le focus sur l'élément qui a ouvert la modale
        const opener = modal._lastFocus;
        if (opener && typeof opener.focus === "function") {
            opener.focus();
        }
        modal._lastFocus = null;
    }

    // Fermeture : on ne passe par history.back() QUE si l'entrée précédente a été
    // poussée par notre propre pushState (évite de quitter le site depuis un lien
    // externe, et évite le double-Echap sur les chaînes de modales).
    let suppressHashHandlerOnce = false;

    function clearModalHash() {
        if (window.history.replaceState) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
        } else {
            window.location.hash = "";
        }
    }

    function closeActiveModal() {
        const hash = window.location.hash;
        if (hash && (hash.startsWith("#project-") || hash === "#shortcuts" || hash === "#settings")) {
            const state = window.history.state;
            if (state && state.tgModal && window.history.length > 1) {
                suppressHashHandlerOnce = true;
                window.history.back();
            } else {
                // Arrivée par URL directe ou historique externe : fermeture directe.
                // Le hash est conservé : le lien reste partageable et F5 rouvre la modale.
                closeAllModalsDirectly();
            }
        } else {
            closeAllModalsDirectly();
        }
    }

    function closeAllModalsDirectly() {
        document.querySelectorAll(".modal-overlay").forEach(modal => {
            closeModalDirectly(modal);
        });
    }

    // Compatibility alias for other sections (like keydown listener)
    function closeAllModals() {
        closeActiveModal();
    }

    function closeModal(modal) {
        closeActiveModal();
    }

    function openModalViaHash(hash) {
        if (window.history.pushState) {
            // Entrée d'historique balisée : back() ne peut pas quitter le site.
            window.history.pushState({ tgModal: hash }, "", "#" + hash);
            handleHashChange();
        } else {
            window.location.hash = hash;
        }
    }

    function toggleModal(modal) {
        if (modal.classList.contains("is-open")) {
            closeActiveModal();
        } else {
            const modalId = modal.getAttribute("id");
            if (modalId === "shortcuts-modal") openModalViaHash("shortcuts");
            else if (modalId === "settings-modal") openModalViaHash("settings");
        }
    }

    // Hash change event router
    function handleHashChange() {
        const hash = window.location.hash;
        
        // First close all modals directly
        closeAllModalsDirectly();
        
        if (hash.startsWith("#project-")) {
            const projectId = hash.replace("#project-", "");
            const modal = document.getElementById(`project-modal-${projectId}`);
            if (modal) openModalDirectly(modal);
        } else if (hash === "#shortcuts") {
            openModalDirectly(shortcutsModal);
        } else if (hash === "#settings") {
            openModalDirectly(settingsModal);
            // Snapshot pour que « Annuler » puisse restaurer l'état précédent.
            // Capturé une seule fois par session d'ouverture (un switch de modale
            // ne doit pas écraser l'état d'origine).
            if (settingsBackup === null) {
                settingsBackup = { smoothScroll: settings.smoothScroll, customCursor: settings.customCursor, theme: settings.theme };
            }
        }
    }

    // Connect Hash change listener (avec neutralisation après notre propre back())
    window.addEventListener("hashchange", () => {
        if (suppressHashHandlerOnce) {
            suppressHashHandlerOnce = false;
            closeAllModalsDirectly();
            clearModalHash();
            return;
        }
        handleHashChange();
    });

    // Initial load handler (Deep linking support!)
    if (window.location.hash) {
        handleHashChange();
    }

    // Bind triggers to update hashes instead of opening directly
    workCards.forEach(card => {
        const openProject = (e) => {
            e.preventDefault();
            const projectId = card.getAttribute("data-project");
            openModalViaHash(`project-${projectId}`);
        };
        // Clic souris
        card.addEventListener("click", openProject);
        // Clavier : Enter & Espace (cartes role="button" tabindex="0")
        card.addEventListener("keydown", (e) => {
            if (e.repeat) return; // pas de spam d'historique en tenant la touche
            if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                e.preventDefault();
                openProject(e);
            }
        });
    });

    // Close buttons mappings
    if (closeShortcutsBtn) closeShortcutsBtn.addEventListener("click", (e) => { e.preventDefault(); closeActiveModal(); });
    if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", (e) => { e.preventDefault(); closeActiveModal(); });

    projectModals.forEach(modal => {
        const closeBtn = modal.querySelector(".modal-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", (e) => {
                e.preventDefault();
                closeActiveModal();
            });
        }
    });

    // Footers Close buttons mapping (including Project Modals & shortcuts)
    // Le bouton « Annuler » des options est exclu : il a son propre handler
    // (restauration + fermeture) dans la section des réglages.
    const settingsAnnulerBtn = settingsModal ? settingsModal.querySelector(".btn--close-modal") : null;
    document.querySelectorAll(".btn--close-modal").forEach(btn => {
        if (btn === settingsAnnulerBtn) return;
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            closeActiveModal();
        });
    });

    // Modal click outside close
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            closeActiveModal();
        }
    });

    // Help Panel Trigger Links
    if (statusBarHelpBtn) statusBarHelpBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggleModal(shortcutsModal); });
    if (footerShortcutsTrigger) footerShortcutsTrigger.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openModalViaHash("shortcuts"); });

    // Settings Panel Trigger Links
    if (statusBarSettingsBtn) statusBarSettingsBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggleModal(settingsModal); });
    if (footerSettingsTrigger) footerSettingsTrigger.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openModalViaHash("settings"); });

    /* --- 11. OPTIONS PREFERENCES MANAGEMENT --- */
    function updateSettingsForm() {
        if (smoothScrollCheck) smoothScrollCheck.checked = settings.smoothScroll;
        if (customCursorCheck) customCursorCheck.checked = settings.customCursor;
    }

    // Save preferences clicked (« Appliquer ») : persist + applique
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", () => {
            if (smoothScrollCheck) settings.smoothScroll = smoothScrollCheck.checked;
            if (customCursorCheck) settings.customCursor = customCursorCheck.checked;

            settingsBackup = null;
            saveSettings();

            applyCursorVisibility();
            applyScrollBehavior();
            closeModal(settingsModal);
        });
    }

    // « Annuler » : restaure l'état d'avant ouverture (y compris le thème), puis ferme
    if (settingsAnnulerBtn) {
        settingsAnnulerBtn.addEventListener("click", () => {
            if (settingsBackup) {
                settings.smoothScroll = settingsBackup.smoothScroll;
                settings.customCursor = settingsBackup.customCursor;
                settings.theme = settingsBackup.theme;
                settingsBackup = null;

                applyTheme(settings.theme);
                updateSettingsForm();
                applyCursorVisibility();
                applyScrollBehavior();
            }
            closeActiveModal();
        });
    }

    // Theme Selector Buttons inside options (aperçu immédiat, persisté sur « Appliquer »)
    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const themeVal = btn.getAttribute("data-theme-val");
            applyTheme(themeVal);
            settings.theme = themeVal;
        });
    });

    /* --- 12. TERMINAL CONTACT FORM VALIDATION --- */
    const contactForm = document.getElementById("console-contact-form");
    const successMsg = document.getElementById("form-success-msg");

    if (contactForm && successMsg) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Honeypot anti-spam : un robot a rempli le champ invisible -> on ignore
            const honeypot = contactForm.querySelector('[name="_gotcha"]');
            if (honeypot && honeypot.value) return;

            const submitBtn = contactForm.querySelector(".contact-form__submit-btn");
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<svg aria-hidden="true" class="icon-inline icon-inline--spin" style="margin-right: 8px;" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/></svg> Envoi en cours...';
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
                    
                    // Scroll + focus sur le message de succès (annoncé à l'AT via role="status")
                    successMsg.scrollIntoView({ behavior: getScrollBehavior(), block: "nearest" });
                    successMsg.setAttribute("tabindex", "-1");
                    successMsg.focus({ preventScroll: true });
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
                ctx.fillStyle = isDark ? "rgba(10, 11, 13, 0.14)" : "rgba(244, 244, 244, 0.14)";
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
                        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(25, 24, 24, 0.8)";
                    } else if (isOrange) {
                        ctx.fillStyle = isDark ? "rgba(232, 115, 75, 0.28)" : "rgba(226, 83, 39, 0.24)";
                    } else {
                        ctx.fillStyle = isDark ? "rgba(74, 127, 247, 0.13)" : "rgba(27, 93, 239, 0.1)";
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

        // Respecte la préférence reduced-motion : on désactive totalement la pluie.
        const skipRainForReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let rainRunning = false;

        function startRain() {
            if (rainRunning || skipRainForReducedMotion) return;
            rainRunning = true;
            drawRain();
        }

        function stopRain() {
            rainRunning = false;
            cancelAnimationFrame(animationFrameId);
        }

        let rainInView = true;

        initRain();
        startRain();

        // Met en pause quand l'onglet n'est pas visible (économise CPU/batterie).
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stopRain();
            } else if (rainInView) {
                startRain();
            }
        });

        // Met en pause quand la section hero sort de l'écran.
        const heroSection = document.getElementById("hero");
        if (heroSection && "IntersectionObserver" in window) {
            const rainObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    rainInView = entry.isIntersecting;
                    if (entry.isIntersecting) startRain();
                    else stopRain();
                });
            }, { threshold: 0 });
            rainObserver.observe(heroSection);
        }

        // Handle window resizing
        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const wasRunning = rainRunning;
                stopRain();
                initRain();
                if (wasRunning) startRain();
            }, 200); // debounce
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

        // Respecte la préférence reduced-motion : constellation figée statique.
        const skipNetworkForReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let networkRunning = false;

        function startNetwork() {
            if (networkRunning || skipNetworkForReducedMotion) return;
            networkRunning = true;
            drawNetwork();
        }

        function stopNetwork() {
            networkRunning = false;
            cancelAnimationFrame(animationFrameId);
        }

        let networkInView = true;

        initNetwork();
        if (skipNetworkForReducedMotion) {
            // Rend une seule fois : un instantané statique des particules.
            drawNetwork();
            stopNetwork();
        } else {
            startNetwork();
        }

        // Met en pause quand l'onglet n'est pas visible.
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stopNetwork();
            } else if (networkInView && !skipNetworkForReducedMotion) {
                startNetwork();
            }
        });

        // Met en pause quand la section about sort de l'écran.
        if ("IntersectionObserver" in window) {
            const netObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    networkInView = entry.isIntersecting;
                    if (entry.isIntersecting) startNetwork();
                    else stopNetwork();
                });
            }, { threshold: 0 });
            if (aboutSection) netObserver.observe(aboutSection);
        }

        let netResizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(netResizeTimer);
            netResizeTimer = setTimeout(() => {
                const wasRunning = networkRunning;
                stopNetwork();
                initNetwork();
                // Une seule boucle : startNetwork() rappelle drawNetwork().
                if (skipNetworkForReducedMotion) {
                    drawNetwork(); // instantané statique unique
                    stopNetwork();
                } else if (wasRunning) {
                    startNetwork();
                }
            }, 200); // debounce
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
                if (entry.target.classList.contains("counter-card") && !prefersReducedMotion.matches) {
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

    if ("IntersectionObserver" in window) {
        revealTargets.forEach(el => {
            revealObserver.observe(el);
        });
    } else {
        // Fallback : tout est visible immédiatement.
        revealTargets.forEach(el => {
            el.classList.add("is-visible");
        });
    }

    /* --- 16.5. MICRO-INTERACTIONS VISUELLES (typewriter, tilt 3D) --- */

    // Typewriter : le rôle du hero s'écrit à la frappe (sauf reduced-motion)
    const heroRole = document.querySelector(".hero__role");
    if (heroRole && !prefersReducedMotion.matches) {
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
        }, 38);
    }

    // Micro-interactions souris (tilt) : ignorées si l'utilisateur
    // préfère moins de mouvement, ou sur écrans tactiles.
    if (!prefersReducedMotion.matches && window.matchMedia("(pointer: fine)").matches) {

        // Tilt 3D des cartes projets + spot lumineux suivant la souris
        document.querySelectorAll(".work-card").forEach(card => {
            card.addEventListener("mousemove", (e) => {
                if (!card.classList.contains("is-visible")) return;
                const rect = card.getBoundingClientRect();
                const px = e.clientX - rect.left;
                const py = e.clientY - rect.top;
                const rx = ((py / rect.height) - 0.5) * -6;  // ±3°
                const ry = ((px / rect.width) - 0.5) * 6;
                card.style.setProperty("--mx", px + "px");
                card.style.setProperty("--my", py + "px");
                card.style.transform = `translate3d(0,0,0) rotateX(${rx}deg) rotateY(${ry}deg)`;
            });
            card.addEventListener("mouseleave", () => {
                card.style.transform = "";
            });
        });

    }

    /* --- 16.5. SKILL BARS ENTRANCE ANIMATION --- */
    const skillFills = document.querySelectorAll(".cv-skill-bar__fill");
    const skillObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const fill = entry.target;
                const targetWidth = fill.getAttribute("data-width");
                // Trigger width transition dynamically
                fill.style.width = targetWidth;
                observer.unobserve(fill);
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    if ("IntersectionObserver" in window) {
        skillFills.forEach(fill => {
            skillObserver.observe(fill);
        });
    } else {
        // Fallback : barres remplies immédiatement.
        skillFills.forEach(fill => {
            fill.style.width = fill.getAttribute("data-width") || "0";
        });
    }

    // Impression : remplit les barres de compétences même si jamais scrollées
    window.addEventListener("beforeprint", () => {
        skillFills.forEach(fill => {
            fill.style.width = fill.getAttribute("data-width") || "0";
        });
    });
});
