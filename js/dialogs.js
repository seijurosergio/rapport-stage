(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppDialogs = factory();
  }
})(this, function () {
  'use strict';

  let lastFocused = null;

  function saveFocus() {
    lastFocused = document.activeElement;
  }

  function restoreFocus() {
    if (lastFocused && typeof lastFocused.focus === 'function') {
      try { lastFocused.focus({ preventScroll: true }); } catch (e) { lastFocused.focus(); }
    }
    lastFocused = null;
  }

  function createOverlay() {
    const o = document.createElement('div');
    o.className = 'dlg-overlay';
    o.setAttribute('role', 'presentation');
    return o;
  }

  function showMessage(text, type) {
    saveFocus();
    const dlg = document.createElement('div');
    dlg.className = 'dlg-toast dlg-toast-' + (type || 'info');
    dlg.setAttribute('role', 'status');
    dlg.setAttribute('aria-live', 'polite');
    dlg.textContent = text;
    document.body.appendChild(dlg);
    requestAnimationFrame(function () { dlg.classList.add('show'); });
    const t = setTimeout(function () {
      dlg.classList.remove('show');
      dlg.addEventListener('transitionend', function rm() { dlg.remove(); });
    }, 6000);
    return { close: function () { clearTimeout(t); dlg.classList.remove('show'); dlg.remove(); } };
  }

  function askConfirm(text, options) {
    saveFocus();
    return new Promise(function (resolve) {
      const dlg = document.createElement('div');
      dlg.className = 'dlg-confirm';
      dlg.setAttribute('role', 'dialog');
      dlg.setAttribute('aria-modal', 'true');
      dlg.setAttribute('aria-labelledby', 'dlg-title');
      dlg.innerHTML =
        '<div class="dlg-box">' +
        '<p id="dlg-title">' + text + '</p>' +
        '<div class="dlg-btns">' +
        '<button type="button" class="dlg-btn dlg-btn-cancel">' + (options && options.non || 'Non') + '</button>' +
        '<button type="button" class="dlg-btn dlg-btn-ok">' + (options && options.oui || 'Oui') + '</button>' +
        '</div>' +
        '</div>';
      document.body.appendChild(dlg);
      const overlay = createOverlay();
      document.body.appendChild(overlay);
      requestAnimationFrame(function () {
        dlg.classList.add('show');
        overlay.classList.add('show');
      });

      function cleanup(result) {
        dlg.classList.remove('show');
        overlay.classList.remove('show');
        // Fallback immédiat pour les environnements sans transition (JSDOM, etc.)
        if (!supportsTransition()) {
          dlg.remove();
          overlay.remove();
          restoreFocus();
          resolve(result);
        } else {
          dlg.addEventListener('transitionend', function rm() {
            dlg.remove();
            overlay.remove();
            restoreFocus();
            resolve(result);
          }, { once: true });
        }
      }

      function supportsTransition() {
        try {
          const style = getComputedStyle(dlg);
          return style.transitionDuration !== '0s' && style.transitionDuration !== '0ms';
        } catch (e) {
          return false;
        }
      }

      const btnOk = dlg.querySelector('.dlg-btn-ok');
      const btnCancel = dlg.querySelector('.dlg-btn-cancel');

      btnOk.addEventListener('click', function () { cleanup(true); });
      btnCancel.addEventListener('click', function () { cleanup(false); });

      function onKey(e) {
        if (e.key === 'Escape') { cleanup(false); document.removeEventListener('keydown', onKey); }
        else if (e.key === 'Enter' && document.activeElement !== btnCancel) { cleanup(true); document.removeEventListener('keydown', onKey); }
        else if (e.key === 'Tab') { e.preventDefault(); btnOk.focus(); }
      }
      document.addEventListener('keydown', onKey);

      btnOk.focus();
    });
  }

  return { showMessage, askConfirm };
});