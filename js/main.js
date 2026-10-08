/* Portfolio Thomas Giraud
   - thème clair / sombre, schéma interactif, copie de l'e-mail, formulaire de contact ;
   - repère la carte cliquée sur l'accueil, pour que son numéro glisse jusqu'à la fiche.
   Les transitions entre les pages sont faites par le navigateur (View Transitions
   entre documents : @view-transition dans css/style.css, et js/head.js).
   Les animations, l'en-tête collant et le filtre par compétence sont dans
   js/app.js et js/modules/. */
(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "tg-theme";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Thème ---------- */
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
          // Couleur de la barre du navigateur sur téléphone
          document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
            m.setAttribute("content", next === "dark" ? "#16140f" : "#f3eee4");
          });
          label();
        };
        if (!document.startViewTransition || reduceMotion.matches) { apply(); return; }

        /* Le nouveau thème s'étend depuis le bouton comme une tache d'encre
           (View Transitions) : le navigateur capture la page avant et après le
           changement, puis on dévoile la capture « après » avec un cercle au bord
           flou qui grandit (masque radial, voir « Changement de thème » dans
           css/style.css). Pendant ce temps, l'icône pivote (lune ↔ soleil).
           Rayon final = distance du bouton au coin de l'écran le plus éloigné,
           plus la largeur du flou. */
        var r = btn.getBoundingClientRect();
        var x = r.left + r.width / 2;
        var y = r.top + r.height / 2;
        var end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        var soft = !!(window.CSS && CSS.registerProperty); // bord flou : il faut pouvoir animer une variable CSS (@property)
        root.style.setProperty("--vt-x", x + "px");
        root.style.setProperty("--vt-y", y + "px");
        root.classList.add("theme-vt");
        if (soft) root.classList.add("theme-vt--soft");
        var transition = document.startViewTransition(apply);
        transition.ready.then(function () {
          // fill: "forwards" : le cercle reste ouvert jusqu'à la toute fin de la transition.
          // Sans ça, il se referme une image avant la fin et l'ancien thème réapparaît (flash).
          var timing = { duration: 800, easing: "cubic-bezier(.55, 0, .25, 1)", fill: "forwards", pseudoElement: "::view-transition-new(root)" };
          if (soft) {
            root.animate({ "--vt-r": ["0px", end + 90 + "px"] }, timing);
          } else { // navigateurs plus anciens : cercle à bord net
            root.animate({ clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + end + "px at " + x + "px " + y + "px)"] }, timing);
          }
        }).catch(function () {});
        var cleanup = function () { root.classList.remove("theme-vt", "theme-vt--soft"); };
        transition.finished.then(cleanup, cleanup);
      });
    });
  }

  /* ---------- Schéma interactif (fiche IPFire) ---------- */
  function initSchema() {
    var svg = document.getElementById("topo");
    var note = document.getElementById("fig-note");
    if (!svg || !note) return;
    var initial = note.innerHTML;
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

  // Moins d'animations demandé : on fige les animations intégrées aux schémas SVG
  // (paquets qui circulent). Sur la fiche IPFire, on fige l'image où le paquet
  // vert est en route, pour que la note sous le schéma reste juste.
  function pauseSvgAnimations() {
    if (!reduceMotion.matches) return;
    document.querySelectorAll("svg").forEach(function (svg) {
      if (!svg.pauseAnimations) return;
      if (svg.id === "topo" && svg.setCurrentTime) svg.setCurrentTime(4);
      svg.pauseAnimations();
    });
  }

  /* ---------- Copie de l'e-mail ---------- */
  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      var label = btn.textContent; // texte d'origine, gardé une fois pour toutes
      var status = document.getElementById(btn.getAttribute("aria-describedby"));
      var timer = null;
      var done = function (msg) {
        clearTimeout(timer);
        btn.textContent = msg;
        if (status) status.textContent = msg === "Copié" ? "Adresse e-mail copiée" : msg; // annoncé aux lecteurs d'écran
        timer = setTimeout(function () {
          btn.textContent = label;
          if (status) status.textContent = "";
        }, 2000);
      };
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done("Copié"); }, function () { done("Sélectionnez l'adresse"); });
        } else {
          done("Sélectionnez l'adresse");
        }
      });
    });
  }

  /* ---------- Formulaire de contact ----------
     - envoi en cours : le bouton affiche un petit cercle qui tourne ;
     - erreur : le bouton fait un léger « non » de la tête, le message s'affiche ;
     - envoyé : les champs s'effacent et laissent place à un petit schéma (le
       message part de « Vous », arrive chez « Thomas », coche verte), dans
       une carte qui garde sa hauteur (rien ne saute dans la page). Le titre
       « Message envoyé. » reçoit le focus : les lecteurs d'écran l'annoncent. */
  function initForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var msg = document.getElementById("form-msg");
    var submit = form.querySelector("button[type=submit]");
    var fields = Array.prototype.slice.call(form.querySelectorAll("[required]"));
    var fieldsBox = document.getElementById("form-fields");
    var done = document.getElementById("form-done");
    var again = document.getElementById("form-again");

    // Le message reste dans la page (vide = invisible) : les lecteurs d'écran
    // annoncent alors son contenu dès qu'il change.
    var show = function (text, isError) {
      msg.textContent = text;
      msg.classList.toggle("is-error", !!isError);
    };
    // Petit « non » de la tête du bouton (relancé à chaque erreur)
    var shake = function () {
      submit.classList.remove("is-shake");
      void submit.offsetWidth; // force le navigateur à repartir de zéro
      submit.classList.add("is-shake");
    };
    submit.addEventListener("animationend", function () { submit.classList.remove("is-shake"); });

    var showDone = function () {
      if (!fieldsBox || !done) { show("Message envoyé. Merci, je vous réponds rapidement.", false); return; }
      form.style.minHeight = form.offsetHeight + "px"; // la carte garde sa hauteur
      var swap = function () {
        fieldsBox.hidden = true;
        fieldsBox.classList.remove("is-leaving");
        done.hidden = false;
        form.classList.add("is-sent");
        done.querySelector(".form__done-title").focus({ preventScroll: true });
      };
      if (reduceMotion.matches) { swap(); return; }
      fieldsBox.classList.add("is-leaving"); // les champs s'effacent vers le haut…
      setTimeout(swap, 280);                 // … puis le schéma d'envoi se joue
    };
    if (again) {
      again.addEventListener("click", function () {
        form.classList.remove("is-sent");
        done.hidden = true;
        fieldsBox.hidden = false;
        form.style.minHeight = "";
        form.querySelector("input").focus();
      });
    }
    // Message d'erreur sous un champ (texte pris dans data-error)
    var check = function (field) {
      var ok = field.checkValidity();
      var error = document.getElementById(field.getAttribute("aria-describedby"));
      field.setAttribute("aria-invalid", ok ? "false" : "true");
      if (error) error.textContent = ok ? "" : error.getAttribute("data-error");
      return ok;
    };
    fields.forEach(function (field) {
      // Une fois signalé, le champ se corrige en direct
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") check(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var invalid = fields.filter(function (field) { return !check(field); });
      if (invalid.length) {
        show(invalid.length > 1 ? "Il manque " + invalid.length + " informations, signalées sous les champs." : "Il manque une information, signalée sous le champ.", true);
        shake();
        invalid[0].focus();
        return;
      }
      submit.disabled = true;
      submit.classList.add("is-sending");
      submit.textContent = "Envoi…";
      show("", false);
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          showDone();
        })
        .catch(function () {
          show("L'envoi n'a pas fonctionné. Écrivez-moi directement à tgiraud0604@gmail.com.", true);
          shake();
        })
        .then(function () {
          submit.disabled = false;
          submit.classList.remove("is-sending");
          submit.textContent = "Envoyer";
        });
    });
  }

  /* ---------- Numéro qui glisse (accueil → fiche), côté départ ----------
     Au clic sur une carte du sommaire, son numéro reçoit le nom de transition
     « fiche-num » : le navigateur le capture et le fait glisser jusqu'au grand
     numéro de la fiche (repris par js/head.js à l'arrivée). On note aussi s'il
     était rempli (souris dessus) pour qu'il arrive dans le même état.
     Uniquement si le navigateur gère les transitions entre pages. */
  function alpha(color) { // "rgba(255, 138, 107, 0.4)" → 0.4 ; "rgb(…)" → 1
    var m = color.match(/rgba?\(([^)]+)\)/);
    var parts = m ? m[1].split(",") : [];
    return parts.length === 4 ? parseFloat(parts[3]) : 1;
  }

  function initFicheMorph() {
    if (!("onpagereveal" in window)) return;
    document.addEventListener("click", function (e) {
      if (reduceMotion.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var card = e.target.closest && e.target.closest("a.entry");
      if (!card) return;
      var num = card.querySelector(".num");
      if (!num) return;
      var r = num.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // numéro hors de l'écran : fondu normal
      document.querySelectorAll(".num").forEach(function (n) { n.style.viewTransitionName = ""; }); // un seul nom à la fois
      num.style.viewTransitionName = "fiche-num";
      try {
        sessionStorage.setItem("tg-vt-num", JSON.stringify({ to: new URL(card.href).pathname, filled: alpha(getComputedStyle(num).color) > 0.5 }));
      } catch (err) { /* stockage indisponible : simple fondu */ }
    });
  }

  pauseSvgAnimations();
  initTheme();
  initSchema();
  initCopy();
  initForm();
  initFicheMorph();
})();
