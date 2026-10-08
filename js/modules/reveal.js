/* ==========================================================================
   Apparitions au défilement
   --------------------------------------------------------------------------
   Les éléments listés dans SELECTEUR, s'ils sont SOUS l'écran quand la page
   s'affiche, sont cachés (classe .reveal) puis apparaissent quand on arrive
   dessus (classe .is-in). L'animation elle-même est dans css/motion.css,
   section « Apparitions ».

   - Ce qui est déjà visible au chargement n'est jamais caché.
   - L'animation se déclenche quand 15 % de l'élément est à l'écran, et se
     joue en entier (≈ 0,6 s), quelle que soit la vitesse de défilement.
   - Plusieurs éléments qui arrivent en même temps sont légèrement décalés.
   - prefers-reduced-motion : rien n'est caché, rien ne bouge.

   Test : recharger une page, descendre → les blocs montent et apparaissent.
   ========================================================================== */

const SELECTEUR = [
  ".entry",            // fiches du sommaire (accueil)
  ".stat",             // chiffres (accueil)
  ".timeline > li",    // étapes du Parcours
  ".skills > div",     // compétences du Parcours
  ".mini article",     // Autres TP
  ".prose > h2",       // intertitres des fiches (le filet se trace)
  ".prose > .fig",     // schémas des fiches
].join(", ");

const DECALAGE = 0.08; // secondes entre deux éléments qui arrivent ensemble
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let observer = null;

function show(entries) {
  const arriving = entries.filter((e) => e.isIntersecting).map((e) => e.target);
  // Du haut vers le bas, puis de gauche à droite : l'ordre de lecture
  arriving.sort((a, b) => {
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    return Math.abs(ra.top - rb.top) > 20 ? ra.top - rb.top : ra.left - rb.left;
  });
  arriving.forEach((el, i) => {
    el.style.setProperty("--reveal-delay", Math.min(i, 4) * DECALAGE + "s");
    el.classList.add("is-in");
    observer.unobserve(el);
  });
}

export function init() {
  if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
  const below = Array.from(document.querySelectorAll(SELECTEUR))
    .filter((el) => el.getBoundingClientRect().top > window.innerHeight);
  if (!below.length) return;
  observer = new IntersectionObserver(show, { threshold: 0.15 });
  below.forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });
}
