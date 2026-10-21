// ==UserScript==
// @name         freescore
// @namespace    freescore
// @version      2.1.0
// @description  Download MIDI, MP3, PDF from musescore.com
// @author       freescore
// @match        https://musescore.com/*
// @icon         https://musescore.com/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';
  console.log('[msdl] v2.1.0 loading...');

  // ─── CONFIG ────────────────────────────────────────────────────────────────
  var API_DOMAIN = 'https://musescore.com';
  var SCORE_ID_SEL = "meta[property='al:ios:url']";
  var TITLE_SEL = "meta[property='og:title']";
  var BTN_SECTION_SEL = '#ELEMENT_ID_SCORE_DOWNLOAD_SECTION > section';

  // ─── UTILITIES ─────────────────────────────────────────────────────────────
  function escapeFilename(s) {
    return s.replace(/[\s<>:{}"/\\|?*~.\0\x01-\x1f]+/g, '_');
  }

  // ─── MD5 ───────────────────────────────────────────────────────────────────
  function md5(str) {
    function rol(v, n) { n &= 31; return ((v << n) | ((v >>> 0) >>> (32 - n))) >>> 0; }
    function safeAdd(x, y) { var lsw = (x & 0xffff) + (y & 0xffff); return (lsw >> 16) + (x >> 16) + (y >> 16) << 16 | lsw & 0xffff; }
    function C(q, a, b, x, s, t) { return safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
    function FF(a, b, c, d, x, s, t) { return C((b & c) | ((~b) & d), a, b, x, s, t); }
    function GG(a, b, c, d, x, s, t) { return C((b & d) | (c & (~d)), a, b, x, s, t); }
    function HH(a, b, c, d, x, s, t) { return C(b ^ c ^ d, a, b, x, s, t); }
    function II(a, b, c, d, x, s, t) { return C(c ^ (b | (~d)), a, b, x, s, t); }
    var sl = str.length, bl = ((sl + 8) >> 6) + 1, bk = new Array(bl * 16), i;
    for (i = 0; i < bl * 16; i++) bk[i] = 0;
    for (i = 0; i < sl; i++) bk[i >> 2] |= (str.charCodeAt(i) & 0xff) << ((i % 4) * 8);
    bk[sl >> 2] |= 0x80 << ((sl % 4) * 8);
    bk[bl * 16 - 2] = sl * 8;
    var a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
    for (i = 0; i < bl; i++) {
      var oa = a, ob = b, oc = c, od = d, w = bk.slice(i * 16, i * 16 + 16);
      a = FF(a, b, c, d, w[0], 7, 0xd76aa478); d = FF(d, a, b, c, w[1], 12, 0xe8c7b756); c = FF(c, d, a, b, w[2], 17, 0x242070db); b = FF(b, c, d, a, w[3], 22, 0xc1bdceee);
      a = FF(a, b, c, d, w[4], 7, 0xf57c0faf); d = FF(d, a, b, c, w[5], 12, 0x4787c62a); c = FF(c, d, a, b, w[6], 17, 0xa8304613); b = FF(b, c, d, a, w[7], 22, 0xfd469501);
      a = FF(a, b, c, d, w[8], 7, 0x698098d8); d = FF(d, a, b, c, w[9], 12, 0x8b44f7af); c = FF(c, d, a, b, w[10], 17, 0xffff5bb1); b = FF(b, c, d, a, w[11], 22, 0x895cd7be);
      a = FF(a, b, c, d, w[12], 7, 0x6b901122); d = FF(d, a, b, c, w[13], 12, 0xfd987193); c = FF(c, d, a, b, w[14], 17, 0xa679438e); b = FF(b, c, d, a, w[15], 22, 0x49b40821);
      a = GG(a, b, c, d, w[1], 5, 0xf61e2562); d = GG(d, a, b, c, w[6], 9, 0xc040b340); c = GG(c, d, a, b, w[11], 14, 0x265e5a51); b = GG(b, c, d, a, w[0], 20, 0xe9b6c7aa);
      a = GG(a, b, c, d, w[5], 5, 0xd62f105d); d = GG(d, a, b, c, w[10], 9, 0x02441453); c = GG(c, d, a, b, w[15], 14, 0xd8a1e681); b = GG(b, c, d, a, w[4], 20, 0xe7d3fbc8);
      a = GG(a, b, c, d, w[9], 5, 0x21e1cde6); d = GG(d, a, b, c, w[14], 9, 0xc33707d6); c = GG(c, d, a, b, w[3], 14, 0xf4d50d87); b = GG(b, c, d, a, w[8], 20, 0x455a14ed);
      a = GG(a, b, c, d, w[13], 5, 0xa9e3e905); d = GG(d, a, b, c, w[2], 9, 0xfcefa3f8); c = GG(c, d, a, b, w[7], 14, 0x676f02d9); b = GG(b, c, d, a, w[12], 20, 0x8d2a4c8a);
      a = HH(a, b, c, d, w[5], 4, 0xfffa3942); d = HH(d, a, b, c, w[8], 11, 0x8771f681); c = HH(c, d, a, b, w[11], 16, 0x6d9d6122); b = HH(b, c, d, a, w[14], 23, 0xfde5380c);
      a = HH(a, b, c, d, w[1], 4, 0xa4beea44); d = HH(d, a, b, c, w[4], 11, 0x4bdecfa9); c = HH(c, d, a, b, w[7], 16, 0xf6bb4b60); b = HH(b, c, d, a, w[10], 23, 0xbebfbc70);
      a = HH(a, b, c, d, w[13], 4, 0x289b7ec6); d = HH(d, a, b, c, w[0], 11, 0xeaa127fa); c = HH(c, d, a, b, w[3], 16, 0xd4ef3085); b = HH(b, c, d, a, w[6], 23, 0x04881d05);
      a = HH(a, b, c, d, w[9], 4, 0xd9d4d039); d = HH(d, a, b, c, w[12], 11, 0xe6db99e5); c = HH(c, d, a, b, w[15], 16, 0x1fa27cf8); b = HH(b, c, d, a, w[2], 23, 0xc4ac5665);
      a = II(a, b, c, d, w[0], 6, 0xf4292244); d = II(d, a, b, c, w[7], 10, 0x432aff97); c = II(c, d, a, b, w[14], 15, 0xab9423a7); b = II(b, c, d, a, w[5], 21, 0xfc93a039);
      a = II(a, b, c, d, w[12], 6, 0x655b59c3); d = II(d, a, b, c, w[3], 10, 0x8f0ccc92); c = II(c, d, a, b, w[10], 15, 0xffeff47d); b = II(b, c, d, a, w[1], 21, 0x85845dd1);
      a = II(a, b, c, d, w[8], 6, 0x6fa87e4f); d = II(d, a, b, c, w[15], 10, 0xfe2ce6e0); c = II(c, d, a, b, w[6], 15, 0xa3014314); b = II(b, c, d, a, w[13], 21, 0x4e0811a1);
      a = II(a, b, c, d, w[4], 6, 0xf7537e82); d = II(d, a, b, c, w[11], 10, 0xbd3af235); c = II(c, d, a, b, w[2], 15, 0x2ad7d2bb); b = II(b, c, d, a, w[9], 21, 0xeb86d391);
      a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od);
    }
    function leHex(v) { return ((v >>> 0).toString(16).padStart(8, '0')).match(/../g).reverse().join(''); }
    return leHex(a) + leHex(b) + leHex(c) + leHex(d);
  }

  // ─── SCORE METADATA ────────────────────────────────────────────────────────
  function getScoreId() {
    var meta = document.querySelector(SCORE_ID_SEL);
    if (!meta) return 0;
    var m = meta.content.match(/(\d+)$/);
    return m ? +m[1] : 0;
  }

  function getScoreTitle() {
    var meta = document.querySelector(TITLE_SEL);
    return meta ? meta.content : 'score';
  }

  // ─── SUFFIX EXTRACTION ─────────────────────────────────────────────────────
  var suffixCache = null;
  var suffixPromise = null;

  function extractBundleUrls() {
    var urls = [];
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      if (src && src.indexOf('/static/public/build/musescore') !== -1 && /20\d{4}/.test(src) && src.slice(-3) === '.js') {
        urls.push(src);
      }
    }
    var links = document.querySelectorAll('link[rel="modulepreload"],link[href*=".js"]');
    for (var j = 0; j < links.length; j++) {
      var href = links[j].href;
      if (href && href.indexOf('/static/public/build/musescore') !== -1 && /20\d{4}/.test(href) && href.slice(-3) === '.js') {
        urls.push(href);
      }
    }
    try {
      performance.getEntriesByType('resource').forEach(function(e) {
        if (e.name && e.name.indexOf('/static/public/build/musescore') !== -1 && /20\d{4}/.test(e.name) && e.name.slice(-3) === '.js') {
          urls.push(e.name);
        }
      });
    } catch(e) {}
    return urls.filter(function(v, idx, a) { return a.indexOf(v) === idx; });
  }

  function getSuffix() {
    if (suffixCache) return Promise.resolve(suffixCache);
    if (suffixPromise) return suffixPromise;
    suffixPromise = (function () {
      var urls = extractBundleUrls();
      if (urls.length === 0) return Promise.resolve(null);
      function tryNext(i) {
        if (i >= urls.length) return null;
        return fetch(urls[i])
          .then(function (r) { return r.text(); })
          .then(function (text) {
            var m = text.match(/"([^"]+)"\)\.substr\(0,4\)/);
            if (m) { suffixCache = m[1]; return suffixCache; }
            return tryNext(i + 1);
          })
          .catch(function () { return tryNext(i + 1); });
      }
      return tryNext(0);
    })();
    return suffixPromise;
  }

  function computeAuth(id, type, index, suffix) {
    return md5(String(id) + type + String(index) + suffix).slice(0, 4);
  }

  // ─── API CALL ──────────────────────────────────────────────────────────────
  function getFileUrl(id, type, index) {
    return getSuffix().then(function (suffix) {
      if (!suffix) throw new Error('Suffix not found');
      var auth = computeAuth(id, type, index, suffix);
      var url = API_DOMAIN + '/api/jmuse?id=' + id + '&type=' + type + '&index=' + index;
      return fetch(url, { headers: { Authorization: auth } }).then(function (r) {
        if (!r.ok) throw new Error('jmuse API returned ' + r.status);
        return r.json();
      }).then(function (data) {
        if (data.result !== 'success' || !data.info || !data.info.url) {
          throw new Error('jmuse API error: ' + JSON.stringify(data.error));
        }
        return data.info.url;
      });
    });
  }

  // ─── DOWNLOAD ──────────────────────────────────────────────────────────────
  function downloadBlob(blob, fileName) {
    var blobUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    a.dispatchEvent(new MouseEvent('click'));
    setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 100);
  }

  var dlCache = {};

  function doDownload(btn, type, id, fileExt) {
    var originalText = btn.textContent;
    btn.textContent = '...';
    btn.disabled = true;
    var cacheKey = type + ':' + id;
    if (dlCache[cacheKey]) {
      downloadBlob(dlCache[cacheKey], escapeFilename(getScoreTitle()) + '.' + fileExt);
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }
    getFileUrl(id, type, 0).then(function (fileUrl) {
      return fetch(fileUrl).then(function (r) {
        if (!r.ok) throw new Error('Download fetch failed: ' + r.status);
        var contentLength = r.headers.get('Content-Length');
        if (!contentLength) return r.blob();
        var total = parseInt(contentLength, 10);
        var loaded = 0;
        var reader = r.body.getReader();
        var stream = new ReadableStream({
          start: function (controller) {
            function push() {
              reader.read().then(function (chunk) {
                if (chunk.done) { controller.close(); btn.textContent = originalText; btn.disabled = false; return; }
                loaded += chunk.value.byteLength;
                btn.textContent = Math.round((loaded / total) * 100) + '%';
                controller.enqueue(chunk.value);
                push();
              });
            }
            push();
          }
        });
        return new Response(stream).blob();
      });
    }).then(function (blob) {
      dlCache[cacheKey] = blob;
      downloadBlob(blob, escapeFilename(getScoreTitle()) + '.' + fileExt);
      btn.textContent = originalText;
      btn.disabled = false;
    }).catch(function (err) {
      console.error('[msdl] Download failed:', err);
      btn.textContent = 'ERR';
      btn.disabled = false;
      setTimeout(function () { btn.textContent = originalText; }, 2000);
    });
  }

  // ─── BUTTON UI ─────────────────────────────────────────────────────────────
  function createBtn(label, bg) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.style.cssText =
      'display:inline-flex;align-items:center;justify-content:center;' +
      'padding:6px 14px;margin:3px;border:none;border-radius:4px;' +
      'cursor:pointer;font-size:13px;font-weight:600;min-width:54px;' +
      'color:#fff;background:' + bg + ';transition:opacity 0.15s;';
    btn.addEventListener('mouseenter', function () { btn.style.opacity = '0.85'; });
    btn.addEventListener('mouseleave', function () { btn.style.opacity = '1'; });
    return btn;
  }

  function injectButtons() {
    if (document.getElementById('msdl-container')) return;

    var id = getScoreId();
    if (!id) { setTimeout(injectButtons, 2000); return; }

    var btnSection = document.querySelector(BTN_SECTION_SEL);
    if (!btnSection) { setTimeout(injectButtons, 1500); return; }

    try { window.UGAPP.store.score.xtz.is_allowed = false; } catch (e) {}
    try {
      var origAE = window.addEventListener;
      window.addEventListener = function (type, listener, options) {
        if (type === 'devtoolschange') return;
        return origAE.call(this, type, listener, options);
      };
    } catch (e) {}

    var container = document.createElement('div');
    container.id = 'msdl-container';
    container.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;padding:6px 0;';

    var midiBtn = createBtn('MIDI', '#2563eb');
    var mp3Btn = createBtn('MP3', '#059669');
    var pdfBtn = createBtn('PDF', '#dc2626');

    midiBtn.addEventListener('click', function () { doDownload(midiBtn, 'midi', id, 'mid'); });
    mp3Btn.addEventListener('click', function () { doDownload(mp3Btn, 'mp3', id, 'mp3'); });
    pdfBtn.addEventListener('click', function () {
      pdfBtn.textContent = '...'; pdfBtn.disabled = true;
      var pageCount;
      try { pageCount = window.UGAPP.store.page.data.score.pages_count; } catch (e) { pageCount = 0; }
      if (pageCount > 0) {
        var baseUrl;
        try {
          var imgMeta = document.querySelector("meta[property='og:image']");
          if (imgMeta) { var mm = imgMeta.content.match(/^(.+\/)score_/); if (mm) baseUrl = mm[1]; }
        } catch (e) {}
        if (baseUrl) {
          var imgType = 'png';
          var testImg = document.querySelector("img[src*='score_0']");
          if (testImg && testImg.src) { imgType = testImg.src.split('@')[0].split('.').pop() || 'png'; }
          var imgUrls = [];
          for (var p = 0; p < pageCount; p++) { imgUrls.push(baseUrl + 'score_' + p + '.' + imgType + '@0'); }
          var frame = document.createElement('iframe');
          frame.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;border:none;';
          frame.srcdoc = '<html><head><style>body{margin:0;padding:0;}img{width:100%;display:block;page-break-after:always;}</style></head><body>' +
            imgUrls.map(function (u) { return '<img src="' + u + '">'; }).join('') + '</body></html>';
          document.body.appendChild(frame);
          frame.onload = function () {
            setTimeout(function () {
              frame.contentWindow.print();
              setTimeout(function () { if (frame.parentNode) frame.parentNode.removeChild(frame); pdfBtn.textContent = 'PDF'; pdfBtn.disabled = false; }, 500);
            }, 500);
          };
        } else { pdfBtn.textContent = 'N/A'; pdfBtn.disabled = false; setTimeout(function () { pdfBtn.textContent = 'PDF'; }, 2000); }
      } else { window.print(); pdfBtn.textContent = 'PDF'; pdfBtn.disabled = false; }
    });

    container.appendChild(midiBtn);
    container.appendChild(mp3Btn);
    container.appendChild(pdfBtn);
    btnSection.parentElement.insertBefore(container, btnSection.nextSibling);
  }

  // ─── INIT ──────────────────────────────────────────────────────────────────
  function waitForSheet() {
    return new Promise(function (resolve) {
      function check() {
        try { window.UGAPP.store.score.xtz.is_allowed = false; } catch (e) {}
        var section = document.querySelector(BTN_SECTION_SEL);
        var scroller = document.querySelector('#jmuse-scroller-component div') || document.querySelector('#xtz_canvas');
        return !!(section && scroller);
      }
      if (check()) { console.log('[msdl] sheet already loaded'); resolve(); return; }
      var observer = new MutationObserver(function () { if (check()) { observer.disconnect(); resolve(); } });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(function () { observer.disconnect(); console.log('[msdl] observer timeout, injecting anyway'); resolve(); }, 15000);
    });
  }

  waitForSheet().then(function () { injectButtons(); }).catch(function(e) { console.error('[msdl] waitForSheet error:', e); });
  console.log('[msdl] v2.1.0 — observer installed');
})();