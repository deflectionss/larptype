(() => {
  const U = LT.U, DB = LT.DB;
  const P = {};
  const RANKS = [[1, 'Guest'], [3, 'Newcomer'], [5, 'Builder'], [8, 'Scripter'], [12, 'Developer'], [16, 'Experienced Developer'], [20, 'Senior Developer'], [25, 'Studio Expert'], [30, 'Lead Developer'], [40, 'Front Page Developer'], [50, 'Legend'], [75, 'Mythic'], [100, 'Founder']];
  const need = n => 80 + 20 * n;

  P.levelInfo = xp => {
    let lvl = 1, rem = Math.max(0, Math.floor(xp));
    while (rem >= need(lvl)) { rem -= need(lvl); lvl++; }
    return { lvl, into: rem, need: need(lvl), pct: rem / need(lvl) };
  };
  P.rank = lvl => { let t = RANKS[0][1]; RANKS.forEach(r => { if (lvl >= r[0]) t = r[1]; }); return t; };
  P.RANKS = RANKS;

  P.xpFor = r => {
    if (r.failed) return Math.max(1, Math.round(r.time * .4));
    let x = r.chars[0] * Math.pow(r.acc / 100, 2) * .5 + r.time + 10;
    if (r.practice) x *= .7;
    if (r.mods && r.mods.length) x *= 1 + Math.min(.5, r.mods.length * .1);
    if (r.diff === 'expert') x *= 1.15;
    if (r.diff === 'master') x *= 1.3;
    return Math.round(x);
  };

  const ok = r => !r.failed;
  const sized = r => (r.mode === 'time' && r.m2 >= 15) || (r.mode === 'words' && r.m2 >= 25) || r.mode === 'quote';
  const BADGES = [
    { id: 'first', name: 'First Steps', desc: 'Complete your first test.', icon: 'sparkle', tier: 'common', test: (r, p) => p.completed >= 1 },
    { id: 'tests10', name: 'Regular', desc: 'Complete 10 tests.', icon: 'calendar', tier: 'common', test: (r, p) => p.completed >= 10 },
    { id: 'tests100', name: 'Dedicated', desc: 'Complete 100 tests.', icon: 'calendar', tier: 'rare', test: (r, p) => p.completed >= 100 },
    { id: 'tests500', name: 'Veteran', desc: 'Complete 500 tests.', icon: 'calendar', tier: 'epic', test: (r, p) => p.completed >= 500 },
    { id: 'wpm50', name: 'Warmed Up', desc: 'Reach 50 wpm.', icon: 'zap', tier: 'common', test: r => ok(r) && sized(r) && r.wpm >= 50 },
    { id: 'wpm75', name: 'Quick Fingers', desc: 'Reach 75 wpm.', icon: 'zap', tier: 'common', test: r => ok(r) && sized(r) && r.wpm >= 75 },
    { id: 'wpm100', name: 'Triple Digits', desc: 'Reach 100 wpm.', icon: 'zap', tier: 'rare', test: r => ok(r) && sized(r) && r.wpm >= 100 },
    { id: 'wpm125', name: 'Blazing', desc: 'Reach 125 wpm.', icon: 'flame', tier: 'epic', test: r => ok(r) && sized(r) && r.wpm >= 125 },
    { id: 'wpm150', name: 'Lightning', desc: 'Reach 150 wpm.', icon: 'bolt', tier: 'epic', test: r => ok(r) && sized(r) && r.wpm >= 150 },
    { id: 'wpm200', name: 'Beyond Fast', desc: 'Reach 200 wpm.', icon: 'rocket', tier: 'legendary', test: r => ok(r) && sized(r) && r.wpm >= 200 },
    { id: 'flawless', name: 'Flawless', desc: '100% accuracy on a 15s+ or 25+ word test.', icon: 'target', tier: 'rare', test: r => ok(r) && sized(r) && r.acc >= 100 },
    { id: 'steady', name: 'Steady Hands', desc: '85% consistency or more on a 15s+ test.', icon: 'gauge', tier: 'rare', test: r => ok(r) && r.time >= 15 && r.cons >= 85 },
    { id: 'marathon', name: 'Marathon', desc: 'Finish a 120 second test.', icon: 'clock', tier: 'rare', test: r => ok(r) && r.mode === 'time' && r.m2 >= 120 },
    { id: 'luau', name: 'Scripter', desc: 'Finish a quote that is a line of Luau code.', icon: 'code', tier: 'common', test: r => ok(r) && r.mode === 'quote' && String(r.quoteId || '').startsWith('c') },
    { id: 'dev', name: 'Studio Regular', desc: 'Finish a test with punctuation and numbers on.', icon: 'cube', tier: 'common', test: r => ok(r) && r.punct && r.nums && sized(r) },
    { id: 'vibe', name: 'Prompt Engineer', desc: 'Finish 10 quote tests.', icon: 'terminal', tier: 'rare', test: r => ok(r) && r.mode === 'quote' && LT.DB.results.filter(x => x.mode === 'quote' && !x.failed).length >= 10 },
    { id: 'lava', name: 'Lava Survivor', desc: 'Finish a test with lava mode on.', icon: 'flame', tier: 'rare', test: r => ok(r) && r.mods.includes('lava') && sized(r) },
    { id: 'master', name: 'No Mistakes Allowed', desc: 'Finish a test on master difficulty.', icon: 'crown', tier: 'epic', test: r => ok(r) && r.diff === 'master' && sized(r) },
    { id: 'blind', name: 'Blindfolded', desc: 'Finish a blind mode test with 90% accuracy.', icon: 'eyeoff', tier: 'rare', test: r => ok(r) && r.mods.includes('blind') && r.acc >= 90 && sized(r) },
    { id: 'headspin', name: 'Head Spin', desc: 'Finish a test with mirror and upside down on.', icon: 'flip', tier: 'epic', test: r => ok(r) && r.mods.includes('mirror') && r.mods.includes('upsidedown') && sized(r) },
    { id: 'weak', name: 'Self Improvement', desc: 'Finish a weak key practice.', icon: 'target', tier: 'common', test: r => ok(r) && r.practice === 'weak' },
    { id: 'ghost', name: 'Ghost Buster', desc: 'Beat the pace caret.', icon: 'ghost', tier: 'rare', test: (r, p, c) => ok(r) && c.pace > 0 && r.wpm > c.pace && sized(r) },
    { id: 'custom', name: 'Bring Your Own', desc: 'Finish a custom text test.', icon: 'wrench', tier: 'common', test: r => ok(r) && r.mode === 'custom' },
    { id: 'story', name: 'Storyteller', desc: 'Finish a long quote.', icon: 'book', tier: 'rare', test: r => ok(r) && r.mode === 'quote' && r.m2 === 'long' },
    { id: 'zen', name: 'Zen', desc: 'Type 100 words in zen mode.', icon: 'leaf', tier: 'common', test: r => r.mode === 'zen' && r.words >= 100 },
    { id: 'night', name: 'Night Owl', desc: 'Finish a test between midnight and 5am.', icon: 'moon', tier: 'common', test: r => ok(r) && new Date(r.ts).getHours() < 5 },
    { id: 'hour', name: 'One Hour In', desc: 'Type for 60 minutes in total.', icon: 'clock', tier: 'rare', test: (r, p) => p.time >= 3600 },
    { id: 'records', name: 'Record Breaker', desc: 'Beat your personal best 10 times.', icon: 'trophy', tier: 'epic', test: (r, p) => p.pbCount >= 10 },
    { id: 'lvl10', name: 'Rising', desc: 'Reach level 10.', icon: 'award', tier: 'common', test: (r, p) => P.levelInfo(p.xp).lvl >= 10 },
    { id: 'lvl25', name: 'Established', desc: 'Reach level 25.', icon: 'award', tier: 'rare', test: (r, p) => P.levelInfo(p.xp).lvl >= 25 },
    { id: 'lvl50', name: 'Legendary', desc: 'Reach level 50.', icon: 'award', tier: 'legendary', test: (r, p) => P.levelInfo(p.xp).lvl >= 50 }
  ];
  P.BADGES = BADGES;

  P.award = (r, ctx = {}) => {
    const p = DB.profile;
    const before = P.levelInfo(p.xp);
    const gain = P.xpFor(r);
    p.xp += gain;
    if (!r.failed) { p.completed++; p.words += r.words || 0; }
    p.time += r.time;
    const after = P.levelInfo(p.xp);
    const fresh = [];
    BADGES.forEach(b => {
      if (p.badges[b.id]) return;
      let hit = false;
      try { hit = b.test(r, p, ctx); } catch (e) {}
      if (hit) { p.badges[b.id] = r.ts; fresh.push(b); }
    });
    DB.save('profile');
    P.updateChip(true);
    return { gain, before, after, fresh };
  };

  P.updateChip = animate => {
    const info = P.levelInfo(DB.profile.xp);
    const num = document.getElementById('lvlNum');
    if (!num) return;
    const name = LT.S.get('name');
    num.textContent = info.lvl;
    document.getElementById('lvlTitle').textContent = name || P.rank(info.lvl);
    document.getElementById('lvlXp').textContent = `${name ? P.rank(info.lvl) + ' · ' : ''}${U.fmtNum(info.into)} / ${U.fmtNum(info.need)} xp`;
    const fill = document.querySelector('.lvl-fill');
    if (!animate) fill.style.transition = 'none';
    fill.style.strokeDashoffset = String(94.25 * (1 - info.pct));
    if (!animate) { fill.getBoundingClientRect(); fill.style.transition = ''; }
  };

  LT.Progress = P;
})();
