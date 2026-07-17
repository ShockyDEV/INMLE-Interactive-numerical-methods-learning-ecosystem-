/* MNO.glyphs — glifos generativos: cada método se identifica con un pequeño
   dibujo hecho con SU propia matemática (la tangente de Newton, la telaraña
   del punto fijo, la triangulación de Gauss…), en la misma paleta que las
   gráficas. Nada de emojis: iconografía nacida del contenido. */
(function (NS) {
  'use strict';

  /* Cada dibujante recibe (c, s, P): contexto, lado en px CSS y paleta. */
  const DIBUJOS = {

    biseccion: function (c, s, P) {
      const y = s * 0.62;
      c.strokeStyle = P.axis; c.lineWidth = 1;
      linea(c, s * 0.08, y, s * 0.92, y);
      /* corchetes anidados que se estrechan hacia la raíz */
      const niveles = [[0.12, 0.88], [0.12, 0.5], [0.31, 0.5]];
      niveles.forEach(function (iv, i) {
        const yy = y - s * (0.34 - i * 0.11);
        c.strokeStyle = i === 2 ? P.candidato : P.principal;
        c.lineWidth = 1.6;
        c.globalAlpha = 0.55 + i * 0.22;
        linea(c, s * iv[0], yy, s * iv[1], yy);
        tick(c, s * iv[0], yy, 3.5); tick(c, s * iv[1], yy, 3.5);
      });
      c.globalAlpha = 1;
      punto(c, s * 0.405, y, 2.6, P.raiz);
    },

    cuerda: function (c, s, P) {
      ejes(c, s, P);
      curva(c, s, P.principal, function (t) { return 0.86 - 0.95 * t * t; }, 0.06, 0.94);
      c.strokeStyle = P.cuerda; c.lineWidth = 1.6;
      linea(c, s * 0.08, s * (1 - 0.84), s * 0.9, s * (1 - 0.12));
      punto(c, s * 0.62, s * 0.475, 2.4, P.candidato);
    },

    puntofijo: function (c, s, P) {
      c.strokeStyle = P.identidad; c.lineWidth = 1;
      linea(c, s * 0.1, s * 0.9, s * 0.9, s * 0.1); /* diagonal y=x */
      c.strokeStyle = P.trayectoria; c.lineWidth = 1.6;
      /* telaraña en espiral hacia el centro */
      let x = 0.82, tam = 0.52;
      c.beginPath();
      c.moveTo(s * x, s * (1 - (1 - x)));
      for (let i = 0; i < 6; i++) {
        const nx = 1 - x + (i % 2 ? tam * 0.18 : -tam * 0.18);
        if (i % 2 === 0) c.lineTo(s * x, s * (1 - nx));
        else c.lineTo(s * nx, s * (1 - (1 - x)));
        if (i % 2 === 0) x = 1 - nx; else x = nx;
        tam *= 0.62;
      }
      c.stroke();
      punto(c, s * 0.5, s * 0.5, 2.6, P.raiz);
    },

    newton: function (c, s, P) {
      ejes(c, s, P);
      curva(c, s, P.principal, function (t) { return 0.9 - 1.15 * t * t; }, 0.08, 0.9);
      /* tangente que corta al eje */
      c.strokeStyle = P.tangente; c.lineWidth = 1.6;
      linea(c, s * 0.2, s * 0.2, s * 0.88, s * 0.78);
      punto(c, s * 0.47, s * 0.43, 2.6, P.candidato);
      punto(c, s * 0.79, s * 0.7, 2.6, P.raiz);
    },

    secante: function (c, s, P) {
      ejes(c, s, P);
      curva(c, s, P.principal, function (t) { return 0.88 - 1.05 * t * t; }, 0.08, 0.92);
      c.strokeStyle = P.secante; c.lineWidth = 1.6;
      linea(c, s * 0.14, s * 0.24, s * 0.92, s * 0.86);
      punto(c, s * 0.3, s * 0.37, 2.5, P.candidato);
      punto(c, s * 0.62, s * 0.62, 2.5, P.candidato);
    },

    gauss: function (c, s, P) {
      /* matriz triangulada: diagonal firme, debajo se vacía */
      const paso = s * 0.26, x0 = s * 0.24, y0 = s * 0.24;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const x = x0 + j * paso, y = y0 + i * paso;
          if (i === j) punto(c, x, y, 3.2, P.principal);
          else if (j > i) punto(c, x, y, 2.4, P.axis);
          else { c.strokeStyle = P.tangente; c.lineWidth = 1.3; circulo(c, x, y, 2.6); }
        }
      }
    },

    jacobi: function (c, s, P) {
      rectas2(c, s, P);
      /* saltos en diagonal, todos a la vez */
      c.strokeStyle = P.trayectoria; c.lineWidth = 1.4;
      c.setLineDash([3, 2.4]);
      linea(c, s * 0.14, s * 0.86, s * 0.52, s * 0.5);
      c.setLineDash([]);
      punto(c, s * 0.14, s * 0.86, 2.4, P.candidato);
      punto(c, s * 0.34, s * 0.67, 2.4, P.candidato);
      punto(c, s * 0.52, s * 0.5, 2.8, P.raiz);
    },

    seidel: function (c, s, P) {
      rectas2(c, s, P);
      /* escalera: eje a eje */
      c.strokeStyle = P.trayectoria; c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(s * 0.14, s * 0.86);
      c.lineTo(s * 0.44, s * 0.86);
      c.lineTo(s * 0.44, s * 0.62);
      c.lineTo(s * 0.52, s * 0.62);
      c.lineTo(s * 0.52, s * 0.5);
      c.stroke();
      punto(c, s * 0.52, s * 0.5, 2.8, P.raiz);
    },

    lagrange: function (c, s, P) {
      const pts = [[0.12, 0.7], [0.38, 0.3], [0.66, 0.58], [0.9, 0.22]];
      curvaPor(c, s, P.interpolante, pts);
      pts.forEach(function (p) { punto(c, s * p[0], s * (1 - p[1] * 0.9 - 0.05) , 2.6, P.nodo); });
    },

    newtoni: function (c, s, P) {
      /* tabla triangular de diferencias divididas */
      const x0 = s * 0.2, y0 = s * 0.22, dx = s * 0.24, dy = s * 0.19;
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 4 - j; i++) {
          const x = x0 + j * dx, y = y0 + (i + j * 0.5) * dy * 1.35;
          punto(c, x, y, j === 0 ? 2.6 : 2.2, i === 0 ? P.principal : P.axis);
        }
      }
      c.strokeStyle = P.principal; c.lineWidth = 1;
      c.globalAlpha = 0.5;
      linea(c, x0 + 2, y0, x0 + 3 * dx - 2, y0 + 3 * 0.5 * dy * 1.35);
      c.globalAlpha = 1;
    },

    hermite: function (c, s, P) {
      const a = [0.2, 0.68], b = [0.8, 0.3];
      curvaPor(c, s, P.interpolante, [a, [0.5, 0.62], b]);
      /* nodos con su tangente marcada: valor Y pendiente */
      c.strokeStyle = P.tangente; c.lineWidth = 1.6;
      linea(c, s * (a[0] - 0.1), s * (1 - a[1] * 0.9 - 0.05) + 6, s * (a[0] + 0.1), s * (1 - a[1] * 0.9 - 0.05) - 6);
      linea(c, s * (b[0] - 0.1), s * (1 - b[1] * 0.9 - 0.05) - 2, s * (b[0] + 0.1), s * (1 - b[1] * 0.9 - 0.05) + 2);
      punto(c, s * a[0], s * (1 - a[1] * 0.9 - 0.05), 2.8, P.nodo);
      punto(c, s * b[0], s * (1 - b[1] * 0.9 - 0.05), 2.8, P.nodo);
    },

    calc: function (c, s, P) {
      ejes(c, s, P);
      curva(c, s, P.principal, function (t) { return 0.5 + 0.32 * Math.sin(t * 6.2); }, 0.08, 0.92);
      c.strokeStyle = P.crosshair; c.lineWidth = 1;
      c.setLineDash([2.5, 2.5]);
      linea(c, s * 0.55, s * 0.1, s * 0.55, s * 0.9);
      c.setLineDash([]);
    },

    carrera: function (c, s, P) {
      const ys = [0.26, 0.5, 0.74];
      ys.forEach(function (y, i) {
        c.strokeStyle = P.axis; c.lineWidth = 1;
        c.globalAlpha = 0.5;
        linea(c, s * 0.1, s * y, s * 0.9, s * y);
        c.globalAlpha = 1;
        punto(c, s * (0.3 + i * 0.24), s * y, 2.8, P.serie[i]);
      });
    },

    progreso: function (c, s, P) {
      const alturas = [0.3, 0.55, 0.42, 0.75];
      alturas.forEach(function (h, i) {
        c.fillStyle = i === 3 ? P.principal : P.axis;
        c.fillRect(s * (0.16 + i * 0.19), s * (0.85 - h * 0.6), s * 0.11, s * h * 0.6);
      });
    },
  };

  /* ---------- utilidades de dibujo ---------- */
  function linea(c, x1, y1, x2, y2) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  function punto(c, x, y, r, color) {
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  function circulo(c, x, y, r) {
    c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
  }
  function tick(c, x, y, h) {
    c.beginPath(); c.moveTo(x, y - h); c.lineTo(x, y + h); c.stroke();
  }
  function ejes(c, s, P) {
    c.strokeStyle = P.axis; c.lineWidth = 1;
    linea(c, s * 0.06, s * 0.78, s * 0.94, s * 0.78);
  }
  function rectas2(c, s, P) {
    c.lineWidth = 1.3;
    c.strokeStyle = P.recta1;
    linea(c, s * 0.08, s * 0.28, s * 0.92, s * 0.66);
    c.strokeStyle = P.recta2;
    linea(c, s * 0.2, s * 0.9, s * 0.78, s * 0.12);
  }
  function curva(c, s, color, f, t0, t1) {
    c.strokeStyle = color; c.lineWidth = 1.7;
    c.beginPath();
    for (let i = 0; i <= 28; i++) {
      const t = t0 + (t1 - t0) * i / 28;
      const y = s * (1 - f(t) * 0.82 - 0.06);
      if (i === 0) c.moveTo(s * t, y); else c.lineTo(s * t, y);
    }
    c.stroke();
  }
  function curvaPor(c, s, color, pts) {
    /* curva suave por puntos (catmull-rom aproximada con cuadráticas) */
    c.strokeStyle = color; c.lineWidth = 1.7;
    c.beginPath();
    const P = pts.map(function (p) { return [s * p[0], s * (1 - p[1] * 0.9 - 0.05)]; });
    c.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < P.length; i++) {
      const xm = (P[i - 1][0] + P[i][0]) / 2, ym = (P[i - 1][1] + P[i][1]) / 2;
      c.quadraticCurveTo(P[i - 1][0], P[i - 1][1], xm, ym);
    }
    c.lineTo(P[P.length - 1][0], P[P.length - 1][1]);
    c.stroke();
  }

  /* ---------- API ---------- */
  NS.glyphs = {
    /* Pinta el glifo del método dentro de un canvas (creándolo si hace falta). */
    into: function (el, id, sizeCss) {
      let cv = el.tagName === 'CANVAS' ? el : el.querySelector('canvas');
      if (!cv) {
        cv = document.createElement('canvas');
        cv.setAttribute('aria-hidden', 'true');
        el.appendChild(cv);
      }
      const s = sizeCss || el.clientWidth || 48;
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      cv.width = Math.round(s * dpr);
      cv.height = Math.round(s * dpr);
      cv.style.width = s + 'px';
      cv.style.height = s + 'px';
      const c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, s, s);
      c.lineCap = 'round';
      c.lineJoin = 'round';
      const fn = DIBUJOS[id] || DIBUJOS.calc;
      fn(c, s, NS.plotPalette());
      return cv;
    },
  };
})(globalThis.MNO = globalThis.MNO || {});
