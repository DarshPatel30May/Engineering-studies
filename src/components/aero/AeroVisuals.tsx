import { useEffect, useMemo, useRef, useState } from 'react';
import { joukowskiFlow, illustrativeCl } from '@/lib/calc/aero';
import { venturi, isaPressure, isaDensity, pitotSpeed } from '@/lib/calc/fluids';
import { sig, fixed } from '@/lib/calc/format';
import { Arrow, Label, COL } from '../diagrams/svg';
import { Card, Slider, Stat, M, Tabs, Callout, Badge, KeyPoints, Toggle, cx } from '../ui';

// ───────────────────────── Four forces ─────────────────────────
export function FourForces() {
  const [L, setL] = useState(60);
  const [W, setW] = useState(60);
  const [T, setT] = useState(30);
  const [D, setD] = useState(30);
  const fx = T - D;
  const fy = L - W;
  const state =
    Math.abs(fx) < 0.5 && Math.abs(fy) < 0.5
      ? { t: 'Equilibrium: steady, straight and level flight (constant velocity)', tone: 'emerald' }
      : `${fx > 0.5 ? 'Accelerating forward' : fx < -0.5 ? 'Decelerating' : 'Constant speed'} · ${fy > 0.5 ? 'net upward force (begins to climb)' : fy < -0.5 ? 'net downward force (begins to descend)' : 'no vertical acceleration'}`;
  const s = 1.6;
  const cx = 300;
  const cy = 160;
  return (
    <Card title="The four forces of flight" subtitle="Vectors drawn to scale through the centre of gravity (simplified level-flight model)">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <svg viewBox="0 0 600 320" className="diagram" role="img" aria-label="Aircraft with lift, weight, thrust and drag vectors">
          <g transform={`translate(${cx} ${cy})`}>
            <path d="M -150 0 C -140 -18, -60 -22, 90 -14 C 130 -12, 150 -6, 160 0 C 150 8, 120 12, 90 14 C -60 22, -140 18, -150 0 Z" fill="#bae6fd" stroke={COL.aero} strokeWidth={2} />
            <path d="M -20 -4 L 30 -4 L 10 -70 L -6 -70 Z" fill="#7dd3fc" stroke={COL.aero} opacity={0.8} />
            <path d="M -150 0 L -175 -55 L -150 -55 L -120 -8 Z" fill="#7dd3fc" stroke={COL.aero} />
            <circle cx={0} cy={0} r={6} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={2} />
            <path d="M 0 -6 A 6 6 0 0 1 6 0 L 0 0 Z M 0 6 A 6 6 0 0 1 -6 0 L 0 0 Z" fill={COL.ink} />
          </g>
          <Arrow x1={cx} y1={cy} x2={cx} y2={cy - L * s} color={COL.reaction} w={3.5} />
          <Label x={cx + 8} y={cy - L * s + 6} anchor="start" color={COL.reaction} weight={700} bg>Lift {L} kN</Label>
          <Arrow x1={cx} y1={cy} x2={cx} y2={cy + W * s} color={COL.ink} w={3.5} />
          <Label x={cx + 8} y={cy + W * s - 4} anchor="start" weight={700} bg>Weight {W} kN</Label>
          <Arrow x1={cx + 160} y1={cy} x2={cx + 160 + T * s} y2={cy} color={COL.load} w={3.5} />
          <Label x={cx + 160 + T * s} y={cy - 10} color={COL.load} weight={700} bg>Thrust {T} kN</Label>
          <Arrow x1={cx - 150} y1={cy} x2={cx - 150 - D * s} y2={cy} color={COL.compression} w={3.5} />
          <Label x={cx - 150 - D * s} y={cy - 10} color={COL.compression} weight={700} bg>Drag {D} kN</Label>
          {(Math.abs(fx) > 0.5 || Math.abs(fy) > 0.5) && (
            <>
              <Arrow x1={cx} y1={cy} x2={cx + fx * s * 2} y2={cy - fy * s * 2} color="#8b5cf6" w={2.4} dashed />
              <Label x={cx + fx * s * 2 + 6} y={cy - fy * s * 2 - 6} anchor="start" size={11} color="#7c3aed" weight={700} bg>net force (×2 scale)</Label>
            </>
          )}
          <text x={20} y={310} fontSize={10.5} fill={COL.muted}>Relative airflow →  (aircraft flying left to right)</text>
        </svg>
        <div className="space-y-3">
          <Slider label="Lift" value={L} min={0} max={100} unit="kN" onChange={setL} />
          <Slider label="Weight" value={W} min={0} max={100} unit="kN" onChange={setW} />
          <Slider label="Thrust" value={T} min={0} max={60} unit="kN" onChange={setT} />
          <Slider label="Drag" value={D} min={1} max={60} unit="kN" onChange={setD} />
          <Badge tone={typeof state === 'object' ? 'emerald' : 'amber'}>{typeof state === 'object' ? state.t : state}</Badge>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="L/D ratio" value={sig(L / D, 3)} tone="blue" />
            <Stat label="Thrust needed (level)" value={sig(W / (L / D || 1), 3)} unit="kN" sub="T = W ÷ (L/D)" />
          </div>
          <button className="btn w-full text-xs" onClick={() => (setL(60), setW(60), setT(30), setD(30))}>Reset to equilibrium</button>
          <p className="prose-only text-xs text-ink-500">Lift acts perpendicular and drag parallel to the relative airflow. Weight always acts vertically through the CG; thrust acts along the engine line. In a steady climb or descent the forces also balance, but the geometry changes.</p>
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────── Aerofoil ─────────────────────────
export function AirfoilViz() {
  const [alpha, setAlpha] = useState(6);
  const [camber, setCamber] = useState(0.08);
  const [showStream, setShowStream] = useState(true);
  const flow = useMemo(() => joukowskiFlow(Math.min(alpha, 14), 0.09, camber, 17), [alpha, camber]);
  const stalled = alpha > 15;
  const W = 640;
  const H = 320;
  const X = (x: number) => W / 2 + x * 68;
  const Y = (y: number) => H / 2 - y * 68;
  const surf = flow.surface.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ');
  const colour = (v: number) => {
    // speed ratio → colour: slow (high pressure) amber, fast (low pressure) blue
    const t = Math.max(0, Math.min(1, (v - 0.6) / 0.9));
    const r = Math.round(245 - t * 230);
    const g2 = Math.round(158 + t * 7);
    const b = Math.round(11 + t * 222);
    return `rgb(${r},${g2},${b})`;
  };
  return (
    <Card title="Aerofoil and angle of attack" subtitle="Streamlines from an inviscid potential-flow model (Joukowski aerofoil, Kutta condition) — conceptual, not a performance prediction">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="diagram rounded-lg" role="img" aria-label="Airflow around an aerofoil">
            {showStream &&
              flow.streamlines.map((line, i) => (
                <g key={i}>
                  {line.slice(1).map((p, k) => (
                    <line key={k} x1={X(line[k].x)} y1={Y(line[k].y)} x2={X(p.x)} y2={Y(p.y)} stroke={colour(p.v)} strokeWidth={1.8} />
                  ))}
                </g>
              ))}
            {stalled && (
              <g>
                {Array.from({ length: 7 }, (_, i) => (
                  <path key={i} d={`M ${X(-0.5 + i * 0.45)} ${Y(0.55 + (i % 2) * 0.15)} q 14 -16 28 0 q 14 16 28 0`} fill="none" stroke="#94a3b8" strokeWidth={2} />
                ))}
                <rect x={X(-0.6)} y={Y(1.2)} width={X(3.5) - X(-0.6)} height={Y(0.2) - Y(1.2)} fill="#94a3b8" opacity={0.15} />
                <text x={X(1.4)} y={Y(1.35)} fontSize={12} textAnchor="middle" fill="#dc2626" fontWeight={700}>STALL — flow separates from upper surface (not captured by potential flow)</text>
              </g>
            )}
            <polygon points={surf} fill="#e2e8f0" stroke={COL.ink} strokeWidth={1.6} transform={stalled ? `rotate(${-(alpha - 14)} ${X(0)} ${Y(0)})` : undefined} />
            <line x1={X(-4.4)} x2={X(-3.4)} y1={Y(2.1)} y2={Y(2.1)} stroke={COL.ink} />
            <Arrow x1={X(-4.4)} y1={Y(2.1)} x2={X(-3.2)} y2={Y(2.1)} color={COL.ink} w={1.5} />
            <text x={X(-4.4)} y={Y(2.1) - 8} fontSize={11} fill={COL.ink}>relative airflow</text>
            <text x={X(0)} y={H - 10} fontSize={10.5} textAnchor="middle" fill={COL.muted}>Colour: amber = slow (higher pressure) → blue = fast (lower pressure)</text>
          </svg>
          <LiftCurve alpha={alpha} />
        </div>
        <div className="space-y-3">
          <Slider label="Angle of attack α" value={alpha} min={-4} max={20} step={0.5} unit="°" onChange={setAlpha} />
          <Slider label="Camber" value={camber} min={0} max={0.15} step={0.01} onChange={setCamber} format={(v) => (v === 0 ? 'symmetric' : fixed(v, 2))} />
          <Toggle checked={showStream} onChange={setShowStream} label="Show streamlines" />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Model C_L (inviscid)" value={stalled ? '—' : sig(flow.cl, 3)} tone="blue" sub={stalled ? 'model invalid beyond stall' : undefined} />
            <Stat label="Typical real wing C_L" value={sig(illustrativeCl(alpha), 2)} sub="illustrative" />
          </div>
          <Badge tone={stalled ? 'red' : alpha > 12 ? 'amber' : 'emerald'}>{stalled ? 'Stalled: lift collapses, drag rises sharply' : alpha > 12 ? 'Approaching the critical angle' : 'Attached flow'}</Badge>
          <KeyPoints
            items={[
              'Streamlines crowd together over the upper surface → faster flow → lower static pressure (Bernoulli).',
              'The wing turns the airflow downward (downwash); the reaction pushes the wing up (Newton’s third law). Both describe the same flow.',
              'Increasing α increases lift almost linearly until the critical angle (≈ 15° for many wings), then the flow separates and the wing stalls.',
              'Camber produces lift even at α = 0°; a symmetric aerofoil makes zero lift at α = 0°.',
            ]}
          />
        </div>
      </div>
    </Card>
  );
}

function LiftCurve({ alpha }: { alpha: number }) {
  const W = 640;
  const H = 140;
  const X = (a: number) => 40 + ((a + 5) / 25) * (W - 60);
  const Y = (cl: number) => H - 22 - (cl / 1.8) * (H - 34);
  const pts = Array.from({ length: 101 }, (_, i) => -5 + i * 0.25);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diagram mt-1" aria-label="Lift coefficient versus angle of attack (illustrative)">
      <line x1={40} x2={W - 20} y1={Y(0)} y2={Y(0)} stroke={COL.muted} />
      <line x1={X(0)} x2={X(0)} y1={8} y2={H - 22} stroke={COL.muted} />
      <polyline points={pts.map((a) => `${X(a)},${Y(illustrativeCl(a))}`).join(' ')} fill="none" stroke={COL.aero} strokeWidth={2.2} />
      <circle cx={X(alpha)} cy={Y(illustrativeCl(alpha))} r={5} fill="#f59e0b" />
      <line x1={X(15)} x2={X(15)} y1={8} y2={H - 22} stroke="#dc2626" strokeDasharray="4 3" />
      <text x={X(15) + 4} y={18} fontSize={10} fill="#dc2626">critical angle (typical)</text>
      {[-5, 0, 5, 10, 15, 20].map((a) => (
        <text key={a} x={X(a)} y={H - 8} fontSize={10} textAnchor="middle" fill={COL.muted}>{a}°</text>
      ))}
      <text x={46} y={16} fontSize={10} fill={COL.muted}>C_L (illustrative real wing)</text>
    </svg>
  );
}

// ───────────────────────── Bernoulli & Venturi ─────────────────────────
export function BernoulliVenturi() {
  const [ratio, setRatio] = useState(0.5);
  const [v1, setV1] = useState(2);
  const rho = 1000;
  const p1 = 150000;
  const A1 = 0.01;
  const A2 = A1 * ratio;
  const r = venturi(rho, A1, A2, v1, p1);
  const W = 640;
  const H = 300;
  const halfH = (x: number) => {
    // inlet 0–180, converge 180–280, throat 280–360, diverge 360–520, outlet 520–640
    const h1 = 60;
    const h2 = h1 * ratio;
    if (x < 180) return h1;
    if (x < 280) return h1 + ((h2 - h1) * (x - 180)) / 100;
    if (x < 360) return h2;
    if (x < 520) return h2 + ((h1 - h2) * (x - 360)) / 160;
    return h1;
  };
  const cy = 200;
  const top = Array.from({ length: 65 }, (_, i) => `${i * 10},${cy - halfH(i * 10)}`).join(' ');
  const bot = Array.from({ length: 65 }, (_, i) => `${i * 10},${cy + halfH(i * 10)}`).join(' ');
  // particles
  const [parts, setParts] = useState(() => Array.from({ length: 36 }, (_, i) => ({ x: (i * 37) % 640, y: ((i * 53) % 100) / 100 - 0.5 })));
  const raf = useRef<number>();
  useEffect(() => {
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      setParts((ps) => ps.map((p) => {
        const v = (v1 * 60) / halfH(p.x); // continuity: v ∝ 1/A
        const nx = p.x + v * 18 * dt;
        return { x: nx > 640 ? nx - 640 : nx, y: p.y };
      }));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio, v1]);
  const pScale = 0.0006;
  const col = (x: number, p: number, label: string) => (
    <g>
      <rect x={x - 8} y={cy - halfH(x) - Math.max(0, p * pScale) - 2} width={16} height={Math.max(0, p * pScale) + 2} fill="#bae6fd" stroke={COL.aero} />
      <rect x={x - 8} y={cy - halfH(x) - Math.max(0, p * pScale)} width={16} height={Math.max(0, p * pScale)} fill="#0ea5e9" opacity={0.6} />
      <text x={x} y={cy - halfH(x) - p * pScale - 8} fontSize={10.5} textAnchor="middle" fill={COL.ink}>{label}</text>
    </g>
  );
  const total = p1 + 0.5 * rho * v1 * v1;
  return (
    <Card title="Bernoulli’s principle and the Venturi effect" subtitle="Water flowing through a constriction — piezometer tubes show static pressure">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Venturi tube with pressure tubes">
            <polygon points={`${top} ${bot.split(' ').reverse().join(' ')}`} fill="#e0f2fe" />
            <polyline points={top} fill="none" stroke={COL.ink} strokeWidth={2} />
            <polyline points={bot} fill="none" stroke={COL.ink} strokeWidth={2} />
            {parts.map((p, i) => (
              <circle key={i} cx={p.x} cy={cy + p.y * 1.6 * halfH(p.x)} r={2.6} fill={COL.aero} />
            ))}
            {col(90, r.Q > 0 ? p1 - 100000 : 0, `p₁ = ${sig(p1 / 1000, 4)} kPa`)}
            {col(320, Math.max(0, r.p2 - 100000), `p₂ = ${sig(r.p2 / 1000, 4)} kPa`)}
            <Label x={90} y={cy + 85} size={11} weight={700} bg>A₁, v₁ = {sig(v1, 3)} m/s</Label>
            <Label x={320} y={cy + 85} size={11} weight={700} bg>A₂, v₂ = {sig(r.v2, 3)} m/s</Label>
            <text x={10} y={18} fontSize={10.5} fill={COL.muted}>column height ∝ (static pressure − 100 kPa)</text>
          </svg>
          <div className="mt-2 space-y-1.5">
            {[{ n: 'Inlet (1)', p: p1, v: v1 }, { n: 'Throat (2)', p: r.p2, v: r.v2 }].map((s) => (
              <div key={s.n} className="flex items-center gap-2 text-xs">
                <span className="w-20">{s.n}</span>
                <div className="flex h-5 flex-1 overflow-hidden rounded bg-ink-100 dark:bg-ink-800">
                  <div className="h-full bg-sky-500" style={{ width: `${(s.p / total) * 100}%` }} title="static pressure" />
                  <div className="h-full bg-amber-500" style={{ width: `${((0.5 * rho * s.v * s.v) / total) * 100}%` }} title="dynamic pressure" />
                </div>
              </div>
            ))}
            <div className="flex gap-3 text-[11px] text-ink-500">
              <span><span className="inline-block h-2 w-2 rounded-sm bg-sky-500" /> static p</span>
              <span><span className="inline-block h-2 w-2 rounded-sm bg-amber-500" /> dynamic ½ρv²</span>
              <span>Total (bar length) is the same at both sections → energy conserved</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <Slider label="Throat area A₂ / A₁" value={ratio} min={0.2} max={1} step={0.05} onChange={setRatio} />
          <Slider label="Inlet speed v₁" value={v1} min={0.5} max={5} step={0.1} unit="m/s" onChange={setV1} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Throat speed v₂" value={sig(r.v2, 3)} unit="m/s" tone="blue" />
            <Stat label="Pressure drop" value={sig(r.dp / 1000, 3)} unit="kPa" tone="red" />
          </div>
          <M block>{`v_2 = v_1\\dfrac{A_1}{A_2} = ${sig(r.v2, 3)}\\ \\text{m/s}`}</M>
          <M block>{`p_1 - p_2 = \\tfrac12\\rho(v_2^2 - v_1^2) = ${sig(r.dp, 4)}\\ \\text{Pa}`}</M>
          <Callout kind="assume">Steady, incompressible, frictionless flow in a horizontal tube (ρ = 1000 kg/m³, p₁ = 150 kPa). Real flows lose some pressure to friction.</Callout>
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────── Propulsion ─────────────────────────
type Engine = 'piston' | 'turbojet' | 'turbofan' | 'turboprop' | 'ramjet' | 'scramjet' | 'rocket';
const ENGINES: Record<Engine, { name: string; principle: string; speed: string; pros: string[]; cons: string[]; apps: string }> = {
  piston: { name: 'Piston engine + propeller', principle: 'Four-stroke (intake, compression, power, exhaust) internal-combustion engine turns a propeller, which accelerates a large mass of air slightly.', speed: 'Up to ~ 500 km/h', pros: ['Simple, cheap, fuel-efficient at low speed', 'Easy maintenance'], cons: ['Heavy for its power', 'Propeller efficiency falls at high speed and altitude'], apps: 'Light aircraft, trainers, agricultural aircraft' },
  turbojet: { name: 'Turbojet', principle: 'Air is compressed, mixed with fuel and burnt; the hot gas spins a turbine that drives the compressor, then accelerates out of the nozzle as a high-speed jet.', speed: 'High subsonic to supersonic', pros: ['Simple gas turbine; good at high speed', 'Afterburner possible'], cons: ['Noisy; poor fuel efficiency at subsonic speeds'], apps: 'Early jets, Concorde (with afterburners), missiles' },
  turbofan: { name: 'Turbofan (high bypass)', principle: 'A large turbine-driven fan pushes most of the air around the core (bypass air). Accelerating a large mass slowly is more efficient than a small mass quickly.', speed: 'Subsonic, Mach 0.75–0.85 cruise', pros: ['Excellent fuel efficiency at airliner speeds', 'Much quieter'], cons: ['Large diameter and weight', 'Complex'], apps: 'Airliners (A320, 737, 787), business jets' },
  turboprop: { name: 'Turboprop', principle: 'A gas turbine drives a propeller through a reduction gearbox; most thrust comes from the propeller.', speed: 'Up to ~ 650 km/h', pros: ['Very efficient at low/medium speed and altitude', 'Short take-off'], cons: ['Speed limited by propeller tip speed', 'Noise and vibration'], apps: 'Regional airliners (Dash 8, ATR 72), RFDS King Airs, C-130' },
  ramjet: { name: 'Ramjet', principle: 'No compressor: the inlet shape slows and compresses incoming air by ram effect (to subsonic), fuel burns, and the gas accelerates out of the nozzle.', speed: '≈ Mach 2–5 (needs boosting to start)', pros: ['No moving parts', 'Efficient at high supersonic speed'], cons: ['Produces no thrust when stationary', 'Must be boosted (rocket) to operating speed'], apps: 'Supersonic missiles' },
  scramjet: { name: 'Scramjet', principle: 'Supersonic-combustion ramjet: air stays supersonic through the combustor; compression by shock waves from the inlet geometry.', speed: '≈ Mach 5+ (hypersonic)', pros: ['Air-breathing at hypersonic speeds (no oxidiser carried)'], cons: ['Extremely difficult combustion (milliseconds)', 'Needs a booster; severe heating'], apps: 'Research vehicles (UQ HyShot 2002, HIFiRE)' },
  rocket: { name: 'Rocket (extension)', principle: 'Carries both fuel and oxidiser; combustion gases expand through a convergent–divergent nozzle. Thrust from Newton’s third law — works in a vacuum.', speed: 'Any (works in space)', pros: ['Works outside the atmosphere', 'Very high thrust-to-weight'], cons: ['Very high propellant consumption', 'Must carry oxidiser'], apps: 'Space launch, boosters for ramjets/scramjets' },
};

export function PropulsionExplorer() {
  const [e, setE] = useState<Engine>('turbofan');
  const info = ENGINES[e];
  return (
    <Card title="Propulsion systems" subtitle="Conceptual cutaway diagrams — airflow shown left to right">
      <Tabs size="sm" value={e} onChange={setE} className="mb-3" tabs={(Object.keys(ENGINES) as Engine[]).map((k) => ({ id: k, label: ENGINES[k].name.split(' (')[0].split(' +')[0] }))} />
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <EngineCutaway e={e} />
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold">{info.name}</h4>
          <p className="text-ink-700 dark:text-ink-300">{info.principle}</p>
          <p><span className="font-semibold">Speed range: </span>{info.speed}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Strengths</div>
              <KeyPoints items={info.pros} />
            </div>
            <div>
              <div className="text-xs font-semibold text-red-700 dark:text-red-400">Limitations</div>
              <KeyPoints items={info.cons} />
            </div>
          </div>
          <p className="text-xs"><span className="font-semibold">Applications: </span>{info.apps}</p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Type</th>
              <th>Moving parts</th>
              <th>Static thrust?</th>
              <th>Best speed</th>
              <th>Typical use</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Piston/propeller', 'Many', 'Yes', 'Low', 'Light aircraft'],
              ['Turboprop', 'Turbine + gearbox', 'Yes', 'Low–medium', 'Regional aircraft'],
              ['Turbofan', 'Fan, compressor, turbine', 'Yes', 'High subsonic', 'Airliners'],
              ['Turbojet', 'Compressor, turbine', 'Yes', 'High subsonic–supersonic', 'Older jets, missiles'],
              ['Ramjet', 'None', 'No', 'Supersonic', 'Missiles'],
              ['Scramjet', 'None', 'No', 'Hypersonic', 'Research'],
              ['Rocket', 'Pumps (liquid) or none (solid)', 'Yes', 'Any, incl. space', 'Launch vehicles'],
            ].map((r) => (
              <tr key={r[0]}>
                {r.map((c, i) => (
                  <td key={i} className={cx(i === 0 && 'font-semibold', r[0].toLowerCase().startsWith(e.slice(0, 5)) && 'bg-sky-50 dark:bg-sky-950/30')}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function EngineCutaway({ e }: { e: Engine }) {
  const W = 620;
  const H = 240;
  const cy = 120;
  const flow = (y: number, x1: number, x2: number, c: string, key: string | number) => <line key={key} x1={x1} x2={x2} y1={y} y2={y} stroke={c} strokeWidth={2} className="flow-dash" />;
  const blades = (x: number, h: number, n: number, color: string) => Array.from({ length: n }, (_, i) => <rect key={i} x={x + i * 10} y={cy - h} width={4} height={2 * h} fill={color} opacity={0.8} />);
  const labelled = (x: number, y: number, t: string) => <Label x={x} y={y} size={10.5} weight={600} bg>{t}</Label>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label={`${e} engine cutaway`}>
      {e === 'piston' && (
        <g>
          <rect x={250} y={70} width={160} height={100} rx={10} fill="#cbd5e1" stroke={COL.ink} />
          <rect x={300} y={40} width={50} height={60} fill="#e2e8f0" stroke={COL.ink} />
          <rect x={308} y={70} width={34} height={30} fill="#94a3b8" stroke={COL.ink} />
          <line x1={325} y1={100} x2={335} y2={140} stroke={COL.ink} strokeWidth={4} />
          <circle cx={330} cy={145} r={12} fill="none" stroke={COL.ink} strokeWidth={3} />
          <line x1={330} y1={145} x2={200} y2={145} stroke={COL.ink} strokeWidth={5} />
          <ellipse cx={190} cy={145} rx={8} ry={70} fill="#94a3b8" stroke={COL.ink} />
          {[50, 90, 130, 170, 200].map((y, i) => flow(y, 20, 170, '#0ea5e9', i))}
          {labelled(190, 64, 'propeller')}
          {labelled(330, 30, 'cylinder & piston')}
          {labelled(330, 190, 'crankshaft')}
        </g>
      )}
      {(e === 'turbojet' || e === 'turbofan' || e === 'turboprop') && (
        <g>
          {e === 'turbofan' && (
            <>
              <path d={`M 60 ${cy - 90} L 420 ${cy - 80} L 420 ${cy + 80} L 60 ${cy + 90}`} fill="none" stroke={COL.ink} strokeWidth={2} />
              {blades(80, 85, 2, '#64748b')}
              {[cy - 70, cy - 55, cy + 55, cy + 70].map((y, i) => flow(y, 20, 520, '#38bdf8', i))}
              {labelled(90, cy - 98, 'fan')}
              {labelled(330, cy - 62, 'bypass air (most of the thrust)')}
            </>
          )}
          {e === 'turboprop' && (
            <>
              <ellipse cx={60} cy={cy} rx={8} ry={100} fill="#94a3b8" stroke={COL.ink} />
              <rect x={70} y={cy - 14} width={50} height={28} fill="#cbd5e1" stroke={COL.ink} />
              {[cy - 85, cy - 60, cy + 60, cy + 85].map((y, i) => flow(y, 0, 300, '#38bdf8', i))}
              {labelled(60, 14, 'propeller')}
              {labelled(95, cy + 34, 'gearbox')}
            </>
          )}
          <path d={`M 120 ${cy - 40} L 200 ${cy - 34} L 260 ${cy - 28} L 360 ${cy - 30} L 430 ${cy - 22} L 540 ${cy - 14} M 120 ${cy + 40} L 200 ${cy + 34} L 260 ${cy + 28} L 360 ${cy + 30} L 430 ${cy + 22} L 540 ${cy + 14}`} fill="none" stroke={COL.ink} strokeWidth={2} />
          <rect x={120} y={cy - 4} width={330} height={8} fill="#475569" />
          {blades(140, 32, 6, '#3b82f6')}
          <rect x={265} y={cy - 26} width={90} height={52} rx={10} fill="#f97316" opacity={0.35} />
          {blades(365, 26, 3, '#dc2626')}
          {flow(cy - 18, 20, 600, '#0ea5e9', 'c1')}
          {flow(cy + 18, 20, 600, '#0ea5e9', 'c2')}
          {flow(cy - 8, 270, 600, '#f97316', 'h1')}
          {flow(cy + 8, 270, 600, '#f97316', 'h2')}
          {labelled(170, cy + 56, 'compressor')}
          {labelled(310, cy + 56, 'combustor')}
          {labelled(385, cy + 50, 'turbine')}
          {labelled(500, cy + 40, 'nozzle')}
          <text x={300} y={H - 6} fontSize={10.5} textAnchor="middle" fill={COL.muted}>suck → squeeze → bang → blow; the turbine drives the compressor{e !== 'turbojet' ? (e === 'turbofan' ? ' and fan' : ' and propeller') : ''} via the shaft</text>
        </g>
      )}
      {(e === 'ramjet' || e === 'scramjet') && (
        <g>
          <path d={`M 40 ${cy - 20} L 200 ${cy - 60} L 420 ${cy - 60} L 580 ${cy - 80} M 40 ${cy + 20} L 200 ${cy + 60} L 420 ${cy + 60} L 580 ${cy + 80}`} fill="none" stroke={COL.ink} strokeWidth={2.5} />
          {e === 'ramjet' && <path d={`M 40 ${cy} L 150 ${cy} L 200 ${cy - 8} L 200 ${cy + 8} L 150 ${cy} Z`} fill="#94a3b8" stroke={COL.ink} />}
          {e === 'scramjet' && [100, 150].map((x) => <line key={x} x1={x} y1={cy - 30} x2={x + 40} y2={cy + 40} stroke="#8b5cf6" strokeWidth={1.5} />)}
          <rect x={230} y={cy - 50} width={150} height={100} fill="#f97316" opacity={0.3} />
          {[cy - 30, cy, cy + 30].map((y, i) => flow(y, 0, 600, i === 1 ? '#f97316' : '#0ea5e9', i))}
          {labelled(120, cy - 70, e === 'ramjet' ? 'inlet diffuser: ram compression to subsonic' : 'shock-wave compression (flow stays supersonic)')}
          {labelled(305, cy + 72, e === 'ramjet' ? 'subsonic combustion' : 'supersonic combustion')}
          {labelled(500, cy + 100, 'nozzle')}
          <text x={300} y={20} fontSize={11} textAnchor="middle" fill="#dc2626">No compressor or turbine — needs high forward speed to work</text>
        </g>
      )}
      {e === 'rocket' && (
        <g>
          <rect x={60} y={cy - 40} width={140} height={80} rx={8} fill="#bae6fd" stroke={COL.ink} />
          <rect x={210} y={cy - 40} width={140} height={80} rx={8} fill="#fed7aa" stroke={COL.ink} />
          <rect x={360} y={cy - 30} width={70} height={60} fill="#f97316" opacity={0.5} stroke={COL.ink} />
          <path d={`M 430 ${cy - 30} L 450 ${cy - 10} L 450 ${cy + 10} L 430 ${cy + 30} M 450 ${cy - 10} L 560 ${cy - 55} M 450 ${cy + 10} L 560 ${cy + 55}`} fill="none" stroke={COL.ink} strokeWidth={2} />
          {[cy - 20, cy, cy + 20].map((y, i) => flow(y, 440, 610, '#f97316', i))}
          {labelled(130, cy + 58, 'fuel')}
          {labelled(280, cy + 58, 'oxidiser')}
          {labelled(395, cy - 40, 'combustion chamber')}
          {labelled(510, cy + 72, 'convergent–divergent nozzle')}
        </g>
      )}
    </svg>
  );
}

// ───────────────────────── Pitot tube & altimeter ─────────────────────────
export function PitotAltimeter() {
  const [alt, setAlt] = useState(3000);
  const [ias, setIas] = useState(70);
  const p = isaPressure(alt);
  const rho = isaDensity(alt);
  const q = 0.5 * 1.225 * ias * ias; // indicated airspeed calibrated to sea-level density
  const tas = pitotSpeed(q, rho);
  const exp = (1 - p / 101325) * 26;
  const needle = ((alt % 1000) / 1000) * 360;
  return (
    <Card title="Pitot tube, airspeed indicator and altimeter" subtitle="International Standard Atmosphere (troposphere) model">
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <h4 className="mb-1 text-sm font-semibold">Pitot-static system → airspeed</h4>
          <svg viewBox="0 0 420 230" className="diagram" role="img" aria-label="Pitot-static airspeed indicator">
            {[40, 60, 80].map((y) => <Arrow key={y} x1={10} y1={y} x2={70} y2={y} color="#0ea5e9" w={1.2} head={6} />)}
            <rect x={80} y={52} width={150} height={16} rx={8} fill="#cbd5e1" stroke={COL.ink} />
            <circle cx={82} cy={60} r={3.5} fill={COL.load} />
            <rect x={170} y={50} width={5} height={3} fill={COL.reaction} />
            <rect x={170} y={67} width={5} height={3} fill={COL.reaction} />
            <path d="M 82 60 L 82 140 L 260 140" fill="none" stroke={COL.load} strokeWidth={2} />
            <path d="M 172 70 L 172 190 L 330 190 L 330 170" fill="none" stroke={COL.reaction} strokeWidth={2} />
            <rect x={260} y={110} width={140} height={60} rx={8} fill="none" stroke={COL.ink} />
            <path d={`M 290 125 q ${10 + q / 400} 15 0 30 q ${-6} -15 0 -30`} fill="#fde68a" stroke={COL.load} />
            <text x={330} y={128} fontSize={10} fill={COL.ink}>diaphragm</text>
            <text x={330} y={142} fontSize={10} fill={COL.ink}>inside: total p₀</text>
            <text x={330} y={156} fontSize={10} fill={COL.ink}>outside: static p</text>
            <text x={100} y={44} fontSize={10.5} fill={COL.load}>pitot (total)</text>
            <text x={180} y={86} fontSize={10.5} fill={COL.reaction}>static port</text>
            <text x={20} y={222} fontSize={10.5} fill={COL.muted}>Δp = p₀ − p = ½ρv² deflects the diaphragm → needle</text>
          </svg>
          <Slider label="Indicated airspeed" value={ias} min={20} max={150} unit="m/s" onChange={setIas} />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label="Dynamic pressure q" value={sig(q / 1000, 3)} unit="kPa" />
            <Stat label="IAS" value={fixed(ias * 1.94384, 0)} unit="kt" />
            <Stat label="True airspeed" value={fixed(tas * 1.94384, 0)} unit="kt" tone="blue" sub="corrected for density" />
          </div>
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold">Aneroid altimeter → height from static pressure</h4>
          <svg viewBox="0 0 420 230" className="diagram" role="img" aria-label="Altimeter with aneroid capsules">
            <circle cx={300} cy={110} r={90} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={2} />
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * 2 * Math.PI - Math.PI / 2;
              return (
                <g key={i}>
                  <line x1={300 + 78 * Math.cos(a)} y1={110 + 78 * Math.sin(a)} x2={300 + 88 * Math.cos(a)} y2={110 + 88 * Math.sin(a)} stroke={COL.ink} strokeWidth={2} />
                  <text x={300 + 64 * Math.cos(a)} y={114 + 64 * Math.sin(a)} fontSize={12} textAnchor="middle" fill={COL.ink}>{i}</text>
                </g>
              );
            })}
            <line x1={300} y1={110} x2={300 + 70 * Math.sin((needle * Math.PI) / 180)} y2={110 - 70 * Math.cos((needle * Math.PI) / 180)} stroke={COL.compression} strokeWidth={3} />
            <circle cx={300} cy={110} r={5} fill={COL.ink} />
            <text x={300} y={160} fontSize={10.5} textAnchor="middle" fill={COL.muted}>×100 m</text>
            {[0, 1, 2].map((k) => (
              <ellipse key={k} cx={90} cy={70 + k * 40} rx={50} ry={8 + exp * 0.35} fill="#fde68a" stroke={COL.load} />
            ))}
            <text x={90} y={200} fontSize={10.5} textAnchor="middle" fill={COL.ink}>sealed aneroid capsules</text>
            <text x={90} y={214} fontSize={10.5} textAnchor="middle" fill={COL.ink}>expand as static pressure falls</text>
          </svg>
          <Slider label="Altitude" value={alt} min={0} max={11000} step={100} unit="m" onChange={setAlt} />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label="Static pressure" value={sig(p / 1000, 4)} unit="kPa" tone="blue" />
            <Stat label="Air density" value={sig(rho, 3)} unit="kg/m³" />
            <Stat label="Altitude" value={fixed(alt * 3.28084, 0)} unit="ft" />
          </div>
        </div>
      </div>
      <Callout kind="assume" className="mt-3">ISA troposphere: p = 101.325 (1 − 2.25577×10⁻⁵ h)^5.25588 kPa. The ASI is calibrated with sea-level density, so true airspeed exceeds indicated airspeed at altitude. Incompressible pitot formula used (adequate below about Mach 0.3).</Callout>
    </Card>
  );
}

// ───────────────────────── Aircraft structure viewer ─────────────────────────
const PARTS: Record<string, { name: string; text: string }> = {
  skin: { name: 'Skin', text: 'Thin aluminium-alloy (or composite) sheet. In stressed-skin construction it carries shear, torsion and cabin pressurisation loads and forms the aerodynamic surface.' },
  frames: { name: 'Frames (formers)', text: 'Ring-shaped members that give the fuselage its cross-sectional shape and support the skin and stringers. Pressure bulkheads are solid frames that seal the cabin.' },
  stringers: { name: 'Stringers', text: 'Light longitudinal stiffeners attached to the skin. They carry axial (bending) loads and stop the thin skin buckling.' },
  longerons: { name: 'Longerons', text: 'Heavier longitudinal members (fewer than stringers) carrying the main bending loads along the fuselage, especially around cut-outs such as doors.' },
  spars: { name: 'Wing spars', text: 'The main span-wise beams of the wing. Spar caps (flanges) resist bending — upper cap in compression, lower cap in tension in flight — and the web resists shear.' },
  ribs: { name: 'Wing ribs', text: 'Chord-wise members that hold the aerofoil shape, transfer air loads from the skin to the spars and stabilise the skin and spars.' },
};

export function AircraftStructure() {
  const [sel, setSel] = useState('stringers');
  const hl = (k: string) => (sel === k ? '#f59e0b' : undefined);
  return (
    <Card title="Aircraft structural components" subtitle="Click a component — semi-monocoque (stressed-skin) construction">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <svg viewBox="0 0 640 300" className="diagram" role="img" aria-label="Cutaway of semi-monocoque fuselage and wing box">
          {/* fuselage cutaway: frames as ellipses along x */}
          <g onClick={() => setSel('skin')} className="cursor-pointer">
            <path d="M 40 150 C 60 70, 120 60, 200 62 L 520 62 C 580 66, 610 120, 620 150 C 610 180, 580 236, 520 238 L 200 238 C 120 240, 60 230, 40 150 Z" fill={hl('skin') ?? '#e2e8f0'} fillOpacity={0.5} stroke={COL.ink} strokeWidth={1.5} />
          </g>
          <g onClick={() => setSel('frames')} className="cursor-pointer">
            {[150, 220, 290, 360, 430, 500].map((x) => (
              <ellipse key={x} cx={x} cy={150} rx={16} ry={86} fill="none" stroke={hl('frames') ?? COL.aero} strokeWidth={4} />
            ))}
          </g>
          <g onClick={() => setSel('stringers')} className="cursor-pointer">
            {[-70, -45, -20, 20, 45, 70].map((dy) => (
              <line key={dy} x1={120} x2={540} y1={150 + dy} y2={150 + dy} stroke={hl('stringers') ?? '#64748b'} strokeWidth={2.5} />
            ))}
          </g>
          <g onClick={() => setSel('longerons')} className="cursor-pointer">
            {[-84, 84].map((dy) => (
              <line key={dy} x1={110} x2={550} y1={150 + dy} y2={150 + dy} stroke={hl('longerons') ?? '#0f172a'} strokeWidth={5} />
            ))}
          </g>
          <text x={330} y={30} fontSize={11.5} textAnchor="middle" fontWeight={600} fill={COL.ink}>Fuselage (side cutaway)</text>
          <text x={330} y={270} fontSize={10.5} textAnchor="middle" fill={COL.muted}>Click the skin, frames, stringers or longerons — or a wing component below</text>
          {/* wing box inset */}
          <g transform="translate(150 255) scale(0.55)">
            <rect x={0} y={0} width={10} height={1} fill="none" />
          </g>
        </svg>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(PARTS).map((k) => (
              <button key={k} className={cx('chip', sel === k ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'border-ink-200 dark:border-ink-700')} onClick={() => setSel(k)}>
                {PARTS[k].name}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
            <div className="font-semibold">{PARTS[sel].name}</div>
            <p className="mt-1">{PARTS[sel].text}</p>
          </div>
        </div>
      </div>
      <WingBox sel={sel} onSel={setSel} />
      <div className="mt-4 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Construction</th>
              <th>How loads are carried</th>
              <th>Advantages</th>
              <th>Disadvantages</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="font-semibold">Truss (frame) + fabric</td><td>Welded steel-tube or timber truss carries loads; fabric covering carries none</td><td>Simple, easy to repair</td><td>Draggy shape, little internal space, low strength-to-weight at large size</td></tr>
            <tr><td className="font-semibold">Monocoque</td><td>Skin carries all loads (like an egg shell)</td><td>Smooth, roomy interior</td><td>Thick, heavy skin needed to resist buckling; dents weaken it</td></tr>
            <tr><td className="font-semibold">Semi-monocoque (stressed skin)</td><td>Skin + frames + stringers + longerons share loads</td><td>High strength-to-weight, damage tolerant (multiple load paths), roomy</td><td>Many parts and fasteners; fatigue and corrosion inspection needed</td></tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function WingBox({ sel, onSel }: { sel: string; onSel: (k: string) => void }) {
  return (
    <svg viewBox="0 0 640 170" className="diagram mt-2" role="img" aria-label="Wing structure with spars and ribs">
      <text x={20} y={18} fontSize={11.5} fontWeight={600} fill={COL.ink}>Wing structure (plan view of a section)</text>
      <path d="M 60 40 L 600 70 L 600 140 L 60 150 Z" fill="#e2e8f0" fillOpacity={0.4} stroke={COL.ink} />
      <g onClick={() => onSel('spars')} className="cursor-pointer">
        <line x1={60} y1={65} x2={600} y2={86} stroke={sel === 'spars' ? '#f59e0b' : '#0f172a'} strokeWidth={6} />
        <line x1={60} y1={125} x2={600} y2={125} stroke={sel === 'spars' ? '#f59e0b' : '#0f172a'} strokeWidth={6} />
        <text x={608} y={90} fontSize={10} fill={COL.ink}>front spar</text>
        <text x={608} y={129} fontSize={10} fill={COL.ink}>rear spar</text>
      </g>
      <g onClick={() => onSel('ribs')} className="cursor-pointer">
        {[110, 190, 270, 350, 430, 510, 580].map((x) => (
          <line key={x} x1={x} x2={x} y1={42 + ((x - 60) / 540) * 30} y2={150 - ((x - 60) / 540) * 10} stroke={sel === 'ribs' ? '#f59e0b' : COL.aero} strokeWidth={3} />
        ))}
      </g>
      <text x={330} y={166} fontSize={10.5} textAnchor="middle" fill={COL.muted}>In flight the wing bends upward: upper skin/spar caps in compression, lower in tension (σ = My/I)</text>
    </svg>
  );
}

// ───────────────────────── Aircraft hydraulic system ─────────────────────────
export function AircraftHydraulics() {
  const [down, setDown] = useState(true);
  return (
    <Card title="Aircraft hydraulic system (landing-gear actuator)" subtitle="Pascal’s principle: pressure from the pump is transmitted to every actuator" actions={<button className="btn text-xs" onClick={() => setDown((d) => !d)}>Selector: gear {down ? 'UP' : 'DOWN'}</button>}>
      <svg viewBox="0 0 640 220" className="diagram" role="img" aria-label="Simplified aircraft hydraulic circuit">
        {[
          { x: 30, t: 'Reservoir' },
          { x: 150, t: 'Engine-driven pump' },
          { x: 270, t: 'Filter' },
          { x: 380, t: 'Accumulator' },
          { x: 490, t: 'Selector valve' },
        ].map((b) => (
          <g key={b.t}>
            <rect x={b.x} y={40} width={92} height={40} rx={6} fill="var(--diagram-bg)" stroke={COL.aero} />
            <text x={b.x + 46} y={64} fontSize={10.5} textAnchor="middle" fill={COL.ink}>{b.t}</text>
          </g>
        ))}
        {[122, 242, 362, 472].map((x) => <line key={x} x1={x} x2={x + 28} y1={60} y2={60} stroke="#dc2626" strokeWidth={3} className="flow-dash" />)}
        <line x1={536} y1={80} x2={536} y2={130} stroke="#dc2626" strokeWidth={3} className="flow-dash" />
        <rect x={420} y={130} width={200} height={40} rx={4} fill="none" stroke={COL.ink} strokeWidth={2} />
        <rect x={down ? 560 : 440} y={132} width={10} height={36} fill={COL.ink} />
        <line x1={down ? 570 : 450} x2={down ? 640 : 520} y1={150} y2={150} stroke={COL.ink} strokeWidth={5} />
        <rect x={down ? 425 : 455} y={133} width={down ? 133 : 163} height={34} fill="#dc2626" opacity={0.15} />
        <text x={520} y={190} fontSize={10.5} textAnchor="middle" fill={COL.ink}>actuator: piston moves {down ? 'out → gear down' : 'in → gear up'}</text>
        <path d="M 420 150 L 76 150 L 76 80" fill="none" stroke="#2563eb" strokeWidth={2.5} className="flow-dash" />
        <text x={240} y={144} fontSize={10.5} fill="#2563eb">return line (low pressure)</text>
        <text x={320} y={24} fontSize={10.5} textAnchor="middle" fill={COL.muted}>Typical airliner systems operate at ≈ 21 MPa (3000 psi); some newer aircraft use ≈ 35 MPa (5000 psi)</text>
      </svg>
      <KeyPoints items={['Hydraulic fluid is nearly incompressible, so force is transmitted instantly through small, light pipes.', 'Small pump/actuator areas at high pressure produce very large forces: F = pA.', 'Uses: landing gear, flaps and slats, flight-control actuators, brakes, nose-wheel steering.', 'Redundancy: airliners have two or three independent hydraulic systems for safety.']} />
    </Card>
  );
}
