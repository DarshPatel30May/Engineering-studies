import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Factory, Pause, Play } from 'lucide-react';
import { PROCESSES, type Process } from '@/data/processes';
import { MODULE_MAP } from '@/data/modules';
import { PageHeader, Card, Badge, KeyPoints, cx, Slider } from '@/components/ui';
import { Arrow, COL } from '@/components/diagrams/svg';

function useLoop(period = 4, playing = true) {
  const [t, setT] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      setT((x) => (x + (now - last) / 1000 / period) % 1);
      last = now;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current!);
  }, [period, playing]);
  return [t, setT] as const;
}

export default function Manufacturing() {
  const [params, setParams] = useSearchParams();
  const sel = PROCESSES.find((p) => p.id === params.get('p')) ?? PROCESSES[0];
  const families = Array.from(new Set(PROCESSES.map((p) => p.family)));
  return (
    <div>
      <PageHeader title="Manufacturing Process Explorer" kicker="How processing changes the final product" icon={<Factory className="text-emerald-600" />}>
        Each process is explained with an animated schematic, its steps, its effect on grain structure or polymer/fibre arrangement, advantages, limitations and transport, civil, aircraft and telecommunications applications.
      </PageHeader>
      <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <nav className="space-y-3" aria-label="Processes">
          {families.map((f) => (
            <div key={f}>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{f}</div>
              <ul className="space-y-0.5">
                {PROCESSES.filter((p) => p.family === f).map((p) => (
                  <li key={p.id}>
                    <button onClick={() => setParams({ p: p.id }, { replace: true })} className={cx('w-full rounded-lg px-2 py-1.5 text-left text-sm', p.id === sel.id ? 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'hover:bg-ink-100 dark:hover:bg-ink-800')}>
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <ProcessDetail p={sel} />
      </div>
    </div>
  );
}

function ProcessDetail({ p }: { p: Process }) {
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useLoop(4.5, playing);
  const step = Math.min(p.steps.length - 1, Math.floor(t * p.steps.length));
  return (
    <div className="space-y-4">
      <Card
        title={p.name}
        subtitle={`${p.family} · ${p.materials}`}
        actions={
          <button className="btn text-xs" onClick={() => setPlaying((x) => !x)}>
            {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
          </button>
        }
      >
        <div className="overflow-hidden rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
          <ProcessAnim anim={p.anim} t={t} />
        </div>
        <Slider label="Scrub through the process" value={t} min={0} max={0.999} step={0.001} onChange={(v) => (setPlaying(false), setT(v))} format={() => `Step ${step + 1} of ${p.steps.length}`} />
        <ol className="mt-3 space-y-1.5">
          {p.steps.map((s, i) => (
            <li key={i} className={cx('flex gap-2 rounded-lg px-2 py-1 text-sm transition', i === step && 'bg-emerald-50 dark:bg-emerald-950/40')}>
              <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Effect on the final product" className="border-l-4 border-l-emerald-500">
        <p className="prose-eng">{p.effect}</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Advantages"><KeyPoints items={p.pros} /></Card>
        <Card title="Limitations"><KeyPoints items={p.cons} /></Card>
        <Card title="Applications">
          <KeyPoints items={p.apps} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.modules.map((m) => <Link key={m} to={`/module/${m}/materials`}><Badge tone={m}>{MODULE_MAP[m].name}</Badge></Link>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

/** Schematic animated process diagrams (t ∈ [0,1) loops). */
function ProcessAnim({ anim, t }: { anim: string; t: number }) {
  const W = 640;
  const H = 260;
  const metal = '#94a3b8';
  const poly = '#a78bfa';
  const caption = (s: string) => <text x={W / 2} y={H - 10} fontSize={11} textAnchor="middle" fill={COL.muted}>{s}</text>;
  switch (anim) {
    case 'forging': {
      const press = t < 0.35 ? lerp(20, 80, t / 0.35) : t < 0.6 ? 80 : lerp(80, 20, (t - 0.6) / 0.4);
      const squash = t < 0.35 ? t / 0.35 : t < 0.6 ? 1 : 1;
      const h = lerp(90, 40, squash);
      const w = (90 * 90) / h;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Closed-die forging">
          <rect x={220} y={press - 60} width={200} height={60} fill={metal} stroke={COL.ink} />
          <Arrow x1={320} y1={press - 80} x2={320} y2={press - 62} color={COL.load} w={3} />
          <rect x={220} y={200} width={200} height={20} fill={metal} stroke={COL.ink} />
          <rect x={320 - w / 2} y={200 - h} width={w} height={h} rx={6} fill={squash < 0.05 ? '#ef4444' : '#f97316'} stroke={COL.ink} />
          {squash > 0.5 && [0, 1, 2, 3].map((i) => <path key={i} d={`M ${320 - w / 2 + 6} ${200 - h + 8 + i * (h - 16) / 3} Q 320 ${200 - h + 4 + i * (h - 8) / 3} ${320 + w / 2 - 6} ${200 - h + 8 + i * (h - 16) / 3}`} stroke="#7c2d12" fill="none" strokeWidth={1} />)}
          {caption('Hot billet compressed between dies — grain flow (lines) follows the shape')}
        </svg>
      );
    }
    case 'rolling': {
      const x = lerp(60, 520, t);
      const ang = t * 720;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Rolling mill">
          {[80, 180].map((cy, k) => (
            <g key={cy} transform={`rotate(${k ? -ang : ang} 320 ${cy})`}>
              <circle cx={320} cy={cy} r={48} fill={metal} stroke={COL.ink} />
              <line x1={320} y1={cy - 48} x2={320} y2={cy + 48} stroke={COL.ink} strokeOpacity={0.4} />
            </g>
          ))}
          <path d={`M ${Math.min(x, 320)} 112 L 320 112 L 320 148 L ${Math.min(x, 320)} 148 Z`} fill="#f97316" opacity={0.8} />
          {x > 320 && <rect x={320} y={120} width={x - 320} height={20} fill="#fb923c" />}
          <rect x={Math.min(x, 320) - 120} y={112} width={120} height={36} fill="#f97316" opacity={x < 320 ? 0.8 : 0} />
          {x > 360 && Array.from({ length: Math.floor((x - 320) / 18) }, (_, i) => <ellipse key={i} cx={330 + i * 18} cy={130} rx={8} ry={3} fill="none" stroke="#7c2d12" strokeWidth={0.8} />)}
          <text x={180} y={104} fontSize={10.5} fill={COL.ink}>thick slab</text>
          <text x={430} y={112} fontSize={10.5} fill={COL.ink}>thinner, longer strip</text>
          {caption('Rolls squeeze the metal; cold rolling elongates grains (ellipses) and strain-hardens')}
        </svg>
      );
    }
    case 'casting': {
      const fill = t < 0.15 ? 0 : t < 0.65 ? (t - 0.15) / 0.5 : 1;
      const solid = t > 0.7;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Sand casting">
          <rect x={160} y={60} width={320} height={160} fill="#d6b98c" stroke={COL.ink} />
          <rect x={210} y={130} width={220} height={60} fill="var(--diagram-bg)" stroke={COL.ink} />
          <rect x={210} y={130 + 60 * (1 - fill)} width={220} height={60 * fill} fill={solid ? '#64748b' : '#f97316'} />
          <rect x={180} y={60} width={20} height={100} fill={fill > 0 && fill < 1 ? '#f97316' : 'var(--diagram-bg)'} stroke={COL.ink} />
          <rect x={440} y={70} width={24} height={60} fill={fill >= 1 ? (solid ? '#64748b' : '#f97316') : 'var(--diagram-bg)'} stroke={COL.ink} />
          {t > 0.05 && t < 0.65 && <path d={`M 150 20 Q 175 40 190 60`} stroke="#f97316" strokeWidth={6} fill="none" />}
          <text x={190} y={54} fontSize={10.5} textAnchor="middle" fill={COL.ink}>sprue</text>
          <text x={452} y={64} fontSize={10.5} textAnchor="middle" fill={COL.ink}>riser</text>
          <text x={320} y={120} fontSize={10.5} textAnchor="middle" fill={COL.ink}>mould cavity (sand)</text>
          {solid && Array.from({ length: 10 }, (_, i) => <polygon key={i} points={`${215 + i * 21},${135} ${230 + i * 21},${150} ${220 + i * 21},${185}`} fill="none" stroke="#e2e8f0" strokeWidth={0.8} />)}
          {caption('Molten metal poured in, solidifies with relatively coarse grains; risers feed shrinkage')}
        </svg>
      );
    }
    case 'extrusion': {
      const ram = lerp(80, 240, t);
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Extrusion">
          <rect x={60} y={80} width={260} height={100} fill="none" stroke={COL.ink} strokeWidth={3} />
          <rect x={60} y={95} width={ram - 60} height={70} fill="#475569" />
          <rect x={ram} y={95} width={300 - ram} height={70} fill="#f59e0b" />
          <rect x={300} y={80} width={20} height={30} fill={COL.ink} />
          <rect x={300} y={150} width={20} height={30} fill={COL.ink} />
          <rect x={320} y={110} width={(ram - 80) * 2.2} height={40} fill="#fbbf24" />
          <Arrow x1={30} y1={130} x2={58} y2={130} color={COL.load} w={3} />
          <text x={140} y={74} fontSize={10.5} fill={COL.ink}>ram → billet</text>
          <text x={310} y={200} fontSize={10.5} textAnchor="middle" fill={COL.ink}>die</text>
          {caption('Billet forced through a shaped die → long, constant cross-section (e.g. train body profiles)')}
        </svg>
      );
    }
    case 'powder': {
      const ph = t < 0.33 ? 0 : t < 0.66 ? 1 : 2;
      const press = ph === 1 ? lerp(40, 100, (t - 0.33) / 0.33) : ph === 2 ? 100 : 40;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Powder metallurgy">
          <rect x={200} y={press - 30} width={140} height={30} fill={metal} stroke={COL.ink} />
          <rect x={190} y={60} width={10} height={160} fill={COL.ink} />
          <rect x={340} y={60} width={10} height={160} fill={COL.ink} />
          <rect x={200} y={200} width={140} height={20} fill={metal} stroke={COL.ink} />
          {Array.from({ length: 60 }, (_, i) => {
            const cx = 208 + (i % 12) * 11;
            const top = press;
            const cy = lerp(top + 8 + Math.floor(i / 12) * 18, 200 - 8 - (4 - Math.floor(i / 12)) * 10, ph >= 1 ? Math.min(1, (t - 0.33) / 0.33) : 0);
            return <circle key={i} cx={cx} cy={cy} r={ph === 2 ? 6 : 4.5} fill={ph === 2 ? `rgb(${Math.round(lerp(148, 239, (t - 0.66) * 3))},120,80)` : '#64748b'} />;
          })}
          <text x={430} y={110} fontSize={11} fill={COL.ink}>{['1. fill die with powder', '2. compact → “green” part', '3. sinter below melting point'][ph]}</text>
          {caption('Near-net-shape parts with little waste; controlled porosity (self-lubricating bushes)')}
        </svg>
      );
    }
    case 'welding': {
      const x = lerp(120, 520, t);
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Arc welding">
          <rect x={80} y={140} width={240} height={50} fill={metal} stroke={COL.ink} />
          <rect x={324} y={140} width={240} height={50} fill={metal} stroke={COL.ink} />
          <path d={`M 120 140 L ${x} 140 L ${x} 150 Q ${(120 + x) / 2} 128 120 150 Z`} fill="#78716c" />
          <rect x={120} y={140} width={x - 120} height={50} fill="#a8a29e" opacity={0.6} />
          <rect x={x - 26} y={130} width={52} height={70} fill="#fde68a" opacity={0.35} />
          <polygon points={`${x - 10},40 ${x + 10},40 ${x + 4},118 ${x - 4},118`} fill="#475569" />
          <path d={`M ${x} 120 l -4 8 l 6 2 l -4 8`} stroke="#60a5fa" strokeWidth={2} fill="none" />
          <circle cx={x} cy={140} r={8} fill="#f97316" />
          <text x={x + 14} y={60} fontSize={10.5} fill={COL.ink}>torch + filler wire</text>
          <text x={200} y={212} fontSize={10.5} textAnchor="middle" fill={COL.ink}>weld bead + heat-affected zone (shaded)</text>
          {caption('Arc melts parent metal and filler; shielding gas protects the pool')}
        </svg>
      );
    }
    case 'pressing': {
      const p = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;
      const depth = 70 * p;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Deep drawing">
          <rect x={250} y={30 + depth} width={140} height={60} fill={metal} stroke={COL.ink} />
          <rect x={160} y={110} width={90} height={110} fill="#475569" />
          <rect x={390} y={110} width={90} height={110} fill="#475569" />
          <path d={`M 140 106 L 250 106 L 250 ${106 + depth} L 390 ${106 + depth} L 390 106 L 500 106`} stroke="#0ea5e9" strokeWidth={5} fill="none" />
          <text x={320} y={24} fontSize={10.5} textAnchor="middle" fill={COL.ink}>punch</text>
          {caption('A punch draws flat sheet into a die — car panels; formed areas work-harden')}
        </svg>
      );
    }
    case 'injection': {
      const fill = t < 0.2 ? 0 : t < 0.6 ? (t - 0.2) / 0.4 : 1;
      const open = t > 0.8 ? (t - 0.8) / 0.2 : 0;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Injection moulding">
          <polygon points="60,40 120,40 100,80 80,80" fill="#e2e8f0" stroke={COL.ink} />
          {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={75 + (i % 4) * 9} cy={52 + Math.floor(i / 4) * 10} r={3} fill={poly} />)}
          <rect x={60} y={80} width={260} height={50} fill="#cbd5e1" stroke={COL.ink} />
          <path d={`M 70 105 ${Array.from({ length: 12 }, (_, i) => `L ${80 + i * 20} ${i % 2 ? 95 : 115}`).join(' ')}`} stroke="#475569" strokeWidth={3} fill="none" transform={`translate(${fill > 0 && fill < 1 ? 20 * fill : 0} 0)`} />
          {[0, 1, 2].map((i) => <rect key={i} x={110 + i * 60} y={132} width={30} height={8} fill="#ef4444" opacity={0.7} />)}
          <rect x={320} y={98} width={30} height={14} fill={fill > 0 ? poly : 'var(--diagram-bg)'} stroke={COL.ink} />
          <rect x={350} y={50} width={60} height={110} fill="#64748b" />
          <rect x={410 + open * 50} y={50} width={60} height={110} fill="#64748b" />
          <rect x={395} y={70} width={30} height={70} fill="var(--diagram-bg)" stroke={COL.ink} />
          <rect x={395} y={140 - 70 * fill} width={30} height={70 * fill} fill={poly} />
          {open > 0.5 && <rect x={440 + open * 60} y={70} width={30} height={70} fill={poly} stroke={COL.ink} />}
          <text x={190} y={160} fontSize={10.5} textAnchor="middle" fill={COL.ink}>heated barrel + screw</text>
          <text x={410} y={180} fontSize={10.5} textAnchor="middle" fill={COL.ink}>cooled mould</text>
          {caption('Granules melted and injected under pressure into a cooled mould, then ejected')}
        </svg>
      );
    }
    case 'blow': {
      const b = t < 0.3 ? 0 : t < 0.75 ? (t - 0.3) / 0.45 : 1;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Blow moulding">
          <rect x={200} y={40} width={50} height={180} fill="#64748b" />
          <rect x={390} y={40} width={50} height={180} fill="#64748b" />
          <path d="M 250 60 L 290 60 L 290 70 L 350 70 L 350 60 L 390 60 L 390 210 L 250 210 Z" fill="var(--diagram-bg)" stroke={COL.ink} />
          <path d={`M ${lerp(305, 252, b)} 70 L ${lerp(305, 252, b)} ${lerp(160, 208, b)} L ${lerp(335, 388, b)} ${lerp(160, 208, b)} L ${lerp(335, 388, b)} 70`} fill={poly} opacity={0.5} stroke="#7c3aed" strokeWidth={2} />
          <rect x={312} y={20} width={16} height={50} fill={COL.ink} />
          {b > 0 && b < 1 && <Arrow x1={320} y1={80} x2={320} y2={130} color="#0ea5e9" w={2.5} />}
          <text x={470} y={110} fontSize={10.5} fill={COL.ink}>{b === 0 ? 'parison (hot tube)' : b < 1 ? 'air blown in' : 'cooled hollow part'}</text>
          {caption('A hot tube of plastic is inflated against the mould — fuel tanks, bottles')}
        </svg>
      );
    }
    case 'polyextrusion': {
      const len = lerp(0, 220, t);
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Polymer extrusion and wire coating">
          <polygon points="40,40 100,40 85,80 55,80" fill="#e2e8f0" stroke={COL.ink} />
          <rect x={40} y={80} width={280} height={50} fill="#cbd5e1" stroke={COL.ink} />
          <path d={`M 50 105 ${Array.from({ length: 13 }, (_, i) => `L ${60 + i * 20} ${i % 2 ? 95 : 115}`).join(' ')}`} stroke="#475569" strokeWidth={3} fill="none" />
          <rect x={320} y={88} width={24} height={34} fill={COL.ink} />
          <line x1={250} x2={W - 20} y1={105} y2={105} stroke="#b45309" strokeWidth={4} />
          <rect x={344} y={97} width={len} height={16} rx={8} fill={poly} />
          <text x={500} y={86} fontSize={10.5} textAnchor="middle" fill={COL.ink}>copper wire coated with PVC/PE</text>
          {caption('Continuous extrusion through a die — pipes, seals, and insulating coatings on cable')}
        </svg>
      );
    }
    case 'compression': {
      const close = t < 0.4 ? t / 0.4 : t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Compression moulding">
          <rect x={220} y={lerp(30, 90, close)} width={200} height={50} fill="#64748b" />
          <rect x={250} y={lerp(80, 140, close)} width={140} height={10} fill="#64748b" />
          <path d="M 200 150 L 250 150 L 250 200 L 390 200 L 390 150 L 440 150 L 440 220 L 200 220 Z" fill="#64748b" />
          <rect x={lerp(290, 250, close)} y={lerp(170, 150, close)} width={lerp(60, 140, close)} height={lerp(30, 50, close)} fill="#fbbf24" opacity={0.85} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={210 + i * 60} y={224} width={30} height={6} fill="#ef4444" />)}
          {caption('Charge placed in a heated mould; pressure spreads it and heat cures (cross-links) the thermoset')}
        </svg>
      );
    }
    case 'layup': {
      const n = Math.floor(t * 5);
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Hand lay-up">
          <path d="M 120 200 Q 320 130 520 200" stroke={COL.ink} strokeWidth={3} fill="none" />
          {Array.from({ length: n }, (_, i) => <path key={i} d={`M 130 ${196 - i * 6} Q 320 ${126 - i * 6} 510 ${196 - i * 6}`} stroke={i % 2 ? '#fbbf24' : '#334155'} strokeWidth={5} fill="none" opacity={0.8} />)}
          <g transform={`translate(${lerp(160, 480, (t * 5) % 1)} ${150 - n * 6})`}>
            <rect x={-30} y={-24} width={60} height={14} rx={7} fill="#94a3b8" stroke={COL.ink} />
            <line x1={0} y1={-24} x2={30} y2={-70} stroke={COL.ink} strokeWidth={3} />
          </g>
          <text x={320} y={60} fontSize={10.5} textAnchor="middle" fill={COL.ink}>fabric plies wetted with resin and rolled to remove air</text>
          {caption(`Plies laid: ${n} — open mould, room-temperature cure`)}
        </svg>
      );
    }
    case 'vacuum': {
      const v = t < 0.3 ? 0 : Math.min(1, (t - 0.3) / 0.4);
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Vacuum bagging">
          <rect x={100} y={170} width={440} height={30} fill="#64748b" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={140} y={lerp(160 - i * 8, 164 - i * 5, v)} width={360} height={lerp(8, 5, v)} fill={i % 2 ? '#fbbf24' : '#334155'} opacity={0.85} />)}
          <path d={`M 110 170 Q 320 ${lerp(110, 140, v)} 530 170`} stroke="#0ea5e9" strokeWidth={2.5} fill="none" strokeDasharray={v < 1 ? '6 4' : undefined} />
          {v > 0 && Array.from({ length: 7 }, (_, i) => <Arrow key={i} x1={160 + i * 55} y1={100} x2={160 + i * 55} y2={lerp(125, 138, v)} color="#0ea5e9" w={1.6} head={6} />)}
          <rect x={540} y={150} width={60} height={20} fill={COL.ink} />
          <text x={570} y={144} fontSize={10.5} textAnchor="middle" fill={COL.ink}>to pump</text>
          <text x={320} y={92} fontSize={10.5} textAnchor="middle" fill="#0284c7">atmospheric pressure ≈ 100 kPa consolidates the laminate</text>
          {caption('Sealed bag + vacuum: removes air and excess resin → higher fibre content, fewer voids')}
        </svg>
      );
    }
    case 'glass': {
      const x = lerp(40, 600, t);
      const quench = x > 420;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Glass toughening">
          <rect x={120} y={100} width={220} height={80} rx={8} fill="#fecaca" opacity={0.6} stroke={COL.ink} />
          <text x={230} y={92} fontSize={10.5} textAnchor="middle" fill={COL.ink}>furnace ≈ 620 °C</text>
          {[420, 470, 520].map((qx) => <g key={qx}><Arrow x1={qx} y1={60} x2={qx} y2={120} color="#0ea5e9" w={2} /><Arrow x1={qx} y1={220} x2={qx} y2={160} color="#0ea5e9" w={2} /></g>)}
          <text x={470} y={52} fontSize={10.5} textAnchor="middle" fill={COL.ink}>air quench</text>
          <rect x={x - 60} y={134} width={120} height={12} fill={quench ? '#bae6fd' : '#f97316'} opacity={0.85} stroke={COL.ink} />
          {quench && <><line x1={x - 58} x2={x + 58} y1={135} y2={135} stroke="#dc2626" strokeWidth={2} /><line x1={x - 58} x2={x + 58} y1={145} y2={145} stroke="#dc2626" strokeWidth={2} /></>}
          {caption('Surfaces cool and set first → locked-in surface compression (red), core tension')}
        </svg>
      );
    }
    case 'fibre':
    default: {
      const y = lerp(60, 230, t);
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Optical fibre drawing tower">
          <rect x={300} y={10} width={40} height={60} fill="#e0e7ff" stroke={COL.ink} />
          <polygon points="300,70 340,70 322,100 318,100" fill="#e0e7ff" stroke={COL.ink} />
          <rect x={280} y={55} width={80} height={30} fill="#f97316" opacity={0.4} />
          <text x={380} y={74} fontSize={10.5} fill={COL.ink}>furnace ≈ 2000 °C</text>
          <line x1={320} x2={320} y1={100} y2={240} stroke="#7c3aed" strokeWidth={1.5} />
          <rect x={306} y={140} width={28} height={20} fill="#94a3b8" />
          <text x={340} y={154} fontSize={10.5} fill={COL.ink}>diameter gauge (125 µm)</text>
          <rect x={306} y={180} width={28} height={20} fill="#a78bfa" />
          <text x={340} y={194} fontSize={10.5} fill={COL.ink}>polymer coating applied</text>
          <circle cx={320} cy={y} r={3} fill="#7c3aed" />
          <text x={240} y={40} fontSize={10.5} textAnchor="end" fill={COL.ink}>preform</text>
          {caption('A preform is heated and drawn into kilometres of fibre, coated immediately to protect it')}
        </svg>
      );
    }
  }
}
