// Tiny helper script: file tabs, output tabs and copy buttons. No dependencies.
(function () {
  function select(group, attr, value) {
    group.querySelectorAll('[' + attr + ']').forEach(function (el) {
      el.classList.toggle('on', el.getAttribute(attr) === value);
    });
  }

  // File tabs (Task 5 has four files)
  document.querySelectorAll('[data-files]').forEach(function (panel) {
    panel.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var id = tab.getAttribute('data-tab');
        panel.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t === tab); });
        panel.querySelectorAll('.file-panel').forEach(function (p) {
          p.classList.toggle('on', p.getAttribute('data-panel') === id);
        });
      });
    });
  });

  // Output: screenshot / text
  document.querySelectorAll('[data-term]').forEach(function (term) {
    term.querySelectorAll('[data-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view');
        term.querySelectorAll('[data-view]').forEach(function (b) { b.classList.toggle('on', b === btn); });
        term.querySelectorAll('[data-show]').forEach(function (v) {
          v.classList.toggle('on', v.getAttribute('data-show') === view);
        });
      });
    });
  });

  // Copy buttons
  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var source = document.getElementById(btn.getAttribute('data-copy'));
      if (!source) return;
      var text = source.value;
      var done = function () {
        btn.textContent = 'Copied ✓';
        btn.classList.add('done');
        setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { source.select(); document.execCommand('copy'); done(); });
      } else {
        source.select(); document.execCommand('copy'); done();
      }
    });
  });
})();
