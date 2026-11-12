(() => {
  const U = LT.U;

  LT.MODS = {
    lava: { name: 'lava', icon: 'flame', desc: 'Every mistake raises lava under the words. Let it reach the top and the test fails.' },
    blind: { name: 'blind', icon: 'eyeoff', desc: 'Mistakes are not shown while you type. Results still count them.' },
    memory: { name: 'memory', icon: 'brain', desc: 'Words fade out a few seconds after you start typing.' },
    mirror: { name: 'mirror', icon: 'mirror', desc: 'Words are flipped horizontally.' },
    upsidedown: { name: 'upside down', icon: 'flip', desc: 'Words are flipped vertically.' },
    randomcase: { name: 'random case', icon: 'shuffle', desc: 'Letters get random capitalization.' },
    nobackspace: { name: 'no backspace', icon: 'backspace', desc: 'Backspace is disabled. Every key is final.' }
  };

  const SCHEMA = [
    { k: 'mode', def: 'time', opts: ['time', 'words', 'quote', 'zen', 'custom'], hidden: true },
    { k: 'time', def: 30, type: 'num', min: 1, max: 3600, hidden: true },
    { k: 'words', def: 25, type: 'num', min: 1, max: 5000, hidden: true },
    { k: 'quoteLength', def: 'all', opts: ['all', 'short', 'medium', 'long'], hidden: true },
    { k: 'punctuation', def: false, type: 'bool', hidden: true, label: 'punctuation', icon: 'at' },
    { k: 'numbers', def: false, type: 'bool', hidden: true, label: 'numbers', icon: 'hash' },
    { k: 'customText', def: 'Paste or type your own text here. Code works too: local part = Instance.new("Part")', type: 'text', hidden: true },
    { k: 'customShuffle', def: false, type: 'bool', hidden: true },
    { k: 'customLimit', def: 0, type: 'num', min: 0, max: 5000, hidden: true },
    { k: 'name', def: '', type: 'name', hidden: true },

    { k: 'language', def: 'roblox', opts: ['roblox', 'simple'], hidden: true },
    { k: 'difficulty', group: 'behavior', icon: 'bolt', label: 'difficulty', def: 'normal', opts: ['normal', 'expert', 'master'], desc: 'Expert fails the test when you submit a wrong word. Master fails it on any wrong key.' },
    { k: 'quickRestart', group: 'behavior', icon: 'restart', label: 'quick restart', def: 'tab', opts: ['off', 'tab', 'esc', 'enter'], desc: 'Key that instantly starts a new test. Off: press tab then enter on the restart button.' },
    { k: 'stopOnError', group: 'behavior', icon: 'alert', label: 'stop on error', def: 'off', opts: ['off', 'letter', 'word'], desc: 'Letter: wrong keys are not typed. Word: space is blocked until the word is right.' },
    { k: 'confidence', group: 'behavior', icon: 'backspace', label: 'confidence mode', def: 'off', opts: ['off', 'on', 'max'], desc: 'On: you cannot go back to previous words. Max: backspace is disabled.' },
    { k: 'freedom', group: 'behavior', icon: 'leaf', label: 'freedom mode', def: false, type: 'bool', desc: 'Allow going back to words you already typed correctly.' },
    { k: 'minWpm', group: 'behavior', icon: 'gauge', label: 'minimum wpm', def: 0, type: 'num', min: 0, max: 500, presets: [0, 40, 60, 80, 100], desc: 'Fail the test if your speed drops below this after the first 3 seconds. 0 turns it off.' },
    { k: 'minAcc', group: 'behavior', icon: 'target', label: 'minimum accuracy', def: 0, type: 'num', min: 0, max: 100, presets: [0, 80, 90, 95, 98], desc: 'Fail the test if accuracy drops below this. 0 turns it off.' },

    { k: 'caretStyle', group: 'caret', icon: 'type', label: 'caret style', def: 'line', opts: ['off', 'line', 'block', 'outline', 'underline'], desc: 'Shape of the typing caret.' },
    { k: 'smoothCaret', group: 'caret', icon: 'sparkle', label: 'smooth caret', def: 'medium', opts: ['off', 'fast', 'medium', 'slow'], desc: 'How the caret glides between letters. Uses a spring, so it never stutters when you type fast.' },
    { k: 'caretBlink', group: 'caret', icon: 'eye', label: 'caret blink', def: 'smooth', opts: ['off', 'smooth', 'sharp'], desc: 'Blink style while you are not typing.' },
    { k: 'paceCaret', group: 'caret', icon: 'ghost', label: 'pace caret', def: 'off', opts: ['off', 'pb', 'average', 'last', 'custom'], desc: 'A ghost caret that moves at a steady speed so you can race it.' },
    { k: 'paceWpm', group: 'caret', icon: 'gauge', label: 'pace caret speed', def: 100, type: 'num', min: 5, max: 400, presets: [60, 80, 100, 120, 150], desc: 'Speed of the ghost when pace caret is set to custom.' },

    { k: 'font', group: 'appearance', icon: 'type', label: 'font', def: 'JetBrains Mono', type: 'font', desc: 'Font for the words you type.' },
    { k: 'fontSize', group: 'appearance', icon: 'type', label: 'font size', def: 1.75, opts: [1.25, 1.5, 1.75, 2, 2.5, 3], desc: 'Size of the words.' },
    { k: 'motion', group: 'appearance', icon: 'sparkle', label: 'animations', def: 'smooth', opts: ['smooth', 'reduced', 'off'], desc: 'Speed of every transition on the site. The caret has its own setting.' },
    { k: 'smoothLineScroll', group: 'appearance', icon: 'list', label: 'smooth line scroll', def: true, type: 'bool', desc: 'Glide to the next line instead of jumping.' },
    { k: 'timerStyle', group: 'appearance', icon: 'clock', label: 'timer and progress', def: 'mini', opts: ['off', 'mini', 'bar', 'both'], desc: 'Mini shows numbers above the words. Bar shows a thin line at the top of the page.' },
    { k: 'liveWpm', group: 'appearance', icon: 'zap', label: 'live wpm', def: true, type: 'bool', desc: 'Show your speed while typing.' },
    { k: 'liveAcc', group: 'appearance', icon: 'target', label: 'live accuracy', def: true, type: 'bool', desc: 'Show your accuracy while typing.' },
    { k: 'liveBurst', group: 'appearance', icon: 'bolt', label: 'live burst', def: false, type: 'bool', desc: 'Show the speed of your last word.' },
    { k: 'highlightWord', group: 'appearance', icon: 'eye', label: 'highlight active word', def: false, type: 'bool', desc: 'Soft background behind the word you are typing.' },
    { k: 'indicateTypos', group: 'appearance', icon: 'alert', label: 'indicate typos', def: 'off', opts: ['off', 'below', 'replace'], desc: 'Below shows what you typed under the letter. Replace shows it instead of the letter.' },
    { k: 'hideExtra', group: 'appearance', icon: 'eyeoff', label: 'hide extra letters', def: false, type: 'bool', desc: 'Letters typed past the end of a word are not shown.' },
    { k: 'flipColors', group: 'appearance', icon: 'flip', label: 'flip test colors', def: false, type: 'bool', desc: 'Upcoming letters are bright, typed letters are dim.' },
    { k: 'colorful', group: 'appearance', icon: 'palette', label: 'colorful mode', def: false, type: 'bool', desc: 'Correct letters use the accent color.' },
    { k: 'focusMode', group: 'appearance', icon: 'eye', label: 'focus mode', def: true, type: 'bool', desc: 'Fade out the interface and hide the mouse while you type.' },
    { k: 'background', group: 'appearance', icon: 'layers', label: 'background pattern', def: 'none', opts: ['none', 'studs', 'grid', 'dots'], desc: 'Studs give a baseplate look. Grid looks like the Studio viewport.' },
    { k: 'capsWarning', group: 'appearance', icon: 'lock', label: 'caps lock warning', def: true, type: 'bool', desc: 'Show a warning while caps lock is on.' },
    { k: 'keyTips', group: 'appearance', icon: 'keyboard', label: 'key tips', def: true, type: 'bool', desc: 'Shortcut hints in the footer.' },
    { k: 'showLevel', group: 'appearance', icon: 'award', label: 'level in header', def: true, type: 'bool', desc: 'Show your level and rank next to the logo.' },
    { k: 'badgePopups', group: 'appearance', icon: 'award', label: 'badge popups', def: true, type: 'bool', desc: 'Show a popup when you earn a badge.' },
    { k: 'wpmDecimals', group: 'appearance', icon: 'hash', label: 'decimal results', def: false, type: 'bool', desc: 'Show wpm and accuracy with decimals on the result screen.' },

    { k: 'theme', group: 'theme', icon: 'palette', label: 'theme', def: 'vibecode', type: 'theme' },
    { k: 'randomTheme', group: 'theme', icon: 'shuffle', label: 'random theme', def: 'off', opts: ['off', 'all', 'dark', 'light', 'favorites'], desc: 'Switch to a random theme after every test.' },
    { k: 'favThemes', def: [], type: 'list', hidden: true },
    { k: 'customTheme', def: null, type: 'obj', hidden: true },

    { k: 'mods', group: 'challenge', icon: 'flame', label: 'challenge mods', def: [], type: 'mods', desc: 'Stack as many as you like. Tests with mods still count for stats.' },
    { k: 'lavaLimit', group: 'challenge', icon: 'flame', label: 'lava tolerance', def: 10, opts: [5, 10, 15, 25], desc: 'How many mistakes it takes for the lava to reach the words. Correct words cool it down a little.' }
  ];

  const BY = {};
  SCHEMA.forEach(d => { if (!d.type) d.type = d.opts ? 'sel' : 'str'; BY[d.k] = d; });
  const clone = v => (v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v);

  const coerce = (d, v) => {
    switch (d.type) {
      case 'sel': {
        const hit = d.opts.find(o => String(o) === String(v));
        return hit === undefined ? undefined : hit;
      }
      case 'bool': return typeof v === 'boolean' ? v : undefined;
      case 'num': { const n = Number(v); return Number.isFinite(n) ? U.clamp(Math.round(n * 100) / 100, d.min ?? -Infinity, d.max ?? Infinity) : undefined; }
      case 'list': return Array.isArray(v) ? v.filter(x => typeof x === 'string') : undefined;
      case 'mods': return Array.isArray(v) ? [...new Set(v.filter(x => LT.MODS[x]))] : undefined;
      case 'obj': return v && typeof v === 'object' ? v : (v === null ? null : undefined);
      case 'name': return typeof v === 'string' ? [...v.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim()].slice(0, 24).join('').trim() : undefined;
      default: return typeof v === 'string' ? v : undefined;
    }
  };

  const S = { schema: SCHEMA, by: BY, v: {}, subs: [] };
  const persist = U.debounce(() => U.store.set('settings', S.v), 150);

  S.load = () => {
    const saved = U.store.get('settings', {}) || {};
    SCHEMA.forEach(d => {
      const c = saved[d.k] === undefined ? undefined : coerce(d, saved[d.k]);
      S.v[d.k] = c === undefined ? clone(d.def) : c;
    });
  };
  S.get = k => S.v[k];
  S.set = (k, val) => {
    const d = BY[k];
    if (!d) return false;
    const c = coerce(d, val);
    if (c === undefined) return false;
    if (JSON.stringify(c) === JSON.stringify(S.v[k])) return true;
    const prev = S.v[k];
    S.v[k] = c;
    persist();
    S.subs.forEach(s => { if (s.k === '*' || s.k.includes(k)) s.fn(k, c, prev); });
    return true;
  };
  S.toggle = k => S.set(k, !S.v[k]);
  S.toggleMod = m => {
    const cur = new Set(S.v.mods);
    cur.has(m) ? cur.delete(m) : cur.add(m);
    S.set('mods', [...cur]);
  };
  S.on = (keys, fn) => S.subs.push({ k: keys === '*' ? '*' : [].concat(keys), fn });
  S.reset = () => SCHEMA.forEach(d => S.set(d.k, clone(d.def)));
  S.export = () => btoa(unescape(encodeURIComponent(JSON.stringify(S.v))));
  S.import = str => {
    let obj;
    try { obj = JSON.parse(str); } catch (e) {
      try { obj = JSON.parse(decodeURIComponent(escape(atob(str.trim())))); } catch (er) { return false; }
    }
    if (!obj || typeof obj !== 'object') return false;
    Object.keys(obj).forEach(k => BY[k] && S.set(k, obj[k]));
    return true;
  };
  LT.S = S;

  const DB = {
    results: [], keys: {}, pbs: {},
    profile: { xp: 0, badges: {}, started: 0, completed: 0, time: 0, words: 0, pbCount: 0 }
  };
  DB.load = () => {
    DB.results = U.store.get('results', []) || [];
    DB.keys = U.store.get('keys', {}) || {};
    DB.pbs = U.store.get('pbs', {}) || {};
    DB.profile = Object.assign(DB.profile, U.store.get('profile', {}) || {});
    const fix = l => (l === 'custom' || LT.PACKS[l] ? l : 'roblox');
    let moved = false;
    DB.results.forEach(r => { const l = fix(r.lang); if (l !== r.lang) { r.lang = l; moved = true; } });
    Object.keys(DB.pbs).forEach(k => {
      const p = k.split('|'), l = fix(p[2]);
      if (l === p[2]) return;
      p[2] = l;
      const nk = p.join('|'), old = DB.pbs[k];
      if (!DB.pbs[nk] || old.wpm > DB.pbs[nk].wpm) DB.pbs[nk] = old;
      delete DB.pbs[k];
      moved = true;
    });
    if (moved) DB.save('results', 'pbs');
  };
  DB.save = (...parts) => {
    (parts.length ? parts : ['results', 'keys', 'pbs', 'profile']).forEach(p => {
      if (!U.store.set(p, DB[p]) && p === 'results') {
        DB.results = DB.results.slice(-400).map(r => { delete r.chart; return r; });
        U.store.set('results', DB.results);
      }
    });
  };
  DB.pbKey = r => [r.mode, r.m2, r.lang, r.punct ? 1 : 0, r.nums ? 1 : 0].join('|');
  DB.pbEligible = r => !r.failed && !r.practice && (r.mode === 'time' || r.mode === 'words');
  DB.pbFor = r => DB.pbs[DB.pbKey(r)] || null;
  DB.addResult = r => {
    DB.results.push(r);
    if (DB.results.length > 1500) DB.results.splice(0, DB.results.length - 1500);
    for (let i = 0; i < DB.results.length - 40; i++) delete DB.results[i].chart;
    let isPb = false;
    if (DB.pbEligible(r)) {
      const k = DB.pbKey(r), cur = DB.pbs[k];
      if (!cur || r.wpm > cur.wpm) {
        isPb = !!cur;
        DB.pbs[k] = { wpm: r.wpm, acc: r.acc, raw: r.raw, cons: r.cons, ts: r.ts };
        if (cur) DB.profile.pbCount++;
      }
    }
    DB.save('results', 'pbs', 'profile');
    return isPb;
  };
  DB.addKeys = map => {
    Object.keys(map).forEach(ch => {
      const a = DB.keys[ch] || (DB.keys[ch] = [0, 0, 0, 0]), b = map[ch];
      for (let i = 0; i < 4; i++) a[i] += b[i];
    });
    DB.save('keys');
  };
  DB.clearHistory = () => {
    DB.results = []; DB.keys = {}; DB.pbs = {};
    DB.profile = { xp: 0, badges: {}, started: 0, completed: 0, time: 0, words: 0, pbCount: 0 };
    DB.save();
  };
  LT.DB = DB;
  window.addEventListener('storage', e => { if (e.key && /^larptype:(results|keys|pbs|profile)$/.test(e.key)) DB.load(); });
})();
