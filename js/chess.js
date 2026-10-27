/* ══════════════════════════════════════════════════════════════════
   ♟️ AJEDREZ VIRTUAL (Chess Zone)
   · Tablero responsive generado con CSS Grid
   · Clic para seleccionar y mover (también funciona con touch)
   · Validación de movimientos por tipo de pieza + bloqueo por obstáculos
   · Comprobación de jaque y jaque mate / ahogado
   · Historial, capturas, deshacer y reinicio
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const boardEl = document.getElementById('chess-board');
  if (!boardEl) return;

  const turnEl     = document.getElementById('chess-turn');
  const movesEl    = document.getElementById('chess-moves');
  const historyEl  = document.getElementById('chess-history');
  const statusEl   = document.getElementById('chess-status');
  const capturedEl = document.getElementById('chess-captured');

  /* ─────────── símbolos ─────────── */
  const GLYPH = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
  };
  const NAMES = { K:'Rey', Q:'Dama', R:'Torre', B:'Alfil', N:'Caballo', P:'Peón' };
  const FILES = ['a','b','c','d','e','f','g','h'];

  /* ─────────── estado ─────────── */
  let board, turn, selected, legal, history, captured, enPassant;
  let lastMove = null;
  let undoStack = [];         // snapshots para "deshacer"

  const isWhite = p => p && p === p.toUpperCase();
  const isBlack = p => p && p === p.toLowerCase();
  const colorOf = p => (isWhite(p) ? 'w' : isBlack(p) ? 'b' : null);
  const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  function initialBoard() {
    return [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R']
    ];
  }

  function reset() {
    board = initialBoard();
    turn = 'w';
    selected = null;
    legal = [];
    history = [];
    captured = [];
    enPassant = null;
    lastMove = null;
    undoStack = [];
    render();
    updatePanel();
    setStatus('Clic en una pieza blanca para comenzar.');
  }

  const cloneBoard = b => b.map(r => r.slice());

  function snapshot() {
    return { board: cloneBoard(board), turn, enPassant: enPassant ? { ...enPassant } : null,
             captured: captured.slice(), history: history.slice(), lastMove: lastMove ? { ...lastMove } : null };
  }
  function restore(s) {
    board = cloneBoard(s.board); turn = s.turn;
    enPassant = s.enPassant ? { ...s.enPassant } : null;
    captured = s.captured.slice(); history = s.history.slice();
    lastMove = s.lastMove ? { ...s.lastMove } : null;
    selected = null; legal = [];
  }

  /* ═══════════ LÓGICA DE MOVIMIENTOS ═══════════ */

  // Deslizadores: dirección [dr, dc]
  const DIRS = {
    R: [[1,0],[-1,0],[0,1],[0,-1]],
    B: [[1,1],[1,-1],[-1,1],[-1,-1]],
    Q: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
  };

  function pseudoMoves(r, c, b, ep, attacksOnly) {
    const p = b[r][c];
    if (!p) return [];
    const me = colorOf(p);
    const out = [];
    const push = (nr, nc) => {
      if (!inBounds(nr, nc)) return false;
      const t = b[nr][nc];
      if (!t) { out.push([nr, nc]); return true; }
      if (colorOf(t) !== me) out.push([nr, nc]);
      return false;
    };

    const type = p.toUpperCase();

    if (type === 'P') {
      const dir = me === 'w' ? -1 : 1;
      const startRow = me === 'w' ? 6 : 1;

      if (attacksOnly) {
        for (const dc of [-1, 1]) {
          const nr = r + dir, nc = c + dc;
          if (inBounds(nr, nc)) out.push([nr, nc]);
        }
        return out;
      }

      // avance simple
      if (inBounds(r + dir, c) && !b[r + dir][c]) {
        out.push([r + dir, c]);
        if (r === startRow && !b[r + 2 * dir][c]) out.push([r + 2 * dir, c]);
      }
      // capturas
      for (const dc of [-1, 1]) {
        const nr = r + dir, nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const t = b[nr][nc];
        if (t && colorOf(t) !== me) out.push([nr, nc]);
        // Al paso: solo si el doble avance lo originó el RIVAL (ep.by !== me).
        else if (ep && ep.by !== me && ep.r === nr && ep.c === nc) out.push([nr, nc]);
      }
      return out;
    }

    if (type === 'N') {
      for (const [dr, dc] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]) push(r + dr, c + dc);
      return out;
    }

    if (type === 'K') {
      for (const [dr, dc] of DIRS.Q) push(r + dr, c + dc);
      if (!attacksOnly) {
        // enroque
        const homeRow = me === 'w' ? 7 : 0;
        const king = me === 'w' ? 'K' : 'k';
        const rook = me === 'w' ? 'R' : 'r';
        if (r === homeRow && c === 4 && b[r][c] === king && !isSquareAttacked(r, c, other(me), b, ep)) {
          // enroque corto
          if (b[homeRow][7] === rook && !b[homeRow][5] && !b[homeRow][6] &&
              !isSquareAttacked(homeRow, 5, other(me), b, ep) && !isSquareAttacked(homeRow, 6, other(me), b, ep)) {
            out.push([homeRow, 6]);
          }
          // enroque largo
          if (b[homeRow][0] === rook && !b[homeRow][1] && !b[homeRow][2] && !b[homeRow][3] &&
              !isSquareAttacked(homeRow, 3, other(me), b, ep) && !isSquareAttacked(homeRow, 2, other(me), b, ep)) {
            out.push([homeRow, 2]);
          }
        }
      }
      return out;
    }

    // deslizadores
    for (const [dr, dc] of DIRS[type]) {
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        if (!push(nr, nc)) break;
        nr += dr; nc += dc;
      }
    }
    return out;
  }

  const other = col => (col === 'w' ? 'b' : 'w');

  // ¿está la casilla (r,c) atacada por `by`?
  function isSquareAttacked(r, c, by, b, ep) {
    // buscar atacantes por tipo (más eficiente que recorrer todo mirando direcciones)
    for (let rr = 0; rr < 8; rr++) {
      for (let cc = 0; cc < 8; cc++) {
        const p = b[rr][cc];
        if (!p || colorOf(p) !== by) continue;
        const moves = pseudoMoves(rr, cc, b, ep, true);
        if (moves.some(([mr, mc]) => mr === r && mc === c)) return true;
      }
    }
    return false;
  }

  function findKing(col, b) {
    const k = col === 'w' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c] === k) return [r, c];
    return null;
  }

  function inCheck(col, b, ep) {
    const k = findKing(col, b);
    if (!k) return false;
    return isSquareAttacked(k[0], k[1], other(col), b, ep);
  }

  // Filtra movimientos pseudo-legales dejando solo los que no dejan al propio rey en jaque
  function legalMovesFrom(r, c) {
    const p = board[r][c];
    const me = colorOf(p);
    const pseudo = pseudoMoves(r, c, board, enPassant, false);

    return pseudo.filter(([nr, nc]) => {
      const test = cloneBoard(board);
      const moving = p;

      // ¿captura al paso?
      const isEp = p.toUpperCase() === 'P' && nc !== c && !test[nr][nc] && enPassant &&
                   enPassant.by !== me && enPassant.r === nr && enPassant.c === nc;
      if (isEp) test[r][nc] = null;

      test[nr][nc] = moving;
      test[r][c] = null;

      // simular enroque (mover torre también)
      if (moving.toUpperCase() === 'K' && Math.abs(nc - c) === 2) {
        const homeRow = me === 'w' ? 7 : 0;
        if (nc === 6) { test[homeRow][5] = test[homeRow][7]; test[homeRow][7] = null; }
        else          { test[homeRow][3] = test[homeRow][0]; test[homeRow][0] = null; }
      }
      return !inCheck(me, test, null);
    });
  }

  function hasAnyMove(col) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || colorOf(p) !== col) continue;
      if (legalMovesFrom(r, c).length) return true;
    }
    return false;
  }

  /* ═══════════ EJECUTAR JUGADA ═══════════ */
  function algebraic(r, c) { return FILES[c] + (8 - r); }

  function makeMove(fr, fc, tr, tc) {
    const p = board[fr][fc];
    const me = colorOf(p);
    const type = p.toUpperCase();
    let taken = board[tr][tc];
    let san = '';

    // captura al paso (la casilla debe haberla creado el rival)
    const isEp = type === 'P' && tc !== fc && !board[tr][tc] && enPassant &&
                 enPassant.by !== me && enPassant.r === tr && enPassant.c === tc;
    if (isEp) { taken = board[fr][tc]; board[fr][tc] = null; }

    // al paso: nueva posición de captura potencial (solo el rival podrá usarla)
    let newEp = null;
    if (type === 'P' && Math.abs(tr - fr) === 2) newEp = { r: (fr + tr) / 2, c: fc, by: me };

    // enroque: mover la torre
    let rookFrom = null, rookTo = null;
    if (type === 'K' && Math.abs(tc - fc) === 2) {
      if (tc === 6) { rookFrom = [fr, 7]; rookTo = [fr, 5]; }
      else          { rookFrom = [fr, 0]; rookTo = [fr, 3]; }
    }

    // promoción (automática a Dama)
    const promotionRow = me === 'w' ? 0 : 7;
    const isPromo = type === 'P' && tr === promotionRow;

    // SAN
    if (type === 'K' && Math.abs(tc - fc) === 2) {
      san = tc === 6 ? 'O-O' : 'O-O-O';          // enroque corto / largo
    } else if (type === 'P') {
      san = taken || isEp ? FILES[fc] + 'x' + algebraic(tr, tc) : algebraic(tr, tc);
      if (isPromo) san += '=Q';
    } else {
      san = type + (taken ? 'x' : '') + algebraic(tr, tc);
    }

    // aplicar
    board[tr][tc] = isPromo ? (me === 'w' ? 'Q' : 'q') : p;
    board[fr][fc] = null;
    if (rookFrom) { board[rookTo[0]][rookTo[1]] = board[rookFrom[0]][rookFrom[1]]; board[rookFrom[0]][rookFrom[1]] = null; }

    // La posición de referencia se actualiza ANTES de evaluar jaque/mate, de modo
    // que se analice exactamente el estado resultante de la jugada (incluido el
    // nuevo "al paso"), y no una fotografía incompleta del tablero.
    const opp = other(me);
    enPassant = newEp;
    turn = opp;

    // jaque / mate
    const givesCheck = inCheck(opp, board, enPassant);
    if (givesCheck) san += hasAnyMove(opp) ? '+' : '#';

    return { san, taken, fr, fc, tr, tc };
  }

  /* ═══════════ RENDER ═══════════ */
  function render() {
    const frag = document.createDocumentFragment();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        const dark = (r + c) % 2 === 1;
        sq.className = 'square ' + (dark ? 'dark' : 'light');
        sq.dataset.r = r; sq.dataset.c = c;

        // resaltar última jugada
        if (lastMove && ((lastMove.fr === r && lastMove.fc === c) || (lastMove.tr === r && lastMove.tc === c))) {
          sq.classList.add('last');
        }

        // casilla seleccionada
        if (selected && selected.r === r && selected.c === c) sq.classList.add('selected');

        // movimientos legales
        const lm = legal.find(([lr, lc]) => lr === r && lc === c);
        if (lm) {
          sq.classList.add('legal');
          if (board[r][c] || (selected && board[selected.r][selected.c] && selected.c !== c)) sq.classList.add('capture');
        }

        // pieza
        const p = board[r][c];
        if (p) {
          const span = document.createElement('span');
          span.className = 'piece ' + (colorOf(p) === 'w' ? 'w' : 'b');
          span.textContent = GLYPH[p];
          sq.appendChild(span);
        }

        // coordenadas en el borde
        if (c === 0) { const k = document.createElement('span'); k.className = 'coord rank'; k.textContent = 8 - r; sq.appendChild(k); }
        if (r === 7) { const f = document.createElement('span'); f.className = 'coord file'; f.textContent = FILES[c]; sq.appendChild(f); }

        sq.addEventListener('click', onSquareClick);
        frag.appendChild(sq);
      }
    }
    boardEl.innerHTML = '';
    boardEl.appendChild(frag);
  }

  function setStatus(txt, kind) {
    if (!statusEl) return;
    statusEl.textContent = txt;
    statusEl.className = 'rounded-xl px-4 py-3 text-[13px] font-semibold border ' +
      (kind === 'bad'   ? 'border-neon-magenta/40 bg-neon-magenta/10 text-neon-magenta'
       : kind === 'good' ? 'border-neon-lime/40 bg-neon-lime/10 text-neon-lime'
       : 'border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan');
  }

  function updatePanel() {
    if (turnEl) {
      turnEl.textContent = turn === 'w' ? 'BLANCAS' : 'NEGRAS';
      turnEl.className = 'stat-value text-base ' + (turn === 'w' ? 'text-white' : 'text-neon-cyan');
    }
    if (movesEl) movesEl.textContent = history.length;

    if (historyEl) {
      if (!history.length) historyEl.innerHTML = '<p class="text-slate-600">Sin jugadas aún.</p>';
      else historyEl.innerHTML = history.map((h, i) =>
        `<div class="flex gap-2 ${i % 2 ? 'text-slate-500' : 'text-slate-300'}">
           <span class="text-slate-600 w-6">${Math.floor(i / 2) + 1}${i % 2 ? '…' : '.'}</span>
           <span>${h}</span>
         </div>`).join('');
      historyEl.scrollTop = historyEl.scrollHeight;
    }

    if (capturedEl) {
      capturedEl.innerHTML = captured.map(p =>
        `<span class="${colorOf(p) === 'w' ? 'text-white' : 'text-neon-cyan'}">${GLYPH[p]}</span>`).join('')
        || '<span class="text-slate-600 text-xs font-mono">ninguna</span>';
    }
  }

  /* ═══════════ INTERACCIÓN ═══════════ */
  function onSquareClick(e) {
    const r = Number(e.currentTarget.dataset.r);
    const c = Number(e.currentTarget.dataset.c);
    const p = board[r][c];

    // Si hay selección y la casilla es un destino legal → mover
    if (selected && legal.some(([lr, lc]) => lr === r && lc === c)) {
      // guardar estado previo (permite "deshacer")
      undoStack.push(snapshot());
      if (undoStack.length > 200) undoStack.shift();

      const res = makeMove(selected.r, selected.c, r, c);

      history.push(res.san);
      if (res.taken) captured.push(res.taken);

      lastMove = { fr: res.fr, fc: res.fc, tr: res.tc, tc: res.tc };
      selected = null; legal = [];

      render(); updatePanel();

      // evaluar estado de la partida
      const check = inCheck(turn, board, null);
      const any = hasAnyMove(turn);

      if (!any) {
        if (check) setStatus('¡Jaque mate! Ganaron las ' + (turn === 'w' ? 'NEGRAS' : 'BLANCAS') + '. ♟', 'good');
        else setStatus('Ahogado: tablas. Nadie puede moverse legalmente.', 'bad');
      } else if (check) {
        setStatus('¡Jaque al ' + (turn === 'w' ? 'rey blanco' : 'rey negro') + '!', 'bad');
      } else {
        setStatus('Mueven las ' + (turn === 'w' ? 'BLANCAS' : 'NEGRAS') + '.');
      }
      return;
    }

    // Seleccionar pieza propia
    if (p && colorOf(p) === turn) {
      selected = { r, c };
      legal = legalMovesFrom(r, c);
      render();
      setStatus(`${NAMES[p.toUpperCase()]} en ${algebraic(r, c)} — ${legal.length} movimiento(s) legal(es).`);
      return;
    }

    // Clic inválido → deseleccionar
    if (selected) {
      selected = null; legal = [];
      render();
      setStatus('Mueven las ' + (turn === 'w' ? 'BLANCAS' : 'NEGRAS') + '.');
    }
  }

  document.getElementById('chess-reset')?.addEventListener('click', reset);

  document.getElementById('chess-undo')?.addEventListener('click', () => {
    if (!undoStack.length) { setStatus('No hay jugadas para deshacer.', 'bad'); return; }
    restore(undoStack.pop());
    render(); updatePanel();
    setStatus('⟲ Jugada deshecha — mueven las ' + (turn === 'w' ? 'BLANCAS' : 'NEGRAS') + '.');
  });

  reset();
})();
