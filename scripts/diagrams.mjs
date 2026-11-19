// SVG diagrams for the Clearline case study, drawn from content.json.
// Each diagram has a wide layout (desktop) and a tall one (phones), so text
// stays readable instead of shrinking with the viewport.

const PURPLE = '#A073C4';
const INK = '#1c1c1a';
const MUTED = '#5f5f5a';
const LINE = '#9a9a94';

const STYLE = {
  service: { fill: '#ffffff', stroke: PURPLE, dash: '', rx: 10 },
  topic: { fill: '#f2eaf8', stroke: '#c9b0de', dash: '', rx: 46 },
  store: { fill: '#f4f4f2', stroke: '#8f8f89', dash: '', rx: 10 },
  external: { fill: '#ffffff', stroke: '#8f8f89', dash: '6 5', rx: 10 },
};
const KIND_LABEL = { service: 'service', topic: 'Kafka topic', store: 'data store', external: 'outside' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function defs(id) {
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${LINE}"/></marker></defs>`;
}

function box(n, x, y, w, h) {
  const s = STYLE[n.kind] ?? STYLE.service;
  const cx = x + w / 2;
  const chipW = Math.min(w - 24, n.setting.length * 7.4 + 22);
  return `<g>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${s.rx}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>
<text x="${cx}" y="${y + 30}" text-anchor="middle" font-size="16" font-weight="700" fill="${INK}">${esc(n.title)}</text>
<text x="${cx}" y="${y + 50}" text-anchor="middle" font-size="12.5" fill="${MUTED}">${esc(n.what)}</text>
<rect x="${cx - chipW / 2}" y="${y + h - 30}" width="${chipW}" height="20" rx="10" fill="${n.kind === 'topic' ? '#ffffff' : '#f2eaf8'}"/>
<text x="${cx}" y="${y + h - 16}" text-anchor="middle" font-size="12" font-weight="600" fill="#5a3a7a" font-family="ui-monospace, Menlo, monospace">${esc(n.setting)}</text>
</g>`;
}

function path(points, marker, { dashed = false, label = '', labelAt = null } = {}) {
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  let out = `<path d="${d}" fill="none" stroke="${LINE}" stroke-width="2"${dashed ? ' stroke-dasharray="5 5"' : ''} marker-end="url(#${marker})"/>`;
  if (label && labelAt) {
    out += `<text x="${labelAt[0]}" y="${labelAt[1]}" text-anchor="middle" font-size="11.5" font-style="italic" fill="${MUTED}">${esc(label)}</text>`;
  }
  return out;
}

function legend(x, y, horizontal) {
  const items = Object.entries(KIND_LABEL);
  return items
    .map(([kind, label], i) => {
      const s = STYLE[kind];
      const ix = horizontal ? x + i * 150 : x;
      const iy = horizontal ? y : y + i * 26;
      return `<rect x="${ix}" y="${iy}" width="26" height="16" rx="${kind === 'topic' ? 8 : 4}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"${s.dash ? ' stroke-dasharray="4 3"' : ''}/><text x="${ix + 34}" y="${iy + 12.5}" font-size="12.5" fill="${MUTED}">${label}</text>`;
    })
    .join('');
}

function svg(w, h, cls, title, body) {
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" xmlns="http://www.w3.org/2000/svg" font-family="Source Sans Pro, system-ui, sans-serif"><title>${esc(title)}</title>${body}</svg>`;
}

/** System architecture: 5 columns, a snake through 3 rows, reconciler on a lane. */
export function architecture(diagram) {
  const N = diagram.nodes;
  const W = 200;
  const H = 96;
  const col = (c) => 24 + c * 236;
  const row = (r) => 64 + r * 172;
  const at = {
    client: [0, 0], gateway: [1, 0], orders: [2, 0], adapter: [3, 0], engine: [4, 0],
    trades: [3, 1], settlement: [2, 1], postgres: [1, 1], relay: [0, 1], reconciler: [4, 1],
    events: [0, 2], balance: [1, 2], valkey: [2, 2], dashboard: [3, 2],
  };
  const pos = (id) => ({ x: col(at[id][0]), y: row(at[id][1]) });
  const mid = (id) => ({ x: pos(id).x + W / 2, y: pos(id).y + H / 2 });
  const right = (id) => [pos(id).x + W, mid(id).y];
  const left = (id) => [pos(id).x, mid(id).y];
  const top = (id) => [mid(id).x, pos(id).y];
  const bottom = (id) => [mid(id).x, pos(id).y + H];
  const m = 'arrow-wide';
  const gap = 4; // keep arrowheads off the box stroke
  const toL = ([x, y]) => [x - gap, y];
  const toR = ([x, y]) => [x + gap, y];
  const toT = ([x, y]) => [x, y - gap];
  const toB = ([x, y]) => [x, y + gap];

  const lane1 = row(1) + H + 38; // between rows 2 and 3
  const lane2 = row(2) + H + 30; // below row 3
  const edges = [
    path([right('client'), toL(left('gateway'))], m),
    path([right('gateway'), toL(left('orders'))], m),
    path([right('orders'), toL(left('adapter'))], m),
    path([right('adapter'), toL(left('engine'))], m, { label: 'gRPC', labelAt: [right('adapter')[0] + 18, mid('adapter').y - 8] }),
    path([bottom('adapter'), toT(top('trades'))], m),
    path([left('trades'), toR(right('settlement'))], m),
    path([left('settlement'), toR(right('postgres'))], m, { label: 'one tx', labelAt: [left('settlement')[0] - 18, mid('settlement').y - 8] }),
    path([left('postgres'), toR(right('relay'))], m),
    path([bottom('relay'), toT(top('events'))], m),
    path([right('events'), toL(left('balance'))], m),
    path([right('balance'), toL(left('valkey'))], m),
    path([bottom('balance'), [mid('balance').x, lane2], [mid('dashboard').x, lane2], toB(bottom('dashboard'))], m, {
      label: 'Server-Sent Events', labelAt: [(mid('balance').x + mid('dashboard').x) / 2, lane2 - 7],
    }),
    path([bottom('reconciler'), [mid('reconciler').x, lane1], [mid('postgres').x, lane1], toB(bottom('postgres'))], m, {
      dashed: true, label: 'verifies books and cache', labelAt: [(mid('reconciler').x + mid('settlement').x) / 2 + 40, lane1 - 7],
    }),
    path([[mid('valkey').x, lane1], toT(top('valkey'))], m, { dashed: true }),
  ];
  const boxes = Object.keys(at).map((id) => box(N[id], pos(id).x, pos(id).y, W, H)).join('');
  const width = col(4) + W + 24;
  const height = lane2 + 40;
  const wide = svg(width, height, 'diagram diagram--wide', 'Clearline architecture', defs(m) + legend(24, 20, true) + edges.join('') + boxes);

  // Tall: one column in pipeline order; side components join inline.
  const order = ['client', 'gateway', 'orders', 'adapter', 'engine', 'trades', 'settlement', 'postgres', 'relay', 'events', 'balance', 'valkey', 'dashboard', 'reconciler'];
  const TW = 320;
  const TH = 92;
  const step = 132;
  const tx = 20;
  const ty = (i) => 130 + i * step;
  const mt = 'arrow-tall';
  // In one column, neighbors are not always connected: say what each link is.
  const labels = {
    engine: 'adapter calls engine (gRPC)',
    trades: 'adapter publishes trades',
    postgres: 'one transaction',
    valkey: 'balance service writes',
    dashboard: 'balance service streams (SSE)',
    reconciler: 'checks Postgres and Valkey',
  };
  let tallEdges = '';
  order.slice(1).forEach((id, i) => {
    const y1 = ty(i) + TH;
    const y2 = ty(i + 1) - 4;
    const dashed = id === 'reconciler';
    tallEdges += path([[tx + TW / 2, y1], [tx + TW / 2, y2]], mt, { dashed });
    if (labels[id]) {
      tallEdges += `<text x="${tx + TW / 2 + 12}" y="${(y1 + y2) / 2 + 4}" font-size="11.5" font-style="italic" fill="${MUTED}">${esc(labels[id])}</text>`;
    }
  });
  const tallBoxes = order.map((id, i) => box(N[id], tx, ty(i), TW, TH)).join('');
  const tall = svg(TW + 40, ty(order.length - 1) + TH + 24, 'diagram diagram--tall', 'Clearline architecture', defs(mt) + legend(20, 18, false) + tallEdges + tallBoxes);
  return wide + tall;
}

/** The settlement transaction: steps, the duplicate branch, crash outcomes. */
export function settlementFlow(flow) {
  const m = 'arrow-flow';
  const steps = flow.steps;
  const W = 168;
  const H = 104;
  const gapX = 28;
  const x = (i) => 24 + i * (W + gapX);
  const y = 40;
  const stepBox = (s, bx, by, w, h, accent) => `<g>
<rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="10" fill="${accent ? '#f2eaf8' : '#ffffff'}" stroke="${PURPLE}" stroke-width="2"/>
<text x="${bx + w / 2}" y="${by + 30}" text-anchor="middle" font-size="16" font-weight="700" fill="${INK}">${esc(s.title)}</text>
${wrap(s.what, w - 20).map((line, i) => `<text x="${bx + w / 2}" y="${by + 52 + i * 16}" text-anchor="middle" font-size="12.5" fill="${MUTED}">${esc(line)}</text>`).join('')}
</g>`;
  let body = defs(m);
  steps.forEach((s, i) => {
    body += stepBox(s, x(i), y, W, H, s.title === 'COMMIT');
    if (i < steps.length - 1) body += path([[x(i) + W, y + H / 2], [x(i + 1) - 4, y + H / 2]], m);
  });
  // Duplicate branch: from Dedupe straight to Ack, below the happy path.
  const dedupe = steps.findIndex((s) => s.title === 'Dedupe');
  const by = y + H + 64;
  const bx1 = x(dedupe) + W / 2;
  const bx2 = x(steps.length - 1) + W / 2;
  body += path([[bx1, y + H], [bx1, by], [bx2, by], [bx2, y + H + 4]], m, { dashed: true });
  body += `<text x="${(bx1 + bx2) / 2}" y="${by - 10}" text-anchor="middle" font-size="13" font-style="italic" fill="${MUTED}">duplicate: ${esc(flow.duplicate.replace(/^Already settled: /, ''))}</text>`;
  // Crash outcomes.
  const cy = by + 40;
  flow.crashes.forEach((c, i) => {
    const cx = 24 + i * 590;
    body += `<rect x="${cx}" y="${cy}" width="560" height="44" rx="8" fill="#f7f7f5" stroke="#d8d8d4"/>
<text x="${cx + 16}" y="${cy + 27}" font-size="13.5" fill="${INK}"><tspan font-weight="700">${esc(c.when)}:</tspan> ${esc(c.then)}</text>`;
  });
  const width = x(steps.length - 1) + W + 24;
  const wide = svg(width, cy + 44 + 20, 'diagram diagram--wide', 'Exactly-once settlement transaction', body);

  // Tall: vertical steps, duplicate note, crash notes.
  const TW = 320;
  const TH = 84;
  const step = 116;
  const tx = 20;
  const ty = (i) => 20 + i * step;
  const mt = 'arrow-flow-tall';
  let tb = defs(mt);
  steps.forEach((s, i) => {
    tb += stepBox(s, tx, ty(i), TW, TH, s.title === 'COMMIT');
    if (i < steps.length - 1) tb += path([[tx + TW / 2, ty(i) + TH], [tx + TW / 2, ty(i + 1) - 4]], mt);
  });
  let ny = ty(steps.length - 1) + TH + 26;
  const note = (text, bold) => {
    const lines = wrap(text, TW - 24);
    const h = 20 + lines.length * 18;
    const out = `<rect x="${tx}" y="${ny}" width="${TW}" height="${h}" rx="8" fill="#f7f7f5" stroke="#d8d8d4"/>${lines
      .map((l, i) => `<text x="${tx + 12}" y="${ny + 24 + i * 18}" font-size="13.5" fill="${INK}"${bold && i === 0 ? ' font-weight="700"' : ''}>${esc(l)}</text>`)
      .join('')}`;
    ny += h + 12;
    return out;
  };
  tb += note(`Duplicate: ${flow.duplicate.replace(/^Already settled: /, '')}`, false);
  flow.crashes.forEach((c) => (tb += note(`${c.when}: ${c.then}`, false)));
  const tall = svg(TW + 40, ny + 8, 'diagram diagram--tall', 'Exactly-once settlement transaction', tb);
  return wide + tall;
}

// Greedy word wrap by an approximate character width (12.5 px font).
function wrap(text, width) {
  const max = Math.floor(width / 6.6);
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
