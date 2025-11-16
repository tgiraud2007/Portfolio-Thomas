/*
 * SCRIPT POUR LE PORTFOLIO DE THOMAS GIRAUD
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ======== GESTION DU MENU MOBILE ======== */
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelectorAll('.nav__link');

    // Ouvre/Ferme le menu quand on clique sur l'icône "hamburger"
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show-menu');
        });
    }

    // Ferme le menu quand on clique sur un lien (utile sur mobile)
    const linkAction = () => {
        navMenu.classList.remove('show-menu');
    }
    navLinks.forEach(link => link.addEventListener('click', linkAction));


    /* ======== OMBRE SUR LA NAVIGATION AU DÉFILEMENT ======== */
    const header = document.getElementById('header');

    window.addEventListener('scroll', () => {
        // Si on a défilé de plus de 50 pixels, on ajoute la classe 'header-scrolled'
        if (window.scrollY >= 50) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    });

});

/* ======== GESTION DU FORMULAIRE DE CONTACT (AVEC FETCH) ======== */
    
const contactForm = document.getElementById('contact-form');
const statusMessage = document.getElementById('contact-status');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page

        const form = e.target;
        const data = new FormData(form);
        const statusEl = statusMessage;

        // Affiche un message "Envoi en cours..."
        statusEl.textContent = 'Envoi en cours...';
        statusEl.className = ''; // Réinitialise les classes de couleur

        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Succès
                statusEl.textContent = "Merci ! Votre message a bien été envoyé.";
                statusEl.classList.add('success');
                form.reset(); // Réinitialise les champs du formulaire
            } else {
                // Gère les erreurs de Formspree (ex: validation)
                const errorData = await response.json();
                statusEl.textContent = errorData.errors ? errorData.errors.map(err => err.message).join(', ') : "Une erreur s'est produite. Veuillez réessayer.";
                statusEl.classList.add('error');
            }
        } catch (error) {
            // Gère les erreurs réseau
            console.error('Erreur de soumission:', error);
            statusEl.textContent = 'Une erreur réseau est survenue. Veuillez vérifier votre connexion.';
            statusEl.classList.add('error');
        }
    });
}