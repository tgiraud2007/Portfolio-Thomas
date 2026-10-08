/* ==========================================================================
   En-tête collant
   --------------------------------------------------------------------------
   1. Mesure la hauteur réelle de l'en-tête et la publie dans la variable CSS
      --header-h. Le CSS s'en sert pour que les ancres (#realisations…) et la
      fiche technique collante ne passent pas sous l'en-tête.
   2. Sur téléphone (≤ 640 px), l'en-tête fait deux lignes et prendrait trop
      de place : il se cache quand on descend et revient dès qu'on remonte.
      Sur ordinateur, il reste toujours visible.

   Test : sur téléphone (ou fenêtre étroite), descendre → l'en-tête disparaît ;
   remonter un peu → il revient. Tabuler jusqu'au menu le fait aussi revenir.
   ========================================================================== */

const root = document.documentElement;
const mobile = window.matchMedia("(max-width: 640px)");
const THRESHOLD = 6; // px de défilement ignorés (évite de clignoter sur les petits mouvements)

let masthead = null;
let lastY = null; // dernière position connue (null = pas encore mesurée)
let ticking = false;

function setHidden(hidden) {
  masthead.classList.toggle("is-hidden", hidden);
}

function update() {
  ticking = false;
  const y = window.scrollY;
  if (lastY === null) { lastY = y; return; } // premier défilement : on prend juste la mesure
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
  if (masthead) return; // déjà en place : l'en-tête ne change pas d'une page à l'autre
  masthead = document.querySelector(".masthead");
  if (!masthead) return;

  new ResizeObserver(([entry]) => {
    const h = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? masthead.offsetHeight);
    root.style.setProperty("--header-h", h + "px");
  }).observe(masthead);

  window.addEventListener("scroll", onScroll, { passive: true });
  masthead.addEventListener("focusin", () => setHidden(false)); // navigation au clavier : le menu doit être visible
}
