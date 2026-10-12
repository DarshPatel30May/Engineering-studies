import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { g, horizontalPush, incline, machineVR, type MachineKind } from '@/lib/calc/transport';
import { sig, fixed, parseNum } from '@/lib/calc/format';
import { Arrow, Label, COL, Hatch } from '../diagrams/svg';
import { Card, Slider, Stat, M, Tabs, Callout, Badge, NumField, ErrorList } from '../ui';

const deg = Math.PI / 180;

// ───────────────────────── Friction ─────────────────────────
export function FrictionSim() {
  const [mode, setMode] = useState<'flat' | 'incline'>('incline');
  return (
    <Card title="Friction simulator" subtitle="Coulomb (dry) friction model: friction resists up to μN, independent of contact area">
      <Tabs
        value={mode}
        onChange={setMode}
        className="mb-4"
        tabs={[
          { id: 'incline', label: 'Inclined plane & angle of repose' },
          { id: 'flat', label: 'Pushing on a level surface' },
        ]}
      />
      {mode === 'incline' ? <InclineSim /> : <FlatSim />}
    </Card>
  );
}

function InclineSim() {
  const [m, setM] = useState(20);
  const [th, setTh] = useState(20);
  const [mu, setMu] = useState(0.45);
  const r = incline(m, th, mu);
  const repose = Math.atan(mu) / deg;
  const W = 640;
  const H = 330;
  const base = { x: 80, y: 280 };
  const Lr = 460;
  const top = { x: base.x + Lr * Math.cos(th * deg), y: base.y - Lr * Math.sin(th * deg) };
  const t = 0.55;
  const bc = { x: base.x + Lr * t * Math.cos(th * deg), y: base.y - Lr * t * Math.sin(th * deg) };
  const ux = Math.cos(th * deg);
  const uy = -Math.sin(th * deg);
  const nx = Math.sin(th * deg);
  const ny = Math.cos(th * deg);
  const bw = 70;
  const bh = 44;
  const centre = { x: bc.x - nx * bh * 0.5, y: bc.y - ny * bh * 0.5 };
  const k = 1.1 / Math.max(1, (m * g) / 120);
  const corner = (a: number, b: number) => `${bc.x + ux * a - nx * b},${bc.y + uy * a - ny * b}`;
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Block on an inclined plane with free-body diagram">
          <polygon points={`${base.x},${base.y} ${top.x},${top.y} ${top.x},${base.y}`} fill={COL.muted} opacity={0.15} stroke={COL.ink} />
          <Hatch x={base.x - 20} y={base.y} w={top.x - base.x + 40} />
          <path d={`M ${base.x + 60} ${base.y} A 60 60 0 0 0 ${base.x + 60 * Math.cos(th * deg)} ${base.y - 60 * Math.sin(th * deg)}`} fill="none" stroke={COL.ink} />
          <text x={base.x + 70} y={base.y - 8} fontSize={12} fill={COL.ink}>
            θ = {th}°
          </text>
          <polygon points={`${corner(-bw / 2, 0)} ${corner(bw / 2, 0)} ${corner(bw / 2, bh)} ${corner(-bw / 2, bh)}`} fill="#0ea5e9" opacity={r.slides ? 0.55 : 0.35} stroke="#0284c7" strokeWidth={1.5} />
          {/* Weight */}
          <Arrow x1={centre.x} y1={centre.y} x2={centre.x} y2={centre.y + m * g * k} color={COL.ink} w={2.4} />
          <Label x={centre.x + 6} y={centre.y + m * g * k + 14} anchor="start" size={11} weight={700} bg>
            W = mg = {sig(r.W, 4)} N
          </Label>
          {/* Normal */}
          <Arrow x1={bc.x - nx * bh} y1={bc.y - ny * bh} x2={bc.x - nx * (bh + r.N * k)} y2={bc.y - ny * (bh + r.N * k)} color={COL.reaction} w={2.4} />
          <Label x={bc.x - nx * (bh + r.N * k) - 6} y={bc.y - ny * (bh + r.N * k) - 4} anchor="end" size={11} weight={700} color={COL.reaction} bg>
            N = {sig(r.N, 4)} N
          </Label>
          {/* Friction up slope at contact */}
          <Arrow x1={bc.x - ux * bw * 0.5} y1={bc.y - uy * bw * 0.5 - 2} x2={bc.x - ux * bw * 0.5 + ux * r.friction * k} y2={bc.y - uy * bw * 0.5 + uy * r.friction * k - 2} color={COL.compression} w={2.4} />
          <Label x={bc.x - ux * bw * 0.5 + ux * r.friction * k + 6} y={bc.y - uy * bw * 0.5 + uy * r.friction * k + 14} anchor="start" size={11} weight={700} color={COL.compression} bg>
            F = {sig(r.friction, 4)} N {r.slides ? '(limiting)' : ''}
          </Label>
          {/* Component down slope */}
          <Arrow x1={centre.x} y1={centre.y} x2={centre.x - ux * r.down * k} y2={centre.y - uy * r.down * k} color={COL.load} w={1.8} dashed />
          <Label x={centre.x - ux * r.down * k - 4} y={centre.y - uy * r.down * k + 16} anchor="end" size={10.5} color={COL.load} bg>
            mg sin θ = {sig(r.down, 4)} N
          </Label>
        </svg>
        <ReposeChart mu={mu} th={th} />
      </div>
      <div className="space-y-3">
        <Slider label="Mass m" value={m} min={1} max={60} unit="kg" onChange={setM} />
        <Slider label="Incline angle θ" value={th} min={0} max={60} unit="°" onChange={setTh} />
        <Slider label="Coefficient of static friction μs" value={mu} min={0.05} max={1.2} step={0.01} onChange={setMu} />
        <Badge tone={r.slides ? 'red' : 'emerald'}>{r.slides ? 'Slides — mg sin θ > μN' : 'Stays at rest — friction balances mg sin θ'}</Badge>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Limiting friction μN" value={sig(r.Fmax, 4)} unit="N" />
          <Stat label="Angle of repose" value={fixed(repose, 1)} unit="°" tone="blue" sub="tan θ = μ" />
          {r.slides && <Stat label="Net force" value={sig(r.net, 4)} unit="N" tone="red" sub="(using μk = μs)" />}
        </div>
        <div className="rounded-lg bg-ink-50 p-2 dark:bg-ink-950/50">
          <M block>{`N = mg\\cos\\theta = ${sig(r.N, 4)}\\ \\text{N}`}</M>
          <M block>{`F_{\\max} = \\mu N = ${sig(r.Fmax, 4)}\\ \\text{N}`}</M>
          <M block>{`\\theta_{\\text{repose}} = \\tan^{-1}\\mu = ${fixed(repose, 2)}^\\circ`}</M>
        </div>
        <Callout kind="assume">Rigid block, uniform μ. When sliding, kinetic friction is taken equal to static here for simplicity (in reality μk is a little lower).</Callout>
      </div>
    </div>
  );
}

function ReposeChart({ mu, th }: { mu: number; th: number }) {
  const W = 640;
  const H = 150;
  const X = (a: number) => 50 + (a / 60) * (W - 70);
  const Y = (v: number) => H - 26 - v * (H - 46);
  const pts = (f: (a: number) => number) => Array.from({ length: 61 }, (_, a) => `${X(a)},${Y(f(a))}`).join(' ');
  const rep = Math.atan(mu) / deg;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diagram mt-1" aria-label="Friction needed versus available as the slope increases">
      <line x1={50} x2={W - 20} y1={H - 26} y2={H - 26} stroke={COL.ink} />
      <line x1={50} x2={50} y1={14} y2={H - 26} stroke={COL.ink} />
      <polyline points={pts((a) => Math.sin(a * deg))} fill="none" stroke={COL.load} strokeWidth={2} />
      <polyline points={pts((a) => Math.min(1.2, mu * Math.cos(a * deg)))} fill="none" stroke={COL.reaction} strokeWidth={2} />
      {rep <= 60 && <line x1={X(rep)} x2={X(rep)} y1={14} y2={H - 26} stroke="#0ea5e9" strokeDasharray="4 3" />}
      <line x1={X(th)} x2={X(th)} y1={14} y2={H - 26} stroke={COL.ink} strokeWidth={1.5} />
      {[0, 15, 30, 45, 60].map((a) => (
        <text key={a} x={X(a)} y={H - 10} fontSize={10} textAnchor="middle" fill={COL.muted}>
          {a}°
        </text>
      ))}
      <text x={56} y={22} fontSize={10.5} fill={COL.load}>
        friction needed ∝ sin θ
      </text>
      <text x={56} y={36} fontSize={10.5} fill={COL.reaction}>
        friction available ∝ μ cos θ
      </text>
      {rep <= 60 && (
        <text x={X(rep) + 4} y={H - 32} fontSize={10.5} fill="#0284c7">
          angle of repose
        </text>
      )}
    </svg>
  );
}

function FlatSim() {
  const [m, setM] = useState(40);
  const [P, setP] = useState(100);
  const [al, setAl] = useState(0);
  const [mus, setMus] = useState(0.4);
  const [muk, setMuk] = useState(0.3);
  const r = horizontalPush(m, P, al, mus);
  const kineticF = muk * r.N;
  const net = r.slides && !r.lifts ? r.Ph - kineticF : 0;
  const W = 640;
  const H = 240;
  const k = 0.32;
  const bx = 300;
  const by = 170;
  const graphMax = Math.max(1, mus * m * g * 1.6);
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Block pushed along a level surface">
          <Hatch x={40} y={by} w={W - 80} />
          <rect x={bx - 50} y={by - 60} width={100} height={60} fill="#0ea5e9" opacity={0.35} stroke="#0284c7" />
          <Arrow x1={bx} y1={by - 30} x2={bx} y2={by - 30 + r.W * k * 0.6} color={COL.ink} w={2.2} />
          <Label x={bx + 6} y={by - 30 + r.W * k * 0.6 + 12} anchor="start" size={11} weight={700} bg>W = {sig(r.W, 4)} N</Label>
          <Arrow x1={bx + 30} y1={by} x2={bx + 30} y2={by - r.N * k * 0.6} color={COL.reaction} w={2.2} />
          <Label x={bx + 36} y={by - r.N * k * 0.6} anchor="start" size={11} weight={700} color={COL.reaction} bg>N = {sig(r.N, 4)} N</Label>
          <Arrow x1={bx - 50 - P * k * Math.cos(al * deg)} y1={by - 30 + P * k * Math.sin(al * deg)} x2={bx - 50} y2={by - 30} color={COL.load} w={2.6} />
          <Label x={bx - 54 - P * k * Math.cos(al * deg)} y={by - 36 + P * k * Math.sin(al * deg)} anchor="end" size={11} weight={700} color={COL.load} bg>P = {P} N</Label>
          {(r.slides ? kineticF : r.friction) > 0 && (
            <Arrow x1={bx + 50} y1={by - 3} x2={bx + 50 + (r.slides ? kineticF : r.friction) * k} y2={by - 3} color={COL.compression} w={2.4} />
          )}
          <Label x={bx + 54 + (r.slides ? kineticF : r.friction) * k} y={by - 8} anchor="start" size={11} weight={700} color={COL.compression} bg>
            F = {sig(r.slides ? kineticF : r.friction, 4)} N
          </Label>
        </svg>
        <svg viewBox={`0 0 ${W} 170`} className="diagram" aria-label="Friction force versus applied force graph">
          {(() => {
            const X = (v: number) => 50 + (v / graphMax) * (W - 80);
            const Y = (v: number) => 140 - (v / graphMax) * 120;
            const lim = mus * r.N;
            return (
              <g>
                <line x1={50} x2={W - 20} y1={140} y2={140} stroke={COL.ink} />
                <line x1={50} x2={50} y1={14} y2={140} stroke={COL.ink} />
                <polyline points={`${X(0)},${Y(0)} ${X(lim)},${Y(lim)} ${X(lim)},${Y(muk * r.N)} ${X(graphMax)},${Y(muk * r.N)}`} fill="none" stroke={COL.compression} strokeWidth={2.4} />
                <circle cx={X(Math.min(graphMax, r.Ph))} cy={Y(r.slides ? muk * r.N : r.Ph)} r={6} fill="#10b981" />
                <text x={X(lim)} y={Y(lim) - 6} fontSize={10.5} textAnchor="middle" fill={COL.ink}>limiting μsN</text>
                <text x={W - 24} y={Y(muk * r.N) - 6} fontSize={10.5} textAnchor="end" fill={COL.ink}>kinetic μkN</text>
                <text x={(W + 50) / 2} y={162} fontSize={11} textAnchor="middle" fill={COL.muted}>Applied horizontal force P cos α (N)</text>
                <text x={56} y={24} fontSize={11} fill={COL.muted}>Friction (N)</text>
                <text x={56} y={40} fontSize={10} fill={COL.muted}>static: friction = applied force</text>
              </g>
            );
          })()}
        </svg>
      </div>
      <div className="space-y-3">
        <Slider label="Mass m" value={m} min={1} max={100} unit="kg" onChange={setM} />
        <Slider label="Applied force P" value={P} min={0} max={500} step={5} unit="N" onChange={setP} />
        <Slider label="Angle of P above horizontal α" value={al} min={0} max={60} unit="°" onChange={setAl} />
        <Slider label="μs (static)" value={mus} min={0.05} max={1} step={0.01} onChange={(v) => (setMus(v), setMuk((k) => Math.min(k, v)))} />
        <Slider label="μk (kinetic, ≤ μs)" value={muk} min={0.02} max={mus} step={0.01} onChange={setMuk} />
        <Badge tone={r.slides ? 'red' : 'emerald'}>{r.lifts ? 'Block lifts off (N = 0)' : r.slides ? 'Sliding' : 'Static — friction equals P cos α'}</Badge>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Limiting friction" value={sig(mus * r.N, 4)} unit="N" />
          <Stat label="Acceleration" value={sig(net / m, 3)} unit="m/s²" />
        </div>
        <M block>{`N = mg - P\\sin\\alpha = ${sig(r.N, 4)}\\ \\text{N}`}</M>
        <p className="prose-only text-xs text-ink-500">Pulling upward at an angle reduces N, which reduces the friction you must overcome — that is why it is easier to pull a sled with a rope angled upward.</p>
      </div>
    </div>
  );
}

// ───────────────────────── Simple machines ─────────────────────────
export function MachineSim() {
  const [kind, setKind] = useState<MachineKind>('pulley');
  const [load, setLoad] = useState(800);
  const [eta, setEta] = useState(80);
  const [p, setP] = useState<Record<string, number>>({ effortArm: 1.2, loadArm: 0.3, ropes: 4, driverTeeth: 12, drivenTeeth: 36, length: 5, height: 1, wheelD: 400, axleD: 80 });
  const [move, setMove] = useState(0.5);
  const VR = machineVR(kind, p);
  const MA = (VR * eta) / 100;
  const effort = load / MA;
  const dE = move;
  const dL = dE / VR;
  const set = (k: string, v: number) => setP((q) => ({ ...q, [k]: v }));
  return (
    <Card title="Simple machine simulator" subtitle="Trade distance for force: MA = L/E, VR = dE/dL, η = MA/VR">
      <Tabs
        size="sm"
        value={kind}
        onChange={(k) => setKind(k as MachineKind)}
        className="mb-4"
        tabs={[
          { id: 'pulley', label: 'Pulley block' },
          { id: 'lever', label: 'Lever' },
          { id: 'gears', label: 'Gear train' },
          { id: 'incline', label: 'Inclined plane' },
          { id: 'wheel-axle', label: 'Wheel & axle' },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <MachineDiagram kind={kind} p={p} load={load} effort={effort} move={move} VR={VR} />
        <div className="space-y-3">
          {kind === 'pulley' && <Slider label="Rope segments supporting the moving block" value={p.ropes} min={1} max={6} onChange={(v) => set('ropes', v)} />}
          {kind === 'lever' && (
            <>
              <Slider label="Effort arm (from fulcrum)" value={p.effortArm} min={0.1} max={2} step={0.05} unit="m" onChange={(v) => set('effortArm', v)} />
              <Slider label="Load arm (from fulcrum)" value={p.loadArm} min={0.1} max={2} step={0.05} unit="m" onChange={(v) => set('loadArm', v)} />
            </>
          )}
          {kind === 'gears' && (
            <>
              <Slider label="Driver teeth (effort side)" value={p.driverTeeth} min={8} max={60} onChange={(v) => set('driverTeeth', v)} />
              <Slider label="Driven teeth (load side)" value={p.drivenTeeth} min={8} max={60} onChange={(v) => set('drivenTeeth', v)} />
            </>
          )}
          {kind === 'incline' && (
            <>
              <Slider label="Slope length" value={p.length} min={1} max={10} step={0.5} unit="m" onChange={(v) => set('length', Math.max(v, p.height + 0.1))} />
              <Slider label="Height raised" value={p.height} min={0.2} max={5} step={0.1} unit="m" onChange={(v) => set('height', Math.min(v, p.length - 0.1))} />
            </>
          )}
          {kind === 'wheel-axle' && (
            <>
              <Slider label="Wheel diameter" value={p.wheelD} min={100} max={800} step={10} unit="mm" onChange={(v) => set('wheelD', v)} />
              <Slider label="Axle diameter" value={p.axleD} min={20} max={200} step={5} unit="mm" onChange={(v) => set('axleD', v)} />
            </>
          )}
          <Slider label="Load" value={load} min={50} max={2000} step={50} unit="N" onChange={setLoad} />
          <Slider label="Efficiency η (friction losses)" value={eta} min={30} max={100} unit="%" onChange={setEta} />
          <Slider label="Move the effort by" value={move} min={0} max={2} step={0.05} unit="m" onChange={setMove} />
          <div className="grid grid-cols-3 gap-2">
            <Stat label="VR" value={sig(VR, 3)} />
            <Stat label="MA" value={sig(MA, 3)} tone="blue" />
            <Stat label="Effort" value={sig(effort, 4)} unit="N" tone="emerald" />
          </div>
          <div className="rounded-lg bg-ink-50 p-2 text-sm dark:bg-ink-950/50">
            <M block>{`W_{in} = E\\,d_E = ${sig(effort, 4)}\\times${sig(dE, 3)} = ${sig(effort * dE, 4)}\\ \\text{J}`}</M>
            <M block>{`W_{out} = L\\,d_L = ${load}\\times${sig(dL, 3)} = ${sig(load * dL, 4)}\\ \\text{J}`}</M>
            <M block>{`\\eta = \\dfrac{W_{out}}{W_{in}} = ${sig(eta, 3)}\\%`}</M>
          </div>
          <Callout kind="assume">VR is fixed by geometry. Efficiency here is set by you to represent friction; MA = η × VR. Gear VR assumes the effort turns the driver gear.</Callout>
        </div>
      </div>
    </Card>
  );
}

function MachineDiagram({ kind, p, load, effort, move, VR }: { kind: MachineKind; p: Record<string, number>; load: number; effort: number; move: number; VR: number }) {
  const W = 600;
  const H = 340;
  if (kind === 'pulley') {
    const n = p.ropes;
    const lift = (move / VR) * 60;
    const fixedY = 40;
    const movY = 200 - lift;
    const cxs = Array.from({ length: Math.ceil(n / 2) }, (_, i) => 220 + i * 70);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label={`Pulley block with ${n} supporting ropes`}>
        <rect x={160} y={18} width={300} height={10} fill={COL.ink} />
        {cxs.map((x) => (
          <g key={x}>
            <circle cx={x + 17} cy={fixedY + 22} r={20} fill="none" stroke={COL.ink} strokeWidth={2} />
            <line x1={x + 17} x2={x + 17} y1={28} y2={fixedY + 22} stroke={COL.ink} />
          </g>
        ))}
        {Array.from({ length: n }, (_, i) => {
          const x = 200 + i * 35;
          return <line key={i} x1={x} x2={x} y1={fixedY + 22} y2={movY} stroke={COL.tension} strokeWidth={2.4} />;
        })}
        <rect x={190} y={movY} width={Math.max(40, (n - 1) * 35 + 20)} height={16} rx={4} fill={COL.muted} opacity={0.5} />
        <rect x={190 + Math.max(40, (n - 1) * 35 + 20) / 2 - 35} y={movY + 30} width={70} height={46} rx={4} fill={COL.load} opacity={0.3} stroke={COL.load} />
        <line x1={190 + Math.max(40, (n - 1) * 35 + 20) / 2} x2={190 + Math.max(40, (n - 1) * 35 + 20) / 2} y1={movY + 16} y2={movY + 30} stroke={COL.ink} />
        <text x={190 + Math.max(40, (n - 1) * 35 + 20) / 2} y={movY + 58} fontSize={12} fontWeight={700} textAnchor="middle" fill={COL.ink}>{load} N</text>
        <line x1={200 + n * 35} x2={200 + n * 35} y1={fixedY + 22} y2={250 + move * 40} stroke={COL.tension} strokeWidth={2.4} strokeDasharray="1 0" />
        <Arrow x1={200 + n * 35} y1={250 + move * 40} x2={200 + n * 35} y2={300 + move * 40 > 330 ? 330 : 300 + move * 40} color={COL.reaction} w={2.6} />
        <Label x={210 + n * 35} y={280} anchor="start" color={COL.reaction} weight={700} bg>Effort {sig(effort, 4)} N</Label>
        <text x={20} y={H - 14} fontSize={11} fill={COL.muted}>{n} rope segments support the moving block → VR = {n}. Effort moves {sig(move, 3)} m, load rises {sig(move / VR, 3)} m.</text>
      </svg>
    );
  }
  if (kind === 'lever') {
    const total = p.effortArm + p.loadArm;
    const s = 420 / total;
    const fx = 90 + p.loadArm * s;
    const ang = Math.min(0.25, move * 0.12);
    const yAt = (x: number) => 200 + (x - fx) * Math.tan(ang);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="First-class lever">
        <polygon points={`${fx},${210} ${fx - 22},${250} ${fx + 22},${250}`} fill={COL.muted} opacity={0.5} stroke={COL.ink} />
        <Hatch x={fx - 40} y={250} w={80} />
        <line x1={90} y1={yAt(90)} x2={90 + total * s} y2={yAt(90 + total * s)} stroke={COL.ink} strokeWidth={6} strokeLinecap="round" />
        <rect x={70} y={yAt(90) - 48} width={40} height={40} fill={COL.load} opacity={0.35} stroke={COL.load} />
        <text x={90} y={yAt(90) - 54} fontSize={12} fontWeight={700} textAnchor="middle" fill={COL.ink}>{load} N</text>
        <Arrow x1={90 + total * s} y1={yAt(90 + total * s) - 70} x2={90 + total * s} y2={yAt(90 + total * s) - 6} color={COL.reaction} w={2.6} />
        <Label x={90 + total * s} y={yAt(90 + total * s) - 78} color={COL.reaction} weight={700} bg>E = {sig(effort, 4)} N</Label>
        <line x1={90} x2={fx} y1={290} y2={290} stroke={COL.muted} />
        <line x1={fx} x2={90 + total * s} y1={305} y2={305} stroke={COL.muted} />
        <text x={(90 + fx) / 2} y={284} fontSize={11} textAnchor="middle" fill={COL.ink}>load arm {p.loadArm} m</text>
        <text x={(fx + 90 + total * s) / 2} y={320} fontSize={11} textAnchor="middle" fill={COL.ink}>effort arm {p.effortArm} m</text>
        <text x={20} y={30} fontSize={11} fill={COL.muted}>Moments about the fulcrum (ideal): E × effort arm = L × load arm → VR = effort arm ÷ load arm</text>
      </svg>
    );
  }
  if (kind === 'gears') {
    const r1 = p.driverTeeth * 2.4;
    const r2 = p.drivenTeeth * 2.4;
    const c1 = { x: 170, y: 170 };
    const c2 = { x: 170 + r1 + r2 + 4, y: 170 };
    const rot1 = (move / 0.1) * 30;
    const rot2 = (-rot1 * p.driverTeeth) / p.drivenTeeth;
    const gear = (cx: number, cy: number, r: number, teeth: number, rot: number, color: string) => {
      const pts: string[] = [];
      for (let i = 0; i < teeth * 2; i++) {
        const a = ((i / (teeth * 2)) * 360 + rot) * deg;
        const rr = i % 2 === 0 ? r + 4 : r - 4;
        pts.push(`${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`);
      }
      return (
        <g>
          <polygon points={pts.join(' ')} fill={color} opacity={0.25} stroke={color} strokeWidth={1.5} />
          <circle cx={cx} cy={cy} r={5} fill={COL.ink} />
          <line x1={cx} y1={cy} x2={cx + (r - 10) * Math.cos(rot * deg)} y2={cy + (r - 10) * Math.sin(rot * deg)} stroke={COL.ink} strokeWidth={2} />
        </g>
      );
    };
    return (
      <svg viewBox={`0 0 ${Math.max(W, c2.x + r2 + 30)} ${H}`} className="diagram" role="img" aria-label="Simple gear train">
        {gear(c1.x, c1.y, r1, p.driverTeeth, rot1, '#10b981')}
        {gear(c2.x, c2.y, r2, p.drivenTeeth, rot2, COL.load)}
        <text x={c1.x} y={c1.y + r1 + 28} fontSize={12} textAnchor="middle" fill={COL.ink}>Driver: {p.driverTeeth} T (effort)</text>
        <text x={c2.x} y={c2.y + r2 + 28} fontSize={12} textAnchor="middle" fill={COL.ink}>Driven: {p.drivenTeeth} T (load)</text>
        <text x={20} y={24} fontSize={11} fill={COL.muted}>VR = driven ÷ driver = {p.drivenTeeth} ÷ {p.driverTeeth}. Gears turn in opposite directions; the larger gear turns slower with more torque.</text>
      </svg>
    );
  }
  if (kind === 'incline') {
    const s = 420 / p.length;
    const L = p.length * s;
    const hh = p.height * s;
    const run = Math.sqrt(Math.max(0, L * L - hh * hh));
    const base = { x: 80, y: 290 };
    const t = Math.min(1, 0.2 + move / 2.5);
    const pos = { x: base.x + run * t, y: base.y - hh * t };
    const ang = Math.atan2(hh, run);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Inclined plane">
        <polygon points={`${base.x},${base.y} ${base.x + run},${base.y - hh} ${base.x + run},${base.y}`} fill={COL.muted} opacity={0.2} stroke={COL.ink} />
        <g transform={`translate(${pos.x} ${pos.y}) rotate(${(-ang * 180) / Math.PI})`}>
          <rect x={-25} y={-36} width={50} height={36} fill={COL.load} opacity={0.35} stroke={COL.load} />
          <Arrow x1={-90} y1={-18} x2={-27} y2={-18} color={COL.reaction} w={2.6} />
        </g>
        <text x={base.x + run / 2 - 20} y={base.y - hh / 2 - 20} fontSize={12} fill={COL.ink}>L = {p.length} m</text>
        <text x={base.x + run + 8} y={base.y - hh / 2} fontSize={12} fill={COL.ink}>h = {p.height} m</text>
        <text x={20} y={24} fontSize={11} fill={COL.muted}>Pushing {p.length} m along the slope raises the load only {p.height} m → VR = L/h = {sig(p.length / p.height, 3)}</text>
      </svg>
    );
  }
  const rw = p.wheelD / 4;
  const ra = p.axleD / 4;
  const rot = move * 120;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Wheel and axle">
      <circle cx={240} cy={150} r={rw} fill="none" stroke="#10b981" strokeWidth={3} />
      <circle cx={240} cy={150} r={ra} fill={COL.load} opacity={0.3} stroke={COL.load} strokeWidth={2} />
      <line x1={240} y1={150} x2={240 + rw * Math.cos(rot * deg)} y2={150 + rw * Math.sin(rot * deg)} stroke={COL.ink} strokeWidth={2} />
      <line x1={240 + ra} x2={240 + ra} y1={150} y2={300 - move * 10} stroke={COL.ink} strokeWidth={2} />
      <rect x={240 + ra - 20} y={300 - move * 10} width={40} height={30} fill={COL.load} opacity={0.35} />
      <Arrow x1={240 - rw} y1={150} x2={240 - rw} y2={230} color={COL.reaction} w={2.6} />
      <text x={240 - rw - 6} y={250} fontSize={12} textAnchor="end" fill={COL.reaction} fontWeight={700}>E = {sig(effort, 4)} N</text>
      <text x={20} y={24} fontSize={11} fill={COL.muted}>VR = wheel diameter ÷ axle diameter = {p.wheelD} ÷ {p.axleD} (e.g. steering wheel, winch)</text>
    </svg>
  );
}

// ───────────────────────── Energy visualisation ─────────────────────────
const track = (x: number) => 40 * Math.exp(-((x - 0.55) ** 2) / 0.02) + 25 * (1 - x) ** 2 + 6;

export function EnergyViz() {
  const [m, setM] = useState(30000);
  const [v0, setV0] = useState(15);
  const [loss, setLoss] = useState(0);
  const [x, setX] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number>();
  const h0 = track(0);
  const E0 = m * g * h0 + 0.5 * m * v0 * v0;
  const length = 600; // m of track
  const state = (xx: number) => {
    const h = track(xx);
    const lost = (loss / 100) * m * g * 0.05 * xx * length; // rolling resistance coefficient × fraction
    const KE = E0 - m * g * h - lost;
    return { h, PE: m * g * h, KE, lost, v: KE > 0 ? Math.sqrt((2 * KE) / m) : 0 };
  };
  let stopAt = 1;
  for (let i = 0; i <= 400; i++) {
    if (state(i / 400).KE <= 0) {
      stopAt = i / 400;
      break;
    }
  }
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setX((xx) => {
        const s = state(xx);
        const nx = xx + (Math.max(1.5, s.v) * dt) / length;
        if (nx >= Math.min(1, stopAt)) {
          setPlaying(false);
          return Math.min(1, stopAt);
        }
        return nx;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, m, v0, loss]);
  const s = state(x);
  const W = 640;
  const H = 230;
  const X = (xx: number) => 30 + xx * (W - 60);
  const Y = (h: number) => H - 20 - h * 3.4;
  const path = Array.from({ length: 201 }, (_, i) => `${i ? 'L' : 'M'}${X(i / 200)},${Y(track(i / 200))}`).join(' ');
  const bars = [
    { k: 'Potential  mgh', v: s.PE, c: '#8b5cf6' },
    { k: 'Kinetic  ½mv²', v: Math.max(0, s.KE), c: '#0ea5e9' },
    { k: 'Lost to resistance (heat)', v: s.lost, c: '#f59e0b' },
  ];
  return (
    <Card title="Kinetic ↔ potential energy: tram on a hill" subtitle="Energy is conserved — it changes form, and resistance converts some to heat">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Tram moving over a hill">
            <path d={path} fill="none" stroke={COL.ink} strokeWidth={3} />
            <path d={`${path} L ${X(1)} ${H} L ${X(0)} ${H} Z`} fill={COL.muted} opacity={0.12} />
            <g transform={`translate(${X(x)} ${Y(s.h) - 14})`}>
              <rect x={-22} y={-12} width={44} height={20} rx={5} fill={COL.transport} />
              <rect x={-16} y={-8} width={10} height={7} fill="white" opacity={0.8} />
              <rect x={-2} y={-8} width={10} height={7} fill="white" opacity={0.8} />
              <circle cx={-12} cy={10} r={4} fill={COL.ink} />
              <circle cx={12} cy={10} r={4} fill={COL.ink} />
            </g>
            {stopAt < 1 && <text x={X(stopAt)} y={Y(track(stopAt)) - 34} fontSize={11} textAnchor="middle" fill="#dc2626">stops here (KE = 0)</text>}
          </svg>
          <div className="mt-2 space-y-1.5">
            {bars.map((b) => (
              <div key={b.k} className="flex items-center gap-2 text-xs">
                <span className="w-44 shrink-0 text-ink-600 dark:text-ink-300">{b.k}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-ink-100 dark:bg-ink-800">
                  <div className="h-full rounded transition-[width] duration-75" style={{ width: `${Math.max(0, (b.v / E0) * 100)}%`, background: b.c }} />
                </div>
                <span className="w-24 text-right font-mono tabular-nums">{sig(b.v / 1e6, 3)} MJ</span>
              </div>
            ))}
            <div className="text-right text-xs text-ink-500">Total = {sig(E0 / 1e6, 4)} MJ (constant)</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={() => (x >= Math.min(1, stopAt) ? (setX(0), setPlaying(true)) : setPlaying((p) => !p))}>
              {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Run'}
            </button>
            <button className="btn" onClick={() => (setPlaying(false), setX(0))} aria-label="Reset">
              <RotateCcw size={14} />
            </button>
          </div>
          <Slider label="Position along track" value={x} min={0} max={1} step={0.002} onChange={(v) => (setPlaying(false), setX(Math.min(v, stopAt)))} format={(v) => `${fixed(v * length, 0)} m`} />
          <Slider label="Tram mass" value={m} min={10000} max={60000} step={1000} unit="kg" onChange={setM} />
          <Slider label="Initial speed" value={v0} min={0} max={25} step={0.5} unit="m/s" onChange={setV0} />
          <Slider label="Resistance (rolling + air), illustrative" value={loss} min={0} max={100} unit="%" onChange={setLoss} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Height" value={sig(s.h, 3)} unit="m" />
            <Stat label="Speed" value={sig(s.v, 3)} unit="m/s" sub={`${sig(s.v * 3.6, 3)} km/h`} tone="blue" />
          </div>
          <Callout kind="assume">Point-mass model; resistance modelled as a constant force (illustrative). With 0% resistance, ½mv² + mgh is exactly constant — the speed at any height is independent of mass.</Callout>
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────── Work, energy, power calculator ─────────────────────────
export function WEPCalc() {
  const [F, setF] = useState('2400');
  const [s, setS] = useState('50');
  const [m, setM] = useState('1200');
  const [v, setV] = useState('72');
  const [h, setH] = useState('15');
  const [t, setT] = useState('12');
  const n = { F: parseNum(F), s: parseNum(s), m: parseNum(m), v: parseNum(v), h: parseNum(h), t: parseNum(t) };
  const errors = Object.entries(n)
    .filter(([, x]) => x === null)
    .map(([k]) => `Enter a valid value for ${k}.`);
  if (n.t !== null && n.t <= 0) errors.push('Time must be positive.');
  if (n.m !== null && n.m <= 0) errors.push('Mass must be positive.');
  const W = (n.F ?? 0) * (n.s ?? 0);
  const vms = (n.v ?? 0) / 3.6;
  const KE = 0.5 * (n.m ?? 0) * vms * vms;
  const PE = (n.m ?? 0) * g * (n.h ?? 0);
  return (
    <Card title="Work, energy and power calculator" subtitle="Distinguish: force (N) → work/energy (J) → power (J/s = W)">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Force F" value={F} onChange={setF} unit="N" />
          <NumField label="Distance s (along F)" value={s} onChange={setS} unit="m" />
          <NumField label="Mass m" value={m} onChange={setM} unit="kg" min={0} allowZero={false} />
          <NumField label="Speed v" value={v} onChange={setV} unit="km/h" min={0} />
          <NumField label="Height h" value={h} onChange={setH} unit="m" />
          <NumField label="Time t" value={t} onChange={setT} unit="s" min={0} allowZero={false} />
        </div>
        {errors.length ? (
          <ErrorList errors={errors} />
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Work W = Fs" value={sig(W, 4)} unit="J" />
              <Stat label="Power = W/t" value={sig(W / n.t!, 4)} unit="W" tone="blue" />
              <Stat label="Kinetic ½mv²" value={sig(KE, 4)} unit="J" sub={`v = ${sig(vms, 4)} m/s`} />
              <Stat label="Potential mgh" value={sig(PE, 4)} unit="J" />
            </div>
            <M block>{`v = ${n.v}/3.6 = ${sig(vms, 4)}\\ \\text{m/s} \\Rightarrow E_k = \\tfrac12(${n.m})(${sig(vms, 4)})^2 = ${sig(KE, 4)}\\ \\text{J}`}</M>
            <M block>{`P = \\dfrac{W}{t} = \\dfrac{${sig(W, 4)}}{${n.t}} = ${sig(W / n.t!, 4)}\\ \\text{W}`}</M>
            <p className="text-xs text-ink-500">Power to reach this kinetic energy in time t: {sig(KE / n.t!, 4)} W. Power to climb h in time t: {sig(PE / n.t!, 4)} W (ignoring losses).</p>
          </div>
        )}
      </div>
    </Card>
  );
}
