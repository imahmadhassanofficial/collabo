/* "AI" background: a living neural network in the logo colours. Nodes drift, links fade in and out with distance,
   and light pulses travel along the links (data flowing between creatives, ad server and screens). Nodes near the
   pointer brighten and lean towards it.
   Add data-ai-bg to any element: data-ai-bg="hero" (sparse, behind content) or data-ai-bg="stage" (denser, behind a demo).
   Pauses when off screen or in a hidden tab; draws one still frame with reduced motion. Safe to run more than once. */
(function () {
  var COLORS = [[38, 174, 238], [48, 107, 231], [90, 79, 224], [134, 78, 227], [155, 46, 194], [237, 102, 115], [249, 134, 112]];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.querySelector('style[data-ai-bg]')) {
    var st = document.createElement('style'); st.setAttribute('data-ai-bg', ''); st.setAttribute('data-keep', '');
    st.textContent = '.ai-bg{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit}' +
      '.ai-bg canvas{display:block;width:100%;height:100%}' +
      '[data-ai-bg="hero"]>.ai-bg{z-index:-1;opacity:.75;-webkit-mask-image:radial-gradient(120% 90% at 50% 40%,#000 40%,transparent 100%);mask-image:radial-gradient(120% 90% at 50% 40%,#000 40%,transparent 100%)}' +
      '[data-ai-bg="stage"]>.ai-bg{z-index:0;opacity:.9}' +
      '[data-ai-bg="stage"]>.cd{z-index:1}';
    document.head.appendChild(st);
  }

  function start(host) {
    if (host.__aiBg) return;
    host.__aiBg = true;
    var mode = host.getAttribute('data-ai-bg') || 'hero';
    var cs = getComputedStyle(host);
    if (cs.position === 'static') host.style.position = 'relative';
    if (mode === 'hero' && cs.zIndex === 'auto') host.style.isolation = 'isolate';

    var wrap = document.createElement('div'); wrap.className = 'ai-bg'; wrap.setAttribute('aria-hidden', 'true');
    var cvs = document.createElement('canvas'); wrap.appendChild(cvs);
    host.insertBefore(wrap, host.firstChild);
    var ctx = cvs.getContext('2d');

    var W = 0, H = 0, dpr = 1, nodes = [], pulses = [], LINK = 150;
    var mouse = { x: -9999, y: -9999 };

    function seed() {
      var r = host.getBoundingClientRect();
      W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
      cvs.width = Math.max(1, Math.round(W * dpr)); cvs.height = Math.max(1, Math.round(H * dpr));
      var density = mode === 'stage' ? 1 / 9000 : 1 / 16000;
      var n = Math.max(18, Math.min(mode === 'stage' ? 110 : 80, Math.round(W * H * density)));
      LINK = Math.max(110, Math.min(190, Math.sqrt(W * H / n) * 1.55));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
          r: Math.random() < .12 ? 2.4 : 1 + Math.random() * 1.1,
          c: COLORS[(Math.random() * COLORS.length) | 0], ph: Math.random() * 6.28
        });
      }
      pulses = [];
    }

    function spawnPulse() {
      var a = nodes[(Math.random() * nodes.length) | 0];
      var best = null, bd = 1e9;
      for (var i = 0; i < nodes.length; i++) {
        var b = nodes[i]; if (b === a) continue;
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK && d > 30 && d < bd && Math.random() < .6) { bd = d; best = b; }
      }
      if (best) pulses.push({ a: a, b: best, t: 0, sp: 0.008 + Math.random() * 0.012, c: a.c });
    }

    var last = 0;
    function frame(now) {
      var dt = Math.min(48, now - (last || now)); last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var k = dt / 16.7;
      // move
      for (var i = 0; i < nodes.length; i++) {
        var p = nodes[i];
        var dx = mouse.x - p.x, dy = mouse.y - p.y, dm = Math.hypot(dx, dy);
        if (dm < 180) { p.vx += dx / dm * .006 * k; p.vy += dy / dm * .006 * k; }
        p.vx *= .995; p.vy *= .995;
        var sp = Math.hypot(p.vx, p.vy); if (sp > .5) { p.vx *= .5 / sp; p.vy *= .5 / sp; }
        if (sp < .05) { p.vx += (Math.random() - .5) * .02; p.vy += (Math.random() - .5) * .02; }
        p.x += p.vx * k; p.y += p.vy * k;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      }
      // links
      ctx.lineWidth = 1;
      for (var a = 0; a < nodes.length; a++) {
        var A = nodes[a];
        for (var b = a + 1; b < nodes.length; b++) {
          var B = nodes[b], d = Math.hypot(A.x - B.x, A.y - B.y);
          if (d > LINK) continue;
          var near = Math.max(0, 1 - Math.min(Math.hypot(mouse.x - A.x, mouse.y - A.y), Math.hypot(mouse.x - B.x, mouse.y - B.y)) / 220);
          var al = (1 - d / LINK) * (.16 + near * .4);
          var g = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
          g.addColorStop(0, 'rgba(' + A.c + ',' + al + ')'); g.addColorStop(1, 'rgba(' + B.c + ',' + al + ')');
          ctx.strokeStyle = g;
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        }
      }
      // nodes
      for (var j = 0; j < nodes.length; j++) {
        var q = nodes[j];
        q.ph += .02 * k;
        var glow = .55 + Math.sin(q.ph) * .25 + Math.max(0, 1 - Math.hypot(mouse.x - q.x, mouse.y - q.y) / 160) * .6;
        ctx.fillStyle = 'rgba(' + q.c + ',' + Math.min(1, glow) + ')';
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fill();
        if (q.r > 2) { ctx.fillStyle = 'rgba(' + q.c + ',.12)'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 4, 0, 6.283); ctx.fill(); }
      }
      // pulses travelling along links
      if (Math.random() < (mode === 'stage' ? .09 : .06) * k && pulses.length < 26) spawnPulse();
      for (var m = pulses.length - 1; m >= 0; m--) {
        var u = pulses[m]; u.t += u.sp * k;
        if (u.t >= 1 || Math.hypot(u.a.x - u.b.x, u.a.y - u.b.y) > LINK * 1.2) { pulses.splice(m, 1); continue; }
        var x = u.a.x + (u.b.x - u.a.x) * u.t, y = u.a.y + (u.b.y - u.a.y) * u.t;
        var rg = ctx.createRadialGradient(x, y, 0, x, y, 9);
        rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(.35, 'rgba(' + u.c + ',.7)'); rg.addColorStop(1, 'rgba(' + u.c + ',0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.fill();
      }
    }

    var raf = 0, visible = false;
    function loop(now) { raf = 0; if (!visible || document.hidden || !host.isConnected) return; frame(now); raf = requestAnimationFrame(loop); }
    function kick() { if (!raf && visible && !reduce) { last = 0; raf = requestAnimationFrame(loop); } }

    seed();
    if (reduce) { for (var s = 0; s < 3; s++) spawnPulse(); frame(16); }
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; kick(); }).observe(host);
    new ResizeObserver(function () { var r = host.getBoundingClientRect(); if (Math.abs(r.width - W) > 2 || Math.abs(r.height - H) > 40) { seed(); if (reduce) frame(16); } }).observe(host);
    document.addEventListener('visibilitychange', kick);
    host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    host.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
  }

  function init() { document.querySelectorAll('[data-ai-bg]').forEach(start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.CollaboAiBg = { start: start, init: init };
})();
