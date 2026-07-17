/* MNO.engines — interpolación: Lagrange, Newton (diferencias divididas) y
   Hermite (diferencias divididas generalizadas). Matemática portada del legacy. */
(function (NS) {
  'use strict';

  const T = NS.trace, N = NS.num;
  const tex = N.tex;

  NS.engines = NS.engines || {};

  function hintNodes(nd, pts) {
    const xs = nd.concat(pts || []);
    let lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const m = (hi - lo) * 0.2;
    return { xmin: lo - m, xmax: hi + m };
  }

  function nodePrims(nd, dt, cls) {
    return nd.map(function (x, i) {
      return { t: 'point', id: 'n' + i, x: x, y: dt[i], cls: cls || 'nodo', label: 'x' + i };
    });
  }

  function validar(tr, nd, dt, exigirDistintos) {
    if (!nd.length || nd.length !== dt.length || nd.some(function (v) { return !isFinite(v); }) || dt.some(function (v) { return !isFinite(v); })) {
      T.step(tr, { type: 'fail', title: 'Datos no válidos', explain: ['Los nodos y los valores deben ser listas numéricas de la misma longitud.'] });
      T.finish(tr, 'error', null, 'Datos no válidos');
      return false;
    }
    if (exigirDistintos) {
      for (let i = 0; i < nd.length; i++) {
        for (let j = i + 1; j < nd.length; j++) {
          if (nd[i] === nd[j]) {
            T.step(tr, { type: 'fail', title: 'Nodos repetidos', explain: ['Los nodos $x_' + i + '$ y $x_' + j + '$ son iguales ($' + tex(nd[i]) + '$). Para interpolar con datos de derivada usa **Hermite**.'] });
            T.finish(tr, 'error', null, 'Nodos repetidos');
            return false;
          }
        }
      }
    } else {
      /* Hermite: cada nodo repetido debe ir CONTIGUO (agrupado con sus derivadas) */
      for (let i = 1; i < nd.length; i++) {
        if (nd[i] !== nd[i - 1] && nd.slice(0, i).indexOf(nd[i]) >= 0) {
          T.step(tr, { type: 'fail', title: 'Nodos mal agrupados', explain: ['El nodo $' + tex(nd[i]) + '$ aparece repetido en posiciones NO contiguas. En Hermite cada nodo debe ir agrupado con sus datos: p. ej. $[0,\\ 0,\\ 1,\\ 1]$, no $[0,\\ 1,\\ 0,\\ 1]$.'] });
          T.finish(tr, 'error', null, 'Nodos repetidos no contiguos');
          return false;
        }
      }
    }
    return true;
  }

  /* ---------- LAGRANGE ---------- */
  NS.engines.lagrange = function (p) {
    const nd = p.nodes.slice(), dt = p.values.slice(), pts = (p.evalXs || []).slice();
    const tr = T.make('lagrange', 'interp', { nodes: nd, values: dt, evalXs: pts });
    if (!validar(tr, nd, dt, true)) return tr;
    const n = nd.length;
    tr.plotHints = hintNodes(nd, pts);

    /* Polinomio completo y bases como clausuras para dibujar. */
    const co = [];
    tr.fns.P = function (x) {
      let v = 0;
      for (let i = 0; i < n; i++) {
        let Li = 1;
        for (let j = 0; j < n; j++) if (j !== i) Li *= (x - nd[j]) / (nd[i] - nd[j]);
        v += dt[i] * Li;
      }
      return v;
    };

    T.step(tr, {
      type: 'setup', title: 'Datos',
      explain: [
        'Nodos: $\\{' + nd.join(',\\ ') + '\\}$ → ' + n + ' nodos → polinomio de grado $\\le ' + (n - 1) + '$.',
        'Valores: $\\{' + dt.join(',\\ ') + '\\}$',
        'Idea: construir $P$ como combinación de polinomios base $L_i$, donde cada $L_i$ vale **1 en su nodo** y **0 en todos los demás**.',
      ],
      draw: nodePrims(nd, dt),
    });

    for (let i = 0; i < n; i++) {
      let d = 1, ns = '', ds = '';
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          d *= (nd[i] - nd[j]);
          ns += '(x - ' + nd[j] + ')';
          ds += '(' + nd[i] + ' - ' + nd[j] + ')';
        }
      }
      const A = dt[i] / d;
      co.push(A);
      (function (i) {
        tr.fns['L' + i] = function (x) {
          let Li = 1;
          for (let j = 0; j < n; j++) if (j !== i) Li *= (x - nd[j]) / (nd[i] - nd[j]);
          return Li;
        };
        /* aporte real del término: f(xᵢ)·Lᵢ(x) — visible a la escala de los datos */
        tr.fns['T' + i] = function (x) { return dt[i] * tr.fns['L' + i](x); };
      })(i);
      T.step(tr, {
        type: 'basis', k: i, title: 'Polinomio base L' + i + '(x)',
        state: { i: i, denom: d, A: A },
        explain: [
          '$L_{' + i + '}(x) = \\dfrac{' + ns.replace(/- -/g, '+ ') + '}{' + ds.replace(/- -/g, '+ ') + '}$',
          'Denominador: $' + tex(d, 6) + '$. Observa que $L_{' + i + '}(' + nd[i] + ') = 1$ y $L_{' + i + '}(x_j) = 0$ en los demás nodos.',
          'Coeficiente: $A_{' + i + '} = \\dfrac{f(x_{' + i + '})}{\\text{denom}} = \\dfrac{' + dt[i] + '}{' + tex(d, 6) + '} = ' + tex(A, 8) + '$',
          'La curva dibujada es el **aporte** de este término: $f(x_{' + i + '}) \\cdot L_{' + i + '}(x)$ — pasa por su punto y se anula en los demás nodos. P(x) será la SUMA de todos los aportes.',
        ],
        draw: nodePrims(nd, dt).concat([
          { t: 'curve', fn: 'T' + i, cls: 'base' },
          { t: 'point', id: 'sel', x: nd[i], y: dt[i], cls: 'candidato', label: 'x' + i },
        ]),
        quiz: { Avalor: A, denom: d },
      });
    }

    let ptex = 'P(x) = ';
    for (let i = 0; i < n; i++) {
      if (i > 0) ptex += ' + ';
      ptex += tex(co[i], 6);
      for (let j = 0; j < n; j++) if (j !== i) ptex += '(x - ' + nd[j] + ')';
    }
    ptex = ptex.replace(/- -/g, '+ ').replace(/\+ -/g, '- ');
    T.step(tr, {
      type: 'poly', title: 'Polinomio interpolador',
      explain: ['$' + ptex + '$', 'La curva pasa **exactamente** por los ' + n + ' puntos dados (y es el ÚNICO polinomio de grado $\\le ' + (n - 1) + '$ que lo hace).'],
      draw: nodePrims(nd, dt).concat([{ t: 'curve', fn: 'P', cls: 'interpolante' }]),
    });

    const evals = [];
    for (let q = 0; q < pts.length; q++) {
      const xp = pts[q];
      let v = 0;
      const lines = [];
      for (let i = 0; i < n; i++) {
        let Li = 1;
        const ps = [];
        for (let j = 0; j < n; j++) {
          if (j !== i) {
            Li *= (xp - nd[j]) / (nd[i] - nd[j]);
            ps.push('\\tfrac{' + tex(xp) + ' - ' + nd[j] + '}{' + nd[i] + ' - ' + nd[j] + '}');
          }
        }
        v += dt[i] * Li;
        lines.push('$L_{' + i + '}(' + tex(xp) + ') = ' + ps.join(' \\cdot ').replace(/- -/g, '+ ') + ' = ' + tex(Li, 8) + '$ → aporta $' + dt[i] + ' \\cdot ' + tex(Li, 6) + ' = ' + tex(dt[i] * Li, 8) + '$');
      }
      evals.push({ x: xp, y: v });
      lines.push('**$P(' + tex(xp) + ') = ' + tex(v, 8) + '$**');
      T.step(tr, {
        type: 'eval', title: 'Evaluamos P(' + N.fmt(xp) + ')',
        state: { x: xp, y: v },
        explain: lines,
        draw: nodePrims(nd, dt).concat([
          { t: 'curve', fn: 'P', cls: 'interpolante' },
          { t: 'vline', id: 'vx', x: xp, cls: 'guia' },
          { t: 'point', id: 'pe', x: xp, y: v, cls: 'raiz', label: 'P(x*)' },
        ]),
        quiz: { predictY: { x: xp, y: v, pregunta: '¿A qué altura pasará el polinomio por x*?' } },
      });
    }
    return T.finish(tr, 'converged', { coefs: co, evals: evals, ptex: ptex });
  };

  /* ---------- NEWTON / HERMITE (diferencias divididas) ---------- */
  function newtonDD(nombre, p) {
    const esHermite = nombre === 'hermite';
    const nd = p.nodes.slice(), dt = p.values.slice(), pts = (p.evalXs || []).slice();
    const tr = T.make(nombre, 'interp', { nodes: nd, values: dt, evalXs: pts });
    if (!validar(tr, nd, dt, !esHermite)) return tr;
    const n = nd.length;
    tr.plotHints = hintNodes(nd, pts);

    /* Inicio de grupo de cada nodo expandido (Hermite: nodos repetidos). */
    const gs = new Array(n);
    for (let i = 0; i < n; i++) gs[i] = (i > 0 && nd[i] === nd[i - 1]) ? gs[i - 1] : i;
    /* Altura real de cada nodo para dibujar: en Hermite, el valor f de su grupo. */
    const yNodos = esHermite ? nd.map(function (_, i) { return dt[gs[i]]; }) : dt;

    T.step(tr, {
      type: 'setup', title: 'Datos',
      explain: esHermite ? [
        'Nodos expandidos: $[' + nd.join(',\\ ') + ']$ (cada nodo se repite según cuántos datos aporta: $f$, $f\'$, $f\'\'/2!$, …).',
        'Datos: $[' + dt.join(',\\ ') + ']$',
        'Hermite generaliza las diferencias divididas: **cuando los nodos de una celda coinciden, el cociente se sustituye por el dato de derivada de ese nodo**.',
      ] : [
        'Nodos: $\\{' + nd.join(',\\ ') + '\\}$, valores $\\{' + dt.join(',\\ ') + '\\}$ → grado $\\le ' + (n - 1) + '$.',
        'La forma de Newton construye $P$ **incrementalmente**: cada nodo nuevo añade UN término sin recalcular los anteriores.',
        '$P(x) = c_0 + c_1(x - x_0) + c_2(x - x_0)(x - x_1) + \\cdots$ — los $c_j$ salen de la tabla de diferencias divididas.',
      ],
      draw: nodePrims(nd, yNodos),
      tabla: null,
    });

    /* Tabla de diferencias divididas.
       En Hermite, cada nodo repetido forma un GRUPO cuyos datos son
       f, f'/1!, f''/2!, …  La columna 0 lleva el VALOR f del grupo, y una
       celda con nodos extremos iguales toma el dato j-ésimo de su grupo:
       dd[i][j] = dato[inicioGrupo(i) + j]  (usar dt[i+j] — como hacía la
       versión original — solo es correcto en la primera fila de la tabla). */
    const dd = Array.from({ length: n }, function () { return new Array(n).fill(null); });
    for (let i = 0; i < n; i++) dd[i][0] = esHermite ? dt[gs[i]] : dt[i];
    T.step(tr, {
      type: 'dd0', title: esHermite ? 'Orden 0: el VALOR f de cada grupo' : 'Orden 0: los propios datos',
      tabla: dd.map(function (r) { return r.slice(); }),
      nodos: nd.slice(),
      explain: esHermite
        ? ['La primera columna lleva $f(x_i)$ para cada nodo expandido: los nodos repetidos **repiten su valor de $f$** (las derivadas entrarán después, en las columnas superiores).']
        : ['La primera columna de la tabla son los valores dados: $f[x_i] = f(x_i)$.'],
      draw: nodePrims(nd, esHermite ? dd.map(function (r) { return r[0]; }) : dt),
    });
    for (let j = 1; j < n; j++) {
      for (let i = 0; i < n - j; i++) {
        let esDeriv = false;
        if (esHermite && nd[i + j] === nd[i]) {
          dd[i][j] = dt[gs[i] + j];
          esDeriv = true;
        } else {
          dd[i][j] = (dd[i + 1][j - 1] - dd[i][j - 1]) / (nd[i + j] - nd[i]);
        }
        T.step(tr, {
          type: 'dd', k: null, title: 'Orden ' + j + ': f[' + nd.slice(i, i + j + 1).join(',') + ']',
          tabla: dd.map(function (r) { return r.slice(); }),
          nodos: nd.slice(),
          celda: { i: i, j: j, val: dd[i][j], esDerivada: esDeriv, padres: [[i + 1, j - 1], [i, j - 1]] },
          explain: esDeriv ? [
            'Los nodos $x_{' + i + '}$ y $x_{' + (i + j) + '}$ son **iguales** ($' + tex(nd[i]) + '$): el cociente sería $\\frac{0}{0}$.',
            '**Regla de Hermite**: entra el dato de derivada de orden ' + j + ' de ese nodo, $\\frac{f^{(' + j + ')}}{' + j + '!} = ' + tex(dd[i][j], 8) + '$',
          ] : [
            '$f[' + nd.slice(i, i + j + 1).join(',') + '] = \\dfrac{' + tex(dd[i + 1][j - 1], 6) + ' - (' + tex(dd[i][j - 1], 6) + ')}{' + tex(nd[i + j]) + ' - (' + tex(nd[i]) + ')} = ' + tex(dd[i][j], 8) + '$',
            'Se combinan las dos celdas vecinas de la columna anterior (los “padres”).',
          ],
          quiz: { celdaVal: dd[i][j], padres: [[i + 1, j - 1], [i, j - 1]], esDerivada: esDeriv },
        });
      }
    }

    const c = [];
    for (let j = 0; j < n; j++) c.push(dd[0][j]);
    T.step(tr, {
      type: 'coef', title: 'Coeficientes: la diagonal superior',
      tabla: dd.map(function (r) { return r.slice(); }),
      nodos: nd.slice(),
      coefs: c.slice(),
      explain: [c.map(function (v, i) { return '$c_{' + i + '} = ' + tex(v, 8) + '$'; }).join(', '), 'Los coeficientes del polinomio de Newton son la **primera fila** (diagonal superior) de la tabla.'],
      draw: nodePrims(nd, yNodos),
    });

    /* Polinomio: clausuras parciales para ver la curva "crecer". */
    function partial(k) {
      return function (x) {
        let v = c[0], pr = 1;
        for (let j = 1; j <= k; j++) {
          pr *= (x - nd[j - 1]);
          v += c[j] * pr;
        }
        return v;
      };
    }
    let ptex = 'P(x) = ' + tex(c[0], 6);
    for (let j = 1; j < n; j++) {
      tr.fns['P' + j] = partial(j);
      let term = (c[j] >= 0 ? ' + ' : ' - ') + Math.abs(N.R(c[j], 6));
      for (let k = 0; k < j; k++) term += '(x' + (nd[k] >= 0 ? ' - ' : ' + ') + Math.abs(nd[k]) + ')';
      ptex += term;
      T.step(tr, {
        type: 'poly', k: null, title: 'Añadimos el término de grado ' + j,
        state: { j: j, cj: c[j] },
        explain: [
          'Término nuevo: $' + (c[j] >= 0 ? '+' : '-') + Math.abs(N.R(c[j], 6)) + Array.from({ length: j }, function (_, k) { return '(x' + (nd[k] >= 0 ? ' - ' : ' + ') + Math.abs(nd[k]) + ')'; }).join('') + '$',
          'El polinomio parcial de grado ' + j + ' ya interpola los primeros ' + (j + 1) + ' datos.',
        ],
        draw: nodePrims(nd, yNodos).concat([{ t: 'curve', fn: 'P' + j, cls: 'interpolante' }]),
      });
    }
    tr.fns.P = partial(n - 1);

    T.step(tr, {
      type: 'polyfull', title: 'Polinomio completo',
      explain: ['$' + ptex + '$'],
      draw: nodePrims(nd, yNodos).concat([{ t: 'curve', fn: 'P', cls: 'interpolante' }]),
    });

    const evals = [];
    for (let q = 0; q < pts.length; q++) {
      const xp = pts[q];
      let v = c[0], pr = 1;
      const partes = ['$P(' + tex(xp) + ') = ' + tex(c[0], 6) + '$'];
      for (let j = 1; j < n; j++) {
        pr *= (xp - nd[j - 1]);
        v += c[j] * pr;
        partes.push('$+\\ (' + tex(c[j], 6) + ') \\cdot (' + tex(pr, 6) + ') \\to ' + tex(v, 8) + '$');
      }
      evals.push({ x: xp, y: v });
      partes.push('**$P(' + tex(xp) + ') = ' + tex(v, 8) + '$**');
      T.step(tr, {
        type: 'eval', title: 'Evaluamos P(' + N.fmt(xp) + ')',
        state: { x: xp, y: v },
        explain: partes,
        draw: nodePrims(nd, yNodos).concat([
          { t: 'curve', fn: 'P', cls: 'interpolante' },
          { t: 'vline', id: 'vx', x: xp, cls: 'guia' },
          { t: 'point', id: 'pe', x: xp, y: v, cls: 'raiz', label: 'P(x*)' },
        ]),
        quiz: { predictY: { x: xp, y: v, pregunta: '¿A qué altura pasará el polinomio por x*?' } },
      });
    }
    return T.finish(tr, 'converged', { coefs: c, evals: evals, tabla: dd, ptex: ptex });
  }

  NS.engines.newtoni = function (p) { return newtonDD('newtoni', p); };
  NS.engines.hermite = function (p) { return newtonDD('hermite', p); };
})(globalThis.MNO = globalThis.MNO || {});
