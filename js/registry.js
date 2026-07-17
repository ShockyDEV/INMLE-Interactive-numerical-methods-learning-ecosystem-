/* MNO.registry — catálogo de los métodos: metadatos, parámetros, presets
   pedagógicos y configuración de vista/arrastre. Fuente única de verdad. */
(function (NS) {
  'use strict';

  /* Valores del preset de Runge: f(x) = 1/(1+25x²) en nodos equiespaciados. */
  function rungeNodes(n) {
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(Math.round((-1 + 2 * i / (n - 1)) * 1000) / 1000);
    return xs;
  }
  function rungeVals(xs) {
    return xs.map(function (x) { return Math.round(1 / (1 + 25 * x * x) * 10000) / 10000; });
  }
  const RN = rungeNodes(7), RV = rungeVals(RN);

  NS.registry = {

    biseccion: {
      id: 'biseccion', nombre: 'Bisección', icono: '', familia: 'raices',
      engine: 'biseccion', vista: 'plot', orden: 1,
      desc: 'Parte el intervalo por la mitad una y otra vez. Lenta pero infalible.',
      params: [
        { id: 'f', tipo: 'expr', label: 'f(x)', def: 'x^2 - 2', hint: 'sin cos tan exp log sqrt abs… — prueba 2x, -x^2, e^x' },
        { id: 'a', tipo: 'num', label: 'a', def: '0' },
        { id: 'b', tipo: 'num', label: 'b', def: '2' },
        { id: 'tol', tipo: 'num', label: 'Tolerancia', def: '0.01' },
        { id: 'maxIter', tipo: 'int', label: 'Máx. iter', def: '50' },
      ],
      drag: { pa: 'a', pb: 'b' },
      presets: [
        { nombre: '√2 (clásico)', v: { f: 'x^2 - 2', a: '0', b: '2', tol: '0.01' } },
        { nombre: 'cos(x) = x', v: { f: 'cos(x) - x', a: '0', b: '1', tol: '0.0001' } },
        { nombre: 'Sin cambio de signo (falla)', v: { f: 'x^2 + 1', a: '-1', b: '1', tol: '0.01' }, nota: 'Bolzano no aplica: f > 0 en todo el intervalo.' },
        { nombre: 'Raíz doble (invisible)', v: { f: '(x - 1)^2', a: '0', b: '2', tol: '0.001' }, nota: 'La parábola toca el eje sin cruzarlo: no hay cambio de signo.' },
      ],
    },

    cuerda: {
      id: 'cuerda', nombre: 'Cuerda (regula falsi)', icono: '', familia: 'raices',
      engine: 'cuerda', vista: 'plot', orden: 2,
      desc: 'Como bisección, pero corta por la cuerda en vez del punto medio.',
      params: [
        { id: 'f', tipo: 'expr', label: 'f(x)', def: 'x^2 - 4' },
        { id: 'a', tipo: 'num', label: 'a', def: '0' },
        { id: 'b', tipo: 'num', label: 'b', def: '3' },
        { id: 'tol', tipo: 'num', label: 'Tolerancia', def: '0.01' },
        { id: 'maxIter', tipo: 'int', label: 'Máx. iter', def: '50' },
      ],
      drag: { pa: 'a', pb: 'b' },
      presets: [
        { nombre: 'x² − 4 (clásico)', v: { f: 'x^2 - 4', a: '0', b: '3', tol: '0.01' } },
        { nombre: 'Extremo perezoso', v: { f: 'x^3 - 2', a: '0', b: '2', tol: '0.0001' }, nota: 'En funciones convexas un extremo se queda clavado.' },
        { nombre: 'cos(x) = x', v: { f: 'cos(x) - x', a: '0', b: '1', tol: '0.0001' } },
      ],
    },

    puntofijo: {
      id: 'puntofijo', nombre: 'Punto Fijo', icono: '', familia: 'raices',
      engine: 'puntofijo', vista: 'cobweb', orden: 3,
      desc: 'Itera x = g(x) y observa la telaraña: converge si |g′| < 1.',
      params: [
        { id: 'g', tipo: 'expr', label: 'g(x)', def: 'cos(x)', hint: 'g tal que g(β) = β' },
        { id: 'x0', tipo: 'num', label: 'x₀', def: '0' },
        { id: 'tol', tipo: 'num', label: 'Tolerancia', def: '0.0001' },
        { id: 'maxIter', tipo: 'int', label: 'Máx. iter', def: '50' },
      ],
      drag: { px: 'x0' },
      presets: [
        { nombre: 'Espiral: cos(x)', v: { g: 'cos(x)', x0: '0', tol: '0.0001' }, nota: "g'(β) < 0 → la telaraña gira en espiral." },
        { nombre: 'Escalera: √(x+2)', v: { g: 'sqrt(x + 2)', x0: '0', tol: '0.00001' }, nota: "0 < g'(β) < 1 → escalera directa." },
        { nombre: 'Herón para √2', v: { g: '(x + 2/x)/2', x0: '1', tol: '0.0000001' }, nota: "g'(β) = 0 → convergencia rapidísima (¡es Newton disfrazado!)." },
        { nombre: 'Cuenca: x² desde 0.9', v: { g: 'x^2', x0: '0.9', tol: '0.0001' }, nota: 'Converge a 0. Prueba luego con x₀ = 1.1…' },
        { nombre: 'Diverge: x² desde 1.1', v: { g: 'x^2', x0: '1.1', tol: '0.0001' }, nota: "El punto fijo 1 tiene g'(1) = 2 > 1: repele." },
      ],
    },

    newton: {
      id: 'newton', nombre: 'Newton–Raphson', icono: '', familia: 'raices',
      engine: 'newton', vista: 'plot', orden: 4,
      desc: 'Sigue la tangente. Convergencia cuadrática: los decimales se duplican.',
      params: [
        { id: 'f', tipo: 'expr', label: 'f(x)', def: 'exp(x) + x' },
        { id: 'df', tipo: 'expr', label: "f'(x)", def: 'exp(x) + 1', hint: 'la app avisa si no coincide con la derivada numérica' },
        { id: 'x0', tipo: 'num', label: 'x₀', def: '-1' },
        { id: 'tol', tipo: 'num', label: 'Tolerancia', def: '0.0001' },
        { id: 'maxIter', tipo: 'int', label: 'Máx. iter', def: '50' },
      ],
      drag: { px: 'x0' },
      presets: [
        { nombre: 'eˣ + x (clásico)', v: { f: 'exp(x) + x', df: 'exp(x) + 1', x0: '-1', tol: '0.0001' } },
        { nombre: '√2 en 5 pasos', v: { f: 'x^2 - 2', df: '2x', x0: '1', tol: '0.0000000001' }, nota: 'Mira cómo se duplican los dígitos verdes.' },
        { nombre: 'Ciclo infinito', v: { f: 'x^3 - 2x + 2', df: '3x^2 - 2', x0: '0', tol: '0.0001' }, nota: 'x salta 0 → 1 → 0 → 1… para siempre.' },
        { nombre: 'Tangente casi horizontal', v: { f: 'x^3 - 2x + 2', df: '3x^2 - 2', x0: '0.8', tol: '0.0001' }, nota: 'Cerca del mínimo local la tangente dispara lejos.' },
        { nombre: 'atan(x) diverge', v: { f: 'atan(x)', df: '1/(1 + x^2)', x0: '1.5', tol: '0.0001' }, nota: 'Con x₀ grande, cada tangente cae más lejos.' },
        { nombre: 'Derivada mal escrita', v: { f: 'x^2 - 2', df: 'x', x0: '1', tol: '0.0000001' }, nota: 'La app la detecta… y Newton pierde su magia (converge lento).' },
      ],
    },

    secante: {
      id: 'secante', nombre: 'Secante', icono: '', familia: 'raices',
      engine: 'secante', vista: 'plot', orden: 5,
      desc: 'Newton sin derivada: aproxima la tangente con los dos últimos puntos.',
      params: [
        { id: 'f', tipo: 'expr', label: 'f(x)', def: 'exp(x) + x' },
        { id: 'x0', tipo: 'num', label: 'x₀', def: '-1' },
        { id: 'x1', tipo: 'num', label: 'x₁', def: '-0.9' },
        { id: 'tol', tipo: 'num', label: 'Tolerancia', def: '0.0001' },
        { id: 'maxIter', tipo: 'int', label: 'Máx. iter', def: '50' },
      ],
      drag: { p0: 'x0', p1: 'x1' },
      presets: [
        { nombre: 'eˣ + x (clásico)', v: { f: 'exp(x) + x', x0: '-1', x1: '-0.9', tol: '0.0001' } },
        { nombre: '√2', v: { f: 'x^2 - 2', x0: '1', x1: '2', tol: '0.0000001' } },
        { nombre: 'Orden φ ≈ 1.618', v: { f: 'x^3 - x - 2', x0: '1', x1: '2', tol: '0.0000000001' }, nota: 'Ni lineal ni cuadrático: el número áureo.' },
      ],
    },

    gauss: {
      id: 'gauss', nombre: 'Eliminación Gaussiana', icono: '', familia: 'sistemas',
      engine: 'gauss', vista: 'matrix', orden: 6,
      desc: 'Triangula el sistema con operaciones de fila. De regalo: L, U y det(A).',
      params: [
        { id: 'A', tipo: 'matrix', label: 'Matriz A', def: '-2 -2 2\n2 -4 3\n-1 2 -3', hint: 'filas separadas por Enter' },
        { id: 'B', tipo: 'nums', label: 'Vector B', def: '10 2 1' },
      ],
      presets: [
        { nombre: 'Ejemplo de clase (3×3)', v: { A: '-2 -2 2\n2 -4 3\n-1 2 -3', B: '10 2 1' } },
        { nombre: 'Clásico x=2, y=3, z=−1', v: { A: '2 1 -1\n-3 -1 2\n-2 1 2', B: '8 -11 -3' } },
        { nombre: 'Pivote nulo (falla)', v: { A: '0 1\n1 1', B: '1 2' }, nota: 'a₁₁ = 0: sin intercambiar filas no se puede.' },
        { nombre: '4×4', v: { A: '1 2 3 4\n2 3 4 1\n3 4 1 2\n4 1 2 3', B: '10 10 10 10' } },
      ],
    },

    jacobi: {
      id: 'jacobi', nombre: 'Jacobi', icono: '', familia: 'sistemas',
      engine: 'jacobi', vista: 'linear-iter', orden: 7,
      desc: 'Iterativo: todas las variables saltan a la vez usando el vector anterior.',
      params: [
        { id: 'A', tipo: 'matrix', label: 'Matriz A', def: '-4 1 -1\n-1 -5 1\n2 -2 5' },
        { id: 'B', tipo: 'nums', label: 'Vector B', def: '2 -5 10' },
        { id: 'X0', tipo: 'nums', label: 'X⁽⁰⁾', def: '0 0 0' },
        { id: 'tol', tipo: 'num', label: 'Tolerancia', def: '0.001' },
        { id: 'maxIter', tipo: 'int', label: 'Máx. iter', def: '30' },
      ],
      presets: [
        { nombre: 'Ejemplo de clase (3×3)', v: { A: '-4 1 -1\n-1 -5 1\n2 -2 5', B: '2 -5 10', X0: '0 0 0', tol: '0.001' } },
        { nombre: '2×2 en el plano (dos rectas)', v: { A: '3 1\n1 2', B: '5 5', X0: '0 0', tol: '0.0001' }, nota: 'Mira al punto saltar en diagonal hacia el corte.' },
        { nombre: 'Diverge (mal ordenado)', v: { A: '1 3\n4 1', B: '5 6', X0: '0 0', tol: '0.001' }, nota: 'Sin dominancia diagonal… ¿y si intercambias las filas?' },
      ],
    },

    seidel: {
      id: 'seidel', nombre: 'Gauss–Seidel', icono: '', familia: 'sistemas',
      engine: 'seidel', vista: 'linear-iter', orden: 8,
      desc: 'Como Jacobi pero usa cada valor recién calculado: la escalera es más rápida.',
      params: [
        { id: 'A', tipo: 'matrix', label: 'Matriz A', def: '-4 1 -1\n-1 -5 1\n2 -2 5' },
        { id: 'B', tipo: 'nums', label: 'Vector B', def: '2 -5 10' },
        { id: 'X0', tipo: 'nums', label: 'X⁽⁰⁾', def: '0 0 0' },
        { id: 'tol', tipo: 'num', label: 'Tolerancia', def: '0.001' },
        { id: 'maxIter', tipo: 'int', label: 'Máx. iter', def: '30' },
      ],
      presets: [
        { nombre: 'Ejemplo de clase (3×3)', v: { A: '-4 1 -1\n-1 -5 1\n2 -2 5', B: '2 -5 10', X0: '0 0 0', tol: '0.001' } },
        { nombre: '2×2 en el plano (escalera)', v: { A: '3 1\n1 2', B: '5 5', X0: '0 0', tol: '0.0001' }, nota: 'Compárala con el salto diagonal de Jacobi.' },
        { nombre: 'Diverge (mal ordenado)', v: { A: '1 3\n4 1', B: '5 6', X0: '0 0', tol: '0.001' } },
      ],
    },

    lagrange: {
      id: 'lagrange', nombre: 'Lagrange', icono: '', familia: 'interpolacion',
      engine: 'lagrange', vista: 'interp', orden: 9,
      desc: 'Un polinomio que pasa exactamente por todos tus puntos.',
      params: [
        { id: 'nodes', tipo: 'nums', label: 'Nodos x', def: '-1 1 2 3' },
        { id: 'values', tipo: 'nums', label: 'f(x)', def: '-1 1 32 243' },
        { id: 'evalXs', tipo: 'nums', label: 'Evaluar en x*', def: '0' },
      ],
      dragNodes: true,
      presets: [
        { nombre: 'Ejemplo de clase', v: { nodes: '-1 1 2 3', values: '-1 1 32 243', evalXs: '0' } },
        { nombre: 'Fenómeno de Runge (7 nodos)', v: { nodes: RN.join(' '), values: RV.join(' '), evalXs: '0.95' }, nota: 'Nodos equiespaciados en 1/(1+25x²): mira los bordes oscilar.' },
        { nombre: 'Parábola por 3 puntos', v: { nodes: '0 1 2', values: '1 3 7', evalXs: '1.5' } },
      ],
    },

    newtoni: {
      id: 'newtoni', nombre: 'Newton (interp.)', icono: '', familia: 'interpolacion',
      engine: 'newtoni', vista: 'interp', orden: 10,
      desc: 'El mismo polinomio, construido por capas con diferencias divididas.',
      params: [
        { id: 'nodes', tipo: 'nums', label: 'Nodos x', def: '-1 1 2 3' },
        { id: 'values', tipo: 'nums', label: 'f(x)', def: '-1 1 32 243' },
        { id: 'evalXs', tipo: 'nums', label: 'Evaluar en x*', def: '0' },
      ],
      dragNodes: true,
      presets: [
        { nombre: 'Ejemplo de clase', v: { nodes: '-1 1 2 3', values: '-1 1 32 243', evalXs: '0' } },
        { nombre: 'Runge (7 nodos)', v: { nodes: RN.join(' '), values: RV.join(' '), evalXs: '0.95' } },
        { nombre: 'Grado oculto 2', v: { nodes: '0 1 2 3 4', values: '1 2 5 10 17', evalXs: '2.5' }, nota: 'Una columna de la tabla se hace cero: el dato es un polinomio de grado 2.' },
      ],
    },

    hermite: {
      id: 'hermite', nombre: 'Hermite', icono: '', familia: 'interpolacion',
      engine: 'hermite', vista: 'interp', orden: 11,
      desc: 'Interpola valores Y derivadas: la curva abraza a la función.',
      params: [
        { id: 'nodes', tipo: 'nums', label: 'Nodos expandidos', def: '1 1 1 1 4', hint: 'repite cada nodo según sus datos: f, f′, f″/2!…' },
        { id: 'values', tipo: 'nums', label: 'Datos (f, f′/1!, f″/2!…)', def: '0 1 -0.5 0.3333 1.3863' },
        { id: 'evalXs', tipo: 'nums', label: 'Evaluar en x*', def: '2' },
      ],
      presets: [
        { nombre: 'ln(x) con 3 derivadas', v: { nodes: '1 1 1 1 4', values: '0 1 -0.5 0.3333 1.3863', evalXs: '2' } },
        { nombre: 'Cúbica con pendientes', v: { nodes: '0 0 1 1', values: '0 1 1 0', evalXs: '0.5' }, nota: 'Pasa por (0,0) y (1,1) con pendientes 1 y 0.' },
      ],
    },

    calc: {
      id: 'calc', nombre: 'Laboratorio f(x)', icono: '', familia: 'extra',
      engine: null, vista: 'calc', orden: 12,
      desc: 'Evalúa expresiones y funciones en una lista de puntos.',
      params: [],
      presets: [],
    },
  };

  /* Familias del temario. */
  NS.familias = [
    { id: 'raices', nombre: 'Raíces de ecuaciones', desc: 'resolver f(x) = 0', metodos: ['biseccion', 'cuerda', 'puntofijo', 'newton', 'secante'] },
    { id: 'sistemas', nombre: 'Sistemas lineales', desc: 'resolver A·X = B', metodos: ['gauss', 'jacobi', 'seidel'] },
    { id: 'interpolacion', nombre: 'Interpolación', desc: 'una curva por tus puntos', metodos: ['lagrange', 'newtoni', 'hermite'] },
  ];

  /* Posición curricular de un método: {unidad: '01', num: '1.4', familia}. */
  NS.numeroDe = function (mid) {
    for (let f = 0; f < NS.familias.length; f++) {
      const i = NS.familias[f].metodos.indexOf(mid);
      if (i >= 0) {
        return { unidad: '0' + (f + 1), num: (f + 1) + '.' + (i + 1), familia: NS.familias[f].nombre };
      }
    }
    return { unidad: '—', num: '', familia: '' };
  };
})(globalThis.MNO = globalThis.MNO || {});
