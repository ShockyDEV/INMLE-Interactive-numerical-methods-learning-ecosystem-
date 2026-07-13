/* MNO.app — arranque: verifica que todos los módulos cargaron (el orden de
   los <script> importa), inicializa el estado persistente y monta el router. */
(function (NS) {
  'use strict';

  function boot() {
    const necesarios = ['num', 'expr', 'trace', 'engines', 'Plot2D', 'anim', 'StepPlayer', 'math', 'ui', 'registry', 'router', 'views'];
    const faltan = necesarios.filter(function (k) { return !NS[k]; });
    if (faltan.length) {
      document.getElementById('app').innerHTML =
        '<div class="boot-error"><h1>⚠️ Error de carga</h1><p>Faltan módulos: ' + faltan.join(', ') +
        '.<br>Comprueba que todos los archivos js/ están presentes y en orden en index.html.</p></div>';
      return;
    }
    if (NS.store && NS.store.init) NS.store.init();
    NS.router.start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(globalThis.MNO = globalThis.MNO || {});
