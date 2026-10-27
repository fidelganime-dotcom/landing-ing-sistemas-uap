/* ══════════════════════════════════════════════════════════════════
   🎲 CUBO RUBIK 3D INTERACTIVO — Three.js
   · 26 cubies (3×3×3 sin núcleo) con las 6 caras coloreadas
   · Cámara orbital: arrastrar (mouse/touch) para rotar, rueda/pellizco = zoom
   · Girar caras con botones U D L R F B en sentido horario/antihorario
   · Mezclar (scramble) · Reiniciar · Contador de movimientos · Detección de solución

   NOTA DE IMPLEMENTACIÓN:
   Todas las rotaciones de capa se calculan en el espacio LOCAL del grupo `rubik`,
   de modo que la orientación inicial del cubo nunca afecta la lógica.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('rubik-canvas');
  if (!canvas || !window.THREE) return;

  const THREE = window.THREE;
  const statusEl = document.getElementById('rubik-status');
  const movesEl  = document.getElementById('rubik-moves');

  /* ─────────── renderer / escena / luces ─────────── */
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

  scene.add(new THREE.AmbientLight(0xffffff, 0.68));
  const key  = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(5, 8, 6);  scene.add(key);
  const fill = new THREE.DirectionalLight(0x00f0ff, 0.35); fill.position.set(-6, -3, -5); scene.add(fill);
  const rim  = new THREE.PointLight(0xff2fd6, 0.55, 40);   rim.position.set(-4, 5, -6); scene.add(rim);

  /* ─────────── paleta ─────────── */
  const DARK = 0x141824;                       // color base de los cubies
  const COLORS = { R: 0xff3b3b, L: 0xff8b1a, U: 0xf5f7fa, D: 0xffd500, F: 0x00d97e, B: 0x2f6fff };

  /* ─────────── construcción del cubo ─────────── */
  const GAP   = 1.0;      // distancia entre centros
  const CUBIE = 0.94;     // arista de cada cubie
  const rubik = new THREE.Group();
  scene.add(rubik);

  let pieces = [];        // { mesh, home, coord:{x,y,z} }

  function faceMat(color) {
    return new THREE.MeshPhongMaterial({
      color, shininess: 72, specular: 0x4a4a4a,
      emissive: new THREE.Color(color).multiplyScalar(color === DARK ? 0 : 0.07)
    });
  }

  function buildCube() {
    while (rubik.children.length) {
      const c = rubik.children[0];
      rubik.remove(c);
      c.traverse?.(o => { o.geometry?.dispose?.(); if (o.material?.dispose) o.material.dispose(); });
    }
    pieces = [];

    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      if (x === 0 && y === 0 && z === 0) continue;

      // orden de materiales de BoxGeometry: +x, -x, +y, -y, +z, -z
      const mats = [
        faceMat(x ===  1 ? COLORS.R : DARK),
        faceMat(x === -1 ? COLORS.L : DARK),
        faceMat(y ===  1 ? COLORS.U : DARK),
        faceMat(y === -1 ? COLORS.D : DARK),
        faceMat(z ===  1 ? COLORS.F : DARK),
        faceMat(z === -1 ? COLORS.B : DARK)
      ];

      const geo = new THREE.BoxGeometry(CUBIE, CUBIE, CUBIE);
      const mesh = new THREE.Mesh(geo, mats);
      mesh.position.set(x * GAP, y * GAP, z * GAP);
      mesh.userData = { x, y, z };             // coordenada lógica

      mesh.add(new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x000000 })
      ));

      rubik.add(mesh);
      pieces.push(mesh);
    }

    rubik.rotation.set(-0.42, 0.62, 0);
    moves = 0; updateMoves();
  }

  /* ─────────── rotación de capas (espacio local) ─────────── */
  const AXIS = {
    R: new THREE.Vector3( 1, 0, 0),
    L: new THREE.Vector3(-1, 0, 0),
    U: new THREE.Vector3( 0, 1, 0),
    D: new THREE.Vector3( 0,-1, 0),
    F: new THREE.Vector3( 0, 0, 1),
    B: new THREE.Vector3( 0, 0,-1)
  };

  let animating = false;
  let moves = 0;
  let nextDir = 1;

  const updateMoves = () => { if (movesEl) movesEl.textContent = moves; };
  function setStatus(txt, ms) {
    if (!statusEl) return;
    statusEl.textContent = txt;
    if (ms) setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, ms);
  }

  const DUR = 250; // ms por giro

  /**
   * Gira 90° la capa exterior de una cara.
   * @param {'U'|'D'|'L'|'R'|'F'|'B'} face
   * @param {number} dir  +1 horario (visto desde fuera de esa cara) · -1 antihorario
   */
  function rotateFace(face, dir, cb) {
    if (animating || !AXIS[face]) return;

    const axis = AXIS[face].clone().normalize();
    const layer = pieces.filter(p => Math.round(p.position.dot(axis)) === 1);
    if (!layer.length) { if (cb) cb(); return; }

    animating = true;

    const total = (Math.PI / 2) * (dir > 0 ? 1 : -1);
    const startPos = layer.map(p => p.position.clone());
    const startQuat = layer.map(p => p.quaternion.clone());
    const startCoord = layer.map(p => new THREE.Vector3(p.userData.x, p.userData.y, p.userData.z));
    const t0 = performance.now();

    let finished = false;
    let watchdog = null;

    /* ── Consolidación final (idempotente) ──
       Se ejecuta al terminar la animación O, como red de seguridad, desde un
       temporizador: si la ventana queda oculta Chromium estrangula rAF y la
       animación no avanzaría, dejando el cubo bloqueado. */
    function finalize() {
      if (finished) return;
      finished = true;
      if (watchdog) clearTimeout(watchdog);

      const qFinal = new THREE.Quaternion().setFromAxisAngle(axis, total);
      layer.forEach((p, i) => {
        const v = startPos[i].clone().applyQuaternion(qFinal);
        p.position.set(Math.round(v.x), Math.round(v.y), Math.round(v.z));
        p.quaternion.copy(startQuat[i]).premultiply(qFinal);

        const c = startCoord[i].clone().applyQuaternion(qFinal);
        p.userData.x = Math.round(c.x);
        p.userData.y = Math.round(c.y);
        p.userData.z = Math.round(c.z);
      });

      animating = false;
      moves++; updateMoves();
      if (cb) cb();
      checkSolved();
    }

    function step() {
      if (finished) return;
      const t = (performance.now() - t0) / DUR;
      if (t >= 1) { finalize(); return; }

      const eased = 1 - Math.pow(1 - t, 3);                 // ease-out cúbico
      const dq = new THREE.Quaternion().setFromAxisAngle(axis, total * eased);
      layer.forEach((p, i) => {
        p.position.copy(startPos[i]).applyQuaternion(dq);
        p.quaternion.copy(startQuat[i]).premultiply(dq);
      });
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
    watchdog = setTimeout(finalize, DUR + 350);
  }

  /* ─────────── detección de solución ─────────── */
  const DOMS = [
    { v: new THREE.Vector3( 1, 0, 0), i: 0 },
    { v: new THREE.Vector3(-1, 0, 0), i: 1 },
    { v: new THREE.Vector3( 0, 1, 0), i: 2 },
    { v: new THREE.Vector3( 0,-1, 0), i: 3 },
    { v: new THREE.Vector3( 0, 0, 1), i: 4 },
    { v: new THREE.Vector3( 0, 0,-1), i: 5 }
  ];

  function checkSolved() {
    const groups = {};
    for (const p of pieces) {
      for (const { v, i } of DOMS) {
        const mat = p.material[i];
        if (mat.color.getHex() === DARK) continue;          // no es sticker exterior

        // ¿hacia dónde mira esa cara en el marco propio del cubo?
        const outward = v.clone().applyQuaternion(p.quaternion);
        const dom = Math.abs(outward.x) > .5 ? 'x' : Math.abs(outward.y) > .5 ? 'y' : 'z';
        const sign = outward[dom] > 0 ? '+' : '-';
        const key = dom + sign + ':' + mat.color.getHexString();
        groups[key] = (groups[key] || 0) + 1;
      }
    }
    const counts = Object.values(groups);
    const solved = counts.length === 6 && counts.every(c => c === 9);
    if (solved && moves > 0) setStatus('🎉 ¡CUBO RESUELTO en ' + moves + ' movimientos!', 7000);
  }

  /* ─────────── cámara orbital ─────────── */
  const sph = { theta: 0.62, phi: -0.42, radius: 7.4 };
  let dragging = false, lastX = 0, lastY = 0;

  function applyCam() {
    sph.phi    = Math.max(-1.3, Math.min(1.3, sph.phi));
    sph.radius = Math.max(4.8, Math.min(14, sph.radius));
    camera.position.set(
      sph.radius * Math.cos(sph.phi) * Math.sin(sph.theta),
      sph.radius * Math.sin(sph.phi),
      sph.radius * Math.cos(sph.phi) * Math.cos(sph.theta)
    );
    camera.lookAt(0, 0, 0);
  }

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    sph.theta -= dx * 0.0075;
    sph.phi   -= dy * 0.0075;
    applyCam();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
    canvas.addEventListener(ev, () => { dragging = false; }));
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    sph.radius += e.deltaY * 0.006;
    applyCam();
  }, { passive: false });

  // Pellizco (zoom táctil)
  let pinch = 0;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 2) pinch = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY);
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && pinch) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                           e.touches[0].clientY - e.touches[1].clientY);
      sph.radius += (pinch - d) * 0.02;
      pinch = d; applyCam();
    }
  }, { passive: true });

  /* ─────────── resize ─────────── */
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);

  /* ─────────── bucle (solo renderiza si está visible) ─────────── */
  let visible = false;
  (function animate() {
    requestAnimationFrame(animate);
    if (visible) renderer.render(scene, camera);
  })();

  /* ─────────── controles UI ─────────── */
  document.querySelectorAll('.face-btn').forEach(btn => {
    btn.addEventListener('click', () => rotateFace(btn.dataset.face, nextDir));
  });

  document.getElementById('rubik-cw')?.addEventListener('click', () => {
    nextDir = 1;
    setStatus('Sentido actual: horario ↻ — elige una cara', 2500);
  });
  document.getElementById('rubik-ccw')?.addEventListener('click', () => {
    nextDir = -1;
    setStatus('Sentido actual: antihorario ↺ — elige una cara', 2500);
  });

  document.getElementById('rubik-scramble')?.addEventListener('click', () => {
    if (animating) return;
    setStatus('🎲 Mezclando…');
    const faces = Object.keys(AXIS);
    let i = 0;
    const total = 20;
    (function next() {
      if (i >= total) {
        moves = 0; updateMoves();
        setStatus('✨ Cubo mezclado. ¡Ahora resuélvelo!');
        return;
      }
      const f = faces[(Math.random() * faces.length) | 0];
      const d = Math.random() > 0.5 ? 1 : -1;
      rotateFace(f, d, () => { i++; setTimeout(next, 15); });
    })();
  });

  document.getElementById('rubik-reset')?.addEventListener('click', () => {
    buildCube();
    setStatus('↺ Cubo restablecido', 1800);
  });

  /* ─────────── visibilidad (ahorra GPU cuando la pestaña está oculta) ─────────── */
  function syncVisibility() {
    const panel = document.getElementById('game-rubik');
    const active = panel && !panel.classList.contains('hidden');
    if (active) { if (!visible) { resize(); applyCam(); } visible = true; }
    else visible = false;
  }
  document.addEventListener('game:change', syncVisibility);
  window.addEventListener('game:change', syncVisibility);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) visible = false; else syncVisibility();
  });

  /* ─────────── init ─────────── */
  buildCube();
  applyCam();
  resize();
  syncVisibility();
})();
