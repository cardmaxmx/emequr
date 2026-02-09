const CONTACT = {
  firstName: 'Carlos Enrique',
  lastName: 'de la Garza Silva',
  fullName: 'Carlos Enrique de la Garza Silva',
  title: 'Representante de Ventas',
  company: 'Grupo EMEQUR',
  phoneDisplay: '44 4256 2833',
  phoneE164: '+524442562833',
  email: 'ventas2@emequr.com.mx',
  website: 'https://emequr.com',
  branch: 'Suc. Alpes',
  addressLine: 'Cordillera de los Alpes 990, Col. Villas del Pedregal',
  cityRegion: 'San Luis Potosí, SLP',
  postalCode: '78218',
  country: 'MX'
};

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
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${CONTACT.lastName};${CONTACT.firstName};;;`,
    `FN:${CONTACT.fullName}`,
    `ORG:${CONTACT.company}`,
    `TITLE:${CONTACT.title}`,
    `TEL;TYPE=CELL,VOICE:${CONTACT.phoneE164}`,
    `EMAIL;TYPE=INTERNET:${CONTACT.email}`,
    `URL:${CONTACT.website}`,
    `ADR;TYPE=WORK:;;${CONTACT.addressLine};${CONTACT.cityRegion};;${CONTACT.postalCode};${CONTACT.country}`,
    'END:VCARD'
  ];

  return lines.join('\n');
}

function downloadVCard() {
  const vcf = buildVCard();
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Carlos-Enrique-de-la-Garza-Silva-Grupo-EMEQUR.vcf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function shareCard() {
  const shareData = {
    title: `${CONTACT.fullName} | ${CONTACT.company}`,
    text: `${CONTACT.title} • ${CONTACT.phoneDisplay} • ${CONTACT.email}`,
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
  const mailHref = `mailto:${CONTACT.email}`;
  const mapsQuery = encodeURIComponent(
    `${CONTACT.branch}, ${CONTACT.addressLine}, CP ${CONTACT.postalCode}, ${CONTACT.cityRegion}`
  );
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

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
    node.setAttribute('href', href);
  }
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

  wireLinks();
}

document.addEventListener('DOMContentLoaded', main);
