# Lazsoft Digital Studio - Site sécurisé

Ce projet a été renforcé avec une couche de protection pour limiter les menaces courantes :

- prévention des injections SQL et XSS
- validation stricte des formulaires
- limitation de débit (rate limiting)
- en-têtes de sécurité HTTP
- blocage des attaques de force brute sur les endpoints sensibles

## Démarrage

```bash
npm install
npm start
```

Puis ouvrez :

```text
http://localhost:3000
```

## Points importants

- Ce site reste un site statique, donc la sécurité réelle nécessite aussi une configuration HTTPS, sauvegardes, surveillance et un hébergement sécurisé.
- Pour un vrai formulaire de contact, il faut connecter l’API à un service backend comme Nodemailer, SendGrid ou une base de données protégée.
