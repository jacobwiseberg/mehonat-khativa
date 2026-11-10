/* Hebrew Typing Trainer — vanilla JS, no dependencies, no network calls
   except loading data/words.json from the same origin. */
(() => {
  'use strict';

  const STORAGE_KEY = 'mehonat-khativa:v1';
  const AUTO_ADVANCE_MS = 1100;

  // Standard Israeli PC keyboard layout (SI-1452), letter rows only.
  // [KeyboardEvent.code, QWERTY label, Hebrew character]
  const ROWS = [
    [['KeyQ', 'q', '/'], ['KeyW', 'w', "'"], ['KeyE', 'e', 'ק'], ['KeyR', 'r', 'ר'], ['KeyT', 't', 'א'],
     ['KeyY', 'y', 'ט'], ['KeyU', 'u', 'ו'], ['KeyI', 'i', 'ן'], ['KeyO', 'o', 'ם'], ['KeyP', 'p', 'פ']],
    [['KeyA', 'a', 'ש'], ['KeyS', 's', 'ד'], ['KeyD', 'd', 'ג'], ['KeyF', 'f', 'כ'], ['KeyG', 'g', 'ע'],
     ['KeyH', 'h', 'י'], ['KeyJ', 'j', 'ח'], ['KeyK', 'k', 'ל'], ['KeyL', 'l', 'ך'], ['Semicolon', ';', 'ף']],
    [['KeyZ', 'z', 'ז'], ['KeyX', 'x', 'ס'], ['KeyC', 'c', 'ב'], ['KeyV', 'v', 'ה'], ['KeyB', 'b', 'נ'],
     ['KeyN', 'n', 'מ'], ['KeyM', 'm', 'צ'], ['Comma', ',', 'ת'], ['Period', '.', 'ץ']],
  ];

  // Physical key code -> Hebrew character (used when the OS layout is English).
  const CODE_MAP = { Quote: ',', Slash: '.' };
  ROWS.forEach((row) => row.forEach(([code, , heb]) => { CODE_MAP[code] = heb; }));

  const NIQQUD = /[֑-ׇ]/g;
  const HEBREW_LETTER = /[א-ת]/;
  const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  const $ = (id) => document.getElementById(id);
  const el = {
    target: $('target'),
    translit: $('translit'),
    meaning: $('meaning'),
    progress: $('progress'),
    input: $('typeInput'),
    result: $('result'),
    skipBtn: $('skipBtn'),
    retryBtn: $('retryBtn'),
    nextBtn: $('nextBtn'),
    keyboard: $('keyboard'),
    statWords: $('statWords'),
    statAcc: $('statAcc'),
    statWpm: $('statWpm'),
    statPerfect: $('statPerfect'),
    settings: $('settings'),
    optKeyboard: $('optKeyboard'),
    optHints: $('optHints'),
    optLabels: $('optLabels'),
    optMap: $('optMap'),
    resetStats: $('resetStats'),
    resetProgress: $('resetProgress'),
  };

  // ---------- Persistence (localStorage only) ----------

  const DEFAULTS = {
    settings: { onscreen: true, hints: true, labels: true, mapLatin: true },
    stats: { words: 0, chars: 0, correct: 0, ms: 0, perfect: 0 },
    progress: { shuffleOrder: null, pos: 0 },
  };

  function loadSaved() {
    const base = JSON.parse(JSON.stringify(DEFAULTS));
    let hadSavedData = false;
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (data && typeof data === 'object') {
        hadSavedData = true;
        Object.assign(base.settings, data.settings);
        Object.assign(base.stats, data.stats);
        Object.assign(base.progress, data.progress);
      }
    } catch (_) { /* storage unavailable or corrupt: start fresh */ }
    // First-ever visit on a touch device: default to the device's own
    // Hebrew keyboard rather than the on-screen one.
    if (!hadSavedData && isCoarse) base.settings.onscreen = false;
    return base;
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch (_) { /* ignore */ }
  }

  const saved = loadSaved();

  // ---------- Session state ----------

  let words = [];
  let order = [];
  let targetChars = [];
  let typed = '';
  let startTime = 0;
  let finished = false;
  let advanceTimer = 0;
  const keyEls = new Map(); // char/action -> button

  const range = (n) => Array.from({ length: n }, (_, i) => i);
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const getPos = () => saved.progress.pos;
  function setPos(p) { saved.progress.pos = p; }

  function buildOrder(forceNewShuffle) {
    const n = words.length;
    let o = saved.progress.shuffleOrder;
    const valid = Array.isArray(o) && o.length === n && o.every((i) => Number.isInteger(i) && i >= 0 && i < n);
    if (forceNewShuffle || !valid) {
      o = shuffle(range(n));
      saved.progress.shuffleOrder = o;
      saved.progress.pos = 0;
    }
    order = o;
    const p = getPos();
    if (!Number.isInteger(p) || p < 0 || p >= n) setPos(0);
  }

  const currentWord = () => words[order[getPos()]];

  // ---------- Rendering ----------

  function showWord() {
    clearTimeout(advanceTimer);
    const w = currentWord();
    targetChars = Array.from(w.hebrew);
    typed = '';
    startTime = 0;
    finished = false;

    el.input.value = '';
    el.result.textContent = '';
    el.result.className = 'result';
    el.target.className = 'target';
    el.target.replaceChildren(...targetChars.map((ch) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      return s;
    }));
    el.target.setAttribute('aria-label', w.hebrew);
    el.translit.textContent = w.transliteration;
    el.meaning.textContent = w.english;
    el.progress.textContent = `Word ${getPos() + 1} of ${order.length} · shuffled`;

    el.skipBtn.hidden = false;
    el.retryBtn.hidden = true;
    el.nextBtn.hidden = true;
    renderTyped();
  }

  function renderTyped() {
    const spans = el.target.children;
    for (let i = 0; i < spans.length; i++) {
      let cls = 'ch';
      if (i < typed.length) cls += typed[i] === targetChars[i] ? ' ok' : ' bad';
      else if (i === typed.length && !finished) cls += ' cur';
      spans[i].className = cls;
    }
    updateHint();
  }

  function updateHint() {
    keyEls.forEach((b) => b.classList.remove('hint'));
    if (!saved.settings.hints || !saved.settings.onscreen) return;
    const key = finished ? keyEls.get('enter') : keyEls.get(targetChars[typed.length]);
    if (key) key.classList.add('hint');
  }

  function renderStats() {
    const s = saved.stats;
    el.statWords.textContent = String(s.words);
    el.statAcc.textContent = s.chars ? `${Math.round((s.correct / s.chars) * 100)}%` : '—';
    el.statWpm.textContent = s.ms > 0 ? String(Math.round((s.chars / 5) / (s.ms / 60000))) : '—';
    el.statPerfect.textContent = String(s.perfect);
  }

  function setResult(text, kind) {
    el.result.textContent = text;
    el.result.className = `result ${kind || ''}`;
  }

  // ---------- Typing logic ----------

  function setTyped(value) {
    if (finished) { el.input.value = typed; return; }
    let v = String(value).replace(NIQQUD, '').replace(/[\r\n]/g, '');
    const max = targetChars.length;
    if (v.length > max) v = v.slice(0, max);
    typed = v;
    if (el.input.value !== v) el.input.value = v;
    if (v.length && !startTime) startTime = performance.now();
    renderTyped();
    if (v.length === max) finish();
  }

  function finish() {
    finished = true;
    const len = targetChars.length;
    const elapsed = Math.max(performance.now() - startTime, 250);
    let correct = 0;
    for (let i = 0; i < len; i++) if (typed[i] === targetChars[i]) correct++;
    const acc = Math.round((correct / len) * 100);
    const wpm = Math.round((len / 5) / (elapsed / 60000));

    const s = saved.stats;
    s.words += 1;
    s.chars += len;
    s.correct += correct;
    s.ms += elapsed;
    if (correct === len) s.perfect += 1;
    save();
    renderStats();
    renderTyped();

    el.skipBtn.hidden = true;
    el.nextBtn.hidden = false;
    if (correct === len) {
      el.target.classList.add('done-perfect');
      setResult(`מצוין! Great job — 100% · ${wpm} WPM`, 'great');
      el.retryBtn.hidden = true;
      advanceTimer = setTimeout(next, AUTO_ADVANCE_MS);
    } else {
      setResult(acc >= 50 ? `Almost! ${acc}% correct — try again?` : `${acc}% correct — try again`, 'retry');
      el.retryBtn.hidden = false;
    }
  }

  function next() {
    clearTimeout(advanceTimer);
    let p = getPos() + 1;
    let wrapped = false;
    if (p >= order.length) {
      wrapped = true;
      p = 0;
      buildOrder(true);
    }
    setPos(p);
    save();
    showWord();
    if (wrapped) setResult('🎉 You finished the whole list! Starting again.', 'info');
    focusInput();
  }

  function retry() {
    showWord();
    focusInput();
  }

  function focusInput() {
    // On touch devices with the on-screen keyboard, avoid popping up the OS keyboard.
    if (!isCoarse || !saved.settings.onscreen) el.input.focus({ preventScroll: true });
  }

  // ---------- On-screen keyboard ----------

  function makeKey(label, opts) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `key ${opts.cls || ''}`.trim();
    if (opts.char) b.dataset.char = opts.char;
    if (opts.action) b.dataset.action = opts.action;
    b.setAttribute('aria-label', opts.aria || label);
    const main = document.createElement('span');
    main.className = 'heb';
    main.textContent = label;
    b.append(main);
    if (opts.latin) {
      const lat = document.createElement('span');
      lat.className = 'lat';
      lat.textContent = opts.latin;
      lat.setAttribute('aria-hidden', 'true');
      b.append(lat);
    }
    return b;
  }

  function buildKeyboard() {
    const frag = document.createDocumentFragment();
    ROWS.forEach((row, r) => {
      const rowEl = document.createElement('div');
      rowEl.className = `kb-row r${r}`;
      row.forEach(([, latin, heb]) => {
        const b = makeKey(heb, { char: heb, latin, aria: `${heb} (key ${latin.toUpperCase()})` });
        keyEls.set(heb, b);
        rowEl.append(b);
      });
      frag.append(rowEl);
    });

    const bottom = document.createElement('div');
    bottom.className = 'kb-row r3';
    const back = makeKey('⌫', { action: 'back', cls: 'mod back', aria: 'Backspace' });
    const space = makeKey('רווח', { action: 'space', cls: 'mod space', aria: 'Space' });
    const enter = makeKey('הבא ↵', { action: 'enter', cls: 'mod enter', aria: 'Next word' });
    keyEls.set('back', back);
    keyEls.set('space', space);
    keyEls.set('enter', enter);
    bottom.append(back, space, enter);
    frag.append(bottom);
    el.keyboard.replaceChildren(frag);

    // pointerdown = instant response on touch and keeps focus in the text input.
    el.keyboard.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.key');
      if (!b || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      pressKey(b);
    });
    // Keyboard activation of a focused key button (Enter/Space) arrives as click with detail 0.
    el.keyboard.addEventListener('click', (e) => {
      const b = e.target.closest('.key');
      if (b && e.detail === 0) pressKey(b);
    });
    el.keyboard.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function flashKey(b) {
    if (!b) return;
    b.classList.add('pressed');
    setTimeout(() => b.classList.remove('pressed'), 110);
  }

  function pressKey(b) {
    flashKey(b);
    const action = b.dataset.action;
    if (action === 'enter') {
      if (finished) next();
      return;
    }
    if (finished) return;
    if (action === 'back') setTyped(typed.slice(0, -1));
    else if (action === 'space') setTyped(`${typed} `);
    else setTyped(typed + b.dataset.char);
  }

  // ---------- Physical / system keyboard ----------

  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || e.keyCode === 229) return;
    const t = e.target;
    const tag = t && t.tagName;
    const inInput = t === el.input;
    if ((tag === 'INPUT' && !inInput) || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if ((tag === 'BUTTON' || tag === 'SUMMARY') && (e.key === 'Enter' || e.key === ' ')) return;
    if (el.settings.open && !inInput && e.key !== 'Escape') return;

    if (e.key === 'Escape' && el.settings.open) { el.settings.open = false; return; }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (finished) next();
      flashKey(keyEls.get('enter'));
      return;
    }
    if (finished) {
      if (e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key.length === 1) e.preventDefault();
      return;
    }
    if (e.key === 'Backspace') {
      flashKey(keyEls.get('back'));
      if (!inInput) { e.preventDefault(); setTyped(typed.slice(0, -1)); }
      return;
    }
    if (!e.key || e.key.length !== 1) return;

    let ch = e.key;
    if (!HEBREW_LETTER.test(ch) && saved.settings.mapLatin && CODE_MAP[e.code]) ch = CODE_MAP[e.code];
    flashKey(ch === ' ' ? keyEls.get('space') : keyEls.get(ch));

    if (inInput && ch === e.key) return; // native input handles it (e.g. OS Hebrew layout)
    e.preventDefault();
    setTyped(typed + ch);
    if (!inInput) focusInput();
  }

  // ---------- Settings ----------

  function applySettings() {
    const st = saved.settings;
    el.optKeyboard.checked = st.onscreen;
    el.optHints.checked = st.hints;
    el.optLabels.checked = st.labels;
    el.optMap.checked = st.mapLatin;
    el.keyboard.hidden = !st.onscreen;
    document.body.classList.toggle('no-labels', !st.labels);
    // With the on-screen keyboard on a touch device, suppress the OS keyboard.
    el.input.inputMode = st.onscreen && isCoarse ? 'none' : 'text';
    updateHint();
  }

  function bindSettings() {
    const toggle = (input, key) => input.addEventListener('change', () => {
      saved.settings[key] = input.checked;
      save();
      applySettings();
    });
    toggle(el.optKeyboard, 'onscreen');
    toggle(el.optHints, 'hints');
    toggle(el.optLabels, 'labels');
    toggle(el.optMap, 'mapLatin');

    el.resetStats.addEventListener('click', () => {
      if (!window.confirm('Clear your saved stats on this device?')) return;
      saved.stats = { ...DEFAULTS.stats };
      save();
      renderStats();
      setResult('Stats cleared.', 'info');
    });
    el.resetProgress.addEventListener('click', () => {
      buildOrder(true);
      setPos(0);
      save();
      showWord();
      el.settings.open = false;
      setResult('Starting from the first word.', 'info');
    });

    // Close the settings panel when tapping elsewhere.
    document.addEventListener('pointerdown', (e) => {
      if (el.settings.open && !el.settings.contains(e.target)) el.settings.open = false;
    });
  }

  // ---------- Init ----------

  async function init() {
    buildKeyboard();
    bindSettings();
    applySettings();
    renderStats();

    el.input.addEventListener('input', () => setTyped(el.input.value));
    document.addEventListener('keydown', onKeyDown);
    el.skipBtn.addEventListener('click', () => next());
    el.nextBtn.addEventListener('click', () => next());
    el.retryBtn.addEventListener('click', () => retry());

    try {
      const res = await fetch('data/words.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      words = data
        .filter((w) => w && typeof w.hebrew === 'string' && w.hebrew.trim())
        .map((w) => ({ ...w, hebrew: w.hebrew.replace(NIQQUD, '').trim() }))
        .sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9));
      if (!words.length) throw new Error('word list is empty');
    } catch (err) {
      el.progress.textContent = '';
      setResult(
        `Couldn't load the word list (${err.message}). If you opened index.html straight from disk, ` +
        'run a local web server instead, e.g. "python3 -m http.server".',
        'retry'
      );
      return;
    }

    buildOrder(false);
    save();
    showWord();
    if (!isCoarse) focusInput();
  }

  init();
})();
