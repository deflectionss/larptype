(() => {
  const U = LT.U, FX = LT.FX;

  const tangents = ys => {
    const n = ys.length, m = [], t = new Array(n).fill(0);
    if (n < 2) return t;
    for (let i = 0; i < n - 1; i++) m[i] = ys[i + 1] - ys[i];
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    return t;
  };
  const herm = (ys, ts, s) => {
    const n = ys.length;
    if (!n) return 0;
    if (s <= 0) return ys[0];
    if (s >= n - 1) return ys[n - 1];
    const i = Math.floor(s), u = s - i, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * ts[i] + (3 * u2 - 2 * u3) * ys[i + 1] + (u3 - u2) * ts[i + 1];
  };
  const lin = (ys, s) => {
    const n = ys.length;
    if (!n) return 0;
    if (s <= 0) return ys[0];
    if (s >= n - 1) return ys[n - 1];
    const i = Math.floor(s);
    return ys[i] + (ys[i + 1] - ys[i]) * (s - i);
  };
  const nice = v => {
    if (v <= 10) return 10;
    const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  };
  const KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'];

  class Chart {
    constructor(wrap, opt) {
      this.wrap = wrap;
      this.o = Object.assign({ series: [], errors: null, xFmt: v => v, tip: null, animate: true, xs: null, window: 0, label: 'chart' }, opt);
      const cv = this.cv = U.el('canvas');
      cv.tabIndex = 0;
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', `${this.o.label}. Hover or use the arrow keys to read the values.`);
      this.tipEl = U.el('div', 'chart-tip');
      wrap.append(cv, this.tipEl);
      this.ctx = cv.getContext('2d');
      this.n = Math.max(1, ...this.o.series.map(s => s.data.length));
      this.ser = this.o.series.map(s => {
        const ys = s.data.map(v => (Number.isFinite(v) ? v : 0));
        return { s, ys, ts: tangents(ys) };
      });
      this.vs = new FX.Spring(12); this.ve = new FX.Spring(12); this.ym = new FX.Spring(12);
      this.hx = new FX.Spring(30); this.ha = new FX.Spring(26); this.side = new FX.Spring(24);
      this.springs = [this.vs, this.ve, this.ym, this.hx, this.ha, this.side];
      const [a, b] = this.range(this.o.window);
      this.vs.snap(a); this.ve.snap(b); this.ym.snap(this.yTarget(a, b));
      this.hover = -1; this.tw = 0; this.running = false;
      this.prog = this.o.animate && U.motion() ? 0 : 1;
      this.t0 = performance.now(); this.dur = U.ms(900);
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(wrap);
      this.onTheme = () => this.draw();
      document.addEventListener('lt:theme', this.onTheme);
      cv.addEventListener('pointermove', e => this.pointer(e));
      cv.addEventListener('pointerdown', e => { this.pointer(e); if (e.pointerType === 'mouse') cv.focus({ preventScroll: true }); });
      cv.addEventListener('pointerleave', () => this.clearHover());
      cv.addEventListener('blur', () => this.clearHover());
      cv.addEventListener('keydown', e => this.key(e));
      this.resize();
      if (this.prog < 1) this.kick();
    }

    destroy() { this.dead = true; this.ro.disconnect(); document.removeEventListener('lt:theme', this.onTheme); this.wrap.innerHTML = ''; }

    range(win) {
      const n = this.n;
      if (n <= 1) return [0, 0];
      const k = win > 0 && win < n ? win : n;
      return [n - k, n - 1];
    }

    yTarget(a, b) {
      let mx = 10;
      this.ser.forEach(({ ys }) => {
        for (let i = Math.max(0, Math.floor(a)); i <= Math.min(ys.length - 1, Math.ceil(b)); i++) if (ys[i] > mx) mx = ys[i];
      });
      return nice(mx * 1.08);
    }

    resize() {
      const r = this.wrap.getBoundingClientRect(), d = devicePixelRatio || 1;
      if (!r.width) return;
      this.w = r.width; this.h = r.height; this.d = d;
      this.cv.width = Math.round(r.width * d); this.cv.height = Math.round(r.height * d);
      this.draw();
    }

    layout() {
      const errs = this.o.errors, hasErr = !!(errs && errs.some(e => e > 0));
      const pad = { l: 38, r: hasErr ? 30 : 12, t: 12, b: 24 };
      const pw = Math.max(1, this.w - pad.l - pad.r), ph = Math.max(1, this.h - pad.t - pad.b);
      const vs = this.vs.x, ve = this.ve.x, one = this.n === 1 || ve - vs < 1e-6, span = Math.max(1e-6, ve - vs);
      const yMax = Math.max(1, this.ym.x), eMax = hasErr ? Math.max(1, ...errs) : 1;
      const X = i => pad.l + (one ? pw / 2 : ((i - vs) / span) * pw);
      const Y = v => pad.t + ph - (v / yMax) * ph;
      const E = v => pad.t + ph - (v / (eMax * 1.15)) * ph;
      return { pad, pw, ph, vs, ve, span, one, yMax, eMax, X, Y, E, hasErr };
    }

    kick() {
      if (this.running || this.dead) return;
      this.running = true;
      FX.animate(dt => {
        if (this.dead) { this.running = false; return false; }
        const busy = this.step(dt);
        this.draw();
        if (!busy) { this.running = false; return false; }
      });
    }

    step(dt) {
      const m = U.motion();
      let busy = false;
      this.springs.forEach(s => {
        if (!s.busy) return;
        if (!m) { s.snap(s.t); return; }
        if (s.step(m < 1 ? dt * 1.8 : dt)) busy = true;
      });
      if (this.prog < 1) {
        const p = this.dur ? Math.min(1, (performance.now() - this.t0) / this.dur) : 1;
        this.prog = 1 - Math.pow(1 - p, 3);
        if (p < 1) busy = true;
      }
      return busy;
    }

    update() {
      if (!this.w) this.resize();
      if (!U.motion()) { this.springs.forEach(s => s.snap(s.t)); this.draw(); return; }
      this.kick();
    }

    bounds() { return [Math.ceil(this.vs.t - 1e-6), Math.floor(this.ve.t + 1e-6)]; }

    pointer(e) {
      if (!this.w) this.resize();
      if (!this.L || !this.o.tip) return;
      const r = this.cv.getBoundingClientRect(), L = this.L;
      const i = L.one ? Math.round(L.vs) : Math.round(L.vs + ((e.clientX - r.left - L.pad.l) / L.pw) * L.span);
      if (i !== this.hover || this.ha.t !== 1) this.setHover(i);
    }

    key(e) {
      if (!KEYS.includes(e.key) || !this.o.tip) return;
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Escape') { this.clearHover(); this.cv.blur(); return; }
      const [a, b] = this.bounds(), step = e.shiftKey ? 10 : 1;
      let i = this.hover;
      if (e.key === 'Home') i = a;
      else if (e.key === 'End') i = b;
      else if (i < 0) i = e.key === 'ArrowLeft' ? b : a;
      else i += e.key === 'ArrowLeft' ? -step : step;
      this.setHover(i);
    }

    setHover(i) {
      if (!this.o.tip) return;
      const [a, b] = this.bounds();
      i = U.clamp(i, a, b);
      if (this.ha.x < .05) this.hx.snap(i);
      this.hover = i;
      this.hx.t = i;
      this.ha.t = 1;
      this.tipEl.innerHTML = this.o.tip(i);
      this.tw = this.tipEl.offsetWidth;
      this.tipEl.classList.add('show');
      this.update();
    }

    clearHover() {
      if (this.hover < 0 && this.ha.t === 0) return;
      this.hover = -1;
      this.ha.t = 0;
      this.tipEl.classList.remove('show');
      this.update();
    }

    setWindow(win) {
      this.o.window = win;
      const [a, b] = this.range(win);
      this.vs.t = a; this.ve.t = b; this.ym.t = this.yTarget(a, b);
      if (this.hover >= 0) {
        const i = U.clamp(this.hover, Math.ceil(a), Math.floor(b));
        if (i !== this.hover) this.setHover(i);
      }
      this.update();
    }

    draw() {
      if (!this.w) return;
      const c = this.ctx, th = LT.Theme.colors(), L = this.layout(), o = this.o;
      this.L = L;
      const font = getComputedStyle(document.body).fontFamily;
      c.setTransform(this.d, 0, 0, this.d, 0, 0);
      c.clearRect(0, 0, this.w, this.h);
      c.font = `700 11px ${font}`;
      c.textBaseline = 'middle';
      c.lineWidth = 1;
      for (let k = 0; k <= 4; k++) {
        const v = (L.yMax / 4) * k, y = Math.round(L.Y(v)) + .5;
        c.globalAlpha = k ? .16 : .32; c.strokeStyle = th.sub;
        c.beginPath(); c.moveTo(L.pad.l, y); c.lineTo(this.w - L.pad.r, y); c.stroke();
        c.globalAlpha = 1; c.fillStyle = th.sub; c.textAlign = 'right';
        c.fillText(String(Math.round(v)), L.pad.l - 8, y);
      }
      if (L.hasErr) {
        c.textAlign = 'left'; c.fillStyle = th.sub;
        c.fillText(String(L.eMax), this.w - L.pad.r + 8, L.E(L.eMax));
        c.fillText('0', this.w - L.pad.r + 8, L.E(0));
      }
      const ta = this.vs.t, tb = this.ve.t, cnt = Math.round(tb - ta) + 1;
      const ticks = Math.min(cnt, Math.max(2, Math.floor(L.pw / 64)));
      c.textAlign = 'center'; c.fillStyle = th.sub;
      const seen = new Set();
      for (let k = 0; k < ticks; k++) {
        const i = cnt === 1 ? Math.round(ta) : Math.round(ta + (k / (ticks - 1)) * (tb - ta));
        if (seen.has(i)) continue;
        seen.add(i);
        const x = L.X(i);
        if (x < L.pad.l - 14 || x > L.pad.l + L.pw + 14) continue;
        c.fillText(String(o.xFmt(o.xs ? o.xs[i] : i + 1)), x, this.h - 9);
      }

      const i0 = Math.max(0, Math.floor(L.vs) - 1), i1 = Math.min(this.n - 1, Math.ceil(L.ve) + 1);
      c.save();
      c.beginPath();
      c.rect(L.pad.l - 6, 0, (L.pw + 12) * this.prog, this.h);
      c.clip();
      for (let si = this.ser.length - 1; si >= 0; si--) {
        const { s, ys, ts } = this.ser[si];
        const j1 = Math.min(i1, ys.length - 1);
        if (!ys.length || i0 > j1) continue;
        const col = th[s.color] || s.color;
        const path = () => {
          c.moveTo(L.X(i0), L.Y(ys[i0]));
          for (let i = i0; i < j1; i++) {
            const x0 = L.X(i), x1 = L.X(i + 1), h = (x1 - x0) / 3;
            if (s.straight) c.lineTo(x1, L.Y(ys[i + 1]));
            else c.bezierCurveTo(x0 + h, L.Y(ys[i] + ts[i] / 3), x1 - h, L.Y(ys[i + 1] - ts[i + 1] / 3), x1, L.Y(ys[i + 1]));
          }
        };
        if (s.fill && j1 > i0) {
          const g = c.createLinearGradient(0, L.pad.t, 0, L.pad.t + L.ph);
          g.addColorStop(0, col + '40'); g.addColorStop(1, col + '00');
          c.beginPath(); path();
          c.lineTo(L.X(j1), L.pad.t + L.ph); c.lineTo(L.X(i0), L.pad.t + L.ph); c.closePath();
          c.fillStyle = g; c.fill();
        }
        if (!s.noLine && j1 > i0) {
          c.beginPath(); path();
          c.strokeStyle = col; c.lineWidth = s.width || 2; c.lineJoin = 'round'; c.lineCap = 'round';
          c.globalAlpha = s.alpha || 1;
          if (s.dash) c.setLineDash(s.dash);
          c.stroke();
          c.setLineDash([]);
          c.globalAlpha = 1;
        }
        if (s.points || ys.length === 1) {
          const r = s.pointR || 2.5;
          c.fillStyle = col; c.globalAlpha = s.alpha || 1;
          for (let i = i0; i <= j1; i++) { c.beginPath(); c.arc(L.X(i), L.Y(ys[i]), r, 0, Math.PI * 2); c.fill(); }
          c.globalAlpha = 1;
        }
      }
      if (L.hasErr) {
        c.strokeStyle = th.error; c.lineWidth = 1.8;
        o.errors.forEach((e, i) => {
          if (!e || i < i0 || i > i1) return;
          const x = L.X(i), y = L.E(e), r = 3.2;
          c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r, y + r); c.moveTo(x + r, y - r); c.lineTo(x - r, y + r); c.stroke();
        });
      }
      c.restore();

      const a = this.ha.x;
      if (a > .01 && this.prog >= 1) {
        const hx = this.hx.x, x = Math.round(L.X(hx)) + .5;
        const g = c.createLinearGradient(0, L.pad.t, 0, L.pad.t + L.ph);
        g.addColorStop(0, th.sub + '00'); g.addColorStop(.2, th.sub); g.addColorStop(1, th.sub);
        c.globalAlpha = .6 * a; c.strokeStyle = g; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x, L.pad.t); c.lineTo(x, L.pad.t + L.ph); c.stroke();
        this.ser.forEach(({ s, ys, ts }) => {
          if (!ys.length) return;
          const y = L.Y(s.straight ? lin(ys, hx) : herm(ys, ts, hx)), col = th[s.color] || s.color;
          c.fillStyle = col;
          c.globalAlpha = .2 * a;
          c.beginPath(); c.arc(x, y, 9.5, 0, Math.PI * 2); c.fill();
          c.globalAlpha = a;
          c.beginPath(); c.arc(x, y, 4.5, 0, Math.PI * 2); c.fill();
          c.lineWidth = 2; c.strokeStyle = th.subAlt; c.stroke();
        });
        c.globalAlpha = 1;
      }
      if (o.tip && (this.hover >= 0 || a > .01)) {
        const cx = L.X(this.hx.x), tw = this.tw || this.tipEl.offsetWidth;
        const st = cx + 18 + tw > this.w - 2 ? 1 : 0;
        if (this.side.t !== st) {
          this.side.t = st;
          if (a < .05 || !U.motion()) this.side.snap(st); else this.kick();
        }
        const tl = U.clamp(cx + 16 - this.side.x * (32 + tw), 2, Math.max(2, this.w - tw - 2));
        this.tipEl.style.transform = `translate3d(${Math.round(tl)}px, ${L.pad.t}px, 0)`;
      }
    }
  }
  LT.Chart = Chart;
})();
