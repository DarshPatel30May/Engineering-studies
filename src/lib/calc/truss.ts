/**
 * Pin-jointed plane truss solver.
 *
 * Assumptions (stated in the UI):
 *  - Members are straight, two-force members joined by frictionless pins.
 *  - Loads and reactions act only at joints; member self-weight is ignored.
 *  - Small deflections: geometry does not change under load.
 *  - Statically determinate: m + r = 2j and the structure is geometrically stable.
 *
 * Sign convention: member force T is TENSION-POSITIVE. A negative value means compression.
 * At a joint, a tensile member pulls the joint TOWARDS the member (away from the joint along it).
 */
import { solveLinear } from './linalg';
import { tex, texb, clean } from './format';

export interface TrussNode {
  id: string;
  x: number;
  y: number;
}
export interface TrussMember {
  id: string;
  a: string;
  b: string;
}
export interface TrussSupport {
  node: string;
  /** pin: horizontal and vertical reactions; roller: reaction perpendicular to rolling surface (vertical here). */
  type: 'pin' | 'roller';
}
export interface TrussLoad {
  node: string;
  /** kN, +x to the right */
  Fx: number;
  /** kN, +y upward (a downward 10 kN load is Fy = −10) */
  Fy: number;
}
export interface Truss {
  nodes: TrussNode[];
  members: TrussMember[];
  supports: TrussSupport[];
  loads: TrussLoad[];
}

export interface Reaction {
  node: string;
  dir: 'x' | 'y';
  value: number;
}

export interface JointStep {
  node: string;
  knownTerms: string[];
  equations: string[];
  solved: { member: string; value: number }[];
  note?: string;
}

export interface TrussSolution {
  ok: true;
  forces: Record<string, number>;
  reactions: Reaction[];
  reactionSteps: string[];
  jointSteps: JointStep[];
  zeroForce: string[];
  maxResidual: number;
  determinacy: { m: number; r: number; j: number };
}

export interface TrussError {
  ok: false;
  errors: string[];
}

const nodeMap = (t: Truss) => new Map(t.nodes.map((n) => [n.id, n]));

/** Unit vector from node `from` along member towards its other end. */
export function memberUnit(t: Truss, m: TrussMember, from: string) {
  const nm = nodeMap(t);
  const p = nm.get(from)!;
  const q = nm.get(m.a === from ? m.b : m.a)!;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const L = Math.hypot(dx, dy);
  return { ux: dx / L, uy: dy / L, L };
}

export function memberLength(t: Truss, m: TrussMember) {
  return memberUnit(t, m, m.a).L;
}

function reactionUnknowns(t: Truss): { node: string; dir: 'x' | 'y' }[] {
  const r: { node: string; dir: 'x' | 'y' }[] = [];
  for (const s of t.supports) {
    if (s.type === 'pin') r.push({ node: s.node, dir: 'x' }, { node: s.node, dir: 'y' });
    else r.push({ node: s.node, dir: 'y' });
  }
  return r;
}

export function validateTruss(t: Truss): string[] {
  const e: string[] = [];
  const nm = nodeMap(t);
  if (t.nodes.length < 3) e.push('A truss needs at least three joints.');
  for (const m of t.members) {
    if (!nm.has(m.a) || !nm.has(m.b)) e.push(`Member ${m.id} references a missing joint.`);
    else if (memberLength(t, m) < 1e-9) e.push(`Member ${m.id} has zero length.`);
  }
  for (const l of t.loads) {
    if (!nm.has(l.node)) e.push(`A load is applied to a missing joint (${l.node}).`);
    if (!Number.isFinite(l.Fx) || !Number.isFinite(l.Fy)) e.push(`Load at joint ${l.node} must be numeric.`);
  }
  const m = t.members.length;
  const r = reactionUnknowns(t).length;
  const j = t.nodes.length;
  if (m + r < 2 * j) e.push(`Unstable (mechanism): m + r = ${m + r} is less than 2j = ${2 * j}.`);
  if (m + r > 2 * j)
    e.push(
      `Statically indeterminate: m + r = ${m + r} exceeds 2j = ${2 * j}. Member forces then depend on member stiffness, which is beyond the HSC method of joints.`,
    );
  return e;
}

export function solveTruss(t: Truss): TrussSolution | TrussError {
  const errors = validateTruss(t);
  if (errors.length) return { ok: false, errors };
  const nodes = t.nodes;
  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  const rU = reactionUnknowns(t);
  const nUnk = t.members.length + rU.length;
  const A: number[][] = Array.from({ length: 2 * nodes.length }, () => new Array(nUnk).fill(0));
  const b: number[] = new Array(2 * nodes.length).fill(0);

  t.members.forEach((m, k) => {
    for (const end of [m.a, m.b]) {
      const u = memberUnit(t, m, end);
      const i = idx.get(end)!;
      A[2 * i][k] += u.ux;
      A[2 * i + 1][k] += u.uy;
    }
  });
  rU.forEach((r, k) => {
    const i = idx.get(r.node)!;
    A[2 * i + (r.dir === 'x' ? 0 : 1)][t.members.length + k] += 1;
  });
  for (const l of t.loads) {
    const i = idx.get(l.node)!;
    b[2 * i] -= l.Fx;
    b[2 * i + 1] -= l.Fy;
  }
  const x = solveLinear(A, b);
  if (!x)
    return {
      ok: false,
      errors: [
        'The truss is geometrically unstable (the equilibrium equations are singular). Check that members are triangulated and the supports prevent rigid-body motion.',
      ],
    };

  const forces: Record<string, number> = {};
  t.members.forEach((m, k) => (forces[m.id] = clean(x[k], 1e-9)));
  const reactions: Reaction[] = rU.map((r, k) => ({ ...r, value: clean(x[t.members.length + k], 1e-9) }));

  // Residual check
  let maxResidual = 0;
  for (let r = 0; r < A.length; r++) {
    const s = A[r].reduce((acc, v, c) => acc + v * x[c], 0) - b[r];
    maxResidual = Math.max(maxResidual, Math.abs(s));
  }

  return {
    ok: true,
    forces,
    reactions,
    reactionSteps: buildReactionSteps(t, reactions),
    jointSteps: buildJointSteps(t, reactions),
    zeroForce: findZeroForceMembers(t),
    maxResidual,
    determinacy: { m: t.members.length, r: rU.length, j: nodes.length },
  };
}

function buildReactionSteps(t: Truss, reactions: Reaction[]): string[] {
  const pin = t.supports.find((s) => s.type === 'pin');
  const roller = t.supports.find((s) => s.type === 'roller');
  if (!pin || !roller || t.supports.length !== 2) return ['\\text{Reactions solved simultaneously with the joint equations.}'];
  const nm = nodeMap(t);
  const P = nm.get(pin.node)!;
  const R = nm.get(roller.node)!;
  const lines: string[] = [];
  const loadTerms: string[] = [];
  let mLoads = 0;
  for (const l of t.loads) {
    const n = nm.get(l.node)!;
    const dx = n.x - P.x;
    const dy = n.y - P.y;
    const m = dx * l.Fy - dy * l.Fx;
    mLoads += m;
    if (l.Fy !== 0) loadTerms.push(`${texb(l.Fy)}\\times${texb(dx)}`);
    if (l.Fx !== 0) loadTerms.push(`-${texb(l.Fx)}\\times${texb(dy)}`);
  }
  const Ry = reactions.find((r) => r.node === roller.node)!.value;
  const dxR = R.x - P.x;
  lines.push(`\\Sigma M_{${pin.node}} = 0 \\ (\\circlearrowleft +):\\quad R_{${roller.node}}\\times${texb(dxR)} + ${loadTerms.join(' + ') || '0'} = 0`);
  lines.push(`R_{${roller.node}} = \\dfrac{${tex(-mLoads)}}{${tex(dxR)}} = ${tex(Ry)}\\ \\text{kN}\\ (${Ry >= 0 ? '\\uparrow' : '\\downarrow'})`);
  const sumFy = t.loads.reduce((s, l) => s + l.Fy, 0);
  const sumFx = t.loads.reduce((s, l) => s + l.Fx, 0);
  const PyV = reactions.find((r) => r.node === pin.node && r.dir === 'y')!.value;
  const PxV = reactions.find((r) => r.node === pin.node && r.dir === 'x')!.value;
  lines.push(`\\Sigma F_y = 0:\\quad ${pin.node}_y + ${texb(Ry)} + ${texb(sumFy)} = 0 \\Rightarrow ${pin.node}_y = ${tex(PyV)}\\ \\text{kN}`);
  lines.push(`\\Sigma F_x = 0:\\quad ${pin.node}_x + ${texb(sumFx)} = 0 \\Rightarrow ${pin.node}_x = ${tex(PxV)}\\ \\text{kN}`);
  return lines;
}

/** Joint-by-joint solution sequence (method of joints), always starting where ≤ 2 unknown members meet. */
function buildJointSteps(t: Truss, reactions: Reaction[]): JointStep[] {
  const known = new Map<string, number>();
  const steps: JointStep[] = [];
  const remaining = new Set(t.nodes.map((n) => n.id));
  let guard = 0;
  while (remaining.size && guard++ < 200) {
    let progressed = false;
    for (const nid of Array.from(remaining)) {
      const ms = t.members.filter((m) => m.a === nid || m.b === nid);
      const unknown = ms.filter((m) => !known.has(m.id));
      if (unknown.length === 0) {
        remaining.delete(nid);
        continue;
      }
      if (unknown.length > 2) continue;
      // Sum of known forces at joint
      let kx = 0;
      let ky = 0;
      const knownTerms: string[] = [];
      for (const l of t.loads.filter((l) => l.node === nid)) {
        kx += l.Fx;
        ky += l.Fy;
        knownTerms.push(`\\text{load } (${tex(l.Fx)}, ${tex(l.Fy)})`);
      }
      for (const r of reactions.filter((r) => r.node === nid)) {
        if (r.dir === 'x') kx += r.value;
        else ky += r.value;
        knownTerms.push(`R_{${nid}${r.dir}} = ${tex(r.value)}`);
      }
      for (const m of ms.filter((m) => known.has(m.id))) {
        const u = memberUnit(t, m, nid);
        const T = known.get(m.id)!;
        kx += T * u.ux;
        ky += T * u.uy;
        knownTerms.push(`F_{${m.id}} = ${tex(T)}`);
      }
      const us = unknown.map((m) => ({ m, u: memberUnit(t, m, nid) }));
      const fmtTerm = (coef: number, name: string) => `${texb(clean(coef, 1e-12), 4)}F_{${name}}`;
      const eqX = `\\Sigma F_x:\\ ${us.map((q) => fmtTerm(q.u.ux, q.m.id)).join(' + ')} + ${texb(clean(kx, 1e-9))} = 0`;
      const eqY = `\\Sigma F_y:\\ ${us.map((q) => fmtTerm(q.u.uy, q.m.id)).join(' + ')} + ${texb(clean(ky, 1e-9))} = 0`;
      let solved: { member: string; value: number }[] = [];
      if (us.length === 2) {
        const [p, q] = us;
        const det = p.u.ux * q.u.uy - q.u.ux * p.u.uy;
        if (Math.abs(det) < 1e-9) continue; // collinear unknowns — try another joint first
        const Tp = (-kx * q.u.uy + ky * q.u.ux) / det;
        const Tq = (-ky * p.u.ux + kx * p.u.uy) / det;
        solved = [
          { member: p.m.id, value: clean(Tp, 1e-9) },
          { member: q.m.id, value: clean(Tq, 1e-9) },
        ];
      } else {
        const p = us[0];
        const useX = Math.abs(p.u.ux) >= Math.abs(p.u.uy);
        const T = useX ? -kx / p.u.ux : -ky / p.u.uy;
        solved = [{ member: p.m.id, value: clean(T, 1e-9) }];
      }
      solved.forEach((s) => known.set(s.member, s.value));
      steps.push({
        node: nid,
        knownTerms,
        equations: [eqX, eqY],
        solved,
        note:
          us.length === 2
            ? 'Two unknowns: solve the two equilibrium equations simultaneously.'
            : 'One unknown: one equation solves it, the other is a check.',
      });
      progressed = true;
      if (ms.every((m) => known.has(m.id))) remaining.delete(nid);
    }
    if (!progressed) break;
  }
  return steps;
}

/** Zero-force member rules for unloaded, unsupported joints. */
export function findZeroForceMembers(t: Truss): string[] {
  const zero = new Set<string>();
  for (const n of t.nodes) {
    const loaded = t.loads.some((l) => l.node === n.id && (l.Fx !== 0 || l.Fy !== 0));
    const supported = t.supports.some((s) => s.node === n.id);
    if (loaded || supported) continue;
    const ms = t.members.filter((m) => m.a === n.id || m.b === n.id);
    const us = ms.map((m) => ({ m, u: memberUnit(t, m, n.id) }));
    const collinear = (p: (typeof us)[0], q: (typeof us)[0]) => Math.abs(p.u.ux * q.u.uy - p.u.uy * q.u.ux) < 1e-6;
    if (us.length === 2 && !collinear(us[0], us[1])) {
      zero.add(us[0].m.id);
      zero.add(us[1].m.id);
    }
    if (us.length === 3) {
      for (let i = 0; i < 3; i++) {
        const others = us.filter((_, k) => k !== i);
        if (collinear(others[0], others[1]) && !collinear(us[i], others[0])) zero.add(us[i].m.id);
      }
    }
  }
  return Array.from(zero);
}

// ───────────────────── Method of sections ─────────────────────

export interface SectionStep {
  member: string;
  method: 'moment' | 'force';
  about?: { x: number; y: number; label: string };
  equation: string;
  value: number;
}

/**
 * Solve the three cut members of a section using the free body containing `sideNodes`.
 * For each member, take moments about the intersection of the other two cut members' lines
 * (or resolve perpendicular to them when they are parallel).
 */
export function methodOfSections(
  t: Truss,
  sol: TrussSolution,
  cut: [string, string, string],
  sideNodes: string[],
): SectionStep[] | { error: string } {
  const nm = nodeMap(t);
  const side = new Set(sideNodes);
  const cutMembers = cut.map((id) => t.members.find((m) => m.id === id));
  if (cutMembers.some((m) => !m)) return { error: 'Unknown member in section.' };
  const info = cutMembers.map((m) => {
    const inside = side.has(m!.a) ? m!.a : m!.b;
    if (!side.has(inside) || side.has(m!.a === inside ? m!.b : m!.a)) return null;
    const u = memberUnit(t, m!, inside);
    const p = nm.get(inside)!;
    return { m: m!, p, u };
  });
  if (info.some((i) => !i)) return { error: 'Each cut member must cross from the chosen side to the other side.' };
  const crossing = t.members.filter((m) => side.has(m.a) !== side.has(m.b)).map((m) => m.id);
  const extra = crossing.filter((id) => !cut.includes(id));
  if (extra.length)
    return { error: `The section also cuts ${extra.join(', ')}. A valid section must cut exactly three members.` };
  const I = info as NonNullable<(typeof info)[0]>[];

  // External forces on the free body
  const ext: { x: number; y: number; Fx: number; Fy: number }[] = [];
  for (const l of t.loads) if (side.has(l.node)) ext.push({ ...nm.get(l.node)!, Fx: l.Fx, Fy: l.Fy });
  for (const r of sol.reactions)
    if (side.has(r.node)) ext.push({ ...nm.get(r.node)!, Fx: r.dir === 'x' ? r.value : 0, Fy: r.dir === 'y' ? r.value : 0 });

  const steps: SectionStep[] = [];
  for (let i = 0; i < 3; i++) {
    const [j, k] = [0, 1, 2].filter((q) => q !== i);
    const A = I[j];
    const B = I[k];
    const det = A.u.ux * B.u.uy - A.u.uy * B.u.ux;
    const target = I[i];
    if (Math.abs(det) > 1e-9) {
      // Intersection of line through A.p along A.u and B.p along B.u
      const s = ((B.p.x - A.p.x) * B.u.uy - (B.p.y - A.p.y) * B.u.ux) / det;
      const P = { x: A.p.x + s * A.u.ux, y: A.p.y + s * A.u.uy };
      const Mext = ext.reduce((acc, f) => acc + (f.x - P.x) * f.Fy - (f.y - P.y) * f.Fx, 0);
      const arm = (target.p.x - P.x) * target.u.uy - (target.p.y - P.y) * target.u.ux;
      if (Math.abs(arm) < 1e-9) return { error: 'All three cut members meet at one point; choose a different section.' };
      const T = clean(-Mext / arm, 1e-9);
      const label =
        t.nodes.find((n) => Math.hypot(n.x - P.x, n.y - P.y) < 1e-6)?.id ?? `(${tex(P.x, 3)}, ${tex(P.y, 3)})`;
      steps.push({
        member: target.m.id,
        method: 'moment',
        about: { ...P, label },
        equation: `\\Sigma M_{${label}} = 0:\\ ${tex(clean(Mext, 1e-9))} + F_{${target.m.id}}\\times${texb(clean(arm, 1e-9))} = 0 \\Rightarrow F_{${target.m.id}} = ${tex(T)}\\ \\text{kN}`,
        value: T,
      });
    } else {
      // Other two are parallel: resolve perpendicular to them
      const n = { x: -A.u.uy, y: A.u.ux };
      const Fext = ext.reduce((acc, f) => acc + f.Fx * n.x + f.Fy * n.y, 0);
      const c = target.u.ux * n.x + target.u.uy * n.y;
      const T = clean(-Fext / c, 1e-9);
      steps.push({
        member: target.m.id,
        method: 'force',
        equation: `\\Sigma F_{\\perp} = 0:\\ ${tex(clean(Fext, 1e-9))} + ${texb(clean(c, 1e-9))}F_{${target.m.id}} = 0 \\Rightarrow F_{${target.m.id}} = ${tex(T)}\\ \\text{kN}`,
        value: T,
      });
    }
  }
  return steps;
}

// ───────────────────── Preset generators ─────────────────────

export type TrussType = 'pratt' | 'howe' | 'warren' | 'king-post';

/**
 * Generate a simply supported truss: pin at the bottom-left joint, roller at the bottom-right.
 * `panelLoads` are applied (downward) at the interior bottom-chord joints.
 */
export function makeTruss(type: TrussType, panels: number, span: number, height: number, load: number): Truss {
  const nodes: TrussNode[] = [];
  const members: TrussMember[] = [];
  let mc = 0;
  const addM = (a: string, b: string) => members.push({ id: memberName(a, b, mc++), a, b });
  const w = span / panels;
  if (type === 'king-post' || type === 'warren') {
    // Bottom chord L0..Ln, top chord U joints at panel mid-points (warren) or apex (king-post: 2 panels)
    const n = type === 'king-post' ? 2 : panels;
    const ww = span / n;
    for (let i = 0; i <= n; i++) nodes.push({ id: `L${i}`, x: i * ww, y: 0 });
    if (type === 'king-post') {
      nodes.push({ id: 'U1', x: span / 2, y: height });
      addM('L0', 'L1');
      addM('L1', 'L2');
      addM('L0', 'U1');
      addM('U1', 'L2');
      addM('L1', 'U1');
    } else {
      for (let i = 0; i < n; i++) nodes.push({ id: `U${i + 1}`, x: (i + 0.5) * ww, y: height });
      for (let i = 0; i < n; i++) addM(`L${i}`, `L${i + 1}`);
      for (let i = 1; i < n; i++) addM(`U${i}`, `U${i + 1}`);
      for (let i = 0; i < n; i++) {
        addM(`L${i}`, `U${i + 1}`);
        addM(`U${i + 1}`, `L${i + 1}`);
      }
    }
    const loads: TrussLoad[] = [];
    for (let i = 1; i < n; i++) loads.push({ node: `L${i}`, Fx: 0, Fy: -load });
    return { nodes, members, supports: [{ node: 'L0', type: 'pin' }, { node: `L${n}`, type: 'roller' }], loads };
  }
  // Pratt / Howe: top chord U1..U(n-1) above interior bottom joints, sloping end posts.
  for (let i = 0; i <= panels; i++) nodes.push({ id: `L${i}`, x: i * w, y: 0 });
  for (let i = 1; i < panels; i++) nodes.push({ id: `U${i}`, x: i * w, y: height });
  for (let i = 0; i < panels; i++) addM(`L${i}`, `L${i + 1}`);
  for (let i = 1; i < panels - 1; i++) addM(`U${i}`, `U${i + 1}`);
  addM('L0', 'U1');
  addM(`U${panels - 1}`, `L${panels}`);
  for (let i = 1; i < panels; i++) addM(`L${i}`, `U${i}`);
  const half = panels / 2;
  for (let i = 1; i < panels - 1; i++) {
    // diagonal in panel between joints i and i+1
    const leftHalf = i + 0.5 < half;
    if (type === 'pratt') {
      // Pratt diagonals slope down towards the centre (in tension under gravity loads)
      if (leftHalf) addM(`U${i}`, `L${i + 1}`);
      else addM(`L${i}`, `U${i + 1}`);
    } else {
      // Howe diagonals slope up towards the centre (in compression under gravity loads)
      if (leftHalf) addM(`L${i}`, `U${i + 1}`);
      else addM(`U${i}`, `L${i + 1}`);
    }
  }
  const loads: TrussLoad[] = [];
  for (let i = 1; i < panels; i++) loads.push({ node: `L${i}`, Fx: 0, Fy: -load });
  return { nodes, members, supports: [{ node: 'L0', type: 'pin' }, { node: `L${panels}`, type: 'roller' }], loads };
}

function memberName(a: string, b: string, _i: number) {
  return `${a}${b}`;
}

/** A classic exam-style roof truss: 3 m span triangle with a 10 kN apex load. */
export function simpleTriangleTruss(span = 6, height = 3, load = 10, apexX = span / 2): Truss {
  return {
    nodes: [
      { id: 'A', x: 0, y: 0 },
      { id: 'B', x: span, y: 0 },
      { id: 'C', x: apexX, y: height },
    ],
    members: [
      { id: 'AB', a: 'A', b: 'B' },
      { id: 'AC', a: 'A', b: 'C' },
      { id: 'BC', a: 'B', b: 'C' },
    ],
    supports: [
      { node: 'A', type: 'pin' },
      { node: 'B', type: 'roller' },
    ],
    loads: [{ node: 'C', Fx: 0, Fy: -load }],
  };
}
