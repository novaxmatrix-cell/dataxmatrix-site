// Theme toggle + mobile menu. The initial theme is set inline in <head> to avoid a flash.
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-btn');
  function current() {
    return root.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function label() { if (btn) btn.textContent = current() === 'dark' ? '☀' : '☾'; }
  if (btn) {
    label();
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
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
})();
