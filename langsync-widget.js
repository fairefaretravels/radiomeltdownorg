/*!
 * LangSync Floating Widget
 * Drop-in embed: <script src="langsync-widget.js" defer></script>
 * Renders a floating bubble in the corner of the page. Tapping it opens
 * the LangSync live-translation panel. Fully scoped — safe to embed
 * alongside any host page's own CSS/JS.
 */
(function () {
  if (document.getElementById('lsw-root')) return; // already injected

  /* ---------- fonts (scoped load, skips if already present) ---------- */
  if (!document.getElementById('lsw-font-link')) {
    var fontLink = document.createElement('link');
    fontLink.id = 'lsw-font-link';
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap';
    document.head.appendChild(fontLink);
  }

  /* ---------- styles (all scoped under #lsw-root) ---------- */
  var style = document.createElement('style');
  style.textContent = `
#lsw-root {
  --lsw-bg: #0a0a0f;
  --lsw-surface: #12121a;
  --lsw-surface2: #1a1a26;
  --lsw-border: #2a2a3a;
  --lsw-accent: #7c3aed;
  --lsw-accent2: #06b6d4;
  --lsw-accent3: #f59e0b;
  --lsw-live: #ef4444;
  --lsw-text: #f0f0f8;
  --lsw-muted: #6b7280;
  --lsw-dim: #374151;
  --lsw-radius: 14px;
  --lsw-radius-sm: 8px;
  position: fixed;
  z-index: 2147483000;
  bottom: 20px;
  right: 20px;
  font-family: 'Space Grotesk', sans-serif;
  --lsw-safe-b: env(safe-area-inset-bottom, 0px);
  margin-bottom: var(--lsw-safe-b);
}
#lsw-root, #lsw-root * { box-sizing: border-box; }

/* bubble */
#lsw-bubble {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--lsw-accent), var(--lsw-accent2));
  box-shadow: 0 6px 20px rgba(124,58,237,0.4), 0 2px 6px rgba(0,0,0,0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
#lsw-bubble:hover { transform: scale(1.06); }
#lsw-bubble:active { transform: scale(0.94); }
#lsw-bubble.lsw-live {
  animation: lsw-bubble-pulse 2s ease infinite;
}
@keyframes lsw-bubble-pulse {
  0% { box-shadow: 0 6px 20px rgba(124,58,237,0.4), 0 0 0 0 rgba(239,68,68,0.5); }
  70% { box-shadow: 0 6px 20px rgba(124,58,237,0.4), 0 0 0 12px rgba(239,68,68,0); }
  100% { box-shadow: 0 6px 20px rgba(124,58,237,0.4), 0 0 0 0 rgba(239,68,68,0); }
}

/* panel */
#lsw-panel {
  position: absolute;
  bottom: 72px;
  right: 0;
  width: 340px;
  max-width: calc(100vw - 32px);
  max-height: min(600px, 80vh);
  background: var(--lsw-bg);
  border: 1px solid var(--lsw-border);
  border-radius: var(--lsw-radius);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: var(--lsw-text);
  transform-origin: bottom right;
  transform: scale(0.9) translateY(12px);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.22s ease, opacity 0.22s ease;
}
#lsw-panel.lsw-open {
  transform: scale(1) translateY(0);
  opacity: 1;
  pointer-events: auto;
}
#lsw-panel-body {
  overflow-y: auto;
  overscroll-behavior: contain;
  flex: 1;
}

#lsw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--lsw-border);
  flex-shrink: 0;
}
#lsw-logo {
  font-family: 'Space Mono', monospace;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
#lsw-logo span { color: var(--lsw-accent); }
#lsw-close {
  background: none;
  border: none;
  color: var(--lsw-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
}
.lsw-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lsw-muted);
  background: var(--lsw-surface);
  padding: 4px 9px;
  border-radius: 20px;
  border: 1px solid var(--lsw-border);
  transition: all 0.3s;
}
.lsw-status-pill.lsw-live-pill {
  color: var(--lsw-live);
  border-color: rgba(239,68,68,0.3);
  background: rgba(239,68,68,0.08);
}
.lsw-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--lsw-muted); }
.lsw-status-pill.lsw-live-pill .lsw-status-dot {
  background: var(--lsw-live);
  animation: lsw-pulse-dot 1.2s ease infinite;
}
@keyframes lsw-pulse-dot { 0%,100% { opacity:1; transform:scale(1);} 50% { opacity:0.5; transform:scale(0.7);} }

.lsw-mic-section { display: flex; flex-direction: column; align-items: center; padding: 20px 16px 14px; gap: 12px; }
.lsw-mic-btn {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--lsw-surface2); border: 2px solid var(--lsw-border);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.25s ease; -webkit-tap-highlight-color: transparent;
}
.lsw-mic-btn:active { transform: scale(0.94); }
.lsw-mic-btn.lsw-recording {
  background: rgba(124,58,237,0.15); border-color: var(--lsw-accent);
  animation: lsw-mic-pulse 2s ease infinite;
}
@keyframes lsw-mic-pulse {
  0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
  70% { box-shadow: 0 0 0 16px rgba(124,58,237,0); }
  100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
}
.lsw-mic-icon { font-size: 28px; }
.lsw-mic-btn.lsw-recording .lsw-mic-icon { animation: lsw-mic-bounce 0.8s ease infinite alternate; }
@keyframes lsw-mic-bounce { from { transform: scale(1);} to { transform: scale(1.12);} }
.lsw-mic-label { font-size: 11.5px; color: var(--lsw-muted); text-align: center; font-weight: 500; }

.lsw-waveform { display: flex; align-items: center; gap: 3px; height: 22px; opacity: 0; transition: opacity 0.3s; }
.lsw-waveform.lsw-active { opacity: 1; }
.lsw-wave-bar { width: 3px; border-radius: 2px; background: var(--lsw-accent); animation: lsw-wave-anim 0.6s ease infinite alternate; min-height: 4px; }
.lsw-wave-bar:nth-child(1) { animation-delay: 0s; height: 6px; }
.lsw-wave-bar:nth-child(2) { animation-delay: 0.1s; height: 12px; }
.lsw-wave-bar:nth-child(3) { animation-delay: 0.2s; height: 18px; }
.lsw-wave-bar:nth-child(4) { animation-delay: 0.05s; height: 15px; }
.lsw-wave-bar:nth-child(5) { animation-delay: 0.15s; height: 9px; }
.lsw-wave-bar:nth-child(6) { animation-delay: 0.25s; height: 14px; }
.lsw-wave-bar:nth-child(7) { animation-delay: 0.08s; height: 7px; }
@keyframes lsw-wave-anim { from { transform: scaleY(0.4);} to { transform: scaleY(1.2);} }

.lsw-demo-banner {
  margin: 0 14px 10px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3);
  border-radius: var(--lsw-radius-sm); padding: 8px 12px; font-size: 11px; color: #fbbf24; line-height: 1.5; display: none;
}
.lsw-demo-banner.lsw-visible { display: block; }

.lsw-heard-strip {
  margin: 0 14px 10px; background: var(--lsw-surface); border: 1px solid var(--lsw-border);
  border-radius: var(--lsw-radius-sm); padding: 8px 12px; min-height: 38px; display: flex; align-items: center; gap: 8px;
}
.lsw-heard-label {
  font-family: 'Space Mono', monospace; font-size: 8.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.12em; color: var(--lsw-accent2); white-space: nowrap; flex-shrink: 0;
}
.lsw-heard-text { font-size: 12px; color: var(--lsw-text); font-style: italic; line-height: 1.4; opacity: 0.85; }
.lsw-heard-text.lsw-empty { color: var(--lsw-muted); font-style: normal; }

.lsw-lang-section { padding: 0 14px 12px; }
.lsw-section-label {
  font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.12em; color: var(--lsw-muted); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;
}
.lsw-section-label::after { content: ''; flex: 1; height: 1px; background: var(--lsw-border); }
.lsw-lang-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.lsw-lang-chip {
  position: relative; background: var(--lsw-surface); border: 1px solid var(--lsw-border); border-radius: var(--lsw-radius-sm);
  padding: 6px 4px; text-align: center; cursor: pointer; transition: all 0.18s; -webkit-tap-highlight-color: transparent;
  display: flex; flex-direction: column; align-items: center; gap: 1px; user-select: none;
}
.lsw-lang-chip:active { transform: scale(0.95); }
.lsw-lang-chip.lsw-selected { border-color: var(--lsw-accent); background: rgba(124,58,237,0.12); }
.lsw-lang-flag { font-size: 16px; line-height: 1; filter: grayscale(40%); }
.lsw-lang-chip.lsw-selected .lsw-lang-flag { filter: none; }
.lsw-lang-name { font-size: 8.5px; font-weight: 600; color: var(--lsw-muted); letter-spacing: 0.02em; }
.lsw-lang-chip.lsw-selected .lsw-lang-name { color: var(--lsw-text); }
.lsw-lang-chip .lsw-check { position: absolute; top: 2px; right: 3px; font-size: 7px; color: var(--lsw-accent); display: none; }
.lsw-lang-chip.lsw-selected .lsw-check { display: block; }

.lsw-translations-section { padding: 0 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.lsw-trans-card {
  background: var(--lsw-surface); border: 1px solid var(--lsw-border); border-radius: var(--lsw-radius);
  overflow: hidden; transition: all 0.3s ease; opacity: 0; transform: translateY(6px);
}
.lsw-trans-card.lsw-visible { opacity: 1; transform: translateY(0); }
.lsw-trans-card-header { display: flex; align-items: center; gap: 7px; padding: 8px 12px; border-bottom: 1px solid var(--lsw-border); }
.lsw-trans-flag-sm { font-size: 14px; line-height: 1; }
.lsw-trans-lang-name {
  font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--lsw-muted); flex: 1;
}
.lsw-trans-accent { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.lsw-trans-body { padding: 11px 12px; font-size: 13.5px; line-height: 1.55; color: var(--lsw-text); min-height: 40px; display: flex; align-items: center; }
.lsw-trans-body.lsw-loading { color: var(--lsw-muted); font-style: italic; font-size: 12px; }
.lsw-trans-body.lsw-empty { color: var(--lsw-dim); font-size: 12px; }
.lsw-trans-card:nth-child(1) .lsw-trans-accent { background: var(--lsw-accent); }
.lsw-trans-card:nth-child(2) .lsw-trans-accent { background: var(--lsw-accent2); }
.lsw-trans-card:nth-child(3) .lsw-trans-accent { background: var(--lsw-accent3); }
.lsw-trans-card:nth-child(4) .lsw-trans-accent { background: #10b981; }

#lsw-toast {
  position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(80px);
  background: var(--lsw-surface2); border: 1px solid var(--lsw-border); border-radius: 20px;
  padding: 9px 18px; font-size: 12.5px; font-weight: 500; color: var(--lsw-text);
  z-index: 2147483001; transition: transform 0.3s ease; white-space: nowrap; max-width: calc(100vw - 40px); text-align: center;
}
#lsw-toast.lsw-show { transform: translateX(-50%) translateY(0); }
#lsw-toast.lsw-error { border-color: rgba(239,68,68,0.4); color: #fca5a5; }

@media (max-width: 420px) {
  #lsw-root { bottom: 14px; right: 14px; }
  #lsw-panel { bottom: 66px; width: calc(100vw - 28px); }
}
`;
  document.head.appendChild(style);

  /* ---------- markup ---------- */
  var root = document.createElement('div');
  root.id = 'lsw-root';
  root.innerHTML = `
    <button id="lsw-bubble" aria-label="Open LangSync translator">🎙️</button>
    <div id="lsw-panel">
      <div id="lsw-header">
        <div id="lsw-logo">Lang<span>Sync</span></div>
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="lsw-status-pill" id="lsw-statusPill">
            <div class="lsw-status-dot"></div>
            <span id="lsw-statusText">Ready</span>
          </div>
          <button id="lsw-close" aria-label="Close">✕</button>
        </div>
      </div>
      <div id="lsw-panel-body">
        <div class="lsw-mic-section">
          <button class="lsw-mic-btn" id="lsw-micBtn">
            <span class="lsw-mic-icon" id="lsw-micIcon">🎙️</span>
          </button>
          <div class="lsw-waveform" id="lsw-waveform">
            <div class="lsw-wave-bar"></div><div class="lsw-wave-bar"></div><div class="lsw-wave-bar"></div>
            <div class="lsw-wave-bar"></div><div class="lsw-wave-bar"></div><div class="lsw-wave-bar"></div><div class="lsw-wave-bar"></div>
          </div>
          <div class="lsw-mic-label" id="lsw-micLabel">Tap to start listening</div>
        </div>
        <div class="lsw-demo-banner" id="lsw-demoBanner">
          ⚡ Your browser doesn't support free live speech recognition, so this is running in demo mode with sample text. Try Chrome or Edge for live translation.
        </div>
        <div class="lsw-heard-strip">
          <div class="lsw-heard-label">Heard</div>
          <div class="lsw-heard-text lsw-empty" id="lsw-heardText">Nothing yet — start listening</div>
        </div>
        <div class="lsw-lang-section">
          <div class="lsw-section-label">Listening for</div>
          <div class="lsw-lang-grid" id="lsw-sourceGrid"></div>
        </div>
        <div class="lsw-lang-section">
          <div class="lsw-section-label">Translate into</div>
          <div class="lsw-lang-grid" id="lsw-langGrid"></div>
        </div>
        <div class="lsw-translations-section" id="lsw-translationsSection">
          <div class="lsw-section-label">Live translations</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  var toast = document.createElement('div');
  toast.id = 'lsw-toast';
  document.body.appendChild(toast);

  var $ = function (id) { return root.querySelector('#' + id); };

  /* ---------- data ---------- */
  var LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸', speech: 'en-US', translate: 'en' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', speech: 'es-ES', translate: 'es' },
    { code: 'fr', name: 'French',  flag: '🇫🇷', speech: 'fr-FR', translate: 'fr' },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷', speech: 'pt-BR', translate: 'pt-BR' },
    { code: 'de', name: 'German',  flag: '🇩🇪', speech: 'de-DE', translate: 'de' },
    { code: 'ja', name: 'Japanese',flag: '🇯🇵', speech: 'ja-JP', translate: 'ja' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', speech: 'zh-CN', translate: 'zh-CN' },
    { code: 'ar', name: 'Arabic',  flag: '🇸🇦', speech: 'ar-SA', translate: 'ar' },
    { code: 'ko', name: 'Korean',  flag: '🇰🇷', speech: 'ko-KR', translate: 'ko' },
    { code: 'hi', name: 'Hindi',   flag: '🇮🇳', speech: 'hi-IN', translate: 'hi' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', speech: 'ru-RU', translate: 'ru' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', speech: 'it-IT', translate: 'it' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪', speech: 'sw-KE', translate: 'sw' },
  ];

  var DEMO_TRANSLATIONS = {
    en: 'We are broadcasting live from the studio right now.',
    es: 'Estamos transmitiendo en vivo desde el estudio.',
    fr: 'Nous diffusons en direct depuis le studio.',
    pt: 'Estamos transmitindo ao vivo do estúdio.',
    de: 'Wir senden live aus dem Studio.',
    ja: 'スタジオからライブ配信中です。',
    zh: '我们正在演播室进行直播。',
    ar: 'نبث مباشرة من الاستوديو.',
    ko: '스튜디오에서 생방송 중입니다.',
    hi: 'हम स्टूडियो से लाइव प्रसारण कर रहे हैं।',
    ru: 'Мы ведём прямую трансляцию из студии.',
    it: 'Stiamo trasmettendo in diretta dallo studio.',
    sw: 'Tunarushia moja kwa moja kutoka studioni.',
  };

  var DEMO_HEARD = [
    'We are live from the studio right now.',
    'The guests will join us after the break.',
    'Coming up next, an exclusive interview.',
    'Breaking news from around the world.',
    'Stay with us, we will be right back.',
  ];

  var selectedLangs = ['en', 'es'];
  var sourceLang = 'en';
  var isListening = false;
  var recognition = null;
  var isDemoMode = false;
  var demoIdx = 0;
  var demoInterval = null;
  var toastTimer = null;
  var speechSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  /* ---------- render ---------- */
  function renderSourceGrid() {
    $('lsw-sourceGrid').innerHTML = LANGUAGES.map(function (l) {
      return '<div class="lsw-lang-chip ' + (sourceLang === l.code ? 'lsw-selected' : '') + '" data-code="' + l.code + '" data-role="source">' +
        '<span class="lsw-check">✓</span><span class="lsw-lang-flag">' + l.flag + '</span><span class="lsw-lang-name">' + l.name + '</span></div>';
    }).join('');
  }

  function renderLangGrid() {
    $('lsw-langGrid').innerHTML = LANGUAGES.map(function (l) {
      return '<div class="lsw-lang-chip ' + (selectedLangs.indexOf(l.code) > -1 ? 'lsw-selected' : '') + '" data-code="' + l.code + '" data-role="target">' +
        '<span class="lsw-check">✓</span><span class="lsw-lang-flag">' + l.flag + '</span><span class="lsw-lang-name">' + l.name + '</span></div>';
    }).join('');
  }

  function renderTranslationCards() {
    var section = $('lsw-translationsSection');
    var label = section.querySelector('.lsw-section-label');
    section.innerHTML = '';
    if (label) section.appendChild(label);

    selectedLangs.forEach(function (code, i) {
      var lang = LANGUAGES.find(function (l) { return l.code === code; });
      if (!lang) return;
      var card = document.createElement('div');
      card.className = 'lsw-trans-card';
      card.id = 'lsw-card-' + code;
      card.innerHTML =
        '<div class="lsw-trans-card-header"><span class="lsw-trans-flag-sm">' + lang.flag + '</span>' +
        '<span class="lsw-trans-lang-name">' + lang.name + '</span><div class="lsw-trans-accent"></div></div>' +
        '<div class="lsw-trans-body lsw-empty" id="lsw-trans-' + code + '">Waiting for audio...</div>';
      section.appendChild(card);
      requestAnimationFrame(function () {
        setTimeout(function () { card.classList.add('lsw-visible'); }, i * 80);
      });
    });
  }

  function setTranslation(code, text, isLoading) {
    var el = $('lsw-trans-' + code);
    if (!el) return;
    el.className = 'lsw-trans-body' + (isLoading ? ' lsw-loading' : '');
    el.textContent = isLoading ? 'Translating...' : text;
  }

  function setStatus(state, text) {
    var pill = $('lsw-statusPill');
    pill.className = 'lsw-status-pill' + (state === 'live' ? ' lsw-live-pill' : '');
    $('lsw-statusText').textContent = text;
    $('lsw-bubble').classList.toggle('lsw-live', state === 'live');
  }

  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.className = 'lsw-show' + (isError ? ' lsw-error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('lsw-show'); }, 3000);
  }

  /* ---------- interaction ---------- */
  $('lsw-sourceGrid').addEventListener('click', function (e) {
    var chip = e.target.closest('.lsw-lang-chip');
    if (!chip) return;
    var code = chip.dataset.code;
    if (sourceLang === code) return;
    sourceLang = code;
    renderSourceGrid();
    if (isListening && recognition) recognition.stop();
  });

  $('lsw-langGrid').addEventListener('click', function (e) {
    var chip = e.target.closest('.lsw-lang-chip');
    if (!chip) return;
    var code = chip.dataset.code;
    if (selectedLangs.indexOf(code) > -1) {
      if (selectedLangs.length <= 1) return showToast('Pick at least one language');
      selectedLangs = selectedLangs.filter(function (c) { return c !== code; });
    } else {
      if (selectedLangs.length >= 4) return showToast('Max 4 languages at once');
      selectedLangs.push(code);
    }
    renderLangGrid();
    renderTranslationCards();
  });

  $('lsw-bubble').addEventListener('click', function () {
    $('lsw-panel').classList.toggle('lsw-open');
  });
  $('lsw-close').addEventListener('click', function () {
    $('lsw-panel').classList.remove('lsw-open');
  });
  $('lsw-micBtn').addEventListener('click', function () {
    if (isListening) stopListening(); else startListening();
  });

  function startListening() {
    isDemoMode = !speechSupported;
    isListening = true;
    setStatus('live', isDemoMode ? 'Demo' : 'Live');
    $('lsw-micBtn').classList.add('lsw-recording');
    $('lsw-micIcon').textContent = '⏹️';
    $('lsw-micLabel').textContent = isDemoMode ? 'Demo mode — tap to stop' : 'Listening — tap to stop';
    $('lsw-waveform').classList.add('lsw-active');
    $('lsw-demoBanner').classList.toggle('lsw-visible', isDemoMode);

    if (isDemoMode) { runDemoLoop(); return; }

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = (LANGUAGES.find(function (l) { return l.code === sourceLang; }) || {}).speech || 'en-US';

    recognition.onresult = function (e) {
      var result = e.results[e.results.length - 1];
      var transcript = result[0].transcript.trim();
      if (!transcript) return;
      var heardEl = $('lsw-heardText');
      heardEl.textContent = '"' + transcript + '"';
      heardEl.classList.remove('lsw-empty');
      if (result.isFinal) handleTranscript(transcript);
    };

    recognition.onerror = function (e) {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        showToast('Mic access denied — check browser permissions', true);
        stopListening();
      }
    };

    recognition.onend = function () {
      if (isListening) {
        recognition.lang = (LANGUAGES.find(function (l) { return l.code === sourceLang; }) || {}).speech || 'en-US';
        recognition.start();
      }
    };

    try { recognition.start(); }
    catch (err) { showToast('Mic access denied — check browser permissions', true); stopListening(); }
  }

  function stopListening() {
    isListening = false;
    clearInterval(demoInterval);
    if (recognition) { recognition.onend = null; recognition.stop(); recognition = null; }
    setStatus('idle', 'Ready');
    $('lsw-micBtn').classList.remove('lsw-recording');
    $('lsw-micIcon').textContent = '🎙️';
    $('lsw-micLabel').textContent = 'Tap to start listening';
    $('lsw-waveform').classList.remove('lsw-active');
    $('lsw-demoBanner').classList.remove('lsw-visible');
  }

  function runDemoLoop() {
    function tick() {
      var heard = DEMO_HEARD[demoIdx % DEMO_HEARD.length];
      demoIdx++;
      $('lsw-heardText').textContent = heard;
      $('lsw-heardText').classList.remove('lsw-empty');
      selectedLangs.forEach(function (code) { setTranslation(code, null, true); });
      setTimeout(function () {
        selectedLangs.forEach(function (code) {
          setTranslation(code, code === 'en' ? heard : (DEMO_TRANSLATIONS[code] || '—'));
        });
      }, 800);
    }
    tick();
    demoInterval = setInterval(tick, 5000);
  }

  // Free, no API key needed: MyMemory public translation API (~5,000 words/day/IP)
  function handleTranscript(transcript) {
    if (!transcript) return;
    var langsToTranslate = selectedLangs.filter(function (code) { return code !== sourceLang; });
    if (selectedLangs.indexOf(sourceLang) > -1) setTranslation(sourceLang, transcript);
    langsToTranslate.forEach(function (code) { setTranslation(code, null, true); });
    if (!langsToTranslate.length) return;

    var sourceCode = (LANGUAGES.find(function (l) { return l.code === sourceLang; }) || {}).translate || 'en';
    var anyFailed = false;

    Promise.all(langsToTranslate.map(function (code) {
      var targetCode = (LANGUAGES.find(function (l) { return l.code === code; }) || {}).translate || code;
      var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(transcript) + '&langpair=' + sourceCode + '|' + targetCode;
      return fetch(url).then(function (res) { return res.json(); }).then(function (data) {
        var translated = data && data.responseData && data.responseData.translatedText;
        if (!translated || (data && data.responseStatus === 403)) throw new Error('No translation');
        setTranslation(code, translated);
      }).catch(function () {
        setTranslation(code, 'Translation error');
        anyFailed = true;
      });
    })).then(function () {
      if (anyFailed) showToast('Some translations failed — may be rate-limited', true);
    });
  }

  renderSourceGrid();
  renderLangGrid();
  renderTranslationCards();
})();
