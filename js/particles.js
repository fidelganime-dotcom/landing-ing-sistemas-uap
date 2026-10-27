/* ══════════════════════════════════════════════════════════════════
   PARTICULAS 3D DE FONDO — Red de nodos conectados (Three.js)
   Se renderiza en #bg-particles (canvas fijo, capa -z-10)
   · Se adapta al resize, sigue al cursor y respeta prefers-reduced-motion
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('bg-particles');
  if (!canvas) return;

  // ── Degradación elegante: sin WebGL / movimiento reducido → Canvas 2D ──
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  })();

  if (!window.THREE || !hasWebGL || reduce) { canvas2D(); return; }

  /* ────────────── IMPLEMENTACIÓN THREE.JS ────────────── */
  const THREE = window.THREE;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070f, 0.055);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 14;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) { canvas2D(); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // ── Parámetros ──
  const isMobile = window.innerWidth < 768;
  const COUNT = isMobile ? 70 : 150;      // nº de nodos
  const RANGE = 16;                        // amplitud del espacio
  const LINK  = 4.2;                       // distancia máxima de conexión
  const LINK2 = LINK * LINK;

  // ── Geometría de puntos (nodos) ──
  const positions = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  const palette = [
    new THREE.Color(0x00f0ff),
    new THREE.Color(0xff2fd6),
    new THREE.Color(0xa6ff00),
    new THREE.Color(0x8b5cf6)
  ];

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * RANGE * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * RANGE * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * RANGE * 1.2;

    velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.012;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.012;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.008;

    const c = palette[i % palette.length];
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pointGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Textura circular suave para los puntos
  const sprite = makeDotTexture();
  const pointMat = new THREE.PointsMaterial({
    size: 0.42,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  scene.add(new THREE.Points(pointGeo, pointMat));

  // ── Líneas de conexión (se reescriben cada frame) ──
  const maxLines = COUNT * 6;
  const linePos = new Float32Array(maxLines * 6);
  const lineCol = new Float32Array(maxLines * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3).setUsage(THREE.DynamicDrawUsage));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3).setUsage(THREE.DynamicDrawUsage));

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  // ── Nube de estrellas tenues de profundidad ──
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(300 * 3);
  for (let i = 0; i < 300; i++) {
    starPos[i * 3 + 0] = (Math.random() - 0.5) * 90;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
    starPos[i * 3 + 2] = -20 - Math.random() * 40;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 0.16, color: 0x2a4a6a, transparent: true, opacity: 0.75, depthWrite: false
  })));

  // ── Interacción: puntero ──
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    pointer.active = true;
  }, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.active = false; });

  // ── Scroll: ligera inclinación de la escena ──
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  // ── Resize ──
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // ── Bucle de render ──
  let raf = null;
  const posAttr = pointGeo.getAttribute('position');

  function animate() {
    raf = requestAnimationFrame(animate);

    // Interpolar puntero
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    const p = posAttr.array;

    // Mover nodos + rebotar en los límites
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      p[i3]     += velocities[i3];
      p[i3 + 1] += velocities[i3 + 1];
      p[i3 + 2] += velocities[i3 + 2];

      if (p[i3] >  RANGE || p[i3] < -RANGE) velocities[i3]     *= -1;
      if (p[i3 + 1] >  RANGE || p[i3 + 1] < -RANGE) velocities[i3 + 1] *= -1;
      if (p[i3 + 2] >  RANGE * 0.6 || p[i3 + 2] < -RANGE * 0.6) velocities[i3 + 2] *= -1;
    }
    posAttr.needsUpdate = true;

    // Reconstruir conexiones
    let n = 0;
    for (let i = 0; i < COUNT && n < maxLines; i++) {
      const ix = p[i * 3], iy = p[i * 3 + 1], iz = p[i * 3 + 2];
      for (let j = i + 1; j < COUNT && n < maxLines; j++) {
        const dx = ix - p[j * 3];
        const dy = iy - p[j * 3 + 1];
        const dz = iz - p[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > LINK2) continue;

        const t = 1 - Math.sqrt(d2) / LINK;   // intensidad por distancia
        const o = n * 6;

        linePos[o]     = ix;             linePos[o + 1] = iy;             linePos[o + 2] = iz;
        linePos[o + 3] = p[j * 3];       linePos[o + 4] = p[j * 3 + 1];   linePos[o + 5] = p[j * 3 + 2];

        // color cian → magenta según cercanía (t = intensidad)
        lineCol[o]     = t * 0.00;  lineCol[o + 1] = t * 0.94;  lineCol[o + 2] = t * 1.00;
        lineCol[o + 3] = t * 1.00;  lineCol[o + 4] = t * 0.19;  lineCol[o + 5] = t * 0.84;

        n++;
      }
    }
    lineGeo.setDrawRange(0, n * 2);
    lineGeo.getAttribute('position').needsUpdate = true;
    lineGeo.getAttribute('color').needsUpdate = true;

    // Reacción al puntero
    if (pointer.active) {
      camera.position.x += (pointer.x * 2.4 - camera.position.x) * 0.03;
      camera.position.y += (pointer.y * 1.6 - camera.position.y) * 0.03;
    }
    // Rotación suave ligada al scroll
    const targetRot = scrollY * 0.0004;
    scene.rotation.y += (targetRot - scene.rotation.y) * 0.04;
    scene.rotation.x += (pointer.y * 0.14 - scene.rotation.x) * 0.04;

    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();

  // Pausar cuando la pestaña no está visible (ahorra batería/CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) animate();
  });

  /* ── helpers ── */
  function makeDotTexture() {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.Texture(c);
    tex.needsUpdate = true;
    return tex;
  }

  /* ══════════════ FALLBACK CANVAS 2D ══════════════ */
  function canvas2D() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w, h, pts, raf;
    const N = window.innerWidth < 768 ? 45 : 90;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    function init() {
      pts = Array.from({ length: N }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .45, vy: (Math.random() - .5) * .45,
        c: ['#00f0ff', '#ff2fd6', '#a6ff00', '#8b5cf6'][Math.floor(Math.random() * 4)]
      }));
    }
    function loop() {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = p.c; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d > 130) continue;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(0,240,255,${(1 - d / 130) * .35})`;
          ctx.lineWidth = .6; ctx.stroke();
        }
      }
    }
    resize(); init(); loop();
    window.addEventListener('resize', () => { resize(); init(); });
  }
})();
