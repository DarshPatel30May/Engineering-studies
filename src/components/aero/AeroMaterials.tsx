import { useState } from 'react';
import { Arrow, Label, COL } from '../diagrams/svg';
import { Card, Slider, Tabs, KeyPoints, Badge, cx } from '../ui';
import { Microstructure } from '../materials/Microstructure';

type NDT = 'dye' | 'magnetic' | 'ultrasonic' | 'xray' | 'gamma';
const NDT_INFO: Record<NDT, { name: string; steps: string[]; finds: string; materials: string; limits: string[]; aero: string }> = {
  dye: {
    name: 'Dye penetrant',
    steps: ['Clean and degrease the surface', 'Apply coloured or fluorescent penetrant; capillary action draws it into surface cracks (dwell time)', 'Remove excess penetrant from the surface', 'Apply white developer, which draws penetrant back out', 'Inspect: red lines (or glowing lines under UV) reveal cracks'],
    finds: 'Surface-breaking cracks, porosity and laps',
    materials: 'Any non-porous material: aluminium, titanium, steel, ceramics, composites (surface)',
    limits: ['Surface-breaking defects only', 'Not for porous materials', 'Surface must be very clean; chemicals need careful handling'],
    aero: 'Inspecting aluminium wheel hubs, engine casings and fittings for fatigue cracks',
  },
  magnetic: {
    name: 'Magnetic particle',
    steps: ['Magnetise the part (permanent magnet, yoke or current)', 'Apply fine iron particles (dry or in fluorescent liquid)', 'A crack disrupts the magnetic field, creating flux leakage', 'Particles gather at the leakage field, outlining the crack', 'Inspect, then demagnetise the part'],
    finds: 'Surface and near-surface cracks',
    materials: 'FERROMAGNETIC materials only (steels, not aluminium, titanium or austenitic stainless)',
    limits: ['Only ferromagnetic materials', 'Cracks must cut across the field lines — test in two directions', 'Part must be demagnetised afterwards'],
    aero: 'Steel landing-gear components, engine mounts and bolts',
  },
  ultrasonic: {
    name: 'Ultrasonic',
    steps: ['Couple a probe to the surface with gel', 'Probe sends high-frequency sound pulses (≈ 1–10 MHz) into the part', 'Pulses reflect from the back wall and from any internal defect', 'Echo timing gives depth (d = vt/2); echo amplitude indicates defect size', 'Scan the area (A-scan trace or C-scan map)'],
    finds: 'Internal cracks, delamination in composites, thickness loss from corrosion',
    materials: 'Metals and composites',
    limits: ['Needs skilled operators and calibration blocks', 'Coupling required; rough or complex shapes difficult'],
    aero: 'Delamination in CFRP panels, thickness of corroded skins, cracks in thick forgings',
  },
  xray: {
    name: 'X-ray radiography',
    steps: ['Place X-ray tube on one side and film/digital detector on the other', 'Expose: X-rays pass through, attenuated by material thickness and density', 'Voids and cracks let more radiation through → darker areas on the image', 'Interpret the radiograph against acceptance standards'],
    finds: 'Internal voids, porosity, inclusions, cracks parallel to the beam, hidden corrosion, foreign objects',
    materials: 'Most materials; electrically powered source can be switched off',
    limits: ['Radiation hazard — exclusion zones and licensed operators', 'Access to both sides needed', 'Cracks perpendicular to the beam can be missed'],
    aero: 'Inspecting castings, welds and internal structure without dismantling (e.g. honeycomb panels for water ingress)',
  },
  gamma: {
    name: 'Gamma-ray radiography',
    steps: ['A radioactive isotope (e.g. iridium-192) in a shielded container is exposed remotely', 'Gamma rays pass through the component to the film', 'Process and interpret as for X-ray'],
    finds: 'As for X-ray, in thicker or denser sections',
    materials: 'Thick steel and dense parts',
    limits: ['Source is ALWAYS radioactive — strict safety and storage', 'Lower image contrast than X-ray', 'Fixed energy depending on isotope'],
    aero: 'Portable inspection where no power is available, thick components',
  },
};

export function NDTExplorer() {
  const [m, setM] = useState<NDT>('dye');
  const [step, setStep] = useState(0);
  const info = NDT_INFO[m];
  const s = Math.min(step, info.steps.length - 1);
  return (
    <Card title="Non-destructive testing (NDT) explorer" subtitle="Step through each method">
      <Tabs size="sm" value={m} onChange={(v) => (setM(v), setStep(0))} className="mb-3" tabs={(Object.keys(NDT_INFO) as NDT[]).map((k) => ({ id: k, label: NDT_INFO[k].name }))} />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div>
          <NDTDiagram m={m} step={s} />
          <div className="mt-2 flex items-center gap-2">
            <button className="btn" onClick={() => setStep(Math.max(0, s - 1))} disabled={s === 0}>Back</button>
            <div className="flex-1 text-center text-sm"><Badge tone="aero">Step {s + 1}/{info.steps.length}</Badge> {info.steps[s]}</div>
            <button className="btn btn-primary" onClick={() => setStep(Math.min(info.steps.length - 1, s + 1))} disabled={s === info.steps.length - 1}>Next</button>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">Detects: </span>{info.finds}</p>
          <p><span className="font-semibold">Materials: </span>{info.materials}</p>
          <div><div className="font-semibold">Limitations</div><KeyPoints items={info.limits} /></div>
          <p><span className="font-semibold">Aircraft example: </span>{info.aero}</p>
        </div>
      </div>
    </Card>
  );
}

function NDTDiagram({ m, step }: { m: NDT; step: number }) {
  const W = 600;
  const H = 220;
  const part = <rect x={60} y={110} width={480} height={70} fill="#cbd5e1" stroke={COL.ink} />;
  const crack = <path d="M 300 110 l -4 18 l 6 10 l -3 14" stroke={COL.ink} strokeWidth={2} fill="none" />;
  if (m === 'dye')
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Dye penetrant test">
        {part}
        {step === 1 && <rect x={60} y={102} width={480} height={8} fill="#dc2626" opacity={0.6} />}
        {step >= 1 && step <= 3 && <path d="M 300 110 l -4 18 l 6 10 l -3 14" stroke="#dc2626" strokeWidth={4} fill="none" />}
        {crack}
        {step >= 3 && <rect x={60} y={100} width={480} height={10} fill="#f8fafc" stroke={COL.muted} />}
        {step >= 3 && <ellipse cx={300} cy={102} rx={step === 4 ? 26 : 16} ry={6} fill="#dc2626" opacity={0.8} />}
        {step === 0 && Array.from({ length: 8 }, (_, i) => <circle key={i} cx={90 + i * 60} cy={100} r={4} fill="#94a3b8" />)}
        <text x={300} y={205} fontSize={11} textAnchor="middle" fill={COL.muted}>{['cleaning', 'penetrant seeps into the crack (capillary action)', 'excess wiped off — penetrant stays in the crack', 'developer layer draws penetrant out', 'indication visible: red line (or glow under UV)'][step]}</text>
      </svg>
    );
  if (m === 'magnetic')
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Magnetic particle test">
        {part}
        {crack}
        {step >= 0 && (
          <>
            <path d="M 60 80 L 60 110 M 540 80 L 540 110 M 60 80 L 540 80" stroke="#dc2626" strokeWidth={10} fill="none" opacity={0.5} />
            <text x={300} y={70} fontSize={11} textAnchor="middle" fill="#dc2626">yoke magnetises the part</text>
          </>
        )}
        {[125, 140, 155, 170].map((y) => (
          <path key={y} d={step >= 2 ? `M 70 ${y} L 285 ${y} Q 300 ${y - 40 + (y - 125) * 0.3} 315 ${y} L 530 ${y}` : `M 70 ${y} L 530 ${y}`} stroke="#2563eb" strokeWidth={1.2} fill="none" />
        ))}
        {step >= 1 && Array.from({ length: step >= 3 ? 30 : 12 }, (_, i) => {
          const clustered = step >= 3 && i < 22;
          const x = clustered ? 290 + (i % 6) * 4 : 80 + ((i * 41) % 440);
          const y = clustered ? 102 + Math.floor(i / 6) * 2 : 104;
          return <circle key={i} cx={x} cy={y} r={2} fill="#111827" />;
        })}
        <text x={300} y={205} fontSize={11} textAnchor="middle" fill={COL.muted}>{['magnetise', 'iron particles applied', 'crack distorts the field → leakage flux', 'particles cluster over the crack', 'inspect then demagnetise'][step]}</text>
      </svg>
    );
  if (m === 'ultrasonic')
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Ultrasonic pulse-echo test">
        <rect x={60} y={90} width={300} height={90} fill="#cbd5e1" stroke={COL.ink} />
        <rect x={180} y={128} width={50} height={4} fill={COL.ink} />
        <rect x={190} y={70} width={30} height={20} fill={COL.aero} />
        {step >= 1 && <Arrow x1={205} y1={92} x2={205} y2={step >= 2 ? 126 : 176} color="#f59e0b" w={2} />}
        {step >= 2 && <Arrow x1={212} y1={126} x2={212} y2={94} color="#8b5cf6" w={2} />}
        <text x={205} y={62} fontSize={10.5} textAnchor="middle" fill={COL.ink}>probe</text>
        <text x={240} y={138} fontSize={10.5} fill={COL.ink}>defect</text>
        {/* A-scan */}
        <g transform="translate(390 40)">
          <rect x={0} y={0} width={190} height={140} fill="var(--diagram-bg)" stroke={COL.ink} />
          <polyline points={`5,130 15,130 18,20 21,130 ${step >= 3 ? '70,130 73,60 76,130' : ''} ${step >= 3 ? '150,130 153,40 156,130' : '150,130 153,40 156,130'} 185,130`} fill="none" stroke="#10b981" strokeWidth={1.6} />
          <text x={18} y={14} fontSize={9.5} textAnchor="middle" fill={COL.ink}>pulse</text>
          {step >= 3 && <text x={73} y={54} fontSize={9.5} textAnchor="middle" fill="#8b5cf6">defect echo</text>}
          <text x={153} y={34} fontSize={9.5} textAnchor="middle" fill={COL.ink}>back wall</text>
          <text x={95} y={155} fontSize={9.5} textAnchor="middle" fill={COL.muted}>A-scan: time (depth) →</text>
        </g>
        <text x={210} y={205} fontSize={11} textAnchor="middle" fill={COL.muted}>{['couple probe with gel', 'sound pulse enters the part', 'reflection from the defect', 'echo position → depth, height → size', 'scan the area'][step]}</text>
      </svg>
    );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label={`${m === 'xray' ? 'X-ray' : 'Gamma-ray'} radiography`}>
      {m === 'xray' ? <rect x={40} y={70} width={60} height={60} rx={6} fill="#f59e0b" opacity={0.6} /> : <circle cx={70} cy={100} r={22} fill="#dc2626" opacity={0.6} />}
      <text x={70} y={152} fontSize={10.5} textAnchor="middle" fill={COL.ink}>{m === 'xray' ? 'X-ray tube' : 'Ir-192 source'}</text>
      {step >= 1 && [-40, -20, 0, 20, 40].map((d) => <line key={d} x1={100} y1={100} x2={480} y2={100 + d * 1.6} stroke="#f59e0b" strokeDasharray="4 3" />)}
      <rect x={250} y={40} width={80} height={120} fill="#cbd5e1" stroke={COL.ink} />
      <ellipse cx={290} cy={105} rx={10} ry={7} fill="var(--diagram-bg)" stroke={COL.ink} />
      <rect x={480} y={20} width={18} height={170} fill="#e5e7eb" stroke={COL.ink} />
      {step >= 2 && <rect x={480} y={104} width={18} height={20} fill="#111827" />}
      <Label x={540} y={118} size={10.5} bg>{step >= 2 ? 'dark = void' : 'film'}</Label>
      <text x={300} y={205} fontSize={11} textAnchor="middle" fill={COL.muted}>{(m === 'xray' ? ['set up source and film', 'expose', 'void absorbs less → darker image', 'interpret'] : ['remote exposure of shielded source', 'gamma rays penetrate the part', 'interpret image'])[Math.min(step, m === 'xray' ? 3 : 2)]}</text>
    </svg>
  );
}

// ───────────────────────── Age hardening ─────────────────────────
export function AgeHardening() {
  const [t, setT] = useState(2);
  const stage = t < 1 ? 0 : t < 2 ? 1 : t < 4.5 ? 2 : t < 6.5 ? 3 : 4;
  const stages = [
    { n: 'Solution treatment (≈ 500 °C)', d: 'Copper dissolves completely into the aluminium (single-phase α solid solution).', micro: 'grain' as const },
    { n: 'Quench (rapid cooling in water)', d: 'Copper is trapped in a SUPERSATURATED solid solution — soft at first.', micro: 'grain' as const },
    { n: 'Ageing — fine coherent precipitates', d: 'Tiny copper-rich zones/precipitates form throughout the grains, straining the lattice and blocking dislocations: strength rises.', micro: 'precipitate' as const },
    { n: 'Peak aged', d: 'Optimum size and spacing of precipitates → maximum strength (e.g. T6).', micro: 'precipitate' as const },
    { n: 'Over-aged', d: 'Held too long/hot, precipitates coarsen and spread apart; dislocations bypass them → strength falls (sometimes chosen for better SCC resistance, e.g. T73).', micro: 'precipitate' as const },
  ];
  const W = 520;
  const H = 170;
  const X = (x: number) => 40 + (x / 8) * (W - 60);
  const hard = (x: number) => (x < 2 ? 0.2 : 0.2 + 0.75 * (1 - Math.exp(-(x - 2) / 1.2)) - (x > 4.5 ? 0.12 * (x - 4.5) : 0));
  const Y = (h: number) => H - 26 - h * (H - 46);
  return (
    <Card title="Age (precipitation) hardening of aluminium–copper alloys" subtitle="Solution treat → quench → age">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Hardness versus ageing time">
            <line x1={40} x2={W - 20} y1={H - 26} y2={H - 26} stroke={COL.ink} />
            <line x1={40} x2={40} y1={14} y2={H - 26} stroke={COL.ink} />
            <rect x={X(0)} y={14} width={X(1) - X(0)} height={H - 40} fill="#f97316" opacity={0.1} />
            <rect x={X(1)} y={14} width={X(2) - X(1)} height={H - 40} fill="#0ea5e9" opacity={0.1} />
            <polyline points={Array.from({ length: 121 }, (_, i) => i / 15).filter((x) => x >= 2).map((x) => `${X(x)},${Y(hard(x))}`).join(' ')} fill="none" stroke={COL.aero} strokeWidth={2.4} />
            <circle cx={X(Math.max(2, t))} cy={Y(hard(Math.max(2, t)))} r={5} fill="#f59e0b" />
            <text x={X(0.5)} y={30} fontSize={10} textAnchor="middle" fill="#c2410c">solution</text>
            <text x={X(1.5)} y={30} fontSize={10} textAnchor="middle" fill="#0369a1">quench</text>
            <text x={X(3.6)} y={Y(0.9)} fontSize={10} fill={COL.ink}>peak strength</text>
            <text x={X(6.6)} y={Y(0.66)} fontSize={10} fill={COL.ink}>over-ageing</text>
            <text x={W / 2} y={H - 8} fontSize={10.5} textAnchor="middle" fill={COL.muted}>ageing time (log scale, schematic) →</text>
            <text x={46} y={14} fontSize={10} fill={COL.muted}>strength / hardness</text>
          </svg>
          <Slider label="Process stage" value={t} min={0} max={8} step={0.1} onChange={setT} format={() => stages[stage].n} />
        </div>
        <div className="flex gap-3">
          <Microstructure kind={stages[stage].micro} size={110} />
          <div className="text-sm">
            <div className="font-semibold">{stages[stage].n}</div>
            <p className="mt-1 text-ink-600 dark:text-ink-300">{stages[stage].d}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────── Corrosion types ─────────────────────────
export function AeroCorrosion() {
  const [k, setK] = useState<'pitting' | 'crevice' | 'scc'>('pitting');
  const info = {
    pitting: { t: 'Pitting corrosion', d: 'Chloride ions break down the protective oxide film at small spots; the tiny anode (pit) corrodes rapidly while the large surrounding surface is cathodic. Pits are stress raisers that can start fatigue cracks.', p: ['Alclad (pure-aluminium cladding) and anodising', 'Primers and paint systems', 'Washing off salt; corrosion-inhibiting compounds'] },
    crevice: { t: 'Crevice corrosion', d: 'Moisture trapped in lap joints, under fastener heads and seals becomes oxygen-depleted; the crevice becomes the anode (differential aeration cell).', p: ['Wet-assembly with sealant / jointing compound', 'Drainage holes, avoid moisture traps in design', 'Regular inspection of joints'] },
    scc: { t: 'Stress-corrosion cracking (SCC)', d: 'A sustained TENSILE stress (applied or residual) plus a corrosive environment causes cracks to grow, often along grain boundaries, at stresses well below yield.', p: ['Select resistant alloys/tempers (e.g. 7075-T73 rather than T6)', 'Shot peening to put the surface in compression', 'Stress relief; avoid interference fits and loading across the short-transverse grain'] },
  }[k];
  return (
    <Card title="Corrosion in aircraft" subtitle="Aluminium alloys in moist, salty environments">
      <Tabs size="sm" value={k} onChange={setK} className="mb-3" tabs={[{ id: 'pitting', label: 'Pitting' }, { id: 'crevice', label: 'Crevice' }, { id: 'scc', label: 'Stress corrosion' }]} />
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <svg viewBox="0 0 520 190" className="diagram" role="img" aria-label={info.t}>
          {k === 'pitting' && (
            <g>
              <rect x={30} y={70} width={460} height={90} fill="#cbd5e1" stroke={COL.ink} />
              <rect x={30} y={64} width={460} height={6} fill="#a7f3d0" />
              <text x={40} y={58} fontSize={10.5} fill={COL.ink}>protective oxide film</text>
              {[150, 300, 400].map((x, i) => (
                <g key={x}>
                  <path d={`M ${x - 8} 70 Q ${x} ${110 + i * 10} ${x + 8} 70`} fill="#78350f" opacity={0.75} />
                  <text x={x} y={58} fontSize={11} textAnchor="middle" fill="#0369a1">Cl⁻</text>
                </g>
              ))}
              <text x={260} y={182} fontSize={10.5} textAnchor="middle" fill={COL.muted}>small anodic pits penetrate deeply under a mostly intact surface</text>
            </g>
          )}
          {k === 'crevice' && (
            <g>
              <rect x={30} y={60} width={300} height={24} fill="#cbd5e1" stroke={COL.ink} />
              <rect x={200} y={84} width={290} height={24} fill="#cbd5e1" stroke={COL.ink} />
              <rect x={232} y={44} width={14} height={80} fill="#64748b" />
              <path d="M 200 84 L 330 84" stroke="#0ea5e9" strokeWidth={4} />
              <path d="M 270 84 q 6 4 12 0 q 6 4 12 0" stroke="#78350f" strokeWidth={3} fill="none" />
              <text x={300} y={140} fontSize={10.5} textAnchor="middle" fill={COL.ink}>trapped moisture, low O₂ → anode</text>
              <text x={100} y={40} fontSize={10.5} fill={COL.ink}>lap joint with rivet</text>
            </g>
          )}
          {k === 'scc' && (
            <g>
              <rect x={100} y={50} width={320} height={90} fill="#cbd5e1" stroke={COL.ink} />
              <Arrow x1={100} y1={95} x2={40} y2={95} color={COL.load} w={2.5} />
              <Arrow x1={420} y1={95} x2={480} y2={95} color={COL.load} w={2.5} />
              <path d="M 260 50 l 6 12 l -5 10 l 7 12 l -4 10" stroke="#78350f" strokeWidth={2.4} fill="none" />
              <path d="M 266 62 l 10 6 M 261 72 l -9 7" stroke="#78350f" strokeWidth={1.5} />
              <text x={260} y={40} fontSize={10.5} textAnchor="middle" fill="#0369a1">corrosive environment</text>
              <text x={260} y={170} fontSize={10.5} textAnchor="middle" fill={COL.ink}>sustained tensile stress + environment → branching cracks</text>
            </g>
          )}
        </svg>
        <div className="space-y-2 text-sm">
          <div className="font-semibold">{info.t}</div>
          <p>{info.d}</p>
          <div className="font-semibold">Prevention</div>
          <KeyPoints items={info.p} />
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────── Composites & FML ─────────────────────────
export function CompositeLayup() {
  const [layup, setLayup] = useState<'ud' | 'quasi' | 'fml'>('quasi');
  const plies = layup === 'ud' ? [0, 0, 0, 0, 0, 0] : layup === 'quasi' ? [0, 45, -45, 90, 90, -45, 45, 0] : [];
  return (
    <Card title="Fibre-reinforced composites and fibre-metal laminates" subtitle="Properties are directional — engineers stack plies to match the loads">
      <Tabs size="sm" value={layup} onChange={setLayup} className="mb-3" tabs={[{ id: 'ud', label: 'Unidirectional' }, { id: 'quasi', label: 'Quasi-isotropic [0/±45/90]s' }, { id: 'fml', label: 'GLARE (FML)' }]} />
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <svg viewBox="0 0 520 220" className="diagram" role="img" aria-label="Composite ply stack">
          {layup !== 'fml' ? (
            plies.map((a, i) => (
              <g key={i} transform={`translate(${60 + i * 10} ${20 + i * 20})`}>
                <defs>
                  <clipPath id={`ply${i}`}>
                    <rect width={320} height={60} />
                  </clipPath>
                </defs>
                <rect width={320} height={60} fill="#fde68a" stroke={COL.ink} opacity={0.85} />
                <g clipPath={`url(#ply${i})`}>
                  {Array.from({ length: 40 }, (_, k) => {
                    const t = (a * Math.PI) / 180;
                    const off = -200 + k * 14;
                    return <line key={k} x1={160 + off * Math.sin(t) - 400 * Math.cos(t)} y1={30 + off * Math.cos(t) + 400 * Math.sin(t)} x2={160 + off * Math.sin(t) + 400 * Math.cos(t)} y2={30 + off * Math.cos(t) - 400 * Math.sin(t)} stroke="#334155" strokeWidth={1.4} />;
                  })}
                </g>
                <text x={330} y={14} fontSize={10.5} fill={COL.ink}>{a}°</text>
              </g>
            ))
          ) : (
            <g>
              {Array.from({ length: 7 }, (_, i) => (
                <rect key={i} x={60} y={30 + i * 20} width={340} height={i % 2 ? 12 : 8} fill={i % 2 ? '#fde68a' : '#94a3b8'} stroke={COL.ink} strokeWidth={0.6} />
              ))}
              <path d="M 230 30 l 3 8 M 230 70 l 3 8 M 230 110 l 3 8" stroke="#dc2626" strokeWidth={2.4} />
              {[52, 92].map((y) => Array.from({ length: 6 }, (_, k) => <line key={`${y}-${k}`} x1={212 + k * 7} x2={212 + k * 7} y1={y - 4} y2={y + 8} stroke="#2563eb" strokeWidth={1.4} />))}
              <text x={410} y={36} fontSize={10.5} fill={COL.ink}>aluminium (≈ 0.3 mm)</text>
              <text x={410} y={56} fontSize={10.5} fill={COL.ink}>glass-fibre/epoxy</text>
              <text x={230} y={195} fontSize={10.5} textAnchor="middle" fill={COL.ink}>cracks in Al layers (red) are BRIDGED by intact fibres (blue) → slow fatigue crack growth</text>
            </g>
          )}
        </svg>
        <div className="space-y-2 text-sm">
          {layup === 'ud' && <KeyPoints items={['All fibres at 0°: maximum strength and stiffness along the fibres.', 'Weak across the fibres (matrix-dominated) — used for spar caps and stringers carrying axial loads.']} />}
          {layup === 'quasi' && <KeyPoints items={['Plies at 0°, ±45° and 90°, stacked symmetrically, give similar in-plane stiffness in all directions.', '±45° plies carry shear and torsion; 0° carry axial load; 90° resist transverse load.', 'Used for fuselage and wing skins.']} />}
          {layup === 'fml' && <KeyPoints items={['GLARE: thin 2024-T3 aluminium sheets + glass-fibre/epoxy layers.', 'Excellent fatigue resistance, impact and fire burn-through resistance.', 'About 10% lighter than monolithic aluminium; repaired and inspected like metal.', 'Used on the Airbus A380 upper fuselage.']} />}
          <div className="rounded-lg border border-ink-200 p-2 text-xs dark:border-ink-700">
            <div className="font-semibold">Advantages vs limitations of composites</div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <ul className="list-disc pl-4 text-emerald-700 dark:text-emerald-400"><li>High specific strength/stiffness</li><li>No corrosion; good fatigue</li><li>Fewer parts (co-curing)</li></ul>
              <ul className="list-disc pl-4 text-red-700 dark:text-red-400"><li>Hidden impact damage</li><li>Costly, slow to make</li><li>Hard to recycle; lightning protection needed</li></ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AlAlloyTable() {
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>Alloy family</th>
            <th>Main additions</th>
            <th>Strengthening</th>
            <th>Key properties</th>
            <th>Aircraft use</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Aluminium–silicon', 'Si (≈ 5–13%)', 'Not heat-treatable (unless Mg/Cu added)', 'Excellent castability and fluidity, good corrosion resistance, moderate strength', 'Thin castings, housings'],
            ['Aluminium–silicon–magnesium', 'Si + Mg (Mg₂Si)', 'Age hardening (T6)', 'Castable/weldable, good strength and corrosion resistance', 'Castings, fittings, extrusions (6xxx)'],
            ['Aluminium–copper (2xxx)', 'Cu ≈ 4–5%, Mg', 'Age hardening (T3/T4)', 'High strength, excellent fatigue resistance; poorer corrosion resistance (clad)', 'Fuselage skins, lower wing skins'],
            ['Aluminium–zinc (7xxx)', 'Zn, Mg, Cu', 'Age hardening (T6/T73)', 'Highest strength; SCC risk in T6', 'Upper wing skins, spars, highly loaded fittings'],
          ].map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i} className={cx(i === 0 && 'font-semibold')}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
