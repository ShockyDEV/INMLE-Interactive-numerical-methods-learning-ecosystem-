/* MNO.MatrixView — matrices como rejilla DOM (no canvas): fáciles de animar
   con CSS (flash de celdas, ceros que hacen pop, badge del multiplicador que
   vuela de la fila pivote a la destino) y accesibles. Renderiza directamente
   los pasos de la familia 'linear' y las tablas de diferencias divididas. */
(function (NS) {
  'use strict';

  const fmt = function (v, d) { return v === null || v === undefined ? '' : NS.num.fmt(v, d === undefined ? 5 : d); };

  function MatrixView(container) {
    this.el = container;
    this.el.classList.add('mv');
  }

  MatrixView.prototype = {

    clear: function () { this.el.innerHTML = ''; },

    /* Punto de entrada: entiende los pasos de gauss/jacobi/seidel/interp-dd. */
    render: function (step, trace) {
      this.clear();
      if (!step) return;
      if (step.tabla !== undefined && step.tabla !== null) { this._ddTable(step, trace); return; }
      if (step.type === 'sweep' || (step.type === 'final' && step.xNew && trace && (trace.method === 'jacobi' || trace.method === 'seidel'))) {
        this._sweep(step, trace);
        return;
      }
      if (step.L && step.U && step.type === 'lu') { this._lu(step); return; }
      if (step.M) { this._gauss(step); return; }
      if (step.dd) { this._ddCheck(step, trace); return; }
    },

    _matGrid: function (M, aug, highlights, oldRow, opRow) {
      const n = M.length, cols = M[0].length;
      const grid = document.createElement('div');
      grid.className = 'mv-grid';
      grid.style.gridTemplateColumns = 'repeat(' + cols + ', auto)';
      const hlMap = {};
      (highlights || []).forEach(function (h) {
        if (h.c === -1 || h.c === '*') { for (let c = 0; c < cols; c++) hlMap[h.r + ',' + c] = h.cls; }
        else hlMap[h.r + ',' + h.c] = h.cls;
      });
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = document.createElement('div');
          cell.className = 'mv-cell';
          if (aug && c === cols - 1) cell.classList.add('mv-aug');
          const hl = hlMap[r + ',' + c];
          if (hl) cell.classList.add('mv-' + hl);
          cell.textContent = fmt(M[r][c]);
          if (oldRow && opRow === r) {
            /* muestra el valor anterior tachado pequeñito */
            const old = document.createElement('span');
            old.className = 'mv-old';
            old.textContent = fmt(oldRow[c]);
            if (Math.abs((oldRow[c] || 0) - M[r][c]) > 1e-12) cell.prepend(old);
          }
          grid.appendChild(cell);
        }
      }
      return grid;
    },

    _gauss: function (step) {
      const wrap = document.createElement('div');
      wrap.className = 'mv-wrap';
      const grid = this._matGrid(step.M, step.aug, step.highlights, step.oldRow, step.op ? step.op.i : null);
      wrap.appendChild(grid);
      /* badge del multiplicador que "vuela" de la fila fuente a la destino */
      if (step.op && step.op.kind === 'rowSub') {
        const badge = document.createElement('div');
        badge.className = 'mv-badge';
        badge.textContent = '× ' + fmt(step.op.m, 5);
        wrap.appendChild(badge);
        const cols = step.M[0].length;
        requestAnimationFrame(function () {
          const cellK = grid.children[step.op.k * cols];
          const cellI = grid.children[step.op.i * cols];
          if (!cellK || !cellI) return;
          badge.style.top = (cellK.offsetTop + 2) + 'px';
          badge.style.left = (grid.offsetLeft + grid.offsetWidth + 10) + 'px';
          badge.classList.add('listo');
          requestAnimationFrame(function () {
            badge.style.top = (cellI.offsetTop + 2) + 'px';
          });
        });
        /* pop del cero recién creado */
        requestAnimationFrame(function () {
          grid.querySelectorAll('.mv-cero-nuevo').forEach(function (c) { c.classList.add('pop'); });
        });
      }
      if (step.X) wrap.appendChild(this._xCol(step.X));
      this.el.appendChild(wrap);
    },

    _xCol: function (X) {
      const box = document.createElement('div');
      box.className = 'mv-xcol';
      const tit = document.createElement('div');
      tit.className = 'mv-xtit';
      tit.textContent = 'X';
      box.appendChild(tit);
      X.forEach(function (v, i) {
        const c = document.createElement('div');
        c.className = 'mv-cell' + (v === null ? ' mv-vacio' : ' mv-xval');
        c.textContent = v === null ? '·' : fmt(v, 6);
        void i;
        box.appendChild(c);
      });
      return box;
    },

    _lu: function (step) {
      const wrap = document.createElement('div');
      wrap.className = 'mv-wrap mv-lu';
      const self = this;
      [['L', step.L], ['U', step.U]].forEach(function (par) {
        const box = document.createElement('div');
        const tit = document.createElement('div');
        tit.className = 'mv-xtit';
        tit.textContent = par[0];
        box.appendChild(tit);
        box.appendChild(self._matGrid(par[1], false, []));
        wrap.appendChild(box);
      });
      this.el.appendChild(wrap);
    },

    _sweep: function (step, trace) {
      const wrap = document.createElement('div');
      wrap.className = 'mv-sweepbox';
      const n = step.xNew.length;
      const vn = NS.num.varNames(n);
      const maxDelta = step.deltas ? Math.max.apply(null, step.deltas.concat([1e-12])) : 1;
      for (let i = 0; i < n; i++) {
        const fila = document.createElement('div');
        fila.className = 'mv-vrow';
        const nom = document.createElement('span');
        nom.className = 'mv-varname';
        nom.textContent = vn[i].replace(/[_{}]/g, '');
        fila.appendChild(nom);
        if (step.xOld) {
          const oldv = document.createElement('span');
          oldv.className = 'mv-vold';
          oldv.textContent = fmt(step.xOld[i], 5);
          fila.appendChild(oldv);
          const arr = document.createElement('span');
          arr.className = 'mv-varrow';
          arr.textContent = '→';
          fila.appendChild(arr);
        }
        const nue = document.createElement('span');
        nue.className = 'mv-vnew';
        nue.textContent = fmt(step.xNew[i], 6);
        fila.appendChild(nue);
        if (step.deltas) {
          const barbox = document.createElement('span');
          barbox.className = 'mv-dbar';
          const bar = document.createElement('span');
          const frac = Math.min(1, step.deltas[i] / maxDelta);
          bar.style.width = Math.max(3, frac * 100) + '%';
          bar.style.background = 'hsl(' + Math.round(140 - 140 * frac) + ' 70% 45%)';
          barbox.appendChild(bar);
          fila.appendChild(barbox);
          const dtx = document.createElement('span');
          dtx.className = 'mv-dtxt';
          dtx.textContent = 'Δ ' + fmt(step.deltas[i], 4);
          fila.appendChild(dtx);
        }
        wrap.appendChild(fila);
        void trace;
      }
      this.el.appendChild(wrap);
    },

    /* Tabla triangular de diferencias divididas (Newton-I / Hermite). */
    _ddTable: function (step, trace) {
      const tabla = step.tabla;
      const nd = step.nodos || (trace && trace.inputs.nodes) || [];
      const n = tabla.length;
      const box = document.createElement('div');
      box.className = 'mv-ddbox';
      const grid = document.createElement('div');
      grid.className = 'mv-grid mv-dd';
      grid.style.gridTemplateColumns = 'auto repeat(' + n + ', auto)';
      /* cabecera */
      const h0 = document.createElement('div');
      h0.className = 'mv-cell mv-cab';
      h0.textContent = 'xᵢ';
      grid.appendChild(h0);
      for (let j = 0; j < n; j++) {
        const h = document.createElement('div');
        h.className = 'mv-cell mv-cab';
        h.textContent = j === 0 ? 'f[·]' : 'orden ' + j;
        grid.appendChild(h);
      }
      const celda = step.celda;
      for (let i = 0; i < n; i++) {
        const nodo = document.createElement('div');
        nodo.className = 'mv-cell mv-nodo';
        nodo.textContent = fmt(nd[i], 4);
        grid.appendChild(nodo);
        for (let j = 0; j < n; j++) {
          const cell = document.createElement('div');
          cell.className = 'mv-cell';
          const v = tabla[i][j];
          cell.textContent = v === null ? '' : fmt(v, 5);
          if (v === null) cell.classList.add('mv-vacio');
          if (celda) {
            if (celda.i === i && celda.j === j) {
              cell.classList.add(celda.esDerivada ? 'mv-derivada' : 'mv-nueva');
              requestAnimationFrame(function () { cell.classList.add('pop'); });
            }
            (celda.padres || []).forEach(function (par) {
              if (par[0] === i && par[1] === j) cell.classList.add('mv-padre');
            });
          }
          if (step.coefs && i === 0) cell.classList.add('mv-coef');
          grid.appendChild(cell);
        }
      }
      box.appendChild(grid);
      if (celda && celda.esDerivada) {
        const nota = document.createElement('div');
        nota.className = 'mv-nota';
        nota.textContent = '● celda con regla de derivada (nodos repetidos)';
        box.appendChild(nota);
      }
      this.el.appendChild(box);
    },

    _ddCheck: function (step) {
      /* dominancia diagonal: barras |aii| vs suma del resto */
      const dd = step.dd;
      if (!dd) return;
      const box = document.createElement('div');
      box.className = 'mv-ddom';
      dd.porFila.forEach(function (f) {
        const fila = document.createElement('div');
        fila.className = 'mv-vrow';
        const nom = document.createElement('span');
        nom.className = 'mv-varname';
        nom.textContent = 'F' + (f.i + 1);
        fila.appendChild(nom);
        const total = Math.max(f.diag, f.suma, 1e-9);
        [['|diag|', f.diag, f.ok ? NS.plotPalette().ok : NS.plotPalette().bad], ['Σ resto', f.suma, NS.plotPalette().muted]].forEach(function (par) {
          const barbox = document.createElement('span');
          barbox.className = 'mv-dbar mv-dbar-l';
          const bar = document.createElement('span');
          bar.style.width = Math.max(3, par[1] / total * 100) + '%';
          bar.style.background = par[2];
          barbox.appendChild(bar);
          const lbl = document.createElement('span');
          lbl.className = 'mv-dtxt';
          lbl.textContent = par[0] + ' = ' + fmt(par[1], 3);
          fila.appendChild(barbox);
          fila.appendChild(lbl);
        });
        const res = document.createElement('span');
        res.className = 'mv-dtxt';
        res.textContent = f.ok ? '✓' : '✗';
        res.style.color = f.ok ? NS.plotPalette().ok : NS.plotPalette().bad;
        fila.appendChild(res);
        box.appendChild(fila);
      });
      this.el.appendChild(box);
    },
  };

  NS.MatrixView = MatrixView;
})(globalThis.MNO = globalThis.MNO || {});
