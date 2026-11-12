(() => {
  const U = LT.U;
  const FX = {};

  const loop = { fns: new Set(), on: false, last: 0 };
  const frame = t => {
    const dt = Math.min(.05, (t - loop.last) / 1000 || .016);
    loop.last = t;
    loop.fns.forEach(fn => { if (fn(dt, t) === false) loop.fns.delete(fn); });
    if (loop.fns.size) requestAnimationFrame(frame); else loop.on = false;
  };
  FX.animate = fn => {
    loop.fns.add(fn);
    if (!loop.on) { loop.on = true; loop.last = performance.now(); requestAnimationFrame(frame); }
    return () => loop.fns.delete(fn);
  };

  class Spring {
    constructor(w = 40) { this.w = w; this.x = 0; this.v = 0; this.t = 0; }
    snap(x) { this.x = this.t = x; this.v = 0; }
    shift(d) { this.x += d; this.t += d; }
    step(dt) {
      const w = this.w, e0 = this.x - this.t, c = this.v + w * e0, ex = Math.exp(-w * dt);
      this.x = this.t + (e0 + c * dt) * ex;
      this.v = (this.v - w * c * dt) * ex;
      if (Math.abs(this.x - this.t) < .02 && Math.abs(this.v) < .5) { this.x = this.t; this.v = 0; return false; }
      return true;
    }
    get busy() { return this.x !== this.t || this.v !== 0; }
  }
  FX.Spring = Spring;

  FX.countUp = (el, to, { dur = 700, dec = 0, suffix = '', from = 0 } = {}) => {
    const d = U.ms(dur);
    if (!d) { el.textContent = to.toFixed(dec) + suffix; return; }
    const t0 = performance.now();
    FX.animate(() => {
      const p = Math.min(1, (performance.now() - t0) / d), e = 1 - Math.pow(1 - p, 4);
      el.textContent = (from + (to - from) * e).toFixed(dec) + suffix;
      return p < 1;
    });
  };

  const toasts = () => document.getElementById('toasts');
  FX.toast = (msg, { title = '', icon = 'info', type = '', dur = 3200, action = null } = {}) => {
    const w = U.el('div', 'toast-w');
    w.innerHTML = `<div><div class="toast ${type}"><span class="t-ico">${U.icon(icon)}</span><div>${title ? `<div class="t-title">${U.esc(title)}</div>` : ''}<div class="t-msg">${U.esc(msg)}</div></div>${action ? `<button class="t-act">${U.esc(action.label)}</button>` : ''}</div></div>`;
    if (action) w.querySelector('.t-act').addEventListener('click', () => action.run());
    toasts().appendChild(w);
    const kill = () => {
      if (w.dataset.out) return;
      w.dataset.out = 1;
      w.classList.add('out');
      setTimeout(() => w.classList.remove('in'), U.ms(120));
      setTimeout(() => w.remove(), U.ms(500) + 30);
    };
    w.addEventListener('click', kill);
    U.raf2(() => w.classList.add('in'));
    setTimeout(kill, dur);
    while (toasts().children.length > 4) toasts().firstElementChild.remove();
  };

  const badgeQ = [];
  let badgeBusy = false;
  FX.badgePop = b => { badgeQ.push(b); if (!badgeBusy) nextBadge(); };
  const nextBadge = () => {
    const b = badgeQ.shift();
    if (!b) { badgeBusy = false; return; }
    badgeBusy = true;
    const el = U.el('div', 'badge-pop');
    el.innerHTML = `<div class="badge-ico tier-${b.tier}">${U.icon(b.icon)}</div><div><div class="bp-k">badge awarded</div><div class="bp-n">${U.esc(b.name)}</div><div class="bp-d">${U.esc(b.desc)}</div></div>`;
    document.body.appendChild(el);
    U.raf2(() => el.classList.add('in'));
    const r = el.querySelector('.badge-ico').getBoundingClientRect();
    setTimeout(() => FX.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 18, spread: 70 }), U.ms(250));
    setTimeout(() => { el.classList.remove('in'); setTimeout(() => { el.remove(); nextBadge(); }, U.ms(450) + 40); }, 3200);
  };

  FX.modal = ({ title = '', desc = '', body = '', actions = [], onOpen, wide } = {}) => {
    const m = U.el('div', 'modal');
    m.innerHTML = `<div class="modal-bd"></div><div class="modal-box" role="dialog" aria-modal="true" style="${wide ? 'width:min(760px,94vw)' : ''}">${title ? `<h3>${U.esc(title)}</h3>` : ''}${desc ? `<p class="m-desc">${desc}</p>` : ''}<div class="m-body"></div><div class="modal-actions"></div></div>`;
    const bodyEl = m.querySelector('.m-body');
    if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
    const prevFocus = document.activeElement;
    const close = () => {
      if (m.dataset.closing) return;
      m.dataset.closing = 1;
      m.classList.remove('open');
      document.removeEventListener('keydown', onKey, true);
      setTimeout(() => m.remove(), U.ms(380) + 20);
      FX.modalOpen = Math.max(0, (FX.modalOpen || 1) - 1);
      if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
      document.dispatchEvent(new CustomEvent('lt:modalclose'));
    };
    const bar = m.querySelector('.modal-actions');
    actions.forEach(a => {
      const b = U.el('button', 'btn ' + (a.cls || ''), (a.icon ? U.icon(a.icon) : '') + U.esc(a.label));
      b.addEventListener('click', () => { if (a.run && a.run(m) === false) return; close(); });
      bar.appendChild(b);
    });
    if (!actions.length) bar.remove();
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      if (e.key === 'Enter' && e.ctrlKey) { const p = bar.querySelector('.primary'); if (p) { e.preventDefault(); e.stopPropagation(); p.click(); } }
    };
    document.addEventListener('keydown', onKey, true);
    m.querySelector('.modal-bd').addEventListener('click', close);
    document.getElementById('modalRoot').appendChild(m);
    FX.modalOpen = (FX.modalOpen || 0) + 1;
    U.raf2(() => {
      m.classList.add('open');
      const f = m.querySelector('[autofocus], textarea, input:not([type=color]):not([type=checkbox])');
      if (f) f.focus();
      if (onOpen) onOpen(m);
    });
    return { el: m, close };
  };
  FX.confirm = (title, desc, label, run) => FX.modal({ title, desc, actions: [{ label: 'cancel', cls: 'ghost' }, { label, cls: 'primary danger', run }] });

  FX.indicator = group => {
    if (!group) return;
    let ind = group.querySelector(':scope > .puck');
    if (!ind) { ind = U.el('span', 'puck'); group.appendChild(ind); }
    const a = group.querySelector(':scope > .active');
    if (!a) { ind.classList.remove('on'); return; }
    const first = !ind.classList.contains('on');
    if (first) ind.style.transition = 'none';
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = `translateX(${a.offsetLeft}px)`;
    if (first) { ind.offsetWidth; ind.style.transition = ''; }
    ind.classList.add('on');
  };

  const tip = () => document.getElementById('tip');
  let tipT, tipFor;
  FX.initTips = () => {
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-tip]');
      if (t === tipFor) return;
      tipFor = t;
      clearTimeout(tipT);
      if (!t) { tip().classList.remove('show'); return; }
      tipT = setTimeout(() => {
        if (!document.body.contains(t)) return;
        const el = tip();
        el.textContent = t.dataset.tip;
        const r = t.getBoundingClientRect(), w = el.offsetWidth;
        const x = U.clamp(r.left + r.width / 2 - w / 2, 6, innerWidth - w - 6);
        const below = r.top < 50;
        el.style.transform = `translate(${x}px, ${below ? r.bottom + 8 : r.top - el.offsetHeight - 8}px)`;
        el.classList.add('show');
      }, 380);
    });
    document.addEventListener('pointerdown', () => { clearTimeout(tipT); tip().classList.remove('show'); }, true);
    window.addEventListener('scroll', () => tip().classList.remove('show'), { passive: true });
  };

  const cv = () => document.getElementById('fxCanvas');
  const parts = [];
  let ctx, fxOn = false;
  FX.burst = (x, y, { n = 26, spread = 120, colors } = {}) => {
    if (!U.motion()) return;
    const c = cv(), dpr = devicePixelRatio || 1;
    if (!ctx) ctx = c.getContext('2d');
    if (c.width !== innerWidth * dpr) { c.width = innerWidth * dpr; c.height = innerHeight * dpr; }
    const th = LT.Theme.colors();
    const cols = colors || [th.main, th.caret, th.text];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (.35 + Math.random() * .65) * spread * 4;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spread * 1.2, life: 0, max: .7 + Math.random() * .6, size: 2 + Math.random() * 3.5, rot: Math.random() * 6, vr: (Math.random() - .5) * 12, c: U.pick(cols), sq: Math.random() > .5 });
    }
    if (fxOn) return;
    fxOn = true;
    FX.animate(dt => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        if (p.life >= p.max) { parts.splice(i, 1); continue; }
        p.vx *= Math.pow(.04, dt); p.vy = p.vy * Math.pow(.04, dt) + 900 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const k = 1 - p.life / p.max;
        ctx.globalAlpha = Math.min(1, k * 1.6);
        ctx.fillStyle = p.c;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.sq) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      if (!parts.length) { ctx.clearRect(0, 0, innerWidth, innerHeight); fxOn = false; return false; }
    });
  };

  LT.FX = FX;
})();
