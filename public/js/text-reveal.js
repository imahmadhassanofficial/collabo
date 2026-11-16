/* Word-by-word blur + fade reveal for section headings and their intro text, on every page.
   Each word starts blurred and transparent and sharpens in, one after another, when its block scrolls into view.
   Inline elements inside a heading (e.g. the gradient "Anywhere.") are kept whole and revealed as one word.
   Self-contained; injects its own CSS. Skips everything when reduced motion is on. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  var HEADINGS = [
    '._76_heading', '._96_heading', '._96_heading-2', '.h1_72', '._64_heading', '._40_text',
    '.work_head_container h2', '.hero_description_container ._48_heading', '.form_heading ._48_heading',
    '.tag_text_contain ._14_p'
  ];
  var TEXTS = [
    '.description_hero_game ._22_p', '.descrption_work_game ._16_p', '.descrption_work_game ._22_p', '.work_head_container ._16_p',
    '.service_descri-ption ._22_p', '.add_head_containe ._22_p', '.description_block_container ._28_serotiva',
    '.compaire_description ._24_vietnam', '.contact_description ._24_p', '.collabo_description ._24_paragraph'
  ];
  var SKIP = '.m-menu,.ch,.cw,.ck,.wk-modal,.cl-loader,.card-stack,.wk-card,.agency_word,.demo-card-3,[data-no-reveal]';

  var st = document.createElement('style');
  st.textContent =
    '.tr-w{display:inline-block;white-space:pre;opacity:0;filter:blur(12px);transform:translateY(.35em);' +
    'transition:opacity .7s ease,filter .7s ease,transform .7s cubic-bezier(.2,.8,.2,1);transition-delay:calc(var(--i)*40ms + var(--d,0ms))}' +
    '.tr-in .tr-w{opacity:1;filter:blur(0);transform:none}';
  document.head.appendChild(st);

  function split(el, delay) {
    if (el.dataset.tr || el.querySelector('.pr-w,.tr-w') || el.closest(SKIP)) return false;
    el.dataset.tr = '1';
    if (!el.textContent.trim()) return false;
    var i = 0, frag = document.createDocumentFragment();
    function word(content) {
      var s = document.createElement('span');
      s.className = 'tr-w';
      s.style.setProperty('--i', String(i++)); s.style.setProperty('--d', delay + 'ms');
      if (typeof content === 'string') s.textContent = content; else s.appendChild(content);
      frag.appendChild(s);
    }
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
          else word(part);
        });
      } else if (n.nodeName === 'BR') {
        frag.appendChild(n);
      } else if (n.nodeType === 1) {
        word(n);                                   // keep inline elements (gradient spans etc.) whole
      }
    });
    el.textContent = '';
    el.appendChild(frag);
    return true;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('tr-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  var found = [];
  function prepare() {
    HEADINGS.forEach(function (sel) { document.querySelectorAll(sel).forEach(function (el) { if (split(el, 0)) found.push(el); }); });
    TEXTS.forEach(function (sel) { document.querySelectorAll(sel).forEach(function (el) { if (split(el, 300)) found.push(el); }); });
  }
  function watch() { found.forEach(function (el) { io.observe(el); }); }
  function init() {
    prepare();
    // if the intro loader is showing, start once it has gone so the hero words animate while visible
    if (document.documentElement.classList.contains('cl-loading')) {
      var started = false, go = function () { if (!started) { started = true; watch(); } };
      addEventListener('collabo:loader-done', go, { once: true });
      setTimeout(go, 7000);
    } else watch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
