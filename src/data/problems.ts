/**
 * Step-by-step problem templates. Every problem is generated deterministically from a seed and
 * solved with the same numerical utilities used elsewhere on the site — no AI service required.
 */
import type { ModuleId } from './types';
import { solveBeam } from '@/lib/calc/statics';
import { solveTruss, simpleTriangleTruss } from '@/lib/calc/truss';
import { g, incline } from '@/lib/calc/transport';
import { fixed } from '@/lib/calc/format';

export interface NumberStep {
  kind: 'number';
  prompt: string;
  answer: number;
  unit: string;
  /** Relative tolerance; default 1% (absolute tolerance used when the answer is 0). */
  tol?: number;
  hint: string;
  solution: string[];
  traps?: { value: number; msg: string }[];
}
export interface ChoiceStep {
  kind: 'choice';
  prompt: string;
  options: { text: string; feedback: string }[];
  answer: number;
  solution: string[];
}
export type Step = NumberStep | ChoiceStep;

export type ProblemDiagram =
  | { type: 'beam'; L: number; a: number; P: number; RA?: number; RB?: number }
  | { type: 'truss'; span: number; h: number; P: number }
  | { type: 'incline'; m: number; theta: number; mu: number }
  | { type: 'pulley'; n: number; load: number; effort: number }
  | { type: 'circuit'; V: number; R: number[]; mode: 'series' | 'parallel' }
  | { type: 'hydraulic'; F1: number; d1: number; d2: number }
  | { type: 'rod'; d: number; F: number; L?: number }
  | { type: 'lever'; F: number; d: number; alpha: number }
  | { type: 'section'; depth: number; M: number; I: number };

export interface Problem {
  statement: string;
  given: { label: string; value: string }[];
  diagram?: ProblemDiagram;
  steps: Step[];
  final: string;
}

export interface Template {
  id: string;
  title: string;
  module: ModuleId;
  topic: string;
  generate: (seed: number) => Problem;
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];
const r4 = (n: number) => Number(n.toPrecision(4));

const RAW_TEMPLATES: Template[] = [
  {
    id: 'beam',
    title: 'Simply supported beam reactions',
    module: 'civil',
    topic: 'Beams',
    generate: (seed) => {
      const r = rng(seed);
      const L = seed === 0 ? 6 : pick(r, [4, 5, 6, 8, 10, 12]);
      const a = seed === 0 ? 2 : pick(r, Array.from({ length: L - 1 }, (_, i) => i + 1).filter((x) => x * 2 !== L));
      const P = seed === 0 ? 18 : pick(r, [6, 9, 12, 15, 18, 20, 24, 30, 36]);
      const b = L - a;
      const res = solveBeam({ L, a: 0, b: L }, [{ id: 'P', P, x: a }]);
      if (!res.ok) throw new Error('beam');
      const RB = res.RB;
      const RA = res.RA;
      return {
        statement: `A simply supported beam of length ${L} m (pin at A, roller at B) carries a vertical point load of ${P} kN located ${a} m from A. Find the support reactions.`,
        given: [
          { label: 'Span L', value: `${L} m` },
          { label: 'Load P', value: `${P} kN (downward)` },
          { label: 'Distance from A, a', value: `${a} m` },
        ],
        diagram: { type: 'beam', L, a, P, RA, RB },
        steps: [
          {
            kind: 'number',
            prompt: 'Step 1 — Identify known values. What is the distance from the load to support B?',
            answer: b,
            unit: 'm',
            hint: 'b = L − a',
            solution: [`b = ${L} - ${a} = ${b}\\ \\text{m}`],
            traps: [{ value: a, msg: 'That is the distance from A. Measure from the load to B.' }],
          },
          {
            kind: 'choice',
            prompt: 'Step 2 — Draw the free-body diagram. Which description is correct?',
            options: [
              { text: `R_A ↑ at A, R_B ↑ at B, ${P} kN ↓ at ${a} m (no horizontal reaction needed for vertical loads)`, feedback: 'Correct — supports push UP on the beam; with only vertical loads the pin’s horizontal reaction is zero.' },
              { text: `R_A ↓ at A, R_B ↓ at B, ${P} kN ↓`, feedback: 'Supports must push upward to hold up a downward load, otherwise ΣF_y ≠ 0.' },
              { text: `Only one reaction of ${P} kN at the middle`, feedback: 'There are two supports, so two reactions — they do not act at the middle.' },
              { text: `R_A ↑, R_B ↑ and a moment reaction at each support`, feedback: 'Pins and rollers cannot resist moments — that would be a fixed (built-in) support.' },
            ],
            answer: 0,
            solution: ['\\text{Pin A: } R_A \\uparrow \\ (H_A = 0),\\ \\text{Roller B: } R_B \\uparrow,\\ P \\downarrow'],
          },
          {
            kind: 'number',
            prompt: 'Step 3 — How many unknown reaction forces must be found?',
            answer: 2,
            unit: '',
            tol: 0,
            hint: 'Count the vertical reactions (the horizontal one is zero).',
            solution: ['R_A \\text{ and } R_B \\Rightarrow 2 \\text{ unknowns; two useful equations } (\\Sigma M = 0, \\Sigma F_y = 0)'],
            traps: [{ value: 3, msg: 'H_A exists in principle, but ΣF_x = 0 shows it is zero for vertical loads, so only 2 need solving.' }],
          },
          {
            kind: 'choice',
            prompt: 'Step 4 — Apply moment equilibrium. About which point should you take moments to find R_B directly?',
            options: [
              { text: 'Support A', feedback: 'Correct — R_A passes through A, so it has no moment about A and drops out of the equation.' },
              { text: 'The load point', feedback: 'Both reactions would then appear in the equation (two unknowns).' },
              { text: 'Mid-span', feedback: 'Both reactions would appear — not efficient.' },
              { text: 'Support B', feedback: 'Moments about B eliminate R_B, giving R_A first — valid, but the question asks for R_B directly.' },
            ],
            answer: 0,
            solution: ['\\Sigma M_A = 0 \\ (\\circlearrowleft +):\\ R_B \\times L - P \\times a = 0'],
          },
          {
            kind: 'number',
            prompt: `Step 5 — Calculate R_B.`,
            answer: RB,
            unit: 'kN',
            hint: 'R_B × L = P × a',
            solution: [`R_B \\times ${L} = ${P} \\times ${a}`, `R_B = \\dfrac{${P * a}}{${L}} = ${r4(RB)}\\ \\text{kN}`],
            traps: [
              { value: RA, msg: 'This is R_A. When you take moments about A, the lever arm for the load is a (distance from A), giving R_B.' },
              { value: (P * L) / a, msg: 'The fraction is upside down: R_B = P·a / L.' },
              { value: P / 2, msg: 'Equal sharing only happens when the load is at mid-span.' },
            ],
          },
          {
            kind: 'number',
            prompt: 'Step 6 — Apply vertical force equilibrium (ΣF_y = 0) to find R_A.',
            answer: RA,
            unit: 'kN',
            hint: 'R_A + R_B = P',
            solution: [`R_A = ${P} - ${r4(RB)} = ${r4(RA)}\\ \\text{kN}`],
            traps: [{ value: P + RB, msg: 'Reactions act upward and the load downward: R_A + R_B − P = 0.' }],
          },
          {
            kind: 'number',
            prompt: 'Step 7 — Check: calculate ΣM_B = R_A × L − P × b. What should it equal?',
            answer: 0,
            unit: 'kN·m',
            tol: 0,
            hint: 'Equilibrium means the sum of moments about ANY point is zero.',
            solution: [`\\Sigma M_B = ${r4(RA)}(${L}) - ${P}(${b}) = 0 \\ \\checkmark`],
          },
        ],
        final: `R_A = ${r4(RA)} kN ↑ and R_B = ${r4(RB)} kN ↑. The support closer to the load carries the larger share.`,
      };
    },
  },
  {
    id: 'truss',
    title: 'Triangular truss — method of joints',
    module: 'civil',
    topic: 'Trusses',
    generate: (seed) => {
      const r = rng(seed + 11);
      const [span, h] = seed === 0 ? [8, 3] : pick(r, [[8, 3], [6, 4], [12, 5], [6, 3], [16, 6], [10, 4]] as [number, number][]);
      const P = seed === 0 ? 24 : pick(r, [10, 12, 18, 20, 24, 30, 40]);
      const t = simpleTriangleTruss(span, h, P);
      const s = solveTruss(t);
      if (!s.ok) throw new Error('truss');
      const len = Math.hypot(span / 2, h);
      const sin = h / len;
      const cos = span / 2 / len;
      const AC = s.forces.AC;
      const AB = s.forces.AB;
      return {
        statement: `A symmetric pin-jointed truss ABC has span AB = ${span} m and apex C ${h} m above AB, centred. A ${P} kN load acts vertically down at C. A is a pin, B a roller. Find the member forces (tension positive).`,
        given: [
          { label: 'Span', value: `${span} m` },
          { label: 'Height', value: `${h} m` },
          { label: 'Apex load', value: `${P} kN` },
        ],
        diagram: { type: 'truss', span, h, P },
        steps: [
          {
            kind: 'number',
            prompt: 'Step 1 — Find the vertical reaction at A.',
            answer: P / 2,
            unit: 'kN',
            hint: 'The truss and load are symmetric.',
            solution: [`R_A = R_B = ${P}/2 = ${P / 2}\\ \\text{kN}`],
          },
          {
            kind: 'number',
            prompt: 'Step 2 — Find the length of member AC.',
            answer: len,
            unit: 'm',
            hint: 'Pythagoras with half the span and the height.',
            solution: [`L_{AC} = \\sqrt{${span / 2}^2 + ${h}^2} = ${r4(len)}\\ \\text{m}`],
          },
          {
            kind: 'number',
            prompt: 'Step 3 — At joint A, apply ΣF_y = 0 to find F_AC (negative = compression).',
            answer: AC,
            unit: 'kN',
            hint: `F_AC × sin θ + R_A = 0, with sin θ = ${h}/${r4(len)}`,
            solution: [`\\sin\\theta = ${r4(sin)}`, `${P / 2} + F_{AC}(${r4(sin)}) = 0 \\Rightarrow F_{AC} = ${r4(AC)}\\ \\text{kN (C)}`],
            traps: [
              { value: -AC, msg: 'Magnitude right but sign wrong: the rafter pushes on joint A, so it is in compression (negative).' },
              { value: (-P / 2) / cos, msg: 'Use sin θ for the vertical component (θ measured from horizontal).' },
            ],
          },
          {
            kind: 'number',
            prompt: 'Step 4 — At joint A, apply ΣF_x = 0 to find F_AB.',
            answer: AB,
            unit: 'kN',
            hint: 'F_AB + F_AC cos θ = 0',
            solution: [`F_{AB} = -(${r4(AC)})(${r4(cos)}) = ${r4(AB)}\\ \\text{kN (T)}`],
            traps: [{ value: -AB, msg: 'The tie AB is pulled — tension is positive.' }],
          },
          {
            kind: 'choice',
            prompt: 'Step 5 — Check at joint C: is vertical equilibrium satisfied?',
            options: [
              { text: `Yes: 2 × |F_AC| sin θ = ${P} kN`, feedback: 'Correct — the vertical components of both rafter forces support the load.' },
              { text: 'No — member AB must also carry vertical load', feedback: 'AB is horizontal; it has no vertical component.' },
            ],
            answer: 0,
            solution: [`2 \\times ${r4(-AC)} \\times ${r4(sin)} = ${P}\\ \\text{kN} \\checkmark`],
          },
        ],
        final: `F_AC = F_BC = ${r4(AC)} kN (compression); F_AB = ${r4(AB)} kN (tension).`,
      };
    },
  },
  {
    id: 'moment',
    title: 'Moment of an inclined force',
    module: 'civil',
    topic: 'Moments',
    generate: (seed) => {
      const r = rng(seed + 21);
      const F = pick(r, [120, 150, 200, 250, 300, 400]);
      const d = pick(r, [0.25, 0.3, 0.4, 0.5, 0.6]);
      const alpha = pick(r, [30, 45, 60, 70]);
      const perp = d * Math.sin((alpha * Math.PI) / 180);
      return {
        statement: `A force of ${F} N is applied to the end of a ${d} m spanner at ${alpha}° to the handle. Find the moment about the bolt centre.`,
        given: [
          { label: 'Force', value: `${F} N` },
          { label: 'Handle length', value: `${d} m` },
          { label: 'Angle to handle', value: `${alpha}°` },
        ],
        diagram: { type: 'lever', F, d, alpha },
        steps: [
          {
            kind: 'number',
            prompt: 'Step 1 — Find the perpendicular distance from the bolt to the line of action of the force.',
            answer: perp,
            unit: 'm',
            hint: 'd⊥ = d sin α',
            solution: [`d_\\perp = ${d}\\sin ${alpha}^\\circ = ${r4(perp)}\\ \\text{m}`],
            traps: [{ value: d * Math.cos((alpha * Math.PI) / 180), msg: 'Use sin α — the component perpendicular to the handle.' }, { value: d, msg: 'The force is not perpendicular; find the perpendicular distance.' }],
          },
          {
            kind: 'number',
            prompt: 'Step 2 — Calculate the moment.',
            answer: F * perp,
            unit: 'N·m',
            hint: 'M = F × d⊥',
            solution: [`M = ${F} \\times ${r4(perp)} = ${r4(F * perp)}\\ \\text{N·m}`],
            traps: [{ value: F * d, msg: 'That assumes the force is perpendicular to the handle.' }],
          },
        ],
        final: `M = ${r4(F * perp)} N·m.`,
      };
    },
  },
  {
    id: 'stress',
    title: 'Axial stress in a round bar',
    module: 'civil',
    topic: 'Stress',
    generate: (seed) => {
      const r = rng(seed + 31);
      const d = pick(r, [10, 12, 16, 20, 24, 30]);
      const F = pick(r, [8, 10, 15, 20, 25, 40, 50]);
      const A = (Math.PI * d * d) / 4;
      const s = (F * 1000) / A;
      return {
        statement: `A ${d} mm diameter steel rod carries an axial tensile load of ${F} kN. Calculate the tensile stress.`,
        given: [
          { label: 'Diameter', value: `${d} mm` },
          { label: 'Load', value: `${F} kN` },
        ],
        diagram: { type: 'rod', d, F },
        steps: [
          {
            kind: 'number',
            prompt: 'Step 1 — Calculate the cross-sectional area in mm².',
            answer: A,
            unit: 'mm²',
            hint: 'A = πd²/4',
            solution: [`A = \\dfrac{\\pi(${d})^2}{4} = ${r4(A)}\\ \\text{mm}^2`],
            traps: [{ value: Math.PI * d * d, msg: 'Divide by 4: A = πd²/4.' }, { value: Math.PI * d, msg: 'πd is the circumference, not the area.' }],
          },
          {
            kind: 'number',
            prompt: 'Step 2 — Calculate the stress in MPa (N/mm²).',
            answer: s,
            unit: 'MPa',
            hint: 'Convert kN to N first: σ = F/A',
            solution: [`\\sigma = \\dfrac{${F * 1000}}{${r4(A)}} = ${r4(s)}\\ \\text{MPa}`],
            traps: [{ value: F / A, msg: 'Convert kN to N (× 1000) so that N/mm² = MPa.' }],
          },
        ],
        final: `σ ≈ ${r4(s)} MPa (tensile).`,
      };
    },
  },
  {
    id: 'strain',
    title: 'Strain, Young’s modulus and extension',
    module: 'civil',
    topic: 'Strain',
    generate: (seed) => {
      const r = rng(seed + 41);
      const L = pick(r, [1, 1.5, 2, 2.5, 3]);
      const s = pick(r, [80, 100, 120, 150, 160]);
      const E = pick(r, [70, 200]);
      const eps = s / (E * 1000);
      const dL = eps * L * 1000;
      return {
        statement: `A ${L} m long member made of a material with E = ${E} GPa carries a stress of ${s} MPa (elastic). Find the strain and the extension.`,
        given: [
          { label: 'Length', value: `${L} m` },
          { label: 'Stress', value: `${s} MPa` },
          { label: 'Young’s modulus', value: `${E} GPa` },
        ],
        steps: [
          {
            kind: 'number',
            prompt: 'Step 1 — Express E in MPa.',
            answer: E * 1000,
            unit: 'MPa',
            hint: '1 GPa = 1000 MPa',
            solution: [`E = ${E} \\times 1000 = ${E * 1000}\\ \\text{MPa}`],
          },
          {
            kind: 'number',
            prompt: 'Step 2 — Calculate the strain (dimensionless).',
            answer: eps,
            unit: '',
            hint: 'ε = σ / E (same units)',
            solution: [`\\varepsilon = \\dfrac{${s}}{${E * 1000}} = ${r4(eps)}`],
            traps: [{ value: s / E, msg: 'Convert E to MPa so σ and E are in the same units.' }],
          },
          {
            kind: 'number',
            prompt: 'Step 3 — Calculate the extension in mm.',
            answer: dL,
            unit: 'mm',
            hint: 'ΔL = ε × L (L in mm)',
            solution: [`\\Delta L = ${r4(eps)} \\times ${L * 1000} = ${r4(dL)}\\ \\text{mm}`],
            traps: [{ value: eps * L, msg: 'That is in metres — multiply by the length in mm.' }],
          },
        ],
        final: `ε = ${r4(eps)}, ΔL = ${r4(dL)} mm.`,
      };
    },
  },
  {
    id: 'fos',
    title: 'Factor of safety',
    module: 'civil',
    topic: 'Factor of safety',
    generate: (seed) => {
      const r = rng(seed + 51);
      const yieldS = pick(r, [250, 300, 350]);
      const F = pick(r, [20, 30, 40, 50]);
      const A = pick(r, [200, 250, 300, 400, 500]);
      const w = (F * 1000) / A;
      return {
        statement: `A tie of cross-sectional area ${A} mm² carries ${F} kN. The steel has a yield stress of ${yieldS} MPa. Find the factor of safety against yielding.`,
        given: [
          { label: 'Area', value: `${A} mm²` },
          { label: 'Load', value: `${F} kN` },
          { label: 'Yield stress', value: `${yieldS} MPa` },
        ],
        steps: [
          {
            kind: 'number',
            prompt: 'Step 1 — Working stress in MPa.',
            answer: w,
            unit: 'MPa',
            hint: 'σ = F/A with F in N',
            solution: [`\\sigma_w = ${F * 1000}/${A} = ${r4(w)}\\ \\text{MPa}`],
          },
          {
            kind: 'number',
            prompt: 'Step 2 — Factor of safety.',
            answer: yieldS / w,
            unit: '',
            hint: 'FoS = σ_yield / σ_working',
            solution: [`\\text{FoS} = ${yieldS}/${r4(w)} = ${r4(yieldS / w)}`],
            traps: [{ value: w / yieldS, msg: 'Inverted: FoS = limit ÷ working (should be > 1 for a safe design).' }],
          },
          {
            kind: 'choice',
            prompt: 'Step 3 — Interpret the result.',
            options: [
              { text: yieldS / w > 1 ? 'The tie will not yield under this load.' : 'The tie will yield under this load.', feedback: 'Correct.' },
              { text: yieldS / w > 1 ? 'The tie will yield.' : 'The tie is safe.', feedback: 'Compare FoS with 1: FoS > 1 means working stress is below yield.' },
            ],
            answer: 0,
            solution: [`\\text{FoS} ${yieldS / w > 1 ? '>' : '<'} 1`],
          },
        ],
        final: `FoS = ${r4(yieldS / w)} based on yield.`,
      };
    },
  },
  {
    id: 'bending',
    title: 'Bending stress (σ = My/I, I given)',
    module: 'civil',
    topic: 'Bending stress',
    generate: (seed) => {
      const r = rng(seed + 61);
      const depth = pick(r, [200, 250, 300, 360, 400]);
      const M = pick(r, [20, 30, 40, 45, 60, 80]);
      const I = pick(r, [40, 60, 80, 100, 120, 150]);
      const y = depth / 2;
      const s = (M * 1e6 * y) / (I * 1e6);
      return {
        statement: `A symmetric beam section ${depth} mm deep has I = ${I} × 10⁶ mm⁴ and carries a bending moment of ${M} kN·m. Find the maximum bending stress.`,
        given: [
          { label: 'Depth', value: `${depth} mm` },
          { label: 'I', value: `${I} × 10⁶ mm⁴` },
          { label: 'M', value: `${M} kN·m` },
        ],
        diagram: { type: 'section', depth, M, I },
        steps: [
          {
            kind: 'number',
            prompt: 'Step 1 — Distance from the neutral axis to the outer fibre, y_max (mm).',
            answer: y,
            unit: 'mm',
            hint: 'Symmetric section: neutral axis at mid-depth.',
            solution: [`y_{\\max} = ${depth}/2 = ${y}\\ \\text{mm}`],
            traps: [{ value: depth, msg: 'Measure from the neutral axis (mid-depth), not the full depth.' }],
          },
          {
            kind: 'number',
            prompt: 'Step 2 — Convert M to N·mm.',
            answer: M * 1e6,
            unit: 'N·mm',
            hint: '1 kN·m = 10⁶ N·mm',
            solution: [`M = ${M} \\times 10^6\\ \\text{N·mm}`],
            traps: [{ value: M * 1e3, msg: '1 kN = 10³ N AND 1 m = 10³ mm, so × 10⁶.' }],
          },
          {
            kind: 'number',
            prompt: 'Step 3 — Maximum bending stress (MPa).',
            answer: s,
            unit: 'MPa',
            hint: 'σ = My/I',
            solution: [`\\sigma = \\dfrac{${M}\\times10^6 \\times ${y}}{${I}\\times10^6} = ${r4(s)}\\ \\text{MPa}`],
            traps: [{ value: 2 * s, msg: 'You used the full depth for y.' }],
          },
        ],
        final: `σ_max = ${r4(s)} MPa (compression in the top fibre and tension in the bottom fibre for sagging).`,
      };
    },
  },
  {
    id: 'machine',
    title: 'Pulley system: MA, VR and efficiency',
    module: 'transport',
    topic: 'Simple machines',
    generate: (seed) => {
      const r = rng(seed + 71);
      const n = pick(r, [2, 3, 4, 5, 6]);
      const eta = pick(r, [0.6, 0.7, 0.75, 0.8, 0.85]);
      const load = pick(r, [600, 800, 900, 1200, 1500, 2000]);
      const effort = r4(load / (n * eta));
      const MA = load / effort;
      return {
        statement: `A pulley block has ${n} rope segments supporting the moving block. An effort of ${effort} N lifts a load of ${load} N.`,
        given: [
          { label: 'Supporting segments', value: `${n}` },
          { label: 'Load', value: `${load} N` },
          { label: 'Effort', value: `${effort} N` },
        ],
        diagram: { type: 'pulley', n, load, effort },
        steps: [
          { kind: 'number', prompt: 'Step 1 — Velocity ratio.', answer: n, unit: '', hint: 'VR = number of rope segments supporting the moving block.', solution: [`\\text{VR} = ${n}`] },
          { kind: 'number', prompt: 'Step 2 — Mechanical advantage.', answer: MA, unit: '', hint: 'MA = load / effort', solution: [`\\text{MA} = ${load}/${effort} = ${r4(MA)}`], traps: [{ value: effort / load, msg: 'Inverted — MA = load ÷ effort.' }] },
          { kind: 'number', prompt: 'Step 3 — Efficiency (%).', answer: (MA / n) * 100, unit: '%', hint: 'η = MA/VR × 100', solution: [`\\eta = ${r4(MA)}/${n} \\times 100 = ${r4((MA / n) * 100)}\\%`], traps: [{ value: (n / MA) * 100, msg: 'Inverted — efficiency cannot exceed 100%.' }] },
        ],
        final: `VR = ${n}, MA = ${r4(MA)}, η = ${r4((MA / n) * 100)}%.`,
      };
    },
  },
  {
    id: 'energy',
    title: 'Kinetic and potential energy',
    module: 'transport',
    topic: 'Energy',
    generate: (seed) => {
      const r = rng(seed + 81);
      const m = pick(r, [800, 1000, 1200, 1500, 1800]);
      const vk = pick(r, [36, 54, 60, 72, 90, 108]);
      const v = vk / 3.6;
      const Ek = 0.5 * m * v * v;
      const h = Ek / (m * g);
      return {
        statement: `A ${m} kg car travels at ${vk} km/h. Find its kinetic energy, and the height it could climb if all of this energy became potential energy (no losses).`,
        given: [
          { label: 'Mass', value: `${m} kg` },
          { label: 'Speed', value: `${vk} km/h` },
        ],
        steps: [
          { kind: 'number', prompt: 'Step 1 — Convert the speed to m/s.', answer: v, unit: 'm/s', hint: '÷ 3.6', solution: [`v = ${vk}/3.6 = ${r4(v)}\\ \\text{m/s}`], traps: [{ value: vk * 3.6, msg: 'Divide by 3.6 (not multiply).' }] },
          { kind: 'number', prompt: 'Step 2 — Kinetic energy (J).', answer: Ek, unit: 'J', hint: 'E_k = ½mv²', solution: [`E_k = \\tfrac12(${m})(${r4(v)})^2 = ${r4(Ek)}\\ \\text{J}`], traps: [{ value: 0.5 * m * vk * vk, msg: 'Use the speed in m/s.' }, { value: m * v * v, msg: 'Include the ½.' }] },
          { kind: 'number', prompt: 'Step 3 — Equivalent height (m).', answer: h, unit: 'm', hint: 'mgh = E_k → h = E_k/(mg)', solution: [`h = \\dfrac{${r4(Ek)}}{${m}(9.81)} = ${r4(h)}\\ \\text{m}`] },
        ],
        final: `E_k = ${r4(Ek)} J; equivalent height ${r4(h)} m (independent of mass: h = v²/2g).`,
      };
    },
  },
  {
    id: 'power',
    title: 'Work and power when lifting',
    module: 'transport',
    topic: 'Power',
    generate: (seed) => {
      const r = rng(seed + 91);
      const m = pick(r, [300, 500, 750, 800, 1000]);
      const h = pick(r, [10, 12, 15, 20, 25]);
      const t = pick(r, [10, 15, 20, 25, 30]);
      const W = m * g * h;
      return {
        statement: `A lift raises ${m} kg through ${h} m in ${t} s at constant speed. Find the work done and the useful power output.`,
        given: [
          { label: 'Mass', value: `${m} kg` },
          { label: 'Height', value: `${h} m` },
          { label: 'Time', value: `${t} s` },
        ],
        steps: [
          { kind: 'number', prompt: 'Step 1 — Weight of the load (N).', answer: m * g, unit: 'N', hint: 'W = mg', solution: [`${m} \\times 9.81 = ${r4(m * g)}\\ \\text{N}`] },
          { kind: 'number', prompt: 'Step 2 — Work done (J).', answer: W, unit: 'J', hint: 'Work = force × distance', solution: [`W = ${r4(m * g)} \\times ${h} = ${r4(W)}\\ \\text{J}`], traps: [{ value: m * h, msg: 'Use the weight (N), not the mass (kg).' }] },
          { kind: 'number', prompt: 'Step 3 — Power (W).', answer: W / t, unit: 'W', hint: 'P = W/t', solution: [`P = ${r4(W)}/${t} = ${r4(W / t)}\\ \\text{W}`], traps: [{ value: W * t, msg: 'Power = work ÷ time.' }] },
        ],
        final: `Work = ${r4(W)} J; power = ${r4(W / t)} W (${fixed(W / t / 1000, 2)} kW).`,
      };
    },
  },
  {
    id: 'friction',
    title: 'Friction on an inclined plane',
    module: 'transport',
    topic: 'Friction',
    generate: (seed) => {
      const r = rng(seed + 101);
      const m = pick(r, [10, 20, 25, 40, 50]);
      const theta = pick(r, [15, 20, 25, 30, 35]);
      const mu = pick(r, [0.2, 0.3, 0.4, 0.5, 0.6]);
      const res = incline(m, theta, mu);
      return {
        statement: `A ${m} kg block rests on a plane inclined at ${theta}°. The coefficient of static friction is ${mu}. Will it slide?`,
        given: [
          { label: 'Mass', value: `${m} kg` },
          { label: 'Angle', value: `${theta}°` },
          { label: 'μ_s', value: `${mu}` },
        ],
        diagram: { type: 'incline', m, theta, mu },
        steps: [
          { kind: 'number', prompt: 'Step 1 — Normal reaction N (N).', answer: res.N, unit: 'N', hint: 'N = mg cos θ', solution: [`N = ${m}(9.81)\\cos ${theta}^\\circ = ${r4(res.N)}\\ \\text{N}`], traps: [{ value: m * g, msg: 'On an incline N = mg cos θ.' }, { value: m * g * Math.sin((theta * Math.PI) / 180), msg: 'That is the component DOWN the slope (mg sin θ).' }] },
          { kind: 'number', prompt: 'Step 2 — Component of weight down the slope (N).', answer: res.down, unit: 'N', hint: 'mg sin θ', solution: [`${m}(9.81)\\sin ${theta}^\\circ = ${r4(res.down)}\\ \\text{N}`] },
          { kind: 'number', prompt: 'Step 3 — Limiting friction (N).', answer: res.Fmax, unit: 'N', hint: 'F = μN', solution: [`F_{\\max} = ${mu} \\times ${r4(res.N)} = ${r4(res.Fmax)}\\ \\text{N}`] },
          {
            kind: 'choice',
            prompt: 'Step 4 — Does the block slide?',
            options: [
              { text: res.slides ? 'Yes — the down-slope component exceeds limiting friction' : 'No — limiting friction exceeds the down-slope component', feedback: `Correct. Equivalently, tan ${theta}° = ${fixed(Math.tan((theta * Math.PI) / 180), 3)} ${res.slides ? '>' : '<'} μ = ${mu}.` },
              { text: res.slides ? 'No — friction always holds the block' : 'Yes — any slope makes it slide', feedback: 'Compare mg sin θ with μN (or tan θ with μ).' },
            ],
            answer: 0,
            solution: [`\\tan ${theta}^\\circ = ${fixed(Math.tan((theta * Math.PI) / 180), 3)} \\ ${res.slides ? '>' : '<'}\\ \\mu = ${mu}`],
          },
        ],
        final: res.slides ? `It slides: net force ${r4(res.net)} N down the slope.` : `It stays at rest; friction = ${r4(res.down)} N (less than the limiting ${r4(res.Fmax)} N).`,
      };
    },
  },
  {
    id: 'hydraulic',
    title: 'Hydraulic system (Pascal’s principle)',
    module: 'aero',
    topic: 'Hydraulics',
    generate: (seed) => {
      const r = rng(seed + 111);
      const d1 = pick(r, [10, 12, 15, 20, 25]);
      const ratio = pick(r, [2, 3, 4, 5]);
      const d2 = d1 * ratio;
      const F1 = pick(r, [100, 150, 200, 250, 300]);
      const A1 = (Math.PI * d1 * d1) / 4;
      const p = F1 / A1;
      const F2 = F1 * ratio * ratio;
      return {
        statement: `A ${F1} N force acts on a ${d1} mm diameter master piston connected to a ${d2} mm diameter actuator piston. Find the system pressure and the output force.`,
        given: [
          { label: 'Input force', value: `${F1} N` },
          { label: 'Master diameter', value: `${d1} mm` },
          { label: 'Actuator diameter', value: `${d2} mm` },
        ],
        diagram: { type: 'hydraulic', F1, d1, d2 },
        steps: [
          { kind: 'number', prompt: 'Step 1 — Area of the master piston (mm²).', answer: A1, unit: 'mm²', hint: 'πd²/4', solution: [`A_1 = \\pi(${d1})^2/4 = ${r4(A1)}\\ \\text{mm}^2`] },
          { kind: 'number', prompt: 'Step 2 — Pressure (MPa).', answer: p, unit: 'MPa', hint: 'p = F/A (N/mm² = MPa)', solution: [`p = ${F1}/${r4(A1)} = ${r4(p)}\\ \\text{MPa}`] },
          { kind: 'number', prompt: 'Step 3 — Output force (N).', answer: F2, unit: 'N', hint: 'F₂ = F₁(d₂/d₁)²', solution: [`F_2 = ${F1}\\times(${d2}/${d1})^2 = ${F2}\\ \\text{N}`], traps: [{ value: F1 * ratio, msg: 'Use the AREA ratio (diameter ratio squared).' }] },
        ],
        final: `p = ${r4(p)} MPa; F₂ = ${F2} N. The actuator moves ${ratio * ratio}× less distance than the master piston.`,
      };
    },
  },
  {
    id: 'circuit',
    title: 'Series / parallel circuit',
    module: 'transport',
    topic: 'Circuits',
    generate: (seed) => {
      const r = rng(seed + 121);
      const V = pick(r, [6, 9, 12, 24]);
      const R1 = pick(r, [2, 3, 4, 6]);
      const R2 = pick(r, [4, 6, 8, 12]);
      const mode = pick(r, ['series', 'parallel'] as const);
      const Rt = mode === 'series' ? R1 + R2 : (R1 * R2) / (R1 + R2);
      const I = V / Rt;
      return {
        statement: `Resistors of ${R1} Ω and ${R2} Ω are connected in ${mode} across a ${V} V battery. Find the total resistance, current from the battery and total power.`,
        given: [
          { label: 'Supply', value: `${V} V` },
          { label: 'R₁, R₂', value: `${R1} Ω, ${R2} Ω` },
          { label: 'Connection', value: mode },
        ],
        diagram: { type: 'circuit', V, R: [R1, R2], mode },
        steps: [
          {
            kind: 'number',
            prompt: 'Step 1 — Total resistance (Ω).',
            answer: Rt,
            unit: 'Ω',
            hint: mode === 'series' ? 'R = R₁ + R₂' : '1/R = 1/R₁ + 1/R₂',
            solution: [mode === 'series' ? `R_T = ${R1} + ${R2} = ${r4(Rt)}\\ \\Omega` : `\\dfrac{1}{R_T} = \\dfrac1{${R1}} + \\dfrac1{${R2}} \\Rightarrow R_T = ${r4(Rt)}\\ \\Omega`],
            traps: mode === 'parallel' ? [{ value: R1 + R2, msg: 'That is the series total. Parallel resistance is less than the smallest resistor.' }, { value: 1 / Rt, msg: 'Remember to invert 1/R_T.' }] : [{ value: (R1 * R2) / (R1 + R2), msg: 'That is the parallel formula.' }],
          },
          { kind: 'number', prompt: 'Step 2 — Supply current (A).', answer: I, unit: 'A', hint: 'I = V/R', solution: [`I = ${V}/${r4(Rt)} = ${r4(I)}\\ \\text{A}`] },
          { kind: 'number', prompt: 'Step 3 — Total power (W).', answer: V * I, unit: 'W', hint: 'P = VI', solution: [`P = ${V} \\times ${r4(I)} = ${r4(V * I)}\\ \\text{W}`] },
        ],
        final: `R_T = ${r4(Rt)} Ω, I = ${r4(I)} A, P = ${r4(V * I)} W.`,
      };
    },
  },
];

/** Remove any "trap" (common wrong answer) that coincides with the correct answer for particular numbers. */
function clean(p: Problem): Problem {
  return {
    ...p,
    steps: p.steps.map((s) =>
      s.kind === 'number' && s.traps
        ? { ...s, traps: s.traps.filter((t) => Math.abs(t.value - s.answer) > 0.011 * Math.max(Math.abs(s.answer), 1e-9)) }
        : s,
    ),
  };
}

export const TEMPLATES: Template[] = RAW_TEMPLATES.map((t) => ({ ...t, generate: (seed: number) => clean(t.generate(seed)) }));
