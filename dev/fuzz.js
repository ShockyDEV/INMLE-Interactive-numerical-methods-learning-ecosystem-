/* Fuzz de robustez: motores y generadores ante entradas límite/basura.
   Regla: NINGUNA excepción sin capturar; los resultados numéricos del estado
   'converged' deben ser finitos. Uso: node dev/fuzz.js */
'use strict';

require('../js/core/num.js');
require('../js/core/expr.js');
require('../js/core/trace.js');
require('../js/core/engines/rootfinding.js');
require('../js/core/engines/linear.js');
require('../js/core/engines/interp.js');
require('../js/registry.js');
require('../js/content/packs/biseccion.js');
require('../js/content/packs/cuerda.js');
require('../js/content/packs/puntofijo.js');
require('../js/content/packs/newton.js');
require('../js/content/packs/secante.js');
require('../js/content/packs/gauss.js');
require('../js/content/packs/jacobi.js');
require('../js/content/packs/seidel.js');
require('../js/content/packs/lagrange.js');
require('../js/content/packs/newtoni.js');
require('../js/content/packs/hermite.js');

const MNO = globalThis.MNO;
let problemas = 0;
function mal(msg) { problemas++; console.log('  ✗', msg); }

function finito(v) { return typeof v === 'number' && isFinite(v); }

function corre(nombre, fn) {
  try {
    const tr = fn();
    if (!tr || !tr.status) { mal(nombre + ': sin traza/status'); return null; }
    if (tr.status === 'converged' && tr.result) {
      const r = tr.result;
      ['root', 'det'].forEach(function (k) {
        if (k in r && r[k] !== undefined && !finito(r[k])) mal(nombre + ': result.' + k + ' no finito (' + r[k] + ') con status converged');
      });
      if (r.X && !r.X.every(finito)) mal(nombre + ': X no finito con status converged → ' + JSON.stringify(r.X));
      if (r.evals && !r.evals.every(function (e) { return finito(e.y); })) mal(nombre + ': evals no finitos con converged');
      if (r.coefs && !r.coefs.every(finito)) mal(nombre + ': coefs no finitos con converged');
    }
    return tr;
  } catch (e) {
    mal(nombre + ' LANZÓ: ' + e.message);
    return null;
  }
}

console.log('— Raíces: entradas límite —');
corre('bis f inválida', () => MNO.engines.biseccion({ f: 'x^^2', a: 0, b: 2, tol: 0.01, maxIter: 50 }));
corre('bis a=b', () => MNO.engines.biseccion({ f: 'x^2-2', a: 1, b: 1, tol: 0.01, maxIter: 50 }));
corre('bis tol=0', () => MNO.engines.biseccion({ f: 'x^2-2', a: 0, b: 2, tol: 0, maxIter: 30 }));
corre('bis tol<0', () => MNO.engines.biseccion({ f: 'x^2-2', a: 0, b: 2, tol: -1, maxIter: 30 }));
corre('bis NaN', () => MNO.engines.biseccion({ f: 'x^2-2', a: NaN, b: 2, tol: 0.01, maxIter: 50 }));
corre('bis maxIter=0', () => MNO.engines.biseccion({ f: 'x^2-2', a: 0, b: 2, tol: 0.01, maxIter: 0 }));
corre('bis f=const 0', () => MNO.engines.biseccion({ f: '0*x', a: -1, b: 1, tol: 0.01, maxIter: 20 }));
corre('cue asíntota', () => MNO.engines.cuerda({ f: '1/x', a: -1, b: 2, tol: 0.001, maxIter: 50 }));
corre('pf g inválida', () => MNO.engines.puntofijo({ g: ')(', x0: 0, tol: 1e-4, maxIter: 30 }));
corre('pf g=x (todo punto fijo)', () => MNO.engines.puntofijo({ g: 'x', x0: 0.7, tol: 1e-4, maxIter: 30 }));
corre('nw df=0 const', () => MNO.engines.newton({ f: 'x^2-2', df: '0*x', x0: 1, tol: 1e-6, maxIter: 20 }));
corre('nw f con NaN dominio', () => MNO.engines.newton({ f: 'sqrt(x) - 2', df: '1/(2*sqrt(x))', x0: -4, tol: 1e-6, maxIter: 20 }));
corre('sec x0=x1', () => MNO.engines.secante({ f: 'x^2-2', x0: 1, x1: 1, tol: 1e-6, maxIter: 20 }));

console.log('— Sistemas: entradas límite —');
corre('gauss no cuadrada', () => MNO.engines.gauss({ A: [[1, 2, 3], [4, 5, 6]], B: [1, 2] }));
corre('gauss B corta', () => MNO.engines.gauss({ A: [[1, 2], [3, 4]], B: [1] }));
corre('gauss 1×1', () => MNO.engines.gauss({ A: [[5]], B: [10] }));
corre('gauss 1×1 singular', () => MNO.engines.gauss({ A: [[0]], B: [10] }));
corre('gauss singular (último pivote 0)', () => MNO.engines.gauss({ A: [[1, 1], [1, 1]], B: [2, 3] }));
corre('gauss singular 3×3', () => MNO.engines.gauss({ A: [[1, 2, 3], [2, 4, 6], [1, 0, 1]], B: [1, 2, 3] }));
corre('jacobi X0 corto', () => MNO.engines.jacobi({ A: [[4, 1], [1, 3]], B: [1, 2], X0: [0], tol: 1e-3, maxIter: 20 }));
corre('jacobi diag 0', () => MNO.engines.jacobi({ A: [[0, 1], [1, 1]], B: [1, 2], X0: [0, 0], tol: 1e-3, maxIter: 20 }));
corre('seidel 1×1', () => MNO.engines.seidel({ A: [[4]], B: [8], X0: [0], tol: 1e-4, maxIter: 20 }));

console.log('— Interpolación: entradas límite —');
corre('lagrange 1 nodo', () => MNO.engines.lagrange({ nodes: [2], values: [5], evalXs: [3] }));
corre('lagrange nodos repetidos', () => MNO.engines.lagrange({ nodes: [1, 1, 2], values: [1, 2, 3], evalXs: [0] }));
corre('lagrange longitudes distintas', () => MNO.engines.lagrange({ nodes: [1, 2], values: [1], evalXs: [] }));
corre('newtoni 1 nodo', () => MNO.engines.newtoni({ nodes: [2], values: [5], evalXs: [1] }));
corre('hermite solo valores (sin repetidos)', () => MNO.engines.hermite({ nodes: [0, 1, 2], values: [1, 2, 5], evalXs: [1.5] }));
corre('hermite repetidos NO contiguos', () => MNO.engines.hermite({ nodes: [0, 1, 0], values: [1, 2, 3], evalXs: [0.5] }));
corre('hermite todo repetido (Taylor)', () => MNO.engines.hermite({ nodes: [1, 1, 1], values: [0, 1, -0.5], evalXs: [2] }));

console.log('— Generadores de Practicar ×40 —');
const U = {
  rand: (a, b) => a + Math.random() * (b - a),
  randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  elegir: (arr) => arr[Math.floor(Math.random() * arr.length)],
  baraja: (arr) => arr.slice().sort(() => Math.random() - 0.5),
};
Object.keys(MNO.content.quizzes).forEach(function (mid) {
  const gens = MNO.content.quizzes[mid].generadores;
  gens.forEach(function (g, gi) {
    for (let rep = 0; rep < 40; rep++) {
      try {
        const q = g(U);
        if (q.tipo === 'numeric' && !finito(q.respuesta)) mal(mid + ' gen ' + gi + ': respuesta no finita');
        if (q.tipo === 'point-x' && !finito(q.puntoX)) mal(mid + ' gen ' + gi + ': puntoX no finito');
        if (q.tipo === 'choice' && (q.correcta < 0 || q.correcta >= q.opciones.length)) mal(mid + ' gen ' + gi + ': correcta fuera de rango');
      } catch (e) {
        mal(mid + ' gen ' + gi + ' rep ' + rep + ' LANZÓ: ' + e.message);
        break;
      }
    }
  });
});

console.log('— Cobertura de contenido —');
['theory', 'quizzes', 'challenges'].forEach(function (tipo) {
  const claves = Object.keys(MNO.content[tipo] || {});
  const metodos = Object.keys(MNO.registry).filter(function (k) { return k !== 'calc'; });
  metodos.forEach(function (m) {
    if (claves.indexOf(m) < 0) mal('falta content.' + tipo + '.' + m);
  });
});

console.log('\n' + (problemas === 0 ? '✅ FUZZ LIMPIO' : '❌ ' + problemas + ' problemas'));
process.exit(problemas ? 1 : 0);
