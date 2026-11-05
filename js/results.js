(() => {
  const U = LT.U, S = LT.S, DB = LT.DB, FX = LT.FX;
  const R = { open: false, r: null, ctx: null, justFinished: false, shownAt: 0 };
  let chart = null;

  R.isOpen = () => R.open;
  R.ready = () => R.open && performance.now() - R.shownAt > 350;

  const fmt = v => (S.get('wpmDecimals') ? U.round(v, 2).toFixed(2) : String(Math.round(v)));
  const modeLabel = r => {
    if (r.practice) return r.practice === 'weak' ? 'weak keys' : 'missed words';
    if (r.mode === 'time') return `time ${r.m2}`;
    if (r.mode === 'words') return `words ${r.m2}`;
    if (r.mode === 'quote') return `quote ${r.m2}`;
    return r.mode;
  };
  R.modeLabel = modeLabel;

  const stat = (k, v, sub = '', tip = '') => `<div class="r-stat"${tip ? ` data-tip="${U.esc(tip)}"` : ''}><div class="r-k">${k}</div><div class="r-v">${v}</div>${sub ? `<div class="r-sub">${sub}</div>` : ''}</div>`;

  const wordsHistory = (ctx, heat) => {
    const b = ctx.bursts.filter(x => x > 0);
    const sorted = [...b].sort((a, c) => a - c);
    const q = p => sorted[Math.floor(p * (sorted.length - 1))] || 0;
    const qs = [q(.2), q(.4), q(.6), q(.8)];
    return ctx.words.map((t, i) => {
      const inp = ctx.inputs[i] || '';
      if (!inp && i >= ctx.words.length - 1) return '';
      let h = '';
      for (let j = 0; j < Math.max(t.length, inp.length); j++) {
        if (j < t.length && j < inp.length) h += `<span class="l ${inp[j] === t[j] ? 'c' : 'x'}">${U.esc(t[j])}</span>`;
        else if (j >= t.length) h += `<span class="l e">${U.esc(inp[j])}</span>`;
        else h += `<span class="l">${U.esc(t[j])}</span>`;
      }
      const burst = ctx.bursts[i] || 0;
      const lvl = burst <= qs[0] ? 0 : burst <= qs[1] ? 1 : burst <= qs[2] ? 2 : burst <= qs[3] ? 3 : 4;
      const err = inp !== t && !(LT.Test.zen);
      return `<span class="wh-w ${err ? 'err' : ''} ${heat ? 'h' + lvl : ''}">${h}<span class="wh-in">${err ? U.esc(inp || '(skipped)') + ' · ' : ''}${burst} wpm</span></span>`;
    }).join('');
  };

  const panel = id => `<div class="r-panel" id="${id}"><div><div class="r-panel-in"></div></div></div>`;

  R.show = async (r, ctx, { invalid = false } = {}) => {
    R.r = r; R.ctx = ctx; R.justFinished = true;
    let isPb = false, prev = null, award = null;
    if (!invalid) {
      prev = DB.pbEligible(r) ? DB.pbFor(r) : null;
      isPb = DB.addResult(r);
      DB.addKeys(ctx.keyMap);
      award = LT.Progress.award(r, { pace: ctx.pace });
    }
    const test = U.$('#test'), cfg = U.$('#config'), el = U.$('#result');
    test.style.transition = `opacity ${U.ms(160)}ms var(--ease)`;
    cfg.style.transition = `opacity ${U.ms(160)}ms var(--ease)`;
    test.style.opacity = '0'; cfg.style.opacity = '0';
    LT.Test.input().blur();
    await U.wait(U.ms(170));
    test.hidden = true; cfg.classList.add('off');
    const pbDelta = prev && !r.failed ? r.wpm - prev.wpm : null;
    const firstPb = !invalid && !prev && DB.pbEligible(r);
    const tags = [r.punct && 'punctuation', r.nums && 'numbers', r.diff !== 'normal' && r.diff, ...r.mods.map(m => LT.MODS[m].name)].filter(Boolean);
    const [c, x, e, m] = r.chars;
    const showPb = isPb && !invalid && DB.pbEligible(r);
    const qr = S.get('quickRestart');
    const nextTip = qr === 'tab' ? ' data-tip="tab"' : qr === 'esc' || qr === 'enter' ? ` data-tip="${qr}"` : '';
    el.innerHTML = `<div class="r-in ${r.failed ? 'failed' : ''}">
      <div class="r-top" style="--i:0">
        <div class="r-big">
          <div><div class="r-k big">wpm ${showPb ? `<span class="r-pb">${U.icon('crown')}new pb</span>` : ''}</div><div class="r-v" id="rWpm">0</div></div>
          <div><div class="r-k big">accuracy</div><div class="r-v" id="rAcc">0%</div></div>
        </div>
        <div class="r-chart-card"><div class="r-chart" id="rChart"></div></div>
      </div>
      ${r.failed ? `<div class="r-fail" style="--i:1">${U.icon('alert')}test failed · ${U.esc(r.reason)}</div>` : ''}
      ${invalid ? `<div class="r-fail" style="--i:1">${U.icon('alert')}test too short or mostly inactive, not saved</div>` : ''}
      <div class="r-row" style="--i:1">
        ${stat('mode', modeLabel(r), tags.join(' · '))}
        ${stat('raw', fmt(r.raw), '', 'all keystrokes per minute, mistakes included')}
        ${stat('letters', `${c}/${x}/${e}/${m}`, '', 'correct / incorrect / extra / missed')}
        ${stat('consistency', Math.round(r.cons) + '%', '', 'how even your speed was from second to second')}
        ${stat('time', U.fmtDur(r.time), r.time >= 60 ? U.round(r.time, 1) + 's' : '')}
        ${pbDelta != null ? stat('vs pb', (pbDelta >= 0 ? '+' : '') + fmt(pbDelta), 'pb ' + fmt(prev.wpm)) : firstPb ? stat('vs pb', '–', 'first test with these settings', 'personal bests are kept separately for each mode, length, word pack, punctuation and numbers') : ''}
        ${ctx.pace > 0 ? stat('vs ghost', (r.wpm - ctx.pace >= 0 ? '+' : '') + fmt(r.wpm - ctx.pace), 'ghost ' + Math.round(ctx.pace)) : ''}
      </div>
      ${award ? `<div class="r-xp" style="--i:2"><span class="xp-lvl" id="rLvl">level ${award.before.lvl} · ${LT.Progress.rank(award.before.lvl)}</span><div class="xp-bar"><i class="prev"></i><i class="cur"></i></div><span class="xp-gain" id="rXp">+0 xp</span></div>` : ''}
      <div class="r-actions" style="--i:3">
        <button class="act-btn primary" data-act="next"${nextTip}>${U.icon('next')}<span>next test</span></button>
        <button class="act-btn" data-act="repeat"${qr === 'tab' ? ' data-tip="shift + tab"' : ''}>${U.icon('repeat')}<span>repeat</span></button>
        <button class="act-btn" data-act="missed" ${ctx.missed.length ? '' : 'disabled'}>${U.icon('alert')}<span>missed words</span></button>
        <button class="act-btn" data-act="weak">${U.icon('target')}<span>weak keys</span></button>
        <button class="act-btn" data-act="words">${U.icon('list')}<span>words</span></button>
        <button class="act-btn" data-act="replay">${U.icon('play')}<span>replay</span></button>
        <button class="act-btn" data-act="share">${U.icon('image')}<span>share</span></button>
      </div>
      ${panel('rpWords')}
      ${panel('rpReplay')}
    </div>`;
    el.hidden = false;
    R.open = true;
    R.shownAt = performance.now();
    const dec = S.get('wpmDecimals') ? 2 : 0;
    setTimeout(() => {
      FX.countUp(U.$('#rWpm'), r.wpm, { dec, dur: 800 });
      FX.countUp(U.$('#rAcc'), r.acc, { dec, dur: 800, suffix: '%' });
    }, U.ms(80));
    const ch = r.chart;
    const xs = ch.raw.map((_, i) => (i === ch.raw.length - 1 ? U.round(r.time, 1) : i + 1));
    chart = new LT.Chart(U.$('#rChart'), {
      label: 'speed during the test',
      series: [{ data: ch.wpm, color: 'main', width: 2.6, fill: true }, { data: ch.raw, color: 'sub', width: 1.6, alpha: .9 }],
      errors: ch.err, xs, xFmt: v => v,
      tip: i => `<div class="tt-h">${xs[i]}s</div><div><span class="sw" style="background:var(--main)"></span>wpm <b>${Math.round(ch.wpm[i])}</b></div><div><span class="sw" style="background:var(--sub)"></span>raw <b>${Math.round(ch.raw[i])}</b></div>${ch.err[i] ? `<div><span class="sw" style="background:var(--error)"></span>errors <b>${ch.err[i]}</b></div>` : ''}`
    });
    if (award) animateXp(award);
    if (showPb) setTimeout(() => {
      const t = U.$('.r-pb');
      if (t) { const b = t.getBoundingClientRect(); FX.burst(b.left + b.width / 2, b.top + b.height / 2, { n: 30, spread: 90 }); }
    }, U.ms(700));
    if (award && S.get('badgePopups')) award.fresh.forEach((b, i) => setTimeout(() => FX.badgePop(b), 900 + i * 300));
    el.querySelector('.r-actions').addEventListener('click', onAction);
  };

  const animateXp = a => {
    const prev = U.$('.r-xp .prev'), cur = U.$('.r-xp .cur'), lvl = U.$('#rLvl');
    prev.style.transform = `scaleX(${a.before.pct})`;
    cur.style.transition = 'none';
    cur.style.transform = `scaleX(${a.before.pct})`;
    setTimeout(() => FX.countUp(U.$('#rXp'), a.gain, { dur: 900, suffix: ' xp', from: 0 }), U.ms(250));
    setTimeout(() => { const g = U.$('#rXp'); if (g) g.textContent = '+' + g.textContent; }, U.ms(250) + U.ms(900) + 30);
    U.raf2(() => {
      cur.style.transition = '';
      if (a.after.lvl > a.before.lvl) {
        cur.style.transform = 'scaleX(1)';
        setTimeout(() => {
          if (!lvl.isConnected) return;
          prev.style.transform = 'scaleX(0)';
          cur.style.transition = 'none'; cur.style.transform = 'scaleX(0)';
          lvl.textContent = `level ${a.after.lvl} · ${LT.Progress.rank(a.after.lvl)}`;
          U.raf2(() => { cur.style.transition = ''; cur.style.transform = `scaleX(${a.after.pct})`; });
          const b = lvl.getBoundingClientRect();
          FX.burst(b.left + 30, b.top + b.height / 2, { n: 24, spread: 80 });
          FX.toast(`${LT.Progress.rank(a.after.lvl)}`, { title: `level ${a.after.lvl}`, icon: 'award' });
        }, U.ms(1000) + 60);
      } else cur.style.transform = `scaleX(${a.after.pct})`;
    });
  };

  const togglePanel = (id, build) => {
    const p = U.$('#' + id);
    const open = !p.classList.contains('open');
    U.$$('.r-panel').forEach(x => { if (x !== p) x.classList.remove('open'); });
    U.$$('.r-actions .act-btn').forEach(b => b.classList.remove('on'));
    if (open) { build(p.querySelector('.r-panel-in')); p.classList.add('open'); }
    else p.classList.remove('open');
    if (id === 'rpReplay' && !open) LT.Replay.stop();
    return open;
  };

  const onAction = e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'next') LT.Test.restart();
    else if (a === 'repeat') LT.Test.repeat();
    else if (a === 'missed') LT.Test.practiceMissed();
    else if (a === 'weak') LT.Test.practiceWeak();
    else if (a === 'share') LT.Share.open(R.r, R.ctx);
    else if (a === 'words') {
      const on = togglePanel('rpWords', box => {
        const heat = U.store.get('whHeat', false);
        box.innerHTML = `<div class="r-panel-head"><div class="h-sec">${U.icon('list')}words history</div><div class="seg"><button data-h="0" class="${heat ? '' : 'active'}">errors</button><button data-h="1" class="${heat ? 'active' : ''}">speed heatmap</button></div></div><div class="wh ${heat ? 'heat' : ''}">${wordsHistory(R.ctx, heat)}</div>`;
        box.querySelector('.seg').addEventListener('click', ev => {
          const h = ev.target.closest('[data-h]');
          if (!h) return;
          const on2 = h.dataset.h === '1';
          U.store.set('whHeat', on2);
          box.querySelectorAll('.seg button').forEach(x => x.classList.toggle('active', x === h));
          const wh = box.querySelector('.wh');
          wh.classList.toggle('heat', on2);
          wh.innerHTML = wordsHistory(R.ctx, on2);
        });
      });
      b.classList.toggle('on', on);
    } else if (a === 'replay') {
      const on = togglePanel('rpReplay', box => LT.Replay.mount(box, R.r, R.ctx));
      b.classList.toggle('on', on);
    }
  };

  R.close = () => new Promise(res => {
    const el = U.$('#result'), test = U.$('#test'), cfg = U.$('#config');
    LT.Replay.stop();
    el.style.transition = `opacity ${U.ms(150)}ms var(--ease)`;
    el.style.opacity = '0';
    setTimeout(() => {
      if (chart) { chart.destroy(); chart = null; }
      el.hidden = true; el.innerHTML = ''; el.style.opacity = ''; el.style.transition = '';
      R.open = false;
      test.hidden = false; cfg.classList.remove('off');
      test.style.opacity = '0'; cfg.style.opacity = '0';
      U.raf2(() => {
        test.style.transition = `opacity ${U.ms(220)}ms var(--ease)`;
        cfg.style.transition = `opacity ${U.ms(220)}ms var(--ease)`;
        test.style.opacity = ''; cfg.style.opacity = '';
        setTimeout(() => { test.style.transition = ''; cfg.style.transition = ''; }, U.ms(240));
      });
      res();
    }, U.ms(160));
  });

  LT.Results = R;
})();
