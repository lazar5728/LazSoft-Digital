const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const isProduction = process.env.NODE_ENV === 'production';

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://wa.me; upgrade-insecure-requests",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'X-XSS-Protection': '0',
  'Strict-Transport-Security': isProduction ? 'max-age=31536000; includeSubDomains' : 'max-age=31536000; includeSubDomains'
};

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

Object.entries(securityHeaders).forEach(([key, value]) => {
  app.use((req, res, next) => {
    res.setHeader(key, value);
    next();
  });
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez plus tard.' }
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de demandes dépassée. Réessayez dans 1 heure.' }
});

app.use('/api/', apiLimiter);

const rejectMalicious = (value) => {
  if (typeof value !== 'string') return true;
  const forbidden = [
    /\b(or|and)\s+\d+\s*=\s*\d+/i,
    /--\s*$/,
    /;\s*(drop|delete|update|insert|alter|truncate|exec|union|select)/i,
    /<\s*script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\bunion\s+select\b/i,
    /\bselect\b.*\bfrom\b/i,
    /\binsert\b.*\binto\b/i,
    /\bdelete\b.*\bfrom\b/i,
    /\bupdate\b.*\bset\b/i
  ];

  return forbidden.some((pattern) => pattern.test(value));
};

const validateContactInput = (payload) => {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload invalide.'] };
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const activity = typeof payload.activity === 'string' ? payload.activity.trim() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!name || name.length < 2) errors.push('Nom invalide.');
  if (!activity || activity.length < 2) errors.push('Activité invalide.');
  if (!message || message.length < 10) errors.push('Message trop court.');

  if (rejectMalicious(name) || rejectMalicious(activity) || rejectMalicious(message)) {
    errors.push('Contenu interdit détecté.');
  }

  if (name.length > 80 || activity.length > 120 || message.length > 600) {
    errors.push('Données trop longues.');
  }

  if (!validator.isAlpha(validator.blacklist(name, "'\"- .")) && !validator.matches(name, /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9\s'-.]+$/)) {
    errors.push('Nom contient des caractères non autorisés.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

app.post('/api/contact', contactLimiter, (req, res) => {
  const validation = validateContactInput(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      ok: false,
      message: validation.errors[0] || 'Données invalides.'
    });
  }

  return res.status(200).json({
    ok: true,
    message: 'Merci ! Votre demande est bien reçue. Nous revenons vers vous sous 24 heures.'
  });
});

const publicFiles = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/styles.css', 'styles.css'],
  ['/content.css', 'content.css'],
  ['/script.js', 'script.js'],
  ['/md5.js', 'md5.js'],
  ['/site-content.json', 'site-content.json'],
  ['/Lazsoft_Digital.wav', 'Lazsoft_Digital.wav']
]);

publicFiles.forEach((file, route) => {
  app.get(route, (req, res) => {
    res.setHeader('Cache-Control', route.endsWith('.html') ? 'no-cache' : 'public, max-age=3600');
    res.sendFile(path.join(__dirname, file));
  });
});

app.use('/images', express.static(path.join(__dirname, 'images'), {
  dotfiles: 'deny',
  index: false
}));
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  dotfiles: 'deny',
  index: false
}));
app.use('/site_client', express.static(path.join(__dirname, 'site_client'), {
  dotfiles: 'deny',
  index: 'index.html'
}));

app.use((req, res) => {
  res.status(404).json({ ok: false, message: 'Ressource introuvable.' });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.message);
  res.status(500).json({ ok: false, message: 'Erreur interne du serveur.' });
});

app.listen(PORT, () => {
  console.log(`Serveur sécurisé démarré sur http://localhost:${PORT}`);
});
