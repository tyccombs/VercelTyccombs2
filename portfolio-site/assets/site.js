(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !calm) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { seen.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // Scroll-driven player growth
  var grow = document.querySelector('[data-grow]');
  var player = grow && grow.querySelector('.player');
  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };
  var ticking = false;
  function update() {
    ticking = false;
    player.style.setProperty('--p', clamp((innerHeight * .95 - grow.getBoundingClientRect().top) / (innerHeight * .65)).toFixed(4));
  }
  if (!calm && player) {
    addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // Filters on the project list
  var buttons = document.querySelectorAll('[data-filter]');
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      buttons.forEach(function (o) {
        o.classList.toggle('on', o === b);
        o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
      });
      document.querySelectorAll('.index li').forEach(function (li) {
        li.hidden = f !== 'All' && li.getAttribute('data-group') !== f;
        li.classList.add('in');
      });
    });
  });

  // Video loads from YouTube only once someone presses play
  document.querySelectorAll('.player[data-yt]').forEach(function (p) {
    p.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + p.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = p.getAttribute('aria-label');
      f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      p.replaceChildren(f);
    }, { once: true });
  });
})();
