/* Hero stars: twinkling 5-point stars inside .hero_game_container,.head_block. Self-contained; injects its own CSS. */
(function () {
  var SEL = '.hero_game_container,.head_block', N = [10, 7], P = 'cs-hero';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = '.' + P + '{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden;border-radius:inherit}' +
    '.' + P + ' i{position:absolute;width:max(3px,.208vw);height:max(3px,.208vw);background:#fff;opacity:.35;' +
    'clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);' +
    'filter:drop-shadow(0 0 2.6px rgba(255,255,255,.78));animation:' + P + ' 5s ease-in-out infinite}' +
    '@media(max-width:767px){.' + P + ' i{width:4px;height:4px}}' +
    '@keyframes ' + P + '{0%,100%{opacity:.35}50%{opacity:.95}}' +
    '@media(prefers-reduced-motion:reduce){.' + P + ' i{animation:none;opacity:.7}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function rng(s) { return function () { s = (s + 0x6d2b79f5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function boxes(host) { // everything stars must not sit on: text, media, controls, moving cards
    var out = [], w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT), n, r = document.createRange();
    while ((n = w.nextNode())) if (n.nodeValue.trim() && !n.parentElement.closest('.' + P)) { r.selectNodeContents(n); out.push.apply(out, r.getClientRects()); }
    host.querySelectorAll('img,video,iframe,canvas,svg,input,textarea,select,button,.radial-cards-marquee,[data-stars-avoid]').forEach(function (e) { out.push(e.getBoundingClientRect()); });
    return out.filter(function (b) { return b.width && b.height; });
  }
  function build(host) {
    var L = host.querySelector(':scope>.' + P);
    if (!L) {
      var cs = getComputedStyle(host);
      if (cs.position === 'static') host.style.position = 'relative';
      if (cs.zIndex === 'auto') host.style.isolation = 'isolate'; // keeps the z-index:-1 layer above the host background
      L = document.createElement('div'); L.className = P; L.setAttribute('aria-hidden', 'true'); host.prepend(L);
    }
    L.textContent = '';
    var mob = innerWidth <= 767, R = host.getBoundingClientRect(), W = R.width, H = R.height, vw = innerWidth / 100;
    var avoid = boxes(host), pad = mob ? 14 : 2 * vw, gap = mob ? 56 : 9 * vw, want = N[mob ? 1 : 0], pts = [];
    var rand = rng((location.pathname.length + 7) * 9973 + (mob ? 1 : 0));
    for (var t = 0; t < 600 && pts.length < want; t++) {
      var x = rand() * W, y = rand() * H;
      if (x < pad || x > W - pad || y < pad || y > H - pad) continue;
      if (mob && x > W * .22 && x < W * .78) continue; // phones: keep to the edges, away from centred text
      var ax = R.left + x, ay = R.top + y, m = mob ? 10 : 1.2 * vw;
      if (avoid.some(function (b) { return ax > b.left - m && ax < b.right + m && ay > b.top - m && ay < b.bottom + m; })) continue;
      if (pts.some(function (p) { return Math.hypot(p[0] - x, p[1] - y) < gap; })) continue;
      pts.push([x, y]);
    }
    pts.forEach(function (p) {
      var s = document.createElement('i');
      s.style.left = mob ? (p[0] / W * 100) + '%' : (p[0] / vw) + 'vw';
      s.style.top = mob ? p[1] + 'px' : (p[1] / vw) + 'vw';
      s.style.animationDuration = (4 + rand() * 3).toFixed(2) + 's';
      s.style.animationDelay = (-rand() * 5).toFixed(2) + 's';
      L.appendChild(s);
    });
  }
  function run() { document.querySelectorAll(SEL).forEach(function (h, i) { if (i < 1) build(h); }); }
  var lastW = 0, tm;
  function go() { lastW = innerWidth; run(); }
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
  if (document.fonts) document.fonts.ready.then(go);
  addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(function () { if (innerWidth !== lastW) go(); }, 250); });
})();
