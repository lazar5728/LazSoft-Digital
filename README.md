# Lazsoft Digital Studio

Site vitrine statique en HTML, CSS et JavaScript, hébergé sur GitHub Pages.

## Aperçu local

Ouvrez le dossier avec VS Code et lancez `index.html` avec Live Server. Le chargement de `site-content.json` nécessite un serveur statique local.

## Gestion des démonstrations, témoignages, logos et réalisations

- Les boutons de gestion sont masqués par défaut. Pour les afficher, ouvrez le site avec `?admin=1`, par exemple `https://lazsoft-digital-studio.com/?admin=1`.
- Le mode `?admin=1` est seulement visuel, pas une authentification. Toute personne connaissant l’adresse peut afficher les boutons.
- Les ajouts sont prévisualisés et sauvegardés comme brouillons dans le navigateur de gestion. Ils ne sont pas publiés pour les visiteurs automatiquement.
- Pour ajouter une démo, placez son fichier HTML (et ses éventuels fichiers associés) dans `site_client`, ouvrez `?admin=1`, puis cliquez sur « Ajouter une démonstration ». Indiquez le chemin du fichier HTML depuis `site_client` : par exemple `Cakes by Rk.html` ou `mon-site/index.html`.
- Cliquez sur « Télécharger les changements », remplacez `site-content.json` dans le projet par le fichier téléchargé, vérifiez que les fichiers du site sont bien dans `site_client`, puis publiez les changements sur GitHub Pages. Le lien de la carte ouvre automatiquement le fichier HTML correspondant.
- Les fichiers de démonstration sont publiés avec le site : ne placez pas de contenu privé dans `site_client`.
- Les logos publiés défilent automatiquement un par un toutes les 5 secondes. Les commandes précédent/suivant et pause/reprise sont disponibles lorsqu’il y a plusieurs logos.
- Le formulaire de contact ouvre le logiciel de messagerie par défaut avec les champs préremplis.
- Le lecteur audio de l’accueil utilise `Lazsoft_Digital.wav`. Le logo du site se trouve dans `images/logo.png`.
