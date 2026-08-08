# Portfolio — Thomas Giraud

Portfolio one-page de Thomas Giraud, étudiant BTS SIO (SISR) — administration
systèmes & réseaux. Site statique pur (HTML/CSS/JS), sans framework ni build
obligatoire : ouvrez `index.html` dans un navigateur et c'est tout.

## Structure

```
PortfolioThomas/
├── index.html              # Le site (single page)
├── css/style.css           # Styles (thèmes clair/sombre, responsive, print)
├── js/script.js            # Interactions (modales, curseur, canvas, réglages)
├── assets/
│   ├── favicon.svg         # Icône du site
│   ├── apple-touch-icon.png / icon-192.png / icon-512.png   # PWA
│   ├── og-image.png        # Aperçu de partage (Open Graph / Twitter)
│   ├── projects/           # Captures de vos laboratoires (voir README.md)
│   ├── build-og-image.js   # Générateur de l'og-image (node)
│   └── build-favicon-png.js# Générateur des icônes PWA (node)
├── CV/cv.pdf               # Votre CV (téléchargable)
├── manifest.webmanifest    # PWA (installation)
├── robots.txt / sitemap.xml# SEO
├── 404.html                # Page d'erreur (GitHub Pages)
└── build.js                # Cache-busting automatique (node)
```

## Mises à jour courantes

| Je veux...                                    | Je fais...                                                       |
|-----------------------------------------------|------------------------------------------------------------------|
| Changer mon CV                                | Remplacer `CV/cv.pdf` (le nom doit rester `cv.pdf`)              |
| Ajouter une capture d'un laboratoire          | Suivre `assets/projects/README.md` (figure HTML + dépôt du fichier) |
| Modifier les textes / projets                 | Éditer `index.html` (les sections sont commentées : hero, about, services, work, cv, contact) |
| Changer les couleurs                          | Modifier les variables `:root` / `[data-theme="dark"]` dans `css/style.css` |
| Régénérer les icônes PWA / apple-touch-icon   | `node assets/build-favicon-png.js`                               |
| Régénérer l'image de partage                  | `node assets/build-og-image.js`                                  |
| Actualiser la date du sitemap                 | Éditer `<lastmod>` dans `sitemap.xml`                            |
| Forcer le rechargement des assets après déploiement | `node build.js` (ajoute `?v=<hash>` à css/js)              |

## Déploiement (GitHub Pages)

1. Poussez le dossier sur un dépôt GitHub (ex. `tgiraud2007/thomasgiraud.me`).
2. Dans le dépôt : **Settings → Pages → Deploy from a branch** → branche `main`, dossier `/ (root)`.
3. Activez un domaine personnalisé (`thomasgiraud.me`) dans les mêmes réglages si besoin.

Le site étant entièrement statique, il fonctionne aussi sur Netlify, Vercel ou
n'importe quel hébergeur de fichiers.

## Notes techniques

- **Aucune dépendance externe** : les icônes sont des SVG inline (plus de CDN),
  les polices viennent de Google Fonts (preconnect + weights réduits), le
  formulaire utilise Formspree (`index.html`, section contact).
- **Accessibilité** : skip-link, focus trap des modales, `inert` sur le fond,
  `prefers-reduced-motion` respecté en CSS et JS, `aria-current` sur la nav.
- **SEO** : JSON-LD `Person`, Open Graph / Twitter cards, canonical,
  `sitemap.xml` + `robots.txt`.
- **PWA** : `manifest.webmanifest` + icônes 192/512 — installable sur mobile.
- **Impression** : la section CV s'imprime seule (`@media print`), barres de
  compétences remplies automatiquement (`beforeprint`).
- **Tests** : aucune suite automatisée ; validez les changements en ouvrant
  `index.html` (Ctrl+F5) et en testant modales, thèmes et formulaire.
