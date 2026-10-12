/**
 * Statics: force resolution, resultants, moments and simply supported beams with point loads.
 *
 * Sign conventions used throughout the site:
 *  - x to the right is positive, y upward is positive.
 *  - Angles are measured anticlockwise from the positive x-axis.
 *  - Moments: anticlockwise positive (ΣM = 0 for equilibrium).
 *  - Beam point loads P are entered as DOWNWARD positive (the usual way loads are quoted).
 *  - Shear force: positive when the resultant force to the LEFT of the section acts upward.
 *  - Bending moment: sagging positive (beam bends concave up, bottom fibres in tension).
 */
import { tex, texb, clean } from './format';

export interface Vec2 {
  x: number;
  y: number;
}

export function resolveForce(F: number, angleDeg: number): { Fx: number; Fy: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { Fx: clean(F * Math.cos(a), 1e-12), Fy: clean(F * Math.sin(a), 1e-12) };
}

export interface PolarForce {
  F: number;
  angleDeg: number;
}

export function resultant(forces: PolarForce[]): { Rx: number; Ry: number; R: number; angleDeg: number } {
  let Rx = 0;
  let Ry = 0;
  for (const f of forces) {
    const r = resolveForce(f.F, f.angleDeg);
    Rx += r.Fx;
    Ry += r.Fy;
  }
  Rx = clean(Rx, 1e-12);
  Ry = clean(Ry, 1e-12);
  const R = Math.hypot(Rx, Ry);
  let angleDeg = (Math.atan2(Ry, Rx) * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;
  return { Rx, Ry, R, angleDeg: R === 0 ? 0 : angleDeg };
}

/** The single force that holds a set of forces in equilibrium (equal and opposite to the resultant). */
export function equilibrant(forces: PolarForce[]) {
  const r = resultant(forces);
  return { E: r.R, angleDeg: r.R === 0 ? 0 : (r.angleDeg + 180) % 360 };
}

/** Moment of a force about a point: M = F × perpendicular distance (2D cross product), anticlockwise +. */
export function momentAbout(point: Vec2, at: Vec2, F: Vec2): number {
  return (at.x - point.x) * F.y - (at.y - point.y) * F.x;
}

// ───────────────────────────── Beams ─────────────────────────────

export interface PointLoad {
  id: string;
  /** Magnitude in kN, DOWNWARD positive. */
  P: number;
  /** Distance from the left end of the beam, m. */
  x: number;
}

export interface BeamSpec {
  /** Overall length, m. */
  L: number;
  /** Position of support A (pin), m from left end. */
  a: number;
  /** Position of support B (roller), m from left end. */
  b: number;
}

export interface DiagramPoint {
  x: number;
  v: number;
}

export interface BeamResult {
  ok: true;
  RA: number;
  RB: number;
  /** LaTeX lines describing the solution. */
  steps: { title: string; latex: string[]; note?: string }[];
  /** SFD vertices (duplicate x values represent vertical jumps). */
  sfd: DiagramPoint[];
  /** BMD vertices (piecewise linear for point loads). */
  bmd: DiagramPoint[];
  maxShear: number;
  maxMoment: { value: number; x: number };
  minMoment: { value: number; x: number };
  /** ΣFy and ΣM residuals, ideally 0. */
  check: { sumFy: number; sumM_A: number; endMoment: number };
  keyPoints: { x: number; label: string; Vleft: number; Vright: number; M: number }[];
}

export interface CalcError {
  ok: false;
  errors: string[];
}

export function validateBeam(beam: BeamSpec, loads: PointLoad[]): string[] {
  const e: string[] = [];
  const { L, a, b } = beam;
  if (!(Number.isFinite(L) && L > 0)) e.push('Beam length must be a positive number of metres.');
  if (L > 1000) e.push('Beam length above 1000 m is outside the scope of this calculator.');
  if (!Number.isFinite(a) || !Number.isFinite(b)) e.push('Support positions must be numbers.');
  else {
    if (a < 0 || b > L) e.push('Supports must lie on the beam (0 ≤ position ≤ L).');
    if (!(b > a)) e.push('Support B must be to the right of support A (otherwise the beam is unstable).');
  }
  if (loads.length === 0) e.push('Add at least one point load.');
  if (loads.length > 12) e.push('A maximum of 12 point loads is supported.');
  loads.forEach((l, i) => {
    if (!Number.isFinite(l.P)) e.push(`Load ${i + 1}: magnitude must be a number.`);
    if (!Number.isFinite(l.x) || l.x < 0 || l.x > L) e.push(`Load ${i + 1}: position must be between 0 and ${L} m.`);
  });
  return e;
}

/**
 * Solve a simply supported (statically determinate) beam with vertical point loads.
 * Supports: pin at A (vertical + horizontal restraint), roller at B (vertical). With vertical
 * loads only, the horizontal reaction at A is zero.
 */
export function solveBeam(beam: BeamSpec, loads: PointLoad[]): BeamResult | CalcError {
  const errors = validateBeam(beam, loads);
  if (errors.length) return { ok: false, errors };
  const { L, a, b } = beam;
  const span = b - a;

  // ΣM_A = 0 (anticlockwise +): RB·(b−a) − Σ P_i (x_i − a) = 0
  const momentLoadsAboutA = loads.reduce((s, l) => s + l.P * (l.x - a), 0);
  const RB = momentLoadsAboutA / span;
  const totalP = loads.reduce((s, l) => s + l.P, 0);
  const RA = totalP - RB;

  const steps: BeamResult['steps'] = [];
  steps.push({
    title: 'Free-body diagram and unknowns',
    latex: [
      `\\text{Unknowns: } R_A \\ (\\text{pin at } x=${tex(a)}\\,\\text{m}),\\; R_B \\ (\\text{roller at } x=${tex(b)}\\,\\text{m})`,
      `\\text{Horizontal: } \\Sigma F_x = 0 \\Rightarrow H_A = 0 \\ (\\text{all loads are vertical})`,
    ],
  });
  const terms = loads.map((l) => `${texb(l.P)}\\times${texb(l.x - a)}`).join(' + ');
  steps.push({
    title: 'Take moments about A (eliminates R_A)',
    latex: [
      `\\Sigma M_A = 0 \\ (\\circlearrowleft +)`,
      `R_B \\times ${tex(span)} - (${terms}) = 0`,
      `R_B = \\dfrac{${tex(momentLoadsAboutA)}}{${tex(span)}} = ${tex(RB)}\\ \\text{kN}`,
    ],
    note: 'Lever arms are measured from A. A load to the left of A has a negative lever arm.',
  });
  steps.push({
    title: 'Vertical equilibrium',
    latex: [
      `\\Sigma F_y = 0:\\quad R_A + R_B - ${texb(totalP)} = 0`,
      `R_A = ${tex(totalP)} - ${texb(RB)} = ${tex(RA)}\\ \\text{kN}`,
    ],
  });

  // Check: moments about B (anticlockwise +). R_A acts upward at distance (b − a) to the left of B
  // (clockwise, so negative); a downward load at x_i < b is anticlockwise about B.
  const mB = -RA * span + loads.reduce((s, l) => s + l.P * (b - l.x), 0);
  steps.push({
    title: 'Check: moments about B',
    latex: [
      `\\Sigma M_B = -R_A\\times${tex(span)} + \\Sigma P_i (x_B - x_i) = ${tex(clean(mB, 1e-9))} \\approx 0 \\ \\checkmark`,
    ],
  });

  // Point forces acting on the beam (upward positive)
  const forces: { x: number; F: number; label: string }[] = [
    { x: a, F: RA, label: 'A' },
    { x: b, F: RB, label: 'B' },
    ...loads.map((l, i) => ({ x: l.x, F: -l.P, label: `P${i + 1}` })),
  ];

  const xs = Array.from(new Set([0, L, ...forces.map((f) => f.x)].map((v) => Math.round(v * 1e9) / 1e9))).sort(
    (p, q) => p - q,
  );
  const near = (p: number, q: number) => Math.abs(p - q) < 1e-9;
  const shearLeftOf = (x: number) => forces.filter((f) => f.x < x - 1e-9).reduce((s, f) => s + f.F, 0);
  const shearRightOf = (x: number) => forces.filter((f) => f.x <= x + 1e-9).reduce((s, f) => s + f.F, 0);
  const momentAt = (x: number) => forces.filter((f) => f.x < x - 1e-9).reduce((s, f) => s + f.F * (x - f.x), 0);

  const sfd: DiagramPoint[] = [];
  const bmd: DiagramPoint[] = [];
  const keyPoints: BeamResult['keyPoints'] = [];
  for (const x of xs) {
    const Vl = clean(near(x, 0) ? 0 : shearLeftOf(x), 1e-9);
    const Vr = clean(near(x, L) ? 0 : shearRightOf(x), 1e-9);
    sfd.push({ x, v: Vl });
    if (!near(Vl, Vr)) sfd.push({ x, v: Vr });
    const M = clean(momentAt(x), 1e-9);
    bmd.push({ x, v: M });
    const labels = forces.filter((f) => near(f.x, x)).map((f) => f.label);
    if (near(x, 0) && !labels.length) labels.push('Left end');
    if (near(x, L) && !labels.length) labels.push('Right end');
    keyPoints.push({ x, label: labels.join(', '), Vleft: Vl, Vright: Vr, M });
  }
  // Remove duplicate zero at ends for tidier polyline
  const maxShear = Math.max(...sfd.map((p) => Math.abs(p.v)));
  let maxM = { value: -Infinity, x: 0 };
  let minM = { value: Infinity, x: 0 };
  for (const p of bmd) {
    if (p.v > maxM.value) maxM = { value: p.v, x: p.x };
    if (p.v < minM.value) minM = { value: p.v, x: p.x };
  }
  const endMoment = clean(forces.reduce((s, f) => s + f.F * (L - f.x), 0), 1e-9);
  const sumFy = clean(forces.reduce((s, f) => s + f.F, 0), 1e-9);
  const sumM_A = clean(forces.reduce((s, f) => s + f.F * (f.x - a), 0), 1e-9);

  steps.push({
    title: 'Shear force and bending moment',
    latex: [
      `V(x) = \\Sigma(\\text{upward forces left of } x) - \\Sigma(\\text{downward loads left of } x)`,
      `M(x) = \\Sigma F_i\\,(x - x_i) \\ \\text{for forces left of } x \\ (\\text{sagging } +)`,
      `M_{\\max} = ${tex(maxM.value)}\\ \\text{kN·m at } x = ${tex(maxM.x)}\\ \\text{m}`,
    ],
    note: 'Maximum bending moment occurs where the shear force diagram crosses zero (changes sign).',
  });

  return {
    ok: true,
    RA: clean(RA, 1e-12),
    RB: clean(RB, 1e-12),
    steps,
    sfd,
    bmd,
    maxShear,
    maxMoment: maxM,
    minMoment: minM,
    check: { sumFy, sumM_A, endMoment },
    keyPoints,
  };
}

/** Bending moment at mid-span for a simply supported beam with a central point load (reference value). */
export const midspanMomentCentralLoad = (P: number, L: number) => (P * L) / 4;
/** Reference (conceptual) value for a UDL: M_max = wL²/8. Shown for comparison only — not mandatory HSC analysis. */
export const midspanMomentUDL = (w: number, L: number) => (w * L * L) / 8;
