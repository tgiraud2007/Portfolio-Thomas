/* ==========================================================================
   Point d'entrée des modules « animation et navigation »
   --------------------------------------------------------------------------
   Chargé en <script type="module">, après js/main.js (qui gère le thème,
   le formulaire et la navigation sans rechargement).

   Chaque module (dossier js/modules/) exporte deux fonctions :
     init()    → branche le module sur la page affichée
     destroy() → le débranche (écouteurs, observateurs)

   Comme js/main.js remplace le contenu de la page sans la recharger, on
   appelle destroy() avant chaque changement de page ("tg:before-swap") et
   init() dès que la nouvelle page est en place ("tg:after-swap").

   Performance : les modules ne sont téléchargés qu'une fois la page
   entièrement chargée (événement "load"). Rien de tout ça n'est nécessaire
   au premier affichage, donc on laisse passer le texte et les polices d'abord.

   Pour désactiver un module : supprimez sa ligne dans MODULES.
   ========================================================================== */

const MODULES = [
  () => import("./modules/header.js?v=82aa771e"),           // en-tête collant
  () => import("./modules/skill-filter.js?v=5e1e316f"),     // compétences ↔ fiches (accueil)
  () => import("./modules/fiche-transition.js?v=09847d1e"), // numéro de fiche qui glisse (aller seulement)
  () => import("./modules/smooth-anchors.js?v=f10b7a95"),   // défilement animé vers une section (ex. Réalisations)
  () => import("./modules/nav-current.js?v=77713081"),      // menu : Accueil / Réalisations souligné
  () => import("./modules/reveal.js?v=83ccf11b"),           // apparitions au défilement
];

let modules = []; // rempli une fois les modules chargés

function whenPageLoaded() {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

document.addEventListener("tg:before-swap", (e) => {
  modules.forEach((m) => {
    m.destroy();
    if (m.beforeSwap) m.beforeSwap(e.detail); // ex. : repérer la fiche cliquée
  });
});
document.addEventListener("tg:after-swap", (e) => {
  modules.forEach((m) => {
    m.init();
    if (m.afterSwap) m.afterSwap(e.detail);
  });
});

whenPageLoaded()
  .then(() => {
    // Police utilisée seulement sur certaines pages (dates du Parcours) : chargée
    // maintenant en arrière-plan, pour qu'elle soit prête avant d'y aller.
    if (document.fonts) document.fonts.load('500 1em "IBM Plex Mono"').catch(() => {});
    return Promise.all(MODULES.map((load) => load()));
  })
  .then((loaded) => {
    modules = loaded;
    modules.forEach((m) => m.init());
  });
