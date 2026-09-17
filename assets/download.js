// «Скачать» с любой страницы — установщик под систему и мягкий контакт (P126,
// спека uniqore-docs/desktop-cto/specs/landing-download-contacts.md).
//
// Один скрипт на оба сайта. Каждая ссылка на /download/ и каждая кнопка
// платформы открывают плашку поверх страницы: система посетителя определена —
// свой установщик и счётчик 25 секунд, «Скачать сейчас» рядом; выбрали кнопку
// платформы сами — их выбор сильнее автоопределения; не определена — обе кнопки
// без счётчика. Телефон и почта необязательны и файл не задерживают: заполнили —
// уходит на api.uniqore.ai/site/leads, пусто — не уходит ничего.
//
// Язык — язык страницы (html[lang]): ru/kk на uniqore.kz, en на uniqore.ai.
// Прямые ссылки на файлы остаются рабочими — скрипт их только оборачивает.
(function () {
  'use strict';

  var API = 'https://api.uniqore.ai';
  var FILES = { darwin: API + '/download/darwin', windows: API + '/download/windows' };
  var SECONDS = 25;
  var SITE = location.hostname.indexOf('uniqore.kz') >= 0 ? 'kz' : (location.hostname.indexOf('uniqore.ai') >= 0 ? 'ai' : 'local');

  var T = {
    ru: {
      title: 'Пока файл готовится — оставьте контакт',
      lead: 'Поможем установить и настроить: пришлём инструкцию и подскажем, если что-то не пойдёт.',
      phone: 'Телефон', email: 'Почта',
      forYou: 'Для вашего компьютера — {os}', chosen: 'Вы выбрали — {os}',
      other: 'Другая платформа',
      unknown: 'Не определили вашу систему — выберите установщик:',
      timer: 'Загрузка начнётся через {n} {sec}', sec: ['секунду', 'секунды', 'секунд'], now: 'Скачать сейчас',
      started: 'Загрузка началась. Установите приложение и откройте его.', done: 'Готово',
      badPhone: 'Проверьте номер: нужно не меньше десяти цифр', badEmail: 'Проверьте почту: нужен знак @',
      close: 'Закрыть',
      mac: 'macOS (.dmg)', win: 'Windows (setup.exe)'
    },
    kk: {
      title: 'Файл дайындалып жатқанда — байланысыңызды қалдырыңыз',
      lead: 'Орнатуға және баптауға көмектесеміз: нұсқаулық жібереміз, бірдеңе болмаса — көмектесеміз.',
      phone: 'Телефон', email: 'Пошта',
      forYou: 'Сіздің компьютеріңізге — {os}', chosen: 'Сіз таңдадыңыз — {os}',
      other: 'Басқа платформа',
      unknown: 'Жүйеңізді анықтай алмадық — орнатқышты таңдаңыз:',
      timer: 'Жүктеу {n} секундтан кейін басталады', sec: ['', '', ''], now: 'Қазір жүктеу',
      started: 'Жүктеу басталды. Қолданбаны орнатып, ашыңыз.', done: 'Дайын',
      badPhone: 'Нөмірді тексеріңіз: кем дегенде он сан', badEmail: 'Поштаны тексеріңіз: @ белгісі керек',
      close: 'Жабу',
      mac: 'macOS (.dmg)', win: 'Windows (setup.exe)'
    },
    en: {
      title: 'While your file gets ready — leave a contact',
      lead: 'We will help you install and set up: instructions, plus a hand if something does not work.',
      phone: 'Phone', email: 'Email',
      forYou: 'For your computer — {os}', chosen: 'You chose — {os}',
      other: 'Other platform',
      unknown: 'We could not detect your system — choose an installer:',
      timer: 'Your download starts in {n} {sec}', sec: ['second', 'seconds', 'seconds'], now: 'Download now',
      started: 'Download started. Install the app and open it.', done: 'Done',
      badPhone: 'Check the number: at least ten digits', badEmail: 'Check the email: it needs an @',
      close: 'Close',
      mac: 'macOS (.dmg)', win: 'Windows (setup.exe)'
    }
  };

  function lang() {
    var l = (document.documentElement.getAttribute('data-language') || document.documentElement.lang || 'ru').slice(0, 2);
    return T[l] ? l : (SITE === 'ai' ? 'en' : 'ru');
  }
  function t(key, vars) {
    var s = T[lang()][key] || '';
    Object.keys(vars || {}).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }
  function osName(os) { return os === 'darwin' ? t('mac') : t('win'); }
  // Секунды по-русски склоняются (1 секунду · 2–4 секунды · 5–20 секунд);
  // по-английски — одна форма на единицу; по-казахски слово не меняется.
  function seconds(n) {
    var forms = T[lang()].sec || ['', '', ''];
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
    return forms[2];
  }

  // Система посетителя. `?os=darwin|windows|none` — подмена для просмотра всех
  // веток с одной машины; ничего не запоминает.
  function detectOs() {
    var forced = new URLSearchParams(location.search).get('os');
    if (forced === 'darwin' || forced === 'windows') return forced;
    if (forced === 'none') return null;
    var p = '';
    try { p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ''; } catch (e) { p = ''; }
    var ua = navigator.userAgent || '';
    var hay = (p + ' ' + ua).toLowerCase();
    // Телефоны и планшеты — установщика нет, даже если ядро говорит «mac».
    if (/iphone|ipad|ipod|android|mobile/.test(hay)) return null;
    if (/win/.test(hay)) return 'windows';
    if (/mac/.test(hay)) return 'darwin';
    return null;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var dialog = null, timerId = null, state = null;

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'dl-plate';
    dialog.setAttribute('aria-labelledby', 'dl-title');
    dialog.innerHTML = '';
    var box = el('div', 'dl-box');
    var close = el('button', 'dl-close');
    close.type = 'button'; close.setAttribute('aria-label', t('close')); close.innerHTML = '&times;';
    close.addEventListener('click', hide);
    box.appendChild(close);
    var h = el('h3', 'dl-title', t('title')); h.id = 'dl-title'; box.appendChild(h);
    box.appendChild(el('p', 'dl-lead', t('lead')));

    var form = el('form', 'dl-form'); form.noValidate = true; form.setAttribute('autocomplete', 'on');
    form.appendChild(field('phone', 'tel', t('phone'), 'tel'));
    form.appendChild(field('email', 'email', t('email'), 'email'));
    // Ловушка для ботов: человек поля не видит.
    var trap = el('input', 'dl-trap'); trap.type = 'text'; trap.name = 'company'; trap.tabIndex = -1; trap.setAttribute('autocomplete', 'off'); trap.setAttribute('aria-hidden', 'true');
    form.appendChild(trap);
    form.addEventListener('submit', function (e) { e.preventDefault(); go(state.os); });
    box.appendChild(form);

    box.appendChild(el('div', 'dl-os'));
    box.appendChild(el('div', 'dl-actions'));
    box.appendChild(el('div', 'dl-status'));
    dialog.appendChild(box);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) hide(); });
    dialog.addEventListener('close', stopTimer);
    document.body.appendChild(dialog);
  }

  function field(name, type, label, autocomplete) {
    var wrap = el('label', 'dl-field');
    wrap.appendChild(el('span', 'dl-label', label));
    var input = el('input'); input.type = type; input.name = name; input.setAttribute('autocomplete', autocomplete); input.setAttribute('inputmode', type === 'tel' ? 'tel' : 'email');
    wrap.appendChild(input);
    wrap.appendChild(el('span', 'dl-hint'));
    return wrap;
  }

  // Плашка в трёх состояниях: своя система (счётчик), выбор человека (счётчик),
  // система не определена (две кнопки без счётчика).
  function render() {
    var osBox = dialog.querySelector('.dl-os');
    var actions = dialog.querySelector('.dl-actions');
    var status = dialog.querySelector('.dl-status');
    osBox.innerHTML = ''; actions.innerHTML = ''; status.textContent = ''; status.className = 'dl-status';
    dialog.querySelectorAll('.dl-hint').forEach(function (h) { h.textContent = ''; });
    if (state.os) {
      osBox.appendChild(el('div', 'dl-os-line', t(state.chosen ? 'chosen' : 'forYou', { os: osName(state.os) })));
      var now = el('button', 'btn btn-primary', t('now')); now.type = 'button';
      now.addEventListener('click', function () { go(state.os); });
      actions.appendChild(now);
      var other = el('button', 'dl-other', t('other')); other.type = 'button';
      other.addEventListener('click', function () { stopTimer(); state.os = null; state.chosen = false; render(); });
      actions.appendChild(other);
      var timer = el('div', 'dl-timer'); status.appendChild(timer);
      startTimer(timer);
    } else {
      osBox.appendChild(el('div', 'dl-os-line', t('unknown')));
      ['darwin', 'windows'].forEach(function (os) {
        var b = el('button', 'btn btn-primary', osName(os)); b.type = 'button';
        b.addEventListener('click', function () { go(os); });
        actions.appendChild(b);
      });
    }
  }

  function startTimer(node) {
    stopTimer();
    var left = SECONDS;
    node.textContent = t('timer', { n: left, sec: seconds(left) });
    timerId = setInterval(function () {
      left -= 1;
      if (left <= 0) { go(state.os); return; }
      node.textContent = t('timer', { n: left, sec: seconds(left) });
    }, 1000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  function digits(s) { return (s.match(/\d/g) || []).length; }

  // Скачивание стартует ВСЕГДА; контакт уходит, только если что-то заполнено
  // и заполнено похоже на правду. Подсказка под полем не задерживает файл.
  function go(os) {
    stopTimer();
    var phone = dialog.querySelector('input[name=phone]').value.trim();
    var email = dialog.querySelector('input[name=email]').value.trim();
    var hints = dialog.querySelectorAll('.dl-hint');
    var ok = true;
    if (phone && digits(phone) < 10) { hints[0].textContent = t('badPhone'); ok = false; }
    if (email && email.indexOf('@') < 0) { hints[1].textContent = t('badEmail'); ok = false; }
    if (ok && (phone || email)) send(phone, email, os);
    var a = document.createElement('a');
    a.href = FILES[os]; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    var status = dialog.querySelector('.dl-status');
    status.textContent = ''; status.className = 'dl-status dl-started';
    status.appendChild(el('div', 'dl-started-line', t('started')));
    var done = el('button', 'btn btn-ghost btn-sm', t('done')); done.type = 'button';
    done.addEventListener('click', hide);
    status.appendChild(done);
    dialog.querySelector('.dl-actions').innerHTML = '';
    dialog.querySelector('.dl-os').innerHTML = '';
  }

  function send(phone, email, os) {
    var body = JSON.stringify({
      site: SITE, page: location.pathname, lang: lang(), os: os || 'unknown',
      phone: phone, email: email,
      company: dialog.querySelector('input[name=company]').value
    });
    try {
      fetch(API + '/site/leads', {
        method: 'POST', mode: 'cors', keepalive: true,
        headers: { 'content-type': 'application/json' }, body: body
      }).catch(function () { /* файл уже качается — контакт не задерживает */ });
    } catch (e) { /* то же */ }
  }

  function show(chosenOs) {
    if (!dialog) build();
    state = { os: chosenOs || detectOs(), chosen: !!chosenOs };
    render();
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    var first = dialog.querySelector('input[name=phone]');
    if (first) first.focus();
  }
  function hide() {
    stopTimer();
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close(); else dialog.removeAttribute('open');
  }

  function wire(root) {
    (root || document).querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var os = null;
      if (href === '/download/' || href === '/download' || href.indexOf('/download/?') === 0) os = undefined;
      else if (href.indexOf(FILES.darwin) === 0) os = 'darwin';
      else if (href.indexOf(FILES.windows) === 0) os = 'windows';
      else return;
      if (a.dataset.dlWired) return;
      a.dataset.dlWired = '1';
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        e.preventDefault();
        show(os || null);
      });
    });
  }

  window.UniqoreDownload = { show: show, hide: hide, detectOs: detectOs, wire: wire };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { wire(document); });
  else wire(document);
})();
