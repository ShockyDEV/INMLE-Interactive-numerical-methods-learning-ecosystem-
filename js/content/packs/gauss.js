/* Pack de contenido: ELIMINACIÓN GAUSSIANA (teoría + Practicar + Retos). */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.gauss = {
    secciones: [
      {
        titulo: 'La idea', icono: '',
        lineas: [
          'Un sistema triangular se resuelve solo: la última ecuación da $x_n$ directamente, la penúltima usa ese valor, y así hacia arriba. Gauss convierte CUALQUIER sistema en uno triangular a base de **operaciones de fila que no cambian la solución**.',
          'La herramienta es una sola: restar a una fila un múltiplo de otra ($F_i \\to F_i - m\\,F_k$), con el multiplicador $m$ elegido con puntería para fabricar un CERO donde interesa.',
        ],
      },
      {
        titulo: 'Formulación', icono: '',
        lineas: [
          'Para anular $a_{ik}$ bajo el pivote $a_{kk}$: $m_{ik} = \\dfrac{a_{ik}}{a_{kk}}$ y luego $F_i \\to F_i - m_{ik} F_k$.',
          'Tras triangular: **sustitución regresiva**, $x_i = \\dfrac{b_i - \\sum_{j>i} a_{ij} x_j}{a_{ii}}$.',
          'Regalos que caen del proceso: $A = L\\,U$ (los multiplicadores forman $L$; el resultado triangular es $U$) y $\\det(A)$ = producto de pivotes.',
        ],
      },
      {
        titulo: 'Coste y exactitud', icono: '',
        lineas: [
          'Método **directo**: da la solución exacta (salvo redondeo) en un número FINITO de operaciones — nada de iterar y esperar.',
          'Coste: $\\sim \\frac{n^3}{3}$ multiplicaciones. Para $n = 3$ es un pestañeo; para $n = 10^6$ (mallas de ingeniería) es prohibitivo, y ahí entran Jacobi y Gauss-Seidel.',
          'La factorización $LU$ amortiza: resolver otro sistema con la MISMA $A$ y otro $b$ cuesta solo $\\sim n^2$ (dos sustituciones triangulares).',
          'Estabilidad: pivotes pequeños amplifican el error de redondeo — el remedio se llama pivoteo parcial (intercambiar filas para subir el mayor pivote disponible).',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Solución exacta en tiempo predecible: sin tolerancias ni cruzar dedos.',
              'De regalo: $L$, $U$ y $\\det(A)$ sin coste extra.',
              'Con pivoteo parcial es muy estable en la práctica.',
            ],
            contras: [
              'Coste $O(n^3)$: inviable para sistemas gigantes.',
              'Destruye la estructura dispersa (los ceros se «rellenan»).',
              'Pivote nulo → hay que intercambiar filas sí o sí.',
              'Sensible al redondeo si los pivotes son pequeños y no pivoteas.',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '',
        lineas: [
          { tipo: 'error', texto: 'Equivocar el SIGNO del multiplicador: $m_{ik} = a_{ik}/a_{kk}$ y la operación es RESTAR $m \\cdot F_k$. Si el cero no aparece donde toca, revisa el signo.' },
          { tipo: 'error', texto: 'Olvidar aplicar la operación al término independiente $b$: la fila es TODA la fila, columna aumentada incluida.' },
          { tipo: 'error', texto: 'Usar la fila pivote YA MODIFICADA de un paso anterior en vez de la actual: en el paso $k$ se usa la fila $k$ tal como quedó tras el paso $k-1$.' },
          { tipo: 'error', texto: 'Calcular $\\det(A)$ como producto de pivotes… olvidando que cada INTERCAMBIO de filas le cambia el signo.' },
        ],
      },
      {
        titulo: '¿Cuándo usarlo?', icono: '',
        lineas: [
          'Sistemas de tamaño pequeño o mediano, densos, donde quieres LA solución sin condiciones de convergencia: es el estándar.',
          'Muchos sistemas con la misma $A$ → factoriza $LU$ una vez. Sistemas enormes y dispersos → métodos iterativos (Jacobi, Gauss-Seidel y sucesores).',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  /* Matriz 3×3 de enteros pequeños que se triangula sin pivoteo. */
  function matrizValida(U) {
    for (let intento = 0; intento < 60; intento++) {
      const A = [], B = [];
      for (let i = 0; i < 3; i++) {
        const fila = [];
        for (let j = 0; j < 3; j++) {
          let v = 0;
          while (v === 0) v = U.randInt(-5, 5);
          fila.push(v);
        }
        A.push(fila);
        B.push(U.randInt(-8, 8));
      }
      const tr = NS.engines.gauss({ A: A, B: B });
      if (tr.status === 'converged') return { A: A, B: B, tr: tr };
    }
    /* red de seguridad determinista */
    const A = [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], B = [8, -11, -3];
    return { A: A, B: B, tr: NS.engines.gauss({ A: A, B: B }) };
  }
  function pintaMatriz(A, B) {
    return A.map(function (f, i) { return '$[' + f.join(',\\ ') + '\\ |\\ ' + B[i] + ']$'; }).join('  ·  ');
  }
  function rowops(tr) { return tr.steps.filter(function (s) { return s.type === 'rowop'; }); }

  NS.content.quizzes.gauss = {
    generadores: [

      /* 1 · numeric: el primer multiplicador */
      function (U) {
        const c = matrizValida(U);
        const op = rowops(c.tr)[0];
        return {
          tipo: 'numeric', tema: 'multiplicador',
          enunciado: 'Sistema (filas de $[A|B]$): ' + pintaMatriz(c.A, c.B) + '. Para anular $a_{21}$ con $F_2 \\to F_2 - m\\,F_1$: calcula $m_{21}$ (3 decimales, cuida el signo).',
          traza: null,
          respuesta: op.op.m, tol: 0.005,
          pista: '$m_{21} = \\dfrac{a_{21}}{a_{11}} = \\dfrac{' + c.A[1][0] + '}{' + c.A[0][0] + '}$ — el signo viene solo, no lo inventes.',
          solucion: '$m_{21} = ' + tex(op.op.m, 5) + '$. Con ese $m$, la resta deja exactamente 0 en la posición (2,1).',
        };
      },

      /* 2 · numeric: el efecto de la operación de fila */
      function (U) {
        const c = matrizValida(U);
        const op = rowops(c.tr)[0]; /* F2 → F2 − m·F1 */
        const nuevo = op.M[1][1];
        return {
          tipo: 'numeric', tema: 'operacion-fila',
          enunciado: 'Con ' + pintaMatriz(c.A, c.B) + ' aplicas $F_2 \\to F_2 - (' + tex(op.op.m, 4) + ')\\,F_1$. ¿Cuál es el **nuevo valor de $a_{22}$**? (3 decimales)',
          traza: null,
          respuesta: nuevo, tol: 0.005,
          pista: 'Nuevo $a_{22} = ' + c.A[1][1] + ' - (' + tex(op.op.m, 4) + ') \\cdot ' + c.A[0][1] + '$.',
          solucion: '$a_{22}^{(1)} = ' + tex(nuevo, 5) + '$. La operación se aplica a TODA la fila (incluido $b_2$).',
        };
      },

      /* 3 · choice: ¿qué celda se anula? */
      function (U) {
        const c = matrizValida(U);
        const ops = U.baraja([0, 1, 2]);
        const textos = ['$a_{21}$ (fila 2, columna 1)', '$a_{12}$ (fila 1, columna 2)', '$a_{22}$ (fila 2, columna 2)'];
        return {
          tipo: 'choice', tema: 'objetivo-multiplicador',
          enunciado: 'En el primer paso de Gauss aplicas $F_2 \\to F_2 - m_{21} F_1$ con $m_{21} = a_{21}/a_{11}$. ¿Qué elemento se convierte en CERO exactamente?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'El multiplicador se diseñó a medida para UNA posición concreta…',
          solucion: 'Se anula $a_{21}$: por construcción, $a_{21} - \\frac{a_{21}}{a_{11}} a_{11} = 0$. El resto de la fila cambia, pero sin garantía de ceros.',
        };
      },

      /* 4 · choice: det y el intercambio de filas */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = ['Cambia de signo', 'No cambia', 'Se duplica'];
        return {
          tipo: 'choice', tema: 'det-swap',
          enunciado: 'Durante la eliminación intercambias dos filas (pivoteo). ¿Qué le pasa a $\\det(A)$?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'Las operaciones $F_i - m F_k$ NO tocan el determinante… pero el intercambio no es de esas.',
          solucion: 'Cada intercambio multiplica el determinante por $-1$. Por eso, al calcular $\\det(A)$ como producto de pivotes hay que contar los intercambios: $\\det(A) = (-1)^{\\text{swaps}} \\prod u_{ii}$.',
        };
      },

      /* 5 · numeric: det como producto de pivotes */
      function (U) {
        const c = matrizValida(U);
        const Ud = c.tr.result.U;
        const diag = [Ud[0][0], Ud[1][1], Ud[2][2]];
        return {
          tipo: 'numeric', tema: 'det-pivotes',
          enunciado: 'Tras triangular (sin intercambios), la diagonal de $U$ quedó: $' + diag.map(function (v) { return tex(v, 4); }).join(',\\ ') + '$. Calcula $\\det(A)$ (2 decimales).',
          traza: null,
          respuesta: c.tr.result.det, tol: Math.max(0.02, Math.abs(c.tr.result.det) * 0.01),
          pista: 'Sin intercambios, $\\det(A)$ = producto de los pivotes de la diagonal.',
          solucion: '$\\det(A) = ' + diag.map(function (v) { return '(' + tex(v, 4) + ')'; }).join(' \\cdot ') + ' = ' + tex(c.tr.result.det, 5) + '$.',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  function genPregCirujano(extrae) {
    return function (U) {
      const c = matrizValida(U);
      return extrae(c, U);
    };
  }

  NS.content.challenges.gauss = [
    {
      id: 'cirujano', nombre: 'Cirujano de matrices', icono: '',
      tipo: 'quiz-serie',
      desc: 'Opera un sistema 3×3 TÚ: los tres multiplicadores y la sustitución regresiva, con verificación en cada corte.',
      n: 5,
      generadores: [
        genPregCirujano(function (c) {
          const op = rowops(c.tr)[0];
          return {
            tipo: 'numeric', tema: 'cirujano-m21',
            enunciado: 'Paciente: ' + pintaMatriz(c.A, c.B) + '. Primer corte: calcula $m_{21}$ (3 decimales).',
            respuesta: op.op.m, tol: 0.005,
            pista: '$m_{21} = a_{21}/a_{11}$.',
            solucion: '$m_{21} = ' + tex(op.op.m, 5) + '$.',
          };
        }),
        genPregCirujano(function (c) {
          const op = rowops(c.tr)[1];
          return {
            tipo: 'numeric', tema: 'cirujano-m31',
            enunciado: 'Paciente: ' + pintaMatriz(c.A, c.B) + '. Segundo corte: calcula $m_{31}$ (3 decimales).',
            respuesta: op.op.m, tol: 0.005,
            pista: '$m_{31} = a_{31}/a_{11}$.',
            solucion: '$m_{31} = ' + tex(op.op.m, 5) + '$.',
          };
        }),
        genPregCirujano(function (c) {
          const op = rowops(c.tr)[2];
          const prev = rowops(c.tr)[1];
          return {
            tipo: 'numeric', tema: 'cirujano-m32',
            enunciado: 'Tras el paso 1, la submatriz quedó con $a_{22}^{(1)} = ' + tex(prev.M[1][1], 4) + '$ y $a_{32}^{(1)} = ' + tex(prev.M[2][1], 4) + '$. Tercer corte: calcula $m_{32}$ (3 decimales).',
            respuesta: op.op.m, tol: 0.005,
            pista: '¡Usa los valores YA OPERADOS, no los originales! $m_{32} = a_{32}^{(1)}/a_{22}^{(1)}$.',
            solucion: '$m_{32} = ' + tex(op.op.m, 5) + '$ — el clásico error aquí es usar la matriz original.',
          };
        }),
        genPregCirujano(function (c) {
          return {
            tipo: 'numeric', tema: 'cirujano-x3',
            enunciado: 'Sutura final. El sistema del paciente ' + pintaMatriz(c.A, c.B) + ' ya está triangulado. Empieza la sustitución regresiva: ¿cuánto vale $x_3$? (3 decimales)',
            respuesta: c.tr.result.X[2], tol: 0.005,
            pista: 'De la última fila triangulada: $x_3 = b_3^{(2)} / a_{33}^{(2)}$ — puedes reproducir la eliminación en el modo Cuaderno.',
            solucion: '$x_3 = ' + tex(c.tr.result.X[2], 5) + '$.',
          };
        }),
        genPregCirujano(function (c) {
          return {
            tipo: 'numeric', tema: 'cirujano-x1',
            enunciado: 'Último punto: con el sistema ' + pintaMatriz(c.A, c.B) + ' ya resuelto hacia arriba, ¿cuánto vale $x_1$? (3 decimales)',
            respuesta: c.tr.result.X[0], tol: 0.005,
            pista: '$x_1 = \\dfrac{b_1 - a_{12}x_2 - a_{13}x_3}{a_{11}}$ con los $x_2, x_3$ ya despejados (Cuaderno si lo necesitas).',
            solucion: '$x_1 = ' + tex(c.tr.result.X[0], 5) + '$. Operación completada, doctor.',
          };
        }),
      ],
    },
    {
      id: 'pivotesabio', nombre: 'El pivote sabio', icono: '',
      tipo: 'quiz-serie',
      desc: 'Determinantes, pivotes nulos y el porqué del pivoteo: la sabiduría fina de Gauss en 4 preguntas.',
      n: 4,
      generadores: [
        function (U) {
          const d = [U.randInt(1, 4), U.randInt(-4, -1), U.randInt(1, 3)];
          const det = d[0] * d[1] * d[2];
          return {
            tipo: 'numeric', tema: 'det-triangular',
            enunciado: 'Una matriz triangular tiene diagonal $' + d.join(',\\ ') + '$ (y lo que sea encima). ¿Su determinante?',
            respuesta: det, tol: 0.01,
            pista: 'En una triangular, el det es el producto de la diagonal, sin más.',
            solucion: '$\\det = ' + d.join(' \\cdot ') + ' = ' + det + '$.',
          };
        },
        function () {
          return {
            tipo: 'choice', tema: 'pivote-nulo',
            enunciado: 'Llegas al paso $k$ y el pivote $a_{kk} = 0$. ¿Qué haces?',
            opciones: [
              'Intercambiar esa fila con una de más abajo que tenga entrada no nula en la columna $k$',
              'Dividir por un número muy pequeño en su lugar',
              'Rendirse: el sistema no tiene solución',
            ],
            correcta: 0,
            pista: '$m = a_{ik}/0$ no existe… pero las filas se pueden mover gratis.',
            solucion: 'Se intercambian filas (pivoteo). Un pivote nulo NO significa sistema sin solución: solo que ese orden de ecuaciones no funciona. (Y recuerda: el intercambio cambia el signo del det.)',
          };
        },
        function (U) {
          const ops = U.baraja([0, 1, 2]);
          const textos = ['$3$: $m_{21}, m_{31}, m_{32}$', '$9$: una por cada elemento', '$2$: una por columna'];
          return {
            tipo: 'choice', tema: 'conteo-operaciones',
            enunciado: '¿Cuántas operaciones de fila (multiplicadores) necesita triangular un sistema $3 \\times 3$ sin pivoteo?',
            opciones: ops.map(function (i) { return textos[i]; }),
            correcta: ops.indexOf(0),
            pista: 'Cuenta los huecos DEBAJO de la diagonal.',
            solucion: 'Tres ceros que fabricar bajo la diagonal → 3 multiplicadores: $m_{21}, m_{31}$ (paso 1) y $m_{32}$ (paso 2). En general, $n(n-1)/2$.',
          };
        },
        function () {
          return {
            tipo: 'choice', tema: 'pivoteo-precision',
            enunciado: 'Sin pivoteo, un pivote MUY PEQUEÑO (p. ej. $10^{-8}$) es peligroso porque…',
            opciones: [
              'Genera multiplicadores enormes que amplifican los errores de redondeo',
              'Hace el determinante cero',
              'Impide la sustitución regresiva',
            ],
            correcta: 0,
            pista: '$m = a_{ik}/10^{-8}$ vale… ¿cuánto?',
            solucion: 'Dividir por un pivote diminuto crea multiplicadores gigantes: cada resta mezcla números de tamaños brutales y el redondeo se come los dígitos buenos. El pivoteo parcial (subir el mayor pivote) mantiene $|m| \\le 1$.',
          };
        },
      ],
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
