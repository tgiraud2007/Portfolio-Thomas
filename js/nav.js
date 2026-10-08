/* ==========================================================================
   Navigation entre les pages, sans rechargement (Swup, js/vendor/swup.js)
   --------------------------------------------------------------------------
   Au clic sur un lien du site, Swup récupère la page demandée en arrière-plan
   et remplace seulement le contenu (<main id="contenu">) : l'en-tête, le menu
   et le pied de page restent en place, comme sur une seule et même page.
   L'adresse change normalement : bouton retour, liens partagés, Google et
   lecteurs d'écran fonctionnent comme avant.

   - Animation : le contenu glisse de côté, dans l'ordre du menu (Accueil →
     fiches 01 à 06 → Parcours → Contact) : vers la gauche quand on avance,
     vers la droite quand on recule. Classes .slide-next / .slide-prev sur
     <html>, réglages dans css/style.css (View Transitions du navigateur ;
     sans elles, en CSS sur .transition-page). Page sans place dans l'ordre
     (404) : simple fondu.
   - Numéro qui glisse (accueil → fiche) : repéré au clic par js/main.js,
     posé à l'arrivée par window.tgMorph (js/head.js).
   - Préchargement : les pages des liens visibles ou survolés sont récupérées
     en avance (extension Preload), le changement est donc immédiat.
   - Accessibilité : le titre de la nouvelle page est annoncé aux lecteurs
     d'écran et reçoit le focus (extension A11y). « Réduire les animations » :
     pas d'animation.
   - Après chaque changement : l'événement « tg:page » relance ce qui dépend
     du contenu (js/main.js et les modules de js/app.js).
   - En cas de problème (page introuvable, erreur réseau, script bloqué),
     le navigateur charge la page normalement : rien ne casse.

   Test : cliquer « Parcours » → seul le contenu change, l'en-tête ne bouge
   pas. Bouton retour → on revient où on était sur la page précédente.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.Swup || !window.fetch || !window.DOMParser) return;

  var root = document.documentElement;
  var positions = {}; // position de défilement de chaque page quittée (bouton retour)
  var morphDone = null;
  var slide = "";
  var fromRank = null; // place de la page quittée, notée avant que le contenu change
  var target = null;   // lien du menu cliqué (souris dessus), voir visit:start

  // Place d'une page dans l'ordre du menu : Accueil 0, fiches 1,01 à 1,06
  // (d'après leur grand numéro), Parcours 2, Contact 3 ; null = aucune (404)
  function rank(url, doc) {
    var path = url.split(/[?#]/)[0];
    if (path === "/" || path === "/index.html") return 0;
    if (path.indexOf("/realisations/") === 0) {
      var num = doc.querySelector(".page-num");
      return 1 + (num ? parseInt(num.textContent, 10) || 0 : 0) / 100;
    }
    if (path === "/parcours.html") return 2;
    if (path === "/contact.html") return 3;
    return null;
  }

  // Liens vers autre chose qu'une page du site (CV en PDF, sitemap…) : navigation normale
  function isPage(url) {
    var path = url.split(/[?#]/)[0];
    return /(\/|\.html)$/.test(path);
  }

  var swup = new Swup({
    containers: ["#contenu"],
    animationSelector: '[class*="transition-"]',
    native: true,                 // View Transitions quand le navigateur les connaît
    animateHistoryBrowsing: true, // fondu aussi avec les boutons précédent / suivant
    ignoreVisit: function (url, opts) {
      var el = opts && opts.el;
      return !isPage(url) || !!(el && el.closest("[data-no-swup]"));
    },
    plugins: [
      new SwupPreloadPlugin({ preloadVisibleLinks: true }),
      new SwupA11yPlugin({
        headingSelector: ["main h1", "h1"],
        announcements: { visit: "Page : {title}", url: "Nouvelle page : {url}" },
      }),
    ],
  });

  // Avec View Transitions, c'est le navigateur qui anime : pas d'animation CSS à attendre
  ["animation:out:await", "animation:in:await"].forEach(function (hook) {
    swup.hooks.before(hook, function (visit, args) {
      if (visit.animation.native) args.skip = true;
    });
  });

  swup.hooks.on("visit:start", function (visit) {
    // L'animation ne démarre qu'une fois la page reçue : sinon, si elle n'est
    // pas encore préchargée, le navigateur fige l'écran pendant le chargement
    // (le numéro « saute »), et au-delà de 4 s il annule l'animation.
    visit.animation.wait = true;
    positions[visit.from.url] = window.scrollY;
    fromRank = rank(visit.from.url, document);
    // Lien du menu cliqué à la souris : son soulignement de survol reste affiché
    // pendant que le trait du menu glisse jusqu'à lui (sinon il s'efface d'un coup)
    var el = visit.trigger.el;
    if (el && el.matches && el.matches(".masthead nav a:hover")) { target = el; el.classList.add("is-target"); }
    root.classList.add("no-intro"); // l'intro de l'accueil ne se rejoue pas
  });

  // Nouveau contenu en place : le menu suit (rubrique soulignée, barre de lecture des fiches)
  swup.hooks.on("content:replace", function (visit) {
    var incoming = visit.to.document && visit.to.document.querySelector(".masthead");
    var masthead = document.querySelector(".masthead");
    if (incoming && masthead) {
      masthead.toggleAttribute("data-progress", incoming.hasAttribute("data-progress"));
      masthead.querySelectorAll("[data-nav]").forEach(function (a) {
        var twin = incoming.querySelector('[data-nav="' + a.getAttribute("data-nav") + '"]');
        var value = twin && twin.getAttribute("aria-current");
        if (value) a.setAttribute("aria-current", value);
        else a.removeAttribute("aria-current");
      });
    }
    root.classList.toggle("at-realisations", visit.to.hash === "#realisations");
    if (window.tgMorph) morphDone = window.tgMorph(visit.animation.native && visit.animation.animate);

    // Sens du glissement (pas quand le numéro de la fiche glisse : fondu seul)
    var to = visit.to.document ? rank(visit.to.url, visit.to.document) : null;
    slide = !morphDone && fromRank !== null && to !== null && fromRank !== to ? (to > fromRank ? "slide-next" : "slide-prev") : "";
    if (slide) root.classList.add(slide);
  });

  // Défilement : en haut de la nouvelle page, sur l'ancre demandée, ou là où
  // on était (bouton retour). Instantané : la page ne défile pas pendant le fondu.
  swup.hooks.replace("content:scroll", function (visit) {
    var saved = positions[visit.to.url];
    if (visit.history.popstate && saved !== undefined) {
      window.scrollTo({ top: saved, left: 0, behavior: "instant" });
      return;
    }
    var anchor = visit.to.hash && swup.getAnchorElement(visit.to.hash);
    if (anchor) anchor.scrollIntoView({ behavior: "instant" });
    else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });

  swup.hooks.on("page:view", function () {
    document.dispatchEvent(new Event("tg:page"));
  });

  swup.hooks.on("visit:end", function () {
    if (morphDone) { morphDone(); morphDone = null; }
    if (slide) { root.classList.remove(slide); slide = ""; }
    if (target) { target.classList.remove("is-target"); target = null; }
  });
})();
