'use strict';

/* ==========================================================
   EDIT THIS SECTION
   Everything you will change (links, lab titles, descriptions)
   lives here. Add a new lab by copying one object in LABS and
   giving it the next id: the card, task page, counter and
   previous/next links all update automatically.
   ========================================================== */

const CONFIG = {
  timezone: 'Asia/Karachi',
  github: {
    username: 'hasbeejay',
    url: 'https://github.com/hasbeejay',
  },
  student: 'Haseeb Jalil',
  rollNo: '241908',
  className: 'BSCS V-A',
  instructor: 'Hafiz Obaid Ullah',
  course: 'Full Stack Web Development',
};

// Each lab needs: id, title, description and repo (the full GitHub URL of that
// lab's repository). If `repo` is left empty, the card links to your GitHub
// profile instead, so a link never breaks.
// liveUrl is the link to the hosted lab page. Clicking the lab card opens it
// (in a new tab). While liveUrl is empty, the card opens the built-in task page
// instead, so it never leads nowhere.
// Optional: objectives (list), outcome (sentence), tech (list of tools), date.
// Anything left empty is simply hidden.
const LABS = [
  {
    id: 1,
    title: 'Lab Task 1',
    description: 'Full Stack Web Development, lab task 1. The complete source code is available on GitHub.',
    repo: '',                    // e.g. 'https://github.com/hasbeejay/your-lab-1-repo'
    objectives: [],              // e.g. ['Structure a page with semantic HTML']
    outcome: '',
    tech: [],                    // e.g. ['HTML5', 'CSS3']
    liveUrl: '',                 // e.g. 'https://your-lab-1-page.example.com'
    date: '',
    status: 'Completed',
    colors: ['#5ac8fa', '#0a84ff'],
  },
  {
    id: 2,
    title: 'Lab Task 2',
    description: 'Full Stack Web Development, lab task 2. The complete source code is available on GitHub.',
    repo: '',
    objectives: [],
    outcome: '',
    tech: [],
    liveUrl: '',
    date: '',
    status: 'Completed',
    colors: ['#ffb340', '#ff453a'],
  },
];

/* ==========================================================
   Helpers
   ========================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const repoUrl = (lab) => lab.repo || CONFIG.github.url;
const gradient = (lab) => `--c1:${lab.colors[0]};--c2:${lab.colors[1]}`;

/* ==========================================================
   GitHub links (one place to change: CONFIG.github)
   ========================================================== */

function applyGithubConfig() {
  $$('[data-github]').forEach((a) => { a.href = CONFIG.github.url; });
  $$('[data-github-handle]').forEach((el) => { el.textContent = '@' + CONFIG.github.username; });
}

/* ==========================================================
   Theme (light / dark, remembers the choice)
   ========================================================== */

const root = document.documentElement;
const themeBtn = $('#theme-toggle');
const themeMeta = $('meta[name="theme-color"]');

function applyTheme(theme) {
  root.dataset.theme = theme;
  themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  if (themeMeta) themeMeta.content = theme === 'dark' ? '#000000' : '#f5f5f7';
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) { /* storage unavailable */ }
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(saved === 'dark' || saved === 'light' ? saved : system);

  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
  });
}

/* ==========================================================
   Clock and greeting widgets
   ========================================================== */

const tz = CONFIG.timezone;
const partsFmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', hour: 'numeric', minute: 'numeric', second: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });
const dateFmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' });

function timeParts(date) {
  const out = {};
  partsFmt.formatToParts(date).forEach((p) => { if (p.type !== 'literal') out[p.type] = Number(p.value); });
  return out;
}

function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function buildTicks() {
  const g = $('#clock-ticks');
  let markup = '';
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const len = major ? 10 : 4;
    markup += `<line class="tick${major ? ' tick-hour' : ''}" x1="100" y1="${4 + 0}" x2="100" y2="${4 + len}" transform="rotate(${i * 6} 100 100)"/>`;
  }
  g.innerHTML = markup;
}

function initClock() {
  buildTicks();
  const hourHand = $('#hand-h');
  const minHand = $('#hand-m');
  const secHand = $('#hand-s');
  const timeEl = $('#clock-time');
  const dateEl = $('#clock-date');
  const greetEl = $('#greeting-time');
  let lastMinute = -1;
  let rafId = 0;
  let timerId = 0;

  const rotate = (el, deg) => el.setAttribute('transform', `rotate(${deg} 100 100)`);

  function update() {
    const now = new Date();
    const { hour, minute, second } = timeParts(now);
    const sec = second + (reduceMotion ? 0 : now.getMilliseconds() / 1000);

    rotate(secHand, sec * 6);
    rotate(minHand, (minute + sec / 60) * 6);
    rotate(hourHand, ((hour % 12) + minute / 60) * 30);

    if (minute !== lastMinute) {
      lastMinute = minute;
      timeEl.textContent = timeFmt.format(now);
      timeEl.setAttribute('datetime', now.toISOString());
      dateEl.textContent = dateFmt.format(now);
      greetEl.textContent = greetingFor(hour);
    }
  }

  function loop() {
    update();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    stop();
    update();
    if (reduceMotion) timerId = setInterval(update, 1000);
    else rafId = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(rafId);
    clearInterval(timerId);
  }

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}

/* ==========================================================
   Lab cards and progress widget
   ========================================================== */

function cardTarget(lab) {
  return lab.liveUrl
    ? { href: lab.liveUrl, ext: ' target="_blank" rel="noopener noreferrer"', label: 'Open lab page' }
    : { href: `#/lab/${lab.id}`, ext: '', label: 'Open task' };
}

function labCard(lab) {
  const go = cardTarget(lab);
  const chips = lab.tech.slice(0, 3).map((t) => `<li class="chip">${esc(t)}</li>`).join('');
  return `
    <article class="lab-card" style="${gradient(lab)}">
      <div class="lab-top">
        <div class="lab-icon" aria-hidden="true">${lab.id}</div>
        <span class="lab-label">Lab ${lab.id}</span>
      </div>
      <h3><a class="card-link" href="${esc(go.href)}"${go.ext}>${esc(lab.title)}${lab.liveUrl ? '<span class="sr-only"> (opens in a new tab)</span>' : ''}</a></h3>
      <p class="lab-desc">${esc(lab.description)}</p>
      ${chips ? `<ul class="chips" aria-label="Technologies">${chips}</ul>` : ''}
      <div class="lab-foot">
        <a class="gh-link" href="${esc(repoUrl(lab))}" target="_blank" rel="noopener noreferrer" aria-label="Lab ${lab.id} on GitHub (opens in a new tab)">
          ${icon('i-github')} GitHub
        </a>
        <span class="open-hint" aria-hidden="true">${go.label} ${icon('i-chevron', 'ico ico-sm')}</span>
      </div>
    </article>`;
}

function renderLabs() {
  $('#lab-grid').innerHTML = LABS.length
    ? LABS.map(labCard).join('')
    : '<p class="empty">No labs yet. Check back soon.</p>';

  $('#lab-count').textContent = LABS.length;
  $('#mini-stack').innerHTML = LABS
    .map((lab) => `<span class="mini-icon" style="${gradient(lab)}">${lab.id}</span>`)
    .join('');
}

/* ==========================================================
   Task (lab detail) view
   ========================================================== */

function taskHTML(lab) {
  const i = LABS.indexOf(lab);
  const prev = LABS[i - 1];
  const next = LABS[i + 1];

  const objectives = lab.objectives
    .map((o) => `<li><span class="check-dot">${icon('i-check')}</span><span>${esc(o)}</span></li>`)
    .join('');

  const rows = [
    ['Student', CONFIG.student],
    ['Roll number', CONFIG.rollNo],
    ['Class', CONFIG.className],
    ['Submitted to', CONFIG.instructor],
    ['Course', CONFIG.course],
    lab.date ? ['Date', lab.date] : null,
  ]
    .filter(Boolean)
    .map(([k, v]) => `<div class="list-row"><span>${esc(k)}</span><span>${esc(v)}</span></div>`)
    .join('');

  const statusRow = `<div class="list-row"><span>Status</span><span class="status">${esc(lab.status)}</span></div>`;
  const tech = lab.tech.map((t) => `<li class="chip">${esc(t)}</li>`).join('');

  return `
    <div class="wrap task" style="${gradient(lab)}">
      <a class="back" href="#labs">${icon('i-back')} All labs</a>

      <header class="task-head">
        <div class="lab-icon xl" aria-hidden="true">${lab.id}</div>
        <div>
          <p class="task-kicker">Lab ${lab.id}</p>
          <h1 id="task-title" tabindex="-1">${esc(lab.title)}</h1>
          <p class="lead">${esc(lab.description)}</p>
          <div class="actions">
            <a class="btn btn-primary" href="${esc(repoUrl(lab))}" target="_blank" rel="noopener noreferrer">
              ${icon('i-github')} View code on GitHub
            </a>
            ${lab.liveUrl ? `<a class="btn btn-ghost" href="${esc(lab.liveUrl)}" target="_blank" rel="noopener noreferrer">Open live demo</a>` : ''}
            <a class="btn btn-ghost" href="#labs">Back to labs</a>
          </div>
        </div>
      </header>

      <div class="task-grid">
        ${objectives ? `<section class="panel" aria-labelledby="obj-title">
          <h2 id="obj-title">Objectives</h2>
          <ul class="checks">${objectives}</ul>
          ${lab.outcome ? `<p class="outcome">${esc(lab.outcome)}</p>` : ''}
        </section>` : ''}

        <section class="panel" aria-labelledby="det-title">
          <h2 id="det-title">Details</h2>
          <div class="list">${rows}${statusRow}</div>
          ${tech ? `<ul class="chips tech" aria-label="Technologies used">${tech}</ul>` : ''}
        </section>
      </div>

      <nav class="pager" aria-label="Other labs">
        ${prev ? `<a class="prev" href="#/lab/${prev.id}"><small>Previous lab</small><strong>Lab ${prev.id}: ${esc(prev.title)}</strong></a>` : ''}
        ${next ? `<a class="next" href="#/lab/${next.id}"><small>Next lab</small><strong>Lab ${next.id}: ${esc(next.title)}</strong></a>` : ''}
      </nav>
    </div>`;
}

/* ==========================================================
   Router (hash based, so it works when opened from a file)
   ========================================================== */

const homeView = $('#home-view');
const taskView = $('#task-view');
const baseTitle = document.title;

function showTask(lab) {
  taskView.innerHTML = taskHTML(lab);
  homeView.hidden = true;
  taskView.hidden = false;
  document.title = `Lab ${lab.id}: ${lab.title} | ${CONFIG.student}`;
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('#task-title').focus({ preventScroll: true });
}

function showHome(anchor) {
  const wasHidden = homeView.hidden;
  taskView.hidden = true;
  taskView.innerHTML = '';
  homeView.hidden = false;
  document.title = baseTitle;

  const target = anchor && document.getElementById(anchor);
  if (target) {
    target.scrollIntoView({ behavior: wasHidden ? 'instant' : 'smooth' });
  } else if (wasHidden || anchor === '/') {
    window.scrollTo({ top: 0, behavior: wasHidden ? 'instant' : 'smooth' });
  }
}

function route() {
  const hash = location.hash;
  const match = hash.match(/^#\/lab\/(\d+)$/);
  const lab = match && LABS.find((l) => l.id === Number(match[1]));

  if (lab) showTask(lab);
  else showHome(hash.slice(1));
}

/* ==========================================================
   Init
   ========================================================== */

function init() {
  initTheme();
  applyGithubConfig();
  renderLabs();
  initClock();
  route();
  window.addEventListener('hashchange', route);

  // Play the entrance animation once, then remove it so it never replays.
  document.body.classList.add('intro');
  setTimeout(() => document.body.classList.remove('intro'), 2600);
}

init();
