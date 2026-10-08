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
js/app.js                  Charge les modules ci-dessous (après l'affichage de la page)
js/modules/                Un fichier par fonction, chacun avec une fonction init() :
  header.js                En-tête collant (caché en descendant sur téléphone)
  skill-filter.js          Puces « Compétences » ↔ fiches (accueil)
  nav-current.js           Menu : « Accueil » ou « Réalisations » souligné selon la position
  reveal.js                Apparitions au défilement
assets/                    Favicon, icônes, image de partage (og-image.png)
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

- **Un schéma SVG** : sur téléphone, il garde une taille lisible et défile horizontalement. La largeur minimale se règle sur son conteneur : `<div class="fig__scroll" style="--fig-min: 540px">`.

## Navigation entre les pages

Chaque page est un vrai chargement (liens directs, bouton retour, référencement et lecteurs d'écran fonctionnent normalement). Les transitions sont faites par le navigateur (View Transitions entre documents, `@view-transition` dans `css/style.css`) : fondu court, en-tête fixe, et numéro de la fiche qui glisse depuis l'accueil. Chrome, Edge et Safari 18.2+ les affichent ; les autres navigateurs font une navigation classique. Les pages sont préchargées au survol des liens (`<script type="speculationrules">` dans `_partials/head.html`).

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
