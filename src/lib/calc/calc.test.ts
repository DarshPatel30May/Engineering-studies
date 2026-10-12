import { describe, it, expect } from 'vitest';
import { solveBeam, resolveForce, resultant, equilibrant, momentAbout } from './statics';
import { solveTruss, makeTruss, simpleTriangleTruss, methodOfSections, findZeroForceMembers, type Truss } from './truss';
import { stress, strain, youngsModulus, factorOfSafety, bendingStress, areaCircle, extension, trueStress, iRect } from './mechanics';
import { machineVR, efficiency, incline, horizontalPush, angleOfFriction, kineticEnergy, potentialEnergy, power, work } from './transport';
import { hydraulicPress, hydrostatic, dynamicPressure, venturi, isaPressure, pressureAltitude, pitotSpeed } from './fluids';
import { solveCircuit, zenerRegulator, transistorSwitch, parallelR } from './electric';
import { gate, truthTable, evaluate, type Circuit } from './logic';
import { convert } from './units';
import { criticalAngle, numericalAperture, GEO_ALTITUDE_KM, orbitalPeriod, wavelength, bentPipeDelay } from './telecom';
import { parseNum, sig, approxEqual } from './format';
import { solveLinear } from './linalg';

const close = (a: number, b: number, tol = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(tol);

describe('format', () => {
  it('parses numbers strictly', () => {
    expect(parseNum('12.5')).toBe(12.5);
    expect(parseNum('1,200')).toBe(1200);
    expect(parseNum('−3')).toBe(-3);
    expect(parseNum('2e3')).toBe(2000);
    expect(parseNum('abc')).toBeNull();
    expect(parseNum('')).toBeNull();
    expect(parseNum('1.2.3')).toBeNull();
  });
  it('formats significant figures', () => {
    expect(sig(21.2132034, 4)).toBe('21.21');
    expect(sig(-0.0000001, 3)).toContain('10^');
    expect(sig(0)).toBe('0');
  });
  it('compares with tolerance', () => {
    expect(approxEqual(100, 101, 0.02)).toBe(true);
    expect(approxEqual(100, 105, 0.02)).toBe(false);
  });
});

describe('linear solver', () => {
  it('solves a 3×3 system', () => {
    const x = solveLinear(
      [
        [2, 1, -1],
        [-3, -1, 2],
        [-2, 1, 2],
      ],
      [8, -11, -3],
    )!;
    close(x[0], 2);
    close(x[1], 3);
    close(x[2], -1);
  });
  it('detects singular systems', () => {
    expect(solveLinear([[1, 2], [2, 4]], [1, 2])).toBeNull();
  });
});

describe('forces', () => {
  it('resolves a 100 N force at 30°', () => {
    const r = resolveForce(100, 30);
    close(r.Fx, 86.60254, 1e-4);
    close(r.Fy, 50);
  });
  it('finds a resultant and equilibrant', () => {
    const r = resultant([
      { F: 30, angleDeg: 0 },
      { F: 40, angleDeg: 90 },
    ]);
    close(r.R, 50);
    close(r.angleDeg, 53.130102, 1e-5);
    const e = equilibrant([
      { F: 30, angleDeg: 0 },
      { F: 40, angleDeg: 90 },
    ]);
    close(e.angleDeg, 233.130102, 1e-5);
  });
  it('computes moments anticlockwise-positive', () => {
    // 10 N downward at 2 m to the right of the origin → clockwise → −20 N·m
    close(momentAbout({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -10 }), -20);
  });
});

describe('beam solver', () => {
  it('solves the 6 m beam with 18 kN at 2 m (worked example)', () => {
    const r = solveBeam({ L: 6, a: 0, b: 6 }, [{ id: 'p', P: 18, x: 2 }]);
    if (!r.ok) throw new Error(r.errors.join());
    close(r.RA, 12);
    close(r.RB, 6);
    close(r.maxMoment.value, 24);
    close(r.maxMoment.x, 2);
    close(r.check.sumFy, 0);
    close(r.check.endMoment, 0);
    // SFD: +12 from A to load, −6 from load to B
    expect(r.sfd.map((p) => p.v)).toEqual([0, 12, 12, -6, -6, 0]);
  });
  it('solves two point loads', () => {
    const r = solveBeam({ L: 10, a: 0, b: 10 }, [
      { id: '1', P: 20, x: 3 },
      { id: '2', P: 30, x: 7 },
    ]);
    if (!r.ok) throw new Error();
    close(r.RA, 23);
    close(r.RB, 27);
    close(r.bmd.find((p) => p.x === 3)!.v, 69);
    close(r.bmd.find((p) => p.x === 7)!.v, 81);
    close(r.maxMoment.value, 81);
  });
  it('handles an overhang (hogging moment and downward reaction)', () => {
    const r = solveBeam({ L: 8, a: 0, b: 6 }, [{ id: '1', P: 10, x: 8 }]);
    if (!r.ok) throw new Error();
    close(r.RB, 80 / 6);
    close(r.RA, 10 - 80 / 6);
    close(r.minMoment.value, -20);
    close(r.minMoment.x, 6);
    close(r.check.endMoment, 0);
  });
  it('rejects invalid input', () => {
    const r = solveBeam({ L: 5, a: 3, b: 2 }, [{ id: '1', P: 10, x: 6 }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThanOrEqual(2);
    expect(solveBeam({ L: -1, a: 0, b: 1 }, [{ id: '1', P: 1, x: 0 }]).ok).toBe(false);
    expect(solveBeam({ L: 4, a: 0, b: 4 }, []).ok).toBe(false);
  });
});

describe('truss solver', () => {
  it('solves a symmetric triangular truss', () => {
    const t = simpleTriangleTruss(6, 3, 10);
    const s = solveTruss(t);
    if (!s.ok) throw new Error(s.errors.join());
    close(s.forces.AC, -10 / Math.SQRT2 / 1 * 1, 1e-6); // −7.071 kN (compression)
    close(s.forces.BC, -7.0710678, 1e-6);
    close(s.forces.AB, 5); // tension
    close(s.reactions.find((r) => r.node === 'B')!.value, 5);
    expect(s.maxResidual).toBeLessThan(1e-9);
  });

  it('joint-by-joint steps agree with the simultaneous solution', () => {
    for (const type of ['pratt', 'howe', 'warren', 'king-post'] as const) {
      const t = makeTruss(type, 4, 12, 3, 10);
      const s = solveTruss(t);
      if (!s.ok) throw new Error(`${type}: ${s.errors.join()}`);
      const solvedMembers = new Set<string>();
      for (const step of s.jointSteps)
        for (const v of step.solved) {
          close(v.value, s.forces[v.member], 1e-6);
          solvedMembers.add(v.member);
        }
      expect(solvedMembers.size).toBe(t.members.length);
    }
  });

  it('gives known Pratt truss values', () => {
    // 4 panels × 3 m, height 3 m, 10 kN at L1, L2, L3 → reactions 15 kN
    const t = makeTruss('pratt', 4, 12, 3, 10);
    const s = solveTruss(t);
    if (!s.ok) throw new Error();
    close(s.reactions.find((r) => r.node === 'L0' && r.dir === 'y')!.value, 15);
    close(s.forces.L0U1, -15 * Math.SQRT2); // end post in compression
    close(s.forces.L0L1, 15); // bottom chord tension
    // Mid-span top chord: M at L2 = 15×6 − 10×3 = 60 kN·m → F = −60/3 = −20 kN
    close(s.forces.U1U2, -20);
    close(s.forces.L1L2, 15);
  });

  it('method of sections matches method of joints', () => {
    const t = makeTruss('pratt', 4, 12, 3, 10);
    const s = solveTruss(t);
    if (!s.ok) throw new Error();
    const res = methodOfSections(t, s, ['U1U2', 'U1L2', 'L1L2'], ['L0', 'L1', 'U1']);
    if ('error' in res) throw new Error(res.error);
    for (const step of res) close(step.value, s.forces[step.member], 1e-6);
    // U1U2 and L1L2 are parallel, so diagonal U1L2 is found by resolving vertically.
    expect(res.find((p) => p.member === 'U1L2')!.method).toBe('force');
    // A cut that misses a crossing member (U1L2) must be rejected, not solved incorrectly.
    const missing = methodOfSections(t, s, ['U1U2', 'L1U1', 'L0L1'], ['L0', 'U1']);
    expect('error' in missing).toBe(true);
    const bad = methodOfSections(t, s, ['U1U2', 'U1L2', 'L1L2'], ['L0', 'L1']);
    expect('error' in bad).toBe(true); // U1 is not on the chosen side
  });

  it('detects instability and indeterminacy', () => {
    const unstable: Truss = {
      nodes: [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 4, y: 0 },
        { id: 'C', x: 4, y: 3 },
        { id: 'D', x: 0, y: 3 },
      ],
      members: [
        { id: 'AB', a: 'A', b: 'B' },
        { id: 'BC', a: 'B', b: 'C' },
        { id: 'CD', a: 'C', b: 'D' },
        { id: 'DA', a: 'D', b: 'A' },
      ],
      supports: [
        { node: 'A', type: 'pin' },
        { node: 'B', type: 'roller' },
      ],
      loads: [{ node: 'C', Fx: 5, Fy: 0 }],
    };
    expect(solveTruss(unstable).ok).toBe(false);
    const braced = { ...unstable, members: [...unstable.members, { id: 'AC', a: 'A', b: 'C' }] };
    const ok = solveTruss(braced);
    expect(ok.ok).toBe(true);
    const over = { ...braced, members: [...braced.members, { id: 'BD', a: 'B', b: 'D' }] };
    expect(solveTruss(over).ok).toBe(false);
  });

  it('identifies zero-force members', () => {
    const t: Truss = {
      nodes: [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 4, y: 0 },
        { id: 'C', x: 8, y: 0 },
        { id: 'D', x: 4, y: 3 },
      ],
      members: [
        { id: 'AB', a: 'A', b: 'B' },
        { id: 'BC', a: 'B', b: 'C' },
        { id: 'AD', a: 'A', b: 'D' },
        { id: 'CD', a: 'C', b: 'D' },
        { id: 'BD', a: 'B', b: 'D' },
      ],
      supports: [
        { node: 'A', type: 'pin' },
        { node: 'C', type: 'roller' },
      ],
      loads: [{ node: 'D', Fx: 0, Fy: -12 }],
    };
    expect(findZeroForceMembers(t)).toEqual(['BD']);
    const s = solveTruss(t);
    if (!s.ok) throw new Error();
    close(s.forces.BD, 0);
  });
});

describe('stress and strain', () => {
  it('computes axial stress in a 20 mm rod under 50 kN', () => {
    const A = areaCircle(0.02);
    close(stress(50e3, A) / 1e6, 159.1549, 1e-3);
  });
  it('computes strain, E, extension and FoS', () => {
    close(strain(0.6e-3, 2), 3e-4);
    close(youngsModulus(60e6, 3e-4) / 1e9, 200);
    close(extension(50e3, 2, 500e-6, 200e9) * 1000, 1); // 1 mm
    close(factorOfSafety(250, 100), 2.5);
    close(trueStress(400, 0.2), 480);
  });
  it('computes bending stress (σ = My/I)', () => {
    // M = 24 kN·m, y = 150 mm, I = 80×10⁶ mm⁴ → 45 MPa
    close(bendingStress(24e6, 150, 80e6), 45);
    close(iRect(100, 200), 200e6 / 3, 1e-3);
  });
});

describe('transport mechanics', () => {
  it('calculates VR and efficiency', () => {
    expect(machineVR('pulley', { ropes: 4 })).toBe(4);
    close(machineVR('lever', { effortArm: 1.5, loadArm: 0.3 }), 5);
    expect(machineVR('gears', { driverTeeth: 12, drivenTeeth: 48 })).toBe(4);
    close(efficiency(3.2, 4), 0.8);
  });
  it('handles friction on an incline and the angle of repose', () => {
    close(angleOfFriction(1), 45);
    const holds = incline(10, 20, 0.5);
    expect(holds.slides).toBe(false);
    const slides = incline(10, 30, 0.5);
    expect(slides.slides).toBe(true);
    const push = horizontalPush(20, 50, 0, 0.3); // W = 196.2 N, Fmax = 58.86 N
    expect(push.slides).toBe(false);
    close(push.friction, 50);
  });
  it('energy and power', () => {
    close(kineticEnergy(1200, 25), 375000);
    close(potentialEnergy(80, 10), 7848);
    close(power(1500, 3), 500);
    close(work(100, 5, 60), 250, 1e-9);
  });
});

describe('fluids', () => {
  it('hydraulic press and pressure', () => {
    const r = hydraulicPress(200, 0.0005, 0.02, 0.1);
    close(r.p, 400000);
    close(r.F2, 8000);
    close(r.d2!, 0.0025);
    close(hydrostatic(1000, 10), 98100);
    close(dynamicPressure(1.225, 100), 6125);
    close(pitotSpeed(6125, 1.225), 100);
  });
  it('venturi conserves flow and total pressure', () => {
    const r = venturi(1000, 0.01, 0.005, 2, 200000);
    close(r.v2, 4);
    close(r.p2, 200000 - 0.5 * 1000 * (16 - 4));
  });
  it('ISA pressure', () => {
    close(isaPressure(0), 101325, 1e-6);
    close(isaPressure(5000) / 1000, 54.02, 0.05);
    close(pressureAltitude(isaPressure(3000)), 3000, 1e-6);
  });
});

describe('electricity', () => {
  it('series and parallel circuits', () => {
    const s = solveCircuit(12, [2, 4], 'series');
    close(s.It, 2);
    close(s.branches[1].V, 8);
    const p = solveCircuit(12, [4, 12], 'parallel');
    close(p.Rt, 3);
    close(p.It, 4);
    close(parallelR([10, 10]), 5);
  });
  it('zener regulator and transistor switch', () => {
    const z = zenerRegulator(12, 5.1, 100, 1000);
    expect(z.regulating).toBe(true);
    close(z.Is, 0.069);
    close(z.Iz, 0.069 - 0.0051);
    const t = transistorSwitch(5, 1000, 5, 10000, 100);
    expect(t.saturated).toBe(true);
    const off = transistorSwitch(5, 1000, 0, 10000, 100);
    expect(off.off).toBe(true);
  });
});

describe('logic', () => {
  it('gate truth tables', () => {
    const tt = (t: Parameters<typeof gate>[0]) => [gate(t, false, false), gate(t, false, true), gate(t, true, false), gate(t, true, true)];
    expect(tt('AND')).toEqual([false, false, false, true]);
    expect(tt('OR')).toEqual([false, true, true, true]);
    expect(tt('NAND')).toEqual([true, true, true, false]);
    expect(tt('NOR')).toEqual([true, false, false, false]);
    expect(tt('XOR')).toEqual([false, true, true, false]);
  });
  it('NAND-only circuit forms an OR gate', () => {
    const c: Circuit = {
      inputs: ['A', 'B'],
      gates: [
        { id: 'n1', type: 'NAND', in: ['A', 'A'] },
        { id: 'n2', type: 'NAND', in: ['B', 'B'] },
        { id: 'q', type: 'NAND', in: ['n1', 'n2'] },
      ],
      output: 'q',
    };
    expect(truthTable(c).map((r) => r.output)).toEqual([false, true, true, true]);
  });
  it('rejects feedback loops', () => {
    const c: Circuit = { inputs: ['A'], gates: [{ id: 'x', type: 'AND', in: ['A', 'x'] }], output: 'x' };
    expect(() => evaluate(c, { A: true })).toThrow();
  });
});

describe('units', () => {
  it('never confuses area and length', () => {
    close(convert(1, 'area', 'm2', 'mm2'), 1e6);
    close(convert(1, 'volume', 'm3', 'mm3'), 1e9);
    close(convert(250, 'stress', 'MPa', 'Pa'), 250e6);
    close(convert(1, 'second-moment', 'm4', 'mm4'), 1e12);
    close(convert(1, 'energy', 'kWh', 'MJ'), 3.6);
    close(convert(100, 'speed', 'kmh', 'ms'), 27.7777778, 1e-6);
    close(convert(25, 'temperature', 'C', 'K'), 298.15);
  });
});

describe('telecommunications', () => {
  it('fibre optics', () => {
    close(criticalAngle(1.48, 1.46), 80.6, 0.1);
    close(numericalAperture(1.48, 1.46), 0.2425, 1e-3);
  });
  it('orbits and propagation', () => {
    close(GEO_ALTITUDE_KM, 35786, 2);
    close(orbitalPeriod(GEO_ALTITUDE_KM + 6378.137 - 6371) / 3600, 23.934, 0.01);
    close(bentPipeDelay(35786), 0.2387, 1e-3);
    close(wavelength(100e6), 2.998, 1e-3);
  });
});
