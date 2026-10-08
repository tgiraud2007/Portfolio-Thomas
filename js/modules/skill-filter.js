/* ==========================================================================
   Compétences ↔ fiches (accueil)
   --------------------------------------------------------------------------
   Relie les compétences (les mêmes catégories que sur la page Parcours) aux
   fiches de réalisation :
   - clic sur une compétence → les fiches qui la mobilisent ont leur filet du
     haut en rouge et leur numéro plein, les autres passent en retrait (décor
     estompé, texte toujours lisible ; rien n'est masqué, rien ne bouge) ;
     nouveau clic, ou « Toutes », pour revenir à l'affichage normal ;
   - survol d'une compétence à la souris → aperçu, sans rien valider ;
   - survol ou focus d'une fiche → ses compétences s'allument dans la liste.

   Données : dans index.html, chaque <li> du sommaire porte
   data-skills="reseaux services…" et chaque bouton data-skill="reseaux".
   Pour ajouter une fiche ou une compétence, il suffit de modifier le HTML.

   Test : cliquer sur « Réseaux » → les fiches 01, 02, 05 et 06 sont marquées
   et le compteur annonce « 4 fiches ». Survoler la fiche 04 → « Services et
   supervision » et « Linux » s'allument.
   ========================================================================== */

let list = null;
let chips = [];
let items = [];
let count = null;
let initialCount = "";
let committed = ""; // compétence choisie par clic ("" = toutes)

function skillsOf(li) {
  return (li.dataset.skills || "").split(/\s+/).filter(Boolean);
}

/* Met en avant les fiches d'une compétence ("" = aucune mise en avant) */
function apply(skill, announce) {
  let matches = 0;
  items.forEach((li) => {
    const match = !!skill && skillsOf(li).includes(skill);
    li.classList.toggle("is-match", match);
    if (match) matches++;
  });
  if (skill) list.dataset.active = skill;
  else delete list.dataset.active;

  if (announce && count) {
    const chip = chips.find((c) => c.dataset.skill === skill);
    count.textContent = skill
      ? `${matches} fiche${matches > 1 ? "s" : ""} · ${chip.textContent}`
      : initialCount;
  }
}

function choose(skill) {
  committed = skill === committed ? "" : skill; // re-cliquer = tout afficher
  chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.skill === committed)));
  apply(committed, true);
}

function lightChips(li, lit) {
  const skills = li ? skillsOf(li) : [];
  chips.forEach((c) => c.classList.toggle("is-lit", lit && skills.includes(c.dataset.skill)));
}

export function init() {
  list = document.querySelector(".entries[data-filterable]");
  const group = document.querySelector(".skill-filter");
  if (!list || !group) return;

  committed = "";
  chips = Array.from(group.querySelectorAll(".chip"));
  items = Array.from(list.children);
  count = document.getElementById("fiches-count");
  initialCount = count ? count.textContent : "";
  group.classList.add("is-ready"); // le CSS rend les puces cliquables seulement maintenant

  chips.forEach((chip) => {
    chip.addEventListener("click", () => choose(chip.dataset.skill));
    // Aperçu au survol, uniquement avec une vraie souris (pas au toucher)
    chip.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") apply(chip.dataset.skill, false); });
    chip.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") apply(committed, false); });
  });

  items.forEach((li) => {
    li.addEventListener("mouseenter", () => lightChips(li, true));
    li.addEventListener("mouseleave", () => lightChips(li, false));
    li.addEventListener("focusin", () => lightChips(li, true));
    li.addEventListener("focusout", () => lightChips(li, false));
  });
}
