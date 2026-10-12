/**
 * Inviscid potential flow around a Joukowski aerofoil (flow past a circle with circulation,
 * mapped by z = ζ + c²/ζ). The Kutta condition fixes the circulation so flow leaves the sharp
 * trailing edge smoothly. Valid for attached flow only — it cannot predict stall or drag.
 */
interface C {
  re: number;
  im: number;
}
const c = (re: number, im = 0): C => ({ re, im });
const add = (a: C, b: C): C => c(a.re + b.re, a.im + b.im);
const sub = (a: C, b: C): C => c(a.re - b.re, a.im - b.im);
const mul = (a: C, b: C): C => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a: C, b: C): C => {
  const d = b.re * b.re + b.im * b.im;
  return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const abs = (a: C) => Math.hypot(a.re, a.im);
const expi = (t: number): C => c(Math.cos(t), Math.sin(t));
const csqrt = (a: C): C => {
  const r = abs(a);
  const re = Math.sqrt((r + a.re) / 2);
  const im = Math.sign(a.im || 1) * Math.sqrt(Math.max(0, (r - a.re) / 2));
  return c(re, im);
};

export interface FoilFlow {
  surface: { x: number; y: number; cp: number }[];
  streamlines: { x: number; y: number; v: number }[][];
  cl: number;
  chord: number;
  gamma: number;
}

/**
 * @param alphaDeg angle of attack (degrees). Display frame: freestream horizontal (left → right),
 *                 aerofoil rotated nose-up by α.
 * @param thickness ε (centre offset along −x), camber μ (centre offset along +y)
 */
export function joukowskiFlow(alphaDeg: number, thickness = 0.09, camber = 0.08, nStream = 15): FoilFlow {
  const U = 1;
  const cc = 1;
  const z0 = c(-thickness, camber);
  const R = abs(sub(c(cc), z0));
  const beta = Math.asin(camber / R);
  const a = (alphaDeg * Math.PI) / 180;
  const gamma = 4 * Math.PI * U * R * Math.sin(a + beta);
  const eNeg = expi(-a);
  const ePos = expi(a);
  // complex velocity w = u − iv in ζ-plane
  const w = (zeta: C): C => {
    const zp = sub(zeta, z0);
    const t1 = mul(c(U), eNeg);
    const t2 = div(mul(c(U * R * R), ePos), mul(zp, zp));
    const t3 = div(c(0, gamma / (2 * Math.PI)), zp);
    return add(sub(t1, t2), t3);
  };
  const map = (zeta: C): C => add(zeta, div(c(cc * cc), zeta));
  const dmap = (zeta: C): C => sub(c(1), div(c(cc * cc), mul(zeta, zeta)));
  const rot = (z: C): C => mul(z, expi(-a)); // display frame
  const unrot = (z: C): C => mul(z, expi(a));
  const speedZ = (zeta: C) => abs(w(zeta)) / Math.max(1e-9, abs(dmap(zeta)));

  // Surface
  const surface: FoilFlow['surface'] = [];
  for (let i = 0; i <= 180; i++) {
    const th = (i / 180) * 2 * Math.PI - beta;
    const zeta = add(z0, mul(c(R), expi(th)));
    const z = rot(map(zeta));
    const V = i === 0 || i === 180 ? 0 : speedZ(zeta);
    surface.push({ x: z.re, y: z.im, cp: 1 - V * V });
  }
  const xs = surface.map((p) => p.x);
  const chord = Math.max(...xs) - Math.min(...xs);
  const cl = (2 * gamma) / (U * chord * Math.cos(0));

  // Streamlines: seed upstream in display frame, invert the map, integrate in ζ-plane
  const streamlines: FoilFlow['streamlines'] = [];
  for (let k = 0; k < nStream; k++) {
    const yd = -1.6 + (3.2 * k) / (nStream - 1);
    const zDisp = c(-4.2, yd);
    const z = unrot(zDisp);
    const disc = csqrt(sub(mul(z, z), c(4 * cc * cc)));
    let zeta = div(add(z, disc), c(2));
    const zeta2 = div(sub(z, disc), c(2));
    if (abs(sub(zeta2, z0)) > abs(sub(zeta, z0))) zeta = zeta2;
    const line: { x: number; y: number; v: number }[] = [];
    for (let step = 0; step < 1400; step++) {
      const zz = rot(map(zeta));
      const v = speedZ(zeta);
      line.push({ x: zz.re, y: zz.im, v });
      if (zz.re > 4.2 || Math.abs(zz.im) > 3) break;
      // RK2 in ζ-plane, step scaled so that steps in the physical plane are ~uniform
      const vel = (q: C) => {
        const ww = w(q);
        return c(ww.re, -ww.im); // dζ/dt = conj(w)
      };
      const k1 = vel(zeta);
      // choose dt so the step length in the PHYSICAL plane is ≈ 0.04 chord-units
      const scale = Math.min(2, 0.04 / Math.max(1e-3, abs(k1) * Math.max(0.05, abs(dmap(zeta)))));
      const mid = add(zeta, mul(k1, c(scale / 2)));
      const k2 = vel(mid);
      const next = add(zeta, mul(k2, c(scale)));
      if (abs(sub(next, z0)) < R * 1.0005) break;
      zeta = next;
    }
    streamlines.push(line);
  }
  return { surface, streamlines, cl, chord, gamma };
}

/** Illustrative real-wing lift curve: linear (thin-aerofoil slope 2π/rad) to stall, then a drop. */
export function illustrativeCl(alphaDeg: number, alpha0 = -2, stall = 15) {
  const lin = 2 * Math.PI * ((alphaDeg - alpha0) * Math.PI) / 180;
  if (alphaDeg <= stall - 3) return lin;
  const peak = 2 * Math.PI * ((stall - alpha0) * Math.PI) / 180 * 0.93;
  if (alphaDeg <= stall) {
    const t = (alphaDeg - (stall - 3)) / 3;
    const l0 = 2 * Math.PI * ((stall - 3 - alpha0) * Math.PI) / 180;
    return l0 + (peak - l0) * Math.sin((t * Math.PI) / 2);
  }
  return peak - 0.06 * (alphaDeg - stall) - 0.35 * (1 - Math.exp(-(alphaDeg - stall) / 1.5));
}
