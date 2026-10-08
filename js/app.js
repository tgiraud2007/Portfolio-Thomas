/* ==========================================================================
   Point d'entrée des modules « animation »
   --------------------------------------------------------------------------
   Chargé en <script type="module">, après js/main.js (thème, formulaire,
   schéma interactif).

   Chaque module (dossier js/modules/) exporte une fonction init() qui le
   branche sur la page.

   Performance : les modules ne sont téléchargés qu'une fois la page
   entièrement chargée (événement "load"). Rien de tout ça n'est nécessaire
   au premier affichage, donc on laisse passer le texte et les polices d'abord.

   Pour désactiver un module : supprimez sa ligne dans MODULES.
   ========================================================================== */

const MODULES = [
  () => import("./modules/header.js?v=1ac42a23"),       // en-tête collant
  () => import("./modules/skill-filter.js?v=4f0c2496"), // compétences ↔ fiches (accueil)
  () => import("./modules/nav-current.js?v=7182f77b"),  // menu : Accueil / Réalisations souligné
  () => import("./modules/reveal.js?v=b49ecc2c"),       // apparitions au défilement
];

function whenPageLoaded() {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

whenPageLoaded()
  .then(() => {
    // Police utilisée seulement sur certaines pages (dates du Parcours) : chargée
    // maintenant en arrière-plan, pour qu'elle soit prête avant d'y aller.
    if (document.fonts) document.fonts.load('500 1em "IBM Plex Mono"').catch(() => {});
    return Promise.all(MODULES.map((load) => load()));
  })
  .then((modules) => modules.forEach((m) => m.init()));
