import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { sig, fixed, parseNum } from '@/lib/calc/format';
import { solveCircuit } from '@/lib/calc/electric';
import { g } from '@/lib/calc/transport';
import { Arrow, Label, COL } from '../diagrams/svg';
import { Card, Slider, Stat, M, Tabs, Callout, Badge, NumField, ErrorList, KeyPoints, Toggle, cx } from '../ui';
import { Microstructure } from '../materials/Microstructure';

// ───────────────────────── Heat treatment ─────────────────────────
type HT = 'anneal' | 'normalise' | 'harden' | 'temper';
const HT_INFO: Record<HT, { name: string; heat: string; cool: string; micro: 'pearlite' | 'grain' | 'precipitate'; microName: string; props: { hard: number; duct: number; tough: number }; use: string }> = {
  anneal: { name: 'Full annealing', heat: '≈ 30–50 °C above A₃ (hypo-eutectoid)', cool: 'Very slow — inside the switched-off furnace', micro: 'pearlite', microName: 'Coarse pearlite + ferrite, stress-free, large grains', props: { hard: 1, duct: 5, tough: 3 }, use: 'Soften for heavy cold forming or machining; relieve internal stresses.' },
  normalise: { name: 'Normalising', heat: '≈ 30–50 °C above A₃ (above A_cm for hyper-eutectoid)', cool: 'In still air', micro: 'grain', microName: 'Fine pearlite + ferrite, refined uniform grains', props: { hard: 2, duct: 4, tough: 4 }, use: 'Refine coarse grains after forging or rolling; more uniform, slightly stronger than annealed.' },
  harden: { name: 'Hardening (quenching)', heat: '≈ 30–50 °C above A₃ (above A₁ for hyper-eutectoid)', cool: 'Rapid — quench in water, brine or oil', micro: 'precipitate', microName: 'Martensite (needle-like, carbon trapped in a distorted lattice)', props: { hard: 5, duct: 1, tough: 1 }, use: 'Maximum hardness and wear resistance for medium/high-carbon steel parts — always followed by tempering.' },
  temper: { name: 'Tempering', heat: 'Reheat to ≈ 150–650 °C — BELOW A₁ (727 °C)', cool: 'Usually in air', micro: 'precipitate', microName: 'Tempered martensite (fine carbides in ferrite)', props: { hard: 3.5, duct: 2.5, tough: 4 }, use: 'Reduce brittleness and internal stress after hardening; higher temperature → tougher, softer.' },
};

export function HeatTreatment() {
  const [ht, setHt] = useState<HT>('normalise');
  const [C, setC] = useState(0.45);
  const info = HT_INFO[ht];
  // Simplified Fe–Fe₃C phase-diagram lines
  const A1 = 727;
  const A3 = (c: number) => 912 - (912 - 727) * (c / 0.76);
  const Acm = (c: number) => 727 + ((1148 - 727) / (2.11 - 0.76)) * (c - 0.76);
  const crit = C <= 0.76 ? A3(C) : ht === 'normalise' ? Acm(C) : A1;
  const lo = ht === 'temper' ? 150 : crit + 30;
  const hi = ht === 'temper' ? 650 : crit + 50;
  const W = 520;
  const H = 300;
  const X = (c: number) => 50 + (c / 1.4) * (W - 70);
  const Y = (t: number) => H - 30 - ((t - 100) / 1000) * (H - 50);
  const cur = (ht === 'temper' ? 400 : (lo + hi) / 2);
  return (
    <Card title="Heat treatment of plain-carbon steel" subtitle="Simplified steel portion of the iron–carbon diagram with treatment temperature bands">
      <Tabs value={ht} onChange={setHt} className="mb-3" tabs={(Object.keys(HT_INFO) as HT[]).map((k) => ({ id: k, label: HT_INFO[k].name }))} />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Simplified iron–carbon diagram">
            <line x1={50} x2={W - 20} y1={H - 30} y2={H - 30} stroke={COL.ink} />
            <line x1={50} x2={50} y1={20} y2={H - 30} stroke={COL.ink} />
            {[200, 400, 600, 800, 1000].map((t) => (
              <g key={t}>
                <line x1={50} x2={W - 20} y1={Y(t)} y2={Y(t)} stroke={COL.muted} strokeOpacity={0.15} />
                <text x={44} y={Y(t) + 4} fontSize={10} textAnchor="end" fill={COL.muted}>{t}</text>
              </g>
            ))}
            {[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4].map((c) => (
              <text key={c} x={X(c)} y={H - 14} fontSize={10} textAnchor="middle" fill={COL.muted}>{c.toFixed(1)}</text>
            ))}
            <text x={W / 2} y={H - 1} fontSize={10.5} textAnchor="middle" fill={COL.ink}>Carbon content (% by mass)</text>
            <text x={12} y={H / 2} fontSize={10.5} textAnchor="middle" fill={COL.ink} transform={`rotate(-90 12 ${H / 2})`}>Temperature (°C)</text>
            {/* treatment band */}
            <rect x={X(C) - 18} y={Y(hi)} width={36} height={Math.max(4, Y(lo) - Y(hi))} fill="#f59e0b" opacity={0.45} rx={3} />
            <line x1={X(0)} y1={Y(A1)} x2={X(1.4)} y2={Y(A1)} stroke="#dc2626" strokeWidth={2} />
            <line x1={X(0)} y1={Y(912)} x2={X(0.76)} y2={Y(727)} stroke="#2563eb" strokeWidth={2} />
            <line x1={X(0.76)} y1={Y(727)} x2={X(1.4)} y2={Y(Acm(1.4))} stroke="#7c3aed" strokeWidth={2} />
            <line x1={X(0.76)} y1={Y(727)} x2={X(0.76)} y2={H - 30} stroke={COL.muted} strokeDasharray="4 3" />
            <text x={X(0.3)} y={Y(960)} fontSize={11} fill={COL.ink}>Austenite γ (FCC)</text>
            <text x={X(0.18)} y={Y(790)} fontSize={10} fill={COL.ink}>α + γ</text>
            <text x={X(1.0)} y={Y(800)} fontSize={10} fill={COL.ink}>γ + Fe₃C</text>
            <text x={X(0.12)} y={Y(500)} fontSize={10.5} fill={COL.ink}>Ferrite + pearlite</text>
            <text x={X(0.92)} y={Y(500)} fontSize={10.5} fill={COL.ink}>Pearlite + cementite</text>
            <text x={X(1.38)} y={Y(A1) - 4} fontSize={10} textAnchor="end" fill="#dc2626">A₁ 727 °C</text>
            <text x={X(0.2)} y={Y(A3(0.2)) - 6} fontSize={10} fill="#2563eb">A₃</text>
            <text x={X(1.25)} y={Y(Acm(1.25)) - 6} fontSize={10} fill="#7c3aed">A_cm</text>
            <text x={X(0.76) + 4} y={H - 36} fontSize={9.5} fill={COL.muted}>eutectoid 0.76% C</text>
            <circle cx={X(C)} cy={Y(cur)} r={5} fill="#f59e0b" stroke={COL.ink} />
            <Label x={X(C) + 22} y={Y(hi) - 4} anchor="start" size={10.5} weight={700} bg>{info.name}: {Math.round(lo)}–{Math.round(hi)} °C</Label>
          </svg>
          <Slider label="Carbon content of the steel" value={C} min={0.1} max={1.3} step={0.01} unit="% C" onChange={setC} />
          {ht === 'harden' && C < 0.3 && <Callout kind="warn" className="mt-2">Below ≈ 0.3% carbon, quenching produces little hardening — mild steel is usually case-hardened instead.</Callout>}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Heat to" value={<span className="text-sm">{info.heat}</span>} />
            <Stat label="Cool" value={<span className="text-sm">{info.cool}</span>} />
          </div>
          <CoolingCurve ht={ht} />
          <div className="flex items-center gap-3 rounded-lg border border-ink-200 p-2 dark:border-ink-700">
            <Microstructure kind={info.micro} size={80} />
            <div className="text-sm">
              <div className="font-semibold">Resulting microstructure</div>
              <div className="text-ink-600 dark:text-ink-300">{info.microName}</div>
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-ink-500">Relative properties (qualitative comparison)</div>
            {(['hard', 'duct', 'tough'] as const).map((k) => (
              <div key={k} className="mb-1 flex items-center gap-2 text-xs">
                <span className="w-20">{{ hard: 'Hardness', duct: 'Ductility', tough: 'Toughness' }[k]}</span>
                <div className="h-3 flex-1 rounded bg-ink-100 dark:bg-ink-800">
                  <div className="h-3 rounded bg-emerald-500" style={{ width: `${(info.props[k] / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm"><span className="font-semibold">Use: </span>{info.use}</p>
        </div>
      </div>
    </Card>
  );
}

function CoolingCurve({ ht }: { ht: HT }) {
  const W = 400;
  const H = 120;
  const paths: Record<HT, string> = {
    anneal: 'M 20 100 L 70 25 L 140 25 C 220 30, 300 60, 380 95',
    normalise: 'M 20 100 L 70 25 L 140 25 C 170 50, 200 85, 260 100 L 380 102',
    harden: 'M 20 100 L 70 25 L 140 25 L 150 100 L 380 102',
    temper: 'M 20 100 L 80 62 L 250 62 C 280 80, 320 96, 380 100',
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diagram rounded-lg border border-ink-100 dark:border-ink-800" aria-label="Temperature–time profile">
      <line x1={20} x2={W - 10} y1={H - 12} y2={H - 12} stroke={COL.ink} />
      <line x1={20} x2={20} y1={10} y2={H - 12} stroke={COL.ink} />
      <line x1={20} x2={W - 10} y1={52} y2={52} stroke="#dc2626" strokeDasharray="4 3" strokeOpacity={0.6} />
      <text x={W - 12} y={48} fontSize={9.5} textAnchor="end" fill="#dc2626">A₁ 727 °C</text>
      <path d={paths[ht]} fill="none" stroke="#f59e0b" strokeWidth={2.5} />
      <text x={W / 2} y={H - 1} fontSize={9.5} textAnchor="middle" fill={COL.muted}>time →</text>
      <text x={24} y={18} fontSize={9.5} fill={COL.muted}>temperature</text>
    </svg>
  );
}

// ───────────────────────── Hardness & impact testing ─────────────────────────
export function HardnessImpact() {
  const [tab, setTab] = useState<'brinell' | 'vickers' | 'charpy'>('charpy');
  return (
    <Card title="Hardness and impact testing" subtitle="Real formulas used by testing laboratories — enter measurements to get results">
      <Tabs value={tab} onChange={setTab} className="mb-3" tabs={[{ id: 'charpy', label: 'Charpy impact' }, { id: 'brinell', label: 'Brinell hardness' }, { id: 'vickers', label: 'Vickers hardness' }]} />
      {tab === 'charpy' && <Charpy />}
      {tab === 'brinell' && <Brinell />}
      {tab === 'vickers' && <Vickers />}
    </Card>
  );
}

function Charpy() {
  const [m, setM] = useState(20);
  const [R, setR] = useState(0.8);
  const [a0, setA0] = useState(140);
  const [a1, setA1] = useState(95);
  // Angles measured from the bottom (rest) position. Height above bottom: h = R(1 − cos α).
  const h1 = R * (1 - Math.cos((a0 * Math.PI) / 180));
  const h2 = R * (1 - Math.cos((a1 * Math.PI) / 180));
  const E = m * g * (h1 - h2);
  const valid = a1 <= a0;
  const cx = 200;
  const cy = 40;
  const L = 140;
  const p = (a: number) => ({ x: cx - L * Math.sin((a * Math.PI) / 180) * -1, y: cy + L * Math.cos((a * Math.PI) / 180) });
  const start = { x: cx - L * Math.sin((a0 * Math.PI) / 180), y: cy + L * Math.cos((a0 * Math.PI) / 180) };
  const end = p(a1);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <svg viewBox="0 0 400 260" className="diagram" role="img" aria-label="Charpy pendulum impact test">
        <circle cx={cx} cy={cy} r={4} fill={COL.ink} />
        <line x1={cx} y1={cy} x2={start.x} y2={start.y} stroke={COL.muted} strokeDasharray="5 4" />
        <circle cx={start.x} cy={start.y} r={14} fill={COL.muted} opacity={0.4} />
        <line x1={cx} y1={cy} x2={cx} y2={cy + L} stroke={COL.muted} strokeOpacity={0.3} />
        <rect x={cx - 6} y={cy + L + 14} width={12} height={10} fill="#0ea5e9" stroke={COL.ink} />
        <path d={`M ${cx - 3} ${cy + L + 14} l 3 4 l 3 -4`} fill="none" stroke={COL.compression} />
        <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={COL.ink} strokeWidth={2} />
        <circle cx={end.x} cy={end.y} r={14} fill={COL.load} opacity={0.6} />
        <line x1={0} x2={400} y1={cy + L} y2={cy + L} stroke={COL.muted} strokeOpacity={0.2} />
        <line x1={start.x - 30} x2={start.x + 30} y1={start.y} y2={start.y} stroke={COL.reaction} strokeDasharray="3 3" />
        <line x1={end.x - 30} x2={end.x + 30} y1={end.y} y2={end.y} stroke={COL.load} strokeDasharray="3 3" />
        <text x={10} y={start.y + 4} fontSize={10.5} fill={COL.reaction}>h₁ = {sig(h1, 3)} m</text>
        <text x={390} y={end.y + 4} fontSize={10.5} fill={COL.load} textAnchor="end">h₂ = {sig(h2, 3)} m</text>
        <text x={200} y={250} fontSize={10.5} textAnchor="middle" fill={COL.muted}>notched specimen (supported both ends) broken at the bottom of the swing</text>
      </svg>
      <div className="space-y-3">
        <Slider label="Pendulum mass" value={m} min={5} max={40} unit="kg" onChange={setM} />
        <Slider label="Arm length R" value={R} min={0.4} max={1.2} step={0.05} unit="m" onChange={setR} />
        <Slider label="Release angle (from rest position)" value={a0} min={60} max={160} unit="°" onChange={setA0} />
        <Slider label="Rise angle after impact" value={a1} min={0} max={160} unit="°" onChange={setA1} />
        {!valid ? (
          <ErrorList errors={['The pendulum cannot rise higher than its release point (energy would be created).']} />
        ) : (
          <>
            <Stat label="Energy absorbed by the specimen" value={sig(E, 4)} unit="J" tone="blue" />
            <M block>{`E = mg(h_1 - h_2) = ${m}(9.81)(${sig(h1, 4)} - ${sig(h2, 4)}) = ${sig(E, 4)}\\ \\text{J}`}</M>
            <p className="text-xs text-ink-500">High absorbed energy = tough, ductile fracture (fibrous surface). Low energy = brittle fracture (crystalline surface). Steels tested at several temperatures show a ductile-to-brittle transition. (Friction and air losses ignored.)</p>
          </>
        )}
      </div>
    </div>
  );
}

function Brinell() {
  const [F, setF] = useState('29.42');
  const [D, setD] = useState('10');
  const [d, setDi] = useState('4.0');
  const n = { F: parseNum(F), D: parseNum(D), d: parseNum(d) };
  const errs: string[] = [];
  if (!n.F || n.F <= 0) errs.push('Load must be positive.');
  if (!n.D || n.D <= 0) errs.push('Ball diameter must be positive.');
  if (!n.d || n.d <= 0) errs.push('Indentation diameter must be positive.');
  if (n.D && n.d && n.d >= n.D) errs.push('Indentation diameter must be smaller than the ball diameter.');
  const HB = errs.length ? 0 : (0.102 * 2 * n.F! * 1000) / (Math.PI * n.D! * (n.D! - Math.sqrt(n.D! ** 2 - n.d! ** 2)));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <svg viewBox="0 0 300 140" className="diagram" aria-label="Brinell ball indentation">
          <rect x={20} y={80} width={260} height={50} fill={COL.muted} opacity={0.3} />
          <circle cx={150} cy={52} r={34} fill="#cbd5e1" stroke={COL.ink} />
          <path d="M 122 80 Q 150 92 178 80" fill="var(--diagram-bg)" stroke={COL.ink} />
          <Arrow x1={150} y1={0} x2={150} y2={16} color={COL.load} w={2.4} />
          <line x1={122} x2={178} y1={100} y2={100} stroke={COL.load} />
          <text x={150} y={116} fontSize={11} textAnchor="middle" fill={COL.load}>d (measured)</text>
          <text x={200} y={40} fontSize={11} fill={COL.ink}>ball Ø D</text>
        </svg>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Load F" value={F} onChange={setF} unit="kN" />
          <NumField label="Ball D" value={D} onChange={setD} unit="mm" />
          <NumField label="Indent d" value={d} onChange={setDi} unit="mm" />
        </div>
      </div>
      <div className="space-y-3">
        {errs.length ? (
          <ErrorList errors={errs} />
        ) : (
          <>
            <Stat label="Brinell hardness" value={sig(HB, 4)} unit="HBW" tone="blue" />
            <M block>{'\\text{HB} = \\dfrac{0.102 \\times 2F}{\\pi D\\left(D - \\sqrt{D^2 - d^2}\\right)}\\quad (F\\ \\text{in N},\\ D, d\\ \\text{in mm})'}</M>
            <p className="text-xs text-ink-500">Standard test: 10 mm tungsten-carbide ball, 29.42 kN (3000 kgf) for steels. A smaller indentation means a harder material. Large ball averages over coarse structures (cast iron). Roughly, UTS (MPa) ≈ 3.4 × HB for many steels.</p>
          </>
        )}
      </div>
    </div>
  );
}

function Vickers() {
  const [F, setF] = useState('294.2');
  const [d, setD] = useState('0.5');
  const n = { F: parseNum(F), d: parseNum(d) };
  const errs = !n.F || n.F <= 0 || !n.d || n.d <= 0 ? ['Enter a positive load and diagonal length.'] : [];
  const HV = errs.length ? 0 : (0.1891 * n.F!) / (n.d! * n.d!);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <svg viewBox="0 0 300 140" className="diagram" aria-label="Vickers pyramid indentation">
          <polygon points="150,30 190,70 150,110 110,70" fill="none" stroke={COL.ink} strokeWidth={1.5} />
          <line x1={110} x2={190} y1={70} y2={70} stroke={COL.ink} strokeDasharray="3 2" />
          <line x1={150} x2={150} y1={30} y2={110} stroke={COL.ink} strokeDasharray="3 2" />
          <text x={200} y={74} fontSize={11} fill={COL.ink}>diagonals d₁, d₂ → mean d</text>
          <text x={20} y={130} fontSize={10.5} fill={COL.muted}>136° diamond square-based pyramid (view of indent from above)</text>
        </svg>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Load F" value={F} onChange={setF} unit="N" />
          <NumField label="Mean diagonal d" value={d} onChange={setD} unit="mm" />
        </div>
      </div>
      <div className="space-y-3">
        {errs.length ? (
          <ErrorList errors={errs} />
        ) : (
          <>
            <Stat label="Vickers hardness" value={sig(HV, 4)} unit="HV" tone="blue" />
            <M block>{'\\text{HV} = \\dfrac{0.1891\\,F}{d^2}\\quad (F\\ \\text{in N},\\ d\\ \\text{in mm})'}</M>
            <p className="text-xs text-ink-500">The diamond does not deform, so one scale covers soft to very hard materials, including thin case-hardened layers. Rockwell tests instead measure indentation DEPTH and read hardness directly from the machine.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Cold work & annealing / solid solution ─────────────────────────
export function ColdWorkAnneal() {
  const [stage, setStage] = useState(1);
  const stages = [
    { name: 'Annealed', text: 'Equiaxed grains, few dislocations — soft and ductile.', micro: 'grain' as const, hard: 1 },
    { name: 'Cold worked', text: 'Grains elongated, dislocation density high — harder and stronger, less ductile (strain hardening).', micro: 'fibre' as const, hard: 4 },
    { name: 'Recovery', text: 'Gentle heating relieves internal stress; little change in hardness.', micro: 'fibre' as const, hard: 3.6 },
    { name: 'Recrystallisation', text: 'Above the recrystallisation temperature, new stress-free equiaxed grains grow — ductility restored.', micro: 'grain' as const, hard: 1.4 },
    { name: 'Grain growth', text: 'Holding too long or too hot coarsens grains — slightly lower strength and toughness.', micro: 'grain' as const, hard: 1 },
  ];
  const s = stages[stage];
  return (
    <Card title="Cold working and annealing (non-ferrous and ferrous)" subtitle="Why brass and aluminium sheet are annealed between drawing or rolling passes">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <Microstructure kind={s.micro} size={120} />
        <div>
          <Slider label="Stage" value={stage} min={0} max={stages.length - 1} onChange={setStage} format={(v) => stages[v].name} />
          <p className="mt-2 text-sm">{s.text}</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="w-24">Relative hardness</span>
            <div className="h-3 flex-1 rounded bg-ink-100 dark:bg-ink-800">
              <div className="h-3 rounded bg-transport transition-all" style={{ width: `${(s.hard / 5) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
      <Callout kind="info" className="mt-3" title="Solid-solution strengthening">
        Alloying atoms of a different size (zinc in copper → brass; magnesium in aluminium) distort the crystal lattice. The strain fields obstruct dislocation movement, so the alloy is stronger and harder than the pure metal, though usually less conductive. Unlike precipitation hardening, the atoms stay dissolved — no ageing step is needed.
      </Callout>
    </Card>
  );
}

// ───────────────────────── Safety glass ─────────────────────────
export function GlassComparison() {
  const [broken, setBroken] = useState(false);
  return (
    <Card title="Laminated vs toughened glass" subtitle="Click to strike the glass" actions={<button className="btn text-xs" onClick={() => setBroken((b) => !b)}>{broken ? 'Reset' : 'Strike!'}</button>}>
      <div className="grid gap-4 md:grid-cols-2">
        {(['laminated', 'toughened'] as const).map((t) => (
          <div key={t}>
            <svg viewBox="0 0 240 170" className="diagram rounded-lg border border-ink-100 dark:border-ink-800" aria-label={`${t} glass fracture pattern`}>
              <rect x={20} y={20} width={200} height={110} rx={6} fill="#bae6fd" opacity={0.5} stroke="#0284c7" />
              {broken &&
                (t === 'laminated'
                  ? Array.from({ length: 12 }, (_, i) => {
                      const a = (i / 12) * Math.PI * 2;
                      return <line key={i} x1={120} y1={75} x2={120 + Math.cos(a) * (40 + (i % 3) * 18)} y2={75 + Math.sin(a) * (30 + (i % 2) * 15)} stroke="#0c4a6e" strokeWidth={1.2} />;
                    })
                  : Array.from({ length: 160 }, (_, i) => {
                      const x = 22 + (i % 20) * 10 + ((i * 7) % 4);
                      const y = 22 + Math.floor(i / 20) * 13.5 + ((i * 3) % 3);
                      return <rect key={i} x={x} y={y} width={8} height={11} fill="none" stroke="#0c4a6e" strokeWidth={0.6} />;
                    }))}
              {broken && t === 'laminated' && <circle cx={120} cy={75} r={6} fill="none" stroke="#0c4a6e" />}
              <text x={120} y={155} fontSize={11} textAnchor="middle" fill={COL.ink}>
                {broken ? (t === 'laminated' ? 'Cracks radiate; fragments held by PVB' : 'Shatters into small blunt cubes') : t === 'laminated' ? 'glass | PVB | glass' : 'surface compression, core tension'}
              </text>
            </svg>
            <div className="mt-2 text-sm font-semibold capitalize">{t} glass</div>
            <KeyPoints
              items={
                t === 'laminated'
                  ? ['Windscreens — mandatory', 'Stays in the frame, resists penetration, supports airbag deployment', 'Blocks most UV; sound damping']
                  : ['Side and rear windows, bus emergency windows', 'About 4–5× stronger than annealed glass', 'Cannot be cut after toughening']
              }
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ───────────────────────── Polymers ─────────────────────────
export function PolymerStructures() {
  return (
    <Card title="Polymer structures" subtitle="Bonding between chains decides whether a polymer can be remelted">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { k: 'linear' as const, t: 'Thermosoftening (thermoplastic)', d: 'Separate chains held by weak secondary forces. Heat lets chains slide → remouldable, recyclable. E.g. PP bumpers, PC lenses, nylon gears.' },
          { k: 'crosslinked' as const, t: 'Thermosetting', d: 'Chains joined by many covalent cross-links into a rigid 3D network. Does not soften — chars. E.g. epoxy, phenolic.' },
          { k: 'elastomer' as const, t: 'Elastomer', d: 'Coiled chains with a few cross-links: stretch a long way and spring back. E.g. vulcanised tyre rubber.' },
        ].map((p) => (
          <div key={p.k} className="flex gap-3">
            <Microstructure kind={p.k} size={90} />
            <div>
              <div className="text-sm font-semibold">{p.t}</div>
              <p className="text-xs text-ink-600 dark:text-ink-300">{p.d}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ───────────────────────── Electric motor animation ─────────────────────────
export function MotorAnimation() {
  const [playing, setPlaying] = useState(true);
  const [I, setI] = useState(3);
  const [B, setB] = useState(0.5);
  const [commutator, setCommutator] = useState(true);
  const [theta, setTheta] = useState(0.3);
  const vel = useRef(0);
  const raf = useRef<number>();
  const L = 0.1; // m, conductor length
  const r = 0.03; // m, coil radius
  const N = 50; // turns
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      setTheta((th) => {
        // Torque on the coil: τ = N·B·I·L·2r·cos θ (θ = plane of coil from the field direction)
        const dir = commutator ? Math.sign(Math.cos(th)) || 1 : 1;
        const tau = N * B * I * L * 2 * r * Math.cos(th) * dir;
        vel.current += (tau * 8 - vel.current * 0.9) * dt;
        return th + vel.current * dt;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current!);
  }, [playing, I, B, commutator]);
  const W = 520;
  const H = 300;
  const cx = 260;
  const cy = 150;
  const R = 70;
  // End view: the coil is a line through the axle; its two sides sit at angle θ (anticlockwise from the field direction).
  const s1 = { x: cx + R * Math.cos(theta), y: cy - R * Math.sin(theta) };
  const s2 = { x: cx - R * Math.cos(theta), y: cy + R * Math.sin(theta) };
  const flip = commutator ? Math.cos(theta) < 0 : false;
  const F = N * B * I * L; // force on each side (N)
  const torque = Math.abs(F * 2 * r * Math.cos(theta));
  const side1Out = !flip; // current out of page on side 1
  return (
    <Card title="DC motor principle" subtitle="F = BIL on each side of the coil produces a turning couple; the commutator reverses the current every half turn">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="End view of a DC motor coil rotating between magnet poles">
          <rect x={20} y={70} width={80} height={160} rx={6} fill="#dc2626" opacity={0.8} />
          <text x={60} y={155} fontSize={28} fontWeight={800} textAnchor="middle" fill="white">N</text>
          <rect x={420} y={70} width={80} height={160} rx={6} fill="#2563eb" opacity={0.8} />
          <text x={460} y={155} fontSize={28} fontWeight={800} textAnchor="middle" fill="white">S</text>
          {[90, 120, 150, 180, 210].map((y) => (
            <Arrow key={y} x1={105} y1={y} x2={415} y2={y} color={COL.muted} w={1} head={6} />
          ))}
          <text x={260} y={60} fontSize={10.5} textAnchor="middle" fill={COL.muted}>magnetic field B (N → S)</text>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={COL.muted} strokeDasharray="3 4" />
          <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke={COL.transport} strokeWidth={4} />
          {[{ p: s1, out: side1Out }, { p: s2, out: !side1Out }].map(({ p, out }, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={12} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={2} />
              {out ? <circle cx={p.x} cy={p.y} r={3} fill={COL.ink} /> : <path d={`M ${p.x - 6} ${p.y - 6} L ${p.x + 6} ${p.y + 6} M ${p.x + 6} ${p.y - 6} L ${p.x - 6} ${p.y + 6}`} stroke={COL.ink} strokeWidth={2} />}
              {/* Force: current out of page (⊙) with B to the right → force up (F = I L × B) */}
              <Arrow x1={p.x} y1={p.y + (out ? -14 : 14)} x2={p.x} y2={p.y + (out ? -60 : 60)} color={COL.reaction} w={2.6} />
            </g>
          ))}
          <text x={20} y={285} fontSize={10.5} fill={COL.muted}>⊙ current out of page, ⊗ into page. Force direction: right-hand palm rule (F = IL × B).</text>
        </svg>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Run'}
            </button>
          </div>
          <Slider label="Current I" value={I} min={0} max={6} step={0.1} unit="A" onChange={setI} />
          <Slider label="Field strength B" value={B} min={0.1} max={1} step={0.05} unit="T" onChange={setB} />
          <Toggle checked={commutator} onChange={(v) => { setCommutator(v); vel.current = 0; }} label="Split-ring commutator fitted" />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Force per side (N = 50 turns)" value={sig(F, 3)} unit="N" />
            <Stat label="Torque now" value={sig(torque, 3)} unit="N·m" tone="blue" />
          </div>
          <M block>{`F = NBIL = 50 \\times ${B} \\times ${I} \\times 0.1 = ${sig(F, 3)}\\ \\text{N}`}</M>
          {!commutator && <Callout kind="warn">Without a commutator the torque reverses every half turn, so the coil just oscillates about the vertical position.</Callout>}
          <p className="prose-only text-xs text-ink-500">Model: coil of 50 turns, side length 0.1 m, radius 0.03 m, with damping. Torque is greatest when the coil plane is parallel to the field and zero when perpendicular — momentum carries it through.</p>
        </div>
      </div>
    </Card>
  );
}

export function MotorTypes() {
  const rows = [
    ['Brushed DC (series-wound)', 'Commutator + brushes; high starting torque', 'Early trams and trains, starter motors, small appliances', 'Brush and commutator wear'],
    ['Brushless DC (BLDC) / permanent-magnet synchronous', 'Electronic commutation by an inverter; rare-earth magnets on the rotor', 'E-bikes, e-scooters, most modern EVs', 'Needs electronic controller; magnet materials cost'],
    ['AC induction (asynchronous)', 'Rotating field induces rotor current — no brushes or magnets', 'Modern trains and trams (VVVF inverter drives), some EVs', 'Slightly lower efficiency at light load'],
    ['Universal motor', 'Series motor that runs on AC or DC', 'Power tools, vacuum cleaners', 'Noisy, brush wear'],
    ['Stepper motor', 'Moves in precise steps from pulse signals', 'Instrument gauges, positioning', 'Low power, not for traction'],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>Motor</th>
            <th>Principle</th>
            <th>Transport applications</th>
            <th>Limitation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i} className={i === 0 ? 'font-semibold' : ''}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────────── Circuit visualiser ─────────────────────────
export function CircuitVisualiser() {
  const [mode, setMode] = useState<'series' | 'parallel'>('series');
  const [V, setV] = useState(12);
  const [Rs, setRs] = useState([4, 8, 12]);
  const [n, setN] = useState(2);
  const rs = Rs.slice(0, n);
  const res = useMemo(() => solveCircuit(V, rs, mode), [V, rs.join(','), mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const speed = Math.max(0.4, Math.min(8, res.It * 1.5));
  const W = 560;
  const H = 280;
  return (
    <Card title="Electrical circuit visualiser" subtitle="Conventional current flows from + to −; dot speed ∝ current">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label={`${mode} resistor circuit`}>
          {/* Battery on left */}
          <line x1={60} x2={60} y1={60} y2={120} stroke={COL.ink} strokeWidth={2} />
          <line x1={60} x2={60} y1={160} y2={220} stroke={COL.ink} strokeWidth={2} />
          <line x1={44} x2={76} y1={130} y2={130} stroke={COL.ink} strokeWidth={3} />
          <line x1={52} x2={68} y1={146} y2={146} stroke={COL.ink} strokeWidth={3} />
          <line x1={60} x2={60} y1={120} y2={130} stroke={COL.ink} strokeWidth={2} />
          <line x1={60} x2={60} y1={146} y2={160} stroke={COL.ink} strokeWidth={2} />
          <text x={84} y={128} fontSize={12} fill={COL.ink}>+</text>
          <text x={84} y={152} fontSize={12} fill={COL.ink}>−</text>
          <text x={24} y={142} fontSize={12} fontWeight={700} fill={COL.ink} textAnchor="end">{V} V</text>
          {mode === 'series' ? (
            <g>
              <path id="loop" d="M 60 60 L 500 60 L 500 220 L 60 220" fill="none" stroke={COL.ink} strokeWidth={2} />
              {rs.map((R, i) => {
                const x = 150 + i * (300 / Math.max(1, n));
                return (
                  <g key={i}>
                    <rect x={x} y={50} width={60} height={20} fill="var(--diagram-bg)" stroke={COL.transport} strokeWidth={2} />
                    <text x={x + 30} y={44} fontSize={11} textAnchor="middle" fill={COL.ink}>R{i + 1} = {R} Ω</text>
                    <text x={x + 30} y={90} fontSize={10.5} textAnchor="middle" fill={COL.muted}>V = {sig(res.branches[i].V, 3)} V</text>
                  </g>
                );
              })}
              {Array.from({ length: 12 }, (_, i) => (
                <circle key={i} r={4} fill="#f59e0b">
                  <animateMotion dur={`${8 / speed}s`} begin={`${(-i * 8) / speed / 12}s`} repeatCount="indefinite" path="M 60 120 L 60 60 L 500 60 L 500 220 L 60 220 L 60 160" />
                </circle>
              ))}
            </g>
          ) : (
            <g>
              <path d="M 60 60 L 440 60 M 60 220 L 440 220" fill="none" stroke={COL.ink} strokeWidth={2} />
              {rs.map((R, i) => {
                const x = 200 + i * 120;
                return (
                  <g key={i}>
                    <line x1={x} x2={x} y1={60} y2={220} stroke={COL.ink} strokeWidth={2} />
                    <rect x={x - 10} y={110} width={20} height={60} fill="var(--diagram-bg)" stroke={COL.transport} strokeWidth={2} />
                    <text x={x + 16} y={130} fontSize={11} fill={COL.ink}>R{i + 1} = {R} Ω</text>
                    <text x={x + 16} y={146} fontSize={10.5} fill={COL.muted}>I = {sig(res.branches[i].I, 3)} A</text>
                    {Array.from({ length: 4 }, (_, k) => (
                      <circle key={k} r={3.5} fill="#f59e0b">
                        <animateMotion dur={`${6 / Math.max(0.3, res.branches[i].I * 1.5)}s`} begin={`${-k * 1.5 / Math.max(0.3, res.branches[i].I * 1.5)}s`} repeatCount="indefinite" path={`M 60 120 L 60 60 L ${x} 60 L ${x} 220 L 60 220 L 60 160`} />
                      </circle>
                    ))}
                  </g>
                );
              })}
            </g>
          )}
          <rect x={250} y={236} width={150} height={30} rx={6} fill="var(--diagram-bg)" stroke={COL.ink} />
          <text x={325} y={256} fontSize={12} textAnchor="middle" fontWeight={700} fill={COL.ink}>Ammeter: {sig(res.It, 4)} A</text>
        </svg>
        <div className="space-y-3">
          <Tabs value={mode} onChange={setMode} tabs={[{ id: 'series', label: 'Series' }, { id: 'parallel', label: 'Parallel' }]} />
          <Slider label="Supply voltage" value={V} min={1} max={48} unit="V" onChange={setV} />
          <Slider label="Number of resistors" value={n} min={1} max={3} onChange={setN} />
          {rs.map((R, i) => (
            <Slider key={i} label={`R${i + 1}`} value={R} min={1} max={50} unit="Ω" onChange={(v) => setRs((a) => a.map((x, k) => (k === i ? v : x)))} />
          ))}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="R total" value={sig(res.Rt, 3)} unit="Ω" />
            <Stat label="I total" value={sig(res.It, 3)} unit="A" tone="blue" />
            <Stat label="Power" value={sig(res.Pt, 3)} unit="W" />
          </div>
          <M block>{mode === 'series' ? `R_T = ${rs.join(' + ')} = ${sig(res.Rt, 4)}\\ \\Omega` : `\\dfrac{1}{R_T} = ${rs.map((r) => `\\tfrac{1}{${r}}`).join(' + ')} \\Rightarrow R_T = ${sig(res.Rt, 4)}\\ \\Omega`}</M>
          <M block>{`I = \\dfrac{V}{R_T} = ${sig(res.It, 4)}\\ \\text{A}, \\quad P = VI = ${sig(res.Pt, 4)}\\ \\text{W}`}</M>
          <p className="text-xs text-ink-500">Ideal battery and wires assumed. Series: same current, voltages share. Parallel: same voltage, currents share — e.g. vehicle lamps are wired in parallel so one failure doesn’t switch off the others.</p>
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────── Power distribution ─────────────────────────
function wrapText(t: string, max: number) {
  const out: string[] = [];
  let cur = '';
  for (const w of t.split(' ')) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      out.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}
export function PowerDistribution() {
  const nodes = [
    { x: 40, t: 'Power station', s: 'generator (e.g. 23 kV)' },
    { x: 150, t: 'Step-up transformer', s: 'to 330 kV' },
    { x: 260, t: 'Transmission lines', s: 'high V → low I → low I²R loss' },
    { x: 370, t: 'Traction substation', s: 'step-down + rectify to 1500 V DC' },
    { x: 480, t: 'Overhead wiring', s: 'contact wire → pantograph' },
    { x: 590, t: 'Train', s: 'inverter → traction motors → rails return' },
  ];
  return (
    <div>
      <svg viewBox="0 0 660 160" className="diagram" role="img" aria-label="Electricity supply chain to an electric train">
        {nodes.map((n, i) => (
          <g key={n.t}>
            {i < nodes.length - 1 && <line x1={n.x + 34} x2={nodes[i + 1].x - 34} y1={60} y2={60} stroke={COL.transport} strokeWidth={3} className="flow-dash" />}
            <rect x={n.x - 34} y={36} width={68} height={48} rx={8} fill="var(--diagram-bg)" stroke={COL.transport} strokeWidth={1.5} />
            <text x={n.x} y={64} fontSize={20} textAnchor="middle">{['⚡', '⇧', '〰', '⇩', '⎯', '🚆'][i]}</text>
            <text x={n.x} y={102} fontSize={10.5} textAnchor="middle" fontWeight={700} fill={COL.ink}>{n.t}</text>
            {wrapText(n.s, 20).map((line, k) => (
              <text key={k} x={n.x} y={118 + k * 12} fontSize={9.5} textAnchor="middle" fill={COL.muted}>
                {line}
              </text>
            ))}
          </g>
        ))}
      </svg>
      <p className="mt-1 text-xs text-ink-500">Sydney’s suburban trains use 1500 V DC overhead wiring; Sydney light rail uses 750 V DC. Power loss in a line is P = I²R, so transmitting at high voltage (low current) saves energy. Regenerative braking can return energy to the overhead line for other trains.</p>
    </div>
  );
}

// ───────────────────────── Feedback control (cruise control) ─────────────────────────
export function CruiseControl() {
  const [grade, setGrade] = useState(5);
  const [Kp, setKp] = useState(800);
  const [closed, setClosed] = useState(true);
  const set = 25; // m/s target
  const m = 1500;
  const sim = useMemo(() => {
    const dt = 0.2;
    let v = set;
    const out: { t: number; v: number }[] = [];
    const Fcruise = 0.5 * 1.2 * 0.7 * 2.2 * set * set + 0.012 * m * g; // resistance at set speed on level road
    for (let i = 0; i <= 300; i++) {
      const t = i * dt;
      const slope = t > 10 ? (grade / 100) : 0;
      const resist = 0.5 * 1.2 * 0.7 * 2.2 * v * v + 0.012 * m * g + m * g * slope;
      const drive = closed ? Math.max(0, Math.min(6000, Fcruise + Kp * (set - v))) : Fcruise;
      v = Math.max(0, v + ((drive - resist) / m) * dt);
      out.push({ t, v });
    }
    return out;
  }, [grade, Kp, closed]);
  const W = 520;
  const H = 200;
  const X = (t: number) => 40 + (t / 60) * (W - 60);
  const Y = (v: number) => H - 30 - ((v - 15) / 15) * (H - 50);
  const final = sim[sim.length - 1].v;
  return (
    <Card title="Control technology: closed-loop cruise control" subtitle="A feedback loop measures speed and corrects the driving force">
      <svg viewBox="0 0 560 110" className="diagram mb-3" role="img" aria-label="Feedback control block diagram">
        {[
          { x: 20, w: 80, t: 'Set speed' },
          { x: 140, w: 60, t: 'Σ error' },
          { x: 240, w: 90, t: 'Controller' },
          { x: 370, w: 90, t: 'Motor / engine' },
          { x: 490, w: 60, t: 'Vehicle' },
        ].map((b, i, arr) => (
          <g key={b.t}>
            <rect x={b.x} y={20} width={b.w} height={36} rx={6} fill="var(--diagram-bg)" stroke={COL.transport} />
            <text x={b.x + b.w / 2} y={42} fontSize={11} textAnchor="middle" fill={COL.ink}>{b.t}</text>
            {i < arr.length - 1 && <Arrow x1={b.x + b.w} y1={38} x2={arr[i + 1].x} y2={38} color={COL.ink} w={1.5} head={7} />}
          </g>
        ))}
        <path d="M 520 56 L 520 90 L 170 90 L 170 58" fill="none" stroke={closed ? COL.reaction : COL.muted} strokeWidth={1.8} strokeDasharray={closed ? undefined : '5 4'} />
        <Arrow x1={170} y1={70} x2={170} y2={58} color={closed ? COL.reaction : COL.muted} w={1.8} />
        <text x={345} y={104} fontSize={10.5} textAnchor="middle" fill={closed ? COL.reaction : COL.muted}>speed sensor feedback {closed ? '' : '(disconnected — open loop)'}</text>
      </svg>
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Speed versus time when climbing a hill">
          <line x1={40} x2={W - 20} y1={H - 30} y2={H - 30} stroke={COL.ink} />
          <line x1={40} x2={40} y1={14} y2={H - 30} stroke={COL.ink} />
          <line x1={40} x2={W - 20} y1={Y(set)} y2={Y(set)} stroke={COL.reaction} strokeDasharray="5 4" />
          <text x={W - 22} y={Y(set) - 4} fontSize={10} textAnchor="end" fill={COL.reaction}>set point 90 km/h</text>
          <line x1={X(10)} x2={X(10)} y1={14} y2={H - 30} stroke={COL.muted} strokeDasharray="3 3" />
          <text x={X(10) + 4} y={24} fontSize={10} fill={COL.muted}>hill starts</text>
          <polyline points={sim.map((p) => `${X(p.t)},${Y(p.v)}`).join(' ')} fill="none" stroke={COL.transport} strokeWidth={2.4} />
          {[15, 20, 25, 30].map((v) => (
            <text key={v} x={34} y={Y(v) + 4} fontSize={10} textAnchor="end" fill={COL.muted}>{Math.round(v * 3.6)}</text>
          ))}
          {[0, 20, 40, 60].map((t) => (
            <text key={t} x={X(t)} y={H - 14} fontSize={10} textAnchor="middle" fill={COL.muted}>{t} s</text>
          ))}
          <text x={46} y={14} fontSize={10} fill={COL.muted}>speed (km/h)</text>
        </svg>
        <div className="space-y-3">
          <Toggle checked={closed} onChange={setClosed} label="Feedback connected (closed loop)" />
          <Slider label="Hill gradient" value={grade} min={0} max={10} step={0.5} unit="%" onChange={setGrade} />
          <Slider label="Controller gain Kp" value={Kp} min={100} max={3000} step={100} unit="N per m/s" onChange={setKp} />
          <Stat label="Speed after 60 s" value={fixed(final * 3.6, 1)} unit="km/h" tone={Math.abs(final - set) * 3.6 < 3 ? 'emerald' : 'red'} />
          <p className="text-xs text-ink-500">Simplified proportional (P) controller with drive force limit. Notice the small steady-state error — real cruise control adds integral action (PI/PID) to remove it. Open loop: the car simply slows down on the hill.</p>
        </div>
      </div>
    </Card>
  );
}

export function MaterialSelection() {
  const options = [
    { name: 'Mild steel', mass: 3, cost: 5, recycle: 5, crash: 4, corrosion: 2 },
    { name: 'High-strength steel', mass: 3.5, cost: 4, recycle: 5, crash: 5, corrosion: 2 },
    { name: 'Aluminium alloy', mass: 4.5, cost: 3, recycle: 4.5, crash: 4, corrosion: 4 },
    { name: 'CFRP composite', mass: 5, cost: 1, recycle: 1.5, crash: 4, corrosion: 5 },
    { name: 'GFRP / SMC polymer', mass: 4, cost: 3.5, recycle: 2, crash: 3, corrosion: 5 },
  ];
  const [w, setW] = useState({ mass: 3, cost: 4, recycle: 2, crash: 5, corrosion: 2 });
  const scored = options.map((o) => ({ ...o, score: (Object.keys(w) as (keyof typeof w)[]).reduce((s, k) => s + w[k] * o[k], 0) })).sort((a, b) => b.score - a.score);
  const max = Math.max(...scored.map((s) => s.score));
  return (
    <Card title="Materials selection: car body structure" subtitle="Weighted decision matrix — ratings are qualitative (1 = poor, 5 = excellent); change the weights to see the trade-offs">
      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {(Object.keys(w) as (keyof typeof w)[]).map((k) => (
            <Slider key={k} label={`Weight: ${{ mass: 'low mass', cost: 'low cost', recycle: 'recyclability', crash: 'crash energy absorption', corrosion: 'corrosion resistance' }[k]}`} value={w[k]} min={0} max={5} onChange={(v) => setW((p) => ({ ...p, [k]: v }))} />
          ))}
        </div>
        <div className="space-y-2">
          {scored.map((s, i) => (
            <div key={s.name} className="flex items-center gap-2 text-sm">
              <span className={cx('w-40 shrink-0', i === 0 && 'font-semibold')}>{s.name}</span>
              <div className="h-5 flex-1 rounded bg-ink-100 dark:bg-ink-800">
                <div className={cx('h-5 rounded', i === 0 ? 'bg-transport' : 'bg-ink-400 dark:bg-ink-500')} style={{ width: `${(s.score / max) * 100}%` }} />
              </div>
              <span className="w-10 text-right font-mono tabular-nums">{s.score}</span>
              {i === 0 && <Badge tone="transport">best fit</Badge>}
            </div>
          ))}
          <p className="pt-1 text-xs text-ink-500">Mass-market cars mostly use high-strength steels (cost, crash performance, recyclability); premium and electric vehicles increasingly use aluminium; CFRP is limited to high-performance vehicles because of cost and recycling.</p>
        </div>
      </div>
    </Card>
  );
}
