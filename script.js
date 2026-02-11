function digitsOnly(value) {
  return String(value || '').replace(/\D+/g, '');
}

function normalizePhoneToE164(phoneDisplay, countryCallingCode = '52') {
  const digits = digitsOnly(phoneDisplay);
  if (!digits) return '';
  if (digits.startsWith(countryCallingCode) && digits.length > 10) return `+${digits}`;
  if (digits.length === 10) return `+${countryCallingCode}${digits}`;
  if (digits.length === 12 && digits.startsWith(countryCallingCode)) return `+${digits}`;
  return `+${countryCallingCode}${digits}`;
}

function slugifyFilename(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function hydrateContact(raw) {
  const base = raw && typeof raw === 'object' ? raw : {};
  const website = base.website
    ? String(base.website).startsWith('http')
      ? base.website
      : `https://${base.website}`
    : 'https://emequr.com';

  const phones = Array.isArray(base.phones)
    ? base.phones
    : [
        {
          display: base.phoneDisplay,
          e164: base.phoneE164,
          type: 'CELL'
        }
      ].filter((p) => p.display || p.e164);

  const normalizedPhones = phones
    .map((p) => {
      const display = p.display || '';
      const e164 = p.e164 || normalizePhoneToE164(display);
      return { ...p, display, e164 };
    })
    .filter((p) => p.display || p.e164);

  const phoneDisplay =
    base.phoneDisplay ||
    normalizedPhones
      .map((p) => p.display)
      .filter(Boolean)
      .join(' / ');

  const primaryPhoneE164 = normalizedPhones[0]?.e164 || base.phoneE164 || '';

  return {
    company: 'Grupo EMEQUR',
    country: 'MX',
    ...base,
    website,
    phones: normalizedPhones,
    phoneDisplay,
    phoneE164: primaryPhoneE164
  };
}

function getContact() {
  // Each employee HTML sets window.CONTACT = {...}
  // Fallback keeps the page functional if CONTACT isn't present.
  return hydrateContact(
    window.CONTACT || {
      firstName: 'Grupo',
      lastName: 'EMEQUR',
      fullName: 'Grupo EMEQUR',
      title: 'Tarjeta digital',
      phones: [],
      email: '',
      website: 'https://emequr.com',
      branch: '',
      addressLine: '',
      cityRegion: '',
      postalCode: '',
      country: 'MX'
    }
  );
}

const CONTACT = getContact();

function el(id) {
  return document.getElementById(id);
}

function showToast(message) {
  const toast = el('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => toast.classList.remove('show'), 1600);
}

function buildVCard() {
  const phones = Array.isArray(CONTACT.phones) ? CONTACT.phones : [];
  const hasAddress = Boolean(CONTACT.addressLine || CONTACT.cityRegion || CONTACT.postalCode);
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${CONTACT.lastName};${CONTACT.firstName};;;`,
    `FN:${CONTACT.fullName}`,
    `ORG:${CONTACT.company}`,
    `TITLE:${CONTACT.title}`,
    ...phones
      .map((p) => {
        const type = p.type || 'CELL';
        const e164 = p.e164 || '';
        if (!e164) return null;
        return `TEL;TYPE=${type},VOICE:${e164}`;
      })
      .filter(Boolean),
    ...(CONTACT.email ? [`EMAIL;TYPE=INTERNET:${CONTACT.email}`] : []),
    ...(CONTACT.website ? [`URL:${CONTACT.website}`] : []),
    'END:VCARD'
  ];

  if (hasAddress) {
    const addressLine = CONTACT.addressLine || '';
    const cityRegion = CONTACT.cityRegion || '';
    const postalCode = CONTACT.postalCode || '';
    const country = CONTACT.country || 'MX';
    lines.splice(lines.length - 1, 0, `ADR;TYPE=WORK:;;${addressLine};${cityRegion};;${postalCode};${country}`);
  }

  return lines.join('\n');
}

function downloadVCard() {
  const vcf = buildVCard();
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugifyFilename(CONTACT.fullName)}-grupo-emequr.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function shareCard() {
  const parts = [CONTACT.title, CONTACT.phoneDisplay, CONTACT.email].filter(Boolean);
  const shareData = {
    title: `${CONTACT.fullName} | ${CONTACT.company}`,
    text: parts.join(' • '),
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch {
      // User canceled or share failed; fall through to copy.
    }
  }

  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast('Enlace copiado');
  } catch {
    showToast('No se pudo copiar el enlace');
  }
}

function wireLinks() {
  const telHref = `tel:${CONTACT.phoneE164}`;
  const mailHref = CONTACT.email ? `mailto:${CONTACT.email}` : '';

  const mapNode = el('mapLink');
  let mapsHref = '';
  if (mapNode) {
    const parts = [CONTACT.branch, CONTACT.addressLine, CONTACT.postalCode && `CP ${CONTACT.postalCode}`, CONTACT.cityRegion]
      .filter(Boolean)
      .join(', ');
    const query = parts || CONTACT.company || 'Grupo EMEQUR';
    mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  const links = {
    callLink: telHref,
    emailLink: mailHref,
    webLink: CONTACT.website,
    mapLink: mapsHref,
    pillPhone: telHref,
    pillEmail: mailHref,
    pillWeb: CONTACT.website
  };

  for (const [id, href] of Object.entries(links)) {
    const node = el(id);
    if (!node) continue;

    if (!href) {
      node.hidden = true;
      continue;
    }

    node.hidden = false;
    node.setAttribute('href', href);
  }
}

function websiteLabel(value) {
  return String(value || '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function setLinkText(id, text) {
  const node = el(id);
  if (!node || !text) return;
  const icon = node.querySelector('svg');
  if (!icon) return;
  const iconClone = icon.cloneNode(true);
  node.textContent = '';
  node.appendChild(iconClone);
  node.appendChild(document.createTextNode(` ${text}`));
}

function hydrateVisibleContactData() {
  const phoneText = CONTACT.phoneDisplay || 'Teléfono';
  const emailText = CONTACT.email || 'Correo';
  const webText = websiteLabel(CONTACT.website) || 'emequr.com';
  const addressText =
    [CONTACT.branch, CONTACT.addressLine, CONTACT.postalCode ? `CP ${CONTACT.postalCode}` : '', CONTACT.cityRegion]
      .filter(Boolean)
      .join(' · ') || 'Buscar sucursal EMEQUR';

  setLinkText('pillPhone', phoneText);
  setLinkText('pillEmail', emailText);
  setLinkText('pillWeb', webText);

  const callSub = el('callLink')?.querySelector('.sub');
  if (callSub) callSub.textContent = phoneText;

  const emailSub = el('emailLink')?.querySelector('.sub');
  if (emailSub) emailSub.textContent = emailText;

  const webSub = el('webLink')?.querySelector('.sub');
  if (webSub) webSub.textContent = webText;

  const mapSub = el('mapLink')?.querySelector('.sub');
  if (mapSub) mapSub.textContent = addressText;
}

function main() {
  const saveBtn = el('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      downloadVCard();
      showToast('Contacto descargado');
    });
  }

  const shareBtn = el('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', (e) => {
      e.preventDefault();
      shareCard();
    });
  }

  hydrateVisibleContactData();
  wireLinks();
}

document.addEventListener('DOMContentLoaded', main);
