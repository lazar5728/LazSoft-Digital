const adminMode = new URLSearchParams(window.location.search).get('admin') === '1';

if (adminMode) {
  document.documentElement.classList.add('admin-mode');
  document.querySelectorAll('.admin-only[hidden]').forEach((element) => {
    element.removeAttribute('hidden');
  });
}

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');

if (toggle && nav) {
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
}

const sanitizeInput = (value) => String(value ?? '').replace(/[<>]/g, '').trim();
const hasDangerousPattern = (value) => /<\s*script|javascript:|on\w+\s*=|data\s*:\s*text\/html|\b(?:union|select|insert|delete|update|drop|alter|truncate|exec)\b/i.test(value);

const contactForm = document.querySelector('#contact-form');
const contactStatus = document.querySelector('#form-status');

if (contactForm && contactStatus) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = {
      name: sanitizeInput(formData.get('name')),
      activity: sanitizeInput(formData.get('activity')),
      message: sanitizeInput(formData.get('message'))
    };

    if (!payload.name || !payload.activity || !payload.message) {
      contactStatus.textContent = 'Veuillez remplir tous les champs pour continuer.';
      contactStatus.style.color = '#b42318';
      return;
    }

    if (payload.name.length < 2 || payload.activity.length < 2 || payload.message.length < 10) {
      contactStatus.textContent = 'Les informations saisies sont trop courtes ou incomplètes.';
      contactStatus.style.color = '#b42318';
      return;
    }

    if (Object.values(payload).some(hasDangerousPattern)) {
      contactStatus.textContent = 'Contenu invalide détecté. Merci de réécrire votre message.';
      contactStatus.style.color = '#b42318';
      return;
    }

    const subject = `Demande de contact - ${payload.activity}`;
    const body = [
      `Nom : ${payload.name}`,
      `Activité : ${payload.activity}`,
      '',
      'Message :',
      payload.message
    ].join('\n');

    contactStatus.textContent = 'Votre application de messagerie va s’ouvrir. Vérifiez le message avant de l’envoyer.';
    contactStatus.style.color = '#0f172a';
    window.location.href = `mailto:contact@lazsof-digital.com?${new URLSearchParams({ subject, body })}`;
  });
}

const contentKey = 'lazsof-digital-content-draft-v1';
const contentStatus = document.querySelector('#admin-status');
const editorDialog = document.querySelector('#content-editor');
const editorForm = document.querySelector('#content-editor-form');
const editorFields = document.querySelector('#editor-fields');
const editorTitle = document.querySelector('#editor-title');
const editorError = document.querySelector('#editor-error');
let currentContentType = '';
let content = { logos: [], testimonials: [], projects: [], demos: [] };
let contentReady = false;

const fieldDefinitions = {
  logo: {
    title: 'Ajouter un logo client',
    collection: 'logos',
    fields: [
      { name: 'name', label: 'Nom de l’entreprise', type: 'text', required: true, maxLength: 100 },
      { name: 'image', label: 'Chemin du logo dans le dossier images', type: 'text', required: true, placeholder: 'images/logo-client.png', maxLength: 180 }
    ]
  },
  testimonial: {
    title: 'Ajouter un témoignage',
    collection: 'testimonials',
    fields: [
      { name: 'author', label: 'Nom du client', type: 'text', required: true, maxLength: 100 },
      { name: 'company', label: 'Entreprise', type: 'text', required: false, maxLength: 100 },
      { name: 'quote', label: 'Témoignage', type: 'textarea', required: true, maxLength: 1000 }
    ]
  },
  project: {
    title: 'Ajouter une réalisation',
    collection: 'projects',
    fields: [
      { name: 'title', label: 'Nom du projet', type: 'text', required: true, maxLength: 100 },
      { name: 'category', label: 'Catégorie', type: 'text', required: true, maxLength: 60 },
      { name: 'description', label: 'Description', type: 'textarea', required: true, maxLength: 600 },
      { name: 'image', label: 'Image dans le dossier images (facultatif)', type: 'text', required: false, placeholder: 'images/mon-projet.png', maxLength: 180 },
      { name: 'url', label: 'Lien du projet (facultatif)', type: 'url', required: false, placeholder: 'https://exemple.com', maxLength: 300 }
    ]
  },
  demo: {
    title: 'Ajouter une démonstration',
    collection: 'demos',
    fields: [
      { name: 'title', label: 'Nom du site', type: 'text', required: true, maxLength: 100 },
      { name: 'category', label: 'Type de site', type: 'text', required: true, maxLength: 60 },
      { name: 'tagline', label: 'Phrase de présentation', type: 'text', required: true, maxLength: 140 },
      { name: 'path', label: 'Fichier HTML dans site_client', type: 'text', required: true, placeholder: 'Cakes by Rk.html ou dossier/index.html', maxLength: 240 }
    ]
  }
};

const isImagePath = (value) => /^images\/[A-Za-z0-9._/-]+$/.test(value) && !value.split('/').includes('..');
const isDemoPath = (value) => typeof value === 'string' &&
  value.length <= 240 &&
  value.toLowerCase().endsWith('.html') &&
  !value.startsWith('/') &&
  !value.includes('\\') &&
  value.split('/').every((segment) =>
    segment && segment !== '.' && segment !== '..' && !/[?#%<>:"|*\x00-\x1f]/.test(segment)
  );
const isHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const validateEntry = (type, entry) => {
  if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string') {
    throw new Error('Un élément du fichier de contenu est invalide.');
  }

  if (type === 'logo' && typeof entry.name === 'string' && entry.name.length <= 100 && isImagePath(entry.image)) return;
  if (type === 'testimonial' &&
      typeof entry.author === 'string' && entry.author.length <= 100 &&
      typeof entry.quote === 'string' && entry.quote.length >= 10 && entry.quote.length <= 1000 &&
      (entry.company === undefined || (typeof entry.company === 'string' && entry.company.length <= 100))) return;
  if (type === 'project' &&
      typeof entry.title === 'string' && entry.title.length <= 100 &&
      typeof entry.category === 'string' && entry.category.length <= 60 &&
      typeof entry.description === 'string' && entry.description.length <= 600 &&
      (!entry.image || isImagePath(entry.image)) &&
      (!entry.url || (typeof entry.url === 'string' && entry.url.length <= 300 && isHttpUrl(entry.url)))) {
    return;
  }
  if (type === 'demo' &&
      typeof entry.title === 'string' && entry.title.length <= 100 &&
      typeof entry.category === 'string' && entry.category.length <= 60 &&
      typeof entry.tagline === 'string' && entry.tagline.length <= 140 &&
      isDemoPath(entry.path)) return;

  throw new Error('Un élément du fichier de contenu est invalide.');
};

const validateContent = (value) => {
  if (!value || typeof value !== 'object' ||
      !Array.isArray(value.logos) ||
      !Array.isArray(value.testimonials) ||
      !Array.isArray(value.projects) ||
      (value.demos !== undefined && !Array.isArray(value.demos))) {
    throw new Error('Le fichier site-content.json doit contenir les listes logos, testimonials, projects et demos.');
  }

  if (!value.demos) value.demos = [];
  value.logos.forEach((entry) => validateEntry('logo', entry));
  value.testimonials.forEach((entry) => validateEntry('testimonial', entry));
  value.projects.forEach((entry) => validateEntry('project', entry));
  value.demos.forEach((entry) => validateEntry('demo', entry));
  return value;
};

const mergeContent = (published, draft) => {
  const merged = {};

  Object.keys(published).forEach((collection) => {
    const records = new Map(published[collection].map((entry) => [entry.id, entry]));
    draft[collection].forEach((entry) => records.set(entry.id, entry));
    merged[collection] = [...records.values()];
  });

  return merged;
};

const appendText = (parent, tagName, className, value) => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = value;
  parent.append(element);
  return element;
};

const makeId = () => {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

let logoCarouselIndex = 0;
let logoCarouselTimer = null;
let logoCarouselPaused = false;

const stopLogoCarousel = () => {
  if (logoCarouselTimer !== null) {
    window.clearInterval(logoCarouselTimer);
    logoCarouselTimer = null;
  }
};

const renderLogoCarousel = () => {
  const carousel = document.querySelector('#client-logo-carousel');
  const list = document.querySelector('#client-logo-list');
  const controls = document.querySelector('#client-logo-controls');
  const counter = document.querySelector('#client-logo-counter');

  list.replaceChildren();
  carousel.hidden = content.logos.length === 0;
  controls.hidden = content.logos.length < 2;
  if (content.logos.length === 0) return;

  logoCarouselIndex %= content.logos.length;
  const logo = content.logos[logoCarouselIndex];
  const card = document.createElement('div');
  card.className = 'client-logo-card';
  const image = document.createElement('img');
  image.src = logo.image;
  image.alt = `Logo de ${logo.name}`;
  image.loading = 'lazy';
  card.append(image);
  appendText(card, 'span', '', logo.name);
  list.append(card);
  counter.textContent = `${logoCarouselIndex + 1} / ${content.logos.length}`;
};

const startLogoCarousel = () => {
  stopLogoCarousel();
  if (logoCarouselPaused || document.hidden || content.logos.length < 2) return;

  logoCarouselTimer = window.setInterval(() => {
    logoCarouselIndex = (logoCarouselIndex + 1) % content.logos.length;
    renderLogoCarousel();
  }, 5000);
};

const renderContent = () => {
  const clientSection = document.querySelector('#clients');
  const clientEmpty = document.querySelector('#client-logo-empty');
  const testimonialList = document.querySelector('#testimonial-list');
  const testimonialEmpty = document.querySelector('#testimonial-empty');
  const projectSection = document.querySelector('#added-projects-section');
  const projectList = document.querySelector('#added-projects');
  const demoList = document.querySelector('#demo-list');

  renderLogoCarousel();
  startLogoCarousel();
  clientEmpty.hidden = content.logos.length > 0;
  if (adminMode || content.logos.length > 0) {
    clientSection.hidden = false;
    if (!adminMode) clientSection.classList.remove('admin-only');
  } else {
    clientSection.hidden = true;
  }

  testimonialList.replaceChildren();
  content.testimonials.forEach((testimonial) => {
    const card = document.createElement('article');
    card.className = 'testimonial-card';
    appendText(card, 'p', '', `« ${testimonial.quote} »`);
    const attribution = document.createElement('div');
    attribution.className = 'testimonial-attribution';
    appendText(attribution, 'strong', '', testimonial.author);
    if (testimonial.company) appendText(attribution, 'span', '', testimonial.company);
    card.append(attribution);
    testimonialList.append(card);
  });
  testimonialEmpty.hidden = content.testimonials.length > 0;

  projectList.replaceChildren();
  content.projects.forEach((project) => {
    const card = document.createElement('article');
    card.className = 'project';
    const preview = document.createElement('div');
    preview.className = 'project-ui';
    if (project.image) {
      const image = document.createElement('img');
      image.className = 'project-preview';
      image.src = project.image;
      image.alt = '';
      image.loading = 'lazy';
      preview.append(image);
    }
    appendText(preview, 'span', '', project.category);
    appendText(preview, 'strong', '', project.title);
    card.append(preview);
    const details = document.createElement('div');
    details.className = 'project-info';
    appendText(details, 'p', '', project.description);
    if (project.url) {
      const link = document.createElement('a');
      link.href = project.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'text-link';
      link.textContent = 'Voir le projet ↗';
      details.append(link);
    }
    card.append(details);
    projectList.append(card);
  });

  projectSection.hidden = !adminMode && content.projects.length === 0;
  if (!adminMode && content.projects.length > 0) projectSection.classList.remove('admin-only');

  demoList.replaceChildren();
  content.demos.forEach((demo, index) => {
    const card = document.createElement('article');
    card.className = `project p${(index % 5) + 1}`;
    const preview = document.createElement('div');
    preview.className = 'project-ui';
    appendText(preview, 'span', '', demo.category);
    appendText(preview, 'strong', '', demo.tagline);
    card.append(preview);

    const details = document.createElement('div');
    details.className = 'project-info';
    appendText(details, 'span', '', demo.category);
    appendText(details, 'h3', '', demo.title);
    const link = document.createElement('a');
    link.href = `site_client/${demo.path.split('/').map(encodeURIComponent).join('/')}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'demo-btn';
    link.textContent = 'Voir la démo ↗';
    details.append(link);
    card.append(details);
    demoList.append(card);
  });
};

const loadContent = async () => {
  try {
    const response = await fetch('site-content.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Impossible de charger site-content.json (${response.status}).`);

    const published = validateContent(await response.json());
    if (adminMode) {
      const savedDraft = localStorage.getItem(contentKey);
      if (savedDraft) {
        content = mergeContent(published, validateContent(JSON.parse(savedDraft)));
      } else {
        content = published;
      }
    } else {
      content = published;
    }

    renderContent();
    contentReady = true;
  } catch (error) {
    if (contentStatus) contentStatus.textContent = `Erreur de chargement : ${error.message}`;
    console.error('Erreur de chargement du contenu du site :', error);
  }
};

const openEditor = (type) => {
  const definition = fieldDefinitions[type];
  if (!definition || !editorDialog || !editorForm || !editorFields || !editorTitle) return;
  if (!contentReady) {
    if (contentStatus) contentStatus.textContent = 'Le contenu du site est encore en cours de chargement.';
    return;
  }

  currentContentType = type;
  editorTitle.textContent = definition.title;
  editorFields.replaceChildren();
  editorError.textContent = '';

  definition.fields.forEach((field) => {
    const label = document.createElement('label');
    const input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
    const inputId = `editor-${field.name}`;
    label.htmlFor = inputId;
    label.textContent = field.label;
    input.id = inputId;
    input.name = field.name;
    input.required = field.required;
    input.maxLength = field.maxLength;
    if (field.type !== 'textarea') input.type = field.type;
    if (field.placeholder) input.placeholder = field.placeholder;
    label.append(input);
    editorFields.append(label);
  });

  editorDialog.showModal();
  editorFields.querySelector('input, textarea').focus();
};

document.querySelectorAll('[data-content-type]').forEach((button) => {
  button.addEventListener('click', () => openEditor(button.dataset.contentType));
});

document.querySelector('#client-logo-previous')?.addEventListener('click', () => {
  if (content.logos.length < 2) return;
  logoCarouselIndex = (logoCarouselIndex - 1 + content.logos.length) % content.logos.length;
  renderLogoCarousel();
  startLogoCarousel();
});

document.querySelector('#client-logo-next')?.addEventListener('click', () => {
  if (content.logos.length < 2) return;
  logoCarouselIndex = (logoCarouselIndex + 1) % content.logos.length;
  renderLogoCarousel();
  startLogoCarousel();
});

document.querySelector('#client-logo-toggle')?.addEventListener('click', (event) => {
  logoCarouselPaused = !logoCarouselPaused;
  const button = event.currentTarget;
  button.textContent = logoCarouselPaused ? 'Reprendre' : 'Pause';
  button.setAttribute('aria-pressed', String(logoCarouselPaused));
  if (logoCarouselPaused) stopLogoCarousel();
  else startLogoCarousel();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLogoCarousel();
  else startLogoCarousel();
});

if (editorForm && editorDialog && editorError) {
  editorForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const definition = fieldDefinitions[currentContentType];
    if (!definition) return;

    const formData = new FormData(editorForm);
    const entry = { id: makeId() };
    definition.fields.forEach((field) => {
      entry[field.name] = sanitizeInput(formData.get(field.name));
    });

    if (currentContentType === 'logo' && !isImagePath(entry.image)) {
      editorError.textContent = 'Indique un chemin d’image valide, par exemple images/logo-client.png.';
      return;
    }
    if (currentContentType === 'testimonial' && entry.quote.length < 10) {
      editorError.textContent = 'Le témoignage doit contenir au moins 10 caractères.';
      return;
    }
    if (currentContentType === 'project' && entry.image && !isImagePath(entry.image)) {
      editorError.textContent = 'L’image doit se trouver dans le dossier images.';
      return;
    }
    if (currentContentType === 'project' && entry.url) {
      if (!isHttpUrl(entry.url)) {
        editorError.textContent = 'Indique un lien web valide commençant par https://.';
        return;
      }
    }
    if (currentContentType === 'demo' && !isDemoPath(entry.path)) {
      editorError.textContent = 'Indique un fichier HTML valide dans site_client, sans remonter vers un autre dossier.';
      return;
    }

    content[definition.collection].push(entry);
    try {
      localStorage.setItem(contentKey, JSON.stringify(content));
    } catch (error) {
      content[definition.collection].pop();
      editorError.textContent = `Impossible d’enregistrer le brouillon dans ce navigateur : ${error.message}`;
      return;
    }

    renderContent();
    editorDialog.close();
    editorForm.reset();
    if (contentStatus) contentStatus.textContent = 'Ajouté à cet aperçu. Télécharge les changements pour les publier sur le site.';
  });
}

const closeEditor = () => {
  if (editorDialog && editorDialog.open) editorDialog.close();
};

document.querySelector('#editor-close')?.addEventListener('click', closeEditor);
document.querySelector('#editor-cancel')?.addEventListener('click', closeEditor);

document.querySelector('#export-content')?.addEventListener('click', () => {
  const file = new Blob([`${JSON.stringify(content, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const download = document.createElement('a');
  download.href = url;
  download.download = 'site-content.json';
  document.body.append(download);
  download.click();
  download.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  if (contentStatus) contentStatus.textContent = 'Fichier téléchargé. Remplace site-content.json dans le projet et republie le site pour partager les ajouts.';
});

if (adminMode && contentStatus) {
  contentStatus.textContent = 'Mode gestion temporaire : crée un ajout, puis télécharge le fichier pour le publier sur GitHub Pages.';
}

loadContent();
