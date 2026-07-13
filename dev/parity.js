/* Verificación de paridad numérica: motores nuevos vs oráculo legacy.
   El oráculo reimplementa EXACTAMENTE los bucles del MNO Helper original
   (legacy/metodos_numericos.html), incluido su evaluador E() por regex,
   de modo que también valida cruzado el parser nuevo contra el viejo.
   Uso: node dev/parity.js */
'use strict';

require('../js/core/num.js');
require('../js/core/expr.js');
require('../js/core/trace.js');
require('../js/core/engines/rootfinding.js');
require('../js/core/engines/linear.js');
require('../js/core/engines/interp.js');

const MNO = globalThis.MNO;

/* --- Oráculo: E() copiado literal del legacy (línea 146) --- */
const E = (e, v = {}) => {
  try {
    let s = e.toString().replace(/\^/g, '**').replace(/\bpi\b/g, String(Math.PI))
      .replace(/\bsin\(/g, 'Math.sin(').replace(/\bcos\(/g, 'Math.cos(')
      .replace(/\btan\(/g, 'Math.tan(').replace(/\bexp\(/g, 'Math.exp(')
      .replace(/\blog\(/g, 'Math.log(').replace(/\bln\(/g, 'Math.log(')
      .replace(/\bsqrt\(/g, 'Math.sqrt(').replace(/\babs\(/g, 'Math.abs(');
    for (let k in v) s = s.replace(new RegExp('\\b' + k + '\\b', 'g'), '(' + v[k] + ')');
    return Function('"use strict";return(' + s + ')')();
  } catch (x) { return NaN; }
};

/* --- Oráculos por método: bucles copiados del legacy sin el HTML --- */
function oBis(f, a, b, tol, mx) {
  const cs = [];
  let fa = E(f, { x: a }), fb = E(f, { x: b });
  if (fa * fb > 0) return { error: 'sin cambio de signo' };
  for (let i = 1; i <= mx; i++) {
    const c = (a + b) / 2, fc = E(f, { x: c });
    fa = E(f, { x: a }); fb = E(f, { x: b });
    cs.push(c);
    if (Math.abs(fc) < 1e-15) return { root: c, iters: i, cs };
    if ((b - a) / 2 < tol) return { root: c, iters: i, cs };
    if (fa * fc < 0) b = c; else a = c;
  }
  return { root: (a + b) / 2, iters: mx, cs };
}
function oCue(f, a, b, tol) {
  const cs = [];
  let fa = E(f, { x: a }), fb = E(f, { x: b });
  if (fa * fb > 0) return { error: 'sin cambio de signo' };
  for (let i = 1; i <= 50; i++) {
    fa = E(f, { x: a }); fb = E(f, { x: b });
    const c = a - fa * (b - a) / (fb - fa), fc = E(f, { x: c });
    cs.push(c);
    if (Math.abs(fc) < tol) return { root: c, iters: i, cs };
    if (fa * fc < 0) b = c; else a = c;
  }
  return { root: cs[cs.length - 1], iters: 50, cs };
}
function oPf(g, x, tol, mx) {
  const xs = [];
  for (let i = 0; i < mx; i++) {
    const xn = E(g, { x }), d = Math.abs(xn - x);
    xs.push(xn);
    if (d < tol) return { root: xn, iters: i + 1, xs };
    if (!isFinite(xn)) return { error: 'diverge', xs };
    x = xn;
  }
  return { root: x, iters: mx, xs };
}
function oNw(f, df, x, tol, mx) {
  const xs = [];
  for (let i = 0; i < mx; i++) {
    const fx = E(f, { x }), dfx = E(df, { x });
    if (Math.abs(dfx) < 1e-15) return { error: 'derivada nula', xs };
    const xn = x - fx / dfx, d = Math.abs(xn - x);
    xs.push(xn);
    if (d < tol) return { root: xn, iters: i + 1, xs };
    x = xn;
  }
  return { root: x, iters: mx, xs };
}
function oSec(f, x0, x1, tol) {
  const xs = [];
  for (let i = 0; i < 50; i++) {
    const f0 = E(f, { x: x0 }), f1 = E(f, { x: x1 });
    if (Math.abs(f1 - f0) < 1e-15) return { error: 'div 0', xs };
    const x2 = x1 - f1 * (x1 - x0) / (f1 - f0), d = Math.abs(x2 - x1);
    xs.push(x2);
    if (d < tol) return { root: x2, iters: i + 1, xs };
    x0 = x1; x1 = x2;
  }
  return { root: x1, iters: 50, xs };
}
function oGa(A, B) {
  const n = A.length;
  const M = A.map((r, i) => [...r, B[i]]);
  const L = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
  for (let k = 0; k < n - 1; k++) {
    if (Math.abs(M[k][k]) < 1e-15) return { error: 'pivote nulo' };
    const pv = [...M[k]];
    for (let i = k + 1; i < n; i++) {
      const m = M[i][k] / M[k][k];
      L[i][k] = m;
      for (let j = k; j <= n; j++) M[i][j] -= m * pv[j];
    }
  }
  const X = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * X[j];
    X[i] = sum / M[i][i];
  }
  const U = M.map(r => r.slice(0, n));
  let det = 1;
  for (let i = 0; i < n; i++) det *= U[i][i];
  return { X, L, U, det };
}
function oIter(esJacobi, A, B, X0, tol, mx) {
  const n = A.length;
  let X = [...X0];
  const hist = [];
  for (let it = 1; it <= mx; it++) {
    if (esJacobi) {
      const Xn = Array(n);
      for (let i = 0; i < n; i++) {
        let sum = B[i];
        for (let j = 0; j < n; j++) if (j !== i) sum -= A[i][j] * X[j];
        Xn[i] = sum / A[i][i];
      }
      const md = Math.max(...Xn.map((v, i) => Math.abs(v - X[i])));
      hist.push([...Xn]);
      if (md < tol) return { X: Xn, iters: it, hist };
      X = [...Xn];
    } else {
      const Xold = [...X];
      for (let i = 0; i < n; i++) {
        let sum = B[i];
        for (let j = 0; j < n; j++) if (j !== i) sum -= A[i][j] * X[j];
        X[i] = sum / A[i][i];
      }
      const md = Math.max(...X.map((v, i) => Math.abs(v - Xold[i])));
      hist.push([...X]);
      if (md < tol) return { X: [...X], iters: it, hist };
    }
  }
  return { X, iters: mx, hist };
}
function oLg(nd, dt, xp) {
  const n = nd.length;
  let v = 0;
  for (let i = 0; i < n; i++) {
    let Li = 1;
    for (let j = 0; j < n; j++) if (j !== i) Li *= (xp - nd[j]) / (nd[i] - nd[j]);
    v += dt[i] * Li;
  }
  return v;
}
function oNiHm(nd, dt, xp, hermite) {
  /* NOTA: para Hermite este oráculo implementa el algoritmo CORRECTO
     (dato del grupo: dd[i][j] = dt[inicioGrupo(i)+j]). El legacy original
     usaba dt[i+j], válido solo en la primera fila: su polinomio ni siquiera
     interpolaba sus propios datos (bug corregido en la app nueva). */
  const n = nd.length;
  const gs = new Array(n);
  for (let i = 0; i < n; i++) gs[i] = (i > 0 && nd[i] === nd[i - 1]) ? gs[i - 1] : i;
  const dd = Array.from({ length: n }, () => Array(n).fill(null));
  for (let i = 0; i < n; i++) dd[i][0] = hermite ? dt[gs[i]] : dt[i];
  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      if (hermite && nd[i + j] === nd[i]) dd[i][j] = dt[gs[i] + j];
      else dd[i][j] = (dd[i + 1][j - 1] - dd[i][j - 1]) / (nd[i + j] - nd[i]);
    }
  }
  const c = [];
  for (let j = 0; j < n; j++) c.push(dd[0][j]);
  let v = c[0], pr = 1;
  for (let j = 1; j < n; j++) { pr *= (xp - nd[j - 1]); v += c[j] * pr; }
  return { coefs: c, val: v };
}

/* --- Comparador --- */
let pass = 0, failCount = 0;
function cmp(nombre, a, b, tol = 1e-10) {
  const va = Array.isArray(a) ? a : [a];
  const vb = Array.isArray(b) ? b : [b];
  let ok = va.length === vb.length;
  if (ok) for (let i = 0; i < va.length; i++) {
    if (!(Math.abs(va[i] - vb[i]) <= tol * Math.max(1, Math.abs(vb[i])))) { ok = false; break; }
  }
  if (ok) { pass++; }
  else { failCount++; console.log('  ✗ ' + nombre + '\n    nuevo:  ' + JSON.stringify(va) + '\n    legacy: ' + JSON.stringify(vb)); }
}

const iterVals = (tr, campo) => tr.steps.filter(s => s.type === 'iter').map(s => s.state[campo]);

/* ============ CASOS ============ */
console.log('— Bisección —');
[
  ['x^2 - 2', 0, 2, 0.01, 50],
  ['cos(x) - x', 0, 1, 0.0001, 60],
  ['x^3 - x - 2', 1, 2, 0.000001, 60],
  ['x^2 - 4', 0, 4, 0.01, 50],          /* raíz exacta en la 1.ª iteración */
  ['exp(x) - 3', 0, 2, 0.0001, 60],
  ['sin(x)', 2, 4, 0.00001, 60],
].forEach(([f, a, b, tol, mx]) => {
  const o = oBis(f, a, b, tol, mx);
  const t = MNO.engines.biseccion({ f, a, b, tol, maxIter: mx });
  cmp('bis ' + f + ' cs', iterVals(t, 'c'), o.cs);
  cmp('bis ' + f + ' root', t.result.root, o.root);
});

console.log('— Cuerda —');
[
  ['x^2 - 4', 0, 3, 0.01],
  ['cos(x) - x', 0, 1, 0.0001],
  ['x^3 - x - 2', 1, 2, 0.0001],
  ['exp(x) - 3', 0, 2, 0.0001],
].forEach(([f, a, b, tol]) => {
  const o = oCue(f, a, b, tol);
  const t = MNO.engines.cuerda({ f, a, b, tol, maxIter: 50 });
  cmp('cue ' + f + ' cs', iterVals(t, 'c'), o.cs);
  cmp('cue ' + f + ' root', t.result.root, o.root);
});

console.log('— Punto fijo —');
[
  ['cos(x)', 0, 0.0001, 50],
  ['exp(-x)', 0.5, 0.0001, 60],
  ['(x + 2/x)/2', 1, 0.0000001, 50],   /* Herón para sqrt(2) */
  ['sqrt(x + 2)', 0, 0.00001, 50],
].forEach(([g, x0, tol, mx]) => {
  const o = oPf(g, x0, tol, mx);
  const t = MNO.engines.puntofijo({ g, x0, tol, maxIter: mx });
  cmp('pf ' + g + ' xs', iterVals(t, 'xn'), o.xs);
  cmp('pf ' + g + ' root', t.result.root, o.root);
});

console.log('— Newton —');
[
  ['exp(x) + x', 'exp(x) + 1', -1, 0.0001, 50],
  ['x^2 - 2', '2x', 1, 0.0000001, 50],
  ['x^3 - x - 2', '3x^2 - 1', 2, 0.0000001, 50],
  ['cos(x) - x', '-sin(x) - 1', 1, 0.0000001, 50],
].forEach(([f, df, x0, tol, mx]) => {
  const o = oNw(f, df.replace(/(\d)x/g, '$1*x'), x0, tol, mx); /* E legacy no tiene mult implícita */
  const t = MNO.engines.newton({ f, df, x0, tol, maxIter: mx });
  cmp('nw ' + f + ' xs', iterVals(t, 'xn'), o.xs);
  cmp('nw ' + f + ' root', t.result.root, o.root);
});

console.log('— Secante —');
[
  ['exp(x) + x', -1, -0.9, 0.0001],
  ['x^2 - 2', 1, 2, 0.0000001],
  ['x^3 - x - 2', 1, 2, 0.0000001],
].forEach(([f, x0, x1, tol]) => {
  const o = oSec(f, x0, x1, tol);
  const t = MNO.engines.secante({ f, x0, x1, tol, maxIter: 50 });
  cmp('sec ' + f + ' xs', iterVals(t, 'x2'), o.xs);
  cmp('sec ' + f + ' root', t.result.root, o.root);
});

console.log('— Gauss —');
[
  [[[-2, -2, 2], [2, -4, 3], [-1, 2, -3]], [10, 2, 1]],      /* caso por defecto del legacy */
  [[[4, 1], [2, 3]], [1, 2]],
  [[[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3]],     /* clásico: x=2,y=3,z=-1 */
  [[[1, 2, 3, 4], [2, 3, 4, 1], [3, 4, 1, 2], [4, 1, 2, 3]], [10, 10, 10, 10]],
].forEach(([A, B], idx) => {
  const o = oGa(A, B);
  const t = MNO.engines.gauss({ A, B });
  cmp('gauss#' + idx + ' X', t.result.X, o.X);
  cmp('gauss#' + idx + ' det', t.result.det, o.det);
  cmp('gauss#' + idx + ' L', t.result.L.flat(), o.L.flat());
  cmp('gauss#' + idx + ' U', t.result.U.flat(), o.U.flat());
});

console.log('— Jacobi / Gauss-Seidel —');
[
  [[[-4, 1, -1], [-1, -5, 1], [2, -2, 5]], [2, -5, 10], [0, 0, 0], 0.001, 30],
  [[[10, 1], [2, 8]], [11, 10], [0, 0], 0.00001, 50],
  [[[5, -1, 2], [1, 6, -1], [2, 1, 4]], [12, 10, 11], [0, 0, 0], 0.0001, 50],
].forEach(([A, B, X0, tol, mx], idx) => {
  const oj = oIter(true, A, B, X0, tol, mx);
  const tj = MNO.engines.jacobi({ A, B, X0, tol, maxIter: mx });
  cmp('jacobi#' + idx + ' X', tj.result.X, oj.X);
  cmp('jacobi#' + idx + ' iters', tj.result.iters, oj.iters);
  cmp('jacobi#' + idx + ' hist', tj.steps.filter(s => s.type === 'sweep').map(s => s.xNew).flat(), oj.hist.flat());
  const os = oIter(false, A, B, X0, tol, mx);
  const ts = MNO.engines.seidel({ A, B, X0, tol, maxIter: mx });
  cmp('seidel#' + idx + ' X', ts.result.X, os.X);
  cmp('seidel#' + idx + ' iters', ts.result.iters, os.iters);
  cmp('seidel#' + idx + ' hist', ts.steps.filter(s => s.type === 'sweep').map(s => s.xNew).flat(), os.hist.flat());
});

console.log('— Lagrange —');
[
  [[-1, 1, 2, 3], [-1, 1, 32, 243], [0]],         /* defecto del legacy */
  [[0, 1, 2], [1, 3, 7], [1.5]],
  [[1, 2, 4, 5], [0, 3, 15, 24], [3]],
].forEach(([nd, dt, xs], idx) => {
  const t = MNO.engines.lagrange({ nodes: nd, values: dt, evalXs: xs });
  xs.forEach((xp, q) => cmp('lagrange#' + idx + ' P(' + xp + ')', t.result.evals[q].y, oLg(nd, dt, xp)));
});

console.log('— Newton interpolación —');
[
  [[-1, 1, 2, 3], [-1, 1, 32, 243], [0]],
  [[0, 1, 2], [1, 3, 7], [1.5]],
  [[1, 2, 4, 5], [0, 3, 15, 24], [3]],
].forEach(([nd, dt, xs], idx) => {
  const o = oNiHm(nd, dt, xs[0], false);
  const t = MNO.engines.newtoni({ nodes: nd, values: dt, evalXs: xs });
  cmp('newtoni#' + idx + ' coefs', t.result.coefs, o.coefs);
  cmp('newtoni#' + idx + ' P', t.result.evals[0].y, o.val);
  /* Lagrange y Newton deben dar el MISMO polinomio (unicidad). */
  cmp('newtoni#' + idx + ' = lagrange', t.result.evals[0].y, oLg(nd, dt, xs[0]));
});

console.log('— Hermite (algoritmo corregido) —');
[
  [[1, 1, 1, 1, 4], [0, 1, -0.5, 0.3333, 1.3863], [2]],   /* ln(x): f, f', f''/2!, f'''/3! en 1 y f en 4 */
  [[0, 0, 1, 1], [0, 1, 1, 0], [0.5]],
].forEach(([nd, dt, xs], idx) => {
  const o = oNiHm(nd, dt, xs[0], true);
  const t = MNO.engines.hermite({ nodes: nd, values: dt, evalXs: xs });
  cmp('hermite#' + idx + ' coefs', t.result.coefs, o.coefs);
  cmp('hermite#' + idx + ' P', t.result.evals[0].y, o.val);
});
/* Verificación de fondo: el polinomio debe INTERPOLAR valores y derivadas. */
{
  const t = MNO.engines.hermite({ nodes: [0, 0, 1, 1], values: [0, 1, 1, 0], evalXs: [0.5] });
  const P = t.fns.P;
  const dP = (x) => (P(x + 1e-6) - P(x - 1e-6)) / 2e-6;
  cmp('hermite interpola f(0)', P(0), 0);
  cmp('hermite interpola f(1)', P(1), 1);
  cmp("hermite interpola f'(0)", dP(0), 1, 1e-5);
  cmp("hermite interpola f'(1)", dP(1), 0, 1e-5);
  cmp('hermite P(0.5) cúbica', P(0.5), 0.625);
  const t2 = MNO.engines.hermite({ nodes: [1, 1, 1, 1, 4], values: [0, 1, -0.5, 0.3333, 1.3863], evalXs: [4] });
  cmp('hermite ln: interpola f(4) (el caso que el legacy fallaba)', t2.result.evals[0].y, 1.3863, 1e-6);
}

console.log('\n' + (failCount === 0 ? '✅ PARIDAD TOTAL: ' : '❌ FALLOS: ' + failCount + ' de ') + (pass + failCount) + ' comprobaciones' + (failCount === 0 ? ' en verde' : ''));
process.exit(failCount === 0 ? 0 : 1);
