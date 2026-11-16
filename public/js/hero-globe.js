/* Night-sky background: dark brand base, soft colour glows and a slowly turning dotted sphere.
   Used behind the first hero on every page (the twinkling stars from hero-stars.js sit on top)
   and behind the home page "Who We Work With" section (which also gets its own twinkles here).
   Self-contained; injects its own CSS. */
(function () {
  var HERO = '.hero_game_container,.head_block';
  var SECTIONS = [
    { el: document.querySelector(HERO), twinkles: false, globeY: 'top' },
    { el: document.querySelector('.work_container_game'), twinkles: true, globeY: 'mid', alt: true },
    // intro loader (first visit only): same globe + twinkles; its glows are static CSS in Loader.astro
    { el: document.documentElement.classList.contains('cl-loading') ? document.querySelector('.cl-loader') : null, twinkles: true, globeY: 'mid', noOrbs: true }
  ].filter(function (s) { return s.el; });
  if (!SECTIONS.length) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var st = document.createElement('style');
  st.textContent =
    (HERO + ',.work_container_game').split(',').map(function (s) { return 'html body ' + s + ':not(#_z)'; }).join(',') + '{background:#07070d !important}' +
    '.hg-orbs,.hg-globe{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit}' +
    '.hg-orbs{z-index:-3}.hg-globe{z-index:-2}.hg-globe canvas{display:block;width:100%;height:100%}' +
    '.hg-orbs i{position:absolute;border-radius:50%;filter:blur(40px);animation:hg-drift 20s ease-in-out infinite alternate}' +
    '.hg-orbs i:nth-child(1){left:-12%;top:2%;width:48vw;height:48vw;max-width:760px;max-height:760px;opacity:.55;background:radial-gradient(circle,#306be7 0%,rgba(90,79,224,.45) 30%,rgba(48,107,231,0) 66%)}' +
    '.hg-orbs i:nth-child(2){right:-12%;top:-2%;width:46vw;height:46vw;max-width:740px;max-height:740px;opacity:.5;animation-duration:24s;animation-direction:alternate-reverse;background:radial-gradient(circle,#9b2ec2 0%,rgba(237,102,115,.4) 32%,rgba(155,46,194,0) 66%)}' +
    '.hg-orbs i:nth-child(3){left:32%;bottom:-38%;width:42vw;height:42vw;opacity:.3;animation-duration:28s;background:radial-gradient(circle,#5a4fe0 0%,rgba(90,79,224,0) 66%)}' +
    /* section variant: glows swap sides and sit lower so the two dark areas don't look identical */
    '.hg-orbs.is-alt i:nth-child(1){left:auto;right:-14%;top:28%;background:radial-gradient(circle,#26aeee 0%,rgba(48,107,231,.4) 30%,rgba(38,174,238,0) 66%);opacity:.4}' +
    '.hg-orbs.is-alt i:nth-child(2){right:auto;left:-14%;top:42%;opacity:.45}' +
    '.hg-orbs.is-alt i:nth-child(3){left:25%;top:-22%;bottom:auto;width:50vw;height:50vw;opacity:.42;background:radial-gradient(circle,#864ee3 0%,rgba(90,79,224,.3) 35%,rgba(90,79,224,0) 66%)}' +
    '@media(max-width:767px){.hg-orbs i:nth-child(1){width:90vw;height:90vw;left:-40%}.hg-orbs i:nth-child(2){width:90vw;height:90vw;right:-45%}.hg-orbs.is-alt i:nth-child(1){left:auto;right:-45%}.hg-orbs.is-alt i:nth-child(2){right:auto;left:-45%}}' +
    '@keyframes hg-drift{to{transform:translate3d(5%,6%,0) scale(1.08)}}' +
    '@media(prefers-reduced-motion:reduce){.hg-orbs i{animation:none}}';
  document.head.appendChild(st);

  var COLORS = ['#26aeee', '#306be7', '#5a4fe0', '#864ee3', '#9b2ec2', '#ed6673', '#f98670'];

  SECTIONS.forEach(function (cfg) {
    var host = cfg.el;
    var cs = getComputedStyle(host);
    if (cs.position === 'static') host.style.position = 'relative';
    if (cs.zIndex === 'auto') host.style.isolation = 'isolate';

    var wrap = document.createElement('div'); wrap.className = 'hg-globe'; wrap.setAttribute('aria-hidden', 'true');
    var cvs = document.createElement('canvas'); wrap.appendChild(cvs);
    host.prepend(wrap);
    if (!cfg.noOrbs) {
      var orbs = document.createElement('div'); orbs.className = 'hg-orbs' + (cfg.alt ? ' is-alt' : ''); orbs.setAttribute('aria-hidden', 'true');
      orbs.innerHTML = '<i></i><i></i><i></i>';
      host.prepend(orbs);
    }
    var ctx = cvs.getContext('2d');

    var pts = [], stars = [], W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
    function build() {
      var mob = innerWidth <= 767, n = mob ? 520 : 1100, ga = Math.PI * (3 - Math.sqrt(5));
      pts = [];
      for (var i = 0; i < n; i++) {
        var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
        pts.push({ x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, node: i % 53 === 7 ? COLORS[(i / 53 | 0) % COLORS.length] : null });
      }
      stars = [];
      if (cfg.twinkles) {
        var count = Math.round(W * H / (mob ? 9000 : 16000));
        for (var k = 0; k < count; k++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() < .12 ? 1.8 : 1, ph: Math.random() * 6.28, sp: .6 + Math.random() * 1.1 });
      }
    }
    function size() {
      var b = host.getBoundingClientRect();
      W = b.width; H = b.height; dpr = Math.min(2, devicePixelRatio || 1);
      cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
      var mob = innerWidth <= 767;
      R = mob ? Math.min(W * 0.62, 340) : Math.min(W * 0.31, 640);
      cx = W / 2; cy = cfg.globeY === 'mid' ? Math.min(H * 0.42, R + 160) : R + 40;
      build();
    }

    var tilt = 0.38, ct = Math.cos(tilt), sn = Math.sin(tilt), angle = cfg.alt ? 1.7 : 0, time = 0;
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // twinkling stars (section variant only; the heroes use hero-stars.js)
      for (var q = 0; q < stars.length; q++) {
        var sr = stars[q];
        ctx.globalAlpha = 0.15 + 0.55 * (0.5 + 0.5 * Math.sin(time * sr.sp + sr.ph));
        ctx.fillStyle = '#fff';
        ctx.fillRect(sr.x, sr.y, sr.s, sr.s);
      }
      var ca = Math.cos(angle), sa = Math.sin(angle), nodes = [];
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var x = p.x * ca + p.z * sa, z = -p.x * sa + p.z * ca;       // turn around Y
        var y = p.y * ct - z * sn; z = p.y * sn + z * ct;            // tilt toward the viewer
        var depth = (z + 1) / 2;                                      // 0 = back, 1 = front
        var sx = cx + x * R, sy = cy + y * R;
        if (sy < -4 || sy > H + 4) continue;
        if (p.node && depth > 0.35) { nodes.push([sx, sy, p.node, depth]); continue; }
        ctx.globalAlpha = 0.07 + 0.55 * depth * depth;
        ctx.fillStyle = '#c9cdf5';
        var s = 0.7 + 0.9 * depth;
        ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
      }
      ctx.lineWidth = 0.6;
      for (var a = 0; a < nodes.length; a++) for (var c = a + 1; c < nodes.length; c++) {
        var dx = nodes[a][0] - nodes[c][0], dy = nodes[a][1] - nodes[c][1], d = Math.sqrt(dx * dx + dy * dy);
        if (d < R * 0.55) { ctx.globalAlpha = 0.12 * (1 - d / (R * 0.55)) * Math.min(nodes[a][3], nodes[c][3]); ctx.strokeStyle = '#8f94ff'; ctx.beginPath(); ctx.moveTo(nodes[a][0], nodes[a][1]); ctx.lineTo(nodes[c][0], nodes[c][1]); ctx.stroke(); }
      }
      for (var k = 0; k < nodes.length; k++) {
        var nd = nodes[k];
        ctx.globalAlpha = 0.25 * nd[3]; ctx.fillStyle = nd[2]; ctx.beginPath(); ctx.arc(nd[0], nd[1], 6, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 0.95; ctx.beginPath(); ctx.arc(nd[0], nd[1], 1.8, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    var visible = true, last = 0, raf = 0;
    function loop(t) {
      raf = 0;
      if (!visible || document.hidden) return;
      var dt = Math.min(48, t - (last || t));
      angle += dt * 0.00006;                                          // about one turn every 100s
      time += dt / 1000;
      last = t; draw(); raf = requestAnimationFrame(loop);
    }
    function start() { if (!reduce && !raf) { last = 0; raf = requestAnimationFrame(loop); } }

    size(); draw();
    new ResizeObserver(function () { size(); draw(); }).observe(host);
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }).observe(host);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    start();
  });
})();
