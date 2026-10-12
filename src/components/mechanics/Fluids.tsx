import { useState } from 'react';
import { hydrostatic, dynamicPressure, pitotSpeed, hydraulicPress, P_SEA_LEVEL } from '@/lib/calc/fluids';
import { sig, parseNum } from '@/lib/calc/format';
import { Arrow, Label, COL } from '../diagrams/svg';
import { Card, Slider, Stat, M, Tabs, Callout, Select, NumField, ErrorList } from '../ui';

const FLUIDS = [
  { id: 'water', name: 'Fresh water', rho: 1000 },
  { id: 'sea', name: 'Seawater', rho: 1025 },
  { id: 'oil', name: 'Mineral hydraulic oil (typical)', rho: 870 },
  { id: 'fuel', name: 'Jet fuel (typical)', rho: 800 },
  { id: 'mercury', name: 'Mercury', rho: 13534 },
];

export function FluidPressure({ initial = 'hydrostatic' }: { initial?: 'hydrostatic' | 'dynamic' | 'pascal' }) {
  const [tab, setTab] = useState(initial);
  return (
    <Card title="Fluid pressure calculator" subtitle="Hydrostatic p = ρgh, dynamic q = ½ρv², Pascal’s principle F₂ = F₁A₂/A₁">
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { id: 'hydrostatic', label: 'Hydrostatic' },
          { id: 'dynamic', label: 'Dynamic / pitot' },
          { id: 'pascal', label: 'Hydraulic press (Pascal)' },
        ]}
      />
      {tab === 'hydrostatic' && <Hydrostatic />}
      {tab === 'dynamic' && <Dynamic />}
      {tab === 'pascal' && <Pascal />}
    </Card>
  );
}

function Hydrostatic() {
  const [fluid, setFluid] = useState('water');
  const [h, setH] = useState(6);
  const rho = FLUIDS.find((f) => f.id === fluid)!.rho;
  const p = hydrostatic(rho, h);
  const W = 520;
  const H = 300;
  const depthMax = 20;
  const tankTop = 40;
  const tankH = 220;
  const Y = (d: number) => tankTop + (d / depthMax) * tankH;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Tank showing pressure increasing with depth">
        <rect x={60} y={tankTop} width={200} height={tankH} fill="#0ea5e9" opacity={0.18} stroke={COL.ink} strokeWidth={2} />
        <line x1={60} x2={260} y1={tankTop} y2={tankTop} stroke="#0284c7" strokeWidth={2} />
        <text x={160} y={tankTop - 8} textAnchor="middle" fontSize={11} fill={COL.muted}>free surface (gauge p = 0)</text>
        {/* Pressure distribution triangle on the wall */}
        <polygon points={`${260},${tankTop} ${260},${tankTop + tankH} ${260 + 160},${tankTop + tankH}`} fill="#8b5cf6" opacity={0.12} />
        {[0.2, 0.4, 0.6, 0.8, 1].map((f) => (
          <Arrow key={f} x1={262} y1={tankTop + tankH * f} x2={262 + 160 * f} y2={tankTop + tankH * f} color="#8b5cf6" w={1.5} head={6} />
        ))}
        <text x={350} y={tankTop + 30} fontSize={11} fill="#7c3aed">water pushes on wall ∝ depth</text>
        <line x1={50} x2={270} y1={Y(h)} y2={Y(h)} stroke={COL.load} strokeDasharray="5 4" />
        <circle cx={160} cy={Y(h)} r={6} fill={COL.load} />
        <Label x={168} y={Y(h) - 8} anchor="start" color={COL.load} weight={700} bg>
          h = {h} m: p = {sig(p / 1000, 4)} kPa
        </Label>
        {[0, 5, 10, 15, 20].map((d) => (
          <text key={d} x={52} y={Y(d) + 4} fontSize={10} textAnchor="end" fill={COL.muted}>
            {d} m
          </text>
        ))}
      </svg>
      <div className="space-y-3">
        <Select label="Fluid" value={fluid} onChange={setFluid} options={FLUIDS.map((f) => ({ value: f.id, label: `${f.name} (ρ ≈ ${f.rho} kg/m³)` }))} />
        <Slider label="Depth h" value={h} min={0} max={depthMax} step={0.5} unit="m" onChange={setH} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Gauge pressure" value={sig(p / 1000, 4)} unit="kPa" tone="blue" />
          <Stat label="Absolute pressure" value={sig((p + P_SEA_LEVEL) / 1000, 4)} unit="kPa" sub="+101.3 kPa atmospheric" />
        </div>
        <M block>{`p = \\rho g h = ${rho} \\times 9.81 \\times ${h} = ${sig(p, 5)}\\ \\text{Pa}`}</M>
        <Callout kind="assume">Fluid at rest, incompressible, uniform density. Pressure acts equally in all directions and depends only on depth — not on the tank’s shape.</Callout>
      </div>
    </div>
  );
}

function Dynamic() {
  const [v, setV] = useState(60);
  const [rho, setRho] = useState(1.225);
  const q = dynamicPressure(rho, v);
  const back = pitotSpeed(q, rho);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <svg viewBox="0 0 520 240" className="diagram" role="img" aria-label="Pitot-static tube">
        {[50, 80, 110, 140, 170].map((y) => (
          <Arrow key={y} x1={20} y1={y} x2={110} y2={y} color="#0ea5e9" w={1.2} head={6} />
        ))}
        <rect x={140} y={100} width={260} height={20} rx={10} fill={COL.muted} opacity={0.3} stroke={COL.ink} />
        <circle cx={142} cy={110} r={4} fill={COL.load} />
        <text x={150} y={92} fontSize={11} fill={COL.load}>pitot hole: total pressure p₀</text>
        {[250, 290].map((x) => (
          <g key={x}>
            <rect x={x} y={98} width={6} height={4} fill={COL.reaction} />
            <rect x={x} y={118} width={6} height={4} fill={COL.reaction} />
          </g>
        ))}
        <text x={240} y={150} fontSize={11} fill={COL.reaction}>static ports: static pressure p</text>
        <rect x={420} y={60} width={70} height={100} rx={8} fill="none" stroke={COL.ink} />
        <text x={455} y={80} fontSize={10} textAnchor="middle" fill={COL.ink}>ASI</text>
        <text x={455} y={115} fontSize={16} fontWeight={700} textAnchor="middle" fill={COL.ink}>{sig(back * 1.94384, 3)}</text>
        <text x={455} y={132} fontSize={10} textAnchor="middle" fill={COL.muted}>knots</text>
        <text x={20} y={220} fontSize={11} fill={COL.muted}>q = p₀ − p = ½ρv² → the airspeed indicator converts this pressure difference to speed</text>
      </svg>
      <div className="space-y-3">
        <Slider label="Airspeed v" value={v} min={0} max={250} step={1} unit="m/s" onChange={setV} />
        <Slider label="Air density ρ" value={rho} min={0.3} max={1.3} step={0.005} unit="kg/m³" onChange={setRho} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Dynamic pressure q" value={sig(q, 4)} unit="Pa" tone="blue" />
          <Stat label="Speed" value={sig(v * 3.6, 4)} unit="km/h" />
        </div>
        <M block>{`q = \\tfrac12\\rho v^2 = \\tfrac12(${rho})(${v})^2 = ${sig(q, 4)}\\ \\text{Pa}`}</M>
        <Callout kind="assume">Incompressible flow (reasonable below about Mach 0.3, ≈ 100 m/s at sea level). At higher speeds compressibility corrections are needed. Sea-level ISA density = 1.225 kg/m³.</Callout>
      </div>
    </div>
  );
}

function Pascal() {
  const [F1, setF1] = useState('200');
  const [d1, setD1] = useState('20');
  const [d2, setD2] = useState('60');
  const [s1, setS1] = useState('90');
  const n = { F1: parseNum(F1), d1: parseNum(d1), d2: parseNum(d2), s1: parseNum(s1) };
  const errors: string[] = [];
  if (!n.F1 || n.F1 <= 0) errors.push('Input force must be positive.');
  if (!n.d1 || n.d1 <= 0 || !n.d2 || n.d2 <= 0) errors.push('Piston diameters must be positive.');
  if (n.s1 === null || n.s1 < 0) errors.push('Input stroke must be zero or positive.');
  const A1 = n.d1 ? (Math.PI * n.d1 * n.d1) / 4 : 0;
  const A2 = n.d2 ? (Math.PI * n.d2 * n.d2) / 4 : 0;
  const r = !errors.length ? hydraulicPress(n.F1!, A1, A2, n.s1!) : null;
  const w1 = Math.max(16, Math.min(90, (n.d1 ?? 20) * 1.4));
  const w2 = Math.max(16, Math.min(170, (n.d2 ?? 60) * 1.4));
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <svg viewBox="0 0 520 260" className="diagram" role="img" aria-label="Hydraulic press">
        <path d={`M ${100 - w1 / 2} 60 L ${100 - w1 / 2} 200 L ${360 - w2 / 2} 200 L ${360 - w2 / 2} 90 M ${360 + w2 / 2} 90 L ${360 + w2 / 2} 220 L ${100 + w1 / 2} 220 L ${100 + w1 / 2} 60`} fill="none" stroke={COL.ink} strokeWidth={2} />
        <rect x={100 - w1 / 2} y={100} width={w1} height={100} fill="#f59e0b" opacity={0.25} />
        <rect x={100 - w1 / 2} y={200} width={360 + w2 / 2 - (100 - w1 / 2)} height={20} fill="#f59e0b" opacity={0.25} />
        <rect x={360 - w2 / 2} y={110} width={w2} height={90} fill="#f59e0b" opacity={0.25} />
        <rect x={100 - w1 / 2} y={92} width={w1} height={8} fill={COL.ink} />
        <rect x={360 - w2 / 2} y={102} width={w2} height={8} fill={COL.ink} />
        <Arrow x1={100} y1={30} x2={100} y2={90} color={COL.load} w={2.6} />
        <Label x={100} y={24} color={COL.load} weight={700} bg>F₁ = {n.F1 ?? '—'} N</Label>
        <Arrow x1={360} y1={100} x2={360} y2={40} color={COL.reaction} w={3.2} />
        <Label x={360} y={32} color={COL.reaction} weight={700} bg>F₂ = {r ? sig(r.F2, 4) : '—'} N</Label>
        <text x={230} y={245} textAnchor="middle" fontSize={11} fill={COL.muted}>Same pressure everywhere in the confined fluid: p = F₁/A₁ = F₂/A₂</text>
      </svg>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Input force F₁" value={F1} onChange={setF1} unit="N" min={0} allowZero={false} />
          <NumField label="Input stroke" value={s1} onChange={setS1} unit="mm" min={0} />
          <NumField label="Input piston d₁" value={d1} onChange={setD1} unit="mm" min={0} allowZero={false} />
          <NumField label="Output piston d₂" value={d2} onChange={setD2} unit="mm" min={0} allowZero={false} />
        </div>
        {errors.length ? (
          <ErrorList errors={errors} />
        ) : (
          r && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Pressure" value={sig(r.p, 4)} unit="MPa" tone="blue" />
                <Stat label="Output force" value={sig(r.F2, 4)} unit="N" tone="emerald" />
                <Stat label="Force ratio A₂/A₁" value={sig(r.MA, 4)} />
                <Stat label="Output stroke" value={sig(r.d2!, 4)} unit="mm" sub="volume conserved" />
              </div>
              <M block>{`p = \\dfrac{F_1}{A_1} = \\dfrac{${n.F1}}{${sig(A1, 5)}} = ${sig(r.p, 4)}\\ \\text{MPa}`}</M>
              <M block>{`F_2 = pA_2 = ${sig(r.p, 4)} \\times ${sig(A2, 5)} = ${sig(r.F2, 4)}\\ \\text{N}`}</M>
              <p className="text-xs text-ink-500">Work in = {sig((n.F1! * n.s1!) / 1000, 4)} J; work out = {sig((r.F2 * r.d2!) / 1000, 4)} J — equal for an ideal system. Force is multiplied, not energy.</p>
            </>
          )
        )}
      </div>
    </div>
  );
}
