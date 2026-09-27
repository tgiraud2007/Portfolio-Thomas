/* ==========================================================================
   Défilement animé vers une section de la même page
   --------------------------------------------------------------------------
   Ex. : sur l'accueil, clic sur « Réalisations » (menu), « Voir mes
   réalisations » ou un lien du pied de page → la page glisse jusqu'à la
   section au lieu de sauter d'un coup.

   Pourquoi en JavaScript ? La règle CSS scroll-behavior: smooth dépend du
   navigateur, qui peut l'ignorer (réglages, défilement fluide désactivé…).
   Ici, l'animation est la même partout.

   - Durée selon la distance : 0,5 à 0,9 s, courbe douce au départ et à l'arrivée.
   - Molette, pavé tactile, toucher ou clavier pendant l'animation → elle
     s'arrête et on rend la main.
   - prefers-reduced-motion : saut direct, comme avant.
   - Le lien d'évitement « Aller au contenu » reste instantané (clavier).

   Test : sur l'accueil, cliquer « Réalisations » dans le menu.
   ========================================================================== */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let frame = 0;

// Démarrage et arrivée en douceur (« ease-in-out » cubique)
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
  ["wheel", "touchstart", "keydown"].forEach((type) => window.removeEventListener(type, stop));
}

/* Position de défilement pour que la cible s'arrête sous l'en-tête collant */
function targetY(target) {
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return Math.max(0, Math.min(max, target.getBoundingClientRect().top + window.scrollY - padding - margin));
}

function glideTo(target) {
  stop();
  const start = window.scrollY;
  const distance = targetY(target) - start;
  if (Math.abs(distance) < 2) return;
  const duration = Math.min(900, Math.max(500, Math.abs(distance) * 0.6));
  const t0 = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    // behavior "instant" : sinon le scroll-behavior: smooth du CSS lisserait chaque pas
    window.scrollTo({ top: start + distance * ease(t), behavior: "instant" });
    if (t < 1) frame = requestAnimationFrame(step);
    else stop();
  };
  ["wheel", "touchstart", "keydown"].forEach((type) => window.addEventListener(type, stop, { passive: true }));
  frame = requestAnimationFrame(step);
}

function onClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest("a[href*='#']");
  if (!a || a.classList.contains("skip-link") || reduceMotion.matches) return;
  const url = new URL(a.href, location.href);
  // Seulement pour une ancre de la page actuelle (les autres pages : js/main.js s'en charge)
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!target) return;
  e.preventDefault();
  if (location.hash !== url.hash) history.pushState({ y: window.scrollY }, "", url.hash);
  glideTo(target);
  // Accessibilité : le focus clavier suit la section atteinte
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

export function init() {
  document.addEventListener("click", onClick);
}

export function destroy() {
  document.removeEventListener("click", onClick);
  stop();
}
