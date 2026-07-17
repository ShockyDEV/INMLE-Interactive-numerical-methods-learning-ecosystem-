/* MNO.store — progreso persistente en localStorage (clave 'mno.state').
   Esquema versionado con migraciones, escritura debounced y evaluación de
   logros tras cada mutación. TODO vive en el navegador del estudiante:
   privacidad por diseño (no hay servidor ni telemetría). */
(function (NS) {
  'use strict';

  const KEY = 'mno.state';
  const VERSION = 1;
  let state = null;
  let saveTimer = 0;
  const listeners = [];

  function ahora() { return new Date().toISOString(); }

  function estadoLimpio() {
    return {
      version: VERSION,
      creado: ahora(),
      ultimaSesion: ahora(),
      puntos: 0,
      metodos: {},
      logros: {},
      carrera: { corridas: 0, apuestasOk: 0 },
    };
  }

  function metodo(mid) {
    if (!state.metodos[mid]) {
      state.metodos[mid] = {
        visitas: {},
        ejecuciones: 0,
        divergenciasVistas: 0,
        params: null,
        practica: { intentos: 0, aciertos: 0, primerIntento: 0, rachaActual: 0, mejorRacha: 0, sinPista: 0, porTipo: {}, fallosTema: {} },
        retos: {},
      };
    }
    return state.metodos[mid];
  }

  /* migraciones futuras: MIGRA[1] = función v1→v2, etc. */
  const MIGRA = {};

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { state = estadoLimpio(); return; }
      let s = JSON.parse(raw);
      while (s.version < VERSION && MIGRA[s.version]) s = MIGRA[s.version](s);
      if (s.version !== VERSION || !s.metodos) throw new Error('esquema');
      state = s;
      state.ultimaSesion = ahora();
    } catch (e) {
      try { localStorage.setItem(KEY + '.backup', localStorage.getItem(KEY) || ''); } catch (e2) { /* sin espacio */ }
      state = estadoLimpio();
    }
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* cuota llena: seguimos en memoria */ }
    }, 250);
  }

  function emit() { listeners.forEach(function (cb) { cb(state); }); }

  function trasMutacion() {
    save();
    if (NS.achievements) {
      const nuevos = NS.achievements.evaluar(state);
      nuevos.forEach(function (a) {
        state.logros[a.id] = ahora();
        if (NS.ui) NS.ui.toast('**Insignia conseguida: ' + a.nombre + '.** ' + a.desc, 'logro', 5200);
      });
      if (nuevos.length) save();
    }
    emit();
  }

  const store = {
    init: function () { load(); },
    on: function (cb) { listeners.push(cb); },
    raw: function () { return state; },

    /* ---- registro de actividad ---- */
    visita: function (mid, modo) {
      const m = metodo(mid);
      m.visitas[modo] = (m.visitas[modo] || 0) + 1;
      trasMutacion();
    },
    guardaParams: function (mid, raw) {
      metodo(mid).params = raw;
      save();
    },
    ultimosParams: function (mid) {
      return state && state.metodos[mid] ? state.metodos[mid].params : null;
    },
    ejecucion: function (mid, trace) {
      const m = metodo(mid);
      m.ejecuciones++;
      if (trace && trace.status === 'diverged') m.divergenciasVistas++;
      trasMutacion();
    },
    divergenciaVista: function (mid) {
      metodo(mid).divergenciasVistas++;
      trasMutacion();
    },

    /* ---- Practicar ---- */
    practicaResultado: function (mid, r) {
      /* r: {tipo, ok, primerIntento, pistaUsada, tema} */
      const p = metodo(mid).practica;
      p.intentos++;
      if (!p.porTipo[r.tipo]) p.porTipo[r.tipo] = { i: 0, a: 0 };
      p.porTipo[r.tipo].i++;
      let ganados = 0;
      if (r.ok) {
        p.aciertos++;
        p.porTipo[r.tipo].a++;
        if (r.primerIntento) {
          p.primerIntento++;
          p.rachaActual++;
          p.mejorRacha = Math.max(p.mejorRacha, p.rachaActual);
          ganados = 10;
        } else {
          p.rachaActual = 0;
          ganados = 5;
        }
        if (!r.pistaUsada) p.sinPista++;
        /* multiplicador por racha: hasta ×2 */
        ganados = Math.round(ganados * Math.min(2, 1 + p.rachaActual * 0.1));
        state.puntos += ganados;
      } else {
        p.rachaActual = 0;
        if (r.tema) p.fallosTema[r.tema] = (p.fallosTema[r.tema] || 0) + 1;
      }
      trasMutacion();
      return { racha: p.rachaActual, puntos: ganados };
    },

    /* ---- Retos ---- */
    retoResultado: function (mid, retoId, puntos, estrellas) {
      const rs = metodo(mid).retos;
      const prev = rs[retoId] || { mejor: 0, estrellas: 0 };
      /* solo suma la MEJORA sobre tu mejor marca: repetir no infla puntos */
      state.puntos += Math.max(0, puntos - prev.mejor);
      rs[retoId] = {
        mejor: Math.max(prev.mejor, puntos),
        estrellas: Math.max(prev.estrellas, estrellas),
        intentos: (prev.intentos || 0) + 1,
      };
      trasMutacion();
    },

    /* ---- Carrera ---- */
    carreraCorrida: function (apuestaOk) {
      state.carrera.corridas++;
      if (apuestaOk) state.carrera.apuestasOk++;
      trasMutacion();
    },

    /* ---- maestría 0..4: Nuevo → Explorador → Aprendiz → Experto → Maestro ---- */
    mastery: function (mid) {
      if (!state || !state.metodos[mid]) return 0;
      const m = state.metodos[mid];
      const p = m.practica;
      const defs = (NS.content && NS.content.challenges && NS.content.challenges[mid]) || [];
      let nivel = 0;
      if (m.ejecuciones >= 1) nivel = 1;
      if (nivel === 1 && p.intentos >= 8 && p.aciertos / p.intentos >= 0.7) nivel = 2;
      if (nivel === 2 && defs.length && defs.every(function (d) { return m.retos[d.id] && m.retos[d.id].estrellas >= 1; })) nivel = 3;
      if (nivel === 3 && (defs.every(function (d) { return m.retos[d.id] && m.retos[d.id].estrellas >= 3; }) || p.mejorRacha >= 10)) nivel = 4;
      return nivel;
    },

    resumenGlobal: function () {
      if (!state) return { puntos: 0, insignias: 0, maestros: 0 };
      let maestros = 0;
      Object.keys(NS.registry || {}).forEach(function (mid) {
        if (mid !== 'calc' && store.mastery(mid) >= 3) maestros++;
      });
      return {
        puntos: state.puntos || 0,
        insignias: Object.keys(state.logros).length,
        maestros: maestros,
      };
    },

    /* ---- exportar / importar / borrar ---- */
    exportar: function () { return JSON.parse(JSON.stringify(state)); },
    importar: function (obj) {
      if (!obj || obj.version === undefined || !obj.metodos) throw new Error('El archivo no parece un progreso de MNO Interactivo.');
      let s = obj;
      while (s.version < VERSION && MIGRA[s.version]) s = MIGRA[s.version](s);
      state = s;
      state.ultimaSesion = ahora();
      save();
      emit();
    },
    borrar: function () {
      state = estadoLimpio();
      try { localStorage.removeItem(KEY); } catch (e) { /* nada */ }
      save();
      emit();
    },
  };

  NS.store = store;
})(globalThis.MNO = globalThis.MNO || {});
