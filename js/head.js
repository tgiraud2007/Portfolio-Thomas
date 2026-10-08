/* ==========================================================================
   Script d'en-tête (chargé dans <head>, AVANT le premier affichage)
   --------------------------------------------------------------------------
   Petit et bloquant exprès : il doit agir avant que la page ne s'affiche.
   1. Thème : applique le thème choisi (clair / sombre) sans flash.
   2. Intro de l'accueil : jouée une seule fois par visite (première page).
   3. Menu de l'accueil : la bonne rubrique soulignée dès le premier affichage.
   4. Transitions entre les pages (View Transitions entre documents, voir
      @view-transition dans css/style.css) :
      - la nouvelle page monte légèrement en arrivant (.page-enter) ;
      - si on arrive depuis une carte du sommaire, son grand numéro glisse
        jusqu'en haut de la fiche (la carte cliquée a été repérée par
        js/main.js, initFicheMorph, qui a laissé un mot dans sessionStorage).
   Navigateurs sans View Transitions : navigation classique, rien ne casse.
   ========================================================================== */
(function () {
  "use strict";
  var root = document.documentElement;
  var MORPH_KEY = "tg-vt-num";

  // 1. Thème. Relancé à l'arrivée sur la page (pagereveal) : une page
  //    préchargée en avance, ou restaurée par le bouton retour, peut avoir
  //    été préparée avec l'ancien thème.
  function applyTheme() {
    try {
      var t = localStorage.getItem("tg-theme");
      if (t === "dark" || t === "light") root.setAttribute("data-theme", t);
      else root.removeAttribute("data-theme");
    } catch (e) { /* stockage indisponible : thème du système */ }
  }
  applyTheme();

  // 2. Intro : seulement si l'accueil est la première page de la visite
  try {
    if (sessionStorage.getItem("tg-intro")) root.classList.add("no-intro");
    else sessionStorage.setItem("tg-intro", "1");
  } catch (e) { root.classList.add("no-intro"); }

  // 3. Menu de l'accueil : « Réalisations » souligné dès le premier affichage
  //    quand on arrive sur /#realisations, ou quand on recharge la page (ou
  //    qu'on y revient) alors qu'on était sur les réalisations. Sans ça,
  //    « Accueil » s'affiche souligné, puis le soulignement saute quand
  //    js/modules/nav-current.js prend le relais (il note la rubrique en cours).
  try {
    var nav = performance.getEntriesByType("navigation")[0];
    var restored = nav && (nav.type === "reload" || nav.type === "back_forward");
    var here = location.pathname + "#realisations";
    if (location.hash === "#realisations" || (restored && sessionStorage.getItem("tg-section") === here)) {
      root.classList.add("at-realisations");
    }
  } catch (e) { /* pas grave : le menu se corrige au chargement */ }

  // 4. Arrivée sur la page
  //    Numéro qui glisse, côté arrivée : renvoie la fonction qui range tout à la
  //    fin de la transition, ou null s'il n'y a rien à faire (animate = false :
  //    on fait seulement le ménage). Aussi utilisé par js/nav.js quand la page
  //    change sans rechargement.
  window.tgMorph = function (animate) {
    var morph = null;
    try {
      morph = JSON.parse(sessionStorage.getItem(MORPH_KEY));
      sessionStorage.removeItem(MORPH_KEY);
    } catch (err) { /* rien à faire */ }

    // Retour sur l'accueil (bouton retour) : on efface le nom posé au clic,
    // sinon l'ancien numéro tenterait de glisser à l'envers
    document.querySelectorAll(".num").forEach(function (n) { n.style.viewTransitionName = ""; });

    var num = document.querySelector(".page-num");
    if (!animate || !num || !morph || morph.to !== location.pathname) return null;
    num.style.viewTransitionName = "fiche-num";
    root.classList.add("vt-num", "has-morph"); // réglages de css/motion.css, section 2
    // Le numéro se pose dans l'état de départ (rempli s'il l'était), puis se vide en douceur
    if (morph.filled) num.classList.add("is-arriving");
    return function () {
      num.style.viewTransitionName = "";
      root.classList.remove("vt-num", "has-morph");
      num.classList.remove("is-arriving");
    };
  };

  window.addEventListener("pagereveal", function (e) {
    applyTheme();
    var vt = e.viewTransition;
    // Page rechargée : pas d'animation (rien ne change, seule la page se recharge)
    var nav = null;
    try { nav = performance.getEntriesByType("navigation")[0]; } catch (err) { /* rien */ }
    if (vt && nav && nav.type === "reload") { vt.skipTransition(); vt = null; }
    if (!vt) { window.tgMorph(false); return; }

    root.classList.add("page-enter");
    setTimeout(function () { root.classList.remove("page-enter", "has-morph"); }, 900);

    var done = window.tgMorph(true);
    if (done) vt.finished.then(done, done);
  });
})();
