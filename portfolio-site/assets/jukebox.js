// The top of the home page. Scrolling takes the reel from the logo opening to full
// screen, then shrinks it into the record slot as the row of titles comes up. The row
// is title spines that swell and rise under the mouse, like flipping through a
// jukebox's title strips. Clicking a spine flips the reel away and its record out at
// full size, playing its clip. Clicking the record opens the project.
(function () {
  var root = document.querySelector('[data-jukebox]');
  if (!root) return;
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = matchMedia('(hover: hover)').matches;
  var pin = root.querySelector('.jb');
  var now = root.querySelector('.jb-now');
  var body = root.querySelector('.jb-body');
  var stage = root.querySelector('.jb-stage');
  var row = root.querySelector('.jb-row');
  var meta = root.querySelector('.jb-meta');
  var title = root.querySelector('.jb-title');
  var reel = root.querySelector('.jb-reel');
  var START = matchMedia('(max-width: 720px)').matches ? .62 : .72;
  var rects = {}, ticking = false, landed = false, hiddenReel = '';
  var reelVideo = reel.querySelector('video');
  var cards = [].slice.call(root.querySelectorAll('a.jb-card'));
  var spines = [].slice.call(root.querySelectorAll('.jb-spine'));
  var plates = spines.map(function (s) { return s.querySelector('.jb-plate'); });
  var images = spines.map(function (s) { return s.querySelector('img'); });
  var texts = spines.map(function (s) { return s.querySelector('.jb-text'); });
  var n = cards.length;
  var WIDEN = 2.6, LIFT = 40, GROW = 1.5, SPREAD = 1.5, HIDDEN_SIZE = .3;
  var sizeRest = [], sizeBig = [];
  var opened = -1, clipTimer, video, W = 0, H = 0;
  var mouse = 0, mouseTo = 0, amount = 0, amountTo = 0, last = 0, frame = 0;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  // Where a record sits when it's put away: behind its own spine, turned over.
  function setPlaces(c, cx) {
    var b = body.getBoundingClientRect(), sh = stage.offsetHeight;
    c.style.setProperty('--hide', 'translate(' + (cx - W / 2) + 'px,' + (sh + H * HIDDEN_SIZE / 2 + 8 - H / 2) + 'px) scale(' + HIDDEN_SIZE + ') rotateY(180deg)');
    c.style.setProperty('--open', 'translate(' + (b.width - W) / 2 + 'px,' + (sh - H) / 2 + 'px) scale(1) rotateY(0deg)');
  }

  function place(i) {
    var b = body.getBoundingClientRect(), s = spines[i].getBoundingClientRect();
    setPlaces(cards[i], s.left - b.left + s.width / 2);
  }

  function measure() {
    var sh = stage.offsetHeight, bw = body.offsetWidth;
    H = Math.min(sh - 20, bw * .82 * 9 / 16);
    W = H * 16 / 9;
    body.style.setProperty('--w', W + 'px');
    body.style.setProperty('--h', H + 'px');
    cards.forEach(function (c, i) { place(i); });
    // The reel's three sizes: the opening, full screen, and landed in the record slot.
    var pw = pin.offsetWidth, ph = pin.offsetHeight, pr = pin.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    rects.start = [pw * (1 - START) / 2, ph * (1 - START) / 2, pw * START, ph * START];
    rects.full = [0, 0, pw, ph];
    rects.landed = [sr.left - pr.left + (sr.width - W) / 2, sr.top - pr.top + (sh - H) / 2, W, H];
    var hideH = H * HIDDEN_SIZE, restY = sr.top - pr.top + sh + hideH / 2 + 8;
    hiddenReel = 'translate(' + rects.landed[0] + 'px,' + (restY - H / 2) + 'px) scale(' + HIDDEN_SIZE + ') rotateY(180deg)';
    update();
    // Each title's size at rest and at its biggest, so it always fits its spine.
    var room = row.offsetHeight - 10;
    texts.forEach(function (t, i) {
      var top = t.offsetTop, tall = t.offsetHeight;
      sizeRest[i] = Math.min(1, (room - top) / tall);
      sizeBig[i] = Math.min(GROW, (room + LIFT - top) / tall);
    });
    draw();
  }

  function label(i) {
    if (i < 0) {
      title.textContent = 'Films by Ty Combs';
      meta.textContent = 'Ouch Pictures   (' + root.getAttribute('data-count') + ') Projects';
      return;
    }
    var c = cards[i], artist = c.getAttribute('data-artist');
    title.textContent = c.getAttribute('data-title');
    meta.textContent = String(i + 1).padStart(2, '0') + ' / ' + n + '   ' + c.getAttribute('data-type') + (artist ? ' / ' + artist : '');
  }

  function stopClip() {
    clearTimeout(clipTimer);
    if (video) { video.pause(); video = null; }
  }

  function open(i, play) {
    stopClip();
    var c = cards[i];
    if (opened < 0) {
      reel.classList.add('flying');
      reel.getBoundingClientRect();
      reel.style.transform = hiddenReel;
      root.classList.add('played');
      setTimeout(function () { if (root.classList.contains('played')) reelVideo.pause(); }, 800);
    } else if (i !== opened) {
      cards[opened].classList.remove('open');
      cards[opened].tabIndex = -1;
      spines[opened].classList.remove('on');
      place(opened);
    }
    // Start the flip from behind this record's spine, wherever it is right now.
    if (!c.classList.contains('open')) {
      c.style.transition = 'none';
      place(i);
      c.getBoundingClientRect();
      c.style.transition = '';
    }
    opened = i;
    c.classList.add('open');
    c.tabIndex = 0;
    spines[i].classList.add('on');
    label(i);
    var src = c.getAttribute('data-clip');
    if (!play || !src) return;
    var front = c.querySelector('.jb-front'), v = front.querySelector('video');
    if (!v) {
      v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('aria-hidden', 'true');
      v.src = src;
      front.insertBefore(v, front.querySelector('.jb-info'));
    }
    video = v;
    // Starts once the record has finished flipping.
    clipTimer = setTimeout(function () {
      var played = v.play();
      if (played && played.catch) played.catch(function () {});
      v.classList.add('on');
    }, calm ? 0 : 1000);
  }

  // Where a swell centred at m puts that point on screen, from 0 to 1 across the row.
  function screenAt(m) {
    var before = 0, total = 0;
    for (var i = 0; i < n; i++) {
      var d = (i + .5 - m) / SPREAD, w = 1 + WIDEN * Math.exp(-d * d / 2);
      total += w;
      before += w * clamp(m - i, 0, 1);
    }
    return before / total;
  }

  // Finds the swell that lands under the pointer, so the spine under the mouse is
  // always the biggest one.
  function swellAt(clientX) {
    var b = row.getBoundingClientRect(), p = clamp((clientX - b.left) / b.width, 0, 1);
    var lo = 0, hi = n;
    for (var k = 0; k < 14; k++) {
      var mid = (lo + hi) / 2;
      if (screenAt(mid) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function draw() {
    spines.forEach(function (s, i) {
      var dist = (i + .5 - mouse) / SPREAD;
      var g = amount * Math.exp(-dist * dist / 2);
      s.style.flexGrow = (1 + WIDEN * g).toFixed(3);
      plates[i].style.transform = 'translateY(' + (-LIFT * g).toFixed(2) + 'px)';
      images[i].style.opacity = (.22 + .5 * g).toFixed(3);
      texts[i].style.transform = 'translateX(-50%) scale(' + (sizeRest[i] + (sizeBig[i] - sizeRest[i]) * g).toFixed(4) + ')';
    });
  }

  function tick(now) {
    // Eases at the same speed whatever the screen's refresh rate.
    var dt = Math.min((now - last) / 1000, .05), k = 1 - Math.exp(-dt * 13);
    last = now;
    mouse += (mouseTo - mouse) * k;
    amount += (amountTo - amount) * k;
    draw();
    if (Math.abs(mouseTo - mouse) < .002 && Math.abs(amountTo - amount) < .002) {
      mouse = mouseTo; amount = amountTo; draw(); frame = 0;
    } else frame = requestAnimationFrame(tick);
  }

  function animate() {
    if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); }
  }

  if (canHover && !calm) {
    row.addEventListener('mouseenter', function (e) {
      // Swells from where the mouse came in, rather than sweeping over from elsewhere.
      if (amount < .02) mouse = mouseTo = swellAt(e.clientX);
      amountTo = 1;
      animate();
    });
    row.addEventListener('mousemove', function (e) {
      mouseTo = swellAt(e.clientX);
      amountTo = 1;
      animate();
    });
    row.addEventListener('mouseleave', function () {
      amountTo = 0;
      animate();
      label(opened);
    });
  }

  spines.forEach(function (s, i) {
    if (canHover) s.addEventListener('mouseenter', function () { label(i); });
    s.addEventListener('focus', function () {
      if (!s.matches(':focus-visible')) return;
      label(i);
      if (canHover && !calm) { mouseTo = i + .5; amountTo = 1; animate(); }
    });
    s.addEventListener('blur', function () {
      if (!row.matches(':hover')) { label(opened); amountTo = 0; animate(); }
    });
    s.addEventListener('click', function () { open(i, true); });
  });

  // Scrolled back up past the jukebox: put the record away and bring the reel back.
  function backToReel() {
    stopClip();
    if (opened >= 0) {
      cards[opened].classList.remove('open');
      cards[opened].tabIndex = -1;
      spines[opened].classList.remove('on');
      place(opened);
    }
    opened = -1;
    root.classList.remove('played');
    reel.classList.remove('flying');
    label(-1);
    if (!calm) { var played = reelVideo.play(); if (played && played.catch) played.catch(function () {}); }
  }

  function ease(t) { return t * t * (3 - 2 * t); }

  // Scroll progress: the reel grows to full screen, holds, then shrinks into its slot.
  function update() {
    ticking = false;
    if (!rects.full) return;
    var travel = root.offsetHeight - pin.offsetHeight;
    var t = calm || travel <= 0 ? 1 : clamp(-root.getBoundingClientRect().top / travel, 0, 1);
    var grow = clamp(t / .46, 0, 1), land = ease(clamp((t - .54) / .38, 0, 1));
    pin.style.setProperty('--p', grow.toFixed(4));
    var isLanded = land > .985;
    if (!isLanded && root.classList.contains('played')) backToReel();
    if (isLanded !== landed) { landed = isLanded; root.classList.toggle('landed', landed); }
    if (!root.classList.contains('played')) {
      var from = land > 0 ? rects.full : rects.start, to = land > 0 ? rects.landed : rects.full, k = land > 0 ? land : grow;
      var r = from.map(function (v, n) { return v + (to[n] - v) * k; });
      reel.style.width = r[2].toFixed(1) + 'px';
      reel.style.height = r[3].toFixed(1) + 'px';
      reel.style.transform = 'translate(' + r[0].toFixed(1) + 'px,' + r[1].toFixed(1) + 'px)';
    }
    row.style.transform = 'translateY(' + ((1 - land) * (row.offsetHeight + 4)).toFixed(1) + 'px)';
    now.style.opacity = land.toFixed(3);
  }

  label(-1);
  measure();
  if (calm) reelVideo.pause();
  else addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  // Resizes the records whenever the space above the row changes, such as when the
  // title font arrives.
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
  else addEventListener('resize', measure);
  // Titles change length when their font arrives.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
})();
