/** Electrical relationships (SI): V, A, Ω, W, J. */
export const ohmV = (I: number, R: number) => I * R;
export const ohmI = (V: number, R: number) => V / R;
export const ohmR = (V: number, I: number) => V / I;
export const powerVI = (V: number, I: number) => V * I;
export const powerI2R = (I: number, R: number) => I * I * R;
export const powerV2R = (V: number, R: number) => (V * V) / R;
export const energy = (P: number, t: number) => P * t;
export const seriesR = (rs: number[]) => rs.reduce((s, r) => s + r, 0);
export const parallelR = (rs: number[]) => 1 / rs.reduce((s, r) => s + 1 / r, 0);

export interface CircuitResult {
  Rt: number;
  It: number;
  branches: { R: number; V: number; I: number; P: number }[];
  Pt: number;
}

/** Ideal source V across resistors either all in series or all in parallel. */
export function solveCircuit(V: number, rs: number[], mode: 'series' | 'parallel'): CircuitResult {
  if (mode === 'series') {
    const Rt = seriesR(rs);
    const It = V / Rt;
    const branches = rs.map((R) => ({ R, I: It, V: It * R, P: It * It * R }));
    return { Rt, It, branches, Pt: V * It };
  }
  const Rt = parallelR(rs);
  const It = V / Rt;
  const branches = rs.map((R) => ({ R, V, I: V / R, P: (V * V) / R }));
  return { Rt, It, branches, Pt: V * It };
}

/** Zener shunt regulator: series resistor current, load current, zener current. */
export function zenerRegulator(Vin: number, Vz: number, Rs: number, Rload: number) {
  const Iload_unreg = Vin / (Rs + Rload);
  const Vload_unreg = Iload_unreg * Rload;
  if (Vload_unreg < Vz) {
    // Zener not conducting — load voltage set by divider
    return { regulating: false, Vout: Vload_unreg, Is: Iload_unreg, Iz: 0, IL: Iload_unreg };
  }
  const Is = (Vin - Vz) / Rs;
  const IL = Vz / Rload;
  return { regulating: true, Vout: Vz, Is, IL, Iz: Is - IL };
}

/** NPN transistor as a switch: collector current limited by β·I_B or saturation. */
export function transistorSwitch(Vcc: number, Rc: number, Vin: number, Rb: number, beta: number, Vbe = 0.7, VceSat = 0.2) {
  const Ib = Vin > Vbe ? (Vin - Vbe) / Rb : 0;
  const IcSat = (Vcc - VceSat) / Rc;
  const IcActive = beta * Ib;
  const saturated = IcActive >= IcSat;
  const Ic = saturated ? IcSat : IcActive;
  const Vce = saturated ? VceSat : Vcc - Ic * Rc;
  return { Ib, Ic, Vce, saturated, off: Ib === 0, IcSat };
}
