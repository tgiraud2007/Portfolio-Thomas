# Portfolio · Thomas Giraud (BTS SIO SISR)

Site statique (HTML, CSS, JavaScript, sans framework), publié sur GitHub Pages à l'adresse https://thomasgiraud.me.

## Organisation

```
index.html                 Accueil : nom, présentation, fiche « Recherche de stage », chiffres, liste des réalisations
parcours.html              À propos, formation, expériences, compétences
contact.html               Coordonnées et formulaire (Formspree)
404.html                   Page d'erreur
realisations/              Une page par réalisation
  cisco.html               01 · Réseaux sous Packet Tracer
  active-directory.html    02 · Domaine Active Directory
  nagios.html              03 · Supervision Nagios
  ipfire.html              04 · Pare-feu IPFire
  stage-aberia.html        05 · Stage Aberia
  autres-tp.html           06 · GLPI, MediaWiki, ZeroShell
css/style.css              Styles (thèmes clair et sombre)
css/motion.css             Animations : apparitions, frise du Parcours, numéro qui glisse, trait au stylo
js/main.js                 Navigation fluide, thème, schéma interactif, copie de l'e-mail, formulaire
js/app.js                  Charge les modules ci-dessous (après l'affichage de la page)
js/modules/                Un fichier par fonction, chacun avec init() / destroy() :
  header.js                En-tête collant (caché en descendant sur téléphone)
  skill-filter.js          Puces « Compétences » ↔ fiches (accueil)
  fiche-transition.js      Numéro de fiche qui glisse (accueil → fiche)
  smooth-anchors.js        Défilement animé vers une section de la page
  nav-current.js           Menu : « Accueil » ou « Réalisations » souligné selon la position
  reveal.js                Apparitions au défilement
assets/                    Favicon, icônes, image de partage (og-image.png)
assets/fonts/              Polices hébergées localement (Fraunces, Instrument Sans, IBM Plex Mono, licence SIL OFL)
CV/cv.pdf                  CV téléchargeable
```

## Modifier le site

- **Un texte** : ouvrir la page concernée et modifier le texte entre les balises. L'en-tête et le pied de page sont répétés dans chaque page : si tu changes un lien du menu, change-le partout.
- **Ajouter une réalisation** : copier une page de `realisations/`, adapter le contenu, puis ajouter une entrée dans la liste `<ul class="entries">` de `index.html`, les liens « Précédente / Suivante » et `sitemap.xml`.
- **Ajouter une capture d'écran** dans une page projet, juste après la figure :

```html
<figure class="fig">
  <img src="../assets/projects/ad-gpo.png" alt="Résultat de gpresult /r sur le poste Windows 10" width="1200" height="700" loading="lazy">
  <figcaption><b>Capture.</b> Les GPO appliquées au poste client.</figcaption>
</figure>
```

  Déposer l'image dans `assets/projects/` (PNG ou JPEG, environ 1200 px de large). Masquer les mots de passe et les informations sensibles avant de publier.

## Navigation fluide

Chaque page est un fichier HTML complet (liens directs et référencement fonctionnent normalement). Quand on clique sur un lien interne, `js/main.js` télécharge la page suivante et remplace le contenu sans recharger : pas de flash, l'en-tête reste en place. Les pages sont préchargées au survol des liens. En cas d'erreur, ou en ouvrant les fichiers directement sans serveur, la navigation redevient classique.

Si tu ajoutes une fonction JavaScript propre à une page, appelle-la depuis `initPage()` pour qu'elle soit relancée après chaque changement de page.

Pour une animation ou un comportement plus complet, crée plutôt un module dans `js/modules/` (fonctions `init()` et `destroy()`) et ajoute-le à la liste `MODULES` de `js/app.js` : il sera branché et débranché à chaque changement de page. Pour en désactiver un, retire sa ligne de cette liste.

Toutes les animations respectent le réglage « réduire les animations » du système : dans ce cas, le site s'affiche sans mouvement.

## Avant chaque mise en ligne

```bash
node build.js
```

Le script ajoute une empreinte (`?v=…`) aux liens vers les CSS et les JS (`style.css`, `motion.css`, `main.js`, `app.js` et les modules), pour que les visiteurs récupèrent la nouvelle version.

## Tester en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000.
