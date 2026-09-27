/* ==========================================================================
   Menu : « Accueil » ou « Réalisations » souligné selon la position (accueil)
   --------------------------------------------------------------------------
   Sur l'accueil, les réalisations sont une section de la même page. Dès que
   la section #realisations arrive dans la moitié haute de l'écran, le
   soulignement passe de « Accueil » à « Réalisations » ; il revient si on
   remonte. (Le soulignement est dessiné par le CSS sur [aria-current].)

   aria-current="page"     → la page actuelle (Accueil)
   aria-current="location" → l'endroit actuel dans la page (Réalisations)

   Test : sur l'accueil, cliquer « Réalisations » ou descendre jusqu'au
   sommaire → le soulignement glisse sur « Réalisations ».
   ========================================================================== */

let section = null;
let accueil = null;
let realisations = null;
let ticking = false;
let frame = 0;

function update() {
  ticking = false;
  if (!section) return;
  const dedans = section.getBoundingClientRect().top < window.innerHeight * 0.45;
  if (dedans) {
    accueil.removeAttribute("aria-current");
    realisations.setAttribute("aria-current", "location");
  } else {
    accueil.setAttribute("aria-current", "page");
    realisations.removeAttribute("aria-current");
  }
}

function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

export function init() {
  section = document.getElementById("realisations");
  const nav = document.querySelector(".masthead nav");
  if (!section || !nav) { section = null; return; }
  accueil = nav.querySelector('a[aria-current="page"]');
  realisations = nav.querySelector('a[href$="#realisations"]');
  if (!accueil || !realisations) { section = null; return; }
  window.addEventListener("scroll", onScroll, { passive: true });
  // Image suivante : après un changement de page, la position de défilement
  // (ancre #realisations) n'est définitive qu'à ce moment-là
  frame = requestAnimationFrame(update);
}

export function destroy() {
  cancelAnimationFrame(frame);
  window.removeEventListener("scroll", onScroll);
  section = accueil = realisations = null;
}
