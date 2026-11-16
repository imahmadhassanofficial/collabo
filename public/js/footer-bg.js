/* Footer background: same dark brand base and colour glows as the heroes, but with its own effect —
   a perspective grid "horizon" in the logo colours that scrolls slowly toward the viewer.
   The footer's twinkling stars and shooting stars (footer-stars.js / footer-shooting-star.js) sit on top. */
(function () {
  var host = document.querySelector('.footer_sections');
  if (!host) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var st = document.createElement('style');
  st.textContent =
    'html body .footer_sections:not(#_z){background:#07070d !important;background-image:none !important}' +
    '.fb-glow,.fb-grid{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit}' +
    '.fb-glow{z-index:-3;background:' +
      'radial-gradient(circle at 8% 30%,rgba(48,107,231,.38),rgba(90,79,224,.14) 24%,rgba(48,107,231,0) 46%),' +
      'radial-gradient(circle at 92% 22%,rgba(155,46,194,.38),rgba(237,102,115,.14) 24%,rgba(155,46,194,0) 46%),' +
      'radial-gradient(ellipse 70% 45% at 50% 100%,rgba(90,79,224,.45),rgba(90,79,224,0) 70%)}' +
    '.fb-grid{z-index:-2}.fb-grid canvas{display:block;width:100%;height:100%}' +
    '.fb-dots{position:absolute;inset:0;z-index:-2;pointer-events:none;border-radius:inherit;' +
      'background-image:radial-gradient(rgba(255,255,255,.2) 1px,transparent 1.3px);background-size:22px 22px;' +
      '-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 75%);mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 75%)}';
  document.head.appendChild(st);

  var cs = getComputedStyle(host);
  if (cs.position === 'static') host.style.position = 'relative';
  if (cs.zIndex === 'auto') host.style.isolation = 'isolate';

  var glow = document.createElement('div'); glow.className = 'fb-glow'; glow.setAttribute('aria-hidden', 'true');
  var wrap = document.createElement('div'); wrap.className = 'fb-grid'; wrap.setAttribute('aria-hidden', 'true');
  var cvs = document.createElement('canvas'); wrap.appendChild(cvs);
  var dots = document.createElement('div'); dots.className = 'fb-dots'; dots.setAttribute('aria-hidden', 'true');
  host.prepend(dots); host.prepend(wrap); host.prepend(glow);
  var ctx = cvs.getContext('2d');

  var W = 0, H = 0, dpr = 1, horizon = 0;
  function size() {
    var b = host.getBoundingClientRect();
    W = b.width; H = b.height; dpr = Math.min(2, devicePixelRatio || 1);
    cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
    horizon = H * (innerWidth <= 767 ? 0.66 : 0.6);
  }

  var offset = 0;
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var depth = H - horizon, cx = W / 2;
    var grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#26aeee'); grad.addColorStop(.35, '#5a4fe0'); grad.addColorStop(.65, '#9b2ec2'); grad.addColorStop(1, '#ed6673');
    ctx.strokeStyle = grad; ctx.lineWidth = 1;

    // horizontal lines: closer together near the horizon, moving toward the viewer
    var ROWS = 14;
    for (var i = 0; i < ROWS; i++) {
      var t = (i + offset) / ROWS;              // 0 at horizon -> 1 at bottom
      var y = horizon + depth * t * t;
      ctx.globalAlpha = 0.30 * t * t;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // vertical lines converging on a vanishing point at the horizon centre
    var COLS = innerWidth <= 767 ? 14 : 28, spread = W * 2.4;
    for (var k = 0; k <= COLS; k++) {
      var xb = cx - spread / 2 + spread * (k / COLS);
      // fade each converging line in from the horizon
      var lg = ctx.createLinearGradient(0, horizon, 0, H);
      lg.addColorStop(0, 'rgba(143,148,255,0)'); lg.addColorStop(1, 'rgba(143,148,255,.28)');
      ctx.strokeStyle = lg; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(cx + (xb - cx) * 0.04, horizon); ctx.lineTo(xb, H); ctx.stroke();
    }
  }

  var visible = false, last = 0, raf = 0;
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    offset = (offset + Math.min(48, now - (last || now)) / 4000) % 1; // one row every 4s
    last = now; draw(); raf = requestAnimationFrame(loop);
  }
  function start() { if (!reduce && !raf) { last = 0; raf = requestAnimationFrame(loop); } }

  size(); draw();
  new ResizeObserver(function () { size(); draw(); }).observe(host);
  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }).observe(host);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
})();
