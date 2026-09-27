/* Portfolio Thomas Giraud
   - navigation fluide entre les pages (le contenu est remplacé sans recharger la page)
   - thème clair / sombre, schéma interactif, copie de l'e-mail, formulaire de contact
   Les animations, l'en-tête collant et le filtre par compétence sont dans
   js/app.js et js/modules/ (branchés via les événements tg:before-swap / tg:after-swap). */
(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "tg-theme";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =====================================================================
     Fonctions de page : relancées après chaque changement de page
     ===================================================================== */

  function currentTheme() {
    var forced = root.getAttribute("data-theme");
    if (forced) return forced;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function initTheme() {
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      var label = function () {
        var next = currentTheme() === "dark" ? "clair" : "sombre";
        btn.setAttribute("aria-label", "Passer au thème " + next);
        btn.setAttribute("title", "Passer au thème " + next);
      };
      label();
      btn.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        var apply = function () {
          root.setAttribute("data-theme", next);
          try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* stockage indisponible */ }
          label();
        };
        if (!document.startViewTransition || reduceMotion) { apply(); return; }

        /* Le nouveau thème s'étend en cercle depuis le bouton (View Transitions) :
           le navigateur capture la page avant et après le changement, puis on
           découpe la capture « après » avec un cercle qui grandit.
           Rayon final = distance du bouton au coin de l'écran le plus éloigné. */
        var r = btn.getBoundingClientRect();
        var x = r.left + r.width / 2;
        var y = r.top + r.height / 2;
        var end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        root.classList.add("theme-vt"); // voir « Changement de thème » dans css/style.css
        var transition = document.startViewTransition(apply);
        transition.ready.then(function () {
          root.animate(
            { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + end + "px at " + x + "px " + y + "px)"] },
            { duration: 550, easing: "cubic-bezier(.2, .7, .1, 1)", pseudoElement: "::view-transition-new(root)" }
          );
        }).catch(function () {});
        transition.finished.then(function () { root.classList.remove("theme-vt"); }, function () { root.classList.remove("theme-vt"); });
      });
    });
  }

  function initSchema() {
    var svg = document.getElementById("topo");
    var note = document.getElementById("fig-note");
    if (!svg || !note) return;
    var initial = note.innerHTML;
    if (reduceMotion && svg.pauseAnimations) svg.pauseAnimations();
    var nodes = svg.querySelectorAll(".node");
    var clear = function () { nodes.forEach(function (n) { n.classList.remove("is-active"); }); };
    nodes.forEach(function (node) {
      var show = function () {
        clear();
        node.classList.add("is-active");
        note.innerHTML = node.getAttribute("data-note");
      };
      node.addEventListener("mouseenter", show);
      node.addEventListener("focus", show);
      node.addEventListener("click", show);
      node.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); }
      });
    });
    svg.addEventListener("mouseleave", function () { clear(); note.innerHTML = initial; });
  }

  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        var done = function (msg) {
          var old = btn.textContent;
          btn.textContent = msg;
          setTimeout(function () { btn.textContent = old; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done("Copié"); }, function () { done("Sélectionnez l'adresse"); });
        } else {
          done("Sélectionnez l'adresse");
        }
      });
    });
  }

  function initForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var msg = document.getElementById("form-msg");
    var submit = form.querySelector("button[type=submit]");
    var show = function (text, isError) {
      msg.textContent = text;
      msg.classList.toggle("is-error", !!isError);
      msg.hidden = false;
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;
      form.querySelectorAll("[required]").forEach(function (field) {
        var ok = field.checkValidity();
        field.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        show("Il manque une information : remplissez votre nom, un e-mail valide et votre message.", true);
        firstInvalid.focus();
        return;
      }
      submit.disabled = true;
      submit.textContent = "Envoi…";
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          show("Message envoyé. Merci, je vous réponds rapidement.", false);
        })
        .catch(function () {
          show("L'envoi n'a pas fonctionné. Écrivez-moi directement à tgiraud0604@gmail.com.", true);
        })
        .then(function () {
          submit.disabled = false;
          submit.textContent = "Envoyer";
        });
    });
  }

  // Moins d'animations demandé : on fige les animations intégrées aux schémas SVG (paquets qui circulent)
  function pauseSvgAnimations() {
    if (!reduceMotion) return;
    document.querySelectorAll("svg").forEach(function (svg) { if (svg.pauseAnimations) svg.pauseAnimations(); });
  }

  function initPage() {
    pauseSvgAnimations();
    initTheme();
    initSchema();
    initCopy();
    initForm();
  }

  /* =====================================================================
     Navigation fluide
     Au clic sur un lien interne, la page suivante est téléchargée puis son
     contenu remplace celui de la page actuelle : pas de rechargement, donc
     pas de flash (polices, styles et en-tête restent en place).
     En cas de problème, on retombe sur une navigation classique.
     ===================================================================== */

  var canRoute = window.fetch && window.history && history.pushState && window.DOMParser && location.protocol.indexOf("http") === 0;
  var cache = {};
  var currentPage = pageUrl(location.href);
  var enterTimer = null;

  // Barre de chargement : n'apparaît que si la page met plus de 150 ms à arriver
  var bar = document.createElement("div");
  bar.id = "nav-progress";
  bar.setAttribute("aria-hidden", "true");
  root.appendChild(bar);
  var barTimer = null;
  function progressStart() {
    clearTimeout(barTimer);
    bar.className = "";
    barTimer = setTimeout(function () { bar.className = "is-loading"; }, 150);
  }
  function progressEnd() {
    clearTimeout(barTimer);
    if (bar.className === "is-loading") {
      bar.className = "is-done";
      setTimeout(function () { bar.className = ""; }, 600);
    } else {
      bar.className = "";
    }
  }

  function pageUrl(href) {
    var url = new URL(href, location.href);
    url.hash = "";
    return url.href;
  }

  function isInternalPage(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto|tel):/.test(href)) return false;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    return /(\.html|\/)$/.test(url.pathname) && !/404\.html$/.test(url.pathname);
  }

  function load(url) {
    if (!cache[url]) {
      cache[url] = fetch(url, { credentials: "same-origin" }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      }).catch(function (err) { delete cache[url]; throw err; });
    }
    return cache[url];
  }

  function scrollToTarget(hash, y) {
    var target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    root.style.scrollBehavior = "auto";
    if (target) target.scrollIntoView();
    else window.scrollTo(0, y || 0);
    root.style.scrollBehavior = "";
  }

  /* Événements pour les modules de js/app.js (animations, en-tête, filtres) :
     - "tg:before-swap" juste avant que la page actuelle soit remplacée
       (le moment de tout arrêter proprement) ;
     - "tg:after-swap" juste après que la nouvelle page est en place.
     detail.from / detail.to = adresses de l'ancienne et de la nouvelle page. */
  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail }));
  }

  function swap(html, hash, y, detail) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    document.title = doc.title;
    var desc = doc.querySelector('meta[name="description"]');
    var here = document.querySelector('meta[name="description"]');
    if (desc && here) here.setAttribute("content", desc.getAttribute("content"));
    doc.querySelectorAll("script").forEach(function (s) { s.remove(); });
    document.body.innerHTML = doc.body.innerHTML;
    root.classList.add("no-intro"); // l'animation d'entrée de l'accueil ne se joue qu'au premier chargement
    document.body.classList.add("page-enter");
    clearTimeout(enterTimer);
    enterTimer = setTimeout(function () { document.body.classList.remove("page-enter"); }, 900);
    initPage();
    emit("tg:after-swap", detail); // avant le défilement : les modules peuvent encore ajuster la page
    scrollToTarget(hash, y);
    var main = document.getElementById("contenu");
    if (main) { main.setAttribute("tabindex", "-1"); main.focus({ preventScroll: true }); }
  }

  function navigate(href, opts) {
    opts = opts || {};
    var url = pageUrl(href);
    var hash = new URL(href, location.href).hash;
    progressStart();
    return load(url).then(function (html) {
      progressEnd();
      if (opts.push) {
        history.replaceState({ y: window.scrollY }, "", location.href);
        history.pushState({ y: 0 }, "", href);
      }
      var detail = { from: currentPage, to: url };
      currentPage = url;
      emit("tg:before-swap", detail);
      var run = function () { swap(html, hash, opts.y, detail); };
      if (document.startViewTransition && !reduceMotion) {
        // La transition peut être annulée (onglet en arrière-plan…) : la page change quand même,
        // on évite juste une erreur inutile dans la console.
        document.startViewTransition(run).ready.catch(function () {});
      } else run();
    }).catch(function () {
      progressEnd();
      location.href = href; // navigation classique
    });
  }

  if (canRoute) {
    // L'en-tête <head> n'est pas remplacé d'une page à l'autre : ses liens relatifs
    // (icône d'onglet, manifeste) seraient cherchés au mauvais endroit depuis
    // realisations/… → on les transforme une fois pour toutes en adresses complètes.
    document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]').forEach(function (l) {
      l.setAttribute("href", l.href);
    });

    // y: 0 et non window.scrollY : lire scrollY ici forcerait le navigateur à
    // calculer toute la mise en page pendant le chargement (≈ 200 ms bloquées
    // sur mobile). La vraie position est enregistrée au moment de quitter la page.
    history.replaceState({ y: 0 }, "", location.href);

    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a");
      if (!isInternalPage(a)) return;
      var target = new URL(a.href, location.href);
      // lien vers une ancre de la page actuelle : défilement normal
      if (pageUrl(a.href) === pageUrl(location.href) && target.hash) return;
      e.preventDefault();
      navigate(a.href, { push: true });
    });

    // Préchargement au survol ou au toucher : la page est souvent prête avant le clic
    var prefetch = function (e) {
      var a = e.target.closest && e.target.closest("a");
      if (isInternalPage(a)) load(pageUrl(a.href)).catch(function () {});
    };
    document.addEventListener("mouseover", prefetch, { passive: true });
    document.addEventListener("touchstart", prefetch, { passive: true });

    window.addEventListener("popstate", function (e) {
      // simple saut d'ancre dans la même page : pas besoin de recharger le contenu
      if (pageUrl(location.href) === currentPage) { scrollToTarget(location.hash, e.state && e.state.y); return; }
      navigate(location.href, { y: e.state && e.state.y });
    });
  }

  initPage();
})();
