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
  }
})();
