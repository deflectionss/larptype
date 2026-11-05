(() => {
  const U = LT.U, S = LT.S;
  const Gen = {};

  const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
  const randomCase = (w, r) => [...w].map(c => (r() < .5 ? c.toUpperCase() : c.toLowerCase())).join('');
  const number = r => {
    const len = 1 + Math.floor(r() * (r() < .7 ? 3 : 5));
    let s = String(1 + Math.floor(r() * 9));
    for (let i = 1; i < len; i++) s += Math.floor(r() * 10);
    return s;
  };

  Gen.create = ({ pack, punctuation, numbers, seed, randomcase, source }) => {
    const r = U.rng(seed);
    const p = LT.PACKS[pack] || LT.PACKS.roblox;
    const list = source && source.length ? source : p.words;
    const code = !!p.code && !source;
    const recent = [];
    let idx = 0, prevEnd = '.', paren = false;

    const raw = () => {
      if (numbers && !code && r() < .1) return number(r);
      let w, guard = 0;
      do { w = list[Math.floor(r() * list.length)]; } while (recent.includes(w) && guard++ < 12 && list.length > 6);
      recent.push(w);
      if (recent.length > Math.min(5, list.length - 1)) recent.shift();
      return w;
    };

    const punct = w => {
      if (code) return w;
      if (/[.!?]$/.test(prevEnd) || idx === 0) w = cap(w);
      const x = r();
      if (paren && x < .35) { w += ')'; paren = false; }
      else if (x < .12) w += ',';
      else if (x < .2) w += '.';
      else if (x < .23) w += '?';
      else if (x < .25) w += '!';
      else if (x < .27) w += ':';
      else if (x < .285) w += ';';
      else if (x < .31 && !paren) { w = '(' + w; paren = true; }
      else if (x < .34) w = `"${w}"`;
      else if (x < .355) w = `'${w}'`;
      else if (x < .37 && w.length > 2) w = w + "'s";
      return w;
    };

    return {
      next() {
        let w = raw();
        if (punctuation) {
          if (!code && r() < .025 && idx > 0) w = '-';
          else w = punct(w);
        }
        if (randomcase) w = randomCase(w, r);
        prevEnd = w;
        idx++;
        return w;
      },
      take(n) { const out = []; for (let i = 0; i < n; i++) out.push(this.next()); return out; },
      finish(words) {
        if (!punctuation || code || !words.length) return words;
        const last = words.length - 1;
        if (paren) words[last] = words[last].replace(/[,;:]$/, '') + ')';
        if (!/[.!?)"']$/.test(words[last])) words[last] = words[last].replace(/[,;:]$/, '') + '.';
        return words;
      }
    };
  };

  Gen.quote = (lengthFilter, { excludeId, seed } = {}) => {
    const set = [...LT.QUOTES.text, ...LT.QUOTES.code];
    let pool = lengthFilter === 'all' ? set : set.filter(q => q.len === lengthFilter);
    if (!pool.length) pool = set;
    if (pool.length > 1 && excludeId) pool = pool.filter(q => q.id !== excludeId);
    const r = seed != null ? U.rng(seed) : Math.random;
    return U.pick(pool, r);
  };

  Gen.custom = () => {
    let words = S.get('customText').trim().split(/\s+/).filter(Boolean);
    if (!words.length) words = ['empty'];
    if (S.get('customShuffle')) words = U.shuffle(words);
    const lim = S.get('customLimit');
    if (lim > 0) {
      const out = [];
      while (out.length < lim) out.push(...(S.get('customShuffle') ? U.shuffle(words) : words));
      words = out.slice(0, lim);
    }
    return words;
  };

  Gen.weakKeys = (top = 6, minSamples = 12) => {
    const keys = LT.DB.keys, rows = [];
    const lat = [];
    Object.keys(keys).forEach(ch => { const k = keys[ch]; if (k[3] > 4) lat.push(k[2] / k[3]); });
    const med = U.median(lat) || 1;
    Object.keys(keys).forEach(ch => {
      if (!/^[a-z]$/.test(ch)) return;
      const [h, m, tl, tn] = keys[ch];
      const n = h + m;
      if (n < minSamples) return;
      const err = m / n, slow = tn > 4 ? (tl / tn) / med : 1;
      rows.push({ ch, err, slow, n, score: err * 4 + Math.max(0, slow - 1) * 1.2 });
    });
    rows.sort((a, b) => b.score - a.score);
    return rows.slice(0, top).filter(r => r.score > .02);
  };

  Gen.weakWords = (letters, count = 50) => {
    const all = LT.PACKS.roblox.words.filter(w => /^[a-z]+$/.test(w));
    const set = new Set(letters);
    const scored = all.map(w => {
      let s = 0;
      for (const c of w) if (set.has(c)) s++;
      return { w, s: s / Math.sqrt(w.length) };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    const pool = scored.slice(0, Math.max(40, Math.floor(scored.length * .3))).map(x => x.w);
    if (!pool.length) return null;
    const out = [];
    while (out.length < count) {
      const w = U.pick(pool);
      if (out[out.length - 1] !== w) out.push(w);
    }
    return out;
  };

  Gen.missed = (missed, count) => {
    const base = [...new Set(missed)];
    if (!base.length) return null;
    const out = [];
    const reps = Math.max(2, Math.ceil(Math.max(count || 0, 20) / base.length));
    for (let i = 0; i < reps; i++) out.push(...U.shuffle(base));
    return out.slice(0, Math.max(base.length * 2, Math.min(out.length, 60)));
  };

  LT.Gen = Gen;
})();
