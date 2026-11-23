/* Collabo demo player — shows a Work demo in its real format inside a device frame.
   Used by the Work popup (WorkModal.astro) and the full preview page (/work/<slug>).

   CollaboDemo.mount(stageEl, item, { controls }) → { destroy() }
     stageEl   element with a fixed height; the demo is scaled to fit it
     item      a Work entry (src/content/work/*.json): uses item.device, item.title, item.demo
     controls  optional element that receives the device switcher + replay button
     maxHeight optional px (or function → px): the stage's height then follows the demo, up to this

   demo.type
     tag    an ad tag (Celtra, ad server, …) pasted as HTML in demo.tag. Shown on a mock publisher page
            in a phone / tablet / desktop, like an ad-platform preview. Needs width + height.
     html5  a hosted HTML5 banner (index.html) shown the same way. Needs width + height.
     url    a whole page (hosted demo page, ad-server test page). Shown in a browser or device frame.
            width/height = the page's viewport (defaults per device).
     vast   a VAST / VPAID ad tag (demo.src = tag URL, or demo.mid = Collabo ad-server media id) played in a real
            VAST 4 / VPAID 2 JS video player (Google IMA HTML5 SDK), so only the ad itself is shown
     video  MP4 with our player (muted autoplay, sound button if demo.audio)
     image  JPG/PNG (mockups); shown as-is, scaled to fit
   Self-contained: injects its own CSS. */
(function () {
  if (window.CollaboDemo) return;

  var CSS = [
    '.cd{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden}',
    '.cd-fit{position:relative;flex:none}',
    '.cd-dev{position:absolute;left:0;top:0;transform-origin:0 0;box-shadow:0 40px 80px -30px rgba(0,0,0,.75)}',
    '.cd-scr{position:relative;overflow:hidden;background:#fff;width:100%;height:100%}',
    '.cd-scr iframe{display:block;border:0;width:100%;height:100%;background:#fff}',
    '.cd-scr>img{display:block;width:100%;height:100%;object-fit:contain;background:#0b0b14}',
    /* bezels */
    '.cd-dev[data-frame="Mobile"]{background:#0d0d12;border-radius:58px;padding:14px}',
    '.cd-dev[data-frame="Mobile"] .cd-scr{border-radius:44px}',
    '.cd-dev[data-frame="Mobile"]::after{content:"";position:absolute;left:50%;top:26px;width:110px;height:30px;margin-left:-55px;border-radius:20px;background:#0d0d12;z-index:2}',
    '.cd-dev[data-frame="Tablet"]{background:#0d0d12;border-radius:44px;padding:22px}',
    '.cd-dev[data-frame="Tablet"] .cd-scr{border-radius:22px}',
    '.cd-dev[data-frame="Desktop"]{background:#e9ebf0;border-radius:16px;padding:44px 0 0;overflow:hidden}',
    '.cd-dev[data-frame="Desktop"]::before{content:"";position:absolute;left:18px;top:16px;width:48px;height:12px;background:radial-gradient(circle,#f78071 5px,transparent 5.5px) 0 0/16px 12px repeat-x}',
    '.cd-dev[data-frame="Desktop"]::after{content:attr(data-url);position:absolute;left:90px;right:90px;top:9px;height:26px;border-radius:13px;background:#fff;color:#677b94;font:400 13px/26px "Be Vietnam Pro",sans-serif;text-align:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:0 14px}',
    '.cd-dev[data-frame="CTV"]{background:#0d0d12;border-radius:14px;padding:14px}',
    '.cd-dev[data-frame="None"]{border-radius:16px;overflow:hidden}',
    /* controls */
    '.cd-ctrl{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.cd-seg{display:inline-flex;padding:4px;border-radius:99px;background:rgba(4,9,26,.06);gap:2px}',
    '.cd-btn{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 15px;border:0;border-radius:99px;background:transparent;color:#1c3a60;font:500 14px/1 "Be Vietnam Pro",sans-serif;cursor:pointer;transition:background-color .2s,color .2s}',
    '.cd-btn:hover{background:rgba(4,9,26,.08)}',
    '.cd-btn[aria-pressed="true"]{background:#04091a;color:#fff}',
    '.cd-btn svg{flex:none}',
    '.cd-replay{border:1.5px solid #1c3a60}',
    '.cd-ctrl.is-dark .cd-seg{background:rgba(255,255,255,.1)}',
    '.cd-ctrl.is-dark .cd-btn{color:#fff}',
    '.cd-ctrl.is-dark .cd-btn:hover{background:rgba(255,255,255,.14)}',
    '.cd-ctrl.is-dark .cd-btn[aria-pressed="true"]{background:#fff;color:#04091a}',
    '.cd-ctrl.is-dark .cd-replay{border-color:rgba(255,255,255,.4)}',
    /* video player */
    '.cd-vp{position:absolute;inset:0;background:#000}',
    '.cd-vp video{width:100%;height:100%;object-fit:contain;display:block}',
    '.cd-vp__bar{position:absolute;left:14px;right:14px;bottom:14px;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:99px;background:rgba(4,9,26,.55);backdrop-filter:blur(8px);opacity:0;transition:opacity .25s}',
    '.cd-vp:hover .cd-vp__bar,.cd-vp.is-paused .cd-vp__bar,.cd-vp:focus-within .cd-vp__bar{opacity:1}',
    '@media (hover:none){.cd-vp__bar{opacity:1}}',
    '.cd-vp__b{flex:none;width:34px;height:34px;border:0;border-radius:50%;background:#fff;color:#04091a;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}',
    '.cd-vp__p{flex:1;height:5px;border-radius:5px;background:rgba(255,255,255,.3);cursor:pointer;position:relative}',
    '.cd-vp__p i{position:absolute;inset:0 auto 0 0;width:0;background:#f78071;border-radius:5px}',
    '.cd-vp__big{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:84px;height:84px;border-radius:50%;border:0;background:rgba(255,255,255,.92);display:none;align-items:center;justify-content:center;cursor:pointer;color:#04091a}',
    '.cd-vp.is-paused .cd-vp__big{display:flex}',
    '.cd-load{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;background:#f4f5f8;transition:opacity .5s}',
    '.cd-load.is-done{opacity:0;pointer-events:none}',
    '.cd-load i{width:44px;height:44px;border-radius:50%;border:3px solid rgba(90,79,224,.18);border-top-color:#5a4fe0;animation:cd-spin .8s linear infinite}',
    '@keyframes cd-spin{to{transform:rotate(360deg)}}',
    '.cd-hint{position:absolute;left:50%;bottom:16px;z-index:4;translate:-50% 0;display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:99px;background:rgba(4,9,26,.72);backdrop-filter:blur(10px);color:#fff;font:500 13px/1.2 "Be Vietnam Pro",sans-serif;white-space:nowrap;pointer-events:none;transition:opacity .5s,translate .5s;animation:cd-in .6s .4s both}',
    '.cd-hint.is-gone{opacity:0;translate:-50% 10px}',
    '.cd-hint svg{animation:cd-tap 1.6s ease-in-out infinite}',
    '@keyframes cd-in{from{opacity:0;translate:-50% 12px}}',
    '@keyframes cd-tap{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}',
    '.cd-host:fullscreen{background:radial-gradient(90% 80% at 50% 100%,#2a1f7a 0%,#0b0a24 55%,#04040c 100%)!important;border-radius:0!important}',
    '.cd-host:-webkit-full-screen{background:#0b0a24!important}',
    '.cd-ima{position:absolute;inset:0;background:#000}',
    '.cd-ima video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}',
    '.cd-ima__ads{position:absolute;inset:0}',
    '.cd-ima__cover{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center;color:#fff;background:center/cover no-repeat #07070d;cursor:pointer;border:0;padding:0;width:100%;font:inherit}',
    '.cd-ima__cover[hidden]{display:none}',
    '.cd-ima__cover:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(7,7,13,.35),rgba(7,7,13,.8))}',
    '.cd-ima__cover>*{position:relative}',
    '.cd-ima__play{width:120px;height:120px;border-radius:50%;background:#fff;color:#04091a;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 0 rgba(255,255,255,.45);animation:cd-pulse 2s infinite;transition:transform .3s}',
    '.cd-ima__cover:hover .cd-ima__play{transform:scale(1.06)}',
    '@keyframes cd-pulse{70%{box-shadow:0 0 0 26px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}',
    '.cd-ima__tag{display:inline-flex;gap:8px;align-items:center;padding:10px 18px;border-radius:99px;background:rgba(255,255,255,.14);backdrop-filter:blur(8px);font:500 22px/1 "Be Vietnam Pro",sans-serif;letter-spacing:.04em}',
    '.cd-ima__msg{font:400 26px/1.4 "Be Vietnam Pro",sans-serif;max-width:70%}',
    '.cd-ima__bar{position:absolute;left:0;right:0;bottom:0;z-index:2;height:6px;background:rgba(255,255,255,.15)}',
    '.cd-ima__bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#26aeee,#5a4fe0,#ed6673)}',
    '.cd-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#fff;font:400 28px/1.2 Zodiak,Arial,sans-serif;background:linear-gradient(160deg,#5a4fe0,#131313)}'
  ].join('');
  // (re)added on every mount: a page change can drop it from <head>
  function ensureCss() {
    if (document.querySelector('style[data-cd]')) return;
    var st = document.createElement('style'); st.setAttribute('data-cd', ''); st.setAttribute('data-keep', ''); st.textContent = CSS; document.head.appendChild(st);
  }
  ensureCss();

  // Viewports in CSS px, as the real devices would render the page
  var VIEW = { Mobile: [390, 844], Tablet: [820, 1180], Desktop: [1440, 900], CTV: [1920, 1080] };
  var BEZEL = { Mobile: [28, 28], Tablet: [44, 44], Desktop: [0, 44], CTV: [28, 28], None: [0, 0] };

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var abs = function (u) { try { return new URL(u, location.href).href; } catch (e) { return u; } };
  var ICON = {
    Mobile: '<svg width="14" height="16" viewBox="0 0 14 16" fill="none"><rect x="2" y="1" width="10" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M6 12.5h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    Tablet: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1" width="13" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M7 12.5h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    Desktop: '<svg width="18" height="16" viewBox="0 0 18 16" fill="none"><rect x="1" y="1.5" width="16" height="10" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M6 14.5h6M9 11.5v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    auto: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="4" y="1.5" width="8" height="13" rx="4" stroke="currentColor" stroke-width="1.6"/><path d="M8 4.5v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    full: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    replay: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M2 1.8v3.4h3.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg width="16" height="16" viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor"/></svg>',
    muted: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor"/><path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    sound: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor"/><path d="M11.5 5.5a3.5 3.5 0 010 5M13 3.5a6 6 0 010 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };

  // ---------- mock publisher page around an ad (like an ad platform's preview) ----------
  // A believable publisher article (like GumGum / Celtra previews) so the ad is seen in context: masthead, headline,
  // byline, illustrated hero, real copy, the ad slot near the top, more copy and related stories below.
  var COPY = [
    'There is a moment, usually around the second cup of coffee, when a weekend plan stops being a list and starts being a trip. The best ones are rarely the most expensive; they are the ones that leave room for a detour.',
    'Locals will tell you the trick is to go slightly out of season. The crowds thin out, the light gets softer, and the places that were booked solid all summer suddenly have a table by the window.',
    'Start with the food. A good market says more about a town than any museum, and the stalls that open earliest are usually the ones worth queuing for. Ask what is in season and order that.',
    'Then walk. Pick a direction, leave the map in your pocket and give yourself an hour. The side streets are where the small galleries, record shops and bakeries hide, and where the day tends to happen.',
    'By late afternoon, find somewhere high. A rooftop, a hill, a lighthouse: it does not matter, as long as you can watch the town switch its lights on. It is the cheapest show in any city and it never sells out.',
    'Before you head home, write down three things you would do differently next time. It is the easiest way to turn one good weekend into a habit.'
  ];
  function mockPage(device, slot, w, h) {
    var mob = device === 'Mobile';
    var pad = mob ? 18 : device === 'Tablet' ? 40 : 56;
    var p = function (i) { return '<p>' + COPY[i % COPY.length] + '</p>'; };
    var ad = '<div class="ad"><span class="lbl">Advertisement</span><div class="slot" style="width:' + w + 'px;height:' + h + 'px">' + slot + '</div></div>';
    var status = (mob || device === 'Tablet') ? '<div class="sb"><b>9:41</b><span><i class="sig"></i><i class="wifi"></i><i class="bat"></i></span></div>' : '';
    var related = '<section class="rel"><h3>More stories</h3><div class="cards">' +
      ['A slow weekend by the water', 'Where to eat this fall', 'Ten trails worth the drive'].map(function (t, i) {
        return '<a class="card"><span class="img i' + i + '"></span><span>' + t + '</span></a>';
      }).join('') + '</div></section>';
    // the ad sits near the top of the article: rich-media formats (swells, scrollers) position themselves against
    // the viewport, so a top slot keeps the creative and its slot together
    var body = '<main>' + ad + '<span class="kicker">Travel &amp; Weekend</span><h1>The art of the slow weekend: how to see a town like a local</h1>' +
      '<div class="by"><i></i><span>By Maya Torres · 6 min read</span></div>' + p(0) + '<div class="hero"><span></span></div>' + p(1) + p(2) + '<blockquote>The best trips leave room for a detour.</blockquote>' + p(3) + p(4) + p(5) + related + '</main>';
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">' +
      '<style>*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#1d222b;font-family:Georgia,"Times New Roman",serif;-webkit-font-smoothing:antialiased}' +
      '.sb{position:sticky;top:0;z-index:6;display:flex;justify-content:space-between;align-items:center;height:' + (mob ? 46 : 30) + 'px;padding:' + (mob ? '12px 30px 0' : '0 24px') + ';background:#fff;font:600 ' + (mob ? 15 : 12) + 'px/1 system-ui,sans-serif}' +
      '.sb span{display:flex;gap:6px;align-items:center}.sig{width:17px;height:10px;background:linear-gradient(90deg,#1d222b 0 3px,transparent 3px 5px,#1d222b 5px 8px,transparent 8px 10px,#1d222b 10px 13px,transparent 13px 14px,#1d222b 14px) bottom/100% 100% no-repeat;clip-path:polygon(0 100%,100% 0,100% 100%)}' +
      '.wifi{width:14px;height:10px;border-radius:14px 14px 0 0;background:#1d222b;clip-path:polygon(50% 100%,0 0,100% 0)}.bat{width:24px;height:11px;border:1.5px solid #1d222b;border-radius:3px;background:linear-gradient(90deg,#1d222b 70%,transparent 70%) 1px 1px/calc(100% - 2px) calc(100% - 2px) no-repeat}' +
      '.nav{position:sticky;top:' + (status ? (mob ? 46 : 30) : 0) + 'px;z-index:5;display:flex;align-items:center;justify-content:space-between;height:' + (mob ? 52 : 64) + 'px;padding:0 ' + pad + 'px;background:#fff;border-bottom:1px solid #eceef2}' +
      '.logo{font:700 ' + (mob ? 19 : 24) + 'px/1 Georgia,serif;letter-spacing:-.02em}.logo em{font-style:normal;color:#d94a3a}.menu{display:flex;gap:' + (mob ? 0 : 22) + 'px;font:500 13px/1 system-ui,sans-serif;color:#5b6472}' +
      '.menu .bur{width:22px;height:14px;background:linear-gradient(#1d222b,#1d222b) top/100% 2px no-repeat,linear-gradient(#1d222b,#1d222b) center/100% 2px no-repeat,linear-gradient(#1d222b,#1d222b) bottom/100% 2px no-repeat}' +
      'main{padding:' + (mob ? 18 : 36) + 'px ' + pad + 'px 60px;max-width:' + (device === 'Desktop' ? 860 : 1200) + 'px;margin:0 auto}' +
      '.kicker{display:block;font:700 11px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#d94a3a;margin-bottom:12px}' +
      'h1{margin:0 0 14px;font:700 ' + (mob ? 26 : 40) + 'px/1.15 Georgia,serif;letter-spacing:-.01em}' +
      '.by{display:flex;align-items:center;gap:10px;font:400 13px/1 system-ui,sans-serif;color:#6b7380;margin-bottom:20px}.by i{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f2b8a2,#c0617d)}' +
      'p{margin:0 0 18px;font-size:' + (mob ? 17 : 19) + 'px;line-height:1.65;color:#2b313c}' +
      'blockquote{margin:26px 0;padding-left:18px;border-left:3px solid #d94a3a;font:italic 400 ' + (mob ? 21 : 26) + 'px/1.35 Georgia,serif;color:#1d222b}' +
      '.hero{position:relative;height:' + (mob ? 200 : 340) + 'px;border-radius:12px;overflow:hidden;margin:8px 0 26px;background:linear-gradient(180deg,#f7c59f 0%,#ef8f72 38%,#7d4e7a 70%,#2c2f5a 100%)}' +
      '.hero:before{content:"";position:absolute;left:12%;top:24%;width:' + (mob ? 46 : 80) + 'px;height:' + (mob ? 46 : 80) + 'px;border-radius:50%;background:#ffe7b3;box-shadow:0 0 60px 20px rgba(255,231,179,.5)}' +
      '.hero span{position:absolute;left:0;right:0;bottom:0;height:55%;background:linear-gradient(160deg,transparent 30%,#24284d 31%) 0 0/50% 100% repeat-x,linear-gradient(200deg,transparent 40%,#1b1e3c 41%) 30% 0/40% 100% repeat-x}' +
      '.ad{display:flex;flex-direction:column-reverse;align-items:center;margin:0 0 28px;padding:0 0 14px;border-bottom:1px solid #eceef2}.lbl{font:600 10px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#a3abb8;margin-top:10px}' +
      '.slot{position:relative;overflow:hidden;background:#f4f5f8;flex:none}.slot>iframe{display:block;border:0;width:100%;height:100%}' +
      '.rel{margin-top:34px;padding-top:20px;border-top:2px solid #1d222b}.rel h3{margin:0 0 16px;font:700 13px/1 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}' +
      '.cards{display:grid;grid-template-columns:repeat(' + (mob ? 1 : 3) + ',1fr);gap:16px}.card{display:flex;' + (mob ? 'align-items:center;' : 'flex-direction:column;') + 'gap:10px;font:700 ' + (mob ? 15 : 16) + 'px/1.3 Georgia,serif;color:#1d222b}' +
      '.card .img{flex:none;' + (mob ? 'width:92px;height:64px' : 'height:120px') + ';border-radius:8px}.i0{background:linear-gradient(135deg,#8fd3e8,#3a7bd5)}.i1{background:linear-gradient(135deg,#f6d365,#fda085)}.i2{background:linear-gradient(135deg,#a8e063,#56ab2f)}' +
      '</style></head><body>' + status + '<div class="nav"><span class="logo">The Weekend<em>.</em></span><span class="menu">' + (mob ? '<i class="bur"></i>' : '<span>Travel</span><span>Food</span><span>Style</span><span>Culture</span>') + '</span></div>' + body + '</body></html>';
  }


  // ---------- video ----------
  function videoPlayer(d) {
    var wrap = document.createElement('div'); wrap.className = 'cd-vp';
    wrap.innerHTML = '<video playsinline muted loop preload="metadata"' + (d.poster ? ' poster="' + esc(d.poster) + '"' : '') + ' src="' + esc(d.src) + '"></video>' +
      '<button type="button" class="cd-vp__big" aria-label="Play">' + ICON.play + '</button>' +
      '<div class="cd-vp__bar"><button type="button" class="cd-vp__b cd-vp__play" aria-label="Pause">' + ICON.pause + '</button>' +
      '<div class="cd-vp__p" role="slider" aria-label="Seek" tabindex="0"><i></i></div>' +
      (d.audio ? '<button type="button" class="cd-vp__b cd-vp__mute" aria-label="Turn sound on">' + ICON.muted + '</button>' : '') + '</div>';
    var v = wrap.querySelector('video'), play = wrap.querySelector('.cd-vp__play'), prog = wrap.querySelector('.cd-vp__p'), bar = prog.querySelector('i'), mute = wrap.querySelector('.cd-vp__mute');
    var sync = function () { wrap.classList.toggle('is-paused', v.paused); play.innerHTML = v.paused ? ICON.play : ICON.pause; play.setAttribute('aria-label', v.paused ? 'Play' : 'Pause'); };
    var toggle = function () { if (v.paused) v.play(); else v.pause(); };
    play.addEventListener('click', toggle); wrap.querySelector('.cd-vp__big').addEventListener('click', toggle); v.addEventListener('click', toggle);
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    v.addEventListener('timeupdate', function () { bar.style.width = (v.duration ? (v.currentTime / v.duration) * 100 : 0) + '%'; });
    var seek = function (x) { var r = prog.getBoundingClientRect(); if (v.duration) v.currentTime = Math.max(0, Math.min(1, (x - r.left) / r.width)) * v.duration; };
    prog.addEventListener('click', function (e) { seek(e.clientX); });
    prog.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') v.currentTime += 5; if (e.key === 'ArrowLeft') v.currentTime -= 5; });
    if (mute) mute.addEventListener('click', function () { v.muted = !v.muted; mute.innerHTML = v.muted ? ICON.muted : ICON.sound; mute.setAttribute('aria-label', v.muted ? 'Turn sound on' : 'Mute'); });
    var p = v.play(); if (p && p.catch) p.catch(sync);
    return wrap;
  }

  // ---------- VAST / VPAID (Google IMA HTML5 SDK) ----------
  var imaReady = null;
  function loadIma() {
    if (window.google && google.ima) return Promise.resolve();
    if (!imaReady) imaReady = new Promise(function (res, rej) {
      var sc = document.createElement('script'); sc.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
      sc.onload = res; sc.onerror = function () { imaReady = null; rej(new Error('IMA SDK did not load')); };
      document.head.appendChild(sc);
    });
    return imaReady;
  }
  function vastUrl(d) {
    var u = d.src || ('https://sdk.collabollc.com/servlet/vast4/media?mid=' + d.mid);
    // fresh request each play (cache-buster), as a real player would send
    return u + (u.indexOf('?') < 0 ? '?' : '&') + 'cb=' + Date.now();
  }
  function vastPlayer(d, item) {
    var box = document.createElement('div'); box.className = 'cd-ima';
    var poster = d.poster || (item.thumbnails && item.thumbnails[0]) || '';
    box.innerHTML = '<video playsinline muted preload="none"></video><div class="cd-ima__ads"></div><div class="cd-ima__bar"><i></i></div>' +
      '<button type="button" class="cd-ima__cover"' + (poster ? ' style="background-image:url(' + esc(poster) + ')"' : '') + '>' +
      '<span class="cd-ima__play"><svg width="44" height="44" viewBox="0 0 14 14"><path d="M3.5 1.5v11l9-5.5z" fill="currentColor"/></svg></span>' +
      '<span class="cd-ima__tag">VAST · VPAID ad</span></button>';
    var video = box.querySelector('video'), ads = box.querySelector('.cd-ima__ads'), cover = box.querySelector('.cd-ima__cover'), bar = box.querySelector('.cd-ima__bar i');
    var manager = null, loader = null, adc = null, tick = 0;
    var W = function () { return box.offsetWidth || 1280; }, H = function () { return box.offsetHeight || 720; };

    function show(msg, again) {
      cover.hidden = false;
      cover.innerHTML = (again ? '<span class="cd-ima__play"><svg width="40" height="40" viewBox="0 0 16 16" fill="none"><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M2 1.8v3.4h3.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '') +
        '<span class="cd-ima__msg">' + msg + '</span>';
    }
    function finish() { clearInterval(tick); bar.style.width = '0'; show('That was the full ad. Play it again?', true); }
    function fail(e) {
      clearInterval(tick);
      console.warn('VAST demo', e && e.getError ? e.getError().toString() : e);
      show('This ad could not play here.' + (d.previewUrl ? ' Use “Open original preview”.' : ''), true);
    }
    function play() {
      cover.hidden = true;
      loadIma().then(function () {
        var ima = google.ima;
        ima.settings.setVpaidMode(ima.ImaSdkSettings.VpaidMode.INSECURE); // VPAID 2 JS overlays/endcards need the page
        if (!adc) { adc = new ima.AdDisplayContainer(ads, video); }
        adc.initialize();
        if (manager) { try { manager.destroy(); } catch (x) {} manager = null; }
        loader = new ima.AdsLoader(adc);
        loader.addEventListener(ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, function (ev) {
          var st = new ima.AdsRenderingSettings(); st.restoreCustomPlaybackStateOnAdBreakComplete = true;
          manager = ev.getAdsManager(video, st);
          manager.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, fail);
          manager.addEventListener(ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, finish);
          manager.addEventListener(ima.AdEvent.Type.ALL_ADS_COMPLETED, finish);
          manager.addEventListener(ima.AdEvent.Type.STARTED, function () {
            clearInterval(tick);
            tick = setInterval(function () { try { var ad = manager.getCurrentAd(), dur = ad ? ad.getDuration() : 0, rem = manager.getRemainingTime(); if (dur > 0) bar.style.width = Math.max(0, Math.min(100, (1 - rem / dur) * 100)) + '%'; } catch (x) {} }, 250);
          });
          try { manager.init(W(), H(), ima.ViewMode.NORMAL); manager.start(); } catch (x) { fail(x); }
        });
        loader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, fail);
        var req = new ima.AdsRequest();
        req.adTagUrl = vastUrl(d);
        req.linearAdSlotWidth = W(); req.linearAdSlotHeight = H();
        req.nonLinearAdSlotWidth = W(); req.nonLinearAdSlotHeight = Math.round(H() / 3);
        req.setAdWillAutoPlay(true); req.setAdWillPlayMuted(false);
        loader.requestAds(req);
      }).catch(fail);
    }
    cover.addEventListener('click', play);
    box.__destroy = function () { clearInterval(tick); try { manager && manager.destroy(); } catch (x) {} try { adc && adc.destroy(); } catch (x) {} };
    return box;
  }

  // ---------- mount ----------
  function mount(stage, item, opts) {
    opts = opts || {};
    ensureCss();
    var d = item.demo || null;
    var type = d ? d.type : null;
    var placement = type === 'tag' || type === 'html5';
    var devices = placement ? ((d.devices && d.devices.length) ? d.devices : ['Mobile', 'Desktop']) : [item.device === 'CTV' ? 'CTV' : item.device];
    var device = devices.indexOf(item.device) >= 0 ? item.device : devices[0];

    var root = document.createElement('div'); root.className = 'cd';
    var fit = document.createElement('div'); fit.className = 'cd-fit';
    var dev = document.createElement('div'); dev.className = 'cd-dev';
    var scr = document.createElement('div'); scr.className = 'cd-scr';
    dev.appendChild(scr); fit.appendChild(dev); root.appendChild(fit);
    stage.appendChild(root);

    var vw = 0, vh = 0, frameKind = 'None', frameEl = null, autoRaf = 0;
    stage.classList.add('cd-host');

    // spinner over the screen until the demo has loaded
    function loading(iframe, extra) {
      var l = document.createElement('div'); l.className = 'cd-load'; l.innerHTML = '<i></i>';
      scr.appendChild(l);
      var done = function () { setTimeout(function () { l.classList.add('is-done'); setTimeout(function () { l.remove(); }, 600); }, extra || 0); };
      iframe.addEventListener('load', done, { once: true });
      setTimeout(done, 6000);
    }

    // a short "how to interact" tip under the device, gone after a few seconds or the first touch
    var HINTS = { tag: 'Scroll the page and tap the ad', html5: 'Scroll the page and tap the ad', url: 'Click and play inside the demo', video: 'Press play · turn the sound on', vast: 'Press play to run the ad in a VAST / VPAID player' };
    var hint = null;
    if (d && HINTS[type] && opts.hint !== false) {
      hint = document.createElement('div'); hint.className = 'cd-hint';
      hint.innerHTML = '<svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true"><path d="M5 7V2.5a1.5 1.5 0 013 0V7l3.2.8A2 2 0 0112.7 10l-.6 3.2A2.2 2.2 0 0110 15H6.6a2 2 0 01-1.6-.8L2.3 10.7a1.3 1.3 0 012-1.6L5 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' + HINTS[type];
      root.appendChild(hint);
      var hide = function () { if (hint) { hint.classList.add('is-gone'); } };
      setTimeout(hide, 5500);
      stage.addEventListener('pointerdown', hide, { once: true });
    }

    // auto-scroll the sample page (shows scroll-driven formats like swells and scrollers without touching anything)
    function autoScroll(btn) {
      if (autoRaf) { cancelAnimationFrame(autoRaf); autoRaf = 0; btn.setAttribute('aria-pressed', 'false'); return; }
      var w = frameEl && frameEl.contentWindow; if (!w) return;
      btn.setAttribute('aria-pressed', 'true');
      var dir = 1, pause = 0, lastT = 0;
      var step = function (t) {
        var dt = Math.min(50, t - (lastT || t)); lastT = t;
        var doc = w.document.documentElement, max = doc.scrollHeight - w.innerHeight;
        if (pause > 0) pause -= dt;
        else {
          var y = w.scrollY + dir * dt * 0.12;
          if (y >= max) { y = max; dir = -1; pause = 900; } else if (y <= 0) { y = 0; dir = 1; pause = 900; }
          w.scrollTo(0, y);
        }
        autoRaf = requestAnimationFrame(step);
      };
      autoRaf = requestAnimationFrame(step);
    }
    function stopAuto() { if (autoRaf) { cancelAnimationFrame(autoRaf); autoRaf = 0; var b = ctrl && ctrl.querySelector('.cd-auto'); if (b) b.setAttribute('aria-pressed', 'false'); } }

    function size() {
      var bz = BEZEL[frameKind] || [0, 0];
      var W = vw + bz[0], H = vh + bz[1];
      dev.style.width = W + 'px'; dev.style.height = H + 'px';
      var pad = opts.pad == null ? 24 : opts.pad;
      var r = stage.getBoundingClientRect();
      var s;
      if (opts.maxHeight) {
        // stage height follows the demo (no empty bands around wide pages on phones), up to maxHeight
        var mh = typeof opts.maxHeight === 'function' ? opts.maxHeight() : opts.maxHeight;
        s = Math.min((r.width - pad * 2) / W, (mh - pad * 2) / H);
        var want = Math.round(H * s + pad * 2);
        if (Math.abs(r.height - want) > 1) stage.style.height = want + 'px';
      } else {
        s = Math.min((r.width - pad * 2) / W, (r.height - pad * 2) / H);
      }
      if (!(s > 0)) s = 0.3;
      dev.style.transform = 'scale(' + s + ')';
      fit.style.width = W * s + 'px'; fit.style.height = H * s + 'px';
    }

    function build() {
      stopAuto(); frameEl = null;
      var old = scr.querySelector('.cd-ima'); if (old && old.__destroy) old.__destroy();
      scr.innerHTML = '';
      dev.removeAttribute('data-url');
      if (!d) {
        frameKind = item.device === 'CTV' ? 'CTV' : (item.device || 'Desktop'); vw = VIEW[frameKind][0]; vh = VIEW[frameKind][1];
        var t = item.thumbnails && item.thumbnails[0];
        scr.innerHTML = t ? '<img src="' + esc(t) + '" alt="' + esc(item.title) + '">' : '<div class="cd-empty">' + esc(item.client || item.title) + '</div>';
      } else if (placement) {
        frameKind = device; vw = VIEW[device][0]; vh = VIEW[device][1];
        var w = d.width || 300, h = d.height || 250;
        var slot = type === 'tag' ? d.tag : '<iframe src="' + esc(abs(d.src)) + '" width="' + w + '" height="' + h + '" scrolling="no" allow="autoplay; fullscreen"></iframe>';
        var f = document.createElement('iframe');
        f.title = item.title + ' demo';
        f.setAttribute('allow', 'autoplay; fullscreen; clipboard-write');
        f.srcdoc = mockPage(device, slot, w, h);
        scr.appendChild(f); frameEl = f; loading(f, 900);
        if (device === 'Desktop') dev.setAttribute('data-url', (item.client || 'publisher').toLowerCase().replace(/[^a-z0-9]+/g, '') + '-news.com');
      } else if (type === 'url') {
        frameKind = d.frame === 'none' ? 'None' : d.frame === 'browser' ? 'Desktop' : (item.device === 'CTV' ? 'CTV' : item.device || 'Desktop');
        var base = VIEW[frameKind === 'None' ? (item.device === 'Mobile' ? 'Mobile' : 'Desktop') : frameKind] || VIEW.Desktop;
        vw = d.width || base[0]; vh = d.height || base[1];
        var u = document.createElement('iframe');
        u.title = item.title + ' demo'; u.src = d.src; u.setAttribute('allow', 'autoplay; fullscreen; clipboard-write');
        scr.appendChild(u); loading(u, 300);
        if (frameKind === 'Desktop') { try { dev.setAttribute('data-url', new URL(d.src, location.href).host); } catch (e) {} }
      } else if (type === 'vast') {
        frameKind = d.frame === 'device' ? (item.device === 'CTV' ? 'CTV' : item.device || 'Desktop') : 'None';
        vw = d.width || 1280; vh = d.height || 720;
        if (frameKind === 'Mobile' || frameKind === 'Tablet') { vw = VIEW[frameKind][0]; vh = Math.round(vw * 9 / 16); }
        scr.appendChild(vastPlayer(d, item));
      } else if (type === 'video') {
        frameKind = d.frame === 'none' ? 'None' : (item.device === 'CTV' ? 'CTV' : item.device || 'Desktop');
        var vv = VIEW[frameKind === 'None' ? 'Desktop' : frameKind]; vw = d.width || vv[0]; vh = d.height || vv[1];
        if (frameKind === 'None' && !d.width) { vw = 1600; vh = 900; }
        scr.appendChild(videoPlayer(d));
      } else if (type === 'image') {
        frameKind = d.frame === 'device' ? (item.device || 'Desktop') : d.frame === 'browser' ? 'Desktop' : 'None';
        var iv = VIEW[frameKind] || [1600, 1000]; vw = d.width || iv[0]; vh = d.height || iv[1];
        var img = new Image(); img.alt = item.title; img.src = d.src;
        img.onload = function () { if (frameKind === 'None' && !d.width) { vw = img.naturalWidth; vh = img.naturalHeight; size(); } };
        scr.appendChild(img);
      }
      dev.setAttribute('data-frame', frameKind);
      size();
    }

    // controls: device switcher (ads on a page) + replay
    var ctrl = null;
    if (opts.controls && d && type !== 'image') {
      ctrl = document.createElement('div'); ctrl.className = 'cd-ctrl' + (opts.dark ? ' is-dark' : '');
      if (devices.length > 1) {
        var seg = document.createElement('div'); seg.className = 'cd-seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Preview device');
        devices.forEach(function (name) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'cd-btn'; b.dataset.device = name;
          b.innerHTML = (ICON[name] || '') + '<span>' + (name === 'Mobile' ? 'Phone' : name) + '</span>';
          b.setAttribute('aria-pressed', String(name === device));
          b.addEventListener('click', function () {
            device = name;
            seg.querySelectorAll('.cd-btn').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.device === name)); });
            build();
          });
          seg.appendChild(b);
        });
        ctrl.appendChild(seg);
      }
      if (placement) {
        var ab = document.createElement('button'); ab.type = 'button'; ab.className = 'cd-btn cd-replay cd-auto'; ab.setAttribute('aria-pressed', 'false');
        ab.innerHTML = ICON.auto + '<span>Auto-scroll</span>';
        ab.addEventListener('click', function () { autoScroll(ab); });
        ctrl.appendChild(ab);
      }
      if (type !== 'video') {
        var rb = document.createElement('button'); rb.type = 'button'; rb.className = 'cd-btn cd-replay';
        rb.innerHTML = ICON.replay + '<span>Replay</span>';
        rb.addEventListener('click', build);
        ctrl.appendChild(rb);
      }
      if (stage.requestFullscreen && opts.fullscreen !== false) {
        var fb = document.createElement('button'); fb.type = 'button'; fb.className = 'cd-btn cd-replay'; fb.setAttribute('aria-label', 'Full screen');
        fb.innerHTML = ICON.full + '<span>Full screen</span>';
        fb.addEventListener('click', function () { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen().catch(function () {}); });
        ctrl.appendChild(fb);
      }
      opts.controls.innerHTML = ''; opts.controls.appendChild(ctrl);
    }

    build();
    var ro = new ResizeObserver(function () { size(); }); ro.observe(stage);

    return {
      destroy: function () { var o = scr.querySelector('.cd-ima'); if (o && o.__destroy) o.__destroy(); stopAuto(); ro.disconnect(); root.remove(); if (ctrl) ctrl.remove(); stage.classList.remove('cd-host'); },
      device: function () { return device; }
    };
  }

  window.CollaboDemo = { mount: mount };
})();
