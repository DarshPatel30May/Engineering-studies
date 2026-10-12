import { useState } from 'react';
import { sig } from '@/lib/calc/format';
import { Arrow, Label, COL, PinSupport, RollerSupport } from '../diagrams/svg';
import { Card, Slider, Stat, M, Tabs, Callout, Badge, cx } from '../ui';

// ───────────── Bending stress distribution ─────────────
export function BendingStressViz() {
  const [M0, setM] = useState(45);
  const [I, setI] = useState(120);
  const [depth, setDepth] = useState(300);
  const [yFrac, setYFrac] = useState(1);
  const [shape, setShape] = useState<'I' | 'rect'>('I');
  const ymax = depth / 2;
  const y = yFrac * ymax;
  const sigma = (M0 * 1e6 * y) / (I * 1e6);
  const smax = (M0 * 1e6 * ymax) / (I * 1e6);
  const W = 640;
  const H = 300;
  const cy = 150;
  const sc = 220 / depth;
  const top = cy - ymax * sc;
  const bot = cy + ymax * sc;
  const sx = 120 / Math.max(1, smax);
  return (
    <Card title="Bending stress: σ = My/I" subtitle="Second moment of area I is GIVEN (as in HSC questions). Sagging moment shown.">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Beam cross-section and linear bending stress distribution">
          {/* Side view of bent beam */}
          <text x={20} y={24} fontSize={12} fontWeight={600} fill={COL.ink}>Beam bending (sagging)</text>
          <path d="M 20 110 Q 110 150 200 110" fill="none" stroke={COL.compression} strokeWidth={3} />
          <path d="M 20 140 Q 110 180 200 140" fill="none" stroke={COL.tension} strokeWidth={3} />
          <path d="M 20 125 Q 110 165 200 125" fill="none" stroke={COL.muted} strokeDasharray="5 4" strokeWidth={1.5} />
          <text x={110} y={118} fontSize={10.5} textAnchor="middle" fill={COL.compression}>top fibres shorten (C)</text>
          <text x={110} y={186} fontSize={10.5} textAnchor="middle" fill={COL.tension}>bottom fibres stretch (T)</text>
          <text x={110} y={150} fontSize={10} textAnchor="middle" fill={COL.muted}>neutral axis</text>
          {/* Section */}
          <text x={250} y={24} fontSize={12} fontWeight={600} fill={COL.ink}>Cross-section</text>
          {shape === 'I' ? (
            <path
              d={`M ${240} ${top} h 80 v 14 h -32 v ${bot - top - 28} h 32 v 14 h -80 v -14 h 32 v ${-(bot - top - 28)} h -32 z`}
              fill="#0ea5e9"
              opacity={0.3}
              stroke="#0284c7"
            />
          ) : (
            <rect x={262} y={top} width={36} height={bot - top} fill="#0ea5e9" opacity={0.3} stroke="#0284c7" />
          )}
          <line x1={225} x2={340} y1={cy} y2={cy} stroke={COL.ink} strokeDasharray="8 3 2 3" />
          <text x={344} y={cy + 4} fontSize={10.5} fill={COL.ink}>N.A.</text>
          <line x1={230} x2={330} y1={cy - y * sc} y2={cy - y * sc} stroke={COL.load} strokeWidth={1.5} />
          <Label x={232} y={cy - (y * sc) / 2 + 4} anchor="end" size={10.5} color={COL.load} bg>y = {sig(y, 3)}</Label>
          {/* Stress distribution */}
          <text x={430} y={24} fontSize={12} fontWeight={600} fill={COL.ink}>Bending stress</text>
          <line x1={480} x2={480} y1={top - 10} y2={bot + 10} stroke={COL.ink} />
          <polygon points={`480,${top} ${480 - smax * sx},${top} 480,${cy}`} fill={COL.compression} opacity={0.2} stroke={COL.compression} />
          <polygon points={`480,${bot} ${480 + smax * sx},${bot} 480,${cy}`} fill={COL.tension} opacity={0.2} stroke={COL.tension} />
          <Label x={480 - smax * sx} y={top - 6} size={11} color={COL.compression} weight={700} bg>−{sig(smax, 3)} MPa (C)</Label>
          <Label x={480 + smax * sx} y={bot + 16} size={11} color={COL.tension} weight={700} bg>+{sig(smax, 3)} MPa (T)</Label>
          <Arrow x1={480} y1={cy - y * sc} x2={480 - sigma * sx} y2={cy - y * sc} color={COL.load} w={2.2} head={7} />
          <Label x={480 - sigma * sx - 6} y={cy - y * sc + 4} anchor="end" size={11} color={COL.load} weight={700} bg>{sig(sigma, 3)}</Label>
          <text x={490} y={cy + 4} fontSize={10.5} fill={COL.muted}>σ = 0</text>
        </svg>
        <div className="space-y-3">
          <Tabs size="sm" value={shape} onChange={setShape} tabs={[{ id: 'I', label: 'I-section' }, { id: 'rect', label: 'Rectangle' }]} />
          <Slider label="Bending moment M" value={M0} min={1} max={200} unit="kN·m" onChange={setM} />
          <Slider label="Second moment of area I (given)" value={I} min={10} max={500} step={5} unit="× 10⁶ mm⁴" onChange={setI} />
          <Slider label="Section depth" value={depth} min={100} max={600} step={10} unit="mm" onChange={setDepth} />
          <Slider label="Fibre position y (above N.A.)" value={yFrac} min={0} max={1} step={0.01} onChange={setYFrac} format={(v) => `${sig(v * ymax, 3)} mm`} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="σ at y" value={sig(sigma, 4)} unit="MPa" tone="blue" />
            <Stat label="Outer fibre σ_max" value={sig(smax, 4)} unit="MPa" tone="red" />
          </div>
          <M block>{`\\sigma = \\dfrac{My}{I} = \\dfrac{${M0}\\times10^6 \\times ${sig(y, 4)}}{${I}\\times10^6} = ${sig(sigma, 4)}\\ \\text{MPa}`}</M>
          <p className="prose-only text-xs text-ink-500">
            An I-section places most material far from the neutral axis, giving a large I for little mass — so the outer-fibre stress for a given moment is low.
          </p>
        </div>
      </div>
    </Card>
  );
}

// ───────────── UDL vs point load (conceptual) ─────────────
export function UDLConcept() {
  const W = 640;
  const H = 300;
  const L = 200;
  const ox = [60, 360];
  return (
    <Card title="Uniformly distributed loads (conceptual)" subtitle="Same total load W on the same span — compare the shapes">
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Comparison of point load and UDL shear and moment diagrams">
        {ox.map((x0, k) => (
          <g key={k}>
            <text x={x0 + L / 2} y={18} fontSize={12} textAnchor="middle" fontWeight={600} fill={COL.ink}>
              {k === 0 ? 'Central point load W' : 'UDL w = W/L (kN/m)'}
            </text>
            <rect x={x0} y={60} width={L} height={8} fill="var(--diagram-bg)" stroke={COL.ink} />
            <PinSupport x={x0} y={68} s={9} />
            <RollerSupport x={x0 + L} y={68} s={9} />
            {k === 0 ? (
              <Arrow x1={x0 + L / 2} y1={26} x2={x0 + L / 2} y2={58} color={COL.load} w={2.4} />
            ) : (
              <g>
                <rect x={x0} y={36} width={L} height={14} fill={COL.load} opacity={0.2} />
                {Array.from({ length: 9 }, (_, i) => (
                  <Arrow key={i} x1={x0 + (i * L) / 8} y1={36} x2={x0 + (i * L) / 8} y2={58} color={COL.load} w={1.4} head={5} />
                ))}
              </g>
            )}
            {/* SFD */}
            <text x={x0 - 8} y={130} fontSize={10} textAnchor="end" fill={COL.muted}>V</text>
            <line x1={x0} x2={x0 + L} y1={130} y2={130} stroke={COL.muted} />
            {k === 0 ? (
              <polyline points={`${x0},130 ${x0},108 ${x0 + L / 2},108 ${x0 + L / 2},152 ${x0 + L},152 ${x0 + L},130`} fill="none" stroke="#0ea5e9" strokeWidth={2.2} />
            ) : (
              <polyline points={`${x0},130 ${x0},108 ${x0 + L},152 ${x0 + L},130`} fill="none" stroke="#0ea5e9" strokeWidth={2.2} />
            )}
            <text x={x0 + L + 6} y={112} fontSize={10} fill={COL.muted}>{k === 0 ? 'steps' : 'sloping straight line'}</text>
            {/* BMD */}
            <text x={x0 - 8} y={250} fontSize={10} textAnchor="end" fill={COL.muted}>M</text>
            <line x1={x0} x2={x0 + L} y1={250} y2={250} stroke={COL.muted} />
            {k === 0 ? (
              <polyline points={`${x0},250 ${x0 + L / 2},190 ${x0 + L},250`} fill="#8b5cf6" fillOpacity={0.15} stroke="#8b5cf6" strokeWidth={2.2} />
            ) : (
              <path d={`M ${x0} 250 Q ${x0 + L / 2} 190 ${x0 + L} 250`} fill="#8b5cf6" fillOpacity={0.15} stroke="#8b5cf6" strokeWidth={2.2} />
            )}
            <text x={x0 + L / 2} y={k === 0 ? 184 : 214} fontSize={11} textAnchor="middle" fill="#7c3aed" fontWeight={700}>
              {k === 0 ? 'M_max = WL/4' : 'M_max = wL²/8 = WL/8'}
            </text>
            <text x={x0 + L / 2} y={275} fontSize={10} textAnchor="middle" fill={COL.muted}>{k === 0 ? 'straight lines (triangle)' : 'parabola'}</text>
          </g>
        ))}
      </svg>
      <Callout kind="info" title="What you need to know">
        Spreading the same total load uniformly halves the maximum bending moment (WL/8 vs WL/4) and makes the SFD a sloping line and the BMD a curve. Self-weight of floors, decks and roofs act as UDLs. <strong>Numerical UDL analysis is not required for HSC Civil Structures</strong> — the calculator on this site analyses point loads only.
      </Callout>
    </Card>
  );
}

// ───────────── Load path animation ─────────────
const BUILDING_STEPS = [
  { id: 'slab', label: 'Floor/roof slab', text: 'Dead load (self-weight) + live load (people, furniture) act on the slab, which spans between beams.' },
  { id: 'beam', label: 'Beams', text: 'Beams collect slab loads and carry them by bending and shear to the columns.' },
  { id: 'col', label: 'Columns', text: 'Columns carry the accumulated load DOWN in compression — lower columns carry the most.' },
  { id: 'foot', label: 'Footings', text: 'Footings spread the concentrated column load over a larger area to reduce bearing pressure.' },
  { id: 'soil', label: 'Ground', text: 'The soil provides the final reaction. Bearing pressure must be below the soil’s capacity.' },
];
const BRIDGE_STEPS = [
  { id: 'deck', label: 'Deck', text: 'Traffic (live load) and the deck’s own weight act on the deck slab.' },
  { id: 'xg', label: 'Cross-girders', text: 'Cross-girders carry the deck loads sideways to the truss joints.' },
  { id: 'truss', label: 'Truss members', text: 'The truss carries joint loads by axial tension and compression to its supports.' },
  { id: 'bear', label: 'Bearings', text: 'Pin and roller bearings transfer reactions to the piers and allow thermal expansion.' },
  { id: 'pier', label: 'Piers & foundations', text: 'Piers carry the reactions in compression down to piles or footings in the ground.' },
];

export function LoadPathAnimation() {
  const [kind, setKind] = useState<'building' | 'bridge'>('building');
  const [active, setActive] = useState<string | null>(null);
  const steps = kind === 'building' ? BUILDING_STEPS : BRIDGE_STEPS;
  const hi = (id: string) => (active === null || active === id ? 1 : 0.25);
  return (
    <Card title="Structural load path" subtitle="Follow the loads from where they are applied to the ground">
      <Tabs value={kind} onChange={(k) => (setKind(k), setActive(null))} className="mb-3" tabs={[{ id: 'building', label: 'Building frame' }, { id: 'bridge', label: 'Truss bridge' }]} />
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        {kind === 'building' ? (
          <svg viewBox="0 0 560 330" className="diagram" role="img" aria-label="Animated load path in a building frame">
            <rect x={0} y={290} width={560} height={40} fill="#a16207" opacity={hi('soil') * 0.25} />
            {[[80, 60], [80, 160], [480, 60], [480, 160], [280, 60], [280, 160]].map(([x, y], i) => (
              <rect key={i} x={x - 8} y={y + 10} width={16} height={90} fill={COL.muted} opacity={hi('col') * 0.7} />
            ))}
            {[60, 160].map((y) => (
              <g key={y}>
                <rect x={60} y={y} width={440} height={10} fill={COL.civil} opacity={hi('slab') * 0.6} />
                <rect x={60} y={y + 10} width={440} height={8} fill="#0ea5e9" opacity={hi('beam') * 0.5} />
              </g>
            ))}
            {[80, 280, 480].map((x) => (
              <rect key={x} x={x - 24} y={260} width={48} height={14} fill={COL.ink} opacity={hi('foot') * 0.6} />
            ))}
            {[80, 280, 480].map((x) => (
              <rect key={x + 'b'} x={x - 8} y={178} width={16} height={82} fill={COL.muted} opacity={hi('col') * 0.7} />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <Arrow key={i} x1={80 + i * 50} y1={20} x2={80 + i * 50} y2={56} color={COL.load} w={1.6} head={6} />
            ))}
            {[80, 280, 480].map((x, k) => (
              <g key={k}>
                {[0, 0.33, 0.66].map((delay) => (
                  <circle key={delay} r={5} fill="#f59e0b">
                    <animateMotion dur="3s" repeatCount="indefinite" begin={`${delay * 3}s`} path={`M ${x + (k === 1 ? 60 : k === 0 ? 80 : -80)} 60 L ${x} 68 L ${x} 270 L ${x} 300`} />
                  </circle>
                ))}
              </g>
            ))}
            <text x={300} y={14} fontSize={11} textAnchor="middle" fill={COL.load}>dead + live loads</text>
            <text x={280} y={322} fontSize={11} textAnchor="middle" fill={COL.ink}>ground reaction</text>
          </svg>
        ) : (
          <svg viewBox="0 0 560 330" className="diagram" role="img" aria-label="Animated load path in a truss bridge">
            <rect x={0} y={290} width={560} height={40} fill="#a16207" opacity={0.2} />
            <rect x={60} y={190} width={440} height={12} fill={COL.civil} opacity={hi('deck') * 0.6} />
            {[60, 170, 280, 390, 500].map((x) => (
              <rect key={x} x={x - 4} y={202} width={8} height={10} fill="#0ea5e9" opacity={hi('xg')} />
            ))}
            <g opacity={hi('truss')} stroke={COL.ink} strokeWidth={4}>
              <line x1={60} y1={210} x2={500} y2={210} stroke={COL.tension} />
              <line x1={170} y1={110} x2={390} y2={110} stroke={COL.compression} />
              <line x1={60} y1={210} x2={170} y2={110} stroke={COL.compression} />
              <line x1={500} y1={210} x2={390} y2={110} stroke={COL.compression} />
              {[170, 280, 390].map((x) => (
                <line key={x} x1={x} y1={110} x2={x} y2={210} />
              ))}
              <line x1={170} y1={110} x2={280} y2={210} stroke={COL.tension} />
              <line x1={390} y1={110} x2={280} y2={210} stroke={COL.tension} />
            </g>
            <g opacity={hi('bear')}>
              <PinSupport x={60} y={214} s={10} />
              <RollerSupport x={500} y={214} s={10} />
            </g>
            <rect x={40} y={240} width={40} height={50} fill={COL.muted} opacity={hi('pier') * 0.6} />
            <rect x={480} y={240} width={40} height={50} fill={COL.muted} opacity={hi('pier') * 0.6} />
            {Array.from({ length: 6 }, (_, i) => (
              <Arrow key={i} x1={100 + i * 75} y1={150} x2={100 + i * 75} y2={186} color={COL.load} w={1.6} head={6} />
            ))}
            {[0, 0.5, 1, 1.5].map((d) => (
              <g key={d}>
                <circle r={5} fill="#f59e0b">
                  <animateMotion dur="3s" begin={`${d}s`} repeatCount="indefinite" path="M 280 190 L 280 210 L 170 110 L 60 210 L 60 290" />
                </circle>
                <circle r={5} fill="#f59e0b">
                  <animateMotion dur="3s" begin={`${d}s`} repeatCount="indefinite" path="M 280 190 L 280 210 L 390 110 L 500 210 L 500 290" />
                </circle>
              </g>
            ))}
            <text x={280} y={300} fontSize={10.5} textAnchor="middle" fill={COL.ink}>Blue = tension, red = compression (simply supported under gravity loads)</text>
          </svg>
        )}
        <ol className="space-y-1.5">
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                onClick={() => setActive(active === s.id ? null : s.id)}
                className={cx('w-full rounded-lg border p-2 text-left text-sm transition', active === s.id ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40' : 'border-ink-200 hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-800')}
              >
                <div className="font-semibold">
                  {i + 1}. {s.label}
                </div>
                <div className="prose-only text-xs text-ink-500">{s.text}</div>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

// ───────────── Concrete: reinforced vs pre/post-tensioned ─────────────
export function PrestressDiagram() {
  const [type, setType] = useState<'rc' | 'pre' | 'post'>('pre');
  const [stage, setStage] = useState(0);
  const stages = {
    rc: ['Place reinforcement cage in the tension zone', 'Cast and cure concrete', 'Under load: concrete cracks in tension zone, steel carries the tension'],
    pre: ['Stress tendons between abutments of a casting bed', 'Cast concrete around the stressed tendons and cure', 'Cut/release tendons: bond transfers force, concrete is pre-compressed (beam cambers up)', 'Under service load: pre-compression cancels bending tension — little or no cracking'],
    post: ['Cast concrete with empty ducts (often draped)', 'Thread tendons and stress them with hydraulic jacks once concrete is strong enough', 'Lock off at anchorages and grout the ducts', 'Under service load: pre-compression cancels bending tension'],
  }[type];
  const s = Math.min(stage, stages.length - 1);
  const camber = (type === 'pre' && s >= 2) || (type === 'post' && s >= 2) ? -8 : 0;
  const sag = (type === 'rc' && s === 2) || s === 3 ? 10 : 0;
  const def = camber + sag;
  const cracks = type === 'rc' && s === 2;
  const showConcrete = (type === 'pre' && s >= 1) || (type === 'post') || (type === 'rc' && s >= 1);
  const tendonStressed = (type === 'pre' && s >= 0) || (type === 'post' && s >= 1);
  const loaded = s === stages.length - 1 && type !== 'rc' ? true : type === 'rc' && s === 2;
  return (
    <Card title="Reinforced vs pre-tensioned vs post-tensioned concrete" subtitle="Step through each construction sequence">
      <Tabs value={type} onChange={(t) => (setType(t), setStage(0))} className="mb-3" tabs={[{ id: 'rc', label: 'Reinforced' }, { id: 'pre', label: 'Pre-tensioned' }, { id: 'post', label: 'Post-tensioned' }]} />
      <svg viewBox="0 0 600 220" className="diagram" role="img" aria-label="Concrete beam construction sequence">
        {type === 'pre' && (
          <>
            <rect x={20} y={60} width={24} height={110} fill={COL.ink} opacity={0.6} />
            <rect x={556} y={60} width={24} height={110} fill={COL.ink} opacity={0.6} />
          </>
        )}
        {showConcrete && <path d={`M 70 80 Q 300 ${80 + def} 530 80 L 530 140 Q 300 ${140 + def} 70 140 Z`} fill={COL.muted} opacity={0.35} stroke={COL.ink} />}
        {type === 'post' && <path d={`M 70 100 Q 300 ${160 + def} 530 100`} fill="none" stroke={COL.ink} strokeWidth={8} opacity={0.25} />}
        {type === 'rc' ? (
          <line x1={80} x2={520} y1={130 + def * 0.6} y2={130 + def * 0.6} stroke={COL.tension} strokeWidth={4} />
        ) : type === 'pre' ? (
          <line x1={s >= 2 ? 70 : 32} x2={s >= 2 ? 530 : 568} y1={128 + def * 0.6} y2={128 + def * 0.6} stroke={tendonStressed ? COL.tension : COL.muted} strokeWidth={3} />
        ) : (
          <path d={`M 70 100 Q 300 ${160 + def} 530 100`} fill="none" stroke={tendonStressed ? COL.tension : COL.muted} strokeWidth={3} strokeDasharray={s === 0 ? '6 4' : undefined} />
        )}
        {tendonStressed && (
          <>
            <Arrow x1={300} y1={185} x2={90} y2={185} color={COL.compression} w={2} />
            <Arrow x1={300} y1={185} x2={510} y2={185} color={COL.compression} w={2} />
            <text x={300} y={205} fontSize={11} textAnchor="middle" fill={COL.compression}>{s >= (type === 'pre' ? 2 : 2) ? 'concrete pre-compressed' : 'tendon force held by abutments/jacks'}</text>
          </>
        )}
        {cracks && [180, 240, 300, 360, 420].map((x) => <path key={x} d={`M ${x} 148 l -3 -14 l 4 -8 l -2 -10`} stroke={COL.compression} fill="none" strokeWidth={1.6} />)}
        {loaded && Array.from({ length: 7 }, (_, i) => <Arrow key={i} x1={110 + i * 64} y1={30} x2={110 + i * 64} y2={74} color={COL.load} w={1.6} head={6} />)}
        {type === 'post' && s >= 2 && (
          <>
            <rect x={60} y={92} width={12} height={18} fill={COL.ink} />
            <rect x={528} y={92} width={12} height={18} fill={COL.ink} />
          </>
        )}
      </svg>
      <div className="mt-2 flex items-center gap-2">
        <button className="btn" onClick={() => setStage(Math.max(0, s - 1))} disabled={s === 0}>Back</button>
        <div className="flex-1 text-center text-sm">
          <Badge tone="civil">Stage {s + 1} / {stages.length}</Badge> <span className="ml-1">{stages[s]}</span>
        </div>
        <button className="btn btn-primary" onClick={() => setStage(Math.min(stages.length - 1, s + 1))} disabled={s === stages.length - 1}>Next</button>
      </div>
    </Card>
  );
}

// ───────────── Galvanic corrosion of reinforcement ─────────────
export function CorrosionCell() {
  return (
    <svg viewBox="0 0 600 240" className="diagram" role="img" aria-label="Corrosion of steel reinforcement in concrete">
      <rect x={20} y={20} width={560} height={200} fill={COL.muted} opacity={0.2} stroke={COL.ink} />
      <text x={30} y={40} fontSize={11} fill={COL.ink}>concrete (alkaline, pH ≈ 12.5 protects steel — until carbonation or chlorides arrive)</text>
      <rect x={20} y={20} width={560} height={46} fill="#0ea5e9" opacity={0.08} />
      <line x1={40} x2={560} y1={150} y2={150} stroke="#78716c" strokeWidth={14} strokeLinecap="round" />
      <ellipse cx={220} cy={150} rx={40} ry={14} fill="#b45309" opacity={0.8} />
      <text x={220} y={185} fontSize={11} textAnchor="middle" fill="#b45309" fontWeight={700}>ANODE: Fe → Fe²⁺ + 2e⁻</text>
      <text x={430} y={185} fontSize={11} textAnchor="middle" fill={COL.tension} fontWeight={700}>CATHODE: O₂ + 2H₂O + 4e⁻ → 4OH⁻</text>
      <Arrow x1={250} y1={143} x2={400} y2={143} color={COL.tension} w={1.8} />
      <text x={325} y={135} fontSize={10.5} textAnchor="middle" fill={COL.tension}>electrons flow through the steel</text>
      <path d="M 120 20 L 160 90 L 180 120" stroke={COL.compression} strokeWidth={1.8} fill="none" />
      <text x={110} y={80} fontSize={10.5} textAnchor="end" fill={COL.compression}>crack lets in</text>
      <text x={110} y={93} fontSize={10.5} textAnchor="end" fill={COL.compression}>water, O₂, Cl⁻</text>
      <path d="M 190 108 q 30 -18 60 0" fill="none" stroke="#b45309" strokeWidth={2} strokeDasharray="4 3" />
      <text x={230} y={100} fontSize={10.5} textAnchor="middle" fill="#b45309">rust expands 2–6× → spalling</text>
      <text x={300} y={212} fontSize={10.5} textAnchor="middle" fill={COL.muted}>Prevention: adequate cover, low water/cement ratio, crack control, galvanised or epoxy-coated bars, sealers, cathodic protection</text>
    </svg>
  );
}

// ───────────── Crack theory ─────────────
export function CrackDiagram() {
  const [radius, setRadius] = useState(0.5);
  const a = 10;
  const kt = 1 + 2 * Math.sqrt(a / radius);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <svg viewBox="0 0 560 230" className="diagram" role="img" aria-label="Crack tip stress concentration and crack arrest hole">
        <rect x={40} y={30} width={480} height={170} fill={COL.muted} opacity={0.18} stroke={COL.ink} />
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <Arrow x1={60 + i * 75} y1={28} x2={60 + i * 75} y2={4} color={COL.load} w={1.5} head={6} />
            <Arrow x1={60 + i * 75} y1={202} x2={60 + i * 75} y2={226} color={COL.load} w={1.5} head={6} />
          </g>
        ))}
        <path d={`M 40 112 L 200 ${115 - 1} L ${200 + 1} 115 L 200 ${115 + 1} Z`} fill={COL.ink} />
        <line x1={40} y1={115} x2={200} y2={115} stroke={COL.ink} strokeWidth={2} />
        <circle cx={200 + radius * 4} cy={115} r={Math.max(1, radius * 4)} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={1.5} />
        {/* stress-flow lines bunching around tip */}
        {[-60, -35, -15, 15, 35, 60].map((dy) => (
          <path key={dy} d={`M 470 ${115 + dy} C 330 ${115 + dy}, ${230 + Math.abs(dy) * 0.3} ${115 + dy * 0.2}, ${210 + radius * 4} ${115 + Math.sign(dy) * (6 + radius * 4)}`} fill="none" stroke="#0ea5e9" strokeWidth={1.2} opacity={0.7} />
        ))}
        <text x={120} y={105} fontSize={11} textAnchor="middle" fill={COL.ink}>crack length a</text>
        <text x={330} y={215} fontSize={11} textAnchor="middle" fill={COL.muted}>stress “flow lines” crowd around the tip → stress concentration</text>
      </svg>
      <div className="space-y-3">
        <Slider label="Crack-tip radius (drill an arrest hole)" value={radius} min={0.1} max={6} step={0.1} unit="mm" onChange={setRadius} />
        <Stat label="Stress concentration ≈ 1 + 2√(a/r)" value={sig(kt, 3)} sub="for a = 10 mm (Inglis, elliptical crack)" tone={kt > 10 ? 'red' : 'emerald'} />
        <p className="prose-only text-xs text-ink-500">A sharper tip (smaller r) concentrates stress far above the average, so cracks grow. Drilling a hole at the tip increases r and can arrest growth. Reinforcement, control joints and avoiding sharp corners reduce cracking in structures.</p>
      </div>
    </div>
  );
}
