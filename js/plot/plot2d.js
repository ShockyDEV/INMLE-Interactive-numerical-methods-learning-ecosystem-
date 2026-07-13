/* MNO.Plot2D — motor de gráficas 2D sobre canvas, sin dependencias.
   - Capa estática cacheada (rejilla + ejes + curvas) para animar a 60 fps.
   - Primitivas tipadas (point, seg, vline, band, polyline, lineEq, label).
   - Interacción: tap (con crosshair de teclado accesible), arrastre de puntos
     marcados como draggable, zoom con rueda / pellizco, y pan.
   Las coordenadas de las primitivas son SIEMPRE de mundo. */
(function (NS) {
  'use strict';

  const PAL = {
    grid: 'rgba(148,163,184,0.07)',
    axis: 'rgba(148,163,184,0.35)',
    tick: 'rgba(148,163,184,0.65)',
    crosshair: 'rgba(0,206,201,0.8)',
    principal: '#74b9ff',
    secundaria: '#a29bfe',
    identidad: 'rgba(148,163,184,0.55)',
    base: '#a29bfe',
    interpolante: '#00cec9',
    tangente: '#fdcb6e',
    secante: '#fdcb6e',
    cuerda: '#fdcb6e',
    intervalo: 'rgba(108,92,231,0.20)',
    descartado: 'rgba(214,72,72,0.13)',
    candidato: '#fdcb6e',
    extremo: '#74b9ff',
    siguiente: '#00e0b0',
    raiz: '#00e0b0',
    guia: 'rgba(148,163,184,0.5)',
    trayectoria: '#fd79a8',
    recta1: '#74b9ff',
    recta2: '#a29bfe',
    nodo: '#74b9ff',
    error: '#ff7675',
  };

  /* Paso "bonito" 1-2-5 para los ticks. */
  function niceStep(span, target) {
    const raw = span / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    let s;
    if (norm < 1.5) s = 1; else if (norm < 3.5) s = 2; else if (norm < 7.5) s = 5; else s = 10;
    return s * mag;
  }

  function fmtTick(v, step) {
    if (Math.abs(v) < step * 1e-6) return '0';
    const dec = Math.max(0, -Math.floor(Math.log10(step)) + (step < 1 ? 0 : 0));
    if (Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-4)) return v.toExponential(0).replace('+', '');
    return String(parseFloat(v.toFixed(Math.min(10, dec + 1))));
  }

  function Plot2D(canvas, opts) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({ interactive: true, square: false, pan: true }, opts || {});
    this.world = { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };
    this.fns = {};
    this.staticPrims = [];
    this.dynPrims = [];
    this.listeners = {};
    this.cross = null;          /* {sx, sy} crosshair de teclado */
    this._static = document.createElement('canvas');
    this._staticDirty = true;
    this._raf = 0;
    this._drag = null;
    this._pinch = null;
    this._resize();
    const self = this;
    this._ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(function () { self._resize(); }) : null;
    if (this._ro) this._ro.observe(canvas);
    if (this.opts.interactive) this._bind();
  }

  Plot2D.prototype = {

    /* ------------ geometría ------------ */
    _resize: function () {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const w = this.cv.clientWidth || 300, h = this.cv.clientHeight || 225;
      if (!w || !h) return;
      this.W = w; this.H = h; this.dpr = dpr;
      this.cv.width = Math.round(w * dpr);
      this.cv.height = Math.round(h * dpr);
      this._static.width = this.cv.width;
      this._static.height = this.cv.height;
      this._staticDirty = true;
      this.render();
    },

    setWorld: function (w) {
      let { xmin, xmax, ymin, ymax } = w;
      if (!(isFinite(xmin) && isFinite(xmax)) || xmax - xmin < 1e-12) { xmin = -5; xmax = 5; }
      if (!(isFinite(ymin) && isFinite(ymax)) || ymax - ymin < 1e-12) { ymin = -5; ymax = 5; }
      this.world = { xmin, xmax, ymin, ymax };
      this._staticDirty = true;
    },

    toScreen: function (wx, wy) {
      const w = this.world;
      return [
        (wx - w.xmin) / (w.xmax - w.xmin) * this.W,
        this.H - (wy - w.ymin) / (w.ymax - w.ymin) * this.H,
      ];
    },
    toWorld: function (sx, sy) {
      const w = this.world;
      return [
        w.xmin + sx / this.W * (w.xmax - w.xmin),
        w.ymin + (this.H - sy) / this.H * (w.ymax - w.ymin),
      ];
    },

    /* Autoencuadre: muestrea las curvas y cubre los puntos dinámicos. */
    autoscale: function (hints, prims) {
      const xmin = hints && isFinite(hints.xmin) ? hints.xmin : -5;
      const xmax = hints && isFinite(hints.xmax) ? hints.xmax : 5;
      const ys = [0];
      const all = (this.staticPrims || []).concat(prims || []);
      const self = this;
      all.forEach(function (p) {
        if (p.t === 'curve' && self.fns[p.fn]) {
          const fn = self.fns[p.fn];
          const samples = [];
          for (let i = 0; i <= 160; i++) {
            const v = fn(xmin + (xmax - xmin) * i / 160);
            if (isFinite(v)) samples.push(v);
          }
          samples.sort(function (a, b) { return a - b; });
          if (samples.length > 8) {
            /* recorte de percentiles para que las asíntotas no revienten la escala */
            ys.push(samples[Math.floor(samples.length * 0.04)]);
            ys.push(samples[Math.floor(samples.length * 0.96)]);
          } else {
            ys.push.apply(ys, samples);
          }
        }
        if (p.t === 'point' && isFinite(p.y)) ys.push(p.y);
        if (p.t === 'seg') { if (isFinite(p.y1)) ys.push(p.y1); if (isFinite(p.y2)) ys.push(p.y2); }
        if (p.t === 'polyline' && p.pts) p.pts.forEach(function (q) { if (isFinite(q[1])) ys.push(q[1]); });
      });
      let ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
      if (!isFinite(ymin) || !isFinite(ymax)) { ymin = -5; ymax = 5; }
      if (ymax - ymin < 1e-9) { ymin -= 1; ymax += 1; }
      const my = (ymax - ymin) * 0.14;
      ymin -= my; ymax += my;
      if (this.opts.square) {
        /* misma escala en ambos ejes (telaraña, plano de fases) */
        ymin = xmin; ymax = xmax;
      }
      this.setWorld({ xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax });
    },

    /* ------------ escena ------------ */
    setFns: function (fns) { this.fns = fns || {}; this._staticDirty = true; },

    setScene: function (fns, prims) {
      this.fns = fns || {};
      const stat = [], dyn = [];
      (prims || []).forEach(function (p) { (p.t === 'curve' ? stat : dyn).push(p); });
      this.staticPrims = stat;
      this.dynPrims = dyn;
      this._staticDirty = true;
    },

    setDynamic: function (prims) {
      const stat = [], dyn = [];
      (prims || []).forEach(function (p) { (p.t === 'curve' ? stat : dyn).push(p); });
      /* si cambian las curvas, hay que repintar la capa estática */
      const key = stat.map(function (p) { return p.fn + '|' + (p.cls || ''); }).join(';');
      if (key !== this._curveKey) { this.staticPrims = stat; this._staticDirty = true; this._curveKey = key; }
      this.dynPrims = dyn;
    },

    /* ------------ pintado ------------ */
    _renderStatic: function () {
      const c = this._static.getContext('2d');
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, this.W, this.H);
      const w = this.world;
      const xs = niceStep(w.xmax - w.xmin, this.W < 480 ? 6 : 9);
      const ysp = niceStep(w.ymax - w.ymin, this.H < 320 ? 5 : 7);

      c.font = '11px "Cascadia Code", Consolas, monospace';
      /* rejilla + ticks */
      c.strokeStyle = PAL.grid; c.fillStyle = PAL.tick; c.lineWidth = 1;
      for (let x = Math.ceil(w.xmin / xs) * xs; x <= w.xmax; x += xs) {
        const [sx] = this.toScreen(x, 0);
        c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx, this.H); c.stroke();
        c.fillText(fmtTick(x, xs), sx + 3, this.H - 5);
      }
      for (let y = Math.ceil(w.ymin / ysp) * ysp; y <= w.ymax; y += ysp) {
        const sy = this.toScreen(0, y)[1];
        c.beginPath(); c.moveTo(0, sy); c.lineTo(this.W, sy); c.stroke();
        c.fillText(fmtTick(y, ysp), 5, sy - 3);
      }
      /* ejes */
      c.strokeStyle = PAL.axis; c.lineWidth = 1.4;
      if (w.ymin <= 0 && w.ymax >= 0) {
        const sy = this.toScreen(0, 0)[1];
        c.beginPath(); c.moveTo(0, sy); c.lineTo(this.W, sy); c.stroke();
      }
      if (w.xmin <= 0 && w.xmax >= 0) {
        const sx = this.toScreen(0, 0)[0];
        c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx, this.H); c.stroke();
      }
      /* curvas con muestreo denso y corte en saltos/asíntotas */
      const self = this;
      this.staticPrims.forEach(function (p) {
        if (p.t !== 'curve' || !self.fns[p.fn]) return;
        const fn = self.fns[p.fn];
        c.strokeStyle = PAL[p.cls] || PAL.principal;
        c.lineWidth = p.cls === 'identidad' ? 1.2 : 2.2;
        c.setLineDash(p.cls === 'identidad' ? [5, 4] : []);
        c.globalAlpha = p._alpha !== undefined ? p._alpha : (p.cls === 'base' ? 0.85 : 1);
        c.beginPath();
        let pen = false, prevY = null;
        const n = Math.max(200, Math.floor(self.W / 2));
        const spanY = w.ymax - w.ymin;
        for (let i = 0; i <= n; i++) {
          const wx = w.xmin + (w.xmax - w.xmin) * i / n;
          const wy = fn(wx);
          if (!isFinite(wy)) { pen = false; prevY = null; continue; }
          /* corta el trazo en saltos enormes (asíntotas) */
          if (prevY !== null && Math.abs(wy - prevY) > spanY * 3) { pen = false; }
          const s = self.toScreen(wx, wy);
          if (!pen) { c.moveTo(s[0], s[1]); pen = true; } else { c.lineTo(s[0], s[1]); }
          prevY = wy;
        }
        c.stroke();
        c.setLineDash([]);
        c.globalAlpha = 1;
      });
      this._staticDirty = false;
    },

    render: function (prims) {
      if (prims) this.setDynamic(prims);
      if (!this.W) return;
      if (this._staticDirty) this._renderStatic();
      const c = this.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, this.cv.width, this.cv.height);
      c.drawImage(this._static, 0, 0);
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const self = this;
      /* bandas primero, luego líneas, luego puntos, luego etiquetas */
      const order = { band: 0, lineEq: 1, seg: 2, vline: 2, hline: 2, polyline: 3, point: 4, label: 5 };
      this.dynPrims.slice().sort(function (a, b) { return (order[a.t] || 0) - (order[b.t] || 0); })
        .forEach(function (p) { self._drawPrim(c, p); });
      if (this.cross) this._drawCross(c);
    },

    _drawPrim: function (c, p) {
      const col = PAL[p.cls] || '#ffffff';
      const alpha = p._alpha !== undefined ? p._alpha : 1;
      if (alpha <= 0.01) return;
      c.globalAlpha = alpha;
      const w = this.world;
      switch (p.t) {
        case 'band': {
          const [x1] = this.toScreen(Math.min(p.x1, p.x2), 0);
          const [x2] = this.toScreen(Math.max(p.x1, p.x2), 0);
          c.fillStyle = col;
          c.fillRect(x1, 0, Math.max(1, x2 - x1), this.H);
          c.strokeStyle = col.replace(/[\d.]+\)$/, '0.5)');
          break;
        }
        case 'vline': {
          const [sx] = this.toScreen(p.x, 0);
          c.strokeStyle = col; c.lineWidth = 1.2; c.setLineDash([5, 4]);
          c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx, this.H); c.stroke();
          c.setLineDash([]);
          if (p.label) { c.fillStyle = col; c.font = '11px sans-serif'; c.fillText(p.label, sx + 4, 14); }
          break;
        }
        case 'hline': {
          const sy = this.toScreen(0, p.y)[1];
          c.strokeStyle = col; c.lineWidth = 1.2; c.setLineDash([5, 4]);
          c.beginPath(); c.moveTo(0, sy); c.lineTo(this.W, sy); c.stroke();
          c.setLineDash([]);
          break;
        }
        case 'seg': {
          const a = this.toScreen(p.x1, p.y1), b = this.toScreen(p.x2, p.y2);
          if (p.extend) {
            /* prolonga la recta a todo el encuadre, tenue */
            const dx = b[0] - a[0], dy = b[1] - a[1];
            const L = Math.hypot(dx, dy) || 1;
            const ux = dx / L, uy = dy / L;
            const D = this.W + this.H;
            c.strokeStyle = col; c.lineWidth = 1; c.globalAlpha = alpha * 0.4;
            c.beginPath();
            c.moveTo(a[0] - ux * D, a[1] - uy * D);
            c.lineTo(b[0] + ux * D, b[1] + uy * D);
            c.stroke();
            c.globalAlpha = alpha;
          }
          c.strokeStyle = col; c.lineWidth = 2.2;
          c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
          break;
        }
        case 'lineEq': {
          /* recta a·x + b·y = c en todo el encuadre */
          const pts = [];
          if (Math.abs(p.b) > 1e-12) {
            const y1 = (p.c - p.a * w.xmin) / p.b, y2 = (p.c - p.a * w.xmax) / p.b;
            pts.push([w.xmin, y1], [w.xmax, y2]);
          } else if (Math.abs(p.a) > 1e-12) {
            const x = p.c / p.a;
            pts.push([x, w.ymin], [x, w.ymax]);
          } else break;
          const s1 = this.toScreen(pts[0][0], pts[0][1]), s2 = this.toScreen(pts[1][0], pts[1][1]);
          c.strokeStyle = col; c.lineWidth = 2;
          c.beginPath(); c.moveTo(s1[0], s1[1]); c.lineTo(s2[0], s2[1]); c.stroke();
          if (p.label) {
            c.fillStyle = col; c.font = '11px sans-serif';
            c.fillText(p.label, Math.min(this.W - 40, Math.max(4, (s1[0] + s2[0]) / 2)), Math.min(this.H - 6, Math.max(12, (s1[1] + s2[1]) / 2 - 6)));
          }
          break;
        }
        case 'polyline': {
          if (!p.pts || p.pts.length < 2) break;
          c.strokeStyle = col; c.lineWidth = 1.8;
          c.beginPath();
          let count = p.pts.length;
          let fracLast = null;
          if (p.upTo !== undefined && p.upTo < p.pts.length - 1) {
            count = Math.floor(p.upTo) + 1;
            fracLast = p.upTo - Math.floor(p.upTo);
          }
          const s0 = this.toScreen(p.pts[0][0], p.pts[0][1]);
          c.moveTo(s0[0], s0[1]);
          for (let i = 1; i < count; i++) {
            const s = this.toScreen(p.pts[i][0], p.pts[i][1]);
            c.lineTo(s[0], s[1]);
          }
          if (fracLast !== null && count < p.pts.length) {
            const a = p.pts[count - 1], b = p.pts[count];
            const mx = a[0] + (b[0] - a[0]) * fracLast, my = a[1] + (b[1] - a[1]) * fracLast;
            const s = this.toScreen(mx, my);
            c.lineTo(s[0], s[1]);
          }
          c.stroke();
          break;
        }
        case 'point': {
          if (!isFinite(p.x) || !isFinite(p.y)) break;
          const s = this.toScreen(p.x, p.y);
          const r = p.r || 5.5;
          if (p.cls === 'raiz' || p.cls === 'siguiente') {
            c.fillStyle = col; c.globalAlpha = alpha * 0.25;
            c.beginPath(); c.arc(s[0], s[1], r * 2.4, 0, 7); c.fill();
            c.globalAlpha = alpha;
          }
          c.fillStyle = col;
          c.beginPath(); c.arc(s[0], s[1], r, 0, 7); c.fill();
          c.strokeStyle = 'rgba(10,12,20,0.9)'; c.lineWidth = 1.5;
          c.beginPath(); c.arc(s[0], s[1], r, 0, 7); c.stroke();
          if (p.drag) {
            c.strokeStyle = col; c.globalAlpha = alpha * 0.55; c.setLineDash([3, 3]);
            c.beginPath(); c.arc(s[0], s[1], r + 5, 0, 7); c.stroke();
            c.setLineDash([]); c.globalAlpha = alpha;
          }
          if (p.label) {
            c.fillStyle = col; c.font = 'bold 11.5px sans-serif';
            c.fillText(p.label, s[0] + r + 4, s[1] - r - 2);
          }
          break;
        }
        case 'label': {
          const s = this.toScreen(p.x, p.y);
          c.fillStyle = col; c.font = '12px sans-serif';
          c.fillText(p.text, s[0], s[1]);
          break;
        }
      }
      c.globalAlpha = 1;
    },

    _drawCross: function (c) {
      const { sx, sy } = this.cross;
      c.strokeStyle = PAL.crosshair; c.lineWidth = 1; c.setLineDash([4, 3]);
      c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx, this.H); c.stroke();
      c.beginPath(); c.moveTo(0, sy); c.lineTo(this.W, sy); c.stroke();
      c.setLineDash([]);
      const [wx, wy] = this.toWorld(sx, sy);
      c.fillStyle = PAL.crosshair; c.font = '11px "Cascadia Code", Consolas, monospace';
      const txt = '(' + NS.num.fmt(wx, 4) + ', ' + NS.num.fmt(wy, 4) + ')';
      c.fillText(txt, Math.min(sx + 8, this.W - 90), Math.max(14, sy - 8));
    },

    /* ------------ eventos ------------ */
    on: function (ev, cb) { (this.listeners[ev] = this.listeners[ev] || []).push(cb); return this; },
    emit: function (ev, data) { (this.listeners[ev] || []).forEach(function (cb) { cb(data); }); },

    _hitDraggable: function (sx, sy) {
      let best = null, bd = 20;
      const self = this;
      this.dynPrims.forEach(function (p) {
        if (p.t === 'point' && p.drag) {
          const s = self.toScreen(p.x, p.y);
          const d = Math.hypot(s[0] - sx, s[1] - sy);
          if (d < bd) { bd = d; best = p; }
        }
      });
      return best;
    },

    _pos: function (e) {
      const r = this.cv.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    },

    _bind: function () {
      const self = this, cv = this.cv;
      cv.style.touchAction = 'none';
      cv.tabIndex = 0;
      this._ptrs = new Map();

      cv.addEventListener('pointerdown', function (e) {
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* eventos sintéticos */ }
        const [sx, sy] = self._pos(e);
        self._ptrs.set(e.pointerId, [sx, sy]);
        if (self._ptrs.size === 2) {
          const pts = Array.from(self._ptrs.values());
          self._pinch = { d0: Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]), w0: Object.assign({}, self.world) };
          self._drag = null;
          return;
        }
        const hit = self._hitDraggable(sx, sy);
        self._drag = { sx: sx, sy: sy, moved: false, prim: hit, w0: Object.assign({}, self.world) };
        if (hit) self.emit('dragstart', { prim: hit });
      });

      cv.addEventListener('pointermove', function (e) {
        const [sx, sy] = self._pos(e);
        if (self._ptrs.has(e.pointerId)) self._ptrs.set(e.pointerId, [sx, sy]);
        if (self._pinch && self._ptrs.size === 2) {
          const pts = Array.from(self._ptrs.values());
          const d = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
          const f = self._pinch.d0 / Math.max(20, d);
          const w0 = self._pinch.w0;
          const cxw = (w0.xmin + w0.xmax) / 2, cyw = (w0.ymin + w0.ymax) / 2;
          self.setWorld({
            xmin: cxw - (cxw - w0.xmin) * f, xmax: cxw + (w0.xmax - cxw) * f,
            ymin: cyw - (cyw - w0.ymin) * f, ymax: cyw + (w0.ymax - cyw) * f,
          });
          self.render();
          return;
        }
        if (self._drag) {
          const dx = sx - self._drag.sx, dy = sy - self._drag.sy;
          if (Math.hypot(dx, dy) > 4) self._drag.moved = true;
          if (self._drag.prim) {
            const [wx, wy] = self.toWorld(sx, sy);
            self.emit('drag', { prim: self._drag.prim, wx: wx, wy: wy });
          } else if (self._drag.moved && self.opts.pan) {
            const w0 = self._drag.w0;
            const wdx = dx / self.W * (w0.xmax - w0.xmin);
            const wdy = -dy / self.H * (w0.ymax - w0.ymin);
            self.setWorld({ xmin: w0.xmin - wdx, xmax: w0.xmax - wdx, ymin: w0.ymin - wdy, ymax: w0.ymax - wdy });
            self.render();
          }
        } else {
          self.emit('hover', { sxy: [sx, sy], wxy: self.toWorld(sx, sy) });
        }
      });

      function up(e) {
        self._ptrs.delete(e.pointerId);
        if (self._ptrs.size < 2) self._pinch = null;
        if (self._drag) {
          if (self._drag.prim) self.emit('dragend', { prim: self._drag.prim });
          else if (!self._drag.moved) {
            const [sx, sy] = self._pos(e);
            const [wx, wy] = self.toWorld(sx, sy);
            self.emit('tap', { wx: wx, wy: wy, sx: sx, sy: sy });
          }
          self._drag = null;
        }
      }
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);

      cv.addEventListener('wheel', function (e) {
        e.preventDefault();
        const [sx, sy] = self._pos(e);
        const [wx, wy] = self.toWorld(sx, sy);
        const f = e.deltaY > 0 ? 1.15 : 1 / 1.15;
        const w = self.world;
        self.setWorld({
          xmin: wx - (wx - w.xmin) * f, xmax: wx + (w.xmax - wx) * f,
          ymin: wy - (wy - w.ymin) * f, ymax: wy + (w.ymax - wy) * f,
        });
        self.render();
      }, { passive: false });

      /* Accesibilidad: crosshair con flechas + Enter = tap */
      cv.addEventListener('keydown', function (e) {
        const stepPx = e.shiftKey ? 2 : 12;
        if (!self.cross) self.cross = { sx: self.W / 2, sy: self.H / 2 };
        let used = true;
        switch (e.key) {
          case 'ArrowLeft': self.cross.sx -= stepPx; break;
          case 'ArrowRight': self.cross.sx += stepPx; break;
          case 'ArrowUp': self.cross.sy -= stepPx; break;
          case 'ArrowDown': self.cross.sy += stepPx; break;
          case 'Enter': {
            const [wx, wy] = self.toWorld(self.cross.sx, self.cross.sy);
            self.emit('tap', { wx: wx, wy: wy, sx: self.cross.sx, sy: self.cross.sy, teclado: true });
            break;
          }
          case 'Escape': self.cross = null; break;
          default: used = false;
        }
        if (used) {
          e.preventDefault();
          if (self.cross) {
            self.cross.sx = Math.max(0, Math.min(self.W, self.cross.sx));
            self.cross.sy = Math.max(0, Math.min(self.H, self.cross.sy));
          }
          self.render();
        }
      });
      cv.addEventListener('blur', function () { self.cross = null; self.render(); });
    },

    destroy: function () {
      if (this._ro) this._ro.disconnect();
      this.listeners = {};
    },
  };

  NS.Plot2D = Plot2D;
  NS.plotPalette = PAL;
})(globalThis.MNO = globalThis.MNO || {});
