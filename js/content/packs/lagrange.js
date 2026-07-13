/* Pack de contenido: INTERPOLACIÓN DE LAGRANGE (teoría + Practicar + Retos). */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.lagrange = {
    secciones: [
      {
        titulo: 'La idea', icono: '💡',
        lineas: [
          'Tienes $n$ puntos medidos y quieres UNA curva suave que pase EXACTAMENTE por todos. Lagrange la construye con un truco de orfebrería: fabrica $n$ polinomios base $L_i$, cada uno diseñado para valer **1 en su nodo y 0 en todos los demás**.',
          'Con esas piezas, el polinomio final es una suma directa: $P(x) = \\sum f(x_i)\\, L_i(x)$. Cada sumando «iza» la curva hasta su punto sin molestar a los demás nodos — en Explorar puedes ver el APORTE de cada término por separado.',
        ],
      },
      {
        titulo: 'Formulación', icono: '🧮',
        lineas: [
          '$L_i(x) = \\prod_{j \\ne i} \\dfrac{x - x_j}{x_i - x_j}$, $\\qquad P(x) = \\sum_{i} f(x_i)\\, L_i(x)$',
          'El numerador se anula en todos los nodos ajenos; el denominador normaliza para que $L_i(x_i) = 1$.',
          '**Unicidad**: existe UN SOLO polinomio de grado $\\le n-1$ por $n$ puntos (de abscisas distintas). Lagrange, Newton o quien sea: distinta receta, mismo plato.',
        ],
      },
      {
        titulo: 'El error', icono: '📈',
        lineas: [
          '$f(x) - P(x) = \\dfrac{f^{(n+1)}(\\xi)}{(n+1)!}\\, \\prod_{i}(x - x_i)$ para algún $\\xi$ del intervalo.',
          'Dos palancas: la suavidad de $f$ (sus derivadas altas) y DÓNDE colocas los nodos (el producto $\\prod(x - x_i)$).',
          'La trampa célebre: con nodos EQUIESPACIADOS ese producto explota cerca de los bordes al crecer $n$ — es el **fenómeno de Runge** (preset 🌊). El antídoto: amontonar nodos en los extremos (nodos de Chebyshev).',
          'Y extrapolar (evaluar FUERA del rango de los nodos) es deporte de riesgo: ahí el producto crece sin nada que lo frene.',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '⚖️',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Fórmula explícita y elegante: perfecta para demostraciones y teoría.',
              'Pasa EXACTAMENTE por los datos.',
              'Base de fórmulas de integración (Newton-Cotes) y derivación numérica.',
            ],
            contras: [
              'Añadir UN nodo obliga a rehacer TODOS los $L_i$ (Newton lo arregla).',
              'Runge: más nodos equiespaciados puede EMPEORAR el ajuste.',
              'Grado alto = polinomio nervioso: para muchos datos, mejor splines.',
              'Extrapolación peligrosa.',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '🚫',
        lineas: [
          { tipo: 'error', texto: 'Creer que «más nodos siempre mejor»: con nodos equiespaciados y funciones tipo $\\frac{1}{1+25x^2}$, subir $n$ AGRAVA las oscilaciones en los bordes (preset «🌊 Fenómeno de Runge»).' },
          { tipo: 'error', texto: 'Confundir interpolar con ajustar: el polinomio pasa por los puntos EXACTOS. Si tus datos tienen ruido, interpolar el ruido es un pésimo plan (para eso está mínimos cuadrados).' },
          { tipo: 'error', texto: 'Repetir un nodo: dos $x_i$ iguales anulan un denominador. Si tienes valor Y derivada en un punto, el método correcto es Hermite.' },
          { tipo: 'error', texto: 'Usar $P$ fuera del intervalo de los datos y fiarse: la fórmula del error no protege la extrapolación.' },
        ],
      },
      {
        titulo: '¿Cuándo usarlo?', icono: '🧭',
        lineas: [
          'Pocos puntos fiables (sin ruido) y grado bajo: perfecto. También como pieza teórica para derivar reglas de integración.',
          '¿Vas a AÑADIR nodos sobre la marcha? → forma de **Newton**. ¿Tienes derivadas? → **Hermite**. ¿Muchos puntos? → splines (grado bajo a trozos, cero Runge).',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  NS.content.quizzes.lagrange = {
    generadores: [

      /* 1 · choice: la propiedad que lo sostiene todo */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = ['$L_i(x_i) = 1$ y $L_i(x_j) = 0$ en los demás nodos', '$L_i(x_i) = 0$ y $L_i(x_j) = 1$ en los demás', 'Depende de los valores $f(x_i)$'];
        return {
          tipo: 'choice', tema: 'propiedad-base',
          enunciado: '¿Cuánto vale el polinomio base $L_i$ en los nodos?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'Están diseñados como interruptores: encendido en SU nodo, apagado en el resto.',
          solucion: '$L_i(x_i) = 1$, $L_i(x_j) = 0$ ($j \\ne i$). Por eso $P(x_k) = \\sum f(x_i) L_i(x_k) = f(x_k)$: en cada nodo solo «sobrevive» su propio término. Y nota: los $L_i$ NO dependen de los valores medidos, solo de los nodos.',
        };
      },

      /* 2 · numeric: el grado */
      function (U) {
        const n = U.randInt(3, 8);
        return {
          tipo: 'numeric', tema: 'grado',
          enunciado: 'Con $' + n + '$ nodos (de abscisas distintas), el polinomio interpolador tiene grado a lo sumo…',
          traza: null,
          respuesta: n - 1, tol: 0.4,
          pista: '2 puntos → recta (grado 1); 3 puntos → parábola (grado 2)…',
          solucion: 'Grado $\\le ' + (n - 1) + '$: siempre uno menos que el número de puntos. «A lo sumo» porque puede degenerar (tres puntos alineados dan una recta).',
        };
      },

      /* 3 · numeric: evalúa una base */
      function (U) {
        const xs = U.rand(0.3, 1.7);
        const xr = NS.num.R(xs, 2);
        const L1 = (xr - 0) * (xr - 2) / ((1 - 0) * (1 - 2));
        return {
          tipo: 'numeric', tema: 'evaluacion-base',
          enunciado: 'Nodos $\\{0, 1, 2\\}$. Calcula $L_1(' + xr + ')$ — la base del nodo central — con 3 decimales.',
          traza: null,
          respuesta: L1, tol: 0.005,
          pista: '$L_1(x) = \\dfrac{(x - 0)(x - 2)}{(1 - 0)(1 - 2)}$ — el numerador salta los nodos ajenos, el denominador es lo mismo evaluado en $x_1 = 1$.',
          solucion: '$L_1(' + xr + ') = \\dfrac{(' + xr + ')(' + tex(xr - 2, 2) + ')}{-1} = ' + tex(L1, 5) + '$.',
        };
      },

      /* 4 · choice: Runge */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'Falso: con nodos equiespaciados pueden aparecer oscilaciones brutales en los bordes (fenómeno de Runge)',
          'Verdadero: más información siempre mejora la aproximación',
          'Verdadero, pero solo a partir de 10 nodos',
        ];
        return {
          tipo: 'choice', tema: 'runge',
          enunciado: '«Cuantos más nodos equiespaciados use, mejor aproximará el polinomio a la función.» ¿Verdadero o falso?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'Hay un contraejemplo con nombre propio y forma de campana: $\\frac{1}{1+25x^2}$…',
          solucion: 'Falso. Para $f(x) = \\frac{1}{1+25x^2}$ en $[-1,1]$, subir $n$ con nodos equiespaciados hace crecer el error en los bordes sin límite. La solución no es «más nodos» sino «mejores nodos» (Chebyshev) o splines. Míralo en vivo con el preset 🌊.',
        };
      },

      /* 5 · choice: unicidad */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'Imposible: el polinomio interpolador de grado $\\le n-1$ es ÚNICO — alguno se ha equivocado',
          'Posible: cada método construye un polinomio diferente',
          'Posible solo si los datos tienen ruido',
        ];
        return {
          tipo: 'choice', tema: 'unicidad',
          enunciado: 'Dos estudiantes interpolan LOS MISMOS 4 puntos: una por Lagrange y otro por Newton (diferencias divididas). Obtienen polinomios DISTINTOS. ¿Es posible?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: '¿Cuántos polinomios de grado ≤ 3 pueden pasar por 4 puntos dados?',
          solucion: 'Si dos polinomios de grado $\\le 3$ coinciden en 4 puntos, su diferencia (grado $\\le 3$) tiene 4 raíces → es el polinomio cero. Lagrange y Newton son dos ENVOLTORIOS del mismo e irrepetible polinomio: si no coinciden, hay que revisar cuentas.',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  /* Deriva los valores de los nodos: el estudiante solo coloca las x. */
  function preparaCon(f) {
    return function (raw) {
      const nodes = NS.num.P(raw.nodes).filter(function (v) { return isFinite(v); });
      raw.values = nodes.map(function (x) { return NS.num.R(f(x), 6); }).join(' ');
      raw.nodes = nodes.join(' ');
      return raw;
    };
  }
  function errMax(trace, f, lo, hi) {
    let e = 0;
    for (let i = 0; i <= 300; i++) {
      const x = lo + (hi - lo) * i / 300;
      const v = Math.abs(trace.fns.P(x) - f(x));
      if (isFinite(v)) e = Math.max(e, v);
    }
    return e;
  }
  const RUNGE = function (x) { return 1 / (1 + 25 * x * x); };
  const SIN3 = function (x) { return Math.sin(3 * x); };

  NS.content.challenges.lagrange = [
    {
      id: 'runge', nombre: 'Caza al Runge', icono: '🌊',
      tipo: 'param-goal',
      desc: 'Tienes 7 nodos para domar a 1/(1+25x²) en [−1,1]. Los equiespaciados fracasan: descubre TÚ dónde colocarlos.',
      enunciado: 'La función $f(x) = \\dfrac{1}{1 + 25x^2}$ parece mansa… pero interpola con 7 nodos equiespaciados en $[-1, 1]$ y verás las olas en los bordes. **Tuyos son los 7 nodos: colócalos donde quieras** (los valores $f(x_i)$ se calculan solos). Se puntúa el ERROR MÁXIMO en todo $[-1,1]$: bájalo todo lo que puedas.',
      libres: ['nodes'],
      fijos: { evalXs: '0' },
      inicial: { nodes: '-1 -0.667 -0.333 0 0.333 0.667 1' },
      prepara: preparaCon(RUNGE),
      intentosMax: 4,
      plot: true,
      evalua: function (trace) {
        if (trace.status !== 'converged') return { puntos: 0, msg: '⛔ ' + (trace.statusMsg || 'Revisa los nodos (deben ser distintos).') };
        const e = errMax(trace, RUNGE, -1, 1);
        const msg = 'Error máximo en $[-1,1]$: $' + tex(e, 4) + '$.';
        if (e < 0.30) return { puntos: 100, msg: msg + ' 🏆 **¡Acabas de redescubrir los nodos de CHEBYSHEV!** Amontonarlos hacia los bordes doma el producto $\\prod(x - x_i)$ justo donde muerde. (Equiespaciados: 0.617.)' };
        if (e < 0.45) return { puntos: 75, msg: msg + ' Gran mejora sobre los equiespaciados (0.617). Insinúa aún más los bordes…' };
        if (e < 0.6) return { puntos: 50, msg: msg + ' Ya le ganas al reparto uniforme (0.617). Los extremos piden más compañía.' };
        return { puntos: 20, msg: msg + ' Las olas siguen ahí. Idea: ¿dónde hace más daño el producto $\\prod(x - x_i)$… y qué nodos lo frenan?' };
      },
    },
    {
      id: 'francotirador', nombre: 'Francotirador de curvas', icono: '🎯',
      tipo: 'param-goal',
      desc: 'Caza sin(3x) en [0, 2] con solo 5 nodos: cada posición cuenta.',
      enunciado: 'Objetivo: $f(x) = \\sin(3x)$ en $[0, 2]$ — una onda y media. Tienes **5 nodos** (los valores se miden solos). Minimiza el error máximo en $[0, 2]$.',
      libres: ['nodes'],
      fijos: { evalXs: '1' },
      inicial: { nodes: '0 0.5 1 1.5 2' },
      prepara: preparaCon(SIN3),
      intentosMax: 4,
      plot: true,
      evalua: function (trace) {
        if (trace.status !== 'converged') return { puntos: 0, msg: '⛔ ' + (trace.statusMsg || 'Revisa los nodos (deben ser distintos).') };
        const e = errMax(trace, SIN3, 0, 2);
        const msg = 'Error máximo en $[0,2]$: $' + tex(e, 4) + '$.';
        if (e < 0.105) return { puntos: 100, msg: msg + ' 🏆 Disparo perfecto: reparto casi óptimo (Chebyshev ronda 0.096).' };
        if (e < 0.13) return { puntos: 75, msg: msg + ' Muy fino: por debajo ya solo queda afinar hacia los bordes.' };
        if (e < 0.158) return { puntos: 50, msg: msg + ' Empatas con el reparto uniforme (0.158): se puede bajar más.' };
        return { puntos: 20, msg: msg + ' Peor que los equiespaciados (0.158): alguna zona de la onda quedó sin vigilancia.' };
      },
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
