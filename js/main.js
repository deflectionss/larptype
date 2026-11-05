(() => {
  const U = LT.U, S = LT.S, FX = LT.FX, Theme = LT.Theme, DB = LT.DB, T = LT.Test, V = LT.View;
  const body = document.body;
  const Router = { current: 'test' };
  LT.Router = Router;
  let needsNew = false, navToken = 0;

  const PAGES = { test: '#/', stats: '#/stats', settings: '#/settings', about: '#/about', privacy: '#/privacy' };
  const navInd = () => FX.indicator(U.$('#nav'));
  const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  const hashParts = () => location.hash.replace(/^#\/?/, '').split('/');
  const fromHash = () => { const h = hashParts()[0]; return PAGES[h] ? h : 'test'; };
  const anchorFromHash = () => hashParts()[1] || '';
  const toAnchor = a => { const el = a && document.getElementById(a); if (el) el.scrollIntoView({ behavior: U.motion() ? 'smooth' : 'auto', block: 'start' }); return !!el; };
  const MAIL = ['goldypepperemail', 'gmail.com'].join('@');
  const contactLine = `Discord <button class="copy-chip" data-copy="deflectionss" data-tip="click to copy">${U.icon('chat')}deflectionss</button> or email <a class="copy-chip" href="mailto:${MAIL}">${U.icon('mail')}${MAIL}</a>`;

  const aboutHTML = () => `<div class="about">
    <div class="card"><h2>larptype</h2><p>A minimal typing test for Roblox players, Roblox devs and vibecoders. Start typing and the test begins on your first key. The words mix Roblox slang, Studio and scripting terms, vibecoding lingo and ad metrics like ctr, cpm and qptr. Everything is saved in this browser: stats, personal bests, xp, badges and settings. No account, no server.</p></div>
    <div class="card"><h2>modes</h2><p><b>time</b> types for a set number of seconds. <b>words</b> ends after a set number of words. <b>quote</b> gives you a full sentence about building games or shipping code, or a line of Luau. <b>zen</b> has no target at all, finish it with shift + enter. <b>custom</b> uses any text you paste.</p>
    <p><b>challenge mods</b> stack on top of any mode: lava raises a lava line on every mistake, blind hides errors, memory fades the words out, mirror and upside down flip them, random case scrambles capitals and no backspace makes every key final.</p></div>
    <div class="card"><h2>stats</h2><p><b>wpm</b> counts the characters of correctly typed words, spaces included, divided by five, per minute. <b>raw</b> counts every keystroke, mistakes too. <b>accuracy</b> is correct keystrokes over all keystrokes, so fixed mistakes still count. <b>consistency</b> measures how even your raw speed was from one second to the next.</p>
    <p><b>weak keys</b> are found from how often you miss each letter and how long it takes you to press it compared to your other keys. The weak key practice builds a test from words that use those letters a lot.</p></div>
    <div class="card"><h2>shortcuts</h2><div class="kb-list">
      <span><kbd>tab</kbd></span><span>new test (quick restart key can be changed in settings)</span>
      <span><kbd>shift</kbd> + <kbd>tab</kbd></span><span>repeat the same test</span>
      <span><kbd>esc</kbd> or <kbd>ctrl</kbd> + <kbd>k</kbd></span><span>command line: search every setting, theme, font and action</span>
      <span><kbd>ctrl</kbd> + <kbd>backspace</kbd></span><span>delete the whole word</span>
      <span><kbd>shift</kbd> + <kbd>enter</kbd></span><span>finish a zen test</span>
      <span><kbd>↑</kbd> <kbd>↓</kbd> in the command line</span><span>move, themes preview live as you move</span>
    </div></div>
    <div class="card" id="credits"><h2>credits</h2>
      <p><b>Monkeytype.</b> larptype is inspired by ${ext('https://monkeytype.com', 'Monkeytype')}, the open-source typing test made by Miodec and its contributors. larptype is an independent project with its own code. It is not affiliated with or endorsed by Monkeytype.</p>
      <p><b>Roblox.</b> Roblox and Robux are trademarks of Roblox Corporation. larptype is a fan-made project and is not affiliated with, endorsed by or sponsored by Roblox Corporation.</p>
      <p><b>Icons</b> from ${ext('https://lucide.dev', 'Lucide')} under the ISC license, see the ${ext('THIRD-PARTY-NOTICES.txt', 'license notice')}. <b>Fonts</b> from ${ext('https://fonts.google.com', 'Google Fonts')} under their own open font licenses.</p>
      <p>How your data is handled: <a href="#/privacy">privacy</a>.</p>
    </div>
    <div class="card" id="contact"><h2>contact</h2>
      <p>Found a bug, have an idea or a question? Reach me on ${contactLine}.</p>
    </div></div>`;

  const privacyHTML = () => `<div class="about">
    <div class="card"><h2>privacy</h2>
      <p>larptype has no accounts, no ads, no analytics and no tracking cookies.</p>
      <p><b>What is saved.</b> Your name, settings, test results, personal bests, key stats, xp and badges are saved in your browser's local storage, on this device only. larptype never sends them anywhere.</p>
      <p><b>Fonts.</b> Fonts are loaded from Google Fonts. To download them, your browser connects to Google's servers, which can see your IP address. Google explains how it handles this in its ${ext('https://policies.google.com/privacy', 'privacy policy')}.</p>
      <p><b>Hosting.</b> The service that hosts this website may keep standard server logs, such as IP addresses and which pages were requested.</p>
      <p><b>Clipboard and files.</b> larptype only uses your clipboard when you press a copy button, and only creates a file when you press export or save.</p>
      <p><b>Your control.</b> Export your history in settings, data. Delete everything with clear stats in the same place, or by clearing this site's data in your browser.</p>
      <p><b>Contact.</b> Questions about privacy: ${contactLine}.</p>
      <p class="muted stamp">Last updated November 5, 2026.</p>
    </div>
    <div class="card"><h2>credits</h2>
      <p>Inspired by ${ext('https://monkeytype.com', 'Monkeytype')}. Not affiliated with Monkeytype or Roblox Corporation. Full credits are on the <a href="#/about">about</a> page.</p>
    </div></div>`;

  Router.go = async (name, instant = false, anchor = '') => {
    if (name === Router.current && !instant) { toAnchor(anchor); return; }
    const token = ++navToken;
    const prev = Router.current;
    const from = U.$('#page-' + prev), to = U.$('#page-' + name);
    if (prev === 'test' && T.state === 'running') T.newTest();
    if (prev === 'settings') LT.Settings.leave();
    if (prev === 'stats') LT.Stats.leave();
    if (!instant && from !== to) {
      from.classList.add('leave');
      await U.wait(U.ms(150));
      if (token !== navToken) return;
      from.hidden = true;
      from.classList.remove('leave', 'active');
    } else if (from !== to) { from.hidden = true; from.classList.remove('active'); }
    Router.current = name;
    if (name === 'stats') LT.Stats.show();
    if (name === 'settings') LT.Settings.show();
    if (name === 'about') { to.innerHTML = aboutHTML(); }
    if (name === 'privacy') { to.innerHTML = privacyHTML(); }
    to.classList.add('enter');
    to.hidden = false;
    void to.offsetWidth;
    to.classList.add('active');
    to.classList.remove('enter');
    scrollTo(0, 0);
    if (anchor) toAnchor(anchor);
    U.$$('#nav .nav-btn').forEach(a => a.classList.toggle('active', a.dataset.route === name));
    navInd();
    if (name === 'test') {
      if (needsNew && !LT.Results.isOpen()) { needsNew = false; T.newTest(); }
      else if (!LT.Results.isOpen()) V.relayout();
      syncConfig();
      T.focus();
    } else T.input().blur();
  };

  const NEW_TEST = ['mode', 'time', 'words', 'quoteLength', 'punctuation', 'numbers', 'language', 'customText', 'customShuffle', 'customLimit', 'difficulty', 'paceCaret', 'paceWpm', 'mods'];
  const testChanged = () => {
    if (Router.current !== 'test') { needsNew = true; return; }
    if (T.busy) return;
    T.restart({ theme: false });
  };

  const isPreset = (k, v) => [...U.$$(`#config [data-set="${k}"] [data-v]`)].some(b => b.dataset.v === String(v));
  const syncConfig = () => {
    const mode = S.get('mode');
    U.$$('#config [data-toggle]').forEach(b => b.classList.toggle('active', !!S.get(b.dataset.toggle)));
    U.$$('#config [data-set]').forEach(g => {
      const k = g.dataset.set, v = String(S.get(k));
      const custom = (k === 'time' || k === 'words') && !isPreset(k, v);
      g.querySelectorAll(':scope > [data-v]').forEach(b => b.classList.toggle('active', b.dataset.v === v || (custom && b.dataset.v === 'custom')));
      const cb = g.querySelector('[data-v="custom"]');
      if (cb) cb.dataset.tip = custom ? `custom: ${v}` : 'custom';
    });
    const open = { pn: mode === 'time' || mode === 'words', time: mode === 'time', words: mode === 'words', quote: mode === 'quote', custom: mode === 'custom' };
    U.$$('#config .cfg-sec').forEach(s => s.classList.toggle('open', !!open[s.dataset.sec]));
    U.raf2(() => U.$$('#config .cfg-group').forEach(FX.indicator));
    setTimeout(() => U.$$('#config .cfg-group').forEach(FX.indicator), U.ms(400) + 20);
  };

  const keyTips = () => {
    const q = S.get('quickRestart');
    const restart = q === 'tab' ? '<span><kbd>tab</kbd> restart</span><span class="dot"></span><span><kbd>shift</kbd>+<kbd>tab</kbd> repeat</span>'
      : q === 'esc' ? '<span><kbd>esc</kbd> restart</span>' : q === 'enter' ? '<span><kbd>enter</kbd> restart</span>' : '<span><kbd>tab</kbd> + <kbd>enter</kbd> restart</span>';
    const pal = q === 'esc' ? '<span><kbd>ctrl</kbd>+<kbd>k</kbd> command line</span>' : '<span><kbd>esc</kbd> or <kbd>ctrl</kbd>+<kbd>k</kbd> command line</span>';
    U.$('#keyTips').innerHTML = `${restart}<span class="dot"></span>${pal}`;
  };

  const setBodyClass = (prefix, value) => {
    [...body.classList].forEach(c => { if (c.startsWith(prefix)) body.classList.remove(c); });
    if (value) body.classList.add(prefix + value);
  };

  const appliers = {
    theme: () => { Theme.applyCurrent(); U.$('#themeName').textContent = S.get('theme'); },
    customTheme: () => { if (S.get('theme') === 'custom') Theme.applyCurrent(); },
    name: () => { LT.Progress.updateChip(false); LT.Stats.syncName(); },
    font: () => Theme.setFont(S.get('font')).then(() => { V.relayout(); syncConfig(); }),
    fontSize: () => { Theme.setFontSize(S.get('fontSize')); V.relayout(); },
    motion: () => Theme.setMotion(S.get('motion')),
    caretStyle: () => { setBodyClass('cs-', S.get('caretStyle')); V.relayout(); },
    smoothCaret: () => V.setCaretSpeed(),
    caretBlink: () => V.blink(),
    background: () => setBodyClass('bg-', S.get('background') === 'none' ? '' : S.get('background')),
    focusMode: () => body.classList.toggle('focus-mode', S.get('focusMode')),
    keyTips: () => body.classList.toggle('no-tips', !S.get('keyTips')),
    showLevel: () => body.classList.toggle('no-level', !S.get('showLevel')),
    timerStyle: () => body.classList.toggle('timer-bar', ['bar', 'both'].includes(S.get('timerStyle'))),
    quickRestart: keyTips,
    flipColors: () => T.applyClasses(), colorful: () => T.applyClasses(), highlightWord: () => T.applyClasses(),
    indicateTypos: () => V.refreshAll(), hideExtra: () => V.refreshAll()
  };

  const onKey = e => {
    if (FX.modalOpen || LT.Palette.isOpen()) return;
    const k = e.key;
    if ((e.ctrlKey || e.metaKey) && (k === 'k' || k === 'K' || (e.shiftKey && (k === 'p' || k === 'P')))) { e.preventDefault(); LT.Palette.open(); return; }
    if (k === 'Escape') {
      e.preventDefault();
      if (S.get('quickRestart') === 'esc' && Router.current === 'test') { T.restart(); return; }
      LT.Palette.open();
      return;
    }
    if (Router.current !== 'test') return;
    const qr = S.get('quickRestart');
    if (LT.Results.isOpen()) {
      if (!LT.Results.ready()) { if (k === 'Tab') e.preventDefault(); return; }
      if (k === 'Tab' && qr === 'tab') { e.preventDefault(); e.shiftKey ? T.repeat() : T.restart(); }
      else if (k === 'Enter' && qr === 'enter' && !e.target.closest('button')) { e.preventDefault(); T.restart(); }
      else if (k === 'Tab' && qr === 'off' && !e.target.closest('.r-actions')) { e.preventDefault(); U.$('[data-act="next"]').focus(); }
      return;
    }
    if (e.target === T.input()) return;
    if (k === 'Tab' && qr === 'tab') { e.preventDefault(); e.shiftKey ? T.repeat() : T.restart(); return; }
    const inField = e.target.closest && e.target.closest('input, textarea, select');
    if (!inField && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) T.focus();
  };

  const boot = () => {
    S.load();
    DB.load();
    Theme.setMotion(S.get('motion'));
    Theme.setFontSize(S.get('fontSize'));
    Theme.applyCurrent(false);
    const fontP = Theme.setFont(S.get('font'));
    U.$('#themeName').textContent = S.get('theme');
    ['caretStyle', 'background', 'focusMode', 'keyTips', 'showLevel', 'timerStyle'].forEach(k => appliers[k] && (k === 'caretStyle' ? setBodyClass('cs-', S.get('caretStyle')) : appliers[k]()));
    keyTips();
    U.hydrateIcons(document);
    FX.initTips();
    V.init(); T.init(); LT.Palette.init(); LT.Settings.init(); LT.Stats.init();
    LT.Progress.updateChip(false);

    S.on('*', k => {
      if (appliers[k]) appliers[k]();
      if (NEW_TEST.includes(k)) { syncConfig(); testChanged(); }
      if (k === 'mods') T.applyClasses();
    });

    U.$('#config').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.toggle) { S.toggle(b.dataset.toggle); return; }
      if (b.id === 'customEditBtn') { LT.Settings.customTextModal(); return; }
      const g = b.closest('[data-set]');
      if (!g) return;
      const k = g.dataset.set, v = b.dataset.v;
      if (v === 'custom') {
        LT.Palette.open({ title: k === 'time' ? 'custom time' : 'custom word count', input: { type: 'number', value: S.get(k), placeholder: k === 'time' ? 'seconds' : 'words', submit: x => S.set(k, Number(x)) } });
        return;
      }
      S.set(k, k === 'time' || k === 'words' ? Number(v) : v);
    });
    U.$('#themeBtn').addEventListener('click', () => LT.Palette.open(LT.Palette.menus.theme));
    U.$('#footShortcuts').addEventListener('click', () => LT.Palette.open());
    U.$('#modsBtn').addEventListener('click', () => LT.Palette.open(LT.Palette.menus.mods));
    U.$('#pages').addEventListener('click', e => {
      const c = e.target.closest('[data-copy]');
      if (!c) return;
      U.copy(c.dataset.copy).then(ok => FX.toast(ok ? `Copied ${c.dataset.copy}` : 'Copy failed.', { icon: ok ? 'copy' : 'alert' }));
    });
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', () => Router.go(fromHash(), false, anchorFromHash()));
    document.addEventListener('lt:modalclose', () => setTimeout(T.focus, 30));
    const relayout = U.debounce(() => {
      if (Router.current === 'test' && !LT.Results.isOpen()) V.relayout();
      U.$$('#config .cfg-group').forEach(FX.indicator);
      navInd();
    }, 90);
    window.addEventListener('resize', relayout);
    if (document.fonts) document.fonts.addEventListener('loadingdone', relayout);

    const start = fromHash();
    Router.current = start;
    U.$$('.page').forEach(p => { p.hidden = p.dataset.page !== start; p.classList.toggle('active', p.dataset.page === start); });
    U.$$('#nav .nav-btn').forEach(a => a.classList.toggle('active', a.dataset.route === start));
    navInd();
    if (start === 'test') T.newTest(); else { needsNew = true; Router.go(start, true, anchorFromHash()); }
    syncConfig();
    const uiFont = document.fonts ? document.fonts.load("800 16px 'Nunito'").catch(() => {}) : Promise.resolve();
    Promise.race([Promise.all([fontP, uiFont]), U.wait(900)]).then(() => {
      if (Router.current === 'test') V.relayout();
      syncConfig();
      navInd();
      let done = false;
      const reveal = () => { if (done) return; done = true; body.classList.remove('booting'); T.focus(); };
      requestAnimationFrame(reveal);
      setTimeout(reveal, 120);
    });
  };

  boot();
})();
