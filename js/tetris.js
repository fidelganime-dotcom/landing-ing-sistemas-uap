/* ══════════════════════════════════════════════════════════════════
   🧩 TETRIS TECH — Canvas 2D
   · 7 tetrominós con rotación (SRS simplificado) y SRS wall-kicks básico
   · Puntuación, niveles y velocidad incremental
   · Controles: teclado (PC) + botones táctiles (móvil)
   · Pausa automática al ocultar / cambiar de pestaña de juego
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('tetris-canvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const nextCv  = document.getElementById('tetris-next');
  const nctx    = nextCv ? nextCv.getContext('2d') : null;

  const COLS = 10, ROWS = 20;
  const CELL = 30; // 300 / 10

  // ── Formas (matrices rotables) ──
  const SHAPES = {
    I: { c: '#00f0ff', m: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
    O: { c: '#ffb020', m: [[1,1],[1,1]] },
    T: { c: '#8b5cf6', m: [[0,1,0],[1,1,1],[0,0,0]] },
    S: { c: '#a6ff00', m: [[0,1,1],[1,1,0],[0,0,0]] },
    Z: { c: '#ff2fd6', m: [[1,1,0],[0,1,1],[0,0,0]] },
    J: { c: '#3b82f6', m: [[1,0,0],[1,1,1],[0,0,0]] },
    L: { c: '#ff7a1a', m: [[0,0,1],[1,1,1],[0,0,0]] }
  };
  const KEYS = Object.keys(SHAPES);

  // ── Estado ──
  let board, piece, next, bag = [];
  let score = 0, level = 1, lines = 0;
  let running = false, paused = false, over = false;
  let dropTimer = 0, lastTime = 0, rafId = null;

  const elScore = document.getElementById('tetris-score');
  const elLevel = document.getElementById('tetris-level');
  const elLines = document.getElementById('tetris-lines');
  const overlay = document.getElementById('tetris-overlay');
  const startBtn = document.getElementById('tetris-start');

  /* ───────────── utilidades ───────────── */
  const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  function cloneMatrix(m) { return m.map(r => r.slice()); }

  function rotateMatrix(m, dir) {
    const n = m.length;
    const out = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (dir > 0) out[x][n - 1 - y] = m[y][x];        // horario
      else         out[n - 1 - x][y] = m[y][x];         // antihorario
    }
    return out;
  }

  // Bolsa aleatoria 7-piece (fair)
  function pullFromBag() {
    if (!bag.length) { bag = KEYS.slice(); for (let i = bag.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [bag[i], bag[j]] = [bag[j], bag[i]]; } }
    return bag.pop();
  }
  function newPiece(type) {
    const t = type || pullFromBag();
    const def = SHAPES[t];
    const m = cloneMatrix(def.m);
    return { type: t, color: def.c, m, x: ((COLS / 2) | 0) - ((m.length / 2) | 0), y: 0 };
  }

  function collides(m, px, py) {
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue;
      const bx = px + x, by = py + y;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
    return false;
  }

  /* ───────────── movimientos ───────────── */
  function move(dx) {
    if (!running || paused || over) return;
    if (!collides(piece.m, piece.x + dx, piece.y)) piece.x += dx;
  }
  function softDrop() {
    if (!running || paused || over) return;
    if (!collides(piece.m, piece.x, piece.y + 1)) { piece.y++; score += 1; updateHUD(); }
    else lockPiece();
  }
  function hardDrop() {
    if (!running || paused || over) return;
    let d = 0;
    while (!collides(piece.m, piece.x, piece.y + 1)) { piece.y++; d++; }
    score += d * 2;
    lockPiece(); updateHUD();
  }
  function rotate(dir) {
    if (!running || paused || over) return;
    if (piece.type === 'O') return;
    const rm = rotateMatrix(piece.m, dir);
    // wall kicks simples: 0, ±1, ±2
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      if (!collides(rm, piece.x + k, piece.y)) { piece.m = rm; piece.x += k; return; }
    }
    // intento de salto vertical
    for (const dy of [-1, -2]) {
      if (!collides(rm, piece.x, piece.y + dy)) { piece.m = rm; piece.y += dy; return; }
    }
  }

  /* ───────────── ciclo de vida de pieza ───────────── */
  function lockPiece() {
    let topped = false;
    for (let y = 0; y < piece.m.length; y++) for (let x = 0; x < piece.m[y].length; x++) {
      if (!piece.m[y][x]) continue;
      const by = piece.y + y, bx = piece.x + x;
      if (by < 0) { topped = true; continue; }
      board[by][bx] = piece.color;
    }
    if (topped) { gameOver(); return; }

    clearLines();
    piece = next; next = newPiece();
    drawNext();

    if (collides(piece.m, piece.x, piece.y)) { gameOver(); return; }
    updateHUD();
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(c => c)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++; y++; // re-evaluar la misma fila
      }
    }
    if (!cleared) return;
    // puntuación clásica
    const pts = [0, 100, 300, 500, 800][cleared] * level;
    score += pts;
    lines += cleared;
    const newLevel = Math.floor(lines / 10) + 1;
    level = Math.min(newLevel, 15);
    flashLines = 0.35; // efecto visual breve
    updateHUD();       // refuerzo: el HUD se actualiza aunque luego falle el spawn
  }

  function dropInterval() { return Math.max(70, 800 - (level - 1) * 55); }

  /* ───────────── dibujo ───────────── */
  function drawCell(c, x, y, color, size) {
    const px = x * size, py = y * size;
    c.fillStyle = color;
    c.fillRect(px, py, size, size);
    // bisel superior claro + sombra inferior = efecto 3D
    c.fillStyle = 'rgba(255,255,255,.30)';
    c.fillRect(px, py, size, 3);
    c.fillRect(px, py, 3, size);
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.fillRect(px, py + size - 3, size, 3);
    c.fillRect(px + size - 3, py, 3, size);
    // brillo interior
    c.fillStyle = 'rgba(255,255,255,.14)';
    c.fillRect(px + size * .28, py + size * .28, size * .44, size * .44);
    c.strokeStyle = 'rgba(5,7,15,.65)';
    c.lineWidth = 1;
    c.strokeRect(px + .5, py + .5, size - 1, size - 1);
  }

  let flashLines = 0;

  function draw() {
    // fondo
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // retícula
    ctx.strokeStyle = 'rgba(0,240,255,.07)';
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL + .5, 0); ctx.lineTo(x * CELL + .5, canvas.height); ctx.stroke(); }
    for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL + .5); ctx.lineTo(canvas.width, y * CELL + .5); ctx.stroke(); }

    // tablero fijo
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (board[y][x]) drawCell(ctx, x, y, board[y][x], CELL);
    }

    // fantasma (proyección de caída)
    if (piece && running && !over) {
      let gy = piece.y;
      while (!collides(piece.m, piece.x, gy + 1)) gy++;
      ctx.globalAlpha = .22;
      for (let y = 0; y < piece.m.length; y++) for (let x = 0; x < piece.m[y].length; x++) {
        if (piece.m[y][x] && gy + y >= 0) drawCell(ctx, piece.x + x, gy + y, piece.color, CELL);
      }
      ctx.globalAlpha = 1;
    }

    // pieza activa
    if (piece) {
      for (let y = 0; y < piece.m.length; y++) for (let x = 0; x < piece.m[y].length; x++) {
        if (piece.m[y][x] && piece.y + y >= 0) drawCell(ctx, piece.x + x, piece.y + y, piece.color, CELL);
      }
    }

    // destello al completar líneas
    if (flashLines > 0) {
      ctx.fillStyle = `rgba(0,240,255,${flashLines * .6})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // estado pausa / game over
    if (paused && running && !over) {
      ctx.fillStyle = 'rgba(5,7,15,.82)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 26px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2 - 8);
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('pulsa P para continuar', canvas.width / 2, canvas.height / 2 + 18);
    }
    if (over) {
      ctx.fillStyle = 'rgba(5,7,15,.88)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff2fd6';
      ctx.font = 'bold 24px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 26);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 16px Orbitron, sans-serif';
      ctx.fillText('SCORE  ' + score, canvas.width / 2, canvas.height / 2 + 4);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText('dale a REINICIAR para otra ronda', canvas.width / 2, canvas.height / 2 + 30);
    }
    ctx.textAlign = 'left';
  }

  function drawNext() {
    if (!nctx || !next) return;
    nctx.fillStyle = '#05070f';
    nctx.fillRect(0, 0, nextCv.width, nextCv.height);
    const m = next.m;
    const s = 22;
    const w = m.length * s, h = m.length * s;
    const ox = (nextCv.width - w) / 2, oy = (nextCv.height - h) / 2;
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue;
      const px = ox + x * s, py = oy + y * s;
      nctx.fillStyle = next.color;
      nctx.fillRect(px, py, s, s);
      nctx.fillStyle = 'rgba(255,255,255,.3)';
      nctx.fillRect(px, py, s, 2); nctx.fillRect(px, py, 2, s);
      nctx.fillStyle = 'rgba(0,0,0,.35)';
      nctx.fillRect(px, py + s - 2, s, 2); nctx.fillRect(px + s - 2, py, 2, s);
    }
  }

  function updateHUD() {
    if (elScore) elScore.textContent = score;
    if (elLevel) elLevel.textContent = level;
    if (elLines) elLines.textContent = lines;
  }

  /* ───────────── bucle ───────────── */
  function loop(t) {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min(250, t - lastTime);   // clamp: evita saltos si rAF se estrangula
    lastTime = t;
    if (!running || paused || over) { draw(); return; }
    dropTimer += dt;
    if (flashLines > 0) flashLines = Math.max(0, flashLines - dt / 900);
    if (dropTimer >= dropInterval()) {
      dropTimer = 0;
      if (!collides(piece.m, piece.x, piece.y + 1)) piece.y++;
      else lockPiece();
    }
    draw();
  }

  /* ───────────── controles ───────────── */
  function start() {
    board = emptyBoard(); bag = [];
    score = 0; level = 1; lines = 0;
    piece = newPiece(); next = newPiece();
    dropTimer = 0; over = false; paused = false; running = true;
    if (overlay) overlay.classList.add('hidden');
    drawNext(); updateHUD(); draw();
  }

  function gameOver() {
    over = true; running = false;
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.innerHTML =
        `<div class="text-center">
           <p class="font-display text-2xl font-black text-neon-magenta">GAME OVER</p>
           <p class="mt-2 font-mono text-sm text-slate-300">Puntuación: <span class="text-neon-cyan font-bold">${score}</span></p>
           <p class="text-[11px] text-slate-500 mt-1">Nivel ${level} · ${lines} líneas</p>
           <button id="tetris-start" class="mt-5 rounded-xl px-6 py-3 font-bold bg-neon-cyan text-void hover:shadow-neon-cyan transition">↺ OTRA RONDA</button>
         </div>`;
      document.getElementById('tetris-start')?.addEventListener('click', start);
    }
  }

  function togglePause() {
    if (!running || over) return;
    paused = !paused; lastTime = performance.now(); dropTimer = 0;
  }

  // Teclado
  document.addEventListener('keydown', (e) => {
    const visible = document.getElementById('game-tetris') && !document.getElementById('game-tetris').classList.contains('hidden');
    if (!visible) return;
    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)) e.preventDefault();
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A': move(-1); break;
      case 'ArrowRight': case 'd': case 'D': move(1); break;
      case 'ArrowDown': case 's': case 'S': softDrop(); break;
      case 'ArrowUp': case 'w': case 'W': rotate(1); break;
      case 'z': case 'Z': rotate(-1); break;
      case ' ': hardDrop(); break;
      case 'p': case 'P': case 'Escape': togglePause(); break;
      case 'Enter': if (!running || over) start(); break;
    }
  });

  // Botones táctiles
  document.querySelectorAll('.t-btn[data-act]').forEach(btn => {
    const act = btn.dataset.act;
    const fire = (ev) => {
      ev.preventDefault();
      // Tras el game over solo debe reiniciar el botón explícito: aquí no hacemos nada.
      if (over) return;
      // Si aún no se ha iniciado, el primer toque arranca la partida.
      if (!running) { start(); return; }
      switch (act) {
        case 'left':  move(-1); break;
        case 'right': move(1);  break;
        case 'down':  softDrop(); break;
        case 'cw':    rotate(1); break;
        case 'ccw':   rotate(-1); break;
        case 'drop':  hardDrop(); break;
      }
    };
    btn.addEventListener('click', fire);
    // auto-repetición para izquierda/derecha/arriba mantener pulsado
    if (['left','right','down'].includes(act)) {
      let to = null, iv = null;
      const stop = () => { clearTimeout(to); clearInterval(iv); to = iv = null; };
      btn.addEventListener('pointerdown', () => {
        to = setTimeout(() => { iv = setInterval(() => {
          if (act === 'left') move(-1); else if (act === 'right') move(1); else softDrop();
        }, 90); }, 240);
      });
      ['pointerup','pointerleave','pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
    }
  });

  startBtn?.addEventListener('click', start);
  document.getElementById('tetris-reset')?.addEventListener('click', start);
  document.getElementById('tetris-pause')?.addEventListener('click', togglePause);

  // Pausar al cambiar de pestaña de juego o de ventana
  const ownPanel = document.getElementById('game-tetris');
  const pauseIfHidden = () => {
    if (!ownPanel) return;
    if (ownPanel.classList.contains('hidden') && running && !over) paused = true;
  };
  document.addEventListener('game:change', pauseIfHidden);
  window.addEventListener('game:change', pauseIfHidden);
  document.addEventListener('visibilitychange', () => { if (document.hidden && running && !over) paused = true; });

  // Primer dibujo (estado en espera)
  board = emptyBoard();
  draw();
  if (rafId === null) rafId = requestAnimationFrame(loop);
  lastTime = performance.now();
})();
