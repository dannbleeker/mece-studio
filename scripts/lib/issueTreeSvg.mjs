// Diagram-from-source: a sample issue tree rendered to SVG from a constant tree.
// Both book builders expand the `<!-- ISSUE_TREE -->` placeholder into this markup,
// so the figure is vector-identical in the PDF and the EPUB and can never drift
// from its data. Palette mirrors MECE Studio's own canvas.

const INK = '#1f2937';
const LINE = '#cfd6e4';
const ROOT_FILL = '#eaf1fb';
const ROOT_STROKE = '#3f6fb0';
const NODE_FILL = '#ffffff';
const NODE_STROKE = '#c7cad1';

const NODE_W = 170;
const NODE_H = 38;
const COL = 210;
const ROW = 58;
const PAD = 14;

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

// The source of truth for the figure: a question decomposed into sub-issues.
const TREE = {
  label: 'Why are profits falling?',
  children: [
    {
      label: 'Revenue is down',
      children: [{ label: 'Fewer customers' }, { label: 'Lower price per sale' }],
    },
    {
      label: 'Costs are up',
      children: [{ label: 'Higher input costs' }, { label: 'Weaker efficiency' }],
    },
  ],
};

function layout(node, depth, cursor) {
  node.x = PAD + depth * COL;
  if (node.children?.length) {
    for (const c of node.children) layout(c, depth + 1, cursor);
    node.y = (node.children[0].y + node.children[node.children.length - 1].y) / 2;
  } else {
    node.y = PAD + cursor.row * ROW;
    cursor.row += 1;
  }
  return node;
}

function collect(node, nodes, edges) {
  nodes.push(node);
  for (const c of node.children ?? []) {
    edges.push([node, c]);
    collect(c, nodes, edges);
  }
}

function nodeSvg(n, isRoot) {
  const fill = isRoot ? ROOT_FILL : NODE_FILL;
  const stroke = isRoot ? ROOT_STROKE : NODE_STROKE;
  const weight = isRoot ? ' font-weight="600"' : '';
  return `<rect x="${n.x}" y="${n.y}" width="${NODE_W}" height="${NODE_H}" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><text x="${n.x + NODE_W / 2}" y="${n.y + NODE_H / 2 + 4}" text-anchor="middle" font-size="12.5" fill="${INK}"${weight}>${esc(n.label)}</text>`;
}

function edgeSvg(a, b) {
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const mx = (x1 + x2) / 2;
  return `<path d="M ${x1} ${y1} H ${mx} V ${y2} H ${x2}" fill="none" stroke="${LINE}" stroke-width="1.5"/>`;
}

export function issueTreeSvg() {
  const root = layout(structuredClone(TREE), 0, { row: 0 });
  const nodes = [];
  const edges = [];
  collect(root, nodes, edges);
  const leaves = nodes.filter((n) => !n.children?.length).length;
  const w = 2 * PAD + 2 * COL + NODE_W;
  const h = 2 * PAD + (leaves - 1) * ROW + NODE_H;
  const body =
    edges.map(([a, b]) => edgeSvg(a, b)).join('') +
    nodes.map((n) => nodeSvg(n, n === root)).join('');
  return `<div class="figure"><svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A sample issue tree: why are profits falling, split into revenue and cost branches, each into two drivers."><rect x="0" y="0" width="${w}" height="${h}" fill="none"/>${body}</svg><p class="figcaption">Figure 1. An issue tree decomposes a question into sub-issues. Profit splits into revenue and cost; each splits again into its drivers.</p></div>`;
}
