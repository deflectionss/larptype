(() => {
  const U = LT.U, FX = LT.FX;
  const N = {};
  const MOBILE = matchMedia('(max-width: 760px)');
  const EASE = 'cubic-bezier(.22, 1, .36, 1)';
  const memo = {};
  let notes = [], active = null, query = '', built = false, pending = false, failed = false, pendingNew = false;
  let page, wrap, mainEl, itemsEl, listEl, hiEl, searchEl, titleEl, bodyEl, countEl, editedEl, statusEl, sideFootEl, pinBtn;
  let saveT = 0, tickT = 0, stState = '', lastField = null;

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const make = () => ({ id: uid(), title: '', body: '', created: Date.now(), updated: Date.now(), pinned: false });
  const clean = n => (n && typeof n === 'object' && typeof n.id === 'string' ? {
    id: n.id, title: typeof n.title === 'string' ? n.title : '', body: typeof n.body === 'string' ? n.body : '',
    created: Number(n.created) || Date.now(), updated: Number(n.updated) || Date.now(), pinned: !!n.pinned
  } : null);
  const load = () => {
    const raw = U.store.get('notes', []);
    notes = Array.isArray(raw) ? raw.map(clean).filter(Boolean) : [];
  };
  const byId = id => notes.find(n => n.id === id) || null;
  const cur = () => byId(active);
  const blank = n => !n.title.trim() && !n.body.trim();
  const sorted = () => [...notes].sort((a, b) => (b.pinned - a.pinned) || (b.updated - a.updated));
  const lines = s => s.split('\n').map(l => l.trim()).filter(Boolean);
  const label = n => n.title.trim() || lines(n.body)[0] || 'new note';
  const matches = (n, q) => (n.title + '\n' + n.body).toLowerCase().includes(q);
  const q = () => query.trim().toLowerCase();
  const visible = () => (q() ? sorted().filter(n => matches(n, q())) : sorted());
  const itemEl = id => itemsEl.querySelector(`.nt-item[data-id="${id}"]`);

  /* saving */
  const setStatus = s => {
    if (s === stState) return;
    stState = s;
    statusEl.className = 'nt-status ' + s;
    statusEl.innerHTML = s === 'saving' ? 'saving…' : s === 'error' ? `${U.icon('alert')}not saved` : `${U.icon('check')}saved`;
  };
  const persist = () => {
    clearTimeout(saveT);
    pending = false;
    const ok = U.store.set('notes', notes);
    if (!ok && !failed) FX.toast('Browser storage is full or blocked, so notes cannot be saved right now. Copy or download anything important.', { title: 'not saved', icon: 'alert', type: 'err', dur: 7000 });
    failed = !ok;
    if (built) setStatus(ok ? 'saved' : 'error');
    return ok;
  };
  const queueSave = () => {
    pending = true;
    setStatus('saving');
    clearTimeout(saveT);
    saveT = setTimeout(persist, 400);
  };
  const flush = () => { if (pending) persist(); };

  const prune = keep => {
    const before = notes.length;
    notes = notes.filter(n => n.id === keep || !blank(n));
    if (notes.length !== before) persist();
    return notes.length !== before;
  };
  const ensure = () => {
    if (cur()) return;
    const f = sorted()[0];
    if (f) { active = f.id; return; }
    const n = make();
    notes.push(n);
    active = n.id;
  };

  /* text helpers */
  const hl = (text, qq) => {
    const low = text.toLowerCase();
    if (!qq || low.length !== text.length) return U.esc(text);
    let i = 0, j, out = '';
    while ((j = low.indexOf(qq, i)) !== -1) { out += U.esc(text.slice(i, j)) + '<mark>' + U.esc(text.slice(j, j + qq.length)) + '</mark>'; i = j + qq.length; }
    return out + U.esc(text.slice(i));
  };
  const snippet = (n, qq) => {
    const ls = lines(n.body);
    if (!n.title.trim()) ls.shift();
    let s = ls.join(' ').replace(/\s+/g, ' ');
    const k = qq ? s.toLowerCase().indexOf(qq) : -1;
    if (k > 24) s = '…' + s.slice(k - 16);
    return s.slice(0, 160);
  };
  const ago = (ts, short) => {
    const s = (Date.now() - ts) / 1000, d = new Date(ts), now = new Date();
    if (s < 45) return short ? 'now' : 'just now';
    if (s < 3600) { const m = Math.max(1, Math.round(s / 60)); return short ? m + 'm' : `${m} min ago`; }
    const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    if (days <= 0) { const h = Math.max(1, Math.round(s / 3600)); return short ? h + 'h' : `${h} ${h === 1 ? 'hour' : 'hours'} ago`; }
    if (days === 1) return 'yesterday';
    if (days < 7) return d.toLocaleDateString(undefined, { weekday: short ? 'short' : 'long' });
    const o = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== now.getFullYear()) o.year = 'numeric';
    return (short ? '' : 'on ') + d.toLocaleDateString(undefined, o);
  };
  const fullText = (n, md) => {
    const t = n.title.trim(), b = n.body.replace(/\s+$/, '');
    return (t ? (md ? '# ' : '') + t + (b ? '\n\n' : '') : '') + b;
  };
  const fileName = (n, ext) => {
    const base = label(n).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
    return (base || 'note') + '.' + ext;
  };

  /* list */
  const itemInner = (n, qq) => {
    const named = n.title.trim() || lines(n.body)[0];
    return `<span class="nt-it-top"><span class="nt-it-title${named ? '' : ' empty'}">${n.pinned ? U.icon('pin', 'nt-pin') : ''}${hl(label(n), qq)}</span><span class="nt-it-time">${ago(n.updated, true)}</span></span><span class="nt-it-snip">${hl(snippet(n, qq), qq) || (named ? 'no text yet' : 'start typing')}</span>`;
  };
  const item = (n, qq) => `<button class="nt-item${n.id === active ? ' active' : ''}" data-id="${n.id}" role="option" aria-selected="${n.id === active}">${itemInner(n, qq)}</button>`;

  const moveHi = instant => {
    const el = itemEl(active);
    if (!el) { hiEl.style.opacity = '0'; return; }
    const snap = instant || hiEl.style.opacity !== '1';
    hiEl.classList.toggle('instant', snap);
    hiEl.style.height = el.offsetHeight + 'px';
    hiEl.style.transform = `translateY(${el.offsetTop}px)`;
    hiEl.style.opacity = '1';
    if (snap) void hiEl.offsetWidth;
  };
  const reveal = el => {
    if (!el) return;
    const top = el.offsetTop, bot = top + el.offsetHeight;
    if (top < listEl.scrollTop + 4) listEl.scrollTop = top - 4;
    else if (bot > listEl.scrollTop + listEl.clientHeight - 4) listEl.scrollTop = bot - listEl.clientHeight + 4;
  };

  const renderList = (anim = true) => {
    const qq = q(), list = visible();
    const prev = {};
    const flip = anim && U.motion() > 0;
    if (flip) itemsEl.querySelectorAll('.nt-item').forEach(el => { prev[el.dataset.id] = el.offsetTop; });
    const had = Object.keys(prev).length > 0;
    const pinned = list.filter(n => n.pinned), rest = list.filter(n => !n.pinned);
    let h = '';
    if (pinned.length) h += `<div class="nt-group">${U.icon('pin')}pinned</div>${pinned.map(n => item(n, qq)).join('')}${rest.length ? `<div class="nt-group">${U.icon('note')}notes</div>` : ''}`;
    h += rest.map(n => item(n, qq)).join('');
    if (!list.length) h = `<div class="nt-empty">${qq ? `No notes match “${U.esc(query.trim())}”.` : 'No notes yet.'}</div>`;
    itemsEl.innerHTML = h;
    if (flip) itemsEl.querySelectorAll('.nt-item').forEach(el => {
      const p = prev[el.dataset.id];
      if (p == null) { if (had) el.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: U.ms(300), easing: EASE }); return; }
      const d = p - el.offsetTop;
      if (Math.abs(d) > 1) el.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: U.ms(420), easing: EASE });
    });
    const total = notes.filter(n => !blank(n) || n.id === active).length;
    sideFootEl.innerHTML = `${U.icon('lock')}${U.fmtNum(total)} ${total === 1 ? 'note' : 'notes'} · saved in this browser`;
    moveHi(!flip);
  };
  const orderChanged = () => visible().map(n => n.id).join() !== [...itemsEl.querySelectorAll('.nt-item')].map(e => e.dataset.id).join();
  const syncList = () => {
    if (!built) return;
    if (orderChanged()) { renderList(); return; }
    const n = cur(), el = n && itemEl(n.id);
    if (el) { el.innerHTML = itemInner(n, q()); moveHi(); }
  };
  const syncSoon = U.debounce(syncList, 140);
  const markActive = () => {
    itemsEl.querySelectorAll('.nt-item').forEach(el => {
      const on = el.dataset.id === active;
      el.classList.toggle('active', on);
      el.setAttribute('aria-selected', on);
    });
    moveHi();
  };
  const tick = () => {
    itemsEl.querySelectorAll('.nt-item').forEach(el => { const n = byId(el.dataset.id), t = el.querySelector('.nt-it-time'); if (n && t) t.textContent = ago(n.updated, true); });
    meta();
  };

  /* editor */
  const meta = () => {
    const n = cur();
    if (!n) return;
    const t = n.body.trim(), w = t ? t.split(/\s+/).length : 0, c = n.body.length;
    countEl.textContent = `${U.fmtNum(w)} ${w === 1 ? 'word' : 'words'} · ${U.fmtNum(c)} ${c === 1 ? 'character' : 'characters'}`;
    editedEl.textContent = 'edited ' + ago(n.updated);
    editedEl.dataset.tip = 'created ' + U.fmtDate(n.created);
  };
  const pinState = () => {
    const n = cur();
    const on = !!(n && n.pinned);
    pinBtn.classList.toggle('on', on);
    pinBtn.dataset.tip = on ? 'unpin' : 'pin to top';
    pinBtn.setAttribute('aria-pressed', on);
  };
  const fillEditor = (scroll = true) => {
    const n = cur();
    if (!n) return;
    if (titleEl.value !== n.title) titleEl.value = n.title;
    if (bodyEl.value !== n.body) bodyEl.value = n.body;
    if (scroll) { const m = memo[n.id]; bodyEl.scrollTop = m ? m.top : 0; }
    pinState();
    meta();
  };
  const remember = () => {
    const n = cur();
    if (n && built) memo[n.id] = { s: bodyEl.selectionStart, e: bodyEl.selectionEnd, top: bodyEl.scrollTop };
  };
  const swapAnim = () => {
    if (!U.motion()) return;
    mainEl.classList.remove('swap');
    void mainEl.offsetWidth;
    mainEl.classList.add('swap');
  };
  const focusBody = () => {
    const n = cur();
    if (!n || LT.Router.current !== 'notes') return;
    bodyEl.focus({ preventScroll: true });
    const m = memo[n.id];
    if (m) { bodyEl.setSelectionRange(m.s, m.e); bodyEl.scrollTop = m.top; }
    else { const L = bodyEl.value.length; bodyEl.setSelectionRange(L, L); bodyEl.scrollTop = bodyEl.scrollHeight; }
  };
  const setView = v => wrap.classList.toggle('view-editor', v === 'editor');

  const select = (id, { focus = true, view = true } = {}) => {
    if (!byId(id)) return;
    const same = id === active;
    if (!same) {
      remember();
      flush();
      active = id;
      prune(id);
      U.store.set('notesActive', id);
      swapAnim();
      fillEditor();
    }
    if (orderChanged()) renderList(); else markActive();
    if (view) setView('editor');
    if (focus) { if (same) bodyEl.focus({ preventScroll: true }); else focusBody(); }
  };

  const create = ({ focus = true } = {}) => {
    const c = cur();
    if (c && blank(c) && !q()) {
      setView('editor');
      if (focus) titleEl.focus();
      return;
    }
    if (query) { query = ''; searchEl.value = ''; }
    const n = make();
    notes.push(n);
    select(n.id, { focus: false });
    if (focus) titleEl.focus();
  };

  const remove = async id => {
    const n = byId(id);
    if (!n) return;
    const list = sorted(), i = list.findIndex(x => x.id === id);
    const next = active === id ? (list[i + 1] || list[i - 1] || {}).id : active;
    const el = itemEl(id);
    if (el && U.motion()) { el.classList.add('out'); await U.wait(U.ms(170)); }
    if (!byId(id)) return;
    const wasActive = active === id;
    notes = notes.filter(x => x.id !== id);
    delete memo[id];
    if (wasActive) { active = next && byId(next) ? next : null; swapAnim(); }
    ensure();
    persist();
    if (wasActive || !next) fillEditor();
    renderList();
    if (blank(n)) return;
    const name = label(n);
    FX.toast(`Deleted “${name.length > 28 ? name.slice(0, 27) + '…' : name}”.`, {
      icon: 'trash', dur: 6000,
      action: { label: 'undo', run: () => {
        if (byId(n.id)) return;
        notes.push(n);
        persist();
        if (built && LT.Router.current === 'notes') select(n.id, { focus: !MOBILE.matches });
        else active = n.id;
        FX.toast('Note restored.', { icon: 'check' });
      } }
    });
  };

  const goList = () => {
    remember();
    flush();
    const n = cur();
    if (n && blank(n)) { notes = notes.filter(x => x !== n); persist(); active = (sorted()[0] || {}).id || null; }
    setView('list');
    renderList();
  };

  const action = a => {
    if (a === 'back') { goList(); return; }
    const n = cur();
    if (!n) return;
    if (a === 'pin') { n.pinned = !n.pinned; persist(); pinState(); renderList(); return; }
    if (a === 'delete') { remove(n.id); return; }
    if (blank(n)) { FX.toast('This note is empty.', { icon: 'note' }); return; }
    if (a === 'copy') U.copy(fullText(n)).then(ok => FX.toast(ok ? 'Note copied to clipboard.' : 'Copy failed.', { icon: ok ? 'copy' : 'alert', type: ok ? '' : 'err' }));
    if (a === 'txt' || a === 'md') {
      const name = fileName(n, a);
      U.download(name, fullText(n, a === 'md') + '\n', a === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8');
      FX.toast(`Downloaded ${name}`, { icon: 'download' });
    }
  };

  const edited = () => {
    const n = cur();
    if (!n) return;
    n.title = titleEl.value;
    n.body = bodyEl.value;
    n.updated = Date.now();
    queueSave();
    meta();
    syncSoon();
  };

  /* plain text editing helpers */
  const insertText = (text, s, e) => {
    bodyEl.setSelectionRange(s, e);
    let ok = false;
    try { ok = text ? document.execCommand('insertText', false, text) : document.execCommand('delete'); } catch (er) {}
    if (!ok) { bodyEl.setRangeText(text, s, e, 'end'); edited(); }
  };
  const lineStart = (v, i) => (i ? v.lastIndexOf('\n', i - 1) + 1 : 0);
  const indent = out => {
    const v = bodyEl.value, s = bodyEl.selectionStart, e = bodyEl.selectionEnd;
    if (!out && s === e) { insertText('\t', s, e); return; }
    const ls = lineStart(v, s), end0 = e > s && v[e - 1] === '\n' ? e - 1 : e;
    let le = v.indexOf('\n', end0);
    if (le < 0) le = v.length;
    const block = v.slice(ls, le), src = block.split('\n');
    const next = src.map(l => (out ? l.replace(/^(\t| {1,4})/, '') : l ? '\t' + l : l));
    const joined = next.join('\n');
    if (joined === block) return;
    const d0 = next[0].length - src[0].length, dAll = joined.length - block.length;
    insertText(joined, ls, le);
    const ns = s === ls && e !== s ? ls : Math.max(ls, s + d0);
    bodyEl.setSelectionRange(ns, s === e ? ns : Math.max(ns, e + dAll));
  };
  const smartEnter = () => {
    const v = bodyEl.value, s = bodyEl.selectionStart, e = bodyEl.selectionEnd;
    const ls = lineStart(v, s), line = v.slice(ls, s);
    const m = line.match(/^([ \t]*)(?:([-*•+])[ \t]|(\d{1,3})([.)])[ \t])?/);
    const [prefix, ind, bullet, num, sep] = m;
    if (!prefix) return false;
    let le = v.indexOf('\n', s);
    if (le < 0) le = v.length;
    if ((bullet || num) && line.length === prefix.length && s === e && !v.slice(s, le).trim()) { insertText('', ls, s); return true; }
    insertText('\n' + ind + (bullet ? bullet + ' ' : num ? (parseInt(num, 10) + 1) + sep + ' ' : ''), s, e);
    return true;
  };

  const setFont = f => {
    f = f === 'sans' ? 'sans' : 'mono';
    U.store.set('notesFont', f);
    wrap.classList.toggle('nt-sans', f === 'sans');
    page.querySelectorAll('[data-nfont] button').forEach(b => b.classList.toggle('active', b.dataset.v === f));
  };

  const build = () => {
    page.innerHTML = `<div class="notes" id="notes">
      <aside class="nt-side" aria-label="notes list">
        <div class="nt-side-head">
          <label class="nt-search">${U.icon('search')}<input id="ntSearch" type="text" placeholder="search notes" autocomplete="off" spellcheck="false" aria-label="search notes"></label>
          <button class="nt-new" id="ntNew" data-tip="new note" aria-label="new note">${U.icon('plus')}</button>
        </div>
        <div class="nt-list" id="ntList" role="listbox" aria-label="notes"><div class="nt-hi"></div><div class="nt-items" id="ntItems"></div></div>
        <div class="nt-side-foot" id="ntSideFoot"></div>
      </aside>
      <section class="nt-main" id="ntMain">
        <div class="nt-bar">
          <button class="nt-act nt-back" data-na="back" aria-label="back to all notes">${U.icon('back')}</button>
          <input id="ntTitle" class="nt-title" type="text" placeholder="untitled" maxlength="200" autocomplete="off" spellcheck="false" aria-label="note title">
          <div class="nt-acts">
            <button class="nt-act" data-na="pin" id="ntPin" data-tip="pin to top" aria-label="pin note" aria-pressed="false">${U.icon('pin')}</button>
            <div class="nt-exp">
              <button class="nt-act" data-na="copy" data-tip="copy the whole note" aria-label="copy note">${U.icon('copy')}<span>copy</span></button>
              <button class="nt-act" data-na="txt" data-tip="download as .txt" aria-label="download as txt">${U.icon('download')}<span>.txt</span></button>
              <button class="nt-act" data-na="md" data-tip="download as .md" aria-label="download as markdown">${U.icon('download')}<span>.md</span></button>
            </div>
            <button class="nt-act danger" data-na="delete" data-tip="delete note" aria-label="delete note">${U.icon('trash')}</button>
          </div>
        </div>
        <div class="nt-edit"><textarea id="ntBody" class="nt-body" placeholder="start typing…" spellcheck="false" autocapitalize="sentences" aria-label="note text"></textarea></div>
        <div class="nt-foot">
          <span id="ntCount"></span><span class="dot"></span><span id="ntEdited"></span>
          <span class="nt-status" id="ntStatus"></span>
          <div class="seg nt-font" data-nfont aria-label="note font"><button data-v="mono">mono</button><button data-v="sans">sans</button></div>
        </div>
      </section>
    </div>`;
    wrap = U.$('#notes', page); mainEl = U.$('#ntMain', page); itemsEl = U.$('#ntItems', page); listEl = U.$('#ntList', page);
    hiEl = U.$('.nt-hi', page); searchEl = U.$('#ntSearch', page); titleEl = U.$('#ntTitle', page); bodyEl = U.$('#ntBody', page);
    countEl = U.$('#ntCount', page); editedEl = U.$('#ntEdited', page); statusEl = U.$('#ntStatus', page);
    sideFootEl = U.$('#ntSideFoot', page); pinBtn = U.$('#ntPin', page);
    setFont(U.store.get('notesFont', 'mono'));
    setStatus('saved');

    titleEl.addEventListener('input', edited);
    bodyEl.addEventListener('input', edited);
    [titleEl, bodyEl, searchEl].forEach(f => f.addEventListener('focus', () => { lastField = f; }));
    titleEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || (e.key === 'ArrowDown' && titleEl.selectionStart === titleEl.value.length)) {
        e.preventDefault();
        bodyEl.focus({ preventScroll: true });
        bodyEl.setSelectionRange(0, 0);
        bodyEl.scrollTop = 0;
      }
    });
    bodyEl.addEventListener('keydown', e => {
      if (e.isComposing || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Tab') { e.preventDefault(); indent(e.shiftKey); }
      else if (e.key === 'Enter' && !e.shiftKey && smartEnter()) e.preventDefault();
    });

    searchEl.addEventListener('input', () => { query = searchEl.value; listEl.scrollTop = 0; renderList(); });
    searchEl.addEventListener('keydown', e => {
      const first = itemsEl.querySelector('.nt-item');
      if (e.key === 'Escape' && searchEl.value) { e.preventDefault(); e.stopPropagation(); searchEl.value = ''; query = ''; renderList(); }
      else if (e.key === 'ArrowDown' && first) { e.preventDefault(); first.focus(); }
      else if (e.key === 'Enter' && first) { e.preventDefault(); select(first.dataset.id, { focus: true }); }
    });

    U.$('#ntNew', page).addEventListener('click', () => create());
    itemsEl.addEventListener('click', e => {
      const b = e.target.closest('.nt-item');
      if (b) select(b.dataset.id, { focus: !MOBILE.matches });
    });
    itemsEl.addEventListener('keydown', e => {
      const b = e.target.closest('.nt-item');
      if (!b) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const all = U.$$('.nt-item', itemsEl), t = all[all.indexOf(b) + (e.key === 'ArrowDown' ? 1 : -1)];
        if (!t) { if (e.key === 'ArrowUp') searchEl.focus(); return; }
        select(t.dataset.id, { focus: false, view: false });
        const nt = itemEl(t.dataset.id);
        if (nt) { nt.focus({ preventScroll: true }); reveal(nt); }
      } else if (e.key === 'Delete') { e.preventDefault(); remove(b.dataset.id); }
    });
    mainEl.addEventListener('click', e => {
      const b = e.target.closest('[data-na]');
      if (b) action(b.dataset.na);
      const f = e.target.closest('[data-nfont] button');
      if (f) setFont(f.dataset.v);
    });

    document.addEventListener('keydown', e => {
      if (LT.Router.current !== 'notes' || FX.modalOpen || LT.Palette.isOpen()) return;
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (!cur()) return;
        persist();
        statusEl.classList.remove('flash');
        void statusEl.offsetWidth;
        statusEl.classList.add('flash');
      }
    });
    MOBILE.addEventListener('change', () => { if (LT.Router.current === 'notes') requestAnimationFrame(() => moveHi(true)); });
    built = true;
  };

  N.show = () => {
    page = U.$('#page-notes');
    if (!built) build();
    load();
    if (!cur()) { const last = U.store.get('notesActive', null); active = byId(last) ? last : null; }
    if (pendingNew || !notes.some(n => !blank(n))) {
      pendingNew = false;
      ensure();
      fillEditor();
      renderList(false);
      create({ focus: true });
      setView('editor');
    } else {
      ensure();
      fillEditor();
      renderList(false);
      setView(MOBILE.matches ? 'list' : 'editor');
      if (!MOBILE.matches) focusBody();
    }
    reveal(itemEl(active));
    clearInterval(tickT);
    tickT = setInterval(tick, 30000);
  };
  N.leave = () => {
    if (!built) return;
    clearInterval(tickT);
    remember();
    flush();
    prune(null);
  };
  N.newNote = () => {
    if (built && LT.Router.current === 'notes') { create(); return; }
    pendingNew = true;
    location.hash = '#/notes';
  };
  N.refocus = () => {
    if (!built || LT.Router.current !== 'notes' || MOBILE.matches) return;
    const f = lastField && lastField.isConnected ? lastField : bodyEl;
    if (f && document.activeElement !== f && f.offsetParent) f.focus({ preventScroll: true });
  };
  N.relayout = () => { if (built) moveHi(true); };

  const bye = () => { if (pending) persist(); };
  window.addEventListener('pagehide', bye);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bye(); });
  window.addEventListener('storage', e => {
    if (e.key !== 'larptype:notes' || !built || pending) return;
    load();
    ensure();
    if (LT.Router.current !== 'notes') return;
    fillEditor(false);
    renderList(false);
  });

  LT.Notes = N;
})();
