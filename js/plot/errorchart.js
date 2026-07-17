/* MNO.ErrorChart — gráfico log₁₀|error| vs iteración, multi-serie.
   La pendiente de cada serie ES el orden de convergencia hecho visible:
   recta suave = lineal, curva que se despeña = cuadrática. */
(function (NS) {
  'use strict';

  function ErrorChart(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.series = [];
    this.cursorK = null;
    const self = this;
    this._ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(function () { self.render(); }) : null;
    if (this._ro) this._ro.observe(canvas);
  }

  ErrorChart.prototype = {
    /* series: [{label, color, data:[{k, err}]}] */
    setSeries: function (series) { this.series = series || []; this.render(); },
    setCursor: function (k) { this.cursorK = k; this.render(); },

    render: function () {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const W = this.cv.clientWidth, H = this.cv.clientHeight;
      if (!W || !H) return;
      this.cv.width = Math.round(W * dpr);
      this.cv.height = Math.round(H * dpr);
      const c = this.ctx;
      const P = NS.plotPalette ? NS.plotPalette() : { grid: '#ccc', tick: '#888', crosshair: '#1b49c8' };
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);

      const padL = 46, padR = 10, padT = 10, padB = 22;
      let kmax = 1, lmin = 0, lmax = -16;
      this.series.forEach(function (s) {
        s.data.forEach(function (d) {
          kmax = Math.max(kmax, d.k);
          const l = Math.log10(Math.max(1e-16, Math.abs(d.err)));
          lmin = Math.min(lmin, l);
          lmax = Math.max(lmax, l);
        });
      });
      if (lmax <= lmin) { lmax = 1; lmin = -8; }
      lmax = Math.ceil(lmax); lmin = Math.floor(lmin);

      const sx = function (k) { return padL + (k - 1) / Math.max(1, kmax - 1) * (W - padL - padR); };
      const sy = function (l) { return padT + (lmax - l) / (lmax - lmin) * (H - padT - padB); };

      /* rejilla horizontal: potencias de 10 */
      c.font = '10px "Plex Mono", Consolas, monospace';
      const stepL = Math.max(1, Math.ceil((lmax - lmin) / 6));
      for (let l = lmax; l >= lmin; l -= stepL) {
        const y = sy(l);
        c.strokeStyle = P.grid;
        c.beginPath(); c.moveTo(padL, y); c.lineTo(W - padR, y); c.stroke();
        c.fillStyle = P.tick;
        c.fillText('1e' + l, 4, y + 3);
      }
      /* eje x: iteraciones */
      const stepK = Math.max(1, Math.ceil(kmax / 10));
      c.fillStyle = P.tick;
      for (let k = 1; k <= kmax; k += stepK) c.fillText(String(k), sx(k) - 3, H - 6);

      /* cursor del paso actual */
      if (this.cursorK !== null && this.cursorK >= 1) {
        c.strokeStyle = P.crosshair; c.globalAlpha = 0.55; c.setLineDash([4, 3]);
        c.beginPath(); c.moveTo(sx(this.cursorK), padT); c.lineTo(sx(this.cursorK), H - padB); c.stroke();
        c.setLineDash([]); c.globalAlpha = 1;
      }

      /* series */
      this.series.forEach(function (s) {
        c.strokeStyle = s.color; c.lineWidth = 2;
        c.beginPath();
        s.data.forEach(function (d, i) {
          const x = sx(d.k), y = sy(Math.log10(Math.max(1e-16, Math.abs(d.err))));
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        });
        c.stroke();
        c.fillStyle = s.color;
        s.data.forEach(function (d) {
          const x = sx(d.k), y = sy(Math.log10(Math.max(1e-16, Math.abs(d.err))));
          c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill();
        });
      });

      /* leyenda */
      let lx = padL + 6;
      const self = this;
      this.series.forEach(function (s) {
        c.fillStyle = s.color;
        c.fillRect(lx, padT + 2, 10, 3);
        c.fillStyle = P.tick;
        c.font = '11px "Plex Sans", sans-serif';
        c.fillText(s.label, lx + 14, padT + 8);
        lx += 14 + c.measureText(s.label).width + 16;
        void self;
      });
    },

    destroy: function () { if (this._ro) this._ro.disconnect(); },
  };

  NS.ErrorChart = ErrorChart;
})(globalThis.MNO = globalThis.MNO || {});
