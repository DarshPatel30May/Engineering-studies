/**
 * Exact orthographic projection of solids built from unit cubes (voxels).
 *
 * Coordinates: x → right (width), y → up (height), z → towards the viewer of the FRONT view (depth).
 * Views (third-angle arrangement, AS 1100):
 *   front: look along −z  → 2D (x, y)
 *   top:   look along −y  → 2D (x, −z)  (drawn ABOVE the front view)
 *   right: look along −x  → 2D (−z, y)  (drawn to the RIGHT of the front view)
 *
 * Visible edges = crease edges of the solid not covered by material in front of them.
 * Hidden edges = crease edges that are covered (drawn as thin dashed lines).
 */

export type Voxel = [number, number, number];
export interface VoxelModel {
  id: string;
  name: string;
  /** Dimension of one voxel in mm, for dimensioned drawings. */
  unit: number;
  voxels: Voxel[];
}
export type ViewName = 'front' | 'top' | 'right';
export interface Seg2 {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  hidden: boolean;
}

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

export function bounds(m: VoxelModel) {
  const xs = m.voxels.map((v) => v[0]);
  const ys = m.voxels.map((v) => v[1]);
  const zs = m.voxels.map((v) => v[2]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs) + 1,
    minY: Math.min(...ys),
    maxY: Math.max(...ys) + 1,
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs) + 1,
  };
}

/** All crease (feature) edges of the voxel solid as unit-length 3D segments. */
export function creaseEdges(m: VoxelModel): [Voxel, Voxel][] {
  const set = new Set(m.voxels.map((v) => key(...v)));
  const filled = (x: number, y: number, z: number) => set.has(key(x, y, z));
  const b = bounds(m);
  const edges: [Voxel, Voxel][] = [];
  // Edge along axis `ax` starting at lattice point p. The 4 voxels around it are offset in the other two axes.
  const check = (ax: 0 | 1 | 2, p: Voxel) => {
    const [o1, o2] = ([0, 1, 2] as const).filter((a) => a !== ax);
    const around: boolean[] = [];
    for (const [d1, d2] of [
      [-1, -1],
      [0, -1],
      [0, 0],
      [-1, 0],
    ]) {
      const v: Voxel = [p[0], p[1], p[2]];
      v[o1] += d1;
      v[o2] += d2;
      around.push(filled(...v));
    }
    const n = around.filter(Boolean).length;
    const diagonal = n === 2 && around[0] === around[2];
    if (n === 1 || n === 3 || diagonal) {
      const q: Voxel = [p[0], p[1], p[2]];
      q[ax] += 1;
      edges.push([p, q]);
    }
  };
  for (let x = b.minX; x <= b.maxX; x++)
    for (let y = b.minY; y <= b.maxY; y++)
      for (let z = b.minZ; z <= b.maxZ; z++) {
        if (x < b.maxX) check(0, [x, y, z]);
        if (y < b.maxY) check(1, [x, y, z]);
        if (z < b.maxZ) check(2, [x, y, z]);
      }
  return edges;
}

/** Map a 3D point to view coordinates (u right, v up) and depth d (larger = closer to viewer). */
export function toView(view: ViewName, p: [number, number, number]): { u: number; v: number; d: number } {
  const [x, y, z] = p;
  switch (view) {
    case 'front':
      return { u: x, v: y, d: z };
    case 'top':
      return { u: x, v: -z, d: y };
    case 'right':
      return { u: -z, v: y, d: x };
  }
}

/**
 * Is a point on an edge hidden? The point lies on a grid line in the view plane, touching two cells.
 * It is hidden only if BOTH adjacent cell columns contain material strictly in front of it.
 * (If only one does, the occluder's own outline coincides with the edge, so a visible line is drawn.)
 */
function hiddenAt(m: VoxelModel, view: ViewName, p: [number, number, number], along: 0 | 1 | 2): boolean {
  const vox = m.voxels.map((v) => ({ ...toView(view, [v[0] + 0.5, v[1] + 0.5, v[2] + 0.5]) }));
  const pv = toView(view, p);
  // Determine the two adjacent cells (centres) in the view plane.
  const axisU = (view === 'front' && along === 0) || (view === 'top' && along === 0) || (view === 'right' && along === 2);
  const cells = axisU
    ? [
        { u: pv.u, v: pv.v - 0.5 },
        { u: pv.u, v: pv.v + 0.5 },
      ]
    : [
        { u: pv.u - 0.5, v: pv.v },
        { u: pv.u + 0.5, v: pv.v },
      ];
  // A voxel occludes the point if it sits in that cell column and its rear face is at or in front of the point.
  return cells.every((c) => vox.some((q) => Math.abs(q.u - c.u) < 1e-6 && Math.abs(q.v - c.v) < 1e-6 && q.d - 0.5 >= pv.d - 1e-6));
}

/** Project the solid into one view, returning merged visible and hidden 2D segments. */
export function projectView(m: VoxelModel, view: ViewName): Seg2[] {
  const viewAxis = view === 'front' ? 2 : view === 'top' ? 1 : 0;
  const raw: Seg2[] = [];
  for (const [a, b] of creaseEdges(m)) {
    const along = ([0, 1, 2] as const).find((i) => a[i] !== b[i])!;
    if (along === viewAxis) continue; // projects to a point
    const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const hidden = hiddenAt(m, view, mid, along);
    const pa = toView(view, a);
    const pb = toView(view, b);
    raw.push({ x1: pa.u, y1: pa.v, x2: pb.u, y2: pb.v, hidden });
  }
  return mergeSegments(dedupe(raw));
}

/** Where a visible and a hidden segment project onto the same place, keep only the visible one. */
function dedupe(segs: Seg2[]): Seg2[] {
  const norm = (s: Seg2) => {
    const swap = s.x1 > s.x2 || (s.x1 === s.x2 && s.y1 > s.y2);
    return swap ? { ...s, x1: s.x2, y1: s.y2, x2: s.x1, y2: s.y1 } : s;
  };
  const map = new Map<string, Seg2>();
  for (const s0 of segs) {
    const s = norm(s0);
    const k = `${s.x1},${s.y1},${s.x2},${s.y2}`;
    const prev = map.get(k);
    if (!prev || (prev.hidden && !s.hidden)) map.set(k, s);
  }
  return Array.from(map.values());
}

/** Merge collinear, touching unit segments of the same visibility into longer lines. */
function mergeSegments(segs: Seg2[]): Seg2[] {
  const out: Seg2[] = [];
  const groups = new Map<string, Seg2[]>();
  for (const s of segs) {
    const horizontal = s.y1 === s.y2;
    const k = `${horizontal ? 'h' : 'v'}:${horizontal ? s.y1 : s.x1}:${s.hidden}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }
  for (const [k, list] of groups) {
    const horizontal = k.startsWith('h');
    const spans = list
      .map((s) => (horizontal ? [Math.min(s.x1, s.x2), Math.max(s.x1, s.x2)] : [Math.min(s.y1, s.y2), Math.max(s.y1, s.y2)]))
      .sort((p, q) => p[0] - q[0]);
    let cur = spans[0].slice();
    const flush = () => {
      const s = list[0];
      out.push(
        horizontal
          ? { x1: cur[0], y1: s.y1, x2: cur[1], y2: s.y1, hidden: s.hidden }
          : { x1: s.x1, y1: cur[0], x2: s.x1, y2: cur[1], hidden: s.hidden },
      );
    };
    for (let i = 1; i < spans.length; i++) {
      if (spans[i][0] <= cur[1] + 1e-9) cur[1] = Math.max(cur[1], spans[i][1]);
      else {
        flush();
        cur = spans[i].slice();
      }
    }
    flush();
  }
  return out;
}

/** Exposed faces for an isometric pictorial (painter's algorithm, back-to-front). */
export interface IsoFace {
  pts: [number, number][];
  shade: 'top' | 'left' | 'right';
  depth: number;
}
export function isometricFaces(m: VoxelModel, scale = 1): IsoFace[] {
  const set = new Set(m.voxels.map((v) => key(...v)));
  const filled = (x: number, y: number, z: number) => set.has(key(x, y, z));
  // Isometric: viewer looks from (+x, +y, +z) direction. Screen: X = (x − z)·cos30, Y = y + (x + z)·sin30 (up +)
  // SVG y points down, so screen Y = −y + (x + z)·sin30°.
  const P = (x: number, y: number, z: number): [number, number] => [
    (x - z) * Math.cos(Math.PI / 6) * scale,
    (-y + (x + z) * 0.5) * scale,
  ];
  const faces: IsoFace[] = [];
  for (const [x, y, z] of m.voxels) {
    if (!filled(x, y + 1, z))
      faces.push({ shade: 'top', depth: x + y + z + 1.5, pts: [P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)] });
    if (!filled(x, y, z + 1))
      faces.push({ shade: 'left', depth: x + y + z + 1.5, pts: [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)] });
    if (!filled(x + 1, y, z))
      faces.push({ shade: 'right', depth: x + y + z + 1.5, pts: [P(x + 1, y, z), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z)] });
  }
  return faces.sort((a, b) => a.depth - b.depth);
}

// ───────────────────── Sample engineering objects ─────────────────────

const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Voxel[] => {
  const v: Voxel[] = [];
  for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) v.push([x, y, z]);
  return v;
};
const minus = (a: Voxel[], b: Voxel[]) => {
  const s = new Set(b.map((v) => key(...v)));
  return a.filter((v) => !s.has(key(...v)));
};

export const MODELS: VoxelModel[] = [
  {
    id: 'angle-bracket',
    name: 'Angle bracket',
    unit: 10,
    voxels: [...box(0, 6, 0, 1, 0, 4), ...box(0, 1, 1, 5, 0, 4)],
  },
  {
    id: 'stepped-block',
    name: 'Stepped block',
    unit: 10,
    voxels: [...box(0, 6, 0, 2, 0, 4), ...box(0, 4, 2, 4, 0, 4), ...box(0, 2, 4, 6, 0, 4)],
  },
  {
    id: 'slotted-block',
    name: 'Slotted guide block',
    unit: 10,
    voxels: minus(box(0, 6, 0, 3, 0, 4), box(2, 4, 1, 3, 0, 4)),
  },
  {
    id: 'notched-block',
    name: 'Block with rear notch (hidden detail)',
    unit: 10,
    voxels: minus(box(0, 6, 0, 4, 0, 4), box(2, 4, 0, 2, 0, 2)),
  },
  {
    id: 'tee-support',
    name: 'Tee support',
    unit: 10,
    voxels: [...box(0, 6, 0, 1, 0, 4), ...box(2, 4, 1, 5, 1, 3)],
  },
  {
    id: 'corner-step',
    name: 'Corner-cut block',
    unit: 10,
    voxels: minus(box(0, 5, 0, 4, 0, 4), [...box(3, 5, 2, 4, 0, 4), ...box(0, 5, 2, 4, 0, 2)]),
  },
];
