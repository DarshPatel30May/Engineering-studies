/**
 * Pattern development (sheet-metal) by triangulation.
 *
 * Square-to-round transition piece: square base (side S) at z = 0, concentric circular top
 * (diameter D) at height H. The circle is divided into N equal parts (N a multiple of 4).
 * Each square corner is joined to the circle points of its quadrant (a "fan" of oblique cones);
 * flat triangles join each square side to the circle point between them.
 * The seam is placed on the line joining the mid-point of one side to the nearest circle point.
 *
 * True length of each line = √(plan length² + H²) — the same "true-length triangle" construction
 * done graphically in AS 1100 drawing.
 */
export interface P2 {
  x: number;
  y: number;
}
export interface TrueLength {
  from: string;
  to: string;
  plan: number;
  length: number;
}
export interface Development {
  outline: P2[];
  foldLines: [P2, P2][];
  labels: { p: P2; text: string }[];
  trueLengths: TrueLength[];
  plan: { corners: P2[]; circle: P2[] };
  developedTopLength: number;
  developedBottomLength: number;
  seamLength: number;
}

const dist = (a: P2, b: P2) => Math.hypot(a.x - b.x, a.y - b.y);

/** Place a point R at distance rP from P and rQ from Q, on the side of PQ opposite to `away` (or to the right if none). */
function place(P: P2, Q: P2, rP: number, rQ: number, away?: P2): P2 {
  const d = dist(P, Q);
  const a = (rP * rP - rQ * rQ + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, rP * rP - a * a));
  const ex = { x: (Q.x - P.x) / d, y: (Q.y - P.y) / d };
  const base = { x: P.x + a * ex.x, y: P.y + a * ex.y };
  const c1 = { x: base.x - h * ex.y, y: base.y + h * ex.x };
  const c2 = { x: base.x + h * ex.y, y: base.y - h * ex.x };
  const side = (p: P2) => (Q.x - P.x) * (p.y - P.y) - (Q.y - P.y) * (p.x - P.x);
  if (away) return Math.sign(side(c1)) !== Math.sign(side(away)) ? c1 : c2;
  return c1.x >= c2.x ? c1 : c2;
}

export function developSquareToRound(S: number, D: number, H: number, N = 12): Development {
  if (N % 4 !== 0) throw new Error('N must be a multiple of 4');
  const r = D / 2;
  const q = N / 4;
  // Plan geometry (3D with z). Corners K1..K4 at 45°, 135°, 225°, 315°.
  const K3d = [45, 135, 225, 315].map((deg) => ({
    x: (S / 2) * Math.sign(Math.cos((deg * Math.PI) / 180)),
    y: (S / 2) * Math.sign(Math.sin((deg * Math.PI) / 180)),
    z: 0,
  }));
  const C3d = Array.from({ length: N + 1 }, (_, k) => {
    const t = (2 * Math.PI * k) / N;
    return { x: r * Math.cos(t), y: r * Math.sin(t), z: H };
  });
  const M3d = { x: S / 2, y: 0, z: 0 };
  const d3 = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

  const trueLengths: TrueLength[] = [];
  for (let k = 0; k <= q; k++) {
    const plan = Math.hypot(K3d[0].x - C3d[k].x, K3d[0].y - C3d[k].y);
    trueLengths.push({ from: 'K1', to: `C${k}`, plan, length: Math.hypot(plan, H) });
  }
  const seamLength = d3(M3d, C3d[0]);

  // Unroll
  const M = { x: 0, y: 0 };
  const C: P2[] = [];
  C[0] = { x: 0, y: seamLength };
  const K: P2[] = [];
  K[0] = place(M, C[0], S / 2, d3(K3d[0], C3d[0]));
  const fold: [P2, P2][] = [[M, C[0]]];
  let old: P2 = M;
  let ci = 0;
  for (let corner = 0; corner < 4; corner++) {
    const Kc = K[corner];
    // Fan around this corner: C[ci] → C[ci + q]
    for (let s = 0; s < q; s++) {
      const next = place(Kc, C[ci], d3(K3d[corner], C3d[ci + 1]), d3(C3d[ci], C3d[ci + 1]), old);
      old = C[ci];
      ci += 1;
      C[ci] = next;
      fold.push([Kc, C[ci]]);
    }
    if (corner < 3) {
      // Flat triangle to next corner
      const Kn = place(Kc, C[ci], S, d3(K3d[corner + 1], C3d[ci]), old);
      K[corner + 1] = Kn;
      old = Kc;
      fold.push([Kn, C[ci]]);
    }
  }
  const Mend = place(K[3], C[N], S / 2, seamLength, C[N - 1]);

  const outline: P2[] = [M, ...K, Mend, ...C.slice().reverse()];
  const labels = [
    { p: M, text: 'Seam' },
    ...K.map((p, i) => ({ p, text: `K${i + 1}` })),
    { p: Mend, text: 'Seam' },
    ...C.filter((_, i) => i % q === 0).map((p, i) => ({ p, text: `C${i * q}` })),
  ];
  let top = 0;
  for (let i = 0; i < N; i++) top += dist(C[i], C[i + 1]);
  const bottom = dist(M, K[0]) + dist(K[0], K[1]) + dist(K[1], K[2]) + dist(K[2], K[3]) + dist(K[3], Mend);
  return {
    outline,
    foldLines: fold.slice(1),
    labels,
    trueLengths,
    plan: { corners: K3d.map(({ x, y }) => ({ x, y })), circle: C3d.slice(0, N).map(({ x, y }) => ({ x, y })) },
    developedTopLength: top,
    developedBottomLength: bottom,
    seamLength,
  };
}

/**
 * Development of a cylinder (diameter D) cut by a plane inclined at `cutDeg` to the base,
 * with minimum height h0. Developed edge: y(s) = h0 + (D/2)(1 + cos θ)·tan(cut), s = θ·D/2.
 */
export function developTruncatedCylinder(D: number, h0: number, cutDeg: number, N = 24): P2[] {
  const t = Math.tan((cutDeg * Math.PI) / 180);
  const pts: P2[] = [];
  for (let k = 0; k <= N; k++) {
    const th = (2 * Math.PI * k) / N;
    pts.push({ x: (th * D) / 2, y: h0 + (D / 2) * (1 + Math.cos(th)) * t });
  }
  return pts;
}
