(() => {
  const U = LT.U, S = LT.S, V = LT.View, Gen = LT.Gen, DB = LT.DB;
  const T = { state: 'idle', words: [], inputs: [], wi: 0, zen: false, startT: 0, lastBurst: null, busy: false, cfg: null };
  let gen = null, st = null, ti, testEl, secT = null, liveT = null, memT = null, blurT = null;
  let composing = false, lastSeed = 0, lastQuote = null, lastWords = null, lastPractice = null, paceWpm = 0;

  const isTimed = () => T.cfg.mode === 'time';
  const mods = () => T.cfg.mods;

  const snapshot = () => ({
    mode: S.get('mode'), time: S.get('time'), words: S.get('words'), ql: S.get('quoteLength'),
    punct: S.get('punctuation'), nums: S.get('numbers'), lang: S.get('language'),
    diff: S.get('difficulty'), mods: [...S.get('mods')]
  });

  T.applyClasses = () => {
    const m = S.get('mods');
    const c = testEl.classList;
    c.toggle('blind', m.includes('blind'));
    c.toggle('mod-mirror', m.includes('mirror'));
    c.toggle('mod-upsidedown', m.includes('upsidedown'));
    c.toggle('lava-on', m.includes('lava'));
    c.toggle('flip', S.get('flipColors'));
    c.toggle('colorful', S.get('colorful'));
    c.toggle('hlword', S.get('highlightWord'));
  };

  const updateMeta = () => {
    const m = S.get('mods');
    U.$('#modsName').textContent = m.length ? m.map(k => LT.MODS[k].name).join(' · ') : 'challenges';
    U.$('#modsBtn').classList.toggle('empty', !m.length);
    U.$('#practiceTag').textContent = T.cfg.practice ? T.cfg.practiceLabel : '';
  };

  T.newTest = (opts = {}) => {
    clearTimers();
    T.state = 'idle';
    T.cfg = snapshot();
    T.zen = T.cfg.mode === 'zen';
    T.wi = 0; T.lastBurst = null; T.failReason = null;
    st = { keys: 0, correct: 0, errors: 0, secKeys: 0, secErr: 0, raw: [], err: [], wpm: [], bursts: [], wordStart: 0, lastKey: 0, keyMap: {}, log: [], lava: 0 };
    const rc = T.cfg.mods.includes('randomcase');
    let words;
    const prac = opts.practice || (opts.repeat && lastPractice) || null;
    if (prac) {
      words = [...prac.words];
      T.cfg.practice = prac.type; T.cfg.practiceLabel = prac.label;
      T.cfg.mode = 'words'; T.zen = false;
      lastPractice = prac;
    } else {
      lastPractice = null;
      const seed = opts.repeat && lastSeed ? lastSeed : U.newSeed();
      lastSeed = seed;
      const mk = () => Gen.create({ pack: T.cfg.lang, punctuation: T.cfg.punct, numbers: T.cfg.nums, seed, randomcase: rc });
      switch (T.cfg.mode) {
        case 'time': gen = mk(); words = gen.take(90); break;
        case 'words': gen = mk(); words = gen.finish(gen.take(T.cfg.words)); break;
        case 'quote': {
          const q = opts.repeat && lastQuote ? lastQuote : Gen.quote(T.cfg.ql, { excludeId: lastQuote && lastQuote.id });
          lastQuote = q; T.quote = q;
          words = q.text.split(' ');
          if (rc) { const r = U.rng(seed); words = words.map(w => [...w].map(c => (r() < .5 ? c.toUpperCase() : c.toLowerCase())).join('')); }
          break;
        }
        case 'custom': words = opts.repeat && lastWords ? [...lastWords] : Gen.custom(); break;
        default: words = [''];
      }
    }
    lastWords = words;
    T.words = words;
    T.inputs = [''];
    updateMeta();
    T.applyClasses();
    testEl.classList.remove('memhide', 'lava-hot');
    V.lava(0);
    V.stopPace();
    V.clearLive();
    V.barReset();
    V.build();
    V.blink();
    document.body.classList.remove('running', 'typing', 'hide-cursor');
    paceWpm = resolvePace();
    T.focus();
  };

  const resolvePace = () => {
    const m = S.get('paceCaret');
    if (m === 'off') return 0;
    if (m === 'custom') return S.get('paceWpm');
    const same = DB.results.filter(r => !r.failed && r.mode === T.cfg.mode && String(r.m2) === String(T.cfg.mode === 'time' ? T.cfg.time : T.cfg.words) && r.lang === T.cfg.lang);
    if (m === 'pb') { const pb = DB.pbFor({ mode: T.cfg.mode, m2: T.cfg.mode === 'time' ? T.cfg.time : T.words.length, lang: T.cfg.lang, punct: T.cfg.punct, nums: T.cfg.nums }); return pb ? pb.wpm : 0; }
    if (m === 'last') { const l = DB.results[DB.results.length - 1]; return l && !l.failed ? l.wpm : 0; }
    if (m === 'average') { const last = same.slice(-10); return last.length ? U.mean(last.map(r => r.wpm)) : 0; }
    return 0;
  };
  T.paceWpm = () => paceWpm;

  const clearTimers = () => { clearTimeout(secT); clearInterval(liveT); clearTimeout(memT); secT = liveT = memT = null; };

  const start = () => {
    T.state = 'running';
    T.startT = U.now();
    st.wordStart = st.lastKey = T.startT;
    DB.profile.started++;
    const b = document.body.classList;
    b.add('running', 'typing');
    if (S.get('focusMode')) b.add('hide-cursor');
    const ts = S.get('timerStyle');
    if ((ts === 'bar' || ts === 'both')) { if (isTimed()) V.barTime(T.cfg.time); else if (!T.zen) V.barProgress(0); }
    secT = setTimeout(tick, 1000);
    liveT = setInterval(live, 200);
    live();
    if (paceWpm > 0) V.startPace(paceWpm);
    if (mods().includes('memory') && !T.zen) memT = setTimeout(() => testEl.classList.add('memhide'), Math.round(U.clamp(T.words.length * 120, 2500, 6000)));
    return true;
  };

  const correctChars = () => {
    let n = 0;
    for (let i = 0; i < T.wi; i++) if (T.zen || T.inputs[i] === T.words[i]) n += T.words[i].length + 1;
    const inp = T.inputs[T.wi] || '', tgt = T.words[T.wi] || '';
    if (inp && (T.zen || tgt.startsWith(inp))) n += inp.length;
    return n;
  };
  const wpmAt = sec => (sec > 0 ? (correctChars() / 5) / (sec / 60) : 0);

  const record = frac => {
    st.raw.push(U.round((st.secKeys / 5) * 60 / frac, 1));
    st.err.push(st.secErr);
    st.wpm.push(U.round(wpmAt((U.now() - T.startT) / 1000), 1));
    st.secKeys = 0; st.secErr = 0;
  };

  const tick = () => {
    if (T.state !== 'running') return;
    record(1);
    const sec = st.raw.length;
    if (isTimed() && sec >= T.cfg.time) { finish(); return; }
    const mw = S.get('minWpm');
    if (mw > 0 && sec >= 3 && st.wpm[sec - 1] < mw) { fail('below minimum wpm'); return; }
    live();
    secT = setTimeout(tick, Math.max(0, T.startT + (sec + 1) * 1000 - U.now()));
  };

  const live = () => {
    if (T.state !== 'running') return;
    const el = (U.now() - T.startT) / 1000;
    let timer;
    if (isTimed()) timer = Math.max(0, T.cfg.time - st.raw.length);
    else if (T.zen) timer = T.wi;
    else timer = `${T.wi}/${T.words.length}`;
    const acc = st.keys ? Math.floor((st.correct / st.keys) * 100) : 100;
    V.live({ timer, wpm: el > .5 ? Math.round(wpmAt(el)) : 0, acc, burst: T.lastBurst });
  };

  const keyStat = (exp, ok, now) => {
    if (!exp) return;
    const k = exp.toLowerCase();
    const a = st.keyMap[k] || (st.keyMap[k] = [0, 0, 0, 0]);
    if (ok) {
      a[0]++;
      const d = now - st.lastKey;
      if (d > 0 && d < 1500 && st.keys > 1) { a[2] += d; a[3]++; }
    } else a[1]++;
  };
  const logEv = now => st.log.push([Math.round(now - T.startT), T.wi, T.inputs[T.wi] || '']);

  const lavaHit = () => {
    if (!mods().includes('lava')) return false;
    st.lava += 1 / S.get('lavaLimit');
    V.lava(st.lava);
    if (st.lava >= 1) { fail('the lava got you'); return true; }
    return false;
  };
  const lavaCool = () => {
    if (!mods().includes('lava') || st.lava <= 0) return;
    st.lava = Math.max(0, st.lava - .25 / S.get('lavaLimit'));
    V.lava(st.lava);
  };

  const char = ch => {
    if (T.state === 'done' || T.busy) return;
    if (ch === '\n' || ch === '\r' || ch === '\t') return;
    if (ch === ' ') ch = ' ';
    if (T.state === 'idle') { if (ch === ' ') return; start(); }
    const now = U.now();
    if (ch === ' ') { space(now); return; }
    if (T.zen) {
      T.inputs[T.wi] += ch; T.words[T.wi] = T.inputs[T.wi];
      st.keys++; st.correct++; st.secKeys++; st.lastKey = now;
      logEv(now); V.renderWord(T.wi); V.update(); V.typing();
      return;
    }
    const tgt = T.words[T.wi], inp = T.inputs[T.wi], exp = tgt[inp.length], ok = ch === exp;
    if (!ok && inp.length >= tgt.length + V.MAX_EXTRA) return;
    st.keys++; st.secKeys++;
    if (ok) st.correct++; else { st.errors++; st.secErr++; }
    keyStat(exp, ok, now);
    st.lastKey = now;
    if (!ok) {
      if (S.get('stopOnError') === 'letter') { V.typing(); if (lavaHit()) return; if (T.cfg.diff === 'master') fail('wrong key on master'); return; }
      T.inputs[T.wi] = inp + ch;
      logEv(now); V.renderWord(T.wi); V.update(); V.typing();
      if (T.cfg.diff === 'master') { fail('wrong key on master'); return; }
      if (lavaHit()) return;
      minAccCheck();
      return;
    }
    T.inputs[T.wi] = inp + ch;
    logEv(now); V.renderWord(T.wi); V.update(); V.typing();
    if (!isTimed() && T.wi === T.words.length - 1 && T.inputs[T.wi] === tgt) { commit(now, true); finish(); }
  };

  const minAccCheck = () => {
    const ma = S.get('minAcc');
    if (ma > 0 && st.keys >= 10 && (st.correct / st.keys) * 100 < ma) fail('below minimum accuracy');
  };

  const space = now => {
    const inp = T.inputs[T.wi], tgt = T.words[T.wi];
    if (!inp.length) return;
    if (T.zen) { st.keys++; st.correct++; st.secKeys++; commit(now); return; }
    if (S.get('stopOnError') === 'word' && inp !== tgt) {
      st.keys++; st.errors++; st.secErr++; st.secKeys++;
      V.typing(); lavaHit(); minAccCheck();
      return;
    }
    st.keys++; st.secKeys++;
    if (inp.length === tgt.length) st.correct++; else { st.errors++; st.secErr++; }
    st.lastKey = now;
    commit(now);
  };

  const commit = (now, last = false) => {
    const i = T.wi, inp = T.inputs[i], tgt = T.words[i];
    const good = T.zen || inp === tgt;
    const dur = now - st.wordStart;
    T.lastBurst = dur > 30 ? Math.round((inp.length / 5) / (dur / 60000)) : T.lastBurst;
    st.bursts[i] = T.lastBurst || 0;
    st.wordStart = now;
    if (!good) {
      if (T.cfg.diff === 'expert' && !last) { T.wi++; T.inputs[T.wi] = ''; V.renderWord(i); fail('wrong word on expert'); return; }
      if (!S.get('stopOnError') || S.get('stopOnError') === 'off') lavaHit();
      if (T.state !== 'running') return;
    } else lavaCool();
    T.wi++;
    if (T.zen) { T.words.push(''); T.inputs.push(''); V.append(T.wi); }
    else if (last) { V.renderWord(i); return; }
    else if (isTimed()) {
      if (T.words.length - T.wi < 45) { const from = T.words.length; T.words.push(...gen.take(45)); V.append(from); }
    } else if (T.wi >= T.words.length) { V.renderWord(i); finish(); return; }
    T.inputs[T.wi] = T.inputs[T.wi] || '';
    logEv(now);
    V.renderWord(i); V.renderWord(T.wi); V.update(); V.typing();
    const ts = S.get('timerStyle');
    if (!isTimed() && !T.zen && (ts === 'bar' || ts === 'both')) V.barProgress(T.wi / T.words.length);
  };

  const back = word => {
    if (T.state !== 'running') return;
    if (mods().includes('nobackspace') || S.get('confidence') === 'max') return;
    const now = U.now();
    const inp = T.inputs[T.wi];
    if (!inp.length) {
      if (T.wi === 0 || S.get('confidence') === 'on') return;
      const p = T.wi - 1;
      if (!V.wordEl(p)) return;
      if (!T.zen && T.inputs[p] === T.words[p] && !S.get('freedom')) return;
      if (T.zen) { T.words.pop(); T.inputs.pop(); const w = V.wordEl(T.wi); if (w) w.remove(); }
      else { T.inputs.length = T.wi; V.renderWord(T.wi); }
      T.wi = p;
      if (word) { T.inputs[p] = ''; if (T.zen) T.words[p] = ''; }
    } else {
      T.inputs[T.wi] = word ? '' : inp.slice(0, -1);
      if (T.zen) T.words[T.wi] = T.inputs[T.wi];
    }
    if (!T.zen && V.wordEl(T.wi + 1)) V.renderWord(T.wi + 1);
    logEv(now);
    V.renderWord(T.wi); V.update(); V.typing();
  };

  const charStats = () => {
    let c = 0, x = 0, e = 0, m = 0;
    const last = T.inputs[T.wi] ? T.wi : T.wi - 1;
    for (let i = 0; i <= last && i < T.words.length; i++) {
      const t = T.words[i], inp = T.inputs[i] || '';
      for (let j = 0; j < Math.max(t.length, inp.length); j++) {
        if (j < t.length && j < inp.length) inp[j] === t[j] ? c++ : x++;
        else if (j >= t.length) e++;
        else if (i < T.wi) m++;
      }
    }
    return [c, x, e, m];
  };

  const consistency = raws => {
    const a = raws.filter(Number.isFinite);
    if (a.length < 2) return 100;
    const m = U.mean(a);
    if (!m) return 0;
    return U.clamp(100 * (1 - Math.tanh(U.std(a) / m)), 0, 100);
  };

  const fail = reason => {
    if (T.state !== 'running') return;
    T.failReason = reason;
    V.shake();
    finish();
  };
  T.fail = fail;

  const finish = () => {
    if (T.state !== 'running') return;
    T.state = 'done';
    const end = U.now();
    clearTimers();
    let elapsed = (end - T.startT) / 1000;
    if (isTimed() && !T.failReason) elapsed = T.cfg.time;
    const frac = elapsed - st.raw.length;
    if (frac > .15 || !st.raw.length) record(Math.max(frac, .05));
    else if (st.secKeys && st.raw.length) { st.raw[st.raw.length - 1] = U.round(st.raw[st.raw.length - 1] + (st.secKeys / 5) * 60, 1); st.err[st.err.length - 1] += st.secErr; }
    V.stopPace();
    V.barFreeze();
    const minutes = Math.max(elapsed, .01) / 60;
    const chars = charStats();
    const committed = T.zen ? T.wi + (T.inputs[T.wi] ? 1 : 0) : Math.min(T.wi, T.words.length);
    const r = {
      id: Date.now().toString(36), ts: Date.now(), mode: T.cfg.mode,
      m2: T.cfg.mode === 'time' ? T.cfg.time : T.cfg.mode === 'words' ? T.words.length : T.cfg.mode === 'quote' ? (T.quote ? T.quote.len : 'all') : T.cfg.mode,
      lang: T.cfg.mode === 'custom' ? 'custom' : T.cfg.lang, punct: T.cfg.punct, nums: T.cfg.nums, diff: T.cfg.diff, mods: T.cfg.mods,
      wpm: U.round((correctChars() / 5) / minutes, 2), raw: U.round((st.keys / 5) / minutes, 2),
      acc: U.round(st.keys ? (st.correct / st.keys) * 100 : 0, 2), cons: U.round(consistency(st.raw), 2),
      time: U.round(elapsed, 2), chars, words: committed,
      failed: !!T.failReason, reason: T.failReason || null, practice: T.cfg.practice || null,
      chart: { wpm: st.wpm, raw: st.raw, err: st.err }
    };
    if (T.quote && T.cfg.mode === 'quote') r.quoteId = T.quote.id;
    const missed = [];
    for (let i = 0; i < Math.min(T.wi, T.words.length); i++) if (!T.zen && T.inputs[i] !== T.words[i]) missed.push(T.words[i]);
    const ctx = {
      words: T.words.slice(0, committed + 1), inputs: T.inputs.slice(0, committed + 1), bursts: st.bursts, missed,
      log: st.log, pace: paceWpm, keyMap: st.keyMap, quote: T.cfg.mode === 'quote' ? T.quote : null
    };
    const afk = st.raw.filter(v => v === 0).length;
    const tooShort = r.time < 2 || st.keys < 4;
    document.body.classList.remove('running', 'typing', 'hide-cursor');
    testEl.classList.remove('memhide');
    LT.Results.show(r, ctx, { invalid: tooShort || afk / Math.max(1, st.raw.length) > .6 });
  };
  T.finish = finish;

  T.restart = async (opts = {}) => {
    if (T.busy) return;
    T.busy = true;
    clearTimers();
    T.state = 'idle';
    document.body.classList.remove('running', 'typing', 'hide-cursor');
    if (LT.Results.isOpen()) await LT.Results.close();
    else { V.fade(true); await U.wait(U.ms(110)); }
    if (opts.theme !== false && LT.Results.justFinished) { LT.Results.justFinished = false; LT.Theme.randomize(); }
    T.busy = false;
    T.newTest(opts);
    V.fade(false);
  };
  T.repeat = () => T.restart({ repeat: true });
  T.practiceMissed = () => {
    const c = LT.Results.ctx;
    const words = c && Gen.missed(c.missed);
    if (!words) { LT.FX.toast('No missed words in the last test.', { icon: 'check' }); return; }
    T.restart({ practice: { type: 'missed', words, label: 'missed words' } });
  };
  T.practiceWeak = () => {
    const weak = Gen.weakKeys();
    if (weak.length < 2) { LT.FX.toast('Finish a few more tests first so there is enough data to find your weak keys.', { title: 'not enough data', icon: 'target' }); return; }
    const letters = weak.map(w => w.ch);
    const words = Gen.weakWords(letters, 50);
    if (!words) return;
    if (LT.Router.current !== 'test') location.hash = '#/';
    T.restart({ practice: { type: 'weak', words, label: 'weak keys · ' + letters.join(' ') } });
  };

  T.focus = () => {
    if (!ti || LT.Router.current !== 'test' || LT.Results.isOpen() || LT.Palette.isOpen() || LT.FX.modalOpen) return;
    if (document.activeElement !== ti) ti.focus({ preventScroll: true });
  };
  T.input = () => ti;

  const caps = e => {
    if (!e.getModifierState) return;
    U.$('#capsWarn').classList.toggle('show', S.get('capsWarning') && e.getModifierState('CapsLock'));
  };

  T.init = () => {
    ti = U.$('#ti'); testEl = U.$('#test');
    ti.addEventListener('keydown', e => {
      caps(e);
      if (e.isComposing || e.keyCode === 229) return;
      const k = e.key, qr = S.get('quickRestart');
      if (k === 'Tab') {
        if (qr === 'tab') { e.preventDefault(); e.shiftKey ? T.repeat() : T.restart(); }
        return;
      }
      if (k === 'Enter') {
        e.preventDefault();
        if (T.zen && e.shiftKey && T.state === 'running') { finish(); return; }
        if (qr === 'enter') T.restart();
        return;
      }
      if (k === 'Backspace') { e.preventDefault(); back(e.ctrlKey || e.altKey || e.metaKey); return; }
      if (/^(Arrow|Home|End|Page|Delete)/.test(k)) e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && /^[azyxv]$/i.test(k)) e.preventDefault();
    });
    ti.addEventListener('keyup', caps);
    ti.addEventListener('beforeinput', e => {
      if (e.isComposing || e.inputType === 'insertCompositionText') return;
      e.preventDefault();
      const t = e.inputType;
      if (t === 'insertText' || t === 'insertReplacementText') { for (const ch of e.data || '') char(ch); }
      else if (t.startsWith('delete') && t.endsWith('Backward')) back(t !== 'deleteContentBackward');
    });
    ti.addEventListener('input', () => { if (!composing) ti.value = ''; });
    ti.addEventListener('compositionstart', () => { composing = true; });
    ti.addEventListener('compositionend', e => {
      composing = false;
      for (const ch of e.data || '') char(ch);
      setTimeout(() => { if (!composing) ti.value = ''; }, 0);
    });
    ti.addEventListener('paste', e => e.preventDefault());
    ti.addEventListener('focus', () => { clearTimeout(blurT); V.blur(false); });
    ti.addEventListener('blur', () => {
      clearTimeout(blurT);
      blurT = setTimeout(() => { if (document.activeElement !== ti && LT.Router.current === 'test' && !LT.Results.isOpen()) V.blur(true); }, 350);
    });
    U.$('#wordsPanel').addEventListener('mousedown', e => { if (e.target.closest('button')) return; e.preventDefault(); T.focus(); });
    U.$('#restartBtn').addEventListener('click', () => T.restart());
    document.addEventListener('mousemove', () => document.body.classList.remove('hide-cursor'), { passive: true });
  };

  LT.Test = T;
})();
