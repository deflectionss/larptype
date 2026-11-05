(() => {
  const U = LT.U, S = LT.S, FX = LT.FX;
  const V = {};
  let wrap, inner, wordsEl, caretEl, paceEl, testEl, lavaEl, fill;
  let domStart = 0, topLine = 0, LH = 48, F = 28, charW = 16, lastW = -1;
  let cx, cy, scroll, px, py, blinkT, running = false, paceFn = null, cum = [0];
  const MAX_EXTRA = 12;

  V.init = () => {
    wrap = U.$('#wordsWrap'); inner = U.$('#wordsInner'); wordsEl = U.$('#words');
    caretEl = U.$('#caret'); paceEl = U.$('#paceCaret'); testEl = U.$('#test');
    lavaEl = U.$('#lava'); fill = U.$('#timerBarFill');
    cx = new FX.Spring(); cy = new FX.Spring(); scroll = new FX.Spring(34);
    px = new FX.Spring(60); py = new FX.Spring(60);
    V.setCaretSpeed();
  };
  V.MAX_EXTRA = MAX_EXTRA;
  V.setCaretSpeed = () => {
    const w = { off: 0, fast: 70, medium: 44, slow: 26 }[S.get('smoothCaret')];
    cx.w = cy.w = w || 1;
    V.smooth = !!w;
  };

  const T = () => LT.Test;
  const wordEl = i => wordsEl.children[i - domStart] || null;
  V.wordEl = wordEl;

  const letters = i => {
    const t = T(), tgt = t.words[i], inp = t.inputs[i] || '', typed = i < t.wi;
    const typos = S.get('indicateTypos'), hide = S.get('hideExtra');
    let h = '';
    for (let j = 0; j < tgt.length; j++) {
      const ch = tgt[j];
      if (j < inp.length) {
        const c = inp[j];
        if (c === ch) h += `<span class="l c">${U.esc(ch)}</span>`;
        else if (typos === 'replace') h += `<span class="l x">${U.esc(c === ' ' ? '_' : c)}</span>`;
        else if (typos === 'below') h += `<span class="l x" data-t="${U.esc(c)}">${U.esc(ch)}</span>`;
        else h += `<span class="l x">${U.esc(ch)}</span>`;
      } else h += `<span class="l${typed ? ' m' : ''}">${U.esc(ch)}</span>`;
    }
    if (!hide) for (let j = tgt.length; j < inp.length; j++) h += `<span class="l e">${U.esc(inp[j])}</span>`;
    return h;
  };
  const wordCls = i => {
    const t = T();
    let c = 'word';
    if (i < t.wi) { c += ' typed'; if (!t.zen && (t.inputs[i] || '') !== t.words[i]) c += ' err'; }
    if (i === t.wi) c += ' active';
    return c;
  };
  const wordHTML = i => `<div class="${wordCls(i)}">${letters(i)}</div>`;

  const rebuildCum = () => {
    const w = T().words;
    cum = [0];
    for (let i = 0; i < w.length; i++) cum.push(cum[i] + w[i].length + 1);
  };

  V.build = () => {
    const t = T();
    domStart = 0; topLine = 0;
    let h = '';
    for (let i = 0; i < t.words.length; i++) h += wordHTML(i);
    wordsEl.innerHTML = h;
    rebuildCum();
    scroll.snap(0);
    lastW = -1;
    V.measure();
    V.update(true);
    paceEl.classList.remove('on');
  };
  V.append = from => {
    const t = T();
    let h = '';
    for (let i = from; i < t.words.length; i++) h += wordHTML(i);
    wordsEl.insertAdjacentHTML('beforeend', h);
    rebuildCum();
  };
  V.renderWord = i => {
    const w = wordEl(i);
    if (!w) return;
    w.className = wordCls(i);
    w.innerHTML = letters(i);
  };
  V.refreshAll = () => {
    const t = T();
    for (let i = domStart; i < t.words.length; i++) V.renderWord(i);
    V.update(true);
  };

  V.measure = () => {
    F = parseFloat(getComputedStyle(wrap).fontSize) || 28;
    const w = wordsEl.firstElementChild;
    LH = (w && w.offsetHeight) || F * 1.5;
    const l = w && w.firstElementChild;
    charW = (l && l.offsetWidth) || F * .6;
  };

  const caretTarget = () => {
    const t = T(), w = wordEl(t.wi);
    if (!w) return null;
    const n = (t.inputs[t.wi] || '').length, ls = w.children;
    let x, wd;
    if (n < ls.length) { const l = ls[n]; x = w.offsetLeft + l.offsetLeft; wd = l.offsetWidth; }
    else if (ls.length) { const l = ls[ls.length - 1]; x = w.offsetLeft + l.offsetLeft + l.offsetWidth; wd = charW; }
    else { x = w.offsetLeft; wd = charW; }
    return { x, y: w.offsetTop, wd };
  };

  const caretOffY = () => (document.body.classList.contains('cs-underline') ? F * 1.24 : (LH - F * 1.15) / 2);

  const removeTop = () => {
    if (topLine <= 0) return;
    const kids = wordsEl.children, limit = topLine * LH - LH / 2;
    let k = 0;
    while (k < kids.length - 1 && kids[k].offsetTop < limit && domStart + k < T().wi - 1) k++;
    if (!k) return;
    const d = kids[k].offsetTop;
    for (let i = 0; i < k; i++) wordsEl.firstElementChild.remove();
    domStart += k;
    const lines = Math.round(d / LH);
    topLine = Math.max(0, topLine - lines);
    scroll.shift(d); cy.shift(-d); py.shift(-d);
    apply();
  };

  const apply = () => {
    caretEl.style.transform = `translate3d(${cx.x}px, ${cy.x + caretOffY()}px, 0)`;
    inner.style.transform = `translate3d(0, ${scroll.x}px, 0)`;
  };

  let looping = false;
  const kick = () => {
    if (looping) return;
    looping = true;
    FX.animate(dt => {
      let busy = false;
      if (cx.busy || cy.busy) { cx.step(dt); cy.step(dt); busy = true; }
      if (scroll.busy) { scroll.step(dt); busy = true; } else if (topLine > 0) removeTop();
      if (paceFn) { paceFn(); busy = true; }
      apply();
      if (!busy && topLine > 0 && !scroll.busy) removeTop();
      looping = busy || (topLine > 0 && scroll.busy);
      return looping;
    });
  };

  V.update = (instant = false) => {
    const p = caretTarget();
    if (!p) return;
    const line = Math.round(p.y / LH);
    if (line - topLine >= 2) {
      topLine = line - 1;
      scroll.t = -topLine * LH;
      if (instant || !S.get('smoothLineScroll') || !U.motion()) { scroll.snap(scroll.t); removeTop(); return V.update(true); }
    }
    cx.t = p.x; cy.t = p.y;
    if (instant || !V.smooth) { cx.snap(p.x); cy.snap(p.y); }
    if (p.wd !== lastW) { lastW = p.wd; caretEl.style.width = /cs-(block|outline|underline)/.test(document.body.className) ? p.wd + 'px' : ''; }
    apply();
    kick();
  };

  V.typing = () => {
    caretEl.classList.remove('blink', 'blink-sharp');
    clearTimeout(blinkT);
    blinkT = setTimeout(V.blink, 600);
  };
  V.blink = () => {
    clearTimeout(blinkT);
    const b = S.get('caretBlink');
    caretEl.classList.remove('blink', 'blink-sharp');
    if (b === 'off') return;
    void caretEl.offsetWidth;
    caretEl.classList.add(b === 'sharp' ? 'blink-sharp' : 'blink');
  };

  V.relayout = () => {
    const t = T();
    if (!t || !t.words.length) return;
    V.measure();
    lastW = -1;
    const w = wordEl(t.wi);
    if (w) {
      const line = Math.round(w.offsetTop / LH);
      topLine = Math.max(0, line - 1);
      scroll.snap(-topLine * LH);
      removeTop();
    }
    V.update(true);
  };

  V.startPace = wpm => {
    const t = T();
    if (!wpm || t.zen) { V.stopPace(); return; }
    const cps = wpm * 5 / 60, t0 = t.startT;
    paceEl.classList.add('on');
    let first = true;
    paceFn = () => {
      const pos = ((performance.now() - t0) / 1000) * cps;
      let lo = 0, hi = cum.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cum[mid] <= pos) lo = mid; else hi = mid - 1; }
      const i = lo;
      if (i >= t.words.length) { paceEl.classList.remove('on'); return; }
      const w = wordEl(i);
      if (!w) { paceEl.style.opacity = '0'; return; }
      paceEl.style.opacity = '';
      const len = t.words[i].length, j = Math.min(len, pos - cum[i]);
      const at = k => {
        const ls = w.children;
        if (k < len && ls[k]) return w.offsetLeft + ls[k].offsetLeft;
        const l = ls[Math.min(len, ls.length) - 1];
        return l ? w.offsetLeft + l.offsetLeft + l.offsetWidth : w.offsetLeft;
      };
      const jj = Math.floor(j), f = j - jj;
      const x = jj >= len ? at(len) : U.lerp(at(jj), at(jj + 1), f);
      px.t = x; py.t = w.offsetTop;
      if (first || Math.abs(py.t - py.x) > LH * .5) { px.snap(x); py.snap(py.t); first = false; }
      else { px.step(1 / 60); py.snap(py.t); }
      paceEl.style.transform = `translate3d(${px.x}px, ${py.x + caretOffY()}px, 0)`;
    };
    kick();
  };
  V.stopPace = () => { paceFn = null; paceEl.classList.remove('on'); };

  V.live = ({ timer, wpm, acc, burst }) => {
    const ts = S.get('timerStyle');
    U.$('#lsTimer').textContent = ts === 'mini' || ts === 'both' ? (timer ?? '') : '';
    U.$('#lsWpm').innerHTML = S.get('liveWpm') && wpm != null ? `${wpm}<small>wpm</small>` : '';
    U.$('#lsAcc').innerHTML = S.get('liveAcc') && acc != null ? `${acc}<small>%</small>` : '';
    U.$('#lsBurst').innerHTML = S.get('liveBurst') && burst != null ? `${burst}<small>burst</small>` : '';
  };
  V.clearLive = () => ['#lsTimer', '#lsWpm', '#lsAcc', '#lsBurst'].forEach(s => (U.$(s).textContent = ''));

  V.barTime = secs => {
    fill.style.transition = 'none';
    fill.style.transform = 'scaleX(1)';
    void fill.offsetWidth;
    fill.style.transition = `transform ${secs}s linear`;
    fill.style.transform = 'scaleX(0)';
  };
  V.barProgress = p => {
    fill.style.transition = `transform ${U.ms(250) / 1000}s var(--ease)`;
    fill.style.transform = `scaleX(${U.clamp(p, 0, 1)})`;
  };
  V.barReset = () => { fill.style.transition = 'none'; fill.style.transform = 'scaleX(0)'; };
  V.barFreeze = () => {
    const m = getComputedStyle(fill).transform;
    fill.style.transition = 'none';
    fill.style.transform = m === 'none' ? 'scaleX(0)' : m;
  };

  V.lava = level => {
    lavaEl.style.transform = `translateY(${(1 - U.clamp(level, 0, 1)) * 100}%)`;
    testEl.classList.toggle('lava-hot', level > .7);
  };
  V.blur = on => wrap.classList.toggle('blurred', on);
  V.fade = on => wrap.classList.toggle('fade', on);
  V.shake = () => { wrap.classList.remove('oof'); void wrap.offsetWidth; wrap.classList.add('oof'); };
  V.setRunning = on => { running = on; };
  V.caretEl = () => caretEl;

  LT.View = V;
})();
