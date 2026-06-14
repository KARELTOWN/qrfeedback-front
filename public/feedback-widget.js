(function () {
  var script = document.currentScript;
  if (!script) return;
  if (window.self !== window.top && script.getAttribute('data-allow-in-iframe') !== 'true') return;

  var feedbackUrl = script.getAttribute('data-feedback-url');
  if (!feedbackUrl) return;

  window.__qrFeedbackWidgets = window.__qrFeedbackWidgets || {};
  var registryKey = feedbackUrl.replace(/[?#].*$/, '');
  if (window.__qrFeedbackWidgets[registryKey]) return;
  window.__qrFeedbackWidgets[registryKey] = true;

  var buttonText = script.getAttribute('data-button-text') || 'Feedback';
  var accentColor = script.getAttribute('data-color') || '#0f766e';
  var side = script.getAttribute('data-side') === 'left' ? 'left' : 'right';
  var widgetId = 'qr-feedback-widget-' + Math.random().toString(36).slice(2);
  var isOpen = false;

  function withEmbedParam(url) {
    try {
      var parsed = new URL(url, window.location.href);
      parsed.searchParams.set('embed', '1');
      return parsed.toString();
    } catch (_error) {
      return url;
    }
  }

  var root = document.createElement('div');
  root.id = widgetId;
  root.innerHTML = [
    '<style>',
    '#' + widgetId + ' { font-family: Arial, Helvetica, sans-serif; }',
    '#' + widgetId + ' .qrf-tab {',
    'position: fixed;',
    side + ': 0;',
    'top: 50%;',
    'z-index: 2147483000;',
    'display: inline-flex;',
    'align-items: center;',
    'gap: 8px;',
    'min-height: 48px;',
    'padding: 12px 10px;',
    'border: 0;',
    'border-radius: ' + (side === 'right' ? '12px 0 0 12px' : '0 12px 12px 0') + ';',
    'background: ' + accentColor + ';',
    'color: #fff;',
    'box-shadow: 0 12px 30px rgba(15, 23, 42, 0.22);',
    'font-size: 15px;',
    'font-weight: 800;',
    'letter-spacing: 0;',
    'cursor: pointer;',
    'transform: translateY(-50%);',
    'writing-mode: vertical-rl;',
    'text-orientation: mixed;',
    '}',
    '#' + widgetId + ' .qrf-tab svg { width: 18px; height: 18px; flex: 0 0 auto; }',
    '#' + widgetId + ' .qrf-backdrop {',
    'position: fixed;',
    'inset: 0;',
    'z-index: 2147482998;',
    'display: none;',
    'background: rgba(15, 23, 42, 0.28);',
    '}',
    '#' + widgetId + ' .qrf-panel {',
    'position: fixed;',
    side + ': 24px;',
    'top: 50%;',
    'z-index: 2147482999;',
    'display: none;',
    'width: min(430px, calc(100vw - 48px));',
    'height: min(680px, calc(100vh - 48px));',
    'overflow: hidden;',
    'border: 1px solid rgba(148, 163, 184, 0.35);',
    'border-radius: 22px;',
    'background: #fff;',
    'box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);',
    'transform: translateY(-50%) scale(0.96);',
    'opacity: 0;',
    'transition: opacity 240ms cubic-bezier(.2,.8,.2,1), transform 240ms cubic-bezier(.2,.8,.2,1);',
    '}',
    '#' + widgetId + ' .qrf-panel.qrf-open { opacity: 1; transform: translateY(-50%) scale(1); animation: qrf-pop 260ms cubic-bezier(.2,.8,.2,1); }',
    '@keyframes qrf-pop {',
    '0% { opacity: 0; transform: translateY(-46%) scale(.92); }',
    '70% { opacity: 1; transform: translateY(-50%) scale(1.02); }',
    '100% { opacity: 1; transform: translateY(-50%) scale(1); }',
    '}',
    '#' + widgetId + ' .qrf-header {',
    'display: flex;',
    'align-items: center;',
    'justify-content: space-between;',
    'height: 58px;',
    'padding: 0 14px 0 18px;',
    'border-bottom: 1px solid #e2e8f0;',
    'background: #fff;',
    'color: #0f172a;',
    'font-size: 16px;',
    'font-weight: 900;',
    '}',
    '#' + widgetId + ' .qrf-close {',
    'display: grid;',
    'width: 36px;',
    'height: 36px;',
    'place-items: center;',
    'border: 0;',
    'border-radius: 10px;',
    'background: #f1f5f9;',
    'color: #0f172a;',
    'cursor: pointer;',
    '}',
    '#' + widgetId + ' iframe { width: 100%; height: calc(100% - 58px); border: 0; background: #fff; }',
    '@media (max-width: 640px) {',
    '#' + widgetId + ' .qrf-backdrop { background: rgba(15, 23, 42, 0.42); }',
    '#' + widgetId + ' .qrf-panel { right: 12px; left: 12px; top: 12px; width: auto; height: calc(100vh - 24px); border-radius: 18px; transform: translateY(10px) scale(0.98); }',
    '#' + widgetId + ' .qrf-panel.qrf-open { transform: translateY(0) scale(1); animation: qrf-mobile-pop 240ms cubic-bezier(.2,.8,.2,1); }',
    '@keyframes qrf-mobile-pop { 0% { opacity: 0; transform: translateY(18px) scale(.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }',
    '}',
    '</style>',
    '<div class="qrf-backdrop" aria-hidden="true"></div>',
    '<section class="qrf-panel" role="dialog" aria-label="Formulaire de feedback">',
    '<div class="qrf-header"><span>Votre avis compte</span><button class="qrf-close" type="button" aria-label="Fermer">x</button></div>',
    '<iframe title="QR Feedback" loading="lazy" allow="clipboard-write"></iframe>',
    '</section>',
    '<button class="qrf-tab" type="button" aria-label="Ouvrir le feedback">',
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 8h10M7 12h6M21 12c0 4.418-4.03 8-9 8a10.6 10.6 0 0 1-4.2-.856L3 20l1.33-3.55A7.34 7.34 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '<span>' + buttonText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>',
    '</button>'
  ].join('');

  document.body.appendChild(root);

  var tab = root.querySelector('.qrf-tab');
  var panel = root.querySelector('.qrf-panel');
  var backdrop = root.querySelector('.qrf-backdrop');
  var close = root.querySelector('.qrf-close');
  var iframe = root.querySelector('iframe');

  function openWidget() {
    if (!iframe.getAttribute('src')) iframe.setAttribute('src', withEmbedParam(feedbackUrl));
    isOpen = true;
    backdrop.style.display = 'block';
    panel.style.display = 'block';
    window.setTimeout(function () {
      panel.classList.add('qrf-open');
    }, 10);
  }

  function closeWidget() {
    isOpen = false;
    panel.classList.remove('qrf-open');
    window.setTimeout(function () {
      if (!isOpen) {
        panel.style.display = 'none';
        backdrop.style.display = 'none';
      }
    }, 180);
  }

  tab.addEventListener('click', function () {
    isOpen ? closeWidget() : openWidget();
  });
  close.addEventListener('click', closeWidget);
  backdrop.addEventListener('click', closeWidget);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen) closeWidget();
  });
})();
