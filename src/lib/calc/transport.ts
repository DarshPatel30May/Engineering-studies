/** Simple machines, friction, work, energy and power. SI units: N, m, J, W, kg, s. */
export const g = 9.81; // m/s² — value used in HSC Engineering Studies calculations

export const mechanicalAdvantage = (load: number, effort: number) => load / effort;
export const velocityRatio = (effortDistance: number, loadDistance: number) => effortDistance / loadDistance;
/** Efficiency as a fraction (multiply by 100 for %). η = MA / VR = work out / work in. */
export const efficiency = (MA: number, VR: number) => MA / VR;

export type MachineKind = 'lever' | 'pulley' | 'wheel-axle' | 'gears' | 'incline' | 'screw';

/** Velocity ratio from machine geometry. */
export function machineVR(kind: MachineKind, p: Record<string, number>): number {
  switch (kind) {
    case 'lever':
      return p.effortArm / p.loadArm; // distances from fulcrum
    case 'pulley':
      return p.ropes; // number of rope segments supporting the moving block
    case 'wheel-axle':
      return p.wheelD / p.axleD;
    case 'gears':
      return p.drivenTeeth / p.driverTeeth; // effort applied to driver
    case 'incline':
      return p.length / p.height;
    case 'screw':
      return (2 * Math.PI * p.handleR) / p.pitch;
  }
}

/** Limiting static friction: F = μN. */
export const frictionForce = (mu: number, N: number) => mu * N;
export const coefficientOfFriction = (F: number, N: number) => F / N;
/** Angle of static friction φ = tan⁻¹ μ (equals the angle of repose for a block on an incline). */
export const angleOfFriction = (mu: number) => (Math.atan(mu) * 180) / Math.PI;

/** Block on an incline (angle θ in degrees). Returns force components in N. */
export function incline(massKg: number, thetaDeg: number, mu: number) {
  const W = massKg * g;
  const t = (thetaDeg * Math.PI) / 180;
  const N = W * Math.cos(t);
  const down = W * Math.sin(t);
  const Fmax = mu * N;
  const slides = down > Fmax + 1e-12;
  return { W, N, down, Fmax, friction: slides ? Fmax : down, slides, net: slides ? down - Fmax : 0 };
}

/**
 * Block on a horizontal surface pushed by force P at angle α above horizontal.
 * Static model (Coulomb): friction resists up to μN; beyond that the block slides.
 */
export function horizontalPush(massKg: number, P: number, alphaDeg: number, mu: number) {
  const a = (alphaDeg * Math.PI) / 180;
  const W = massKg * g;
  const Ph = P * Math.cos(a);
  const Pv = P * Math.sin(a);
  const N = W - Pv; // pulling upward reduces the normal reaction
  if (N < 0) return { W, N: 0, Ph, Pv, Fmax: 0, friction: 0, slides: true, lifts: true };
  const Fmax = mu * N;
  const slides = Ph > Fmax + 1e-12;
  return { W, N, Ph, Pv, Fmax, friction: slides ? Fmax : Ph, slides, lifts: false };
}

export const work = (F: number, s: number, angleDeg = 0) => F * s * Math.cos((angleDeg * Math.PI) / 180);
export const kineticEnergy = (m: number, v: number) => 0.5 * m * v * v;
export const potentialEnergy = (m: number, h: number) => m * g * h;
export const power = (W: number, t: number) => W / t;
/** Power to maintain speed v against resistive force F: P = F v. */
export const powerFv = (F: number, v: number) => F * v;
export const kmh2ms = (v: number) => v / 3.6;
