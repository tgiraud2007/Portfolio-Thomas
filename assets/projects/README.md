# Captures de laboratoires

Pour l'instant, aucune capture n'est affichée dans les modales de projets :
elles sont conçues pour rester sobres (diagramme + détails techniques).

Quand vous aurez des captures, ajoutez une figure par projet dans
`index.html`, juste avant la ligne `<div class="project-modal-grid">` de la
modale concernée :

```html
<figure class="project-shot" data-shot="assets/projects/lab1.png">
    <figcaption class="project-shot__caption">
        <span class="project-shot__label">// capture.lab1</span>
    </figcaption>
</figure>
```

Puis déposez le fichier `assets/projects/lab1.png` (et `lab2.png`… `lab4.png`).

| Projet                       | Fichier attendu        |
|------------------------------|------------------------|
| 1. Maquette Active Directory | `lab1.png`             |
| 2. Filtrage IPFire           | `lab2.png`             |
| 3. Routage ZeroShell         | `lab3.png`             |
| 4. Topologies Cisco          | `lab4.png`             |

Conseils :
- Format PNG ou JPEG, **largeur idéale 1200 px** (affichage 100 % dans la modale).
- Plusieurs captures ? Renommez-les `lab1-2.png`, `lab1-3.png`… et ajoutez les
  figures correspondantes.
- Une fois la figure en place et le fichier déposé, rien d'autre n'est
  nécessaire : le site affiche l'image automatiquement.
