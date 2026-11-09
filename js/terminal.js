/* ==========================================================================
   NV // Neo-Terminal — interactive terminal + boot sequence
   ========================================================================== */
(function () {
  'use strict';

  // ---------------- Boot sequence ----------------
  const bootEl = document.getElementById('boot');
  const bootInner = document.getElementById('boot-inner');
  const bootLines = [
    `<span class="dim">[</span><span class="ok">  OK  </span><span class="dim">]</span>  initializing nv-os v3.2.1`,
    `<span class="dim">[</span><span class="ok">  OK  </span><span class="dim">]</span>  mounting <span class="key">/identity</span>`,
    `<span class="dim">[</span><span class="ok">  OK  </span><span class="dim">]</span>  mounting <span class="key">/work</span>     <span class="dim">→ 6 modules</span>`,
    `<span class="dim">[</span><span class="ok">  OK  </span><span class="dim">]</span>  mounting <span class="key">/research</span> <span class="dim">→ behavioral memory</span>`,
    `<span class="dim">[</span><span class="ok">  OK  </span><span class="dim">]</span>  mounting <span class="key">/projects</span> <span class="dim">→ 5 entries</span>`,
    `<span class="dim">[</span><span class="warn"> WARN </span><span class="dim">]</span>  context bias detected — recalibrating shape priors`,
    `<span class="dim">[</span><span class="ok">  OK  </span><span class="dim">]</span>  agent runtime online <span class="dim">→ tools=8 channels=∞</span>`,
    `<span class="dim">[</span><span class="ok">  OK  </span><span class="dim">]</span>  handshake complete`,
    ``,
    `<span class="key">welcome, operator.</span> <span class="dim">type</span> <span class="key">help</span> <span class="dim">in the terminal to begin.</span>`
  ];

  function runBoot() {
    let i = 0;
    function next() {
      if (i >= bootLines.length) {
        setTimeout(closeBoot, 380);
        return;
      }
      const line = document.createElement('div');
      line.className = 'boot-line';
      line.innerHTML = bootLines[i] || '&nbsp;';
      line.style.animationDelay = '0ms';
      bootInner.appendChild(line);
      i++;
      setTimeout(next, 95 + Math.random() * 70);
    }
    next();
  }
  function closeBoot() {
    bootEl.classList.add('done');
    setTimeout(() => bootEl.remove(), 400);
  }
  // skip on click / key
  bootEl.addEventListener('click', closeBoot);
  document.addEventListener('keydown', function once(e) {
    if (bootEl.parentNode) { closeBoot(); }
    document.removeEventListener('keydown', once);
  }, { once: true });

  if (sessionStorage.getItem('nv_booted')) {
    bootEl.remove();
  } else {
    sessionStorage.setItem('nv_booted', '1');
    runBoot();
  }

  // ---------------- Status bar clock (UTC, no location) ----------------
  const clockEl = document.getElementById('clock');
  function tick() {
    const d = new Date();
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    if (clockEl) clockEl.textContent = `${hh}:${mm}:${ss} UTC`;
  }
  tick();
  setInterval(tick, 1000);

  // session uptime
  const upEl = document.getElementById('uptime');
  const start = Date.now();
  function uptick() {
    if (!upEl) return;
    const s = Math.floor((Date.now() - start) / 1000);
    const m = Math.floor(s / 60);
    upEl.textContent = `T+${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
  uptick();
  setInterval(uptick, 1000);

  // ---------------- Terminal ----------------
  const out = document.getElementById('term-output');
  const inp = document.getElementById('term-input');

  const HISTORY = [];
  let hIdx = -1;

  function print(html, cls) {
    const div = document.createElement('div');
    div.className = 't-line' + (cls ? ' ' + cls : '');
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
    return div;
  }
  function printLines(lines) {
    lines.forEach(l => print(l));
  }
  function echo(cmd) {
    print(`<span class="prompt">nima@nv:~$</span> <span class="you">${escapeHtml(cmd)}</span>`);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  // ---------------- Commands ----------------
  const COMMANDS = {
    help: {
      desc: 'show available commands',
      run: () => {
        const rows = Object.keys(COMMANDS).sort().map(k => {
          return `  <span class="cy">${k.padEnd(12)}</span> <span class="dim">${COMMANDS[k].desc}</span>`;
        });
        printLines([
          `<span class="dim">available commands —</span>`,
          ...rows,
          ``,
          `<span class="dim">tips:  ↑/↓ history  ·  tab autocomplete  ·  ctrl+l clears</span>`
        ]);
      }
    },
    whoami: {
      desc: 'identity readout',
      run: () => printLines([
        `<span class="key">nima vahdat</span>`,
        `<span class="dim">└─</span> senior ai engineer @ pwc · toronto`,
        `<span class="dim">└─</span> ai agent memory · continual learning · world models`,
        `<span class="dim">└─</span> currently building self-improving agentic frameworks`
      ])
    },
    ls: {
      desc: 'list site sections (try: ls work | ls projects)',
      run: (args) => {
        const t = (args[0] || '').toLowerCase();
        if (!t) {
          printLines([
            `<span class="cy">identity/</span>   <span class="cy">work/</span>   <span class="cy">research/</span>   <span class="cy">projects/</span>   <span class="cy">stack/</span>   <span class="cy">contact/</span>`
          ]);
        } else if (t === 'work') {
          printLines([
            `<span class="am">pwc</span>               senior ai engineer · agentic      <span class="ok">[active]</span>`,
            `<span class="am">georgian</span>          ai research engineer (r&d)        <span class="dim">[completed]</span>`,
            `<span class="am">york / elder lab</span>  graduate researcher · gnns         <span class="dim">[completed]</span>`,
            `<span class="am">york</span>              teaching assistant · python         <span class="dim">[completed]</span>`,
            `<span class="am">univ. of tehran</span>   ai research intern · spiking nets   <span class="dim">[completed]</span>`
          ]);
        } else if (t === 'projects') {
          printLines([
            `<span class="cy">P-01</span>  nutrition-fact ar reader   <span class="dim">yolov8 · paddleocr · unity</span>`,
            `<span class="cy">P-02</span>  bart peft multitask         <span class="dim">summarization + sentiment</span>`,
            `<span class="cy">P-03</span>  foodseg103 mask2former      <span class="dim">semantic segmentation</span>`,
            `<span class="cy">P-04</span>  cross-modal retrieval       <span class="dim">vgg16 + word2vec</span>`,
            `<span class="cy">P-05</span>  feat few-shot learning      <span class="dim">meta-learning</span>`
          ]);
        } else if (t === 'research') {
          printLines([
            `<span class="am">behavioral_memory_for_llm_agents/</span>`,
            `  ├─ <span class="cy">forge_dc</span>   rule-compiling memory · 95% compliance`,
            `  ├─ <span class="cy">dc-bench</span>   71 scenarios · 9 dimensions`,
            `  └─ <span class="cy">paper</span>      neurips 2026 · palm workshop · arXiv:2611.08644`
          ]);
        } else {
          print(`<span class="err">ls: cannot access '${escapeHtml(t)}': no such directory</span>`);
        }
      }
    },
    cat: {
      desc: 'read entry (e.g. cat paper, cat forge_dc, cat readme)',
      run: (args) => {
        const f = (args[0] || '').toLowerCase();
        const docs = {
          'readme': [
            `<span class="key">// nimavahdat.github.io</span>`,
            `<span class="dim">build:</span> hand-crafted html · no framework`,
            `<span class="dim">era:</span>   post-agentic`,
            ``,
            `i build memory and tooling for llm agents.`,
            `previously: graph neural networks, computer vision.`,
            `i like systems that remember the right thing at the right time.`
          ],
          'forge_dc': [
            `<span class="key">forge_dc</span> <span class="dim">— behavioral memory system</span>`,
            ``,
            `captures human corrections and self-assessed tool-call`,
            `failures, compiles them into imperative <strong>RULE</strong> directives,`,
            `and injects them at the decision point.`,
            ``,
            `<span class="cy">▸</span> <strong>95%</strong> compliance vs. <strong>10%</strong> no-memory control (+85 points)`,
            `<span class="cy">▸</span> 159 injected tokens vs. 1,705 for naive retrieval (10.7×)`,
            `<span class="cy">▸</span> re-retrieval between tool calls for data-conditional rules`,
            `<span class="cy">▸</span> introduces the "only rules rule" finding`,
            ``,
            `<span class="dim">accepted · neurips 2026 palm workshop · arXiv:2611.08644</span>`,
            `<span class="dim">details:</span> <span class="cy">/decision-context/</span>`
          ],
          'dc-bench': [
            `<span class="key">dc-bench</span> <span class="dim">— behavioral memory benchmark</span>`,
            ``,
            `does an agent <em>apply</em> a past correction to an unseen`,
            `task, or merely recall it?`,
            ``,
            `<span class="cy">▸</span> 71 real-trace scenarios`,
            `<span class="cy">▸</span> 9 behavioral dimensions`,
            `<span class="cy">▸</span> control vs. treatment runs, llm-judged lift`,
            `<span class="cy">▸</span> approach- and provider-agnostic`,
            ``,
            `<span class="dim">code:</span> github.com/NimaVahdat/decision-context-benchmark`
          ],
          'paper': [
            `<span class="key">decision context</span> <span class="dim">— persistent behavioral learning for ai agents</span>`,
            ``,
            `nima vahdat · pashootan vaezipoor <span class="dim">(georgian ai lab)</span>`,
            `<span class="dim">neurips 2026 workshop on personalized, aligned,</span>`,
            `<span class="dim">long-term memory for ai systems (palm) · paris</span>`,
            ``,
            `<span class="cy">▸</span> arXiv:2611.08644`,
            `<span class="cy">▸</span> 95% compliance on dc-bench, up from 55% naive retrieval`,
            `<span class="cy">▸</span> ~10× fewer injected tokens per query`,
            `<span class="cy">▸</span> representation · activation · placement`,
            ``,
            `<span class="dim">read:</span> <span class="cy">/decision-context/</span>`
          ],
          'opengeorge': [
            `<span class="key">opengeorge</span> <span class="dim">— context engine</span>`,
            ``,
            `async postgresql context engine for persistent`,
            `cross-session ai agent memory.`,
            ``,
            `<span class="cy">▸</span> markdown-defined skill routing via pydantic-ai`,
            `<span class="cy">▸</span> ship a new agent capability by writing one .md file`,
            `<span class="cy">▸</span> slack bot + fastapi rest layer`
          ],
          'mcp': [
            `<span class="key">mcp_server</span> <span class="dim">— model context protocol microservice</span>`,
            ``,
            `eliminated per-call mcp spawn overhead by redesigning`,
            `as a persistent http/sse standalone microservice.`,
            ``,
            `<span class="cy">▸</span> parallel batch execution`,
            `<span class="cy">▸</span> unified sse gateway`,
            `<span class="cy">▸</span> auto-discovery of tool schemas at startup`,
            `<span class="cy">▸</span> 8 production integrations across the platform`
          ]
        };
        if (!f) {
          print(`<span class="err">cat: missing operand</span>`);
          print(`<span class="dim">try: cat readme  ·  cat paper  ·  cat forge_dc  ·  cat dc-bench  ·  cat opengeorge  ·  cat mcp</span>`);
          return;
        }
        if (docs[f]) {
          printLines(docs[f]);
        } else {
          print(`<span class="err">cat: ${escapeHtml(f)}: no such file</span>`);
        }
      }
    },
    contact: {
      desc: 'channels',
      run: () => printLines([
        `<span class="dim">channels —</span>`,
        `  <span class="cy">github</span>    <a href="https://github.com/NimaVahdat" target="_blank" rel="noopener">github.com/NimaVahdat</a>`,
        `  <span class="cy">linkedin</span>  <a href="https://www.linkedin.com/in/nima-vahdat-a220654a/" target="_blank" rel="noopener">linkedin.com/in/nima-vahdat</a>`
      ])
    },
    stack: {
      desc: 'tooling readout',
      run: () => printLines([
        `<span class="cy">core</span>      python · c/c++ · sql · bash · hcl`,
        `<span class="cy">ml/ai</span>     pytorch · hugging face · pydantic-ai · langgraph · fastmcp`,
        `<span class="cy">agents</span>    multi-agent · tool use · mcp · rag · behavioral memory`,
        `<span class="cy">infra</span>     docker · terraform · gcp · cloud run · opentelemetry`,
        `<span class="cy">data</span>      faiss · pinecone · chromadb · postgres · sqlalchemy`
      ])
    },
    work: {
      desc: 'jump to work section',
      run: () => { goto('work'); print(`<span class="dim">→ scrolled to /work</span>`); }
    },
    research: {
      desc: 'jump to research',
      run: () => { goto('research'); print(`<span class="dim">→ scrolled to /research</span>`); }
    },
    projects: {
      desc: 'jump to projects',
      run: () => { goto('projects'); print(`<span class="dim">→ scrolled to /projects</span>`); }
    },
    open: {
      desc: 'open a link (open paper | open scholar | open github | open linkedin)',
      run: (args) => {
        const t = (args[0] || '').toLowerCase();
        const map = {
          github: 'https://github.com/NimaVahdat',
          scholar: 'https://scholar.google.com/citations?hl=en&user=cFmtpaQAAAAJ',
          linkedin: 'https://www.linkedin.com/in/nima-vahdat-a220654a/',
          paper: 'decision-context/',
          arxiv: 'https://arxiv.org/abs/2611.08644',
          'dc-bench': 'https://github.com/NimaVahdat/decision-context-benchmark',
          forge_dc: 'https://github.com/NimaVahdat/decision-context-memory'
        };
        if (map[t]) {
          print(`<span class="ok">opening</span> <span class="cy">${t}</span> <span class="dim">→ ${map[t]}</span>`);
          window.open(map[t], '_blank', 'noopener');
        } else {
          print(`<span class="err">open: unknown target '${escapeHtml(t)}'</span>`);
        }
      }
    },
    sudo: {
      desc: 'elevate (denied)',
      run: () => print(`<span class="err">sudo: permission denied</span> <span class="dim">— this operator runs in user mode.</span>`)
    },
    date: {
      desc: 'current utc time',
      run: () => print(new Date().toUTCString())
    },
    echo: {
      desc: 'print arguments',
      run: (args) => print(escapeHtml(args.join(' ')) || ' ')
    },
    clear: {
      desc: 'clear the terminal',
      run: () => { out.innerHTML = ''; }
    },
    cls: {
      desc: 'alias of clear',
      run: () => { out.innerHTML = ''; }
    },
    exit: {
      desc: 'log off (just kidding)',
      run: () => print(`<span class="dim">nice try. you can't leave the grid.</span>`)
    }
  };

  function goto(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // initial banner
  printLines([
    `<span class="dim">nv-shell 1.0 · type</span> <span class="cy">help</span> <span class="dim">to list commands</span>`,
    ``
  ]);

  function execute(raw) {
    const trimmed = raw.trim();
    if (!trimmed) { echo(''); return; }
    echo(trimmed);
    const [cmd, ...args] = trimmed.split(/\s+/);
    const c = COMMANDS[cmd.toLowerCase()];
    if (c) {
      try { c.run(args); }
      catch (e) { print(`<span class="err">runtime error: ${escapeHtml(e.message)}</span>`); }
    } else {
      print(`<span class="err">${escapeHtml(cmd)}: command not found</span> <span class="dim">— type 'help'</span>`);
    }
    print('');
  }

  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = inp.value;
      if (v.trim()) HISTORY.unshift(v);
      hIdx = -1;
      inp.value = '';
      execute(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (HISTORY.length === 0) return;
      hIdx = Math.min(hIdx + 1, HISTORY.length - 1);
      inp.value = HISTORY[hIdx] || '';
      setTimeout(() => inp.setSelectionRange(inp.value.length, inp.value.length), 0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      hIdx = Math.max(hIdx - 1, -1);
      inp.value = hIdx === -1 ? '' : (HISTORY[hIdx] || '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const cur = inp.value;
      const parts = cur.split(/\s+/);
      const last = parts[parts.length - 1].toLowerCase();
      // autocomplete root commands
      if (parts.length === 1) {
        const matches = Object.keys(COMMANDS).filter(k => k.startsWith(last));
        if (matches.length === 1) inp.value = matches[0] + ' ';
        else if (matches.length > 1) {
          print(matches.map(m => `<span class="cy">${m}</span>`).join('   '));
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  // focus terminal when clicking anywhere in the terminal area
  document.querySelector('.terminal').addEventListener('click', (e) => {
    if (e.target.tagName === 'A') return;
    inp.focus();
  });

  // Keyboard shortcut: '/' focuses terminal from anywhere
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== inp && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      inp.focus();
      document.querySelector('.terminal').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // ---------------- Live system telemetry feed ----------------
  const feedBody = document.getElementById('feed-body');
  const feedMeta = document.getElementById('feed-meta');

  if (feedBody) {
    function rand(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function ts() {
      const d = new Date();
      return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
        .map(n => String(n).padStart(2, '0')).join(':');
    }

    const TEMPLATES = [
      ['cy', 'forge_dc',  'memory.inject',  () => ['tokens', rand(180, 640)]],
      ['cy', 'forge_dc',  'rule.match',     () => ['hits',   rand(1, 9)]],
      ['am', 'mcp',       'tool.dispatch',  () => ['lat',    rand(28, 142) + 'ms']],
      ['am', 'mcp',       'sse.frame',      () => ['dt',     rand(2, 18) + 'ms']],
      ['gr', 'agent',     'plan.step',      () => ['n',      rand(1, 6)]],
      ['gr', 'agent',     'act.verify',     () => ['ok',     Math.random() > 0.1 ? 'true' : 'retry']],
      ['cy', 'context',   'cache.hit',      () => ['ratio',  (0.6 + Math.random() * 0.39).toFixed(2)]],
      ['cy', 'context',   'embed.batch',    () => ['n',      rand(8, 64)]],
      ['am', 'router',    'skill.resolve',  () => ['route',  pick(['summarize','classify','extract','rewrite','plan'])]],
      ['gr', 'health',    'heartbeat',      () => ['rss',    rand(120, 380) + 'mb']],
      ['gr', 'health',    'gpu.idle',       () => ['util',   rand(2, 18) + '%']],
      ['cy', 'pg',        'session.upsert', () => ['rows',   rand(1, 12)]],
      ['am', 'langfuse',  'trace.flush',    () => ['spans',  rand(3, 22)]],
      ['cy', 'gateway',   'req.in',         () => ['p99',    rand(80, 240) + 'ms']],
      ['gr', 'limiter',   'budget.ok',      () => ['rem',    rand(1200, 8400) + 'tok']],
      ['am', 'eviction',  'lru.sweep',      () => ['freed',  rand(2, 18) + 'kb']]
    ];
    const RARE = [
      ['rd', 'forge_dc',  'compliance.flag', () => ['rule',  '#' + rand(11, 38)]],
      ['rd', 'agent',     'tool.timeout',    () => ['after', rand(2, 6) + 's']]
    ];

    let count = 0;
    function addLine() {
      const tpl = Math.random() < 0.05 ? pick(RARE) : pick(TEMPLATES);
      const [cls, src, msg, getExtras] = tpl;
      const [k, v] = getExtras();
      const line = document.createElement('div');
      line.className = 'feed-line';
      const valCls = cls === 'rd' ? 'warn' : (cls === 'gr' ? 'ok' : '');
      line.innerHTML =
        '<span class="ts">' + ts() + '</span>' +
        '<span class="src ' + cls + '">' + src + '</span>' +
        '<span class="msg">' + msg + ' <span style="color:var(--fg-3)">' + k + '=</span><span class="val ' + valCls + '">' + v + '</span></span>';
      feedBody.appendChild(line);
      while (feedBody.children.length > 11) feedBody.removeChild(feedBody.firstChild);
      count++;
      if (feedMeta) feedMeta.textContent = String(count).padStart(5, '0') + ' events';
    }

    for (let i = 0; i < 7; i++) addLine();
    setInterval(addLine, 1100 + Math.random() * 900);
  }

})();
