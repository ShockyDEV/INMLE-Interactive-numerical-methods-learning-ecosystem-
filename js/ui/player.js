/* MNO.StepPlayer — reproductor de pasos: ⏮ ⏪ ▶/⏸ ⏩ + barra + velocidad.
   Un único emisor de eventos 'step' sincroniza el canvas, el panel de pasos
   y el gráfico de error: imposible que se desincronicen. */
(function (NS) {
  'use strict';

  function StepPlayer(container) {
    this.el = container;
    this.trace = null;
    this.i = 0;
    this.playing = false;
    this.speed = 1;
    this.listeners = {};
    this._timer = 0;
    this._build();
  }

  const SPEEDS = [0.5, 1, 2, 4];

  StepPlayer.prototype = {
    _build: function () {
      const self = this;
      this.el.classList.add('player');
      this.el.innerHTML =
        '<button class="pl-btn" data-a="reset" title="Al inicio" aria-label="Al inicio">⏮</button>' +
        '<button class="pl-btn" data-a="prev" title="Paso anterior" aria-label="Anterior">◀</button>' +
        '<button class="pl-btn pl-play" data-a="toggle" title="Reproducir/Pausa" aria-label="Reproducir">▶</button>' +
        '<button class="pl-btn" data-a="next" title="Paso siguiente" aria-label="Siguiente">▶︎▶︎</button>' +
        '<input class="pl-scrub" type="range" min="0" max="0" value="0" step="1" aria-label="Ir al paso">' +
        '<span class="pl-count">–</span>' +
        '<button class="pl-btn pl-speed" data-a="speed" title="Velocidad">1×</button>';
      this.btnPlay = this.el.querySelector('.pl-play');
      this.scrub = this.el.querySelector('.pl-scrub');
      this.count = this.el.querySelector('.pl-count');
      this.btnSpeed = this.el.querySelector('.pl-speed');

      this.el.addEventListener('click', function (e) {
        const b = e.target.closest('[data-a]');
        if (!b) return;
        const a = b.dataset.a;
        if (a === 'reset') self.seek(0);
        else if (a === 'prev') self.prev();
        else if (a === 'next') self.next();
        else if (a === 'toggle') self.toggle();
        else if (a === 'speed') {
          const idx = (SPEEDS.indexOf(self.speed) + 1) % SPEEDS.length;
          self.speed = SPEEDS[idx];
          self.btnSpeed.textContent = String(self.speed).replace('.', ',') + '×';
        }
      });
      this.scrub.addEventListener('input', function () {
        self.pause();
        self.seek(+self.scrub.value);
      });
    },

    on: function (ev, cb) { (this.listeners[ev] = this.listeners[ev] || []).push(cb); return this; },
    emit: function (ev, d) { (this.listeners[ev] || []).forEach(function (cb) { cb(d); }); },

    load: function (trace, opts) {
      this.pause();
      this.trace = trace;
      this.i = 0;
      const n = trace ? trace.steps.length : 0;
      this.scrub.max = Math.max(0, n - 1);
      this.scrub.value = 0;
      this._updateUi();
      if (trace && n) {
        this.emit('step', { i: 0, step: trace.steps[0], prev: null, animate: false });
      }
      if (opts && opts.autoplay && n > 1) this.play();
    },

    _updateUi: function () {
      const n = this.trace ? this.trace.steps.length : 0;
      this.count.textContent = n ? (this.i + 1) + '/' + n : '–';
      this.scrub.value = this.i;
      this.btnPlay.textContent = this.playing ? '⏸' : '▶';
      this.btnPlay.setAttribute('aria-label', this.playing ? 'Pausa' : 'Reproducir');
    },

    _durFor: function (step) {
      const base = (step && (step.type === 'iter' || step.type === 'sweep' || step.type === 'rowop' || step.type === 'dd')) ? 1250 : 1800;
      return base / this.speed;
    },

    _goto: function (i, animate) {
      if (!this.trace) return;
      const n = this.trace.steps.length;
      i = Math.max(0, Math.min(n - 1, i));
      if (i === this.i && animate !== 'force') { this._updateUi(); return; }
      const prev = this.trace.steps[this.i];
      this.i = i;
      this._updateUi();
      this.emit('step', {
        i: i, step: this.trace.steps[i],
        prev: prev, animate: !!animate,
        durMs: animate ? Math.min(700, this._durFor(this.trace.steps[i]) * 0.55) : 0,
      });
    },

    next: function () { this.pause(); this._goto(this.i + 1, true); },
    prev: function () { this.pause(); this._goto(this.i - 1, true); },
    seek: function (i) { this._goto(i, false); },

    play: function () {
      if (!this.trace || this.playing) return;
      if (this.i >= this.trace.steps.length - 1) this._goto(0, false);
      this.playing = true;
      this._updateUi();
      this.emit('play');
      this._tick();
    },

    _tick: function () {
      const self = this;
      if (!this.playing) return;
      const cur = this.trace.steps[this.i];
      this._timer = setTimeout(function () {
        if (!self.playing) return;
        if (self.i >= self.trace.steps.length - 1) { self.pause(); return; }
        self._goto(self.i + 1, true);
        self._tick();
      }, this._durFor(cur));
    },

    pause: function () {
      if (this._timer) clearTimeout(this._timer);
      this._timer = 0;
      if (!this.playing) return;
      this.playing = false;
      this._updateUi();
      this.emit('pause');
    },

    toggle: function () { if (this.playing) this.pause(); else this.play(); },

    destroy: function () { this.pause(); this.listeners = {}; },
  };

  NS.StepPlayer = StepPlayer;
})(globalThis.MNO = globalThis.MNO || {});
