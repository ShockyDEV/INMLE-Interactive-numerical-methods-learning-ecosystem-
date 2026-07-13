/* Pack de contenido: INTERPOLACIÓN DE NEWTON — diferencias divididas. */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.newtoni = {
    secciones: [
      {
        titulo: 'La idea', icono: '💡',
        lineas: [
          'Es EL MISMO polinomio que Lagrange (unicidad obliga), pero construido como una cebolla: **capa a capa**. Empiezas con una constante que clava el primer punto, sumas un término lineal que clava el segundo sin estropear el primero, luego uno cuadrático… ',
          'La joya práctica: si llega un dato NUEVO, no se rehace nada — se añade UNA capa más. Lagrange, en cambio, obliga a demoler y reconstruir todos sus $L_i$.',
        ],
      },
      {
        titulo: 'Formulación', icono: '🧮',
        lineas: [
          '$P(x) = c_0 + c_1(x - x_0) + c_2(x - x_0)(x - x_1) + \\cdots$',
          'Los coeficientes son **diferencias divididas**: $c_j = f[x_0, \\ldots, x_j]$, calculadas en tabla triangular con la recurrencia $f[x_i, \\ldots, x_{i+j}] = \\dfrac{f[x_{i+1}, \\ldots, x_{i+j}] - f[x_i, \\ldots, x_{i+j-1}]}{x_{i+j} - x_i}$.',
          'Cada celda se fabrica con sus dos «padres» de la columna anterior, y el denominador une los nodos EXTREMOS del tramo (error clásico: usar los adyacentes).',
          'Para evaluar: anidamiento tipo Horner — barato y estable.',
        ],
      },
      {
        titulo: 'El error', icono: '📈',
        lineas: [
          'Mismo error que Lagrange (¡es el mismo polinomio!): $f(x) - P(x) = \\frac{f^{(n+1)}(\\xi)}{(n+1)!} \\prod (x - x_i)$.',
          'Bonus teórico precioso: $f[x_0, \\ldots, x_k] = \\frac{f^{(k)}(\\xi)}{k!}$ para algún $\\xi$. Las diferencias divididas son derivadas de incógnito.',
          'Consecuencia detectivesca: si los datos vienen de un polinomio de grado $g$, la columna de orden $g+1$ de la tabla se hace **exactamente cero** — la tabla te confiesa el grado (reto «Grado misterioso»).',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '⚖️',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Añadir un nodo cuesta UNA diagonal nueva y un término más: nada se recalcula.',
              'Evaluación eficiente y estable (anidada, tipo Horner).',
              'La tabla revela estructura: detecta grado, prepara Hermite.',
              'Mismo polinomio que Lagrange con mejor ergonomía de cálculo.',
            ],
            contras: [
              'Sigue siendo interpolación polinómica global: Runge incluido.',
              'La tabla hay que organizarla con cuidado (errores de índice a mansalva).',
              'Con muchos puntos, mejor splines igualmente.',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '🚫',
        lineas: [
          { tipo: 'error', texto: 'Denominador equivocado: en $f[x_i, \\ldots, x_{i+j}]$ se dividen los nodos EXTREMOS ($x_{i+j} - x_i$), no los vecinos. Es EL fallo del parcial.' },
          { tipo: 'error', texto: 'Desordenar la tabla: cada celda nace de sus DOS padres contiguos de la columna anterior. Si te saltas una fila, el veneno se propaga a toda la diagonal.' },
          { tipo: 'error', texto: 'Rehacer toda la tabla al añadir un nodo: solo se añade UNA diagonal (esa es la gracia). Si estás recalculando todo, estás usando Newton con espíritu de Lagrange.' },
          { tipo: 'error', texto: 'Olvidar que los coeficientes $c_j$ son la PRIMERA FILA (diagonal superior) de la tabla, no la última columna.' },
        ],
      },
      {
        titulo: '¿Cuándo usarlo?', icono: '🧭',
        lineas: [
          'Siempre que interpoles a mano o por partes: es la forma de trabajo estándar (Lagrange queda para la teoría).',
          'Datos que llegan en tandas → Newton sin dudar. Derivadas disponibles → su prima Hermite. Muchísimos puntos → splines.',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  function datosAleatorios(U, n) {
    const nodes = [];
    let x = U.randInt(-3, 0);
    for (let i = 0; i < n; i++) { nodes.push(x); x += U.randInt(1, 2); }
    const values = nodes.map(function () { return U.randInt(-6, 6); });
    return { nodes: nodes, values: values };
  }

  NS.content.quizzes.newtoni = {
    generadores: [

      /* 1 · numeric: la primera diferencia dividida */
      function (U) {
        const d = datosAleatorios(U, 2);
        const r = (d.values[1] - d.values[0]) / (d.nodes[1] - d.nodes[0]);
        return {
          tipo: 'numeric', tema: 'primera-diferencia',
          enunciado: 'Datos: $f(' + d.nodes[0] + ') = ' + d.values[0] + '$ y $f(' + d.nodes[1] + ') = ' + d.values[1] + '$. Calcula $f[x_0, x_1]$ (3 decimales).',
          traza: null,
          respuesta: r, tol: 0.005,
          pista: '$f[x_0, x_1] = \\dfrac{f(x_1) - f(x_0)}{x_1 - x_0}$ — sí, es la pendiente de toda la vida.',
          solucion: '$f[x_0, x_1] = \\dfrac{' + d.values[1] + ' - (' + d.values[0] + ')}{' + d.nodes[1] + ' - (' + d.nodes[0] + ')} = ' + tex(r, 5) + '$.',
        };
      },

      /* 2 · choice: los padres de una celda */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = ['$f[x_1, x_2]$ y $f[x_2, x_3]$ (sus dos vecinas de la columna anterior)', '$f[x_1]$ y $f[x_3]$ (los datos de los extremos)', '$f[x_1, x_2]$ y $f[x_1]$'];
        return {
          tipo: 'choice', tema: 'padres-tabla',
          enunciado: '¿Qué dos celdas de la tabla se combinan para producir $f[x_1, x_2, x_3]$?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'Cada celda nace de las dos inmediatamente a su izquierda (una fila arriba y su propia fila).',
          solucion: '$f[x_1, x_2, x_3] = \\dfrac{f[x_2, x_3] - f[x_1, x_2]}{x_3 - x_1}$ — los padres son las dos vecinas de orden 1, y el denominador une los nodos EXTREMOS.',
        };
      },

      /* 3 · choice: la propiedad incremental */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = ['NINGUNO: solo se añade una diagonal nueva y un término más a $P$', 'Todos: la tabla entera cambia', 'Solo los de orden más alto'];
        return {
          tipo: 'choice', tema: 'incremental',
          enunciado: 'Ya tienes la tabla de 4 nodos y su polinomio. Llega un QUINTO dato. ¿Cuántos de los coeficientes anteriores $c_0, \\ldots, c_3$ cambian?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'Los $c_j$ viejos dependen solo de los nodos viejos…',
          solucion: 'Ninguno. $c_0, \\ldots, c_3$ solo miran a $x_0, \\ldots, x_3$: el dato nuevo añade la diagonal inferior y el término $c_4 \\prod_{i=0}^{3}(x - x_i)$. ESO es lo que Lagrange no sabe hacer.',
        };
      },

      /* 4 · numeric: un coeficiente real de la tabla */
      function (U) {
        const d = datosAleatorios(U, 4);
        const tr = NS.engines.newtoni({ nodes: d.nodes, values: d.values, evalXs: [] });
        return {
          tipo: 'numeric', tema: 'coeficientes-diagonal',
          enunciado: 'Nodos $\\{' + d.nodes.join(', ') + '\\}$ con valores $\\{' + d.values.join(', ') + '\\}$. Construye la tabla y calcula el coeficiente $c_2 = f[x_0, x_1, x_2]$ (3 decimales).',
          traza: null,
          respuesta: tr.result.coefs[2], tol: 0.005,
          pista: 'Dos pisos: primero $f[x_0,x_1]$ y $f[x_1,x_2]$, luego $c_2 = \\dfrac{f[x_1,x_2] - f[x_0,x_1]}{x_2 - x_0}$.',
          solucion: '$c_2 = ' + tex(tr.result.coefs[2], 5) + '$ (puedes verificar toda la tabla en el modo Explorar).',
        };
      },

      /* 5 · choice: el denominador correcto */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = ['$x_2 - x_0$ (los nodos EXTREMOS del tramo)', '$x_2 - x_1$ (los nodos adyacentes)', '$x_1 - x_0$ (los primeros)'];
        return {
          tipo: 'choice', tema: 'denominador-extremos',
          enunciado: 'En la recurrencia de $f[x_0, x_1, x_2]$, ¿qué va en el denominador?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'El tramo cubre de $x_0$ a $x_2$: el denominador mide TODO el tramo.',
          solucion: '$f[x_0,x_1,x_2] = \\frac{f[x_1,x_2] - f[x_0,x_1]}{x_2 - x_0}$. El denominador une los extremos del tramo que abarca la celda — usar los adyacentes es el error más repetido de la tabla.',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  NS.content.challenges.newtoni = [
    {
      id: 'constructor', nombre: 'Constructor de tablas', icono: '🧱',
      tipo: 'quiz-serie',
      desc: 'Levanta una tabla de diferencias divididas celda a celda, con inspección de obra en cada planta.',
      n: 5,
      generadores: [
        function (U) {
          const d = datosAleatorios(U, 4);
          const tr = NS.engines.newtoni({ nodes: d.nodes, values: d.values, evalXs: [] });
          return {
            tipo: 'numeric', tema: 'constructor',
            enunciado: '🧱 Obra: nodos $\\{' + d.nodes.join(', ') + '\\}$, valores $\\{' + d.values.join(', ') + '\\}$. Primera planta: $f[x_0, x_1]$ (3 decimales).',
            respuesta: tr.result.tabla[0][1], tol: 0.005,
            pista: '$\\dfrac{f(x_1) - f(x_0)}{x_1 - x_0}$.',
            solucion: '$f[x_0,x_1] = ' + tex(tr.result.tabla[0][1], 5) + '$.',
          };
        },
        function (U) {
          const d = datosAleatorios(U, 4);
          const tr = NS.engines.newtoni({ nodes: d.nodes, values: d.values, evalXs: [] });
          return {
            tipo: 'numeric', tema: 'constructor',
            enunciado: '🧱 Nodos $\\{' + d.nodes.join(', ') + '\\}$, valores $\\{' + d.values.join(', ') + '\\}$. Calcula $f[x_1, x_2]$ (3 decimales).',
            respuesta: tr.result.tabla[1][1], tol: 0.005,
            pista: '$\\dfrac{f(x_2) - f(x_1)}{x_2 - x_1}$ — fila de en medio, primera columna de diferencias.',
            solucion: '$f[x_1,x_2] = ' + tex(tr.result.tabla[1][1], 5) + '$.',
          };
        },
        function (U) {
          const d = datosAleatorios(U, 4);
          const tr = NS.engines.newtoni({ nodes: d.nodes, values: d.values, evalXs: [] });
          return {
            tipo: 'numeric', tema: 'constructor',
            enunciado: '🧱 Nodos $\\{' + d.nodes.join(', ') + '\\}$, valores $\\{' + d.values.join(', ') + '\\}$. Segunda planta: $f[x_0, x_1, x_2]$ (3 decimales).',
            respuesta: tr.result.tabla[0][2], tol: 0.005,
            pista: 'Sus padres son $f[x_0,x_1]$ y $f[x_1,x_2]$; denominador $x_2 - x_0$.',
            solucion: '$f[x_0,x_1,x_2] = ' + tex(tr.result.tabla[0][2], 5) + '$.',
          };
        },
        function (U) {
          const d = datosAleatorios(U, 4);
          const tr = NS.engines.newtoni({ nodes: d.nodes, values: d.values, evalXs: [] });
          return {
            tipo: 'numeric', tema: 'constructor',
            enunciado: '🧱 Nodos $\\{' + d.nodes.join(', ') + '\\}$, valores $\\{' + d.values.join(', ') + '\\}$. La cúspide: $c_3 = f[x_0, x_1, x_2, x_3]$ (3 decimales).',
            respuesta: tr.result.tabla[0][3], tol: 0.005,
            pista: 'Necesitas las dos celdas de orden 2 y dividir por $x_3 - x_0$.',
            solucion: '$c_3 = ' + tex(tr.result.tabla[0][3], 5) + '$.',
          };
        },
        function (U) {
          const d = datosAleatorios(U, 4);
          const xp = d.nodes[1] + 0.5;
          const tr = NS.engines.newtoni({ nodes: d.nodes, values: d.values, evalXs: [xp] });
          return {
            tipo: 'numeric', tema: 'constructor',
            enunciado: '🧱 Entrega de llaves: con nodos $\\{' + d.nodes.join(', ') + '\\}$ y valores $\\{' + d.values.join(', ') + '\\}$, evalúa $P(' + xp + ')$ (2 decimales).',
            respuesta: tr.result.evals[0].y, tol: 0.02,
            pista: 'Anida: $c_0 + (x - x_0)(c_1 + (x - x_1)(c_2 + (x - x_2) c_3))$. O construye la tabla en el modo Cuaderno.',
            solucion: '$P(' + xp + ') = ' + tex(tr.result.evals[0].y, 5) + '$.',
          };
        },
      ],
    },
    {
      id: 'gradomisterioso', nombre: 'Grado misterioso', icono: '🕵️‍♀️',
      tipo: 'quiz-serie',
      desc: 'Te doy puntos muestreados de un polinomio secreto: la tabla delata su grado (una columna se anula).',
      n: 3,
      generadores: [
        function (U) {
          const g = U.randInt(1, 3);
          const a = U.randInt(1, 3), b = U.randInt(-3, 3), c = U.randInt(-4, 4), d0 = U.randInt(-3, 3);
          const poly = function (x) {
            if (g === 1) return c * x + d0;
            if (g === 2) return b * x * x + c * x + d0;
            return a * x * x * x + b * x * x + c * x + d0;
          };
          const nodes = [0, 1, 2, 3, 4, 5];
          const values = nodes.map(poly);
          return {
            tipo: 'choice', tema: 'deteccion-grado',
            enunciado: '🕵️‍♀️ Polinomio secreto muestreado en $x = 0..5$: valores $\\{' + values.join(', ') + '\\}$. Montando la tabla de diferencias divididas… **¿de qué grado es?**',
            opciones: ['Grado 1', 'Grado 2', 'Grado 3'],
            correcta: g - 1,
            pista: 'La columna de orden $g+1$ se hace EXACTAMENTE cero. Mira a partir de qué orden las diferencias dejan de cambiar (constantes → siguiente columna nula).',
            solucion: 'Grado ' + g + ': la columna de orden ' + (g + 1) + ' de la tabla es toda ceros, porque $f[\\ldots] = \\frac{f^{(k)}(\\xi)}{k!}$ y la derivada ' + (g + 1) + '-ésima de un polinomio de grado ' + g + ' es 0. La tabla es un detector de grado.',
          };
        },
        function (U) {
          const c1 = U.randInt(2, 5), c0 = U.randInt(-4, 4);
          const nodes = [0, 1, 2, 3, 4];
          const values = nodes.map(function (x) { return c1 * x + c0; });
          return {
            tipo: 'numeric', tema: 'deteccion-grado',
            enunciado: '🕵️‍♀️ Datos de una recta secreta: $\\{' + values.join(', ') + '\\}$ en $x = 0..4$. TODAS las diferencias de orden 1 valen lo mismo: ¿cuánto?',
            respuesta: c1, tol: 0.01,
            pista: 'En una recta, $f[x_i, x_{i+1}]$ es su pendiente, siempre la misma.',
            solucion: 'Valen $' + c1 + '$ (la pendiente). Por eso la columna de orden 2 sale cero: diferencias de constantes.',
          };
        },
        function (U) {
          const ops = U.baraja([0, 1, 2]);
          const textos = [
            'Que a partir de cierto orden las columnas son (casi) cero: los datos esconden un polinomio de ese grado',
            'Que los datos están mal medidos',
            'Que el método no puede interpolarlos',
          ];
          return {
            tipo: 'choice', tema: 'deteccion-grado',
            enunciado: '🕵️‍♀️ Pregunta de detective consumado: si al construir una tabla de diferencias divididas ves que la columna de orden 4 sale toda ceros, ¿qué significa?',
            opciones: ops.map(function (i) { return textos[i]; }),
            correcta: ops.indexOf(0),
            pista: '$f[\\ldots]$ de orden $k$ ∼ derivada $k$-ésima / $k!$…',
            solucion: 'Los datos provienen de un polinomio de grado $\\le 3$: su cuarta derivada es cero y las diferencias de orden 4 lo delatan. Gratis: puedes PODAR el polinomio a grado 3 sin perder exactitud.',
          };
        },
      ],
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
