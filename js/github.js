/* ==========================================================================
   NV // Neo-Terminal — GitHub recent activity feed
   Fetches public events from api.github.com (60 req/hr unauthenticated)
   ========================================================================== */
(() => {
  const USER = 'NimaVahdat';
  const list = document.getElementById('gh-list');
  const meta = document.getElementById('gh-meta');
  if (!list) return;

  const fmtRel = (iso) => {
    const d = new Date(iso);
    const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
    if (s < 60) return s + 's';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h';
    const day = Math.floor(h / 24);
    if (day < 30) return day + 'd';
    const mo = Math.floor(day / 30);
    if (mo < 12) return mo + 'mo';
    return Math.floor(mo / 12) + 'y';
  };

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Map event → { kind, msg }
  const summarize = (ev) => {
    const t = ev.type;
    const p = ev.payload || {};
    if (t === 'PushEvent') {
      const n = (p.commits || []).length;
      const last = (p.commits && p.commits[p.commits.length - 1]) || null;
      const msg = last ? last.message.split('\n')[0] : 'pushed commits';
      const ref = (p.ref || '').replace('refs/heads/', '');
      return { kind: 'push', cls: 'push', msg: msg + (ref ? '  ' + ref : ''), count: n };
    }
    if (t === 'CreateEvent') {
      const what = p.ref_type || 'ref';
      const ref = p.ref ? ' ' + p.ref : '';
      return { kind: what, cls: 'create', msg: 'created ' + what + ref };
    }
    if (t === 'PullRequestEvent') {
      const action = p.action || 'opened';
      const title = (p.pull_request && p.pull_request.title) || '';
      return { kind: 'pr', cls: 'create', msg: action + ' pr · ' + title };
    }
    if (t === 'IssuesEvent') {
      const action = p.action || 'opened';
      const title = (p.issue && p.issue.title) || '';
      return { kind: 'issue', cls: 'create', msg: action + ' issue · ' + title };
    }
    if (t === 'WatchEvent') {
      return { kind: 'star', cls: 'star', msg: 'starred repo' };
    }
    if (t === 'ForkEvent') {
      return { kind: 'fork', cls: 'create', msg: 'forked repo' };
    }
    if (t === 'PullRequestReviewEvent' || t === 'PullRequestReviewCommentEvent') {
      return { kind: 'review', cls: 'create', msg: 'reviewed pr' };
    }
    if (t === 'IssueCommentEvent') {
      return { kind: 'comment', cls: 'create', msg: 'commented on issue' };
    }
    if (t === 'ReleaseEvent') {
      const tag = (p.release && p.release.tag_name) || '';
      return { kind: 'release', cls: 'star', msg: 'released ' + tag };
    }
    return { kind: t.replace('Event', '').toLowerCase(), cls: '', msg: t };
  };

  const renderRow = (ev, i) => {
    const s = summarize(ev);
    const repo = ev.repo && ev.repo.name ? ev.repo.name : '—';
    const repoShort = repo.split('/').slice(-1)[0];
    const repoUrl = 'https://github.com/' + repo;
    const when = fmtRel(ev.created_at);
    const div = document.createElement('div');
    div.className = 'signal-row';
    div.style.animationDelay = (i * 60) + 'ms';
    div.innerHTML =
      '<span class="gh-when">' + esc(when) + '</span>' +
      '<a class="gh-repo" href="' + esc(repoUrl) + '" target="_blank" rel="noopener">' + esc(repoShort) + '</a>' +
      '<span class="gh-msg">' + esc(s.msg) + '</span>' +
      '<span class="gh-kind ' + s.cls + '">' + esc(s.kind) + (s.count ? ' ×' + s.count : '') + '</span>';
    return div;
  };

  const showError = (txt) => {
    list.innerHTML = '';
    const e = document.createElement('div');
    e.className = 'signal-err';
    e.textContent = txt;
    list.appendChild(e);
  };

  const render = (events) => {
    list.innerHTML = '';
    if (!events.length) {
      showError('no recent public activity');
      return;
    }
    events.slice(0, 5).forEach((ev, i) => list.appendChild(renderRow(ev, i)));
    if (meta) meta.textContent = '● ' + events.length + ' events · ' + USER;
  };

  // localStorage cache: 5 minutes
  const CACHE_KEY = 'nv_gh_events_v1';
  const CACHE_TTL = 5 * 60 * 1000;

  const loadCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (Date.now() - obj.t > CACHE_TTL) return null;
      return obj.events;
    } catch (e) { return null; }
  };
  const saveCache = (events) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), events }));
    } catch (e) {}
  };

  const fetchEvents = async () => {
    const cached = loadCache();
    if (cached) {
      render(cached);
      if (meta) meta.textContent = '● cached · ' + USER;
      return;
    }
    try {
      const r = await fetch('https://api.github.com/users/' + USER + '/events/public?per_page=10', {
        headers: { 'Accept': 'application/vnd.github+json' }
      });
      if (!r.ok) {
        if (r.status === 403) { showError('rate-limited · try again later'); }
        else { showError('github api error · ' + r.status); }
        return;
      }
      const data = await r.json();
      saveCache(data);
      render(data);
    } catch (e) {
      showError('offline · could not reach github');
    }
  };

  fetchEvents();
})();
