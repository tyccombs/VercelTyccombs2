// Hire-me form: sends the answers to /api/hire, which emails Ty.
(function () {
  var form = document.querySelector('form.hire');
  if (!form) return;
  var done = document.querySelector('.hire-done');
  var status = form.querySelector('.hf-status');
  var button = form.querySelector('button[type=submit]');
  form.elements.t.value = String(Date.now());

  function say(msg, err) { status.textContent = msg; status.classList.toggle('err', !!err); }

  form.addEventListener('input', function (e) { e.target.removeAttribute('aria-invalid'); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = [];
    ['first', 'last', 'email'].forEach(function (n) {
      var el = form.elements[n];
      var ok = el.value.trim() && (n !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      if (!ok) { el.setAttribute('aria-invalid', 'true'); bad.push(el); }
    });
    var link = form.elements.link;
    if (link.value.trim() && !/^https?:\/\//i.test(link.value.trim())) link.value = 'https://' + link.value.trim();
    if (bad.length) { say('Please add your name and a valid email.', true); bad[0].focus(); return; }

    var data = {};
    new FormData(form).forEach(function (v, k) {
      if (k === 'types') (data.types = data.types || []).push(v);
      else data[k] = typeof v === 'string' ? v.trim() : v;
    });

    button.disabled = true;
    say('Sending…');
    fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'failed'); }); })
      .then(function () {
        form.hidden = true;
        done.hidden = false;
        done.focus();
        done.scrollIntoView({ block: 'center' });
      })
      .catch(function (err) {
        button.disabled = false;
        say((err && err.message && err.message !== 'failed' ? err.message + ' ' : 'That didn’t send. ') + 'You can also email me directly from the Contact page.', true);
      });
  });
})();
