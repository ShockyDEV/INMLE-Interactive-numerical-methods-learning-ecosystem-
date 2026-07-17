/* MNO.engines — sistemas lineales: eliminación gaussiana (con L, U y det),
   Jacobi y Gauss-Seidel. Matemática portada tal cual del legacy. */
(function (NS) {
  'use strict';

  const T = NS.trace, N = NS.num;
  const tex = N.tex;

  NS.engines = NS.engines || {};

  function validate(tr, A, B, X0) {
    const n = A.length;
    if (!n || A.some(function (r) { return r.length !== n || r.some(function (v) { return !isFinite(v); }); })) {
      T.step(tr, { type: 'fail', title: 'Matriz no válida', explain: ['La matriz A debe ser cuadrada y numérica (filas separadas por Enter, valores por espacios).'] });
      T.finish(tr, 'error', null, 'Matriz no válida');
      return false;
    }
    if (B.length !== n || B.some(function (v) { return !isFinite(v); })) {
      T.step(tr, { type: 'fail', title: 'Vector B no válido', explain: ['El vector B debe tener ' + n + ' componentes numéricas.'] });
      T.finish(tr, 'error', null, 'Vector B no válido');
      return false;
    }
    if (X0 && (X0.length !== n || X0.some(function (v) { return !isFinite(v); }))) {
      T.step(tr, { type: 'fail', title: 'X⁽⁰⁾ no válido', explain: ['El iterante inicial debe tener ' + n + ' componentes numéricas.'] });
      T.finish(tr, 'error', null, 'X inicial no válido');
      return false;
    }
    return true;
  }

  /* Análisis de dominancia diagonal (común a Jacobi y Gauss-Seidel). */
  function diagDominance(A) {
    const n = A.length, porFila = [];
    let ok = true;
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) if (j !== i) sum += Math.abs(A[i][j]);
      const fila = { i: i, diag: Math.abs(A[i][i]), suma: sum, ok: Math.abs(A[i][i]) > sum };
      if (!fila.ok) ok = false;
      porFila.push(fila);
    }
    return { ok: ok, porFila: porFila };
  }

  function ddExplain(dd, A) {
    const lines = ['¿Es **estrictamente diagonal dominante**? (condición suficiente de convergencia)'];
    dd.porFila.forEach(function (f) {
      const otros = [];
      for (let j = 0; j < A.length; j++) if (j !== f.i) otros.push('|' + A[f.i][j] + '|');
      lines.push('Fila ' + (f.i + 1) + ': $|' + A[f.i][f.i] + '| = ' + f.diag + (f.ok ? ' > ' : ' \\le ') + otros.join(' + ') + ' = ' + f.suma + '$ ' + (f.ok ? '✓' : '✗'));
    });
    lines.push(dd.ok
      ? '**SÍ es diagonal dominante** → Jacobi y Gauss-Seidel convergen para cualquier $X^{(0)}$ ✓'
      : '**NO es diagonal dominante** → la convergencia no está garantizada (puede converger o no). Pista: a veces basta reordenar las ecuaciones.');
    return lines;
  }

  /* Recta i del sistema para el dibujo 2×2: a·x + b·y = c. */
  function draw2D(A, B, tray, cur) {
    const d = [
      { t: 'lineEq', id: 'l1', a: A[0][0], b: A[0][1], c: B[0], cls: 'recta1', label: 'ec. 1' },
      { t: 'lineEq', id: 'l2', a: A[1][0], b: A[1][1], c: B[1], cls: 'recta2', label: 'ec. 2' },
    ];
    if (tray && tray.length > 1) d.push({ t: 'polyline', id: 'tray', pts: tray.slice(), cls: 'trayectoria' });
    if (cur) d.push({ t: 'point', id: 'Xk', x: cur[0], y: cur[1], cls: 'candidato', label: 'X⁽ᵏ⁾' });
    return d;
  }

  /* ---------- ELIMINACIÓN GAUSSIANA ---------- */
  NS.engines.gauss = function (p) {
    const A = p.A.map(function (r) { return r.slice(); });
    const B = p.B.slice();
    const tr = T.make('gauss', 'linear', { A: p.A, B: p.B });
    if (!validate(tr, A, B)) return tr;
    const n = A.length;
    const M = A.map(function (r, i) { return r.concat([B[i]]); });
    const L = Array.from({ length: n }, function (_, i) {
      return Array.from({ length: n }, function (_, j) { return i === j ? 1 : 0; });
    });

    T.step(tr, {
      type: 'setup', title: 'Matriz ampliada inicial',
      M: N.clone2D(M), aug: true,
      explain: [
        'Escribimos el sistema como matriz ampliada $[A\\,|\\,B]$ y lo llevaremos a forma **triangular superior** con operaciones elementales de fila.',
        'Cada operación $F_i \\to F_i - m\\,F_k$ conserva las soluciones del sistema.',
      ],
    });

    for (let k = 0; k < n - 1; k++) {
      if (Math.abs(M[k][k]) < 1e-15) {
        T.step(tr, {
          type: 'fail', title: 'Pivote nulo',
          M: N.clone2D(M), aug: true,
          highlights: [{ r: k, c: k, cls: 'error' }],
          explain: ['El pivote $a_{' + (k + 1) + ',' + (k + 1) + '} = 0$: sin intercambio de filas (pivoteo) no se puede continuar. Reordena las ecuaciones e inténtalo de nuevo.'],
        });
        return T.finish(tr, 'error', null, 'Pivote nulo en (' + (k + 1) + ',' + (k + 1) + ')');
      }
      T.step(tr, {
        type: 'pivot', k: k + 1, title: 'Paso ' + (k + 1) + ': eliminamos x' + (k + 1) + ' bajo el pivote',
        M: N.clone2D(M), aug: true,
        highlights: [{ r: k, c: k, cls: 'pivote' }],
        explain: [
          'Pivote: $a_{' + (k + 1) + ',' + (k + 1) + '}^{(' + k + ')} = ' + tex(M[k][k], 6) + '$',
          'Anularemos todos los coeficientes de la columna ' + (k + 1) + ' por debajo de él.',
        ],
      });
      for (let i = k + 1; i < n; i++) {
        const m = M[i][k] / M[k][k];
        L[i][k] = m;
        const old = M[i].slice();
        for (let j = k; j <= n; j++) M[i][j] -= m * M[k][j];
        T.step(tr, {
          type: 'rowop', title: 'F' + (i + 1) + ' → F' + (i + 1) + ' − (' + N.fmt(m, 6) + ')·F' + (k + 1),
          M: N.clone2D(M), aug: true,
          op: { kind: 'rowSub', i: i, k: k, m: m },
          oldRow: old,
          highlights: [
            { r: k, c: -1, cls: 'fuente' },
            { r: i, c: -1, cls: 'destino' },
            { r: i, c: k, cls: 'cero-nuevo' },
          ],
          explain: [
            'Multiplicador: $m_{' + (i + 1) + ',' + (k + 1) + '} = \\dfrac{a_{' + (i + 1) + ',' + (k + 1) + '}}{a_{' + (k + 1) + ',' + (k + 1) + '}} = \\dfrac{' + tex(old[k], 6) + '}{' + tex(M[k][k], 6) + '} = ' + tex(m, 6) + '$',
            '$F_{' + (i + 1) + '} \\to F_{' + (i + 1) + '} - (' + tex(m, 6) + ') \\cdot F_{' + (k + 1) + '}$',
            'El coeficiente $a_{' + (i + 1) + ',' + (k + 1) + '}$ se anula: ese es exactamente el objetivo del multiplicador.',
          ],
          quiz: {
            multiplicador: m,
            celdaCero: { r: i, c: k },
          },
        });
      }
    }

    /* Sustitución regresiva. */
    if (Math.abs(M[n - 1][n - 1]) < 1e-15) {
      T.step(tr, {
        type: 'fail', title: 'Sistema singular',
        M: N.clone2D(M), aug: true,
        highlights: [{ r: n - 1, c: n - 1, cls: 'error' }],
        explain: ['El último pivote es cero: $\\det(A) = 0$. El sistema no tiene solución única (o es incompatible o tiene infinitas soluciones).'],
      });
      return T.finish(tr, 'error', null, 'Sistema singular: det(A) = 0');
    }
    const Xs = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = M[i][n];
      const partes = [];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * Xs[j];
        partes.push('(' + tex(M[i][j], 6) + ') \\cdot (' + tex(Xs[j], 6) + ')');
      }
      Xs[i] = sum / M[i][i];
      T.step(tr, {
        type: 'backsub', title: 'Despejamos x' + (i + 1),
        M: N.clone2D(M), aug: true,
        X: Xs.slice(0, n).map(function (v, idx) { return idx >= i ? v : null; }),
        highlights: [{ r: i, c: -1, cls: 'fuente' }],
        explain: [
          '$x_{' + (i + 1) + '} = \\dfrac{' + tex(M[i][n], 6) + (partes.length ? ' - ' + partes.join(' - ') : '') + '}{' + tex(M[i][i], 6) + '} = ' + tex(Xs[i], 8) + '$',
        ],
        quiz: { xi: { i: i, val: Xs[i] } },
      });
    }

    const U = M.map(function (r) { return r.slice(0, n); });
    let det = 1;
    for (let i = 0; i < n; i++) det *= U[i][i];

    T.step(tr, {
      type: 'lu', title: 'Factorización A = L·U (regalo de la eliminación)',
      L: N.clone2D(L), U: N.clone2D(U),
      explain: [
        '**L** guarda los multiplicadores usados (con unos en la diagonal); **U** es la matriz triangular final.',
        'Sirve para resolver muchos sistemas $A x = b$ con distintos $b$ sin repetir la eliminación.',
      ],
    });
    T.step(tr, {
      type: 'final', title: 'Solución y determinante',
      M: N.clone2D(M), aug: true, X: Xs.slice(),
      explain: [
        Xs.map(function (v, i) { return '$x_{' + (i + 1) + '} = ' + tex(v, 8) + '$'; }).join(', '),
        '$\\det(A) = ' + U.map(function (r, i) { return tex(r[i], 4); }).join(' \\cdot ') + ' = ' + tex(det, 6) + '$ (producto de los pivotes)',
      ],
    });
    return T.finish(tr, 'converged', { X: Xs, L: L, U: U, det: det });
  };

  /* ---------- JACOBI y GAUSS-SEIDEL (comparten esqueleto) ---------- */
  function iterativo(nombre, p) {
    const esJacobi = nombre === 'jacobi';
    const A = p.A.map(function (r) { return r.slice(); });
    const B = p.B.slice();
    const tr = T.make(nombre, 'linear', {
      A: p.A, B: p.B, X0: p.X0, tol: +p.tol, maxIter: +p.maxIter || 30,
    });
    if (!validate(tr, A, B, p.X0)) return tr;
    const n = A.length;
    for (let i = 0; i < n; i++) {
      if (Math.abs(A[i][i]) < 1e-15) {
        T.step(tr, { type: 'fail', title: 'Cero en la diagonal', explain: ['$a_{' + (i + 1) + ',' + (i + 1) + '} = 0$: no se puede despejar $x_{' + (i + 1) + '}$. Reordena las ecuaciones para llevar valores grandes a la diagonal.'] });
        return T.finish(tr, 'error', null, 'Cero en la diagonal');
      }
    }
    let Xv = p.X0.slice();
    const tol = +p.tol, mx = +p.maxIter || 30;
    const vn = N.varNames(n);
    const es2D = n === 2;
    const tray = es2D ? [[Xv[0], Xv[1]]] : null;

    const dd = diagDominance(A);
    T.step(tr, {
      type: 'setup', title: 'Sistema y dominancia diagonal',
      M: A.map(function (r, i) { return r.concat([B[i]]); }), aug: true,
      dd: dd,
      explain: ddExplain(dd, A),
      draw: es2D ? draw2D(A, B, tray, Xv) : null,
    });

    const despejes = [];
    for (let i = 0; i < n; i++) {
      let s = '$' + vn[i] + '^{(k+1)} = \\dfrac{' + B[i];
      for (let j = 0; j < n; j++) {
        if (j !== i) s += ' - (' + A[i][j] + ')\\,' + vn[j] + '^{' + (!esJacobi && j < i ? '(k+1)' : '(k)') + '}';
      }
      s += '}{' + A[i][i] + '}$';
      despejes.push(s);
    }
    T.step(tr, {
      type: 'formula', title: 'Formulación iterativa (despejamos la diagonal)',
      explain: despejes.concat([
        esJacobi
          ? '**Jacobi** usa SIEMPRE el vector completo de la iteración anterior $X^{(k)}$: todas las variables se actualizan “a la vez”.'
          : '**Gauss-Seidel** usa los valores **recién calculados** $x_j^{(k+1)}$ en cuanto están disponibles ($j < i$): por eso suele converger más rápido.',
      ]),
      draw: es2D ? draw2D(A, B, tray, Xv) : null,
    });

    for (let it = 1; it <= mx; it++) {
      const Xold = Xv.slice();
      const Xn = esJacobi ? new Array(n) : Xv; /* G-S actualiza in place */
      const perVar = [];
      const explain = [];
      for (let i = 0; i < n; i++) {
        let sum = B[i];
        const terms = [];
        let linea = '$' + vn[i] + '_{' + it + '} = \\dfrac{' + B[i];
        for (let j = 0; j < n; j++) {
          if (j === i) continue;
          const xj = esJacobi ? Xold[j] : Xv[j];
          const nuevo = !esJacobi && j < i;
          sum -= A[i][j] * xj;
          terms.push({ j: j, a: A[i][j], xj: xj, usaNuevo: nuevo });
          linea += ' - (' + A[i][j] + ')(' + tex(xj, 6) + ')' + (nuevo ? '^{\\,new}' : '');
        }
        const val = sum / A[i][i];
        Xn[i] = val;
        linea += '}{' + A[i][i] + '} = \\dfrac{' + tex(sum, 6) + '}{' + A[i][i] + '} = ' + tex(val, 6) + '$';
        explain.push(linea);
        perVar.push({ i: i, terms: terms, num: sum, val: val });
        if (es2D && !esJacobi) tray.push([Xn[0], i === 0 ? Xold[1] : Xn[1]]);
      }
      if (es2D && esJacobi) tray.push([Xn[0], Xn[1]]);
      const md = Math.max.apply(null, Xn.map(function (v, i) { return Math.abs(v - Xold[i]); }));
      explain.push('$X^{(' + it + ')} = [' + Xn.map(function (v) { return tex(v, 6); }).join(',\\ ') + ']$, $\\quad \\max_i |\\Delta x_i| = ' + tex(md, 8) + '$');
      const st = T.step(tr, {
        type: 'sweep', k: it, title: 'Iteración ' + it + (esJacobi ? ' — todos los valores de X⁽' + (it - 1) + '⁾' : ' — usa los valores recién calculados'),
        xOld: Xold, xNew: Xn.slice(),
        perVar: perVar,
        deltas: Xn.map(function (v, i) { return Math.abs(v - Xold[i]); }),
        error: md, errorKind: 'max|Δx|',
        estimate: null,
        explain: explain,
        draw: es2D ? draw2D(A, B, tray, [Xn[0], Xn[1]]) : null,
        quiz: {
          primeraVar: { i: 0, val: perVar[0].val },
          usaViejos: esJacobi,
        },
      });
      if (esJacobi) Xv = Xn.slice();
      if (md < tol) {
        st.explain.push('$\\max|\\Delta x| < ' + tex(tol) + '$ → **CONVERGE** en ' + it + ' iteraciones');
        T.step(tr, {
          type: 'final', title: 'Convergencia',
          xNew: Xv.slice(),
          explain: ['**Solución: $X \\approx [' + Xv.map(function (v) { return tex(v, 6); }).join(',\\ ') + ']$** en ' + it + ' iteraciones.'],
          draw: es2D ? draw2D(A, B, tray, [Xv[0], Xv[1]]) : null,
        });
        return T.finish(tr, 'converged', { X: Xv.slice(), iters: it });
      }
      if (Xv.some(function (v) { return !isFinite(v) || Math.abs(v) > 1e12; })) {
        st.type = 'fail';
        st.explain.push('**DIVERGE**: los iterados crecen sin control (la matriz no cumple las condiciones de convergencia).');
        return T.finish(tr, 'diverged', null, 'La iteración diverge');
      }
    }
    T.step(tr, {
      type: 'fail', title: 'Máximo de iteraciones',
      explain: ['Se alcanzó el máximo de ' + mx + ' iteraciones sin cumplir la tolerancia. Último iterante: $[' + Xv.map(function (v) { return tex(v, 6); }).join(', ') + ']$'],
    });
    return T.finish(tr, 'maxIter', { X: Xv.slice(), iters: mx });
  }

  NS.engines.jacobi = function (p) { return iterativo('jacobi', p); };
  NS.engines.seidel = function (p) { return iterativo('seidel', p); };
})(globalThis.MNO = globalThis.MNO || {});
