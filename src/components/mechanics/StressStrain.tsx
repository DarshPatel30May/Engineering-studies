import { useMemo, useState } from 'react';
import { sig, fixed, parseNum } from '@/lib/calc/format';
import { areaCircle, areaTube } from '@/lib/calc/mechanics';
import { Card, Callout, Slider, Tabs, Toggle, Stat, NumField, ErrorList, M, Select, Badge } from '../ui';
import { COL, Arrow, Label } from '../diagrams/svg';

/**
 * Illustrative engineering stress–strain curves. Shapes and key values are representative of the
 * named material/condition; they are NOT test data for design.
 */
interface Curve {
  id: string;
  name: string;
  E: number; // MPa
  fracture: number; // strain
  uts: number; // strain at UTS
  sigma: (e: number) => number;
  yieldKind: 'distinct' | 'proof' | 'none';
  note: string;
}

const CURVES: Curve[] = [
  {
    id: 'mild',
    name: 'Mild steel (≈ Grade 250, illustrative)',
    E: 200000,
    fracture: 0.3,
    uts: 0.2,
    yieldKind: 'distinct',
    note: 'Distinct upper and lower yield points, a yield plateau (Lüders band), strain hardening to the UTS, then necking.',
    sigma: (e) => {
      if (e <= 0.00125) return 200000 * e;
      if (e <= 0.0014) return 250 + ((e - 0.00125) / 0.00015) * 15; // upper yield
      if (e <= 0.0018) return 265 - ((e - 0.0014) / 0.0004) * 15; // drop to lower yield
      if (e <= 0.02) return 250;
      if (e <= 0.2) {
        const t = (e - 0.02) / 0.18;
        return 250 + 160 * (1 - (1 - t) ** 2);
      }
      const t = (e - 0.2) / 0.1;
      return 410 - 110 * t * t;
    },
  },
  {
    id: 'al',
    name: 'Aluminium alloy 6061-T6 (illustrative)',
    E: 69000,
    fracture: 0.12,
    uts: 0.08,
    yieldKind: 'proof',
    note: 'No distinct yield point — a gradual knee. The 0.2% proof stress is found with the offset construction.',
    sigma: (e) => {
      const ep = 240 / 69000;
      if (e <= ep) return 69000 * e;
      if (e <= 0.08) return 240 + 62 * (1 - Math.exp(-(e - ep) / 0.004)) + 100 * (e - ep);
      const top = 240 + 62 * (1 - Math.exp(-(0.08 - ep) / 0.004)) + 100 * (0.08 - ep);
      const t = (e - 0.08) / 0.04;
      return top - 35 * t * t;
    },
  },
  {
    id: 'hss',
    name: 'Quenched & tempered high-strength steel (illustrative)',
    E: 200000,
    fracture: 0.15,
    uts: 0.07,
    yieldKind: 'proof',
    note: 'Much higher strength but lower ductility than mild steel; no yield plateau.',
    sigma: (e) => {
      const ep = 620 / 200000;
      if (e <= ep) return 200000 * e;
      if (e <= 0.07) return 620 + 120 * (1 - Math.exp(-(e - ep) / 0.006)) + 300 * (e - ep);
      const top = 620 + 120 * (1 - Math.exp(-(0.07 - ep) / 0.006)) + 300 * (0.07 - ep);
      const t = (e - 0.07) / 0.08;
      return top - 120 * t * t;
    },
  },
  {
    id: 'ci',
    name: 'Grey cast iron (brittle, illustrative)',
    E: 88000,
    fracture: 0.006,
    uts: 0.006,
    yieldKind: 'none',
    note: 'Brittle: fractures at very low strain with no necking. Non-linear from the start (graphite flakes). Toughness (area) is tiny.',
    sigma: (e) => 220 * (1 - Math.exp(-e / 0.0025)),
  },
];

function proofStress(c: Curve) {
  // Intersection of σ(ε) with the 0.2% offset line σ = E(ε − 0.002)
  let lo = 0.002;
  let hi = c.uts;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (c.sigma(mid) - c.E * (mid - 0.002) > 0) lo = mid;
    else hi = mid;
  }
  return { e: lo, s: c.sigma(lo) };
}

function toughness(c: Curve, upTo: number) {
  const n = 600;
  let a = 0;
  for (let i = 0; i < n; i++) {
    const e0 = (upTo * i) / n;
    const e1 = (upTo * (i + 1)) / n;
    a += ((c.sigma(e0) + c.sigma(e1)) / 2) * (e1 - e0);
  }
  return a; // MPa = MJ/m³
}

export function StressStrainExplorer() {
  const [id, setId] = useState('mild');
  const c = CURVES.find((x) => x.id === id)!;
  const [frac, setFrac] = useState(0.25);
  const [zoom, setZoom] = useState(false);
  const [showTrue, setShowTrue] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const xMax = zoom ? Math.min(c.fracture, c.id === 'ci' ? 0.006 : 0.01) : c.fracture * 1.05;
  const e = Math.min(c.fracture, frac * xMax);
  const s = c.sigma(e);
  const maxS = Math.max(...Array.from({ length: 200 }, (_, i) => c.sigma((c.fracture * i) / 199)));
  const proof = c.yieldKind === 'proof' ? proofStress(c) : null;
  const yieldS = c.yieldKind === 'distinct' ? 250 : proof?.s;
  const utsS = c.sigma(c.uts);
  const W = 640;
  const H = 360;
  const pad = { l: 60, r: 20, t: 20, b: 46 };
  const yTop = Math.max(maxS, showTrue ? utsS * (1 + c.uts) : 0) * 1.12;
  const X = (x: number) => pad.l + (x / xMax) * (W - pad.l - pad.r);
  const Y = (y: number) => H - pad.b - (y / yTop) * (H - pad.t - pad.b);
  const N = 300;
  const pts = Array.from({ length: N + 1 }, (_, i) => (Math.min(c.fracture, xMax) * i) / N);
  const path = pts.map((x, i) => `${i ? 'L' : 'M'}${X(x)},${Y(c.sigma(x))}`).join(' ');
  const truePts = pts.filter((x) => x <= c.uts);
  const truePath = truePts.map((x, i) => `${i ? 'L' : 'M'}${X(x)},${Y(c.sigma(x) * (1 + x))}`).join(' ');
  const areaPts = pts.filter((x) => x <= e);
  const areaPath = areaPts.length > 1 ? `M${X(0)},${Y(0)} ` + areaPts.map((x) => `L${X(x)},${Y(c.sigma(x))}`).join(' ') + ` L${X(e)},${Y(0)} Z` : '';
  const elasticLimit = c.yieldKind === 'distinct' ? 0.00125 : c.yieldKind === 'proof' ? (proof!.s * 0.85) / c.E : 0;

  const region = useMemo(() => {
    if (c.yieldKind === 'none') return { name: e >= c.fracture - 1e-9 ? 'Fracture' : 'Non-linear elastic/brittle region', tone: 'amber' };
    if (e <= elasticLimit) return { name: 'Elastic region — Hooke’s law (σ = Eε); fully recoverable', tone: 'emerald' };
    if (c.yieldKind === 'distinct' && e <= 0.02) return { name: 'Yielding — plastic deformation begins (yield plateau)', tone: 'amber' };
    if (e < c.uts) return { name: 'Plastic region — strain (work) hardening; permanent set', tone: 'amber' };
    if (e < c.fracture - 1e-9) return { name: 'Necking — localised thinning; engineering stress falls', tone: 'red' };
    return { name: 'Fracture', tone: 'red' };
  }, [e, c, elasticLimit]);

  const ticksX = Array.from({ length: 6 }, (_, i) => (xMax * i) / 5);
  const stepY = yTop > 600 ? 200 : yTop > 300 ? 100 : 50;
  const ticksY = Array.from({ length: Math.floor(yTop / stepY) + 1 }, (_, i) => i * stepY);

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      <Card title="Explore the curve" subtitle="Drag the strain slider to load the specimen">
        <div className="space-y-3">
          <Select label="Material" value={id} onChange={(v) => (setId(v), setFrac(0.25))} options={CURVES.map((x) => ({ value: x.id, label: x.name }))} />
          <Slider label="Applied strain" value={frac} min={0} max={1} step={0.002} onChange={setFrac} format={() => `${fixed(e * 100, 3)}%`} />
          <Toggle checked={zoom} onChange={setZoom} label="Zoom into elastic region" />
          <Toggle checked={showTrue} onChange={setShowTrue} label="Show true stress (to UTS)" />
          <Toggle checked={showArea} onChange={setShowArea} label="Shade energy absorbed (toughness)" />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Strain ε" value={fixed(e * 100, 3)} unit="%" />
            <Stat label="Eng. stress σ" value={sig(s, 4)} unit="MPa" />
            <Stat label="E (slope)" value={sig(c.E / 1000, 3)} unit="GPa" />
            <Stat label={c.yieldKind === 'proof' ? '0.2% proof' : c.yieldKind === 'distinct' ? 'Lower yield' : 'Yield'} value={yieldS ? sig(yieldS, 3) : '—'} unit={yieldS ? 'MPa' : ''} />
            <Stat label="UTS" value={sig(utsS, 3)} unit="MPa" />
            <Stat label="Energy to ε" value={sig(toughness(c, e), 3)} unit="MJ/m³" />
          </div>
          <Badge tone={region.tone}>{region.name}</Badge>
          <p className="prose-only text-xs text-ink-500">{c.note}</p>
        </div>
      </Card>
      <Card title="Engineering stress–strain diagram" subtitle="Illustrative curves showing characteristic behaviour — not design data">
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Stress–strain curve">
          {ticksY.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={Y(t)} y2={Y(t)} stroke={COL.muted} strokeOpacity={0.18} />
              <text x={pad.l - 6} y={Y(t) + 4} fontSize={10} textAnchor="end" fill={COL.muted}>
                {t}
              </text>
            </g>
          ))}
          {ticksX.map((t) => (
            <text key={t} x={X(t)} y={H - pad.b + 16} fontSize={10} textAnchor="middle" fill={COL.muted}>
              {fixed(t * 100, zoom ? 2 : 1)}
            </text>
          ))}
          <line x1={pad.l} x2={pad.l} y1={pad.t} y2={H - pad.b} stroke={COL.ink} />
          <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke={COL.ink} />
          <text x={(W + pad.l) / 2} y={H - 8} fontSize={11.5} textAnchor="middle" fill={COL.ink}>
            Engineering strain ε (%)
          </text>
          <text x={14} y={H / 2} fontSize={11.5} textAnchor="middle" fill={COL.ink} transform={`rotate(-90 14 ${H / 2})`}>
            Stress σ (MPa)
          </text>
          {showArea && areaPath && <path d={areaPath} fill="#10b981" opacity={0.18} />}
          <path d={path} fill="none" stroke="#0ea5e9" strokeWidth={2.6} />
          {showTrue && <path d={truePath} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6 4" />}
          {proof && proof.e <= xMax && (
            <g>
              <line x1={X(0.002)} y1={Y(0)} x2={X(Math.min(xMax, proof.e + 0.002))} y2={Y(c.E * (Math.min(xMax, proof.e + 0.002) - 0.002))} stroke={COL.load} strokeDasharray="4 3" strokeWidth={1.5} />
              <circle cx={X(proof.e)} cy={Y(proof.s)} r={4} fill={COL.load} />
              <Label x={X(proof.e) + 8} y={Y(proof.s) + 16} anchor="start" size={10.5} color={COL.load} bg>
                0.2% proof ≈ {sig(proof.s, 3)} MPa
              </Label>
            </g>
          )}
          {c.uts <= xMax && c.yieldKind !== 'none' && (
            <g>
              <circle cx={X(c.uts)} cy={Y(utsS)} r={4} fill="#dc2626" />
              <Label x={X(c.uts)} y={Y(utsS) - 10} size={10.5} color="#dc2626" bg>
                UTS
              </Label>
            </g>
          )}
          {c.fracture <= xMax && (
            <g>
              <text x={X(c.fracture)} y={Y(c.sigma(c.fracture)) + 4} fontSize={14} textAnchor="middle" fill="#dc2626">
                ✕
              </text>
              <Label x={X(c.fracture) - 6} y={Y(c.sigma(c.fracture)) + 20} anchor="end" size={10.5} color="#dc2626" bg>
                fracture
              </Label>
            </g>
          )}
          {c.yieldKind === 'distinct' && 0.0014 <= xMax && (
            <Label x={X(0.0014) + 8} y={Y(270)} anchor="start" size={10.5} color={COL.load} bg>
              upper / lower yield
            </Label>
          )}
          <circle cx={X(e)} cy={Y(s)} r={6} fill="#10b981" stroke="white" strokeWidth={2} />
          {showTrue && <Label x={W - pad.r - 6} y={pad.t + 14} anchor="end" size={10.5} color="#8b5cf6">dashed: true stress σ(1+ε)</Label>}
        </svg>
        <Specimen strain={e} curve={c} />
      </Card>
    </div>
  );
}

/** Tensile specimen that stretches and necks as strain increases. */
function Specimen({ strain, curve }: { strain: number; curve: Curve }) {
  const W = 640;
  const L0 = 300;
  const stretch = Math.min(curve.fracture, strain) / Math.max(curve.fracture, 0.01);
  const L = L0 * (1 + (curve.id === 'ci' ? strain : strain * 0.9));
  const neck = strain > curve.uts && curve.yieldKind !== 'none' ? Math.min(1, (strain - curve.uts) / (curve.fracture - curve.uts)) : 0;
  const broken = strain >= curve.fracture - 1e-9;
  const cx = W / 2;
  const h = 26 * (1 - stretch * 0.08);
  const nh = h * (1 - 0.55 * neck);
  const left = cx - L / 2;
  const right = cx + L / 2;
  const gripH = 44;
  const body = `M${left},${60 - h / 2} L${cx - 30},${60 - h / 2} Q${cx},${60 - nh / 2} ${cx + 30},${60 - h / 2} L${right},${60 - h / 2} L${right},${60 + h / 2} L${cx + 30},${60 + h / 2} Q${cx},${60 + nh / 2} ${cx - 30},${60 + h / 2} L${left},${60 + h / 2} Z`;
  return (
    <svg viewBox={`0 0 ${W} 120`} className="diagram mt-2" aria-label="Tensile test specimen">
      <rect x={left - 60} y={60 - gripH / 2} width={60} height={gripH} rx={4} fill={COL.muted} opacity={0.4} />
      <rect x={right} y={60 - gripH / 2} width={60} height={gripH} rx={4} fill={COL.muted} opacity={0.4} />
      {broken ? (
        <g>
          <path d={body} fill="#94a3b8" opacity={0.25} />
          <line x1={cx} x2={cx} y1={30} y2={90} stroke="#dc2626" strokeWidth={3} />
        </g>
      ) : (
        <path d={body} fill="#0ea5e9" opacity={0.35} stroke="#0284c7" />
      )}
      <Arrow x1={left - 60} y1={60} x2={left - 110} y2={60} color={COL.load} w={2.5} />
      <Arrow x1={right + 60} y1={60} x2={right + 110} y2={60} color={COL.load} w={2.5} />
      <text x={cx} y={112} fontSize={11} textAnchor="middle" fill={COL.muted}>
        {broken ? 'Fractured' : neck > 0 ? 'Necking (cross-section reducing locally)' : 'Uniform elongation'} — gauge length exaggerated for clarity
      </text>
    </svg>
  );
}

// ───────────── Stress & strain calculator (Mechanics Lab E) ─────────────

type LoadCase = 'tension' | 'compression' | 'single' | 'double';
type Section = 'round' | 'tube' | 'rect' | 'area';

export function StressCalculator() {
  const [lc, setLc] = useState<LoadCase>('tension');
  const [sec, setSec] = useState<Section>('round');
  const [F, setF] = useState('50');
  const [d, setD] = useState('20');
  const [D2, setD2] = useState('12');
  const [b, setB] = useState('40');
  const [h, setH] = useState('10');
  const [A, setA] = useState('300');
  const [L, setL] = useState('2000');
  const [E, setE] = useState('200');
  const v = { F: parseNum(F), d: parseNum(d), D2: parseNum(D2), b: parseNum(b), h: parseNum(h), A: parseNum(A), L: parseNum(L), E: parseNum(E) };
  const errors: string[] = [];
  let area: number | null = null;
  if (sec === 'round') area = v.d && v.d > 0 ? areaCircle(v.d) : (errors.push('Diameter must be positive.'), null);
  if (sec === 'tube') {
    if (!v.d || !v.D2 || v.d <= 0 || v.D2 <= 0) errors.push('Diameters must be positive.');
    else if (v.D2 >= v.d) errors.push('Inner diameter must be smaller than outer diameter.');
    else area = areaTube(v.d, v.D2);
  }
  if (sec === 'rect') area = v.b && v.h && v.b > 0 && v.h > 0 ? v.b * v.h : (errors.push('Width and thickness must be positive.'), null);
  if (sec === 'area') area = v.A && v.A > 0 ? v.A : (errors.push('Area must be positive.'), null);
  if (v.F === null) errors.push('Enter a valid force.');
  const shearPlanes = lc === 'double' ? 2 : 1;
  const resisting = area !== null ? area * shearPlanes : null;
  const stress = resisting !== null && v.F !== null ? (Math.abs(v.F) * 1000) / resisting : null;
  const axial = lc === 'tension' || lc === 'compression';
  const strain = axial && stress !== null && v.E && v.E > 0 ? stress / (v.E * 1000) : null;
  const dL = strain !== null && v.L && v.L > 0 ? strain * v.L : null;
  const symbol = axial ? '\\sigma' : '\\tau';
  return (
    <Card title="Stress & strain calculator" subtitle="Units: kN, mm, GPa → results in MPa (N/mm²) and mm">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Tabs
            size="sm"
            value={lc}
            onChange={setLc}
            tabs={[
              { id: 'tension', label: 'Tension' },
              { id: 'compression', label: 'Compression' },
              { id: 'single', label: 'Single shear' },
              { id: 'double', label: 'Double shear' },
            ]}
          />
          <Select
            label="Cross-section"
            value={sec}
            onChange={setSec}
            options={[
              { value: 'round', label: 'Solid round (diameter d)' },
              { value: 'tube', label: 'Round tube (D outer, d inner)' },
              { value: 'rect', label: 'Rectangular bar (b × t)' },
              { value: 'area', label: 'Area given' },
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumField label="Force F" value={F} onChange={setF} unit="kN" />
            {sec === 'round' && <NumField label="Diameter d" value={d} onChange={setD} unit="mm" min={0} allowZero={false} />}
            {sec === 'tube' && (
              <>
                <NumField label="Outer D" value={d} onChange={setD} unit="mm" min={0} allowZero={false} />
                <NumField label="Inner d" value={D2} onChange={setD2} unit="mm" min={0} />
              </>
            )}
            {sec === 'rect' && (
              <>
                <NumField label="Width b" value={b} onChange={setB} unit="mm" min={0} allowZero={false} />
                <NumField label="Thickness t" value={h} onChange={setH} unit="mm" min={0} allowZero={false} />
              </>
            )}
            {sec === 'area' && <NumField label="Area A" value={A} onChange={setA} unit="mm²" min={0} allowZero={false} />}
            {axial && (
              <>
                <NumField label="Length L₀" value={L} onChange={setL} unit="mm" min={0} allowZero={false} />
                <NumField label="Young’s modulus E" value={E} onChange={setE} unit="GPa" min={0} allowZero={false} />
              </>
            )}
          </div>
          {!axial && (
            <Callout kind="info">
              {lc === 'double' ? 'Double shear: the pin is cut at TWO planes, so the resisting area is 2 × the pin cross-section.' : 'Single shear: one plane resists the load (e.g. a lap joint rivet).'} Shear stress is an average value, τ = F/A.
            </Callout>
          )}
        </div>
        <div className="space-y-3">
          <ShearSketch lc={lc} />
          {errors.length ? (
            <ErrorList errors={errors} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Area (per plane)" value={sig(area!, 4)} unit="mm²" />
                <Stat label={axial ? (lc === 'tension' ? 'Tensile stress σ' : 'Compressive stress σ') : 'Shear stress τ'} value={sig(stress!, 4)} unit="MPa" tone="blue" />
                {strain !== null && <Stat label="Strain ε" value={sig(strain, 4)} sub={`${sig(strain * 100, 3)}%`} />}
                {dL !== null && <Stat label={lc === 'tension' ? 'Extension ΔL' : 'Shortening ΔL'} value={sig(dL, 4)} unit="mm" />}
              </div>
              <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-950/50">
                <M block>{`${symbol} = \\dfrac{F}{${shearPlanes === 2 ? '2' : ''}A} = \\dfrac{${sig(Math.abs(v.F!) * 1000, 6)}}{${shearPlanes === 2 ? '2\\times' : ''}${sig(area!, 5)}} = ${sig(stress!, 4)}\\ \\text{MPa}`}</M>
                {strain !== null && <M block>{`\\varepsilon = \\dfrac{\\sigma}{E} = \\dfrac{${sig(stress!, 4)}}{${sig(v.E! * 1000, 6)}} = ${sig(strain, 4)}`}</M>}
                {dL !== null && <M block>{`\\Delta L = \\varepsilon L_0 = ${sig(strain!, 4)} \\times ${sig(v.L!, 5)} = ${sig(dL, 4)}\\ \\text{mm}`}</M>}
              </div>
              {axial && strain !== null && (
                <p className="text-xs text-ink-500">Valid only while the material stays elastic (stress below its limit of proportionality). Compare with the yield stress before trusting ΔL.</p>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function ShearSketch({ lc }: { lc: LoadCase }) {
  return (
    <svg viewBox="0 0 320 110" className="diagram rounded-lg border border-ink-100 dark:border-ink-800" aria-label="Loading case sketch">
      {lc === 'tension' || lc === 'compression' ? (
        <g>
          <rect x={90} y={45} width={140} height={20} fill="#0ea5e9" opacity={0.3} stroke="#0284c7" />
          {lc === 'tension' ? (
            <>
              <Arrow x1={90} y1={55} x2={40} y2={55} color={COL.load} w={2.5} />
              <Arrow x1={230} y1={55} x2={280} y2={55} color={COL.load} w={2.5} />
            </>
          ) : (
            <>
              <Arrow x1={40} y1={55} x2={88} y2={55} color={COL.load} w={2.5} />
              <Arrow x1={280} y1={55} x2={232} y2={55} color={COL.load} w={2.5} />
            </>
          )}
          <text x={160} y={95} fontSize={11} textAnchor="middle" fill={COL.muted}>
            Area ⟂ to the force resists {lc}
          </text>
        </g>
      ) : lc === 'single' ? (
        <g>
          <rect x={60} y={35} width={150} height={16} fill={COL.muted} opacity={0.35} />
          <rect x={110} y={51} width={150} height={16} fill={COL.muted} opacity={0.35} />
          <rect x={152} y={25} width={16} height={52} fill="#0ea5e9" opacity={0.5} />
          <line x1={140} x2={180} y1={51} y2={51} stroke="#dc2626" strokeWidth={2} strokeDasharray="4 3" />
          <Arrow x1={60} y1={43} x2={20} y2={43} color={COL.load} w={2.4} />
          <Arrow x1={260} y1={59} x2={300} y2={59} color={COL.load} w={2.4} />
          <text x={160} y={100} fontSize={11} textAnchor="middle" fill={COL.muted}>
            One shear plane (red)
          </text>
        </g>
      ) : (
        <g>
          <rect x={60} y={25} width={140} height={14} fill={COL.muted} opacity={0.35} />
          <rect x={60} y={67} width={140} height={14} fill={COL.muted} opacity={0.35} />
          <rect x={120} y={46} width={140} height={14} fill={COL.muted} opacity={0.35} />
          <rect x={152} y={18} width={16} height={70} fill="#0ea5e9" opacity={0.5} />
          <line x1={140} x2={180} y1={46} y2={46} stroke="#dc2626" strokeWidth={2} strokeDasharray="4 3" />
          <line x1={140} x2={180} y1={60} y2={60} stroke="#dc2626" strokeWidth={2} strokeDasharray="4 3" />
          <Arrow x1={60} y1={53} x2={20} y2={53} color={COL.load} w={2.4} />
          <Arrow x1={260} y1={53} x2={300} y2={53} color={COL.load} w={2.4} />
          <text x={160} y={104} fontSize={11} textAnchor="middle" fill={COL.muted}>
            Clevis: two shear planes (red)
          </text>
        </g>
      )}
    </svg>
  );
}

// ───────────── Factor of safety calculator ─────────────

const FOS_MATERIALS = [
  { id: 'g250', name: 'Structural steel Grade 250', yield: 250, uts: 410, ductile: true },
  { id: 'g300', name: 'Structural steel Grade 300', yield: 300, uts: 440, ductile: true },
  { id: '6061', name: 'Aluminium 6061-T6', yield: 276, uts: 310, ductile: true },
  { id: '2024', name: 'Aluminium 2024-T3', yield: 345, uts: 483, ductile: true },
  { id: 'ci', name: 'Grey cast iron (tension)', yield: 0, uts: 200, ductile: false },
  { id: 'custom', name: 'Custom values', yield: 300, uts: 450, ductile: true },
];

export function FoSCalculator() {
  const [mode, setMode] = useState<'fos' | 'working' | 'area'>('fos');
  const [mat, setMat] = useState('g250');
  const m = FOS_MATERIALS.find((x) => x.id === mat)!;
  const [basis, setBasis] = useState<'yield' | 'uts'>('yield');
  const [limitRaw, setLimitRaw] = useState('');
  const [F, setF] = useState('40');
  const [A, setA] = useState('400');
  const [n, setN] = useState('2');
  const effBasis = m.ductile ? basis : 'uts';
  const limit = mat === 'custom' ? parseNum(limitRaw || '300') : effBasis === 'yield' ? m.yield : m.uts;
  const Fv = parseNum(F);
  const Av = parseNum(A);
  const nv = parseNum(n);
  const errors: string[] = [];
  if (!limit || limit <= 0) errors.push('Limiting stress must be positive.');
  let out: { label: string; value: string; unit: string; latex: string; ok: boolean } | null = null;
  if (!errors.length) {
    if (mode === 'fos') {
      if (!Fv || Fv <= 0 || !Av || Av <= 0) errors.push('Load and area must be positive.');
      else {
        const w = (Fv * 1000) / Av;
        const fos = limit! / w;
        out = { label: 'Factor of safety', value: sig(fos, 3), unit: '', latex: `\\sigma_w = \\dfrac{${sig(Fv * 1000, 6)}}{${sig(Av, 5)}} = ${sig(w, 4)}\\ \\text{MPa},\\quad \\text{FoS} = \\dfrac{${sig(limit!, 4)}}{${sig(w, 4)}} = ${sig(fos, 3)}`, ok: fos >= 1 };
      }
    } else if (mode === 'working') {
      if (!nv || nv <= 0) errors.push('Factor of safety must be positive.');
      else out = { label: 'Allowable working stress', value: sig(limit! / nv, 4), unit: 'MPa', latex: `\\sigma_w = \\dfrac{\\sigma_{\\text{limit}}}{\\text{FoS}} = \\dfrac{${sig(limit!, 4)}}{${sig(nv, 3)}} = ${sig(limit! / nv, 4)}\\ \\text{MPa}`, ok: nv >= 1 };
    } else {
      if (!Fv || Fv <= 0 || !nv || nv <= 0) errors.push('Load and factor of safety must be positive.');
      else {
        const w = limit! / nv;
        const Areq = (Fv * 1000) / w;
        const dReq = Math.sqrt((4 * Areq) / Math.PI);
        out = { label: 'Minimum area', value: sig(Areq, 4), unit: 'mm²', latex: `\\sigma_w = ${sig(w, 4)}\\ \\text{MPa},\\ A = \\dfrac{${sig(Fv * 1000, 6)}}{${sig(w, 4)}} = ${sig(Areq, 4)}\\ \\text{mm}^2 \\;(d_{\\min} = ${sig(dReq, 4)}\\ \\text{mm})`, ok: nv >= 1 };
      }
    }
  }
  return (
    <Card title="Factor of safety calculator" subtitle="FoS = limiting stress ÷ working stress">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Tabs
            size="sm"
            value={mode}
            onChange={setMode}
            tabs={[
              { id: 'fos', label: 'Find FoS' },
              { id: 'working', label: 'Find working stress' },
              { id: 'area', label: 'Find required area' },
            ]}
          />
          <Select label="Material" value={mat} onChange={setMat} options={FOS_MATERIALS.map((x) => ({ value: x.id, label: x.name }))} />
          {m.ductile ? (
            <Tabs
              size="sm"
              value={basis}
              onChange={setBasis}
              tabs={[
                { id: 'yield', label: 'Based on yield / proof stress' },
                { id: 'uts', label: 'Based on UTS' },
              ]}
            />
          ) : (
            <Callout kind="warn">Brittle material: no yield point, so the factor of safety must be based on the ultimate tensile strength.</Callout>
          )}
          {mat === 'custom' && <NumField label="Limiting stress" value={limitRaw || '300'} onChange={setLimitRaw} unit="MPa" min={0} allowZero={false} />}
          <div className="grid grid-cols-2 gap-2">
            {mode !== 'working' && <NumField label="Load F" value={F} onChange={setF} unit="kN" min={0} allowZero={false} />}
            {mode === 'fos' && <NumField label="Area A" value={A} onChange={setA} unit="mm²" min={0} allowZero={false} />}
            {mode !== 'fos' && <NumField label="Factor of safety" value={n} onChange={setN} min={0} allowZero={false} />}
          </div>
          <p className="text-xs text-ink-500">
            Limiting stress used: <strong>{limit ? sig(limit, 4) : '—'} MPa</strong> ({effBasis === 'yield' ? 'yield/0.2% proof' : 'UTS'}). Typical minimum values for the named grade; always state which limit you used.
          </p>
        </div>
        <div className="space-y-3">
          {errors.length ? (
            <ErrorList errors={errors} />
          ) : (
            out && (
              <>
                <Stat label={out.label} value={out.value} unit={out.unit} tone={out.ok ? 'emerald' : 'red'} sub={out.ok ? undefined : 'FoS below 1 — the part would fail'} />
                <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-950/50">
                  <M block>{out.latex}</M>
                </div>
              </>
            )
          )}
          <Callout kind="tip" title="Why a factor of safety?">
            It covers uncertainty in loads, material variability, manufacturing defects, corrosion and wear, and the consequence of failure. Higher FoS for brittle materials, fatigue loading or where failure endangers life.
          </Callout>
        </div>
      </div>
    </Card>
  );
}
