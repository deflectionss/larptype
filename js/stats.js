(() => {
  const U = LT.U, S = LT.S, DB = LT.DB, P = LT.Progress;
  const St = {};
  let page, chart = null, range = 100, kbMode = 'accuracy';
  const LAYOUTS = { qwerty: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'], azerty: ['azertyuiop', 'qsdfghjklm', 'wxcvbn'], qwertz: ['qwertzuiop', 'asdfghjkl', 'yxcvbnm'] };

  const pbCell = (mode, m2) => {
    let best = null;
    Object.keys(DB.pbs).forEach(k => {
      const [md, v, lang, p, n] = k.split('|');
      if (md !== mode || v !== String(m2)) return;
      const e = DB.pbs[k];
      if (!best || e.wpm > best.wpm) best = Object.assign({ lang, p: p === '1', n: n === '1' }, e);
    });
    if (!best) return `<div class="pb-cell none"><div class="k">${mode === 'time' ? m2 + 's' : m2 + ' words'}</div><div class="v">-</div><div class="s">no pb yet</div></div>`;
    const tags = [best.p ? '@' : '', best.n ? '#' : ''].filter(Boolean).join(' ');
    return `<div class="pb-cell" data-tip="${U.esc(U.fmtDate(best.ts))} · raw ${Math.round(best.raw)} · ${Math.round(best.cons)}% consistency"><div class="k">${mode === 'time' ? m2 + 's' : m2 + ' words'}</div><div class="v">${Math.round(best.wpm)}</div><div class="s">${Math.round(best.acc)}% acc${tags ? ' · ' + U.esc(tags) : ''}</div></div>`;
  };

  const heat = () => {
    const keys = DB.keys, layout = U.store.get('kbLayout', 'qwerty');
    const lat = [], errs = [];
    Object.keys(keys).forEach(ch => { const k = keys[ch]; if (k[3] > 4) lat.push(k[2] / k[3]); if (k[0] + k[1] > 8) errs.push(k[1] / (k[0] + k[1])); });
    const med = U.median(lat) || 1, maxE = Math.max(.02, ...errs);
    const rows = LAYOUTS[layout].map(r => `<div class="kb-row">${[...r].map(ch => {
      const k = keys[ch];
      if (!k || k[0] + k[1] < 5) return `<div class="kb-key none" data-tip="${ch} · not enough data">${ch}</div>`;
      const n = k[0] + k[1], e = k[1] / n, l = k[3] ? k[2] / k[3] : med;
      let bg;
      if (kbMode === 'accuracy') bg = `color-mix(in srgb, var(--error) ${Math.round((e / maxE) * 80)}%, var(--bg))`;
      else {
        const t = U.clamp(l / med - 1, -.5, .8);
        bg = t > 0 ? `color-mix(in srgb, var(--error) ${Math.round((t / .8) * 80)}%, var(--bg))` : `color-mix(in srgb, var(--main) ${Math.round((-t / .5) * 60)}%, var(--bg))`;
      }
      return `<div class="kb-key" style="background:${bg}" data-tip="${ch} · ${U.round((1 - e) * 100, 1)}% acc · ${Math.round(l)}ms · ${U.fmtNum(n)} presses">${ch}</div>`;
    }).join('')}</div>`).join('');
    const weak = LT.Gen.weakKeys();
    return `<div class="st-head"><div class="h-sec">${U.icon('keyboard')}key heatmap</div><div style="display:flex;gap:8px"><div class="seg" data-seg="kbMode">${['accuracy', 'speed'].map(m => `<button class="${kbMode === m ? 'active' : ''}" data-v="${m}">${m}</button>`).join('')}</div><div class="seg" data-seg="kbLayout">${Object.keys(LAYOUTS).map(m => `<button class="${layout === m ? 'active' : ''}" data-v="${m}">${m}</button>`).join('')}</div></div></div>
      <div class="kb">${rows}</div>
      <div class="kb-legend">${kbMode === 'accuracy' ? 'accurate' : 'fast'}<span class="kb-grad"></span>${kbMode === 'accuracy' ? 'error-prone' : 'slow'}</div>
      <div class="st-head" style="margin-top:20px;margin-bottom:8px"><div class="h-sec">${U.icon('target')}weakest keys</div><button class="btn primary" id="stWeak" ${weak.length < 2 ? 'disabled' : ''}>${U.icon('target')}practice weak keys</button></div>
      ${weak.length ? `<div class="weak-list">${weak.map(w => `<span class="weak-key"><b>${w.ch}</b>${U.round((1 - w.err) * 100, 1)}% · ${w.slow > 1 ? '+' : ''}${Math.round((w.slow - 1) * 100)}% time</span>`).join('')}</div>` : `<div class="muted" style="font-size:.78rem">Type a few tests and your weakest keys show up here.</div>`}`;
  };

  const historyRows = n => DB.results.slice(-n).reverse().map(r => `<tr><td>${U.esc(U.fmtDate(r.ts))}</td><td>${U.esc(LT.Results.modeLabel(r))}</td><td class="${r.failed ? 'fail' : 'pbm'}">${Math.round(r.wpm)}</td><td>${Math.round(r.raw)}</td><td>${Math.round(r.acc)}%</td><td>${Math.round(r.cons)}%</td><td>${r.chars.join('/')}</td><td>${r.failed ? 'failed' : r.mods.map(m => LT.MODS[m].name).join(', ')}</td></tr>`).join('');

  St.show = () => {
    page = U.$('#page-stats');
    if (chart) { chart.destroy(); chart = null; }
    const pr = DB.profile, info = P.levelInfo(pr.xp), ok = DB.results.filter(r => !r.failed);
    const last10 = ok.slice(-10), best = ok.length ? Math.max(...ok.map(r => r.wpm)) : 0;
    const earned = Object.keys(pr.badges).length;
    page.innerHTML = `<div class="st-wrap">
      <div class="card prof"><div class="prof-av"><b>${info.lvl}</b></div>
        <div class="prof-mid"><h2>${U.esc(P.rank(info.lvl))}</h2><div class="muted">level ${info.lvl} · ${U.fmtNum(info.into)} / ${U.fmtNum(info.need)} xp to next · ${U.fmtNum(pr.xp)} xp total</div><div class="xp-bar"><i style="transform:scaleX(${info.pct})"></i></div></div>
        <div class="prof-tot">
          <div class="tot"><div class="k">tests completed</div><div class="v">${U.fmtNum(pr.completed)}</div></div>
          <div class="tot"><div class="k">tests started</div><div class="v">${U.fmtNum(pr.started)}</div></div>
          <div class="tot"><div class="k">time typing</div><div class="v">${U.fmtDur(pr.time)}</div></div>
          <div class="tot"><div class="k">best wpm</div><div class="v">${Math.round(best)}</div></div>
          <div class="tot"><div class="k">avg last 10</div><div class="v">${last10.length ? Math.round(U.mean(last10.map(r => r.wpm))) : 0}</div></div>
          <div class="tot"><div class="k">badges</div><div class="v">${earned}/${P.BADGES.length}</div></div>
        </div></div>
      <div class="card"><div class="st-head"><div class="h-sec">${U.icon('crown')}personal bests</div><span class="muted" style="font-size:.72rem">@ punctuation · # numbers</span></div>
        <div class="st-grid2"><div class="pb-table">${[15, 30, 60, 120].map(v => pbCell('time', v)).join('')}</div><div class="pb-table">${[10, 25, 50, 100].map(v => pbCell('words', v)).join('')}</div></div></div>
      <div class="card"><div class="st-head"><div class="h-sec">${U.icon('chart')}progress</div><div class="seg" data-seg="range">${[[50, 'last 50'], [100, 'last 100'], [100000, 'all']].map(([v, l]) => `<button class="${range === v ? 'active' : ''}" data-v="${v}">${l}</button>`).join('')}</div></div>
        ${ok.length > 1 ? '<div class="st-chart" id="stChart"></div>' : `<div class="empty-state">Finish a couple of tests to see your progress chart.</div>`}</div>
      <div class="card">${heat()}</div>
      <div class="card"><div class="st-head"><div class="h-sec">${U.icon('award')}badges · ${earned}/${P.BADGES.length}</div></div><div class="badge-grid">${P.BADGES.map(b => {
        const got = pr.badges[b.id];
        return `<div class="badge ${got ? '' : 'locked'}" ${got ? `data-tip="earned ${U.esc(U.fmtDate(got))}"` : ''}><div class="badge-ico tier-${b.tier}">${U.icon(got ? b.icon : 'lock')}</div><div><b>${U.esc(b.name)}</b><span>${U.esc(b.desc)}</span></div></div>`;
      }).join('')}</div></div>
      <div class="card"><div class="st-head"><div class="h-sec">${U.icon('list')}recent tests</div><span class="muted" style="font-size:.72rem">${DB.results.length} saved</span></div>
        ${DB.results.length ? `<div style="overflow-x:auto"><table class="hist"><thead><tr><th>date</th><th>test</th><th>wpm</th><th>raw</th><th>acc</th><th>cons</th><th>chars</th><th>mods</th></tr></thead><tbody id="histBody">${historyRows(25)}</tbody></table></div>${DB.results.length > 25 ? '<div style="text-align:center;margin-top:12px"><button class="btn ghost" id="histMore">show more</button></div>' : ''}` : `<div class="empty-state">No tests yet. Press tab and start typing.</div>`}</div>
    </div>`;
    if (ok.length > 1) {
      const data = ok, w = data.map(r => r.wpm), nums = [];
      DB.results.forEach((r, i) => { if (!r.failed) nums.push(i + 1); });
      const avg = w.map((_, i) => U.mean(w.slice(Math.max(0, i - 9), i + 1)));
      chart = new LT.Chart(U.$('#stChart'), {
        series: [{ data: w, color: 'main', points: true, noLine: true, pointR: 3 }, { data: avg, color: 'text', width: 2, alpha: .7 }],
        xFmt: v => v, xs: nums, window: range, label: 'wpm per test',
        tip: i => `<div class="tt-h">${U.esc(U.fmtDate(data[i].ts))}</div><div>${U.esc(LT.Results.modeLabel(data[i]))}</div><div>wpm <b>${Math.round(data[i].wpm)}</b> · acc <b>${Math.round(data[i].acc)}%</b></div><div>10-test avg <b>${Math.round(avg[i])}</b></div>`
      });
    }
    U.hydrateIcons(page);
  };

  St.init = () => {
    page = U.$('#page-stats');
    page.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const seg = b.closest('[data-seg]');
      if (seg) {
        const k = seg.dataset.seg, v = b.dataset.v;
        if (k === 'range') {
          range = Number(v);
          seg.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
          if (chart) chart.setWindow(range);
          return;
        }
        if (k === 'kbMode') kbMode = v;
        if (k === 'kbLayout') U.store.set('kbLayout', v);
        const y = scrollY;
        St.show();
        scrollTo(0, y);
        return;
      }
      if (b.id === 'stWeak') LT.Test.practiceWeak();
      if (b.id === 'histMore') { U.$('#histBody').innerHTML = historyRows(DB.results.length); b.remove(); }
    });
  };
  St.leave = () => { if (chart) { chart.destroy(); chart = null; } };

  LT.Stats = St;
})();
