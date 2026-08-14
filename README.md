# Portfolio — Thomas Giraud (Administration Systèmes & Réseaux)

Portfolio professionnel one-page de Thomas Giraud, étudiant en 2e année de **BTS SIO option SISR** (Lycée Marc Bloch, Sérignan) à la recherche d'un stage ou d'une opportunité en administration systèmes et réseaux.

Site statique haute performance (HTML5 sémantique, CSS3 Vanilla moderne, JavaScript ES6+ modulaire), sans aucun framework lourd. Prêt pour le déploiement sur GitHub Pages, Netlify ou Vercel.

---

## 📁 Architecture du projet

```
portfolio2/
├── index.html              # Page principale unique (accessible, sémantique, SEO enrichi)
├── css/style.css           # Design tokens, typographie, responsive, animations, @media print
├── js/script.js            # Moteur d'interactions (thèmes, curseur, raccourcis, modales, canvas)
├── assets/
│   ├── favicon.svg         # Favicon vectoriel moderne
│   ├── apple-touch-icon.png / icon-192.png / icon-512.png   # Icônes PWA
│   ├── og-image.png        # Aperçu OpenGraph / Twitter Cards
│   └── projects/           # Captures et schémas des laboratoires
├── CV/cv.pdf               # Curriculum Vitæ officiel au format PDF
├── manifest.webmanifest    # Manifest PWA (installation mobile / desktop)
├── robots.txt / sitemap.xml# Indexation et SEO
├── 404.html                # Page d'erreur 404 console interactive
└── build.js                # Script Node.js de cache-busting automatique
```

---

## 🚀 Sections & Fonctionnalités clés

1. **Header & Navigation rapide** :
   - Accès rapide aux sections avec underline dynamique.
   - Bouton de bascule rapide de thème Clair (Éditorial Crème) / Sombre (Deep Console).
   - Menu tiroir mobile accessible avec gestion de focus (`inert`).
   - Modal d'aide aux raccourcis clavier (`?`).

2. **Section 00 : Hero** :
   - Badge de disponibilité en temps réel (« À la recherche d'un stage SISR »).
   - Accroche technique mature avec rôle et compétences clés.
   - Boutons d'action : Télécharger CV, Me contacter, Copier mon e-mail avec toast instantané.
   - Topologie réseau interactive en SVG avec flux de paquets animés et interaction de survol.

3. **Section 01 : À propos** :
   - Parcours détaillé (Bac Pro SN mention TB -> BTS SIO SISR).
   - Compteurs dynamiques animés (Nombre de VMs, VLANs configurés, Heures labo, Expériences de stage).
   - Carte technique « Spécifications Environnement Labo » (Hyperviseur, OS, adressage IP).

4. **Section 02 : Compétences (Matrice catégorisée)** :
   - 4 pôles d'expertise concrets : **Systèmes & Services**, **Réseaux & Commutation**, **Sécurité & Filtrage**, **Méthodologie & Support**.
   - Badges et pastilles techniques (pas de jauges de pourcentage subjectives).

5. **Section 03 : Projets & Laboratoires SISR** :
   - 4 projets phares : Active Directory DS & GPO, IPFire Multi-Zones, ZeroShell Captive Portal, Cisco Packet Tracer (VLANs/Routage).
   - Fiches synthétiques avec métriques, badges d'état et ouverture de modales complètes (topologies SVG, étapes de configuration, compétences BTS associées).

6. **Section 04 : CV Interactif & Imprimable** :
   - Timeline de formation & 4 stages professionnels détaillés avec réalisations concrètes.
   - Matrice de maîtrise (Laboratoire avancé / Milieu professionnel / Notions).
   - Feuille de style `@media print` optimisée pour impression ou export PDF parfait sans coupure inutile.

7. **Section 05 : Contact Direct & Formulaire** :
   - Carte de contact direct (e-mail, téléphone, localisation Servian 34, permis B, LinkedIn, GitHub).
   - Formulaire Formspree asynchrone avec champ piège antispam (`honeypot`) et message de confirmation poli.

8. **Barre d'état & Utilitaires** :
   - Fil d'Ariane dynamique de la section active.
   - Indicateur de progression de lecture (top bar & status bar).
   - Raccourcis clavier (Vim navigation `j`/`k`/`G`, sauts de section `gh`/`ga`/`gs`/`gp`/`gv`/`gc`).

---

## 🛠️ Commandes utiles

| Action | Commande / Procédure |
|---|---|
| **Vérifier la syntaxe JS** | `node --check js/script.js` |
| **Mettre à jour le cache-busting** | `node build.js` |
| **Régénérer les icônes PWA** | `node assets/build-favicon-png.js` |
| **Régénérer l'OG image** | `node assets/build-og-image.js` |

---

## 🌐 Déploiement

Le site est entièrement statique :
1. Déposez les fichiers sur GitHub dans la branche `main`.
2. Activez **GitHub Pages** (Settings > Pages > Source : Deploy from a branch, `/root`).
3. Le site est immédiatement accessible en ligne avec support HTTPS.
