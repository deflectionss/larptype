(() => {
  const U = LT.U, S = LT.S;
  const FONTS = [
    ['JetBrains Mono', 'JetBrains+Mono:wght@400;500;700'],
    ['Roboto Mono', 'Roboto+Mono:wght@400;500;700'],
    ['Fira Code', 'Fira+Code:wght@400;500;700'],
    ['Source Code Pro', 'Source+Code+Pro:wght@400;500;700'],
    ['IBM Plex Mono', 'IBM+Plex+Mono:wght@400;500;700'],
    ['Space Mono', 'Space+Mono:wght@400;700'],
    ['Ubuntu Mono', 'Ubuntu+Mono:wght@400;700'],
    ['Inconsolata', 'Inconsolata:wght@400;500;700'],
    ['Red Hat Mono', 'Red+Hat+Mono:wght@400;500;700'],
    ['DM Mono', 'DM+Mono:wght@400;500'],
    ['Fredoka', 'Fredoka:wght@400;500;700'],
    ['Nunito', 'Nunito:wght@400;500;700'],
    ['Source Sans 3', 'Source+Sans+3:wght@400;500;700'],
    ['Montserrat', 'Montserrat:wght@400;500;700'],
    ['Lexend', 'Lexend:wght@400;500;700'],
    ['Titillium Web', 'Titillium+Web:wght@400;600;700'],
    ['Ubuntu', 'Ubuntu:wght@400;500;700'],
    ['Comic Neue', 'Comic+Neue:wght@400;700'],
    ['Patrick Hand', 'Patrick+Hand'],
    ['Michroma', 'Michroma'],
    ['Press Start 2P', 'Press+Start+2P']
  ].map(([name, q]) => ({ name, q }));
  const VARS = { bg: '--bg', subAlt: '--sub-alt', sub: '--sub', text: '--text', main: '--main', caret: '--caret', error: '--error', errorExtra: '--error-extra' };
  const root = document.documentElement;
  const loaded = new Set();

  const Theme = { FONTS, VARS, cur: null, previewing: false };

  Theme.resolve = name => {
    if (name === 'custom') {
      const c = S.get('customTheme');
      return c ? Object.assign({ name: 'custom' }, LT.THEMES.vibecode, c, { name: 'custom' }) : LT.THEMES.vibecode;
    }
    return LT.THEMES[name] || LT.THEMES.vibecode;
  };

  Theme.apply = (t, { animate = true, save = true, fast = false } = {}) => {
    if (animate && U.motion() > 0) {
      root.classList.add('theme-anim');
      root.style.setProperty('--theme-t', fast ? '.12s' : '.3s');
      clearTimeout(Theme._t);
      Theme._t = setTimeout(() => root.classList.remove('theme-anim'), fast ? 160 : 360);
    }
    const cache = {};
    for (const k in VARS) { root.style.setProperty(VARS[k], t[k]); cache[VARS[k]] = t[k]; }
    root.classList.toggle('light', LT.lum(t.bg) > .4);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t.bg;
    if (save) U.store.set('themeCache', Object.assign(cache, { '--m': root.style.getPropertyValue('--m') || '1', '--fs': root.style.getPropertyValue('--fs') || '1.75' }));
    Theme.cur = t;
    document.dispatchEvent(new CustomEvent('lt:theme', { detail: t }));
  };
  Theme.applyCurrent = (animate = true) => { Theme.previewing = false; Theme.apply(Theme.resolve(S.get('theme')), { animate }); };
  Theme.preview = name => { Theme.previewing = true; Theme.apply(Theme.resolve(name), { save: false, fast: true }); };
  Theme.previewObj = t => { Theme.previewing = true; Theme.apply(t, { save: false, fast: true }); };
  Theme.endPreview = () => { if (Theme.previewing) Theme.applyCurrent(true); };
  Theme.colors = () => Theme.cur || Theme.resolve(S.get('theme'));

  Theme.randomize = () => {
    const mode = S.get('randomTheme');
    if (mode === 'off') return;
    let pool = Object.values(LT.THEMES);
    if (mode === 'dark') pool = pool.filter(t => !t.light);
    if (mode === 'light') pool = pool.filter(t => t.light);
    if (mode === 'favorites') pool = pool.filter(t => S.get('favThemes').includes(t.name));
    pool = pool.filter(t => t.name !== S.get('theme'));
    if (pool.length) S.set('theme', U.pick(pool).name);
  };

  Theme.fontStack = name => `'${name}', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  Theme.loadFont = (name, { textOnly } = {}) => {
    const f = FONTS.find(x => x.name === name);
    if (!f) return Promise.resolve();
    const key = textOnly ? f.name + '|t' : f.name;
    if (!loaded.has(key) && !(textOnly && loaded.has(f.name))) {
      loaded.add(key);
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${f.q}${textOnly ? '&text=' + encodeURIComponent(f.name) : ''}&display=swap`;
      document.head.appendChild(link);
    }
    if (!document.fonts || textOnly) return Promise.resolve();
    return Promise.race([document.fonts.load(`500 20px '${f.name}'`), U.wait(2500)]).catch(() => {});
  };
  Theme.setFont = name => {
    const f = FONTS.find(x => x.name === name) || FONTS[0];
    const head = document.getElementById('fontLink');
    if (head && head.dataset.q === f.q) loaded.add(f.name);
    U.store.set('fontCache', f.q);
    const p = Theme.loadFont(f.name);
    root.style.setProperty('--font', Theme.fontStack(f.name));
    return p;
  };
  Theme.setMotion = v => {
    const m = v === 'off' ? 0 : v === 'reduced' ? .45 : 1;
    root.style.setProperty('--m', String(m));
  };
  Theme.setFontSize = v => root.style.setProperty('--fs', String(v));

  LT.Theme = Theme;
})();
