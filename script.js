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

// Contact form (front-end only — wire up to a real backend later)
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (note) {
      note.hidden = false;
      form.reset();
      setTimeout(() => { note.hidden = true; }, 6000);
    }
  });
}
