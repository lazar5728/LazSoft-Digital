# Lazsoft Digital Studio

Site vitrine statique en HTML, CSS et JavaScript, hébergé sur GitHub Pages.

## Aperçu local

Ouvrez le dossier avec VS Code et lancez `index.html` avec Live Server. Le chargement de `site-content.json` nécessite un serveur statique local.

## Gestion des témoignages, logos et réalisations

- Les boutons de gestion sont masqués par défaut. Pour les afficher, ouvrez le site avec `?admin=1`, par exemple `https://lazsoft-digital-studio.com/?admin=1`.
- Le mode `?admin=1` est seulement visuel, pas une authentification. Toute personne connaissant l’adresse peut afficher les boutons.
- Les ajouts sont prévisualisés et sauvegardés comme brouillons dans le navigateur de gestion. Ils ne sont pas publiés pour les visiteurs automatiquement.
- Cliquez sur « Télécharger les changements », remplacez `site-content.json` dans le projet par le fichier téléchargé, ajoutez les images référencées dans `images`, puis publiez les changements sur GitHub Pages.
- Les logos publiés défilent automatiquement un par un toutes les 5 secondes. Les commandes précédent/suivant et pause/reprise sont disponibles lorsqu’il y a plusieurs logos.
- Le formulaire de contact ouvre le logiciel de messagerie par défaut avec les champs préremplis.
- Le lecteur audio de l’accueil utilise `Lazsoft_Digital.wav`. Le logo du site se trouve dans `images/logo.png`.
