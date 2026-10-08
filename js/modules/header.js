/* ==========================================================================
   En-tête collant
   --------------------------------------------------------------------------
   1. Mesure la hauteur réelle de l'en-tête et la publie dans la variable CSS
      --header-h. Le CSS s'en sert pour que les ancres (#realisations…) et la
      fiche technique collante ne passent pas sous l'en-tête.
   2. Sur téléphone (≤ 640 px), l'en-tête fait deux lignes et prendrait trop
      de place : il se cache quand on descend et revient dès qu'on remonte.
      Sur ordinateur, il reste toujours visible.
      Seul un défilement fait par le visiteur compte (doigt qui glisse,
      molette, touches) : les sauts automatiques (ancre, position retrouvée,
      page qui se décale quand les polices arrivent) ne le cachent jamais.

   Test : sur téléphone (ou fenêtre étroite), descendre → l'en-tête disparaît ;
   remonter un peu → il revient. Tabuler jusqu'au menu le fait aussi revenir.
   ========================================================================== */

const root = document.documentElement;
const mobile = window.matchMedia("(max-width: 640px)");
const THRESHOLD = 6; // px de défilement ignorés (évite de clignoter sur les petits mouvements)

let masthead = null;
let lastY = null; // dernière position connue (null = pas encore mesurée)
let ticking = false;
let calmUntil = 0; // après un changement de page : on ignore les défilements un court instant
let lastGesture = -Infinity; // dernier défilement fait par le visiteur
const GESTURE_MS = 1200; // le défilement continue un peu après le doigt (élan)
const SCROLL_KEYS = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];

function setHidden(hidden) {
  masthead.classList.toggle("is-hidden", hidden);
}

function update() {
  ticking = false;
  const y = window.scrollY;
  const now = performance.now();
  // Pas un défilement du visiteur (pendant ou juste après un changement de page,
  // .is-changing posée par Swup) : on prend juste la mesure
  const changing = root.classList.contains("is-changing");
  if (lastY === null || changing || now < calmUntil || now - lastGesture > GESTURE_MS) {
    lastY = y;
    if (y < masthead.offsetHeight) setHidden(false);
    return;
  }
  const delta = y - lastY;
  if (!mobile.matches || y < masthead.offsetHeight) {
    setHidden(false); // sur ordinateur, ou tout en haut de la page : toujours visible
  } else if (delta > THRESHOLD) {
    setHidden(true); // on descend
  } else if (delta < -THRESHOLD) {
    setHidden(false); // on remonte
  }
  if (Math.abs(delta) > THRESHOLD) lastY = y;
}

// Le calcul est regroupé une fois par image (requestAnimationFrame) pour rester fluide
function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

export function init() {
  if (masthead) {
    // Changement de page (l'en-tête reste en place) : il réapparaît, et le saut
    // de défilement de la nouvelle page (haut de page, position retrouvée au
    // retour) ne compte pas comme « on descend »
    // Pendant 0,6 s, aucun défilement ne le cache : sur téléphone, le navigateur
    // ajuste encore la position juste après l'arrivée (ancre #realisations,
    // polices, barre d'adresse), ce qui le faisait remonter à moitié.
    lastY = null;
    calmUntil = performance.now() + 600;
    setHidden(false);
    return;
  }
  masthead = document.querySelector(".masthead");
  if (!masthead) return;

  new ResizeObserver(([entry]) => {
    const h = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? masthead.offsetHeight);
    root.style.setProperty("--header-h", h + "px");
  }).observe(masthead);

  window.addEventListener("scroll", onScroll, { passive: true });
  const gesture = () => { lastGesture = performance.now(); };
  window.addEventListener("touchmove", gesture, { passive: true }); // un simple toucher (lien) ne compte pas
  // Clic sur un lien (ancre, autre page) : le défilement qui suit est automatique,
  // même si le doigt a un peu glissé en touchant le lien
  document.addEventListener("click", () => { lastGesture = -Infinity; }, true);
  window.addEventListener("wheel", gesture, { passive: true });
  window.addEventListener("keydown", (e) => { if (SCROLL_KEYS.includes(e.key)) gesture(); });
  masthead.addEventListener("focusin", () => setHidden(false)); // navigation au clavier : le menu doit être visible
}
