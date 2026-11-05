(() => {
  const U = LT.U, S = LT.S, FX = LT.FX, DB = LT.DB;
  const St = { built: false };
  const GROUPS = [['behavior', 'bolt'], ['caret', 'type'], ['appearance', 'eye'], ['theme', 'palette'], ['challenge', 'flame'], ['data', 'download']];
  const CT_LABELS = { bg: 'background', subAlt: 'panels', sub: 'sub text', text: 'text', main: 'accent', caret: 'caret', error: 'error', errorExtra: 'extra error' };
  let page, ctDraft = null, themeFilter = 'all';

  const optText = (k, v) => (v === true ? 'on' : v === false ? 'off' : k === 'fontSize' ? v + 'x' : String(v));

  const control = d => {
    const v = S.get(d.k);
    if (d.type === 'bool') return `<div class="ctl"><button class="switch ${v ? 'on' : ''}" data-k="${d.k}" data-bool role="switch" aria-checked="${v}" aria-label="${U.esc(d.label)}"></button></div>`;
    if (d.type === 'sel') return `<div class="opts">${d.opts.map(o => `<button class="opt ${String(o) === String(v) ? 'active' : ''}" data-k="${d.k}" data-v="${U.esc(String(o))}">${U.esc(optText(d.k, o))}</button>`).join('')}</div>`;
    if (d.type === 'num') return `<div class="opts">${(d.presets || []).map(o => `<button class="opt ${o === v ? 'active' : ''}" data-k="${d.k}" data-v="${o}">${o === 0 ? 'off' : o}</button>`).join('')}<input class="opt-num" type="number" data-k="${d.k}" data-num min="${d.min}" max="${d.max}" value="${v}" aria-label="${U.esc(d.label)}"></div>`;
    return '';
  };

  const row = d => {
    if (d.type === 'theme') return `<div class="set-row full" data-row="${d.k}" data-search="theme colors custom ${Object.keys(LT.THEMES).join(' ')}"><div><div class="set-title">${U.icon(d.icon)}${d.label}</div><div class="set-desc">Click a theme to apply it. Star your favorites for random theme mode.</div></div>
      <div class="opts theme-filter">${['all', 'dark', 'light', 'favorites'].map(f => `<button class="opt ${f === themeFilter ? 'active' : ''}" data-tf="${f}">${f}</button>`).join('')}</div>
      <div class="theme-grid" id="themeGrid"></div></div>
      <div class="set-row full" data-row="customTheme" data-search="custom theme editor colors"><div><div class="set-title">${U.icon('edit')}custom theme</div><div class="set-desc">Pick every color. Changes preview live; save to keep them.</div></div><div class="ct-grid" id="ctGrid"></div>
      <div class="ct-actions"><button class="btn" data-ct="load">${U.icon('download')}load current theme</button><button class="btn" data-ct="share">${U.icon('copy')}copy code</button><button class="btn" data-ct="import">${U.icon('upload')}import code</button><button class="btn primary" data-ct="save">${U.icon('check')}save and apply</button></div></div>`;
    if (d.type === 'font') return `<div class="set-row full" data-row="${d.k}" data-search="font ${LT.Theme.FONTS.map(f => f.name).join(' ')}"><div><div class="set-title">${U.icon(d.icon)}${d.label}</div><div class="set-desc">${d.desc}</div></div><div class="font-grid">${LT.Theme.FONTS.map(f => `<button class="font-tile ${S.get('font') === f.name ? 'active' : ''}" data-font="${U.esc(f.name)}" style="font-family:'${f.name}', var(--font)">${U.esc(f.name)}</button>`).join('')}</div></div>`;
    if (d.type === 'mods') return `<div class="set-row full" data-row="${d.k}" data-search="mods challenge ${Object.values(LT.MODS).map(m => m.name).join(' ')}"><div><div class="set-title">${U.icon(d.icon)}${d.label}</div><div class="set-desc">${d.desc}</div></div><div class="mods-grid">${Object.keys(LT.MODS).map(m => `<button class="mod-tile ${S.get('mods').includes(m) ? 'active' : ''}" data-mod="${m}">${U.icon(LT.MODS[m].icon)}<div><b>${LT.MODS[m].name}</b><span>${LT.MODS[m].desc}</span></div></button>`).join('')}</div></div>`;
    return `<div class="set-row" data-row="${d.k}" data-search="${U.esc((d.label + ' ' + (d.desc || '')).toLowerCase())}"><div><div class="set-title">${U.icon(d.icon || 'settings')}${d.label}</div>${d.desc ? `<div class="set-desc">${d.desc}</div>` : ''}</div>${control(d)}</div>`;
  };

  const dataRows = () => `
    <div class="set-row" data-search="export import settings code share"><div><div class="set-title">${U.icon('upload')}settings code</div><div class="set-desc">Copy your settings as a code, or paste one to load it.</div></div><div class="data-actions"><button class="btn" data-d="export">${U.icon('copy')}copy code</button><button class="btn" data-d="import">${U.icon('download')}import code</button></div></div>
    <div class="set-row" data-search="export history json csv download"><div><div class="set-title">${U.icon('download')}export history</div><div class="set-desc">${DB.results.length} saved tests.</div></div><div class="data-actions"><button class="btn" data-d="json">json</button><button class="btn" data-d="csv">csv</button></div></div>
    <div class="set-row" data-search="reset settings defaults"><div><div class="set-title">${U.icon('restart')}reset settings</div><div class="set-desc">Every setting back to default. Stats are kept.</div></div><div class="data-actions"><button class="btn danger" data-d="reset">reset settings</button></div></div>
    <div class="set-row" data-search="clear delete stats history xp badges"><div><div class="set-title">${U.icon('trash')}clear stats</div><div class="set-desc">Deletes history, personal bests, key stats, xp and badges from this browser.</div></div><div class="data-actions"><button class="btn danger" data-d="clear">clear stats</button></div></div>`;

  const themeGrid = () => {
    const g = U.$('#themeGrid');
    if (!g) return;
    const fav = S.get('favThemes'), cur = S.get('theme');
    let list = Object.values(LT.THEMES);
    if (themeFilter === 'dark') list = list.filter(t => !t.light);
    if (themeFilter === 'light') list = list.filter(t => t.light);
    if (themeFilter === 'favorites') list = list.filter(t => fav.includes(t.name));
    if (S.get('customTheme') && themeFilter === 'all') list = [LT.Theme.resolve('custom'), ...list];
    g.innerHTML = list.length ? list.map(t => `<button class="theme-tile ${cur === t.name ? 'active' : ''}" data-theme="${U.esc(t.name)}" style="background:${t.bg};color:${t.text}">
      <span>${U.esc(t.name)}</span><span class="tt-dots"><i style="background:${t.main}"></i><i style="background:${t.caret}"></i><i style="background:${t.sub}"></i></span>
      ${t.name !== 'custom' ? `<span class="tt-fav ${fav.includes(t.name) ? 'on' : ''}" data-fav="${U.esc(t.name)}" role="button" aria-label="favorite" style="color:${t.main}">${U.icon('star')}</span>` : ''}</button>`).join('') : `<div class="muted" style="font-size:.8rem;padding:8px 0">No favorites yet. Hover a theme and click its star.</div>`;
  };

  const ctGrid = () => {
    const g = U.$('#ctGrid');
    if (!g) return;
    if (!ctDraft) ctDraft = Object.assign({}, S.get('customTheme') || LT.Theme.colors());
    g.innerHTML = LT.THEME_KEYS.map(k => `<label class="ct-item">${CT_LABELS[k]}<span class="ct-in"><input type="color" data-ck="${k}" value="${ctDraft[k]}"><input type="text" data-ckt="${k}" value="${ctDraft[k]}" maxlength="7" spellcheck="false"></span></label>`).join('');
  };

  const build = () => {
    const groups = {};
    S.schema.forEach(d => { if (d.group) (groups[d.group] = groups[d.group] || []).push(d); });
    page.innerHTML = `<div class="set-wrap"><nav class="set-nav"><span class="set-nav-ind"></span>${GROUPS.map(([g]) => `<a href="#/settings" data-go="${g}">${g}</a>`).join('')}</nav>
      <div class="set-main"><div class="set-search"><div class="set-search-wrap">${U.icon('search')}<input class="field" id="setSearch" placeholder="search settings" autocomplete="off" spellcheck="false"></div></div>
      ${GROUPS.map(([g, ic]) => `<section class="set-group" id="sg-${g}" data-group="${g}"><h2>${U.icon(ic)}${g}</h2>${g === 'data' ? dataRows() : (groups[g] || []).map(row).join('')}</section>`).join('')}</div></div>`;
    themeGrid(); ctGrid();
    LT.Theme.FONTS.forEach(f => LT.Theme.loadFont(f.name, { textOnly: true }));
    bind();
    St.built = true;
  };

  const sync = k => {
    if (!St.built) return;
    if (k === 'theme' || k === 'favThemes' || k === 'customTheme') { themeGrid(); return; }
    if (k === 'font') { U.$$('.font-tile', page).forEach(b => b.classList.toggle('active', b.dataset.font === S.get('font'))); return; }
    if (k === 'mods') { U.$$('.mod-tile', page).forEach(b => b.classList.toggle('active', S.get('mods').includes(b.dataset.mod))); return; }
    const d = S.by[k], r = page.querySelector(`[data-row="${k}"]`);
    if (!d || !r || !d.group) return;
    const v = S.get(k);
    if (d.type === 'bool') { const s = r.querySelector('.switch'); s.classList.toggle('on', v); s.setAttribute('aria-checked', v); }
    else {
      r.querySelectorAll('.opt[data-v]').forEach(b => b.classList.toggle('active', b.dataset.v === String(v)));
      const n = r.querySelector('[data-num]'); if (n && document.activeElement !== n) n.value = v;
    }
  };

  const navObs = () => {
    const ind = page.querySelector('.set-nav-ind'), links = U.$$('.set-nav a', page);
    const setNav = g => {
      const a = links.find(l => l.dataset.go === g);
      if (!a) return;
      links.forEach(l => l.classList.toggle('active', l === a));
      ind.style.opacity = '1';
      ind.style.transform = `translateY(${a.offsetTop + (a.offsetHeight - 20) / 2}px)`;
    };
    const io = new IntersectionObserver(es => {
      const vis = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setNav(vis[0].target.dataset.group);
    }, { rootMargin: '-15% 0px -70% 0px' });
    U.$$('.set-group', page).forEach(s => io.observe(s));
    setNav('behavior');
    links.forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      setNav(a.dataset.go);
      U.$('#sg-' + a.dataset.go).scrollIntoView({ behavior: U.motion() ? 'smooth' : 'auto', block: 'start' });
    }));
  };

  let bound = false;
  const bind = () => {
    navObs();
    if (bound) return;
    bound = true;
    page.addEventListener('click', e => {
      const t = e.target;
      const fav = t.closest('[data-fav]');
      if (fav) {
        e.stopPropagation();
        const n = fav.dataset.fav, f = new Set(S.get('favThemes'));
        f.has(n) ? f.delete(n) : f.add(n);
        S.set('favThemes', [...f]);
        return;
      }
      const b = t.closest('button');
      if (!b) return;
      if (b.dataset.bool !== undefined) S.toggle(b.dataset.k);
      else if (b.dataset.k && b.dataset.v !== undefined) S.set(b.dataset.k, S.by[b.dataset.k].type === 'num' ? Number(b.dataset.v) : b.dataset.v);
      else if (b.dataset.theme) { ctDraft = null; S.set('theme', b.dataset.theme); LT.Theme.endPreview(); ctGrid(); }
      else if (b.dataset.tf) { themeFilter = b.dataset.tf; U.$$('[data-tf]', page).forEach(x => x.classList.toggle('active', x === b)); themeGrid(); }
      else if (b.dataset.font) S.set('font', b.dataset.font);
      else if (b.dataset.mod) S.toggleMod(b.dataset.mod);
      else if (b.dataset.ct) customAction(b.dataset.ct);
      else if (b.dataset.d) dataAction(b.dataset.d);
    });
    page.addEventListener('change', e => {
      const n = e.target.closest('[data-num]');
      if (n) { S.set(n.dataset.k, Number(n.value)); n.value = S.get(n.dataset.k); }
    });
    page.addEventListener('input', e => {
      const c = e.target.closest('[data-ck]'), ct = e.target.closest('[data-ckt]');
      if (c) { ctDraft[c.dataset.ck] = c.value; page.querySelector(`[data-ckt="${c.dataset.ck}"]`).value = c.value; LT.Theme.previewObj(Object.assign({ name: 'custom' }, ctDraft)); }
      if (ct && /^#[0-9a-f]{6}$/i.test(ct.value)) { ctDraft[ct.dataset.ckt] = ct.value.toLowerCase(); page.querySelector(`[data-ck="${ct.dataset.ckt}"]`).value = ct.value; LT.Theme.previewObj(Object.assign({ name: 'custom' }, ctDraft)); }
      if (e.target.id === 'setSearch') filter(e.target.value);
    });
  };

  const filter = q => {
    q = q.trim().toLowerCase();
    U.$$('.set-row', page).forEach(r => r.classList.toggle('hide', !!q && !(r.dataset.search || '').includes(q)));
    U.$$('.set-group', page).forEach(g => { g.hidden = !!q && !g.querySelector('.set-row:not(.hide)'); });
  };

  const customAction = a => {
    if (a === 'load') { ctDraft = Object.assign({}, LT.Theme.resolve(S.get('theme'))); ctGrid(); LT.Theme.endPreview(); }
    if (a === 'save') {
      const t = {};
      LT.THEME_KEYS.forEach(k => (t[k] = ctDraft[k]));
      S.set('customTheme', t);
      LT.Theme.previewing = false;
      if (S.get('theme') === 'custom') LT.Theme.applyCurrent(); else S.set('theme', 'custom');
      FX.toast('Custom theme saved.', { icon: 'palette' });
    }
    if (a === 'share') {
      const t = {}; LT.THEME_KEYS.forEach(k => (t[k] = ctDraft[k]));
      U.copy(JSON.stringify(t)).then(() => FX.toast('Theme code copied.', { icon: 'copy' }));
    }
    if (a === 'import') {
      FX.modal({
        title: 'import theme', desc: 'Paste a theme code.',
        body: '<textarea class="field" id="ctImp" spellcheck="false" style="min-height:90px"></textarea>',
        actions: [{ label: 'cancel', cls: 'ghost' }, { label: 'import', cls: 'primary', run: () => {
          try {
            const o = JSON.parse(U.$('#ctImp').value);
            if (!LT.THEME_KEYS.every(k => /^#[0-9a-f]{6}$/i.test(o[k] || ''))) throw 0;
            ctDraft = o; ctGrid(); LT.Theme.previewObj(Object.assign({ name: 'custom' }, o));
          } catch (e) { FX.toast('That theme code is not valid.', { icon: 'alert', type: 'err' }); return false; }
        } }]
      });
    }
  };

  const dataAction = a => {
    if (a === 'export') U.copy(S.export()).then(() => FX.toast('Settings code copied.', { icon: 'copy' }));
    if (a === 'import') FX.modal({
      title: 'import settings', desc: 'Paste a settings code from larptype.',
      body: '<textarea class="field" id="setImp" spellcheck="false" style="min-height:90px"></textarea>',
      actions: [{ label: 'cancel', cls: 'ghost' }, { label: 'import', cls: 'primary', run: () => { const ok = S.import(U.$('#setImp').value); FX.toast(ok ? 'Settings imported.' : 'That code is not valid.', { icon: ok ? 'check' : 'alert' }); return ok; } }]
    });
    if (a === 'json') U.download('larptype-history.json', JSON.stringify(DB.results.map(r => { const c = Object.assign({}, r); delete c.chart; return c; }), null, 1));
    if (a === 'csv') {
      const cols = ['ts', 'mode', 'm2', 'lang', 'punct', 'nums', 'diff', 'wpm', 'raw', 'acc', 'cons', 'time', 'failed'];
      const lines = [cols.join(',') + ',correct,incorrect,extra,missed,mods'].concat(DB.results.map(r => cols.map(c => (c === 'ts' ? new Date(r.ts).toISOString() : r[c])).join(',') + ',' + r.chars.join(',') + ',' + r.mods.join(' ')));
      U.download('larptype-history.csv', lines.join('\n'), 'text/csv');
    }
    if (a === 'reset') FX.confirm('reset settings', 'Every setting goes back to its default. Your stats are kept.', 'reset', () => { S.reset(); FX.toast('Settings reset.', { icon: 'check' }); });
    if (a === 'clear') FX.confirm('clear stats', 'This deletes your history, personal bests, key stats, xp and badges. It cannot be undone.', 'delete everything', () => { DB.clearHistory(); LT.Progress.updateChip(true); FX.toast('Stats cleared.', { icon: 'trash' }); St.built = false; St.show(); });
  };

  St.customTextModal = () => {
    FX.modal({
      title: 'custom text', desc: 'Paste anything: song lyrics, notes, a script. Words are split on spaces and new lines.',
      body: `<textarea class="field" id="ctText" spellcheck="false">${U.esc(S.get('customText'))}</textarea>
        <div class="m-opts"><label><input type="checkbox" id="ctShuffle" ${S.get('customShuffle') ? 'checked' : ''}> shuffle words</label>
        <label>word limit <input class="opt-num" type="number" id="ctLimit" min="0" max="5000" value="${S.get('customLimit')}" style="width:80px"></label><span>0 = use all words once</span></div>`,
      actions: [{ label: 'cancel', cls: 'ghost' }, { label: 'apply', cls: 'primary', icon: 'check', run: () => {
        const v = U.$('#ctText').value.trim();
        if (!v) { FX.toast('Type or paste some text first.', { icon: 'alert' }); return false; }
        S.set('customText', v); S.set('customShuffle', U.$('#ctShuffle').checked); S.set('customLimit', Number(U.$('#ctLimit').value) || 0);
        if (S.get('mode') !== 'custom') S.set('mode', 'custom'); else LT.Test.restart();
        if (LT.Router.current !== 'test') location.hash = '#/';
      } }]
    });
  };

  St.show = () => {
    page = U.$('#page-settings');
    if (!St.built) build();
    else { ctDraft = null; ctGrid(); }
  };
  St.leave = () => { if (LT.Theme.previewing) LT.Theme.endPreview(); };
  St.init = () => { S.on('*', k => sync(k)); };

  LT.Settings = St;
})();
