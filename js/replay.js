(() => {
  const U = LT.U, FX = LT.FX, S = LT.S;
  const Rp = {};
  let stopFn = null;

  Rp.stop = () => { if (stopFn) stopFn(); stopFn = null; };

  Rp.mount = (box, r, ctx) => {
    Rp.stop();
    const words = ctx.words, log = ctx.log;
    box.innerHTML = `<div class="r-panel-head"><div class="h-sec">${U.icon('play')}replay</div><span class="muted" style="font-size:.72rem">${log.length} events · ${U.fmtDur(r.time)}</span></div>
      <div class="rp-words"><div class="rp-inner" style="display:flex;flex-wrap:wrap;position:relative;will-change:transform;transition:transform ${U.ms(250)}ms var(--ease)"></div></div>
      <div class="rp-bar"><button class="icon-btn rp-play" aria-label="play or pause" style="width:36px;height:36px"></button><div class="rp-prog"><i></i></div>
      <div class="rp-speed"><button data-s=".5">0.5x</button><button data-s="1" class="active">1x</button><button data-s="2">2x</button><button data-s="4">4x</button></div><span class="rp-wpm">0 wpm</span></div>`;
    const inner = box.querySelector('.rp-inner'), playBtn = box.querySelector('.rp-play'), bar = box.querySelector('.rp-prog i'), wpmEl = box.querySelector('.rp-wpm');
    const caret = U.el('div', 'rp-caret');
    const inputs = [], total = log.length ? log[log.length - 1][0] + 400 : 1000;
    let wi = 0, idx = 0, t = 0, speed = 1, playing = false, kill = null;

    const lettersOf = i => {
      const tg = words[i] || '', inp = inputs[i] || '';
      let h = '';
      for (let j = 0; j < Math.max(tg.length, inp.length); j++) {
        if (j < tg.length && j < inp.length) h += `<span class="l ${inp[j] === tg[j] ? 'c' : 'x'}">${U.esc(tg[j])}</span>`;
        else if (j >= tg.length) h += `<span class="l e">${U.esc(inp[j])}</span>`;
        else h += `<span class="l">${U.esc(tg[j])}</span>`;
      }
      return h;
    };
    const build = () => {
      inner.innerHTML = words.map((_, i) => `<div class="word">${lettersOf(i)}</div>`).join('');
      inner.appendChild(caret);
    };
    const place = () => {
      const w = inner.children[wi];
      if (!w || !w.classList.contains('word')) return;
      const n = (inputs[wi] || '').length, ls = w.children;
      let x;
      if (n < ls.length) x = w.offsetLeft + ls[n].offsetLeft;
      else if (ls.length) { const l = ls[ls.length - 1]; x = w.offsetLeft + l.offsetLeft + l.offsetWidth; }
      else x = w.offsetLeft;
      const lh = w.offsetHeight;
      caret.style.transform = `translate(${x}px, ${w.offsetTop + lh * .12}px)`;
      const line = Math.round(w.offsetTop / lh);
      inner.style.transform = `translateY(${-Math.max(0, line - 1) * lh}px)`;
    };
    const correct = () => {
      let n = 0;
      for (let i = 0; i < wi; i++) if ((inputs[i] || '') === words[i]) n += words[i].length + 1;
      const cur = inputs[wi] || '';
      if ((words[wi] || '').startsWith(cur)) n += cur.length;
      return n;
    };
    const applyTo = target => {
      while (idx < log.length && log[idx][0] <= target) {
        const [, w, inp] = log[idx++];
        const prev = wi;
        inputs[w] = inp; wi = w;
        const el = inner.children[w];
        if (el) el.innerHTML = lettersOf(w);
        if (prev !== w && inner.children[prev]) inner.children[prev].innerHTML = lettersOf(prev);
      }
    };
    const ui = () => {
      bar.style.transform = `scaleX(${U.clamp(t / total, 0, 1)})`;
      wpmEl.textContent = (t > 300 ? Math.round((correct() / 5) / (t / 60000)) : 0) + ' wpm';
      playBtn.innerHTML = U.icon(playing ? 'pause' : 'play');
    };
    const reset = () => { inputs.length = 0; wi = 0; idx = 0; t = 0; build(); place(); ui(); };
    const play = () => {
      if (t >= total) reset();
      playing = true; ui();
      kill = FX.animate(dt => {
        if (!playing) return false;
        t += dt * 1000 * speed;
        applyTo(t);
        place(); ui();
        if (t >= total) { playing = false; ui(); return false; }
      });
    };
    const pause = () => { playing = false; if (kill) kill(); ui(); };
    const seek = p => {
      pause(); reset();
      t = p * total; applyTo(t); place(); ui();
    };
    playBtn.addEventListener('click', () => (playing ? pause() : play()));
    box.querySelector('.rp-speed').addEventListener('click', e => {
      const b = e.target.closest('[data-s]');
      if (!b) return;
      speed = parseFloat(b.dataset.s);
      box.querySelectorAll('.rp-speed button').forEach(x => x.classList.toggle('active', x === b));
    });
    box.querySelector('.rp-prog').addEventListener('pointerdown', e => {
      const rc = e.currentTarget.getBoundingClientRect();
      seek(U.clamp((e.clientX - rc.left) / rc.width, 0, 1));
    });
    reset();
    setTimeout(play, U.ms(350));
    stopFn = pause;
  };

  const Share = {};
  const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
  Share.draw = (r, ctx) => {
    const W = 1200, H = 630, cv = U.el('canvas'), c = cv.getContext('2d'), th = LT.Theme.colors();
    cv.width = W; cv.height = H;
    const fam = getComputedStyle(document.body).fontFamily;
    c.fillStyle = th.bg; c.fillRect(0, 0, W, H);
    c.fillStyle = th.sub; c.globalAlpha = .12;
    for (let x = 30; x < W; x += 40) for (let y = 30; y < H; y += 40) { c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
    rr(c, 40, 40, W - 80, H - 80, 28); c.fillStyle = th.subAlt; c.fill();
    c.save(); c.translate(104, 108); c.rotate(-12 * Math.PI / 180);
    rr(c, -24, -24, 48, 48, 14); c.fillStyle = th.main; c.fill();
    c.strokeStyle = th.bg; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-10, -8); c.lineTo(0, 0); c.lineTo(-10, 8); c.stroke();
    c.beginPath(); c.moveTo(4, 10); c.lineTo(12, 10); c.stroke();
    c.restore();
    c.textBaseline = 'alphabetic';
    c.font = `900 40px ${fam}`; c.fillStyle = th.text; c.fillText('larptype', 144, 122);
    const info = LT.Progress.levelInfo(LT.DB.profile.xp), name = S.get('name');
    const day = new Date(r.ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    c.textAlign = 'right';
    if (name) {
      c.font = `800 30px ${fam}`; c.fillStyle = th.text; c.fillText(name, W - 90, 106);
      c.font = `500 20px ${fam}`; c.fillStyle = th.sub; c.fillText(`level ${info.lvl} · ${LT.Progress.rank(info.lvl)} · ${day}`, W - 90, 138);
    } else {
      c.font = `500 22px ${fam}`; c.fillStyle = th.sub;
      c.fillText(`level ${info.lvl} · ${LT.Progress.rank(info.lvl)}`, W - 90, 104);
      c.fillText(day, W - 90, 136);
    }
    c.textAlign = 'left';
    c.fillStyle = th.sub; c.font = `500 30px ${fam}`; c.fillText('wpm', 90, 230);
    c.fillStyle = th.main; c.font = `900 150px ${fam}`; c.fillText(String(Math.round(r.wpm)), 84, 370);
    c.fillStyle = th.sub; c.font = `500 30px ${fam}`; c.fillText('acc', 90, 440);
    c.fillStyle = th.main; c.font = `600 64px ${fam}`; c.fillText(Math.round(r.acc) + '%', 88, 510);
    const sx = 470;
    const items = [['test', LT.Results.modeLabel(r)], ['raw', Math.round(r.raw)], ['consistency', Math.round(r.cons) + '%'], ['time', U.fmtDur(r.time)]];
    const cols = [0, 210, 340, 520];
    items.forEach(([k, v], i) => {
      const x = sx + cols[i];
      c.fillStyle = th.sub; c.font = `500 20px ${fam}`; c.fillText(k, x, 430);
      c.fillStyle = th.text; c.font = `600 34px ${fam}`; c.fillText(String(v), x, 476);
    });
    const tags = [r.lang === 'simple' && 'simple', r.punct && 'punctuation', r.nums && 'numbers', ...r.mods.map(m => LT.MODS[m].name)].filter(Boolean).join('  ·  ');
    c.fillStyle = th.sub; c.font = `500 20px ${fam}`; c.fillText(tags, sx, 530);
    const data = r.chart.wpm, raw = r.chart.raw;
    if (data.length > 1) {
      const x0 = sx, y0 = 200, w = W - 90 - sx, h = 160, mx = Math.max(10, ...data, ...raw) * 1.1;
      const P = (v, i) => [x0 + (i / (data.length - 1)) * w, y0 + h - (v / mx) * h];
      const line = (arr, col, lw2, fillIt) => {
        c.beginPath();
        arr.forEach((v, i) => { const [x, y] = P(v, i); i ? c.lineTo(x, y) : c.moveTo(x, y); });
        if (fillIt) {
          c.lineTo(x0 + w, y0 + h); c.lineTo(x0, y0 + h); c.closePath();
          const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00');
          c.fillStyle = g; c.fill();
          return;
        }
        c.strokeStyle = col; c.lineWidth = lw2; c.lineJoin = 'round'; c.stroke();
      };
      line(raw, th.sub, 3);
      line(data, th.main, 0, true);
      line(data, th.main, 5);
    }
    return cv;
  };
  Share.open = (r, ctx) => {
    const cv = Share.draw(r, ctx);
    const url = cv.toDataURL('image/png');
    const text = `larptype · ${LT.Results.modeLabel(r)} · ${Math.round(r.wpm)} wpm · ${Math.round(r.acc)}% acc · ${Math.round(r.cons)}% consistency`;
    FX.modal({
      title: 'share card', wide: true,
      body: `<img class="share-img" src="${url}" alt="result card">`,
      actions: [
        { label: 'copy text', icon: 'copy', cls: 'ghost', run: () => { U.copy(text).then(ok => FX.toast(ok ? 'Result copied as text.' : 'Copy failed.', { icon: 'copy' })); return false; } },
        { label: 'copy image', icon: 'copy', run: () => {
          if (!window.ClipboardItem) { FX.toast('Your browser cannot copy images. Use save instead.', { icon: 'alert', type: 'err' }); return false; }
          cv.toBlob(b => navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]).then(() => FX.toast('Image copied.', { icon: 'check' }), () => FX.toast('Copy failed.', { icon: 'alert', type: 'err' })));
          return false;
        } },
        { label: 'save png', icon: 'download', cls: 'primary', run: () => { U.download(`larptype-${Math.round(r.wpm)}wpm.png`, url); return false; } }
      ]
    });
  };

  LT.Replay = Rp;
  LT.Share = Share;
})();
