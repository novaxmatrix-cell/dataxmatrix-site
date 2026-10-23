// Theme toggle, mobile menu, language switch. The initial theme is set inline in <head> to avoid a flash.
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-btn');
  function current() {
    return root.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  if (btn) {
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }
  var menu = document.getElementById('menu-btn');
  var header = document.querySelector('header');
  if (menu && header) {
    menu.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('open')) {
        header.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
        menu.focus();
      }
    });
  }
  // Guide videos use preload="none"; posters load only when a video comes near the viewport.
  var vids = document.querySelectorAll('video[data-poster]');
  function poster(v) { v.poster = v.getAttribute('data-poster'); v.removeAttribute('data-poster'); }
  if (vids.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { poster(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '300px' });
    Array.prototype.forEach.call(vids, function (v) { io.observe(v); });
  } else {
    Array.prototype.forEach.call(vids, poster);
  }

  // Scroll reveal (CSS only animates .rv when prefers-reduced-motion allows it).
  var rv = document.querySelectorAll('.rv');
  if (rv.length && 'IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(rv, function (el) { ro.observe(el); });
  } else {
    Array.prototype.forEach.call(rv, function (el) { el.classList.add('in'); });
  }

  // Home: the DataX grid lights Iris's square, then zooms into it once and lands on the Iris section
  // (same colour). CSS makes the stage tall and sticky only with JS and when motion is welcome.
  var stage = document.querySelector('.zoom');
  if (stage && 'IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    var zs = stage.querySelector('.zs'), zw = stage.querySelector('.zgw'), zi = stage.querySelector('.zi'), zc = stage.querySelector('.zcap');
    var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var queued = false;
    var draw = function () {
      queued = false;
      var vh = innerHeight, top = stage.getBoundingClientRect().top;
      var z = clamp(-top / (stage.offsetHeight - zs.offsetHeight));
      var e = clamp((z - .08) / .92); e = e * e * (3 - 2 * e);
      var w = zw.offsetWidth, dy = zs.offsetHeight / 2 + 34 - (zw.offsetTop + .87 * w);
      var s = Math.pow(1.06 * Math.max(innerWidth, vh) / (.26 * w), e);
      zi.style.opacity = clamp((.5 * vh - top) / (.5 * vh));
      zc.style.opacity = 1 - clamp(z / .3);
      zw.style.transform = 'translateY(' + (dy * e).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
    };
    var req = function () { if (!queued) { queued = true; requestAnimationFrame(draw); } };
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); }
      else { removeEventListener('scroll', req); removeEventListener('resize', req); }
      draw();
    }).observe(stage);
  }

  // Promo video in a dialog. The link falls back to the plain mp4 without JS or <dialog>.
  var dlg = document.getElementById('promo');
  var promo = document.querySelector('[data-promo]');
  if (dlg && promo && dlg.showModal) {
    var pv = dlg.querySelector('video');
    promo.addEventListener('click', function (e) {
      e.preventDefault();
      if (pv.getAttribute('data-src')) { pv.src = pv.getAttribute('data-src'); pv.removeAttribute('data-src'); }
      dlg.showModal();
      var p = pv.play(); if (p && p.catch) p.catch(function () {});
    });
    dlg.querySelector('.x').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { pv.pause(); promo.focus(); });
  }

  // Language switch: remember the choice so English pages stop sending this visitor to Arabic (and vice versa).
  Array.prototype.forEach.call(document.querySelectorAll('a[data-lang]'), function (a) {
    a.addEventListener('click', function () { try { localStorage.setItem('lang', a.getAttribute('data-lang')); } catch (e) {} });
  });

  // Copy buttons: data-copy="<id of the element whose text to copy>".
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (b) {
    b.addEventListener('click', function () {
      var t = document.getElementById(b.getAttribute('data-copy')).textContent.trim();
      var label = b.textContent;
      var done = function () { b.textContent = b.getAttribute('data-done'); setTimeout(function () { b.textContent = label; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () {});
    });
  });
})();
