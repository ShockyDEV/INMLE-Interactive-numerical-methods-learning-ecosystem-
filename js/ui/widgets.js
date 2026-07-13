/* MNO.ui — widgets compartidos: toasts, formularios de parámetros, presets. */
(function (NS) {
  'use strict';

  const ui = {};

  /* ---------- toast ---------- */
  let toastBox = null;
  ui.toast = function (msg, tipo, ms) {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.className = 'toasts';
      document.body.appendChild(toastBox);
    }
    const t = document.createElement('div');
    t.className = 'toast toast-' + (tipo || 'info');
    NS.math.render(t, msg);
    toastBox.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('vivo'); });
    setTimeout(function () {
      t.classList.remove('vivo');
      setTimeout(function () { t.remove(); }, 400);
    }, ms || 3600);
    return t;
  };

  /* ---------- formulario de parámetros a partir del registry ---------- */
  ui.buildForm = function (container, method, values, onChange) {
    container.innerHTML = '';
    container.className = 'params-form';
    const inputs = {};
    let debTimer = 0;
    function fire(inmediato) {
      if (!onChange) return;
      clearTimeout(debTimer);
      if (inmediato) onChange(api.getValues());
      else debTimer = setTimeout(function () { onChange(api.getValues()); }, 380);
    }
    method.params.forEach(function (p) {
      const field = document.createElement('div');
      field.className = 'field' + (p.tipo === 'num' || p.tipo === 'int' ? ' field-corto' : '');
      const label = document.createElement('label');
      label.textContent = p.label;
      label.htmlFor = 'fld-' + method.id + '-' + p.id;
      field.appendChild(label);
      let inp;
      if (p.tipo === 'matrix') {
        inp = document.createElement('textarea');
        inp.rows = 3;
        inp.spellcheck = false;
      } else {
        inp = document.createElement('input');
        inp.type = 'text';
        inp.autocomplete = 'off';
        inp.spellcheck = false;
        if (p.tipo === 'num' || p.tipo === 'int') inp.inputMode = 'decimal';
      }
      inp.id = 'fld-' + method.id + '-' + p.id;
      inp.value = (values && values[p.id] !== undefined) ? values[p.id] : p.def;
      inp.dataset.pid = p.id;
      field.appendChild(inp);
      if (p.hint) {
        const h = document.createElement('span');
        h.className = 'hint';
        h.textContent = p.hint;
        field.appendChild(h);
      }
      const err = document.createElement('span');
      err.className = 'field-error';
      field.appendChild(err);
      inputs[p.id] = { inp: inp, err: err, def: p };

      inp.addEventListener('input', function () {
        if (p.tipo === 'expr') {
          const r = NS.expr.tryCompile(inp.value, ['x']);
          err.textContent = r.ok ? '' : r.error;
          field.classList.toggle('con-error', !r.ok);
          if (!r.ok) return;
        }
        fire(false);
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && p.tipo !== 'matrix') { e.preventDefault(); fire(true); }
      });
      container.appendChild(field);
    });

    const api = {
      el: container,
      getValues: function () {
        const out = {};
        for (const id in inputs) out[id] = inputs[id].inp.value;
        return out;
      },
      setValues: function (v, silencio) {
        for (const id in v) {
          if (inputs[id]) {
            inputs[id].inp.value = v[id];
            inputs[id].err.textContent = '';
            inputs[id].inp.closest('.field').classList.remove('con-error');
          }
        }
        if (!silencio) fire(true);
      },
      setValue: function (id, val, silencio) {
        if (inputs[id]) inputs[id].inp.value = val;
        if (!silencio) fire(false);
      },
    };
    return api;
  };

  /* Convierte los valores de texto del formulario a los tipos del motor. */
  ui.parseValues = function (method, raw) {
    const out = {};
    method.params.forEach(function (p) {
      const v = raw[p.id];
      if (p.tipo === 'num' || p.tipo === 'int') out[p.id] = +String(v).replace(',', '.').replace('−', '-');
      else if (p.tipo === 'nums') out[p.id] = NS.num.P(v);
      else if (p.tipo === 'matrix') out[p.id] = NS.num.parseMatrix(v);
      else out[p.id] = v;
    });
    return out;
  };

  /* ---------- barra de presets ---------- */
  ui.presetBar = function (container, method, onPick) {
    if (!method.presets || !method.presets.length) { container.remove(); return; }
    container.className = 'presets';
    const tit = document.createElement('span');
    tit.className = 'presets-tit';
    tit.textContent = 'Ejemplos:';
    container.appendChild(tit);
    method.presets.forEach(function (pr) {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.type = 'button';
      chip.textContent = pr.nombre;
      chip.addEventListener('click', function () {
        onPick(pr);
        if (pr.nota) ui.toast(pr.nota, 'info', 5200);
      });
      container.appendChild(chip);
    });
  };

  /* ---------- panel de pasos (tarjetas sincronizadas con el player) ---------- */
  function StepPanel(container) {
    this.el = container;
    this.el.className = 'steps';
    this.cards = [];
    this.active = -1;
    this.onSeek = null;
  }
  StepPanel.prototype = {
    load: function (trace) {
      this.el.innerHTML = '';
      this.cards = [];
      this.active = -1;
      if (!trace) return;
      const self = this;
      trace.steps.forEach(function (s, i) {
        const card = document.createElement('div');
        card.className = 'step-card tipo-' + s.type;
        card.dataset.i = i;
        const tit = document.createElement('div');
        tit.className = 'step-tit';
        tit.textContent = s.title || ('Paso ' + (i + 1));
        card.appendChild(tit);
        card._pendiente = s; /* renderizado perezoso del cuerpo */
        self.cards.push(card);
        card.addEventListener('click', function () {
          if (self.onSeek) self.onSeek(i);
        });
        self.el.appendChild(card);
      });
      /* renderiza los primeros ya, el resto en ratos libres */
      const eager = Math.min(12, this.cards.length);
      for (let i = 0; i < eager; i++) this._renderBody(i);
      let next = eager;
      const idle = window.requestIdleCallback || function (fn) { setTimeout(fn, 60); };
      function chunk() {
        const lim = Math.min(next + 8, self.cards.length);
        for (; next < lim; next++) self._renderBody(next);
        if (next < self.cards.length) idle(chunk);
      }
      if (next < this.cards.length) idle(chunk);
    },
    _renderBody: function (i) {
      const card = this.cards[i];
      if (!card || !card._pendiente) return;
      const s = card._pendiente;
      card._pendiente = null;
      (s.explain || []).forEach(function (linea) {
        card.appendChild(NS.math.line(linea, 'step-linea'));
      });
    },
    setActive: function (i, scroll) {
      if (this.active >= 0 && this.cards[this.active]) this.cards[this.active].classList.remove('activo');
      this.active = i;
      const card = this.cards[i];
      if (!card) return;
      this._renderBody(i);
      card.classList.add('activo');
      if (scroll !== false) {
        card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    },
  };
  NS.StepPanel = StepPanel;

  NS.ui = ui;
})(globalThis.MNO = globalThis.MNO || {});
