/* Pack de contenido: JACOBI (teoría + Practicar + Retos). */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.jacobi = {
    secciones: [
      {
        titulo: 'La idea', icono: '💡',
        lineas: [
          'En vez de RESOLVER el sistema, Jacobi lo convierte en una máquina de mejorar soluciones: despeja cada incógnita de SU ecuación ($x_i$ de la ecuación $i$) y usa la aproximación actual para producir una mejor.',
          'Es el punto fijo de los sistemas: $X^{(k+1)} = T\\,X^{(k)} + C$. Metes un vector, sale otro más cercano a la solución… si la matriz colabora.',
          'Rasgo distintivo: todas las variables se actualizan **a la vez**, usando SOLO el vector de la iteración anterior. Por eso en el plano el iterado salta «en diagonal».',
        ],
      },
      {
        titulo: 'Formulación', icono: '🧮',
        lineas: [
          '$x_i^{(k+1)} = \\dfrac{b_i - \\sum_{j \\ne i} a_{ij}\\, x_j^{(k)}}{a_{ii}}$',
          'Parada: $\\max_i |x_i^{(k+1)} - x_i^{(k)}| < \\varepsilon$.',
          'Requisito mínimo evidente: $a_{ii} \\ne 0$ (reordena ecuaciones si hace falta — es gratis).',
        ],
      },
      {
        titulo: 'Convergencia', icono: '📈',
        lineas: [
          'Condición SUFICIENTE (la práctica): si $A$ es **estrictamente diagonal dominante** ($|a_{ii}| > \\sum_{j\\ne i} |a_{ij}|$ en cada fila), Jacobi converge desde CUALQUIER $X^{(0)}$.',
          'Condición exacta (la teórica): converge si y solo si el radio espectral de la matriz de iteración cumple $\\rho(T) < 1$ — el análogo matricial del $|g\'| < 1$ del punto fijo.',
          'Sin dominancia diagonal el veredicto queda abierto: puede converger o no. La app te lo avisa con el análisis fila a fila.',
          'Convergencia lineal: cada iteración multiplica el error por $\\approx \\rho(T)$.',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '⚖️',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Baratísimo por iteración ($\\sim n^2$, y menos si $A$ tiene muchos ceros).',
              'No destruye la estructura dispersa: ideal para sistemas GIGANTES.',
              'Trivialmente **paralelizable**: cada $x_i$ nuevo es independiente de los demás.',
              'Autocorrectivo frente a errores puntuales.',
            ],
            contras: [
              'Puede no converger: necesita matrices «buenas».',
              'Convergencia lineal, a veces desesperante.',
              'Más lento que Gauss-Seidel casi siempre (usa información más vieja).',
              'Para sistemas pequeños, Gauss directo es imbatible.',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '🚫',
        lineas: [
          { tipo: 'error', texto: 'Usar los valores RECIÉN calculados dentro de la misma pasada «porque ya los tengo»: eso ya no es Jacobi, es Gauss-Seidel. Jacobi congela $X^{(k)}$ completo hasta terminar la pasada.' },
          { tipo: 'error', texto: 'Concluir «no es diagonal dominante → diverge»: la dominancia es SUFICIENTE, no necesaria. Sin ella, el resultado queda en «no garantizado».' },
          { tipo: 'error', texto: 'No reordenar ecuaciones: a veces la dominancia diagonal está escondida y solo hay que intercambiar filas (preset «💥 Diverge (mal ordenado)» y reto «Hazla dominante»).' },
          { tipo: 'error', texto: 'Parar por número de iteraciones sin mirar $\\max|\\Delta x|$: puedes estar lejísimos (o haber convergido hace rato).' },
        ],
      },
      {
        titulo: '¿Cuándo usarlo?', icono: '🧭',
        lineas: [
          'Sistemas ENORMES y dispersos (discretizaciones de EDPs, mallas, grafos) donde Gauss es impagable y la matriz es diagonal dominante o simétrica definida positiva.',
          'Cuando tienes hardware paralelo: Jacobi reparte perfecto entre procesadores. Si la ejecución es secuencial, Gauss-Seidel suele llegar antes.',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  function matrizDominante(U, n) {
    const A = [], B = [];
    for (let i = 0; i < n; i++) {
      const fila = [];
      let suma = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) { fila.push(0); continue; }
        const v = U.randInt(-3, 3);
        fila.push(v);
        suma += Math.abs(v);
      }
      const signo = U.elegir([-1, 1]);
      fila[i] = signo * (suma + U.randInt(1, 4));
      A.push(fila);
      B.push(U.randInt(-9, 9));
    }
    return { A: A, B: B };
  }
  function esDominante(A) {
    return A.every(function (f, i) {
      let s = 0;
      for (let j = 0; j < f.length; j++) if (j !== i) s += Math.abs(f[j]);
      return Math.abs(f[i]) > s;
    });
  }
  function rompeDominancia(U, m) {
    /* estropea una fila: encoge la diagonal */
    const i = U.randInt(0, m.A.length - 1);
    m.A[i][i] = U.elegir([-1, 1]);
    return m;
  }
  function pintaSistema(A, B) {
    return A.map(function (f, i) { return '$[' + f.join(',\\ ') + '\\ |\\ ' + B[i] + ']$'; }).join('  ·  ');
  }

  NS.content.quizzes.jacobi = {
    generadores: [

      /* 1 · choice: ¿es diagonal dominante? */
      function (U) {
        let m = matrizDominante(U, 3);
        const romper = U.elegir([true, false]);
        if (romper) m = rompeDominancia(U, m);
        const dominante = esDominante(m.A);
        return {
          tipo: 'choice', tema: 'dominancia',
          enunciado: 'Sistema (filas de $[A|B]$): ' + pintaSistema(m.A, m.B) + '. ¿Es $A$ **estrictamente diagonal dominante**?',
          traza: null,
          opciones: ['Sí: en todas las filas $|a_{ii}|$ supera a la suma del resto', 'No: al menos una fila falla'],
          correcta: dominante ? 0 : 1,
          pista: 'Fila a fila: compara $|a_{ii}|$ contra la suma de los |valores| de sus vecinos de fila.',
          solucion: dominante
            ? 'Todas las filas cumplen $|a_{ii}| > \\sum_{j \\ne i}|a_{ij}|$ → Jacobi (y Gauss-Seidel) convergen desde cualquier arranque.'
            : 'Hay una fila cuya diagonal NO supera a la suma del resto → la garantía se cae (lo que no significa divergencia segura: significa incertidumbre).',
        };
      },

      /* 2 · numeric: primera iteración a mano */
      function (U) {
        const m = matrizDominante(U, 3);
        const tr = NS.engines.jacobi({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-4, maxIter: 40 });
        const sweep = tr.steps.filter(function (s) { return s.type === 'sweep'; })[0];
        return {
          tipo: 'numeric', tema: 'primera-iteracion',
          enunciado: 'Sistema: ' + pintaSistema(m.A, m.B) + ' con $X^{(0)} = [0, 0, 0]$. Calcula la PRIMERA componente $x^{(1)}$ (3 decimales).',
          traza: null,
          respuesta: sweep.perVar[0].val, tol: 0.005,
          pista: 'Con todo a cero, los términos cruzados desaparecen: $x^{(1)} = b_1 / a_{11}$.',
          solucion: '$x^{(1)} = \\dfrac{' + m.B[0] + '}{' + m.A[0][0] + '} = ' + tex(sweep.perVar[0].val, 5) + '$.',
        };
      },

      /* 3 · choice: LA pregunta de Jacobi */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'TODOS los valores del vector ANTERIOR $X^{(k)}$ — aunque $x^{(k+1)}$ ya esté calculado',
          'El $x^{(k+1)}$ recién calculado, que es más fresco',
          'Da exactamente igual: converge a lo mismo con la misma velocidad',
        ];
        return {
          tipo: 'choice', tema: 'jacobi-vs-seidel',
          enunciado: 'Estás en plena iteración de **Jacobi**: acabas de calcular $x^{(k+1)}$ y ahora toca $y^{(k+1)}$. ¿Qué valores usas en la fórmula?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'Jacobi actualiza «todas a la vez»: la pasada entera se hace con la foto del vector anterior.',
          solucion: 'Jacobi usa SIEMPRE $X^{(k)}$ completo: las variables nuevas no se estrenan hasta la siguiente pasada. Usar los valores frescos es la definición de… Gauss-Seidel (y suele ir más rápido, pero es OTRO método).',
        };
      },

      /* 4 · choice: qué significa no-dominante */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'Que la convergencia NO está garantizada: puede converger o no',
          'Que diverge seguro',
          'Que converge igual, solo que más lento',
        ];
        return {
          tipo: 'choice', tema: 'condicion-suficiente',
          enunciado: 'Compruebas que $A$ NO es estrictamente diagonal dominante. ¿Qué puedes afirmar sobre Jacobi?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: '¿La dominancia era condición suficiente… o necesaria?',
          solucion: 'La dominancia es solo SUFICIENTE. Sin ella el test se queda mudo: el criterio exacto es $\\rho(T) < 1$. Moraleja práctica: intenta reordenar filas para recuperar la dominancia antes de rendirte.',
        };
      },

      /* 5 · numeric: el criterio de parada */
      function (U) {
        const m = matrizDominante(U, 3);
        const tr = NS.engines.jacobi({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-4, maxIter: 40 });
        const sweep = tr.steps.filter(function (s) { return s.type === 'sweep'; })[0];
        return {
          tipo: 'numeric', tema: 'criterio-parada',
          enunciado: 'En la primera iteración del sistema ' + pintaSistema(m.A, m.B) + ' (desde $[0,0,0]$), $X^{(1)} = [' + sweep.xNew.map(function (v) { return tex(v, 4); }).join(',\\ ') + ']$. ¿Cuánto vale el criterio $\\max_i |x_i^{(1)} - x_i^{(0)}|$? (3 decimales)',
          traza: null,
          respuesta: sweep.error, tol: 0.005,
          pista: 'Desde el vector cero, es simplemente el MAYOR $|x_i^{(1)}|$.',
          solucion: '$\\max|\\Delta x| = ' + tex(sweep.error, 5) + '$ — cuando esta cantidad baje de la tolerancia, paramos.',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  NS.content.challenges.jacobi = [
    {
      id: 'dominante', nombre: 'Hazla dominante', icono: '🧩',
      tipo: 'apuesta',
      desc: 'Tres ordenaciones de las mismas tres ecuaciones. Solo una tiene la diagonal al mando: encuéntrala ANTES de correrlas.',
      pregunta: 'Las mismas tres ecuaciones, barajadas de tres maneras. Reordenar filas es GRATIS y no cambia la solución… pero a Jacobi le cambia la vida. **¿Qué ordenación converge?** (Pista: busca dónde manda la diagonal.)',
      candidatos: [
        {
          label: 'Orden A: $[1, -5, 1]$, $[6, 1, -1]$, $[2, -1, -7]$',
          params: { A: '1 -5 1\n6 1 -1\n2 -1 -7', B: '-8 10 -12', X0: '0 0 0', tol: '0.0001', maxIter: '50' },
        },
        {
          label: 'Orden B: $[6, 1, -1]$, $[1, -5, 1]$, $[2, -1, -7]$',
          params: { A: '6 1 -1\n1 -5 1\n2 -1 -7', B: '10 -8 -12', X0: '0 0 0', tol: '0.0001', maxIter: '50' },
        },
        {
          label: 'Orden C: $[2, -1, -7]$, $[6, 1, -1]$, $[1, -5, 1]$',
          params: { A: '2 -1 -7\n6 1 -1\n1 -5 1', B: '-12 10 -8', X0: '0 0 0', tol: '0.0001', maxIter: '50' },
        },
      ],
      puntosAcierto: 100, puntosFallo: 25,
      moraleja: 'Solo el orden B pone en CADA fila su coeficiente gordo sobre la diagonal (6, −5, −7). Misma álgebra, destino opuesto: reordenar es la jugada más barata del álgebra lineal.',
    },
    {
      id: 'horquilla', nombre: 'Apuesta de convergencia', icono: '🔮',
      tipo: 'quiz-serie',
      desc: 'Te enseño la matriz, tú predices el destino: ¿converge?, ¿en cuántas iteraciones? Afina tu ojo espectral.',
      n: 4,
      generadores: [
        function (U) {
          const m = matrizDominante(U, 3);
          const tr = NS.engines.jacobi({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-3, maxIter: 60 });
          return {
            tipo: 'choice', tema: 'prediccion-convergencia',
            enunciado: 'Sistema: ' + pintaSistema(m.A, m.B) + ', $X^{(0)} = [0,0,0]$, tol $10^{-3}$. ¿Converge Jacobi?',
            opciones: ['Sí (la diagonal manda en todas las filas)', 'No'],
            correcta: tr.status === 'converged' ? 0 : 1,
            pista: 'Haz el test de dominancia fila a fila.',
            solucion: tr.status === 'converged' ? 'Converge en ' + tr.result.iters + ' iteraciones: la dominancia diagonal lo garantizaba.' : 'No converge dentro del límite.',
          };
        },
        function (U) {
          const m = matrizDominante(U, 3);
          const tr = NS.engines.jacobi({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-3, maxIter: 80 });
          return {
            tipo: 'numeric', tema: 'prediccion-convergencia',
            enunciado: 'Este sistema dominante ' + pintaSistema(m.A, m.B) + ' converge con tol $10^{-3}$. **¿En cuántas iteraciones?** (±3 de margen; estima por lo dominante que sea la diagonal)',
            respuesta: tr.result.iters, tol: 3.2,
            pista: 'Diagonal MUY dominante → el error se encoge mucho por pasada → pocas iteraciones (5-10). Dominancia justita → 15-30.',
            solucion: 'Convergió en ' + tr.result.iters + ' iteraciones.',
          };
        },
        function (U) {
          let m = matrizDominante(U, 3);
          m = rompeDominancia(U, m);
          const tr = NS.engines.jacobi({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-3, maxIter: 60 });
          const conv = tr.status === 'converged';
          return {
            tipo: 'choice', tema: 'condicion-suficiente',
            enunciado: 'Sistema SIN dominancia diagonal: ' + pintaSistema(m.A, m.B) + '. Sin garantía teórica… ¿qué pasó al correrlo?',
            opciones: ['Convergió igualmente', 'Divergió o se quedó sin iteraciones'],
            correcta: conv ? 0 : 1,
            pista: 'Sin dominancia, cara o cruz: lo decide el radio espectral, no la suerte.',
            solucion: conv
              ? 'Convergió: la dominancia es suficiente pero NO necesaria — este $\\rho(T)$ era menor que 1.'
              : 'No convergió: sin la diagonal al mando, la iteración amplificó el error.',
          };
        },
        function (U) {
          const ops = U.baraja([0, 1, 2]);
          const textos = ['Reordenar las ecuaciones para recuperar la dominancia', 'Aumentar la tolerancia', 'Cambiar el vector inicial $X^{(0)}$'];
          return {
            tipo: 'choice', tema: 'remedio-reordenar',
            enunciado: 'Jacobi te diverge y sospechas que la matriz «está mal sentada». ¿Cuál es el remedio más barato que puede arreglarlo de verdad?',
            opciones: ops.map(function (i) { return textos[i]; }),
            correcta: ops.indexOf(0),
            pista: 'Con dominancia diagonal, converge desde CUALQUIER inicio — ¿qué operación es gratis y puede conseguirla?',
            solucion: 'Reordenar filas: no cambia la solución y puede colocar los coeficientes grandes en la diagonal. Cambiar $X^{(0)}$ no salva una iteración divergente (si $\\rho(T) > 1$, diverge desde casi cualquier punto), y la tolerancia solo mueve la meta.',
          };
        },
      ],
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
