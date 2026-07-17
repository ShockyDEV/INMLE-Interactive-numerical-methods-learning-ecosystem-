/* MNO.achievements — insignias declarativas: {id, nombre, desc, icono, cond}.
   Se evalúan tras cada mutación del store; las nuevas se anuncian con toast. */
(function (NS) {
  'use strict';

  function met(s, mid) { return s.metodos[mid]; }
  function prac(s, mid) { const m = met(s, mid); return m ? m.practica : null; }

  const LISTA = [
    {
      id: 'primer-paso', nombre: 'Primer Paso',
      desc: 'Ejecuta tu primera animación paso a paso.',
      cond: function (s) {
        return Object.keys(s.metodos).some(function (k) { return s.metodos[k].ejecuciones >= 1; });
      },
    },
    {
      id: 'cazador-de-raices', nombre: 'Cazador de Raíces',
      desc: 'Encuentra una raíz con los 5 métodos de la unidad de Raíces.',
      cond: function (s) {
        return ['biseccion', 'cuerda', 'puntofijo', 'newton', 'secante'].every(function (k) {
          return met(s, k) && met(s, k).ejecuciones >= 1;
        });
      },
    },
    {
      id: 'tangente-perfecta', nombre: 'Tangente Perfecta',
      desc: 'Acierta 5 predicciones gráficas seguidas en Newton.',
      cond: function (s) {
        const p = prac(s, 'newton');
        return p && p.mejorRacha >= 5;
      },
    },
    {
      id: 'espiral-domada', nombre: 'Espiral Domada',
      desc: 'Presencia una divergencia en Punto Fijo… y luego logra converger.',
      cond: function (s) {
        const m = met(s, 'puntofijo');
        return m && m.divergenciasVistas >= 1 && m.ejecuciones >= 2;
      },
    },
    {
      id: 'domador-de-matrices', nombre: 'Domador de Matrices',
      desc: 'Consigue ★★★ en el reto Cirujano de Matrices.',
      cond: function (s) {
        const m = met(s, 'gauss');
        return m && m.retos['cirujano'] && m.retos['cirujano'].estrellas >= 3;
      },
    },
    {
      id: 'diagonal-dominante', nombre: 'Diagonal Dominante',
      desc: 'Supera el reto Hazla Dominante.',
      cond: function (s) {
        const mj = met(s, 'jacobi'), ms = met(s, 'seidel');
        return (mj && mj.retos['dominante'] && mj.retos['dominante'].estrellas >= 1) ||
          (ms && ms.retos['dominante'] && ms.retos['dominante'].estrellas >= 1);
      },
    },
    {
      id: 'descubridor-de-chebyshev', nombre: 'Descubridor de Chebyshev',
      desc: 'Doma al fenómeno de Runge en el reto Caza al Runge.',
      cond: function (s) {
        const m = met(s, 'lagrange');
        return m && m.retos['runge'] && m.retos['runge'].estrellas >= 2;
      },
    },
    {
      id: 'sin-red', nombre: 'Sin Red',
      desc: 'Responde 10 preguntas seguidas sin usar ninguna pista.',
      cond: function (s) {
        return Object.keys(s.metodos).some(function (k) { return s.metodos[k].practica.sinPista >= 10; });
      },
    },
    {
      id: 'racha-de-10', nombre: 'Racha de 10',
      desc: '10 aciertos consecutivos al primer intento.',
      cond: function (s) {
        return Object.keys(s.metodos).some(function (k) { return s.metodos[k].practica.mejorRacha >= 10; });
      },
    },
    {
      id: 'ojo-clinico', nombre: 'Ojo Clínico',
      desc: 'Acierta 5 apuestas en la Carrera de Métodos.',
      cond: function (s) { return s.carrera.apuestasOk >= 5; },
    },
    {
      id: 'coleccionista', nombre: 'Coleccionista',
      desc: 'Alcanza al menos nivel Explorador en los 11 métodos.',
      cond: function (s) {
        return Object.keys(NS.registry).filter(function (k) { return k !== 'calc'; })
          .every(function (k) { return met(s, k) && met(s, k).ejecuciones >= 1; });
      },
    },
    {
      id: 'medio-milenio', nombre: 'Medio Millar',
      desc: 'Acumula 500 puntos.',
      cond: function (s) { return s.puntos >= 500; },
    },
    {
      id: 'gran-maestro', nombre: 'Gran Maestro Numérico',
      desc: 'Domina (nivel Experto o más) los 11 métodos.',
      cond: function (s) {
        void s;
        return Object.keys(NS.registry).filter(function (k) { return k !== 'calc'; })
          .every(function (k) { return NS.store.mastery(k) >= 3; });
      },
    },
  ];

  NS.achievements = {
    lista: LISTA,
    evaluar: function (state) {
      return LISTA.filter(function (a) {
        if (state.logros[a.id]) return false;
        try { return a.cond(state); } catch (e) { return false; }
      });
    },
  };
})(globalThis.MNO = globalThis.MNO || {});
