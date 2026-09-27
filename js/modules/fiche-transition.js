/* ==========================================================================
   Numéro de fiche qui glisse (accueil → fiche)
   --------------------------------------------------------------------------
   Au clic sur une fiche du sommaire, son grand numéro (« 04 ») glisse et se
   pose en haut de la page de la réalisation, pendant que les deux pages se
   fondent l'une dans l'autre. Uniquement à l'aller : le retour vers
   l'accueil garde le fondu court habituel.

   Principe (View Transitions API) : le navigateur capture la page avant et
   après le changement. Si un élément porte le même view-transition-name
   dans les deux captures, il est animé de sa position de départ à sa
   position d'arrivée. Ce nom doit être unique dans la page : on ne le pose
   donc que sur LE numéro cliqué, juste avant la transition.

   Réglages (durée, courbe, fondu) : css/motion.css, section « Numéro qui
   glisse ». Navigateurs sans View Transitions, ou prefers-reduced-motion :
   la page change normalement.

   Test : sur l'accueil, cliquer sur la fiche 04 → le « 04 » glisse jusqu'en
   haut de la page IPFire. Revenir : simple fondu.
   ========================================================================== */

const NAME = "fiche-num";
const root = document.documentElement;
let pending = false;
let filled = false; // le numéro cliqué était-il rempli (souris dessus) ?

// Opacité d'une couleur calculée, ex. "rgba(255, 138, 107, 0.4)" → 0.4 ; "rgb(…)" → 1
function alpha(color) {
  const m = color.match(/rgba?\(([^)]+)\)/);
  const parts = m ? m[1].split(",") : [];
  return parts.length === 4 ? parseFloat(parts[3]) : 1;
}

function isFiche(url) {
  return /\/realisations\/[^/]+\.html$/.test(new URL(url).pathname);
}

function clear() {
  document.querySelectorAll(".num, .page-num").forEach((el) => { el.style.viewTransitionName = ""; });
  root.classList.remove("vt-num");
  document.body.classList.remove("has-morph");
}

/* Juste avant la capture « avant » : on nomme le numéro de la carte cliquée */
export function beforeSwap({ from, to }) {
  clear();
  pending = false;
  if (!document.startViewTransition || !isFiche(to)) return;
  // Attention : la barre d'adresse montre déjà la nouvelle page, donc les liens
  // relatifs de l'accueil sont résolus par rapport à l'ancienne adresse (from).
  const card = Array.from(document.querySelectorAll("a.entry"))
    .find((a) => new URL(a.getAttribute("href"), from).href === to);
  const num = card && card.querySelector(".num");
  if (!num) return; // on ne vient pas du sommaire : fondu normal
  const r = num.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) return; // numéro hors de l'écran
  num.style.viewTransitionName = NAME;
  filled = alpha(getComputedStyle(num).color) > 0.5;
  root.classList.add("vt-num"); // active les réglages de css/motion.css
  pending = true;
}

/* Juste après la mise en place de la fiche (capture « après ») */
export function afterSwap() {
  if (!pending) return;
  pending = false;
  const target = document.querySelector(".page-num");
  if (!target) { root.classList.remove("vt-num"); return; }
  target.style.viewTransitionName = NAME;
  // Le numéro se pose dans le même état qu'au départ (rempli s'il l'était),
  // puis se vide en douceur une fois posé : pas de changement brusque.
  if (filled) {
    target.classList.add("is-arriving");
    setTimeout(() => target.classList.remove("is-arriving"), 750);
  }
  // Le numéro arrive en glissant : pas d'animation d'entrée en plus sur la fiche
  document.body.classList.add("has-morph");
  // La classe vt-num ne sert que pendant la transition (≈ 0,6 s)
  setTimeout(() => root.classList.remove("vt-num"), 800);
}

export function init() {}
export function destroy() {}
