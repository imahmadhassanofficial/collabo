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
    replay: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M2 1.8v3.4h3.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg width="16" height="16" viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor"/></svg>',
    muted: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor"/><path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    sound: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor"/><path d="M11.5 5.5a3.5 3.5 0 010 5M13 3.5a6 6 0 010 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };

  // ---------- mock publisher page around an ad (like an ad platform's preview) ----------
  function mockPage(device, slot, w, h) {
    var line = function (wd, ht, mb) { return '<i class="ln" style="width:' + wd + ';height:' + (ht || 12) + 'px;margin-bottom:' + (mb || 10) + 'px"></i>'; };
    var para = function (n) { var s = ''; for (var i = 0; i < n; i++) s += line(i === n - 1 ? '62%' : (88 + (i * 7) % 12) + '%'); return '<div class="p">' + s + '</div>'; };
    var ad = '<div class="ad"><span class="lbl">Advertisement</span><div class="slot" style="width:' + w + 'px;height:' + h + 'px">' + slot + '</div></div>';
    // the ad sits near the top of the article, like an ad platform's preview (rich-media formats such as swells and
    // scrollers position themselves against the viewport, so a top slot keeps the creative and its slot together)
    var big = device === 'Mobile' ? 22 : 30;
    var body = '<main>' + line('34%', 10, 18) + ad + line('80%', big, 12) + line('55%', big, 22) + '<div class="hero"></div>' + para(4) + para(5) + para(4) + '<div class="hero"></div>' + para(5) + para(3) + para(4) + '</main>';
    var pad = device === 'Mobile' ? 18 : device === 'Tablet' ? 40 : 56;
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">' +
      '<style>*{box-sizing:border-box}html,body{margin:0;background:#fff;font-family:system-ui,sans-serif}' +
      '.nav{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;height:' + (device === 'Mobile' ? 56 : 68) + 'px;padding:0 ' + pad + 'px;background:#fff;border-bottom:1px solid #eef0f4}' +
      '.logo{width:' + (device === 'Mobile' ? 96 : 130) + 'px;height:18px;border-radius:9px;background:#d9dde6}.menu{display:flex;gap:10px}.menu i{display:block;width:' + (device === 'Mobile' ? 22 : 64) + 'px;height:' + (device === 'Mobile' ? 4 : 10) + 'px;border-radius:5px;background:#e4e7ee}' +
      'main{padding:' + (device === 'Mobile' ? 16 : 32) + 'px ' + pad + 'px 60px;max-width:' + (device === 'Desktop' ? 980 : 1200) + 'px;margin:0 auto}' +
      '.ln{display:block;border-radius:6px;background:#eceef3}.p{margin:0 0 22px}' +
      '.hero{height:' + (device === 'Mobile' ? 190 : 320) + 'px;border-radius:14px;background:linear-gradient(135deg,#eceef3,#f6f7f9);margin:6px 0 26px}' +
      '.ad{display:flex;flex-direction:column;align-items:center;margin:8px 0 30px}.lbl{font:500 10px/1 system-ui;letter-spacing:.12em;text-transform:uppercase;color:#a3abb8;margin-bottom:8px}' +
      '.slot{position:relative;overflow:hidden;background:#f6f7f9;flex:none}.slot>iframe{display:block;border:0;width:100%;height:100%}' +
      '</style></head><body><div class="nav"><span class="logo"></span><span class="menu"><i></i><i></i>' + (device === 'Mobile' ? '' : '<i></i><i></i>') + '</span></div>' + body + '</body></html>';
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

    var vw = 0, vh = 0, frameKind = 'None';

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
        scr.appendChild(f);
        if (device === 'Desktop') dev.setAttribute('data-url', (item.client || 'publisher').toLowerCase().replace(/[^a-z0-9]+/g, '') + '-news.com');
      } else if (type === 'url') {
        frameKind = d.frame === 'none' ? 'None' : d.frame === 'browser' ? 'Desktop' : (item.device === 'CTV' ? 'CTV' : item.device || 'Desktop');
        var base = VIEW[frameKind === 'None' ? (item.device === 'Mobile' ? 'Mobile' : 'Desktop') : frameKind] || VIEW.Desktop;
        vw = d.width || base[0]; vh = d.height || base[1];
        var u = document.createElement('iframe');
        u.title = item.title + ' demo'; u.src = d.src; u.setAttribute('allow', 'autoplay; fullscreen; clipboard-write');
        scr.appendChild(u);
        if (frameKind === 'Desktop') { try { dev.setAttribute('data-url', new URL(d.src, location.href).host); } catch (e) {} }
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
      if (type !== 'video') {
        var rb = document.createElement('button'); rb.type = 'button'; rb.className = 'cd-btn cd-replay';
        rb.innerHTML = ICON.replay + '<span>Replay</span>';
        rb.addEventListener('click', build);
        ctrl.appendChild(rb);
      }
      opts.controls.innerHTML = ''; opts.controls.appendChild(ctrl);
    }

    build();
    var ro = new ResizeObserver(function () { size(); }); ro.observe(stage);

    return {
      destroy: function () { ro.disconnect(); root.remove(); if (ctrl) ctrl.remove(); },
      device: function () { return device; }
    };
  }

  window.CollaboDemo = { mount: mount };
})();
