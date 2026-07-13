/* MNO.exporter — exportar/importar el progreso como JSON (descarga local).
   Útil para estudios de aula: cada estudiante comparte su archivo si quiere. */
(function (NS) {
  'use strict';

  NS.exporter = {
    descargar: function () {
      const data = NS.store.exportar();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      const fecha = new Date().toISOString().slice(0, 10);
      a.href = URL.createObjectURL(blob);
      a.download = 'mno-progreso-' + fecha + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 500);
    },

    importar: function (onDone) {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json,application/json';
      inp.addEventListener('change', function () {
        const f = inp.files && inp.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = function () {
          try {
            NS.store.importar(JSON.parse(r.result));
            NS.ui.toast('✅ Progreso importado correctamente.', 'exito');
            if (onDone) onDone(true);
          } catch (e) {
            NS.ui.toast('⛔ ' + e.message, 'error');
            if (onDone) onDone(false);
          }
        };
        r.readAsText(f);
      });
      inp.click();
    },
  };
})(globalThis.MNO = globalThis.MNO || {});
