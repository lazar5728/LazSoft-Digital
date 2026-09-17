const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');

if (toggle && nav) {
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
  document.querySelectorAll('.nav-links a').forEach((a) => {
    a.addEventListener('click', () => nav.classList.remove('open'));
  });
}

const sanitizeInput = (value) => String(value ?? '').replace(/[<>]/g, '').trim();
const hasDangerousPattern = (value) => /<\s*script|javascript:|on\w+\s*=|data\s*:\s*text\/html|\b(?:union|select|insert|delete|update|drop|alter|truncate|exec)\b/i.test(value);

const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');

if (form && status) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      name: sanitizeInput(formData.get('name')),
      activity: sanitizeInput(formData.get('activity')),
      message: sanitizeInput(formData.get('message'))
    };

    if (!payload.name || !payload.activity || !payload.message) {
      status.textContent = 'Veuillez remplir tous les champs pour continuer.';
      status.style.color = '#b42318';
      return;
    }

    if (payload.name.length < 2 || payload.activity.length < 2 || payload.message.length < 10) {
      status.textContent = 'Les informations saisies sont trop courtes ou incomplètes.';
      status.style.color = '#b42318';
      return;
    }

    if (Object.values(payload).some(hasDangerousPattern)) {
      status.textContent = 'Contenu invalide détecté. Merci de réécrire votre message.';
      status.style.color = '#b42318';
      return;
    }

    status.textContent = 'Envoi en cours...';
    status.style.color = '#0f172a';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de l\'envoi du message.');
      }

      status.textContent = result.message;
      status.style.color = '#0f172a';
      form.reset();
    } catch (error) {
      status.textContent = error.message || 'Une erreur s\'est produite.';
      status.style.color = '#b42318';
    }
  });
}

document.querySelectorAll('.demo-btn').forEach((button) => {
  button.addEventListener('click', () => {
    button.textContent = 'Démo bientôt disponible ↗';
    button.disabled = true;
  });
});
