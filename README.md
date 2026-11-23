# Lazsoft Digital Studio

Site vitrine statique en HTML, CSS et JavaScript, hébergé sur GitHub Pages.

## Aperçu local

Ouvrez le dossier avec VS Code et lancez `index.html` avec Live Server. Le chargement de `site-content.json` nécessite un serveur statique local.

## Gestion des démonstrations, témoignages, logos et réalisations

- Les boutons de gestion ne sont plus exposés par un paramètre d’URL public.
- Toute modification du contenu doit être effectuée directement dans le dépôt ou dans `site-content.json`, puis validée et publiée par GitHub.
- Pour ajouter une démo, placez son fichier HTML (et ses éventuels fichiers associés) dans `site_client`, ajoutez son entrée à `site-content.json`, vérifiez que les fichiers du site sont bien dans `site_client`, puis publiez les changements sur GitHub Pages. Le lien de la carte ouvre automatiquement le fichier HTML correspondant.
- Les fichiers de démonstration sont publiés avec le site : ne placez pas de contenu privé dans `site_client`.
- Les logos publiés défilent automatiquement un par un toutes les 5 secondes. Les commandes précédent/suivant et pause/reprise sont disponibles lorsqu’il y a plusieurs logos.
- Le formulaire de contact ouvre le logiciel de messagerie par défaut avec les champs préremplis.
- Le lecteur audio de l’accueil utilise `Lazsoft_Digital.wav`. Le logo du site se trouve dans `images/logo.png`.
