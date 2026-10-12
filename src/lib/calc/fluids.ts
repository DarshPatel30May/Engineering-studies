/** Fluid mechanics and aeronautical pressure relationships (SI units). */
export const g = 9.81;
export const RHO_SEA_LEVEL = 1.225; // kg/m³, ISA sea level
export const P_SEA_LEVEL = 101325; // Pa, ISA sea level
export const RHO_WATER = 1000; // kg/m³ (fresh water, ~4 °C; HSC questions usually use 1000)
export const RHO_HYDRAULIC_OIL = 870; // kg/m³ — typical mineral hydraulic fluid (varies 850–890)

/** Pressure: p = F / A. */
export const pressure = (F: number, A: number) => F / A;
/** Hydrostatic (gauge) pressure: p = ρ g h. */
export const hydrostatic = (rho: number, h: number) => rho * g * h;
/** Dynamic pressure: q = ½ ρ v². */
export const dynamicPressure = (rho: number, v: number) => 0.5 * rho * v * v;
/** Airspeed from pitot–static pressure difference (incompressible): v = √(2Δp/ρ). */
export const pitotSpeed = (dp: number, rho: number) => Math.sqrt((2 * dp) / rho);

/** Pascal's principle in a hydraulic press: p₁ = p₂ → F₂ = F₁ A₂ / A₁. */
export function hydraulicPress(F1: number, A1: number, A2: number, d1?: number) {
  const p = F1 / A1;
  const F2 = p * A2;
  const MA = A2 / A1;
  const d2 = d1 !== undefined ? (d1 * A1) / A2 : undefined; // volume conserved
  return { p, F2, MA, d2 };
}

/**
 * Venturi / continuity + Bernoulli (steady, incompressible, inviscid flow, horizontal pipe):
 * A₁v₁ = A₂v₂ ;  p₁ + ½ρv₁² = p₂ + ½ρv₂²
 */
export function venturi(rho: number, A1: number, A2: number, v1: number, p1: number) {
  const v2 = (A1 * v1) / A2;
  const p2 = p1 + 0.5 * rho * (v1 * v1 - v2 * v2);
  return { v2, p2, dp: p1 - p2, Q: A1 * v1, total: p1 + 0.5 * rho * v1 * v1 };
}

/** ISA troposphere (0–11 km): pressure (Pa) at geopotential altitude h (m). */
export function isaPressure(h: number) {
  return P_SEA_LEVEL * Math.pow(1 - 2.25577e-5 * h, 5.25588);
}
/** ISA density (kg/m³) in the troposphere. */
export function isaDensity(h: number) {
  const T = 288.15 - 0.0065 * h;
  return isaPressure(h) / (287.05 * T);
}
/** Inverse of isaPressure: pressure altitude (m) from static pressure (Pa). */
export function pressureAltitude(p: number) {
  return (1 - Math.pow(p / P_SEA_LEVEL, 1 / 5.25588)) / 2.25577e-5;
}

/** Lift-to-drag ratio. */
export const liftToDrag = (L: number, D: number) => L / D;
