# Portfolio · Thomas Giraud (BTS SIO SISR)

Site statique (HTML, CSS, JavaScript, sans framework), publié sur GitHub Pages à l'adresse https://thomasgiraud.me.

## Organisation

```
index.html                 Accueil : nom, présentation, recherche de stage, réalisations, chiffres
parcours.html              À propos, formation, expériences, compétences
contact.html               Coordonnées et formulaire (Formspree)
404.html                   Page d'erreur
realisations/              Une page par réalisation
  stage-aberia.html        01 · Stage Aberia
  cisco.html               02 · Réseaux sous Packet Tracer
  active-directory.html    03 · Domaine Active Directory
  nagios.html              04 · Supervision Nagios
  ipfire.html              05 · Pare-feu IPFire
  autres-tp.html           06 · GLPI, MediaWiki, ZeroShell
_partials/                 Blocs communs à toutes les pages (recopiés par build.js)
  head.html                Balises communes du <head> (aperçus de partage, polices, CSS, sécurité)
  header.html              Lien d'évitement + en-tête (menu, bouton de thème)
  footer.html              Pied de page + scripts
css/style.css              Styles (thèmes clair et sombre, transitions entre les pages)
css/motion.css             Animations : apparitions, frise du Parcours, numéro qui glisse, trait au stylo
js/head.js                 Avant l'affichage : thème, intro de l'accueil, arrivée sur une page
js/main.js                 Thème, schéma interactif, copie de l'e-mail, formulaire, numéro qui glisse (départ)
js/nav.js                  Changement de page sans rechargement (Swup) : fondu, menu, défilement, bouton retour
js/vendor/swup.js          Bibliothèque Swup et ses extensions Preload et A11y (licence MIT, ne pas modifier)
js/app.js                  Charge les modules ci-dessous (après l'affichage de la page)
js/modules/                Un fichier par fonction, chacun avec une fonction init() (relancée à chaque page) :
  header.js                En-tête collant (caché en descendant sur téléphone)
  skill-filter.js          Puces « Compétences » ↔ fiches (accueil)
  nav-current.js           Menu : « Accueil » ou « Réalisations » souligné selon la position
  reveal.js                Apparitions au défilement
assets/                    Favicon, icônes, image de partage (og-image.jpg)
assets/og/                 Image de partage de chaque fiche (fabriquées par _outils/og-images.mjs)
assets/fonts/              Polices hébergées localement (Fraunces, Instrument Sans, IBM Plex Mono, licence SIL OFL)
CV/                        CV téléchargeable (CV-Thomas-Giraud-BTS-SIO-SISR.pdf)
build.js                   Préparation avant mise en ligne (voir plus bas)
_outils/og-images.mjs      Fabrique les images de partage (accueil et fiches)
```

Les dossiers qui commencent par `_` ne sont pas publiés par GitHub Pages.

## Modifier le site

- **Un texte** : ouvrir la page concernée et modifier le texte entre les balises.
- **Le menu, l'en-tête, le pied de page ou le `<head>`** : ne pas les modifier dans les pages, mais dans `_partials/`, puis lancer `node build.js`. Dans chaque page, tout ce qui se trouve entre `<!-- @header … -->` et `<!-- /@header -->` (idem pour `@head` et `@footer`) est réécrit par `build.js`. Le mot après `@header` (accueil, realisations, parcours, contact) indique le lien du menu à souligner.
- **Les liens** commencent par `/` (ex. `/parcours.html`, `/realisations/cisco.html`) : ils fonctionnent depuis n'importe quelle page.
- **Ajouter une réalisation** : copier une page de `realisations/`, adapter le contenu (numéro, titre, `<link rel="canonical">`, `<meta name="description">`), puis ajouter une entrée dans la liste `<ul class="entries">` de `index.html` et les liens « Précédente / Suivante ». Le sitemap et les balises de partage sont faits par `build.js`.
- **Ajouter une capture d'écran** dans une page projet :

```html
<figure class="fig">
  <img src="/assets/projects/ad-gpo.png" alt="Résultat de gpresult /r sur le poste Windows 10" width="1200" height="700" loading="lazy">
  <figcaption><b>Capture.</b> Les GPO appliquées au poste client.</figcaption>
</figure>
```

  Déposer l'image dans `assets/projects/` (PNG, JPEG ou WebP, environ 1200 px de large). Masquer les mots de passe et les informations sensibles avant de publier (noms de clients, adresses IP publiques).

- **Un schéma SVG** : chaque schéma des fiches existe en deux versions, dans `<div class="fig__art">` : `<svg class="fig__wide">` (ordinateur) et `<svg class="fig__tall">` (téléphone, 640 px et moins, dessin vertical d'environ 340 de large). Modifier les deux. Un schéma sans version téléphone se place dans `<div class="fig__scroll" style="--fig-min: 540px">` : sur téléphone, il garde une taille lisible et défile horizontalement.

## Navigation entre les pages

Les pages changent sans rechargement, comme sur une seule page : `js/nav.js` (avec la bibliothèque [Swup](https://swup.js.org), dans `js/vendor/swup.js`) récupère la page demandée en arrière-plan et remplace seulement le contenu (`<main id="contenu" class="transition-page">`). L'en-tête, le menu et le pied de page restent en place ; le contenu glisse de côté dans l'ordre du menu (Accueil → fiches 01 à 06 → Parcours → Contact : vers la gauche quand on avance, vers la droite quand on recule), et le numéro de la fiche glisse depuis l'accueil. L'adresse change normalement : liens directs, bouton retour (on retrouve sa position), référencement et lecteurs d'écran (le titre de la nouvelle page est annoncé) fonctionnent comme avant.

- L'animation est faite par le navigateur (View Transitions, réglages dans `css/style.css`, classes `.slide-next` / `.slide-prev`) ; sans View Transitions, par le CSS (`.transition-page`). Page sans place dans l'ordre (404) : simple fondu.
- Les pages des liens visibles ou survolés sont préchargées : le changement est immédiat.
- Après chaque changement de page, l'événement `tg:page` relance ce qui dépend du contenu : `initPage()` dans `js/main.js` et les `init()` des modules.
- Le CV (PDF) et les liens externes s'ouvrent normalement. Pour qu'un lien du site fasse un vrai chargement, lui ajouter `data-no-swup`.
- En cas de problème (page introuvable, erreur réseau, script bloqué), le navigateur charge la page normalement.

Mettre Swup à jour : `npm pack swup @swup/preload-plugin @swup/a11y-plugin` dans un dossier temporaire, puis recopier dans `js/vendor/swup.js` les fichiers `dist/Swup.umd.js` et `dist/index.umd.js` (dans cet ordre, sans les lignes `sourceMappingURL`), et relancer `node build.js`.

Toutes les animations respectent le réglage « réduire les animations » du système : dans ce cas, le site s'affiche sans mouvement.

## Sécurité

`_partials/head.html` contient une politique de sécurité (Content-Security-Policy) : seuls les scripts du site, les styles du site et l'envoi du formulaire vers Formspree sont autorisés. Les scripts écrits directement dans une page (`<script>…</script>`) sont autorisés par leur empreinte, calculée par `build.js` : **après avoir ajouté ou modifié un tel script, relancer `node build.js`**, sinon le navigateur le bloque. Les données JSON-LD de l'accueil ne sont pas concernées.

## Avant chaque mise en ligne

```bash
node build.js
```

Le script :
1. recopie les blocs communs de `_partials/` dans chaque page, et fabrique les balises de partage (titre, description, image) à partir du `<title>`, de la `<meta name="description">` et du `<link rel="canonical">` de chaque page ;
2. ajoute une empreinte (`?v=…`) aux liens vers les CSS et les JS, pour que les visiteurs récupèrent la nouvelle version ;
3. met à jour la Content-Security-Policy ;
4. régénère `sitemap.xml`.

Quand tu changes le titre ou le schéma d'une fiche, ou le texte de l'accueil, refais aussi les images de partage (serveur local lancé) :

```bash
node _outils/og-images.mjs
```

## Tester en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000. Le serveur est indispensable : les liens commencent par `/`, ils ne fonctionnent pas en ouvrant les fichiers directement.
