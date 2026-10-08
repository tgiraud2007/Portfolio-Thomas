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
  window.addEventListener("pagereveal", function (e) {
    applyTheme();

    var morph = null;
    try {
      morph = JSON.parse(sessionStorage.getItem(MORPH_KEY));
      sessionStorage.removeItem(MORPH_KEY);
    } catch (err) { /* rien à faire */ }

    // Retour sur l'accueil (bouton retour) : on efface le nom posé au clic,
    // sinon l'ancien numéro tenterait de glisser à l'envers
    document.querySelectorAll(".num").forEach(function (n) { n.style.viewTransitionName = ""; });

    var vt = e.viewTransition;
    if (!vt) return;

    root.classList.add("page-enter");
    setTimeout(function () { root.classList.remove("page-enter", "has-morph"); }, 900);

    var num = document.querySelector(".page-num");
    if (!num || !morph || morph.to !== location.pathname) return;
    num.style.viewTransitionName = "fiche-num";
    root.classList.add("vt-num", "has-morph"); // réglages de css/motion.css, section 2
    // Le numéro se pose dans l'état de départ (rempli s'il l'était), puis se vide en douceur
    if (morph.filled) num.classList.add("is-arriving");
    var done = function () {
      num.style.viewTransitionName = "";
      root.classList.remove("vt-num");
      num.classList.remove("is-arriving");
    };
    vt.finished.then(done, done);
  });
})();
