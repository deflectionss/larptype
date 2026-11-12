(() => {
  const U = LT.U, S = LT.S, FX = LT.FX;
  const P = {};
  let root, box, input, itemsEl, hi, crumb, stack = [], shown = [], active = 0, open = false, lastPt = '', pvT = 0, previewed = null;

  P.isOpen = () => open;

  const optLabel = v => (v === true ? 'on' : v === false ? 'off' : String(v).replace(/_/g, ' '));

  const setMenu = (k, d) => ({
    title: d.label,
    items: () => {
      const cur = S.get(k);
      const vals = d.opts || d.presets || [];
      const list = vals.map(v => ({ label: optLabel(v) + (k === 'fontSize' ? 'x' : ''), checked: String(cur) === String(v), run: () => S.set(k, v) }));
      if (d.type === 'num') list.push({ label: 'custom…', icon: 'edit', run: () => ({ title: d.label, input: { type: 'number', value: cur, placeholder: d.label, submit: v => S.set(k, Number(v)) } }) });
      return list;
    }
  });

  const themeMenu = () => ({
    title: 'theme',
    preview: true,
    items: () => {
      const cur = S.get('theme'), fav = S.get('favThemes');
      const all = Object.values(LT.THEMES).sort((a, b) => (fav.includes(b.name) - fav.includes(a.name)));
      const list = all.map(t => ({ label: t.name, checked: cur === t.name, sw: t, right: fav.includes(t.name) ? U.icon('star') : '', preview: () => LT.Theme.preview(t.name), run: () => S.set('theme', t.name) }));
      if (S.get('customTheme')) list.unshift({ label: 'custom', checked: cur === 'custom', sw: LT.Theme.resolve('custom'), preview: () => LT.Theme.preview('custom'), run: () => S.set('theme', 'custom') });
      return list;
    }
  });
  const fontMenu = () => ({
    title: 'font',
    items: () => LT.Theme.FONTS.map(f => ({ label: f.name, checked: S.get('font') === f.name, preview: () => { LT.Theme.loadFont(f.name); previewed = 'font'; document.documentElement.style.setProperty('--font', LT.Theme.fontStack(f.name)); }, run: () => S.set('font', f.name) }))
  });
  const modsMenu = () => ({
    title: 'challenge mods',
    items: () => Object.keys(LT.MODS).map(m => ({ label: LT.MODS[m].name, icon: LT.MODS[m].icon, checked: S.get('mods').includes(m), keep: true, run: () => S.toggleMod(m) })).concat([{ label: 'clear all', icon: 'x', run: () => S.set('mods', []) }])
  });
  P.menus = { theme: themeMenu, font: fontMenu, mods: modsMenu };

  const go = h => () => { location.hash = h; };
  const rootMenu = () => ({
    title: '',
    items: () => {
      const T = LT.Test;
      const list = [
        { label: 'restart test', icon: 'restart', right: '<kbd>tab</kbd>', run: () => T.restart() },
        { label: 'repeat test', icon: 'repeat', run: () => T.repeat() },
        { label: 'practice weak keys', icon: 'target', run: () => T.practiceWeak() },
        { label: 'practice missed words', icon: 'alert', run: () => T.practiceMissed() },
        { label: 'mode…', icon: 'clock', run: () => setMenu('mode', S.by.mode) },
        { label: 'time…', icon: 'clock', run: () => ({ title: 'time', items: () => [15, 30, 60, 120].map(v => ({ label: v + 's', checked: S.get('time') === v, run: () => { S.set('time', v); S.set('mode', 'time'); } })).concat([{ label: 'custom…', icon: 'edit', run: () => ({ title: 'time', input: { type: 'number', value: S.get('time'), placeholder: 'seconds', submit: v => { S.set('time', Number(v)); S.set('mode', 'time'); } } }) }]) }) },
        { label: 'words…', icon: 'type', run: () => ({ title: 'words', items: () => [10, 25, 50, 100].map(v => ({ label: String(v), checked: S.get('words') === v, run: () => { S.set('words', v); S.set('mode', 'words'); } })).concat([{ label: 'custom…', icon: 'edit', run: () => ({ title: 'words', input: { type: 'number', value: S.get('words'), placeholder: 'word count', submit: v => { S.set('words', Number(v)); S.set('mode', 'words'); } } }) }]) }) },
        { label: 'quote length…', icon: 'quote', run: () => setMenu('quoteLength', { label: 'quote length', opts: S.by.quoteLength.opts }) },
        { label: 'punctuation', icon: 'at', right: optLabel(S.get('punctuation')), run: () => S.toggle('punctuation') },
        { label: 'numbers', icon: 'hash', right: optLabel(S.get('numbers')), run: () => S.toggle('numbers') },
        { label: 'simple words', icon: 'feather', right: optLabel(S.get('language') === 'simple'), run: () => S.set('language', S.get('language') === 'simple' ? 'roblox' : 'simple') },
        { label: 'theme…', icon: 'palette', right: S.get('theme'), run: themeMenu },
        { label: 'random theme now', icon: 'shuffle', run: () => { const pool = Object.keys(LT.THEMES).filter(n => n !== S.get('theme')); S.set('theme', U.pick(pool)); } },
        { label: 'font…', icon: 'type', right: S.get('font'), run: fontMenu },
        { label: 'challenge mods…', icon: 'flame', right: S.get('mods').length ? S.get('mods').length + ' on' : '', run: modsMenu },
        { label: 'custom text…', icon: 'edit', run: () => LT.Settings.customTextModal() },
        { label: 'set name…', icon: 'user', right: U.esc(S.get('name')), run: () => ({ title: 'your name', input: { value: S.get('name'), placeholder: 'your name, up to 24 characters', submit: v => { S.set('name', v); FX.toast(`Hi ${S.get('name')}!`, { icon: 'user' }); } } }) },
        { label: 'go to settings', icon: 'settings', run: go('#/settings') },
        { label: 'go to stats', icon: 'crown', run: go('#/stats') },
        { label: 'go to notes', icon: 'note', run: go('#/notes') },
        { label: 'new note', icon: 'plus', run: () => LT.Notes.newNote() },
        { label: 'go to about', icon: 'info', run: go('#/about') },
        { label: 'export settings', icon: 'upload', run: () => U.copy(S.export()).then(() => FX.toast('Settings code copied to clipboard.', { icon: 'copy' })) },
        { label: 'import settings', icon: 'download', run: () => ({ title: 'import settings', input: { placeholder: 'paste a settings code', submit: v => FX.toast(S.import(v) ? 'Settings imported.' : 'That code is not valid.', { icon: 'check' }) } }) },
        { label: 'reset settings', icon: 'trash', run: () => FX.confirm('reset settings', 'Every setting goes back to its default. Your stats are kept.', 'reset', () => { S.reset(); FX.toast('Settings reset.', { icon: 'check' }); }) }
      ];
      S.schema.filter(d => d.group && !['theme', 'font', 'mods', 'language'].includes(d.type) && d.k !== 'language').forEach(d => {
        if (d.type === 'bool') list.push({ label: d.label, group: d.group, icon: d.icon, right: optLabel(S.get(d.k)), run: () => S.toggle(d.k) });
        else list.push({ label: d.label + '…', group: d.group, icon: d.icon, right: optLabel(S.get(d.k)), run: () => setMenu(d.k, d) });
      });
      return list;
    }
  });

  const fuzzy = (q, s) => {
    const ql = q.toLowerCase(), sl = s.toLowerCase();
    let qi = 0, sc = 0, last = -2;
    const idx = [];
    for (let i = 0; i < sl.length && qi < ql.length; i++) {
      if (sl[i] === ql[qi]) {
        idx.push(i);
        sc += i === last + 1 ? 3 : 1;
        if (i === 0 || /[\s›\-_.]/.test(sl[i - 1])) sc += 4;
        last = i; qi++;
      }
    }
    if (qi < ql.length) return null;
    if (sl.startsWith(ql)) sc += 8;
    return { sc: sc - sl.length * .02, idx };
  };
  const mark = (s, idx) => { let o = ''; [...s].forEach((c, i) => { o += idx && idx.includes(i) ? `<mark>${U.esc(c)}</mark>` : U.esc(c); }); return o; };

  const cur = () => stack[stack.length - 1];
  const getItems = m => (typeof m.items === 'function' ? m.items() : m.items || []);

  const flattenAll = () => {
    const out = [];
    getItems(rootMenu()).forEach(it => {
      out.push(it);
      if (!it.label.endsWith('…') || /^(custom text|import)/.test(it.label)) return;
      const m = it.run();
      if (!m || !m.items) return;
      const name = it.label.replace('…', '');
      getItems(m).forEach(si => {
        if (si.label === 'custom…') return;
        out.push(Object.assign({}, si, { label: name + ' › ' + si.label, icon: si.checked ? null : si.icon || it.icon, group: null }));
      });
    });
    return out;
  };

  const render = () => {
    const m = cur();
    crumb.textContent = stack.length > 1 ? stack.slice(1).map(s => s.title).join(' › ') + ' ›' : '';
    if (m.input) {
      itemsEl.innerHTML = `<div class="pal-empty">press enter to apply</div>`;
      shown = []; hi.style.opacity = '0';
      return;
    }
    const q = input.value.trim();
    let list = q && stack.length === 1 ? flattenAll() : getItems(m);
    if (q) {
      list = list.map(it => ({ it, f: fuzzy(q, it.label) })).filter(x => x.f).sort((a, b) => b.f.sc - a.f.sc).map(x => Object.assign({}, x.it, { _idx: x.f.idx }));
    }
    shown = list;
    if (!list.length) { itemsEl.innerHTML = `<div class="pal-empty">nothing found</div>`; hi.style.opacity = '0'; return; }
    hi.style.opacity = '';
    itemsEl.innerHTML = list.map((it, i) => {
      const sw = it.sw ? `<span class="pi-sw" style="background:${it.sw.bg}"><i style="background:${it.sw.main}"></i><i style="background:${it.sw.sub}"></i><i style="background:${it.sw.text}"></i></span>` : '';
      return `<div class="pal-item" data-i="${i}" role="option"><span class="pi-ico">${it.checked ? `<span class="pi-check">${U.icon('check')}</span>` : it.icon ? U.icon(it.icon) : ''}</span><span class="pi-label">${it.group && !q ? `<span class="pi-group">${U.esc(it.group)} › </span>` : ''}${mark(it.label, it._idx)}</span><span class="pi-right">${it.right || ''}${sw}</span></div>`;
    }).join('');
    if (!q) { const c = list.findIndex(it => it.checked); active = c >= 0 && m.preview ? c : Math.min(active, list.length - 1); }
    else active = 0;
    setActive(active, true);
  };

  const setActive = (i, instant, mouse) => {
    if (!shown.length) return;
    active = (i + shown.length) % shown.length;
    const el = itemsEl.children[active];
    if (!el) return;
    hi.classList.toggle('instant', !!instant);
    hi.style.transform = `translateY(${el.offsetTop}px)`;
    if (instant) { void hi.offsetWidth; }
    if (!mouse) {
      const lst = U.$('#palList'), top = el.offsetTop, bot = top + el.offsetHeight;
      if (top < lst.scrollTop + 6) lst.scrollTop = top - 6;
      else if (bot > lst.scrollTop + lst.clientHeight - 6) lst.scrollTop = bot - lst.clientHeight + 6;
    }
    clearTimeout(pvT);
    const it = shown[active];
    if (!it || !it.preview) return;
    const show = () => { if (open && shown[active] === it) { it.preview(); previewed = previewed || 'theme'; } };
    if (mouse) pvT = setTimeout(show, 120); else show();
  };

  const endPreview = () => {
    clearTimeout(pvT);
    LT.Theme.endPreview();
    if (previewed === 'font') LT.Theme.setFont(S.get('font'));
    previewed = null;
  };

  const runItem = it => {
    if (!it) return;
    const res = it.run ? it.run() : null;
    if (res && typeof res === 'object' && (res.items || res.input)) { push(res); return; }
    if (it.keep) { render(); return; }
    endPreview();
    P.close(true);
  };

  const push = m => {
    stack.push(m);
    input.value = m.input && m.input.value != null ? String(m.input.value) : '';
    input.placeholder = m.input ? m.input.placeholder || '' : 'search';
    input.type = m.input && m.input.type === 'number' ? 'number' : 'text';
    active = 0;
    render();
    if (m.input) input.select();
  };
  const back = () => {
    if (stack.length <= 1) { P.close(); return; }
    endPreview();
    stack.pop();
    input.value = ''; input.type = 'text';
    input.placeholder = stack.length > 1 ? 'search' : 'type a command';
    active = 0;
    render();
  };

  P.open = menu => {
    if (FX.modalOpen) return;
    if (open) endPreview();
    if (!open) {
      open = true;
      root.hidden = false;
      U.raf2(() => root.classList.add('open'));
    }
    stack = [rootMenu()];
    input.value = ''; input.type = 'text'; input.placeholder = 'type a command';
    active = 0;
    if (menu) push(typeof menu === 'function' ? menu() : menu); else render();
    lastPt = '';
    input.focus();
  };
  P.close = (keep) => {
    if (!open) return;
    clearTimeout(pvT);
    if (!keep) endPreview();
    open = false;
    root.classList.remove('open');
    setTimeout(() => { if (!open) root.hidden = true; }, U.ms(220) + 20);
    LT.Test.focus();
    LT.Notes.refocus();
  };

  P.init = () => {
    root = U.$('#palette'); box = U.$('.pal-box'); input = U.$('#palInput'); itemsEl = U.$('#palItems'); hi = U.$('#palHi'); crumb = U.$('#palCrumb');
    U.hydrateIcons(root);
    root.querySelector('.pal-backdrop').addEventListener('mousedown', () => P.close());
    input.addEventListener('input', () => { if (!cur().input) render(); });
    input.addEventListener('keydown', e => {
      if (!open) return;
      const k = e.key;
      if (k === 'ArrowDown' || (k === 'Tab' && !e.shiftKey) || (e.ctrlKey && k === 'j')) { e.preventDefault(); setActive(active + 1); }
      else if (k === 'ArrowUp' || (k === 'Tab' && e.shiftKey) || (e.ctrlKey && k === 'k')) { e.preventDefault(); setActive(active - 1); }
      else if (k === 'Enter') {
        e.preventDefault();
        const m = cur();
        if (m.input) { const v = input.value.trim(); if (v) m.input.submit(v); P.close(true); return; }
        runItem(shown[active]);
      } else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); back(); }
      else if (k === 'Backspace' && !input.value && stack.length > 1) { e.preventDefault(); back(); }
      e.stopPropagation();
    });
    itemsEl.addEventListener('mousemove', e => {
      if (!open) return;
      const pt = e.clientX + ',' + e.clientY;
      if (pt === lastPt) return;
      const first = !lastPt;
      lastPt = pt;
      if (first) return;
      const el = e.target.closest('.pal-item');
      if (el && +el.dataset.i !== active) setActive(+el.dataset.i, false, true);
    });
    itemsEl.addEventListener('click', e => {
      if (!open) return;
      const el = e.target.closest('.pal-item');
      if (!el) return;
      clearTimeout(pvT);
      active = +el.dataset.i;
      runItem(shown[active]);
      if (open) input.focus();
    });
  };

  LT.Palette = P;
})();
