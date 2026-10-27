/* ══════════════════════════════════════════════════════════════════
   INTERACCIONES PRINCIPALES — Ing. de Sistemas · UAP
   1. Preloader        2. Navbar (scroll, menú, indicador activo)
   3. Progreso scroll  4. Typewriter          5. Reveal on scroll
   6. Efecto Tilt 3D   7. Plan de estudios (tabs + acordeón)
   8. Tabs de juegos   9. Generador QR       10. Volver arriba
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═════════════ 1. PRELOADER ═════════════ */
  window.addEventListener('load', () => {
    const pre = $('#preloader');
    if (pre) setTimeout(() => { pre.classList.add('hide'); document.body.classList.add('loaded'); }, 350);
  });
  // Respaldo por si 'load' tarda (recursos externos)
  setTimeout(() => { const p = $('#preloader'); if (p) p.classList.add('hide'); }, 3500);

  /* ═════════════ 2. NAVBAR ═════════════ */
  const navbar   = $('#navbar');
  const menuBtn  = $('#menu-btn');
  const mobile   = $('#mobile-menu');
  const progress = $('#scroll-progress');
  const toTop    = $('#to-top');

  // Menú hamburguesa animado
  if (menuBtn && mobile) {
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      mobile.style.maxHeight = open ? mobile.scrollHeight + 'px' : '0px';
    });
    // Cerrar al elegir una opción
    $$('.mobile-link', mobile).forEach(a => a.addEventListener('click', () => {
      menuBtn.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      mobile.style.maxHeight = '0px';
    }));
    // Recalcular altura si cambia el viewport
    window.addEventListener('resize', () => {
      if (menuBtn.classList.contains('open')) mobile.style.maxHeight = mobile.scrollHeight + 'px';
      else mobile.style.maxHeight = '0px';
    });
  }

  /* ═════════════ SCROLL: progreso · navbar · "arriba" · reveal · spy ═════════════
     Nota: se calcula directamente sobre el evento `scroll` (el navegador ya lo
     dispara como máximo una vez por cuadro) en lugar de vía requestAnimationFrame,
     para que la interfaz nunca quede congelada si el navegador estrangula rAF
     (ventana oculta, ahorro de batería, etc.). */
  const reveals = $$('.reveal');
  const sections = $$('main [data-observe]');
  const navLinks = $$('#nav-links .nav-link');

  function onScroll() {
    const y = window.scrollY;
    const vh = window.innerHeight;

    // ── barra de progreso ──
    const max = document.documentElement.scrollHeight - vh;
    if (progress) progress.style.width = Math.min(100, max > 0 ? (y / max) * 100 : 0) + '%';

    // ── sombra de navbar ──
    if (navbar) navbar.classList.toggle('scrolled', y > 24);

    // ── botón "volver arriba" ──
    if (toTop) {
      const show = y > 500;
      toTop.classList.toggle('opacity-0', !show);
      toTop.classList.toggle('translate-y-4', !show);
      toTop.classList.toggle('pointer-events-none', !show);
    }

    // ── animaciones de aparición (reveal) ──
    // Se revela todo lo que ya entró o superó el viewport (también los que
    // quedaron encima tras un salto de ancla), evitando contenido invisible.
    for (let i = reveals.length - 1; i >= 0; i--) {
      const el = reveals[i];
      if (el.getBoundingClientRect().top < vh - 60) {
        el.classList.add('in');
        reveals.splice(i, 1);
      }
    }

    // ── indicador de sección activa ──
    const mid = vh * 0.38;
    let activeId = null;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { activeId = s.id; break; }
      if (r.top <= mid) activeId = s.id;   // última sección ya superada
    }
    navLinks.forEach(l => l.classList.toggle('active', activeId !== null && l.dataset.section === activeId));
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  onScroll();

  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  // (el indicador de sección activa se resuelve dentro de onScroll)

  // Scroll suave con offset para todos los anclajes internos
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ═════════════ 4. TYPEWRITER ═════════════ */
  const tw = $('#typewriter');
  if (tw) {
    const lines = [
      'Formando Arquitectos de Software',
      'Innovadores IoT',
      'Especialistas en IA'
    ];
    if (reduced) {
      tw.textContent = lines.join(' | ');
    } else {
      let li = 0, ci = 0, deleting = false;
      (function type() {
        const full = lines[li];
        tw.textContent = full.slice(0, ci);

        let delay = deleting ? 34 : 62;
        if (!deleting && ci === full.length) {
          delay = 1600;                      // pausa al terminar la línea
          if (li < lines.length - 1) { deleting = true; }
        } else if (deleting && ci === 0) {
          deleting = false; li = (li + 1) % lines.length; delay = 320;
        } else {
          ci += deleting ? -1 : 1;
        }
        // Al final de la última línea, la borra y reinicia
        if (deleting && li === lines.length - 1 && ci === 0) { li = 0; deleting = false; delay = 320; }
        else if (!deleting && ci < full.length) { /* avanza normal */ }

        setTimeout(type, delay);
      })();
    }
  }

  /* ═════════════ 5. REVEAL ON SCROLL ═════════════
     Se resuelve dentro de onScroll() (sin depender de IntersectionObserver
     ni de requestAnimationFrame, que el navegador puede estrangular). */

  /* ═════════════ 6. EFECTO TILT 3D ═════════════ */
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover && !reduced) {
    $$('[data-tilt]').forEach(card => {
      const inner = card.querySelector('.tilt-inner');
      if (!inner) return;
      const MAX = 9; // grados

      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (0.5 - py) * MAX;
        const ry = (px - 0.5) * MAX;
        inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(14px)`;
        inner.style.setProperty('--mx', (px * 100) + '%');
        inner.style.setProperty('--my', (py * 100) + '%');
      });
      card.addEventListener('pointerleave', () => {
        inner.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
      });
    });

    // Brillo que sigue al cursor en las tarjetas de campo laboral
    $$('.glow-card').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--gx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ═════════════ 7. PLAN DE ESTUDIOS ═════════════ */
  const planContent = $('#plan-content');
  const yearTabs    = $$('.year-tab');
  const ICONS = { 'neon-cyan':'text-neon-cyan', 'neon-lime':'text-neon-lime', 'neon-magenta':'text-neon-magenta', 'neon-violet':'text-neon-violet', 'neon-amber':'text-neon-amber' };
  const BORDERS = { 'neon-cyan':'border-neon-cyan/40', 'neon-lime':'border-neon-lime/40', 'neon-magenta':'border-neon-magenta/40', 'neon-violet':'border-neon-violet/40', 'neon-amber':'border-neon-amber/40' };
  const RINGS = { 'neon-cyan':'bg-neon-cyan/15', 'neon-lime':'bg-neon-lime/15', 'neon-magenta':'bg-neon-magenta/15', 'neon-violet':'bg-neon-violet/15', 'neon-amber':'bg-neon-amber/15' };

  function renderPlan(year) {
    const data = window.PLAN && window.PLAN[year];
    if (!data || !planContent) return;

    const acc = ICONS[data.color] || 'text-neon-cyan';
    const border = BORDERS[data.color] || 'border-neon-cyan/40';
    const ring = RINGS[data.color] || 'bg-neon-cyan/15';

    // Encabezado: año + semestre correspondiente
    let html = `
      <div class="relative flex flex-wrap items-center gap-4 mb-6">
        <div class="timeline-node ${ring} ${border}">
          <i data-lucide="flag" class="w-4 h-4 ${acc}"></i>
        </div>
        <div class="flex-1 min-w-[200px] rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur-xl">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="font-display text-2xl sm:text-3xl font-black text-white">${year}.º AÑO</span>
            <span class="rounded-full border ${border} ${ring} px-3 py-1 font-mono text-[10px] tracking-widest ${acc} uppercase">${data.sem}</span>
          </div>
          <div class="mt-3 flex flex-wrap gap-2 font-mono text-[10px] text-slate-500">
            <span class="chip">${data.subjects.length} ${data.subjects.length === 1 ? 'asignatura' : 'asignaturas'}</span>
            <span class="chip">${data.sem}</span>
          </div>
        </div>
      </div>`;

    // Lista de asignaturas (solo nombres)
    html += '<div class="grid sm:grid-cols-2 gap-3">';

    data.subjects.forEach((name, i) => {
      html += `
        <div class="subject-card relative flex items-center gap-3 px-4 py-3.5" data-subject>
          <div class="timeline-node ${ring} ${border}">
            <i data-lucide="book-open" class="w-4 h-4 ${acc}"></i>
          </div>
          <span class="grid place-items-center w-9 h-9 shrink-0 rounded-xl ${ring} border ${border} ${acc} font-mono text-[12px] font-bold">
            ${String(i + 1).padStart(2, '0')}
          </span>
          <span class="flex-1 min-w-0 font-semibold text-white text-[15px] leading-snug">${name}</span>
        </div>`;
    });

    html += '</div>';
    planContent.innerHTML = html;

    // Re-scanear iconos Lucide en el contenido inyectado
    if (window.lucide) window.lucide.createIcons({ root: planContent });

    // Animar entrada escalonada
    $$('.subject-card', planContent).forEach((c, i) => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(18px)';
      setTimeout(() => {
        c.style.transition = 'opacity .5s ease, transform .5s cubic-bezier(.2,.8,.25,1)';
        c.style.opacity = '1'; c.style.transform = 'none';
      }, 60 + i * 70);
    });
  }

  yearTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      yearTabs.forEach(t => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      renderPlan(tab.dataset.year);
    });
  });
  renderPlan('1'); // estado inicial

  /* ═════════════ 8. TABS DE JUEGOS ═════════════ */
  const gameTabs = $$('.game-tab');
  gameTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      gameTabs.forEach(t => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      $$('.game-panel').forEach(p => p.classList.add('hidden'));
      const panel = $('#game-' + tab.dataset.game);
      if (panel) { panel.classList.remove('hidden'); panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = ''; }

      // Notifica a cada motor de juego para que pause/reaude
      document.dispatchEvent(new CustomEvent('game:change', { detail: tab.dataset.game }));
      window.dispatchEvent(new CustomEvent('game:change', { detail: tab.dataset.game }));
    });
  });

  /* ═════════════ 9. GENERADOR / VISUALIZADOR DE QR ═════════════ */
  const qrInput  = $('#qr-input');
  const qrBox    = $('#qr-code');
  const qrLabel  = $('#qr-url-label');
  const qrMsg    = $('#qr-msg');
  let qrCanvasOrImg = null;

  // URL de la propia página publicada: el QR siempre redirige aquí
  const QR_DEFAULT = 'https://fidelganime-dotcom.github.io/landing-ing-sistemas-uap/';

  function makeQR(text) {
    if (!qrBox) return;
    qrBox.innerHTML = '';
    const ok = (inner) => {
      qrBox.innerHTML = inner;
      qrLabel.textContent = text;
      qrMsg.textContent = '✓ QR actualizado — escanéalo con tu celular.';
      setTimeout(() => { if (qrMsg) qrMsg.textContent = ''; }, 2600);
      const node = qrBox.querySelector('canvas') || qrBox.querySelector('img');
      qrCanvasOrImg = node;
    };

    if (window.QRCode) {
      try {
        // eslint-disable-next-line no-new
        new window.QRCode(qrBox, {
          text: text, width: 200, height: 200,
          colorDark: '#05070f', colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
        const node = qrBox.querySelector('canvas') || qrBox.querySelector('img');
        if (node) { qrCanvasOrImg = node; qrLabel.textContent = text;
          qrMsg.textContent = '✓ QR actualizado — escanéalo con tu celular.';
          setTimeout(() => { if (qrMsg) qrMsg.textContent = ''; }, 2600);
          return;
        }
      } catch (e) { /* cae al fallback */ }
    }
    // Fallback: imagen remota
    ok(`<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(text)}" alt="Código QR" width="200" height="200" />`);
  }

  if (qrInput) {
    $('#qr-gen')?.addEventListener('click', () => makeQR(qrInput.value.trim() || QR_DEFAULT));
    qrInput.addEventListener('keydown', e => { if (e.key === 'Enter') makeQR(qrInput.value.trim() || QR_DEFAULT); });
    $$('.qr-preset').forEach(b => b.addEventListener('click', () => {
      qrInput.value = b.dataset.url; makeQR(b.dataset.url);
    }));
    $('#qr-copy')?.addEventListener('click', async () => {
      const v = qrInput.value.trim();
      try { await navigator.clipboard.writeText(v); qrMsg.textContent = '📋 Enlace copiado al portapapeles'; }
      catch (e) { qrMsg.textContent = '⚠ Copia manualmente: ' + v; }
      setTimeout(() => { qrMsg.textContent = ''; }, 2600);
    });
    $('#qr-download')?.addEventListener('click', () => {
      const node = qrBox.querySelector('canvas') || qrBox.querySelector('img');
      if (!node) return;
      const a = document.createElement('a');
      a.download = 'QR-UAP-Ing-Sistemas.png';
      a.href = (node.tagName === 'CANVAS')
        ? node.toDataURL('image/png')
        : (node.src || '');
      if (a.href) a.click();
      else { qrMsg.textContent = '⚠ No se pudo descargar. Genera el QR de nuevo.'; setTimeout(() => qrMsg.textContent = '', 2600); }
    });
    makeQR(qrInput.value);
  }

  /* ═════════════ Misceláneos ═════════════ */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* — Tema claro / oscuro —
     El <head> ya aplicó la clase .light antes de pintar (sin "flash");
     aquí solo sincronizamos iconos y guardamos la elección del usuario. */
  const docEl = document.documentElement;
  const themeBtn = $('#theme-toggle');
  const metaTheme = $('#meta-theme-color');

  function applyTheme(t, persist) {
    const light = (t === 'light');
    docEl.classList.toggle('light', light);
    if (persist) { try { localStorage.setItem('theme', t); } catch (e) { /* sin storage */ } }
    if (metaTheme) metaTheme.setAttribute('content', light ? '#f4f7ff' : '#05070f');
    $('#theme-toggle .icon-sun')?.classList.toggle('hidden', !light);
    $('#theme-toggle .icon-moon')?.classList.toggle('hidden', light);
    themeBtn?.setAttribute('aria-label', light ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
  }
  // Iconos coherentes con el tema ya aplicado por el script del <head>
  applyTheme(docEl.classList.contains('light') ? 'light' : 'dark', false);
  themeBtn?.addEventListener('click', () => {
    applyTheme(docEl.classList.contains('light') ? 'dark' : 'light', true);
  });

  // Inicializar iconos Lucide una vez listo el DOM
  function initIcons() { if (window.lucide) window.lucide.createIcons(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initIcons);
  else initIcons();
  window.addEventListener('load', initIcons);
})();
