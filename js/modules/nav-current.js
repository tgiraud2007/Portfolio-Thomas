/* ==========================================================================
   Menu : « Accueil » ou « Réalisations » souligné selon la position (accueil)
   --------------------------------------------------------------------------
   Sur l'accueil, les réalisations sont une section de la même page. Dès que
   la section #realisations arrive dans la moitié haute de l'écran, le
   soulignement passe de « Accueil » à « Réalisations » ; il revient si on
   remonte. (Le soulignement est dessiné par le CSS sur [aria-current], et
   par la classe .at-realisations sur <html>.)

   aria-current="page"     → la page actuelle (Accueil)
   aria-current="location" → l'endroit actuel dans la page (Réalisations)

   La rubrique en cours est notée dans sessionStorage : si on recharge la
   page, js/head.js souligne la bonne rubrique dès le premier affichage.

   Test : sur l'accueil, cliquer « Réalisations » ou descendre jusqu'au
   sommaire → le soulignement glisse sur « Réalisations ». Actualiser la
   page → « Réalisations » reste souligné, sans passer par « Accueil ».
   ========================================================================== */

const root = document.documentElement;
let section = null;
let accueil = null;
let realisations = null;
let ticking = false;
let dedansAvant = null;

function update() {
  ticking = false;
  if (!section || !section.isConnected) return; // on a quitté l'accueil
  const dedans = section.getBoundingClientRect().top < window.innerHeight * 0.45;
  if (dedans === dedansAvant) return; // rien n'a changé
  dedansAvant = dedans;
  if (dedans) {
    accueil.removeAttribute("aria-current");
    realisations.setAttribute("aria-current", "location");
  } else {
    accueil.setAttribute("aria-current", "page");
    realisations.removeAttribute("aria-current");
  }
  root.classList.toggle("at-realisations", dedans);
  try { sessionStorage.setItem("tg-section", dedans ? location.pathname + "#realisations" : ""); } catch (e) { /* stockage indisponible */ }
}

function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

let listening = false;

export function init() {
  section = null;
  dedansAvant = null;
  const found = document.getElementById("realisations");
  const nav = document.querySelector(".masthead nav");
  if (!found || !nav) return;
  accueil = nav.querySelector('a[data-nav="accueil"]');
  realisations = nav.querySelector('a[href$="#realisations"]');
  if (!accueil || !realisations) return;
  section = found;
  if (!listening) { // une seule fois, même si on revient plusieurs fois sur l'accueil
    listening = true;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", update); // au moment de recharger ou de quitter : rubrique notée à coup sûr
  }
  update(); // position de départ
}
