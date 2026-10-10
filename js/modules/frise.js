/* ==========================================================================
   Frise du Parcours, sur téléphone et tablette
   --------------------------------------------------------------------------
   Sur ordinateur, le trait rouge et les points de la frise sont animés en CSS
   pur (css/motion.css, section 4). Sur téléphone, ce CSS se règle sur la
   hauteur de l'écran, qui change quand la barre d'adresse du navigateur se
   cache ou revient : le trait sautait d'un coup.

   Ici, la même ligne de lecture (entre 62 % et 64 % de la hauteur de
   l'écran) est calculée avec une hauteur qui ne bouge pas avec la barre
   d'adresse (documentElement.clientHeight). Le trait ne dépend donc plus
   que du défilement. Le module pose .frise-js sur chaque frise : le CSS
   coupe alors ses propres animations et suit --frise-p (0 → 1), et chaque
   étape franchie reçoit .is-on (point allumé).

   prefers-reduced-motion : rien n'est fait, la frise reste entièrement tracée.

   Test : sur téléphone, page Parcours, descendre puis remonter un peu pour
   faire revenir la barre d'adresse → le trait ne bouge pas.
   ========================================================================== */

const touch = window.matchMedia("(hover: none), (pointer: coarse)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let frises = [];
let ticking = false;
let listening = false;

// Bande de lecture (en px depuis le haut de l'écran) : mêmes valeurs que le CSS
function band() {
  const h = document.documentElement.clientHeight;
  return { top: h * 0.62, bottom: h * 0.64 };
}

// Avancement « cover » d'un bloc dans la bande : 0 quand son haut atteint le
// bas de la bande, 1 quand son bas en atteint le haut (comme view-timeline)
function progress(top, height, b) {
  const p = (b.bottom - top) / (height + (b.bottom - b.top));
  return Math.min(1, Math.max(0, p));
}

function update() {
  ticking = false;
  const b = band();
  frises.forEach((ol) => {
    const top = ol.getBoundingClientRect().top;
    ol.style.setProperty("--frise-p", progress(top, ol.offsetHeight, b).toFixed(4));
    // Étapes : offsetTop ignore le léger décalage des apparitions (.reveal)
    for (const li of ol.children) {
      const p = progress(top + li.offsetTop, li.offsetHeight, b);
      li.classList.toggle("is-on", p >= 0.09); // milieu de l'allumage en CSS (4 % → 14 %)
    }
  });
}

function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

export function init() {
  frises.forEach((ol) => ol.classList.remove("frise-js")); // page précédente
  frises = [];
  if (!touch.matches || reduceMotion.matches) return;
  frises = Array.from(document.querySelectorAll(".timeline"));
  if (!frises.length) return;
  frises.forEach((ol) => ol.classList.add("frise-js"));
  if (!listening) {
    listening = true;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }
  update();
}
