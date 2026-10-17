// Maurice RJ website: language switch (English / Espanol) and quote form.

// When a Formspree form is created for Maurice, paste its address here
// (looks like https://formspree.io/f/abcdwxyz). Until then the form opens an email instead.
const FORM_ENDPOINT = '';
const EMAIL = 'mauricelawncare815@gmail.com';

(function () {
  const root = document.documentElement;

  function getSaved() {
    try { return localStorage.getItem('lang'); } catch (e) { return null; }
  }
  function save(lang) {
    try { localStorage.setItem('lang', lang); } catch (e) { /* storage blocked: still works for this visit */ }
  }

  function setLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    document.querySelectorAll('[data-ph-en]').forEach(el => {
      el.setAttribute('placeholder', el.getAttribute(lang === 'es' ? 'data-ph-es' : 'data-ph-en'));
    });
    const title = root.getAttribute(lang === 'es' ? 'data-title-es' : 'data-title-en');
    if (title) document.title = title;
    document.querySelectorAll('.lang-toggle').forEach(b => {
      b.textContent = lang === 'es' ? 'English' : 'Español';
      b.setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');
    });
  }

  setLang(getSaved() === 'es' ? 'es' : 'en');
  document.querySelectorAll('.lang-toggle').forEach(b => b.addEventListener('click', () => {
    const next = root.getAttribute('data-lang') === 'es' ? 'en' : 'es';
    setLang(next);
    save(next);
  }));

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // ---------- Quote form ----------
  const form = document.getElementById('quote-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const say = (en, es) => { status.textContent = root.getAttribute('data-lang') === 'es' ? es : en; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());

    if (FORM_ENDPOINT) {
      say('Sending...', 'Enviando...');
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        say('Thank you! Maurice will contact you soon.', '¡Gracias! Maurice se comunicará con usted pronto.');
      } catch (err) {
        say('The form could not be sent. Please call or text (815) 289-1149.',
            'No se pudo enviar. Por favor llame o mande texto al (815) 289-1149.');
      }
      return;
    }

    // No form service yet: open the visitor's email app with the request filled in.
    const subject = `Quote request: ${data.service || 'General'} (${data.name})`;
    const body = [
      `Name: ${data.name}`, `Phone: ${data.phone}`, `Email: ${data.email || ''}`,
      `Address / town: ${data.address || ''}`, `Service: ${data.service}`, '', data.message || '',
    ].join('\n');
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    say('Your email app should open with your request. If it does not, call or text (815) 289-1149.',
        'Su correo debería abrirse con su solicitud. Si no, llame o mande texto al (815) 289-1149.');
  });
})();
