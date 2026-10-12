/**
 * Stress, strain, elasticity, factor of safety and bending stress.
 * Units are SI base unless stated: N, m, Pa. UI layers convert from kN, mm, MPa, GPa.
 */

/** Normal (tensile/compressive) or average shear stress: σ = F / A. */
export const stress = (F: number, A: number) => F / A;
/** Strain: ε = ΔL / L₀ (dimensionless). */
export const strain = (dL: number, L0: number) => dL / L0;
/** Young's modulus: E = σ / ε (valid only in the linear-elastic region). */
export const youngsModulus = (sigma: number, eps: number) => sigma / eps;
/** Extension from Hooke's law: ΔL = F L₀ / (A E). */
export const extension = (F: number, L0: number, A: number, E: number) => (F * L0) / (A * E);

/**
 * Factor of safety. HSC usage: FoS = ultimate (or yield) stress ÷ working (allowable) stress.
 * Which "limit" stress is used must be stated: yield for ductile metals (to avoid permanent set),
 * UTS for brittle materials.
 */
export const factorOfSafety = (limitStress: number, workingStress: number) => limitStress / workingStress;
export const workingStress = (limitStress: number, fos: number) => limitStress / fos;

/** True stress from engineering stress (valid up to the onset of necking, constant volume): σ_t = σ(1+ε). */
export const trueStress = (engStress: number, engStrain: number) => engStress * (1 + engStrain);
/** True strain: ε_t = ln(1+ε). */
export const trueStrain = (engStrain: number) => Math.log(1 + engStrain);

/** Bending stress: σ = M y / I. M in N·m, y in m, I in m⁴ → Pa. */
export const bendingStress = (M: number, y: number, I: number) => (M * y) / I;

/** Cross-sectional areas (m² if inputs in m). */
export const areaCircle = (d: number) => (Math.PI * d * d) / 4;
export const areaTube = (D: number, d: number) => (Math.PI * (D * D - d * d)) / 4;
export const areaRect = (b: number, h: number) => b * h;

/**
 * Second moments of area about the centroidal axis — REFERENCE ONLY.
 * The HSC syllabus provides I in bending-stress questions ("second moment of area given");
 * these are included so the beam visualiser can show realistic stresses.
 */
export const iRect = (b: number, h: number) => (b * h ** 3) / 12;
export const iCircle = (d: number) => (Math.PI * d ** 4) / 64;
