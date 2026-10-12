/**
 * Engineering unit conversion. Each quantity has a base SI unit; factors convert TO the base.
 * Area and volume factors are the SQUARE and CUBE of the length factors — never the length factor.
 */
export interface UnitDef {
  id: string;
  label: string;
  /** Multiply a value in this unit by `factor` to get the base unit. */
  factor: number;
  /** Optional offset (only used for temperature). */
  offset?: number;
}
export interface Quantity {
  id: string;
  name: string;
  base: string;
  units: UnitDef[];
  tip: string;
}

export const QUANTITIES: Quantity[] = [
  {
    id: 'force',
    name: 'Force',
    base: 'N',
    tip: '1 kN = 10³ N. Weight W = mg, so a 1 tonne mass weighs ≈ 9.81 kN (not 1 kN).',
    units: [
      { id: 'N', label: 'N', factor: 1 },
      { id: 'kN', label: 'kN', factor: 1e3 },
      { id: 'MN', label: 'MN', factor: 1e6 },
    ],
  },
  {
    id: 'stress',
    name: 'Pressure / stress',
    base: 'Pa',
    tip: '1 MPa = 1 N/mm² exactly — the most useful identity in stress questions. 1 GPa = 10³ MPa.',
    units: [
      { id: 'Pa', label: 'Pa (N/m²)', factor: 1 },
      { id: 'kPa', label: 'kPa', factor: 1e3 },
      { id: 'MPa', label: 'MPa (N/mm²)', factor: 1e6 },
      { id: 'GPa', label: 'GPa', factor: 1e9 },
      { id: 'bar', label: 'bar', factor: 1e5 },
      { id: 'hPa', label: 'hPa (millibar)', factor: 100 },
    ],
  },
  {
    id: 'length',
    name: 'Length',
    base: 'm',
    tip: '1 m = 1000 mm = 100 cm.',
    units: [
      { id: 'mm', label: 'mm', factor: 1e-3 },
      { id: 'cm', label: 'cm', factor: 1e-2 },
      { id: 'm', label: 'm', factor: 1 },
      { id: 'km', label: 'km', factor: 1e3 },
      { id: 'um', label: 'µm', factor: 1e-6 },
      { id: 'nm', label: 'nm', factor: 1e-9 },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    base: 'm²',
    tip: '1 m² = (1000 mm)² = 10⁶ mm² — NOT 1000 mm². Square the length factor.',
    units: [
      { id: 'mm2', label: 'mm²', factor: 1e-6 },
      { id: 'cm2', label: 'cm²', factor: 1e-4 },
      { id: 'm2', label: 'm²', factor: 1 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    base: 'm³',
    tip: '1 m³ = 10⁹ mm³ = 1000 L. Cube the length factor.',
    units: [
      { id: 'mm3', label: 'mm³', factor: 1e-9 },
      { id: 'cm3', label: 'cm³ (mL)', factor: 1e-6 },
      { id: 'L', label: 'L', factor: 1e-3 },
      { id: 'm3', label: 'm³', factor: 1 },
    ],
  },
  {
    id: 'second-moment',
    name: 'Second moment of area',
    base: 'm⁴',
    tip: '1 m⁴ = 10¹² mm⁴. Bending-stress questions usually quote I in mm⁴ (×10⁶).',
    units: [
      { id: 'mm4', label: 'mm⁴', factor: 1e-12 },
      { id: 'cm4', label: 'cm⁴', factor: 1e-8 },
      { id: 'm4', label: 'm⁴', factor: 1 },
    ],
  },
  {
    id: 'moment',
    name: 'Moment / torque',
    base: 'N·m',
    tip: '1 kN·m = 10⁶ N·mm. Use N·mm with mm and MPa to keep σ = My/I consistent.',
    units: [
      { id: 'Nmm', label: 'N·mm', factor: 1e-3 },
      { id: 'Nm', label: 'N·m', factor: 1 },
      { id: 'kNm', label: 'kN·m', factor: 1e3 },
    ],
  },
  {
    id: 'energy',
    name: 'Energy / work',
    base: 'J',
    tip: '1 kW·h = 3.6 MJ (1000 W for 3600 s).',
    units: [
      { id: 'J', label: 'J', factor: 1 },
      { id: 'kJ', label: 'kJ', factor: 1e3 },
      { id: 'MJ', label: 'MJ', factor: 1e6 },
      { id: 'Wh', label: 'W·h', factor: 3600 },
      { id: 'kWh', label: 'kW·h', factor: 3.6e6 },
    ],
  },
  {
    id: 'power',
    name: 'Power',
    base: 'W',
    tip: 'Power is the RATE of doing work: 1 W = 1 J/s.',
    units: [
      { id: 'W', label: 'W', factor: 1 },
      { id: 'kW', label: 'kW', factor: 1e3 },
      { id: 'MW', label: 'MW', factor: 1e6 },
    ],
  },
  {
    id: 'mass',
    name: 'Mass',
    base: 'kg',
    tip: 'Mass (kg) is not weight (N).',
    units: [
      { id: 'g', label: 'g', factor: 1e-3 },
      { id: 'kg', label: 'kg', factor: 1 },
      { id: 't', label: 'tonne', factor: 1e3 },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    base: 'm/s',
    tip: 'Divide km/h by 3.6 to get m/s.',
    units: [
      { id: 'ms', label: 'm/s', factor: 1 },
      { id: 'kmh', label: 'km/h', factor: 1 / 3.6 },
      { id: 'kn', label: 'knot', factor: 1852 / 3600 },
    ],
  },
  {
    id: 'angle',
    name: 'Angle',
    base: 'rad',
    tip: 'Calculators must be in DEGREE mode for most HSC trigonometry.',
    units: [
      { id: 'deg', label: 'degree', factor: Math.PI / 180 },
      { id: 'rad', label: 'radian', factor: 1 },
    ],
  },
  {
    id: 'density',
    name: 'Density',
    base: 'kg/m³',
    tip: '1 g/cm³ = 1000 kg/m³.',
    units: [
      { id: 'kgm3', label: 'kg/m³', factor: 1 },
      { id: 'gcm3', label: 'g/cm³', factor: 1000 },
    ],
  },
  {
    id: 'frequency',
    name: 'Frequency',
    base: 'Hz',
    tip: 'Hz = cycles per second.',
    units: [
      { id: 'Hz', label: 'Hz', factor: 1 },
      { id: 'kHz', label: 'kHz', factor: 1e3 },
      { id: 'MHz', label: 'MHz', factor: 1e6 },
      { id: 'GHz', label: 'GHz', factor: 1e9 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    base: 'K',
    tip: 'K = °C + 273.15. A temperature DIFFERENCE of 1 °C equals 1 K.',
    units: [
      { id: 'C', label: '°C', factor: 1, offset: 273.15 },
      { id: 'K', label: 'K', factor: 1 },
    ],
  },
];

export function getQuantity(id: string): Quantity {
  const q = QUANTITIES.find((q) => q.id === id);
  if (!q) throw new Error(`Unknown quantity ${id}`);
  return q;
}

export function convert(value: number, quantityId: string, from: string, to: string): number {
  const q = getQuantity(quantityId);
  const f = q.units.find((u) => u.id === from);
  const t = q.units.find((u) => u.id === to);
  if (!f || !t) throw new Error('Unknown unit');
  const base = value * f.factor + (f.offset ?? 0);
  return (base - (t.offset ?? 0)) / t.factor;
}
