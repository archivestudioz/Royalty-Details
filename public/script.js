// Sticky header shadow on scroll
const header = document.getElementById('siteHeader');
const onScroll = () => {
  if (!header) return;
  if (window.scrollY > 20) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const primaryNav = document.getElementById('primaryNav');
if (navToggle && primaryNav) {
  navToggle.addEventListener('click', () => {
    const open = primaryNav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
  });
  primaryNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      primaryNav.classList.remove('open');
      navToggle.classList.remove('open');
    });
  });
}

// Reveal-on-scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Reviews marquee — duplicate cards for seamless infinite loop
const reviewsTrack = document.getElementById('reviewsTrack');
if (reviewsTrack) {
  const cards = Array.from(reviewsTrack.children);
  cards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    reviewsTrack.appendChild(clone);
  });
}

// Capture lead-source attribution on first landing and persist for this session.
// We keep the FIRST values seen so a follow-up visit from a bookmark doesn't overwrite the original source.
(function captureAttribution() {
  try {
    const KEY = 'rd_attr_v1';
    if (sessionStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const attr = {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      referrer: document.referrer || null,
      landing_path: window.location.pathname || null,
    };
    sessionStorage.setItem(KEY, JSON.stringify(attr));
  } catch (_) { /* sessionStorage unavailable — ignore */ }
})();

function getAttribution() {
  try {
    const raw = sessionStorage.getItem('rd_attr_v1');
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

// Contact form — posts to the admin backend (set window.RD_API_BASE before this script if hosting separately)
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
const API_BASE = (typeof window !== 'undefined' && window.RD_API_BASE) || '';
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;

    const data = Object.fromEntries(new FormData(form).entries());
    Object.assign(data, getAttribution());

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Request failed');
      if (note) {
        note.textContent = "Thanks — we'll be in touch shortly.";
        note.hidden = false;
        form.reset();
        setTimeout(() => { note.hidden = true; }, 6000);
      }
    } catch (err) {
      if (note) {
        note.textContent = "Sorry — couldn't send right now. Please try again or call us.";
        note.hidden = false;
      }
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}
