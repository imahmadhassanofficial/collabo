/* Footer shooting star: one shooting star at a time inside .footer_sections (1s fall + 1.5s gap). Self-contained. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SEL = '.footer_sections', P = 'ss-foot', FOOT = true;
  var st = document.createElement('style');
  st.textContent = '.' + P + '{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden;border-radius:inherit}' +
    '.' + P + ' b{position:absolute;left:0;top:0;width:clamp(70px,9vw,170px);height:1.5px;border-radius:2px;opacity:0;transform-origin:0 50%;' +
    'background:linear-gradient(90deg,transparent,rgba(255,255,255,.9));filter:drop-shadow(0 0 4px rgba(255,255,255,.7))}';
  document.head.appendChild(st);
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function setup(host) {
    var cs = getComputedStyle(host);
    if (cs.position === 'static') host.style.position = 'relative';
    if (cs.zIndex === 'auto') host.style.isolation = 'isolate';
    var L = document.createElement('div'); L.className = P; L.setAttribute('aria-hidden', 'true');
    var s = document.createElement('b'); L.appendChild(s); host.prepend(L);
    var vis = false, busy = false;

    function fall() {
      var W = host.clientWidth, H = host.clientHeight, mob = innerWidth <= 767, vw = innerWidth / 100;
      var x = (.3 + Math.random() * .6) * W;
      var y = mob ? 70 + Math.random() * 150 : (6 + Math.random() * 12) * vw;
      y = Math.min(y, H * .55);
      var d = FOOT ? 20 * vw : mob ? .45 * W : 26 * vw;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.animate([
        { transform: 'rotate(150deg) translateX(0)', opacity: 0 },
        { opacity: 1, offset: .15 },
        { transform: 'rotate(150deg) translateX(' + d + 'px)', opacity: 0 }
      ], { duration: 1000, easing: 'ease-out' });
    }
    async function loop() {
      if (busy) return; busy = true;
      while (vis && !document.hidden) { fall(); await wait(1000); await wait(1500); }
      busy = false;
    }
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis) loop(); }).observe(host);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && vis) loop(); });
  }
  function go() { document.querySelectorAll(SEL).forEach(function (h, i) { if (i < 1) setup(h); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
