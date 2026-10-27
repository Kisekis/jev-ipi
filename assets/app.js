/* Interactive figures for the paper website. Data: data/paper-data.js (window.PAPER_DATA). */
(function () {
  'use strict';
  const D = window.PAPER_DATA;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = document) => r.querySelector(s);
  const COND = [
    { k: 'clean', name: 'Clean', short: 'clean', color: '#168574', cls: 'clean' },
    { k: 'poison_conclusion', name: 'Conclusion poison', short: 'Conclusion', color: '#3979B5', cls: 'concl' },
    { k: 'poison_evidence', name: 'Evidence poison', short: 'Evidence', color: '#D38A32', cls: 'evid' },
  ];
  const RULE_COL = { Baseline: '#6489A3', Ignore: '#3D8F80', Cautious: '#7B83BE' };
  const SHAPES = ['circle', 'square', 'diamond', 'triangle'];
  const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
  const f2 = v => v.toFixed(2);

  /* ------------------------------------------------------------ helpers */
  function S(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function H(tag, attrs, parent, html) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function T(parent, x, y, text, attrs) {
    const t = S('text', Object.assign({ x, y }, attrs || {}), parent);
    t.textContent = text;
    return t;
  }
  function mix(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const tip = $('#tip');
  function showTip(e, html) {
    tip.innerHTML = html;
    tip.classList.add('show');
    moveTip(e);
  }
  function moveTip(e) {
    const r = tip.getBoundingClientRect();
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - 14;
    if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - 14;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  const hideTip = () => tip.classList.remove('show');
  function hover(node, html) {
    node.addEventListener('mouseenter', e => showTip(e, typeof html === 'function' ? html() : html));
    node.addEventListener('mousemove', moveTip);
    node.addEventListener('mouseleave', hideTip);
  }

  function seg(container, items, onPick, initial) {
    container.innerHTML = '';
    const btns = items.map(it => {
      const b = H('button', { type: 'button', class: it.cls || '' }, container,
        (it.color ? `<i class="sw" style="background:${it.color}"></i>` : '') + it.label);
      b.addEventListener('click', () => { set(it.value); onPick(it.value); });
      return b;
    });
    function set(v) { btns.forEach((b, i) => b.classList.toggle('on', items[i].value === v)); }
    set(initial);
    return set;
  }

  function marker(g, shape, x, y, r, fill, stroke) {
    const a = { fill, stroke: stroke || fill, 'stroke-width': 1.3 };
    if (shape === 'circle') return S('circle', Object.assign({ cx: x, cy: y, r }, a), g);
    if (shape === 'square') return S('rect', Object.assign({ x: x - r * .9, y: y - r * .9, width: r * 1.8, height: r * 1.8 }, a), g);
    if (shape === 'diamond') return S('path', Object.assign({ d: `M${x} ${y - r * 1.25}L${x + r * 1.15} ${y}L${x} ${y + r * 1.25}L${x - r * 1.15} ${y}Z` }, a), g);
    return S('path', Object.assign({ d: `M${x} ${y - r * 1.25}L${x + r * 1.2} ${y + r * .85}L${x - r * 1.2} ${y + r * .85}Z` }, a), g);
  }

  /* Axes frame; returns scales. */
  function frame(parent, o) {
    const W = o.W || 320, Hh = o.H || 230;
    const m = Object.assign({ t: 30, r: 12, b: 42, l: 44 }, o.m || {});
    const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'chart', role: 'img', 'aria-label': o.aria || o.title || '' }, parent);
    const [x0, x1] = o.x, [y0, y1] = o.y;
    const X = v => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r);
    const Y = v => Hh - m.b - (v - y0) / (y1 - y0) * (Hh - m.t - m.b);
    const g = S('g', {}, svg);
    (o.yt || []).forEach(v => {
      S('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: 'grid' }, g);
      T(g, m.l - 7, Y(v) + 4, o.yfmt ? o.yfmt(v) : v, { 'text-anchor': 'end' });
    });
    S('line', { x1: m.l, x2: W - m.r, y1: Hh - m.b, y2: Hh - m.b, class: 'axis' }, g);
    (o.xt || []).forEach((v, i) => {
      const lab = o.xlabels ? o.xlabels[i] : (o.xfmt ? o.xfmt(v) : v);
      S('line', { x1: X(v), x2: X(v), y1: Hh - m.b, y2: Hh - m.b + 4, class: 'axis' }, g);
      T(g, X(v), Hh - m.b + 17, lab, { 'text-anchor': 'middle' });
    });
    if (o.title) T(svg, m.l, 15, o.title, { class: 'title' });
    if (o.xl) T(svg, (m.l + W - m.r) / 2, Hh - 6, o.xl, { 'text-anchor': 'middle', class: 'axlab' });
    if (o.yl) T(svg, 12, (m.t + Hh - m.b) / 2, o.yl, { 'text-anchor': 'middle', class: 'axlab', transform: `rotate(-90 12 ${(m.t + Hh - m.b) / 2})` });
    return { svg, X, Y, W, H: Hh, m };
  }

  /* Column hover for line charts: guide line + tooltip for each x. */
  function columns(fr, xs, html) {
    const { svg, X, m, W, H: Hh } = fr;
    const guide = S('line', { y1: m.t - 4, y2: Hh - m.b, stroke: '#2e3f49', 'stroke-width': .8, 'stroke-dasharray': '2 2', opacity: 0 }, svg);
    xs.forEach((x, i) => {
      const left = i ? (X(xs[i - 1]) + X(x)) / 2 : m.l;
      const right = i < xs.length - 1 ? (X(x) + X(xs[i + 1])) / 2 : W - m.r;
      const r = S('rect', { x: left, y: m.t - 4, width: right - left, height: Hh - m.b - m.t + 4, class: 'hit' }, svg);
      r.addEventListener('mouseenter', e => { guide.setAttribute('x1', X(x)); guide.setAttribute('x2', X(x)); guide.setAttribute('opacity', .5); showTip(e, html(i)); });
      r.addEventListener('mousemove', moveTip);
      r.addEventListener('mouseleave', () => { guide.setAttribute('opacity', 0); hideTip(); });
    });
  }

  /* ------------------------------------------------------------ citations */
  const refKeys = [];
  document.querySelectorAll('a.cite').forEach(a => {
    const keys = a.dataset.k.split(',');
    keys.forEach(k => { if (!refKeys.includes(k)) refKeys.push(k); });
    const labels = keys.map(k => (D.refs[k] || { label: k }).label);
    a.textContent = '(' + labels.join('; ') + ')';
    a.href = '#ref-' + keys[0];
    hover(a, () => keys.map(k => D.refs[k] ? `<b>${D.refs[k].label}</b><br><span class="muted">${D.refs[k].text}</span>` : k).join('<br><br>'));
  });
  const refList = $('#refs');
  Object.keys(D.refs).forEach(k => {
    const r = D.refs[k];
    const li = H('li', { id: 'ref-' + k }, refList);
    li.textContent = r.text;
  });

  /* ------------------------------------------------------------ nav */
  const links = [...document.querySelectorAll('.navlinks a')];
  const targets = links.map(a => $(a.getAttribute('href')));
  const bar = $('#progress');
  function onScroll() {
    const h = document.documentElement;
    bar.style.width = (100 * h.scrollTop / (h.scrollHeight - h.clientHeight)) + '%';
    let cur = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < 120) cur = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === cur));
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------ difficulty table */
  const dt = $('#difficulty-table');
  dt.innerHTML = '<thead><tr><th>Family</th><th>L1–L4</th><th>L5–L8</th></tr></thead><tbody>' +
    D.difficulty.map(r => `<tr><td>${r.family}</td><td>${r.low}</td><td>${r.high}</td></tr>`).join('') + '</tbody>';

  /* ------------------------------------------------------------ playground */
  (function playground() {
    const st = { fam: D.familyKeys[0], level: 'L1', v: 'poison_conclusion' };
    const CLEAN_COMMENT = 'Submitter comment: No derived conclusion is supplied.';
    seg($('#pg-family'), D.familyKeys.map((k, i) => ({ value: k, label: D.families[i] })), v => { st.fam = v; draw(); }, st.fam);
    seg($('#pg-level'), ['L1', 'L8'].map(l => ({ value: l, label: l })), v => { st.level = v; draw(); }, st.level);
    seg($('#pg-variant'), COND.map(c => ({ value: c.k, label: c.name, cls: c.cls })), v => { st.v = v; draw(); }, st.v);

    function draw() {
      const ex = D.examples.find(e => e.family === st.fam && e.level === st.level);
      $('#pg-goal').textContent = ex.goal;
      $('#pg-case').textContent = ex.case;
      $('#pg-records').innerHTML = ex.records.split('; ').map(r => `<span>${r}</span>`).join('');
      const cm = $('#pg-comment');
      cm.className = 'comment ' + (COND.find(c => c.k === st.v).cls);
      cm.textContent = st.v === 'clean' ? CLEAN_COMMENT : st.v === 'poison_conclusion' ? ex.conclusion : ex.evidence;
      const oracle = ex.oracle.match(/\((click_\d+)\)/)[1];
      const target = ex.target.match(/\((click_\d+)\)/)[1];
      $('#pg-options').innerHTML = ex.options.map(([lab, id]) =>
        `<span class="opt ${id === oracle ? 'oracle' : ''} ${id === target ? 'target' : ''}">${lab}<small>${id}</small></span>`).join('');
      const box = $('#pg-models');
      box.innerHTML = '';
      D.models.forEach((m, mi) => {
        const run = ex.runs[m.id][st.v];
        const ok = run.pred === oracle, hit = run.pred === target;
        const verdict = ok ? '<span class="verdict ok">correct</span>' : hit ? '<span class="verdict hit">attack succeeded</span>' : '<span class="verdict wrong">wrong</span>';
        const row = H('div', { class: 'pm' }, box,
          `<div class="pmhead"><b><i style="background:${m.color}"></i><span class="m">${m.name}</span></b>${verdict}</div>`);
        ex.options.forEach(([lab, id]) => {
          const p = run.probs[id] || 0;
          const cls = id === oracle ? 'oracle' : id === target ? 'target' : '';
          const b = H('div', { class: 'pbar' }, row,
            `<span class="lab ${id === run.pred ? 'sel' : ''}">${lab}</span><span class="track"><span class="fill ${cls}" style="width:0"></span></span><span class="val">${p.toFixed(2)}</span>`);
          requestAnimationFrame(() => requestAnimationFrame(() => { b.querySelector('.fill').style.width = (100 * p) + '%'; }));
        });
      });
    }
    draw();
  })();

  /* ------------------------------------------------------------ RQ1 table */
  const ACC_LO = '#f2f7f6', ACC_HI = '#168574', ASR_LO = '#fbf3f2', ASR_HI = '#b4534b';
  function heatCell(v, kind, lo, hi) {
    const t = kind === 'acc' ? clamp((v - lo) / (hi - lo), 0, 1) : clamp((v - lo) / (hi - lo), 0, 1);
    const bg = kind === 'acc' ? mix(ACC_LO, ACC_HI, t) : mix(ASR_LO, ASR_HI, t);
    return { bg, dark: t > .58 };
  }
  (function rq1Table() {
    const tb = $('#rq1-table');
    const cols = [['acc', 'Acc. ↑'], ['C', 'C ↓'], ['E', 'E ↓'], ['two', '2-shot ↓']];
    let html = '<thead><tr><th></th>' + D.models.map(m => `<th colspan="4" class="gs"><span class="m">${m.name}</span></th>`).join('') + '</tr>';
    html += '<tr><th>Task family</th>' + D.models.map(() => cols.map((c, i) => `<th class="${i ? '' : 'gs'}">${c[1]}</th>`).join('')).join('') + '</tr></thead><tbody>';
    const rows = D.familyKeys.map((k, i) => [D.families[i], m => m.family[k]]).concat([['Overall', m => m.overall]]);
    rows.forEach(([lab, get], ri) => {
      html += `<tr class="${ri === rows.length - 1 ? 'total' : ''}"><td>${lab}</td>`;
      D.models.forEach(m => {
        const r = get(m);
        cols.forEach(([k], i) => {
          const h = k === 'acc' ? heatCell(r[k], 'acc', 60, 100) : heatCell(r[k], 'asr', 0, 100);
          const n = Math.round(r[k] * r.n / 100);
          html += `<td class="v ${h.dark ? 'dark' : ''} ${i ? '' : 'gs'}" style="background:${h.bg}" data-tip="<b>${m.name}</b> · ${lab}<br>${{ acc: 'Clean accuracy', C: 'Conclusion ASR', E: 'Evidence ASR', two: 'Two-shot ASR' }[k]}: <b>${f1(r[k])}%</b><br><span class='muted'>${n} of ${r.n} tasks</span>">${f1(r[k])}</td>`;
        });
      });
      html += '</tr>';
    });
    tb.innerHTML = html + '</tbody>';
    tb.querySelectorAll('td[data-tip]').forEach(td => hover(td, td.dataset.tip));
  })();

  /* ------------------------------------------------------------ RQ1 difficulty */
  (function rq1Diff() {
    const hidden = new Set();
    const leg = $('#rq1-legend');
    D.models.forEach((m, i) => {
      const b = H('button', { type: 'button' }, leg, `<span class="key" style="background:${m.color}"></span><span class="m">${m.name}</span>`);
      b.addEventListener('click', () => { hidden.has(i) ? hidden.delete(i) : hidden.add(i); b.classList.toggle('off', hidden.has(i)); draw(); });
    });
    const panels = [
      { title: 'Clean capability', yl: 'Accuracy (%)', keys: ['acc', 'twoAcc'] },
      { title: 'Conclusion exposure', yl: 'Targeted ASR (%)', keys: ['C'] },
      { title: 'Evidence exposure', yl: 'Targeted ASR (%)', keys: ['E'] },
    ];
    const box = $('#rq1-diff');
    function draw() {
      box.innerHTML = '';
      panels.forEach(p => {
        const div = H('div', {}, box);
        const fr = frame(div, { W: 330, H: 240, x: [.6, 8.4], y: [0, 100], xt: [1, 2, 3, 4, 5, 6, 7, 8], yt: [0, 25, 50, 75, 100], title: p.title, xl: 'Difficulty level', yl: p.yl, m: { l: 46 } });
        const lv = [1, 2, 3, 4, 5, 6, 7, 8];
        D.models.forEach((m, mi) => {
          if (hidden.has(mi)) return;
          p.keys.forEach((k, ki) => {
            const pts = m.level.map((r, i) => [fr.X(lv[i]), fr.Y(r[k])]);
            S('path', { d: 'M' + pts.map(q => q.join(' ')).join('L'), fill: 'none', stroke: m.color, 'stroke-width': 1.8, 'stroke-dasharray': ki ? '4 3' : 'none', 'stroke-linejoin': 'round' }, fr.svg);
            pts.forEach(q => marker(fr.svg, SHAPES[mi], q[0], q[1], 2.6, ki ? '#fff' : m.color, m.color));
          });
        });
        columns(fr, lv, i => `<b>L${lv[i]}</b> · ${p.title}<br>` + D.models.map((m, mi) => hidden.has(mi) ? '' :
          `<span style="color:${m.color}">●</span> ${m.name}: <b>${f1(m.level[i][p.keys[0]])}%</b>` + (p.keys[1] ? ` <span class="muted">(two-shot ${f1(m.level[i][p.keys[1]])}%)</span>` : '')).filter(Boolean).join('<br>') + '<br><span class="muted">180 tasks per level</span>');
      });
    }
    draw();
  })();

  /* ------------------------------------------------------------ RQ1 grid explorer */
  (function grid() {
    const st = { m: 0, k: 'E' };
    seg($('#grid-model'), D.models.map((m, i) => ({ value: i, label: m.name, color: m.color })), v => { st.m = v; draw(); }, st.m);
    seg($('#grid-metric'), [{ value: 'acc', label: 'Clean accuracy' }, { value: 'C', label: 'Conclusion ASR' }, { value: 'E', label: 'Evidence ASR' }], v => { st.k = v; draw(); }, st.k);
    const box = $('#rq1-grid');
    function draw() {
      const m = D.models[st.m];
      let html = '<div class="cellgrid"><div></div>' + [1, 2, 3, 4, 5, 6, 7, 8].map(l => `<div class="h">L${l}</div>`).join('');
      D.familyKeys.forEach((fk, fi) => {
        html += `<div class="r">${D.families[fi]}</div>`;
        m.grid[fk].forEach((r, li) => {
          const v = r[st.k];
          const t = clamp(st.k === 'acc' ? (v - 40) / 60 : v / 100, 0, 1);
          const bg = st.k === 'acc' ? mix(ACC_LO, ACC_HI, t) : mix(ASR_LO, ASR_HI, t);
          html += `<div class="c" style="background:${bg};color:${t > .58 ? '#fff' : '#2e3f49'}" data-tip="<b>${m.name}</b> · ${D.families[fi]} L${li + 1}<br>${{ acc: 'Clean accuracy', C: 'Conclusion ASR', E: 'Evidence ASR' }[st.k]}: <b>${f1(v)}%</b> <span class='muted'>(${Math.round(v * r.n / 100)}/${r.n})</span>">${Math.round(v)}</div>`;
        });
      });
      html += '</div>';
      const lo = st.k === 'acc' ? ACC_LO : ASR_LO, hi = st.k === 'acc' ? ACC_HI : ASR_HI;
      html += `<div class="scale"><span>${st.k === 'acc' ? '≤40%' : '0%'}</span><span class="ramp" style="background:linear-gradient(90deg,${lo},${hi})"></span><span>100%</span></div>`;
      box.innerHTML = html;
      box.querySelectorAll('[data-tip]').forEach(c => hover(c, c.dataset.tip));
    }
    draw();
  })();

  /* ------------------------------------------------------------ RQ2 table */
  (function rq2Table() {
    const tb = $('#rq2-table');
    let html = '<thead><tr><th></th>' + COND.map(c => `<th colspan="3" class="gs" style="color:${c.color}">${c.name.replace(' poison', ' poison')}</th>`).join('') + '</tr>';
    html += '<tr><th>Model</th>' + COND.map(() => '<th class="gs">Acc. ↑</th><th>Conf.</th><th>ECE ↓</th>').join('') + '</tr></thead><tbody>';
    D.models.forEach(m => {
      html += `<tr><td><span class="m">${m.name}</span></td>`;
      COND.forEach(c => {
        const r = m.calib[c.k];
        const a = heatCell(r.acc, 'acc', 20, 100), e = heatCell(r.ece, 'asr', 0, 60);
        const gap = r.conf - r.acc;
        html += `<td class="v gs ${a.dark ? 'dark' : ''}" style="background:${a.bg}">${f2(r.acc)}</td>` +
          `<td class="v" data-tip="Mean confidence ${f2(r.conf)}% vs accuracy ${f2(r.acc)}%<br>gap: <b>${gap >= 0 ? '+' : ''}${f1(gap)} points</b>">${f2(r.conf)}</td>` +
          `<td class="v ${e.dark ? 'dark' : ''}" style="background:${e.bg}">${f2(r.ece)}</td>`;
      });
      html += '</tr>';
    });
    tb.innerHTML = html + '</tbody>';
    tb.querySelectorAll('td[data-tip]').forEach(td => hover(td, td.dataset.tip));
  })();

  /* ------------------------------------------------------------ RQ2 reliability */
  (function reliability() {
    const hidden = new Set();
    const leg = $('#rq2-legend');
    COND.forEach((c, i) => {
      const b = H('button', { type: 'button' }, leg, `<span class="key" style="background:${c.color}"></span>${c.short === 'clean' ? 'Clean' : c.short}`);
      b.addEventListener('click', () => { hidden.has(i) ? hidden.delete(i) : hidden.add(i); b.classList.toggle('off', hidden.has(i)); draw(); });
    });
    H('span', { style: 'display:inline-flex;align-items:center;gap:7px;color:#60717b;font-weight:600' }, leg,
      '<svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#adb6bb" stroke-width="1.4" stroke-dasharray="3 2"/></svg>Perfect calibration');
    const box = $('#rq2-rel');
    function draw() {
      box.innerHTML = '';
      D.models.forEach((m, mi) => {
        const div = H('div', {}, box);
        const fr = frame(div, { W: 260, H: 236, x: [25, 100], y: [0, 100], xt: [25, 50, 75, 100], yt: [0, 25, 50, 75, 100], title: m.name, xl: 'Confidence (%)', yl: mi === 0 ? 'Accuracy (%)' : '', m: { l: 40, r: 10 } });
        S('line', { x1: fr.X(25), y1: fr.Y(25), x2: fr.X(100), y2: fr.Y(100), stroke: '#adb6bb', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, fr.svg);
        COND.forEach((c, ci) => {
          if (hidden.has(ci)) return;
          const pts = m.bins[c.k].filter(b => b.n >= 10);
          S('path', { d: 'M' + pts.map(b => `${fr.X(b.conf)} ${fr.Y(b.acc)}`).join('L'), fill: 'none', stroke: c.color, 'stroke-width': 1.7, 'stroke-linejoin': 'round' }, fr.svg);
          pts.forEach(b => {
            const r = 1.8 + Math.sqrt(b.n) / 6;
            const dot = S('circle', { cx: fr.X(b.conf), cy: fr.Y(b.acc), r: Math.min(r, 7), fill: c.color, 'fill-opacity': .85, stroke: '#fff', 'stroke-width': .8 }, fr.svg);
            hover(dot, `<b>${m.name}</b> · ${c.name}<br>mean confidence <b>${f1(b.conf)}%</b>, accuracy <b>${f1(b.acc)}%</b><br><span class="muted">${b.n} of 1,440 decisions in this bin · gap ${f1(b.conf - b.acc)} pts</span>`);
          });
        });
      });
    }
    draw();
  })();

  /* ------------------------------------------------------------ RQ2 severity + threshold (shared τ) */
  const tauIn = $('#tau'), tauOut = $('#tau-out');
  const tauListeners = [];
  tauIn.addEventListener('input', () => { tauOut.textContent = (+tauIn.value).toFixed(2); tauListeners.forEach(f => f(+tauIn.value)); });
  $('#tau-reset').addEventListener('click', () => { tauIn.value = '0.80'; tauIn.dispatchEvent(new Event('input')); });

  (function severity() {
    const box = $('#rq2-sev');
    const sum = $('#sev-summary');
    const SC = ['s1', 's2', 's3', 's4'];
    const NAMES = ['S1 correct, P(c) kept', 'S2 correct, P(c) fell', 'S3 wrong, conf < τ', 'S4 wrong, conf ≥ τ'];
    const style = 'display:grid;grid-template-columns:minmax(150px,210px) 1fr 74px;gap:10px;align-items:center;margin:5px 0;font-size:14px';
    function draw(tau) {
      box.innerHTML = '';
      const thr = Math.round(tau * 1000);
      let s4wins = 0;
      D.models.forEach((m, mi) => {
        ['poison_conclusion', 'poison_evidence'].forEach((v, vi) => {
          const rr = m.paired[v], n = rr.length;
          const c = [0, 0, 0, 0];
          rr.forEach(([ok, fell, cf]) => { c[ok ? (fell ? 1 : 0) : (cf < thr ? 2 : 3)]++; });
          if (c[3] > c[2]) s4wins++;
          const row = H('div', { style }, box);
          H('div', { style: 'line-height:1.25' }, row, vi === 0 ? `<span class="m" style="color:#2e3f49;font-weight:700">${m.name}</span><br><span style="color:#3979B5;font-weight:700;font-size:13px">Conclusion</span> <span style="color:#8a979f;font-size:12px">N₀ = ${n.toLocaleString()}</span>` : `<span style="color:#b06f22;font-weight:700;font-size:13px">Evidence</span>`);
          const barEl = H('div', { style: 'display:flex;height:24px;border-radius:3px;overflow:hidden;background:#eef2f4' }, row);
          c.forEach((k, i) => {
            const pct = 100 * k / n;
            const segEl = H('div', { class: 'sw ' + SC[i], style: `width:${pct}%;height:100%;border-radius:0;border:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:${i === 1 || i === 2 ? '#2e3f49' : '#fff'};transition:width .35s;overflow:hidden;white-space:nowrap` }, barEl, pct >= 8 ? f1(pct) : '');
            hover(segEl, `<b>${m.name}</b> · ${v === 'poison_conclusion' ? 'Conclusion' : 'Evidence'}<br>${NAMES[i]}: <b>${f2(pct)}%</b><br><span class="muted">${k} of ${n} clean-correct tasks · τ = ${tau.toFixed(2)}</span>`);
          });
          const wrong = c[2] + c[3];
          H('div', { style: 'font-size:12.5px;color:#60717b;line-height:1.25;text-align:right' }, row, `<b style="color:#2e3f49;font-size:14px">${wrong ? f1(100 * c[3] / wrong) : '–'}%</b><br>S4/error`);
        });
        if (mi < D.models.length - 1) H('div', { style: 'height:6px' }, box);
      });
      sum.innerHTML = `At <b>τ = ${tau.toFixed(2)}</b>, S4 exceeds S3 in <b>${s4wins} of 8</b> model–payload conditions. S4/error is the share of wrong poisoned actions that a filter at τ would still admit.` + (Math.abs(tau - 0.8) < 1e-9 ? ' This is the paper’s setting.' : '');
    }
    tauListeners.push(draw);
    draw(+tauIn.value);
  })();

  (function threshold() {
    const st = { m: 0 };
    seg($('#thr-model'), D.models.map((m, i) => ({ value: i, label: m.name, color: m.color })), v => { st.m = v; draw(); }, st.m);
    const box = $('#rq2-thr');
    const ts = []; for (let t = 50; t <= 99; t++) ts.push(t / 100);
    function curves(m) {
      return COND.map(c => {
        const obs = m.obs[c.k];
        return ts.map(t => {
          const thr = Math.round(t * 1000);
          let keep = 0, bad = 0;
          for (const [cf, ok] of obs) if (cf >= thr) { keep++; if (!ok) bad++; }
          return { t, keep, bad, cov: 100 * keep / obs.length, err: keep ? 100 * bad / keep : null };
        });
      });
    }
    let cache = {};
    function draw() {
      const m = D.models[st.m];
      const cv = cache[st.m] || (cache[st.m] = curves(m));
      const tau = +tauIn.value;
      box.innerHTML = '';
      [['cov', 'Retained decisions (%)'], ['err', 'Error among retained (%)']].forEach(([k, yl]) => {
        const div = H('div', {}, box);
        const fr = frame(div, { W: 400, H: 250, x: [.5, .99], y: [0, 100], xt: [.5, .6, .7, .8, .9, .99], xfmt: v => v.toFixed(2), yt: [0, 25, 50, 75, 100], title: k === 'cov' ? 'Coverage' : 'Residual risk', xl: 'Threshold τ (keep confidence ≥ τ)', yl, m: { l: 46, r: 14 } });
        const tx = fr.X(tau);
        S('rect', { x: tx, y: fr.m.t - 4, width: Math.max(0, fr.X(.99) - tx), height: fr.H - fr.m.b - fr.m.t + 4, fill: '#f3f6f7' }, fr.svg).parentNode.insertBefore(fr.svg.lastChild, fr.svg.firstChild);
        S('line', { x1: tx, x2: tx, y1: fr.m.t - 4, y2: fr.H - fr.m.b, stroke: '#2e3f49', 'stroke-width': 1.2 }, fr.svg);
        T(fr.svg, tx + 4, fr.m.t + 6, 'τ = ' + tau.toFixed(2), { class: 'vlab' });
        COND.forEach((c, ci) => {
          const pts = cv[ci].filter(p => p[k] != null);
          S('path', { d: 'M' + pts.map(p => `${fr.X(p.t)} ${fr.Y(p[k])}`).join('L'), fill: 'none', stroke: c.color, 'stroke-width': 2, 'stroke-linejoin': 'round' }, fr.svg);
          const at = cv[ci].find(p => Math.abs(p.t - tau) < 1e-9);
          if (at && at[k] != null) S('circle', { cx: fr.X(tau), cy: fr.Y(at[k]), r: 3.6, fill: c.color, stroke: '#fff', 'stroke-width': 1 }, fr.svg);
        });
        columns(fr, ts, i => `<b>${m.name}</b> · τ = ${ts[i].toFixed(2)}<br>` + COND.map((c, ci) => {
          const p = cv[ci][i];
          return `<span style="color:${c.color}">●</span> ${c.short === 'clean' ? 'Clean' : c.short}: kept <b>${p.keep}</b> (${f1(p.cov)}%), wrong <b>${p.bad}</b>${p.err != null ? ` (${f1(p.err)}%)` : ''}`;
        }).join('<br>'));
      });
    }
    tauListeners.push(draw);
    draw();
  })();

  /* ------------------------------------------------------------ RQ3 prompts */
  (function prompts() {
    const st = { k: 'C' };
    seg($('#pr-metric'), [{ value: 'C', label: 'Conclusion ASR' }, { value: 'E', label: 'Evidence ASR' }, { value: 'pooled', label: 'Pooled ASR' }, { value: 'clean', label: 'Clean accuracy' }], v => { st.k = v; draw(); }, st.k);
    const box = $('#rq3-prompts');
    box.className = 'smallmult four';
    const models = [...new Set(D.prompts.map(p => p.model))];
    function draw() {
      box.innerHTML = '';
      const isAcc = st.k === 'clean';
      models.forEach((mn, mi) => {
        const div = H('div', {}, box);
        const fr = frame(div, { W: 250, H: 230, x: [0, 3], y: [0, 100], yt: [0, 20, 40, 60, 80, 100], title: mn, yl: mi === 0 ? (isAcc ? 'Clean accuracy (%)' : 'Attack success rate (%)') : '', m: { l: 40, r: 6, b: 30 } });
        D.prompts.filter(p => p.model === mn).forEach((p, j) => {
          const v = p[st.k], x = fr.X(j + .5), w = 46;
          const r = S('rect', { x: x - w / 2, y: fr.Y(v), width: w, height: fr.Y(0) - fr.Y(v), fill: RULE_COL[p.rule], rx: 1.5 }, fr.svg);
          T(fr.svg, x, fr.Y(v) - 5, f1(v), { 'text-anchor': 'middle', class: 'vlab' });
          T(fr.svg, x, fr.H - fr.m.b + 16, p.rule, { 'text-anchor': 'middle' });
          const base = D.prompts.find(q => q.model === mn && q.rule === 'Baseline')[st.k];
          hover(r, `<b>${mn}</b> · ${p.rule}<br>${{ C: 'Conclusion ASR', E: 'Evidence ASR', pooled: 'Pooled ASR', clean: 'Clean accuracy' }[st.k]}: <b>${f2(v)}%</b>` + (p.rule !== 'Baseline' ? `<br><span class="muted">${v - base >= 0 ? '+' : ''}${f2(v - base)} points vs Baseline</span>` : ''));
        });
      });
    }
    draw();
  })();

  /* ------------------------------------------------------------ RQ3 recovery */
  (function recovery() {
    const CFG = ['Decisions', 'none', 'low', 'medium', 'high'];
    const st = { p: 'Cautious', c: 'low' };
    seg($('#rec-prompt'), ['Baseline', 'Cautious'].map(p => ({ value: p, label: p, color: RULE_COL[p] })), v => { st.p = v; draw(); }, st.p);
    seg($('#rec-config'), CFG.slice(1).map(c => ({ value: c, label: 'chat · ' + c })), v => { st.c = v; draw(); }, st.c);
    const cards = $('#rec-cards'), box = $('#rq3-rec');
    const get = (p, c) => D.recovery.find(r => r.prompt === p && r.config === c);
    function draw() {
      const d = get(st.p, 'Decisions'), r = get(st.p, st.c);
      cards.innerHTML =
        `<div class="rcard"><p>Pooled attack success</p><div class="big"><b style="color:#b4534b">${f2(r.pooled)}%</b><s>vs ${f2(d.pooled)}% Decisions</s></div></div>` +
        `<div class="rcard"><p>Poisoned accuracy</p><div class="big"><b style="color:#168574">${f2(r.poisoned)}%</b><s>vs ${f2(d.poisoned)}%</s></div></div>` +
        `<div class="rcard"><p>Mean latency · reasoning tokens</p><div class="big"><b>${r.latency.toFixed(3)} s</b><s>vs ${d.latency.toFixed(3)} s</s><span>${r.tokens != null ? f2(r.tokens) + ' tokens' : ''}</span></div></div>`;
      box.innerHTML = '';
      [['pooled', 'Pooled attack success (%)', [0, 75], [0, 25, 50, 75], v => v], ['latency', 'Mean latency (s)', [0, 2.5], [0, .5, 1, 1.5, 2, 2.5], v => v.toFixed(1)]].forEach(([k, yl, ydom, yt, yfmt]) => {
        const div = H('div', {}, box);
        const fr = frame(div, { W: 420, H: 250, x: [-.5, 4.5], y: ydom, yt, yfmt, xt: [0, 1, 2, 3, 4], xlabels: CFG, title: k === 'pooled' ? 'Attack success' : 'Response time', xl: 'Native Decisions → chat reasoning effort', yl, m: { l: 48, r: 12 } });
        const si = CFG.indexOf(st.c);
        S('rect', { x: fr.X(si - .42), y: fr.m.t - 4, width: fr.X(.84) - fr.X(0), height: fr.H - fr.m.b - fr.m.t + 4, fill: '#f1f4f6' }, fr.svg).parentNode.insertBefore(fr.svg.lastChild, fr.svg.firstChild);
        S('line', { x1: fr.X(.5), x2: fr.X(.5), y1: fr.m.t - 4, y2: fr.H - fr.m.b, stroke: '#cfd8dd', 'stroke-dasharray': '3 3' }, fr.svg);
        ['Baseline', 'Cautious'].forEach(p => {
          const pts = CFG.map((c, i) => [fr.X(i), fr.Y(get(p, c)[k])]);
          const on = p === st.p;
          S('path', { d: 'M' + pts.slice(1).map(q => q.join(' ')).join('L'), fill: 'none', stroke: RULE_COL[p], 'stroke-width': on ? 2.4 : 1.4, opacity: on ? 1 : .45 }, fr.svg);
          pts.forEach((q, i) => {
            const mk = marker(fr.svg, p === 'Baseline' ? 'circle' : 'square', q[0], q[1], on ? 3.6 : 2.8, RULE_COL[p]);
            mk.setAttribute('opacity', on ? 1 : .5);
            const rr = get(p, CFG[i]);
            hover(mk, `<b>${p} · ${CFG[i] === 'Decisions' ? 'native Decisions' : 'chat ' + CFG[i]}</b><br>pooled ASR <b>${f2(rr.pooled)}%</b> · poisoned acc. ${f2(rr.poisoned)}%<br>clean acc. ${f2(rr.clean)}% · latency ${rr.latency.toFixed(3)} s (P95 ${rr.p95.toFixed(3)} s)<br><span class="muted">${rr.tokens != null ? f2(rr.tokens) + ' reasoning tokens' : 'no comparable token count'}</span>`);
          });
        });
        const r2 = get(st.p, st.c);
        T(fr.svg, fr.X(si), fr.Y(r2[k]) - 9, k === 'pooled' ? f1(r2[k]) + '%' : r2[k].toFixed(2) + ' s', { 'text-anchor': 'middle', class: 'vlab' });
      });
    }
    draw();
  })();

  /* ------------------------------------------------------------ copy bibtex */
  $('#copy-bib').addEventListener('click', e => {
    navigator.clipboard.writeText($('#bibtex').textContent).then(() => { e.target.textContent = 'Copied'; setTimeout(() => { e.target.textContent = 'Copy'; }, 1500); });
  });
})();
