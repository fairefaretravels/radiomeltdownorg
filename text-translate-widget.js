/*!
 * LangSync Text Translate Widget
 * Drop-in embed: <script src="text-translate-widget.js" defer></script>
 * Renders a floating bubble in the corner of the page. Tapping it opens
 * a type-to-translate panel. Fully scoped — safe to embed alongside any
 * host page's own CSS/JS, and alongside the LangSync speech widget too.
 */
(function () {
  if (document.getElementById('ttw-root')) return; // already injected

  /* ---------- fonts ---------- */
  if (!document.getElementById('ttw-font-link')) {
    var fontLink = document.createElement('link');
    fontLink.id = 'ttw-font-link';
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap';
    document.head.appendChild(fontLink);
  }

  /* ---------- styles (all scoped under #ttw-root) ---------- */
  var style = document.createElement('style');
  style.textContent = `
#ttw-root {
  --ttw-bg: #0a0a0f;
  --ttw-surface: #12121a;
  --ttw-surface2: #1a1a26;
  --ttw-border: #2a2a3a;
  --ttw-accent: #7c3aed;
  --ttw-accent2: #06b6d4;
  --ttw-text: #f0f0f8;
  --ttw-muted: #6b7280;
  --ttw-dim: #374151;
  --ttw-radius: 14px;
  --ttw-radius-sm: 8px;
  position: fixed;
  z-index: 2147483000;
  bottom: 20px;
  right: 92px;
  font-family: 'Space Grotesk', sans-serif;
  margin-bottom: env(safe-area-inset-bottom, 0px);
}
#ttw-root, #ttw-root * { box-sizing: border-box; }

#ttw-bubble {
  width: 58px; height: 58px; border-radius: 50%; border: none;
  background: linear-gradient(135deg, var(--ttw-accent2), var(--ttw-accent));
  box-shadow: 0 6px 20px rgba(6,182,212,0.35), 0 2px 6px rgba(0,0,0,0.3);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 16px; color: #fff;
  transition: transform 0.2s ease; -webkit-tap-highlight-color: transparent;
}
#ttw-bubble:hover { transform: scale(1.06); }
#ttw-bubble:active { transform: scale(0.94); }

#ttw-panel {
  position: absolute; bottom: 72px; right: 0;
  width: 340px; max-width: calc(100vw - 32px);
  max-height: min(560px, 80vh);
  background: var(--ttw-bg); border: 1px solid var(--ttw-border); border-radius: var(--ttw-radius);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); overflow: hidden; display: flex; flex-direction: column;
  color: var(--ttw-text); transform-origin: bottom right;
  transform: scale(0.9) translateY(12px); opacity: 0; pointer-events: none;
  transition: transform 0.22s ease, opacity 0.22s ease;
}
#ttw-panel.ttw-open { transform: scale(1) translateY(0); opacity: 1; pointer-events: auto; }
#ttw-panel-body { overflow-y: auto; overscroll-behavior: contain; flex: 1; }

#ttw-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid var(--ttw-border); flex-shrink: 0;
}
#ttw-logo { font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 700; letter-spacing: -0.5px; }
#ttw-logo span { color: var(--ttw-accent2); }
#ttw-close { background: none; border: none; color: var(--ttw-muted); font-size: 18px; cursor: pointer; padding: 2px 6px; line-height: 1; }

.ttw-lang-row {
  display: flex; align-items: center; gap: 8px; padding: 12px 14px 6px;
}
.ttw-lang-select {
  flex: 1; background: var(--ttw-surface); border: 1px solid var(--ttw-border); border-radius: var(--ttw-radius-sm);
  color: var(--ttw-text); font-family: 'Space Grotesk', sans-serif; font-size: 12.5px; font-weight: 600;
  padding: 8px 6px; text-align: center; appearance: none; cursor: pointer;
}
.ttw-swap-btn {
  background: var(--ttw-surface); border: 1px solid var(--ttw-border); border-radius: 50%;
  width: 30px; height: 30px; flex-shrink: 0; color: var(--ttw-accent2); font-size: 14px;
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;
}
.ttw-swap-btn:active { transform: rotate(180deg); }

.ttw-io-section { padding: 8px 14px 4px; display: flex; flex-direction: column; gap: 8px; }
.ttw-io-block { background: var(--ttw-surface); border: 1px solid var(--ttw-border); border-radius: var(--ttw-radius); overflow: hidden; }
.ttw-io-label {
  font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--ttw-muted); padding: 8px 12px 0;
}
#ttw-input {
  width: 100%; background: transparent; border: none; outline: none; resize: none;
  color: var(--ttw-text); font-family: 'Space Grotesk', sans-serif; font-size: 14px; line-height: 1.5;
  padding: 6px 12px 10px; min-height: 70px; max-height: 140px;
}
#ttw-input::placeholder { color: var(--ttw-dim); }
.ttw-charcount { font-size: 10px; color: var(--ttw-muted); text-align: right; padding: 0 12px 8px; }

.ttw-output-body {
  min-height: 60px; padding: 6px 12px 10px; font-size: 14px; line-height: 1.5; color: var(--ttw-text);
  display: flex; align-items: flex-start;
}
.ttw-output-body.ttw-empty { color: var(--ttw-dim); font-size: 12.5px; }
.ttw-output-body.ttw-loading { color: var(--ttw-muted); font-style: italic; font-size: 12.5px; }

.ttw-io-footer { display: flex; justify-content: flex-end; padding: 0 12px 8px; }
.ttw-copy-btn {
  background: none; border: 1px solid var(--ttw-border); border-radius: 20px; color: var(--ttw-muted);
  font-size: 10.5px; font-weight: 600; padding: 4px 10px; cursor: pointer; transition: all 0.15s;
}
.ttw-copy-btn:hover { color: var(--ttw-text); border-color: var(--ttw-accent2); }

#ttw-toast {
  position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(80px);
  background: var(--ttw-surface2); border: 1px solid var(--ttw-border); border-radius: 20px;
  padding: 9px 18px; font-size: 12.5px; font-weight: 500; color: var(--ttw-text);
  z-index: 2147483001; transition: transform 0.3s ease; white-space: nowrap; max-width: calc(100vw - 40px); text-align: center;
}
#ttw-toast.ttw-show { transform: translateX(-50%) translateY(0); }
#ttw-toast.ttw-error { border-color: rgba(239,68,68,0.4); color: #fca5a5; }

@media (max-width: 420px) {
  #ttw-root { bottom: 14px; right: 82px; }
  #ttw-panel { bottom: 66px; width: calc(100vw - 28px); }
}
`;
  document.head.appendChild(style);

  /* ---------- markup ---------- */
  var root = document.createElement('div');
  root.id = 'ttw-root';
  root.innerHTML = `
    <button id="ttw-bubble" aria-label="Open text translator">Aあ</button>
    <div id="ttw-panel">
      <div id="ttw-header">
        <div id="ttw-logo">Lang<span>Sync</span> Text</div>
        <button id="ttw-close" aria-label="Close">✕</button>
      </div>
      <div id="ttw-panel-body">
        <div class="ttw-lang-row">
          <select class="ttw-lang-select" id="ttw-sourceSelect"></select>
          <button class="ttw-swap-btn" id="ttw-swapBtn" aria-label="Swap languages">⇄</button>
          <select class="ttw-lang-select" id="ttw-targetSelect"></select>
        </div>
        <div class="ttw-io-section">
          <div class="ttw-io-block">
            <div class="ttw-io-label">Type or paste</div>
            <textarea id="ttw-input" placeholder="Enter text to translate..." maxlength="500"></textarea>
            <div class="ttw-charcount" id="ttw-charcount">0 / 500</div>
          </div>
          <div class="ttw-io-block">
            <div class="ttw-io-label">Translation</div>
            <div class="ttw-output-body ttw-empty" id="ttw-output">Translation appears here</div>
            <div class="ttw-io-footer">
              <button class="ttw-copy-btn" id="ttw-copyBtn">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  var toast = document.createElement('div');
  toast.id = 'ttw-toast';
  document.body.appendChild(toast);

  var $ = function (id) { return root.querySelector('#' + id); };

  /* ---------- data ---------- */
  var LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸', translate: 'en' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', translate: 'es' },
    { code: 'fr', name: 'French',  flag: '🇫🇷', translate: 'fr' },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷', translate: 'pt-BR' },
    { code: 'de', name: 'German',  flag: '🇩🇪', translate: 'de' },
    { code: 'ja', name: 'Japanese',flag: '🇯🇵', translate: 'ja' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', translate: 'zh-CN' },
    { code: 'ar', name: 'Arabic',  flag: '🇸🇦', translate: 'ar' },
    { code: 'ko', name: 'Korean',  flag: '🇰🇷', translate: 'ko' },
    { code: 'hi', name: 'Hindi',   flag: '🇮🇳', translate: 'hi' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', translate: 'ru' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', translate: 'it' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪', translate: 'sw' },
  ];

  var sourceLang = 'en';
  var targetLang = 'es';
  var debounceTimer = null;
  var toastTimer = null;
  var requestSeq = 0;

  function populateSelects() {
    var opts = LANGUAGES.map(function (l) {
      return '<option value="' + l.code + '">' + l.flag + ' ' + l.name + '</option>';
    }).join('');
    $('ttw-sourceSelect').innerHTML = opts;
    $('ttw-targetSelect').innerHTML = opts;
    $('ttw-sourceSelect').value = sourceLang;
    $('ttw-targetSelect').value = targetLang;
  }

  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.className = 'ttw-show' + (isError ? ' ttw-error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('ttw-show'); }, 3000);
  }

  function setOutput(text, state) {
    var el = $('ttw-output');
    el.className = 'ttw-output-body' + (state ? ' ttw-' + state : '');
    el.textContent = text;
  }

  function translate() {
    var text = $('ttw-input').value.trim();
    if (!text) { setOutput('Translation appears here', 'empty'); return; }
    if (sourceLang === targetLang) { setOutput(text); return; }

    var mySeq = ++requestSeq;
    setOutput('Translating...', 'loading');

    var srcCode = (LANGUAGES.find(function (l) { return l.code === sourceLang; }) || {}).translate || 'en';
    var tgtCode = (LANGUAGES.find(function (l) { return l.code === targetLang; }) || {}).translate || 'es';
    var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=' + srcCode + '|' + tgtCode;

    fetch(url).then(function (res) { return res.json(); }).then(function (data) {
      if (mySeq !== requestSeq) return; // a newer request superseded this one
      var translated = data && data.responseData && data.responseData.translatedText;
      if (!translated || (data && data.responseStatus === 403)) throw new Error('No translation');
      setOutput(translated);
    }).catch(function () {
      if (mySeq !== requestSeq) return;
      setOutput('Translation error', 'empty');
      showToast('Translation failed — may be rate-limited', true);
    });
  }

  /* ---------- interaction ---------- */
  $('ttw-bubble').addEventListener('click', function () {
    $('ttw-panel').classList.toggle('ttw-open');
  });
  $('ttw-close').addEventListener('click', function () {
    $('ttw-panel').classList.remove('ttw-open');
  });

  $('ttw-sourceSelect').addEventListener('change', function (e) {
    sourceLang = e.target.value;
    translate();
  });
  $('ttw-targetSelect').addEventListener('change', function (e) {
    targetLang = e.target.value;
    translate();
  });
  $('ttw-swapBtn').addEventListener('click', function () {
    var tmp = sourceLang; sourceLang = targetLang; targetLang = tmp;
    $('ttw-sourceSelect').value = sourceLang;
    $('ttw-targetSelect').value = targetLang;
    var outText = $('ttw-output').textContent;
    var isRealOutput = !$('ttw-output').classList.contains('ttw-empty') && !$('ttw-output').classList.contains('ttw-loading');
    if (isRealOutput) $('ttw-input').value = outText;
    translate();
  });

  $('ttw-input').addEventListener('input', function (e) {
    $('ttw-charcount').textContent = e.target.value.length + ' / 500';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(translate, 500);
  });

  $('ttw-copyBtn').addEventListener('click', function () {
    var text = $('ttw-output').textContent;
    if (!text || $('ttw-output').classList.contains('ttw-empty') || $('ttw-output').classList.contains('ttw-loading')) return;
    navigator.clipboard.writeText(text).then(function () {
      showToast('Copied to clipboard');
    }).catch(function () {
      showToast('Could not copy', true);
    });
  });

  populateSelects();
})();
