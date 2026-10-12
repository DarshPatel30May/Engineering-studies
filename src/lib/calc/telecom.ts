/** Telecommunications helper relationships. */
export const C = 299_792_458; // m/s, speed of light in vacuum
export const EARTH_R = 6371; // km, mean radius
export const MU_EARTH = 398_600.4418; // km³/s², Earth's standard gravitational parameter

/** Wavelength λ = c / f (free space). */
export const wavelength = (f: number) => C / f;

/** Snell's law critical angle at core/cladding boundary, degrees from the normal. */
export const criticalAngle = (n1: number, n2: number) => (Math.asin(n2 / n1) * 180) / Math.PI;
/** Numerical aperture NA = √(n₁² − n₂²). */
export const numericalAperture = (n1: number, n2: number) => Math.sqrt(n1 * n1 - n2 * n2);
/** Acceptance half-angle in air: θ = sin⁻¹(NA). */
export const acceptanceAngle = (n1: number, n2: number) => (Math.asin(Math.min(1, numericalAperture(n1, n2))) * 180) / Math.PI;
/** Speed of light in a medium of refractive index n. */
export const speedInMedium = (n: number) => C / n;

/** Circular orbit period (s) at altitude h km. */
export const orbitalPeriod = (hKm: number) => 2 * Math.PI * Math.sqrt((EARTH_R + hKm) ** 3 / MU_EARTH);
/** Geostationary altitude: period = one sidereal day (86 164.1 s). */
export const GEO_ALTITUDE_KM = Math.cbrt(MU_EARTH * (86164.0905 / (2 * Math.PI)) ** 2) - 6378.137; // ≈ 35 786 km (equatorial radius)
/** One-way ground→satellite→ground propagation delay for a satellite directly overhead (s). */
export const bentPipeDelay = (hKm: number) => (2 * hKm * 1000) / C;

/** AM bandwidth = 2 f_m; FM bandwidth (Carson's rule) ≈ 2(Δf + f_m). */
export const amBandwidth = (fm: number) => 2 * fm;
export const fmCarson = (deltaF: number, fm: number) => 2 * (deltaF + fm);

/** Analogue-to-digital: bit rate = sample rate × bits per sample × channels. */
export const bitRate = (fs: number, bits: number, channels = 1) => fs * bits * channels;
/** Number of quantisation levels = 2^n. */
export const levels = (bits: number) => 2 ** bits;

/** LED photon wavelength from band-gap energy (eV): λ(nm) ≈ 1240 / E_g. */
export const ledWavelengthNm = (EgEv: number) => 1239.84 / EgEv;

/** Signal level in dB relative to reference power. */
export const dB = (P: number, Pref: number) => 10 * Math.log10(P / Pref);
