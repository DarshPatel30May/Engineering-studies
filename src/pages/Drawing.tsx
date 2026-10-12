import { lazy, Suspense, useMemo, useState } from 'react';
import { PenTool } from 'lucide-react';
import { developSquareToRound, developTruncatedCylinder } from '@/lib/calc/development';
import { sig, fixed } from '@/lib/calc/format';
import { PageHeader, Card, SectionTitle, KeyPoints, Callout, Slider, Tabs, Grid, Toggle, Badge } from '@/components/ui';
import { COL, Arrow } from '@/components/diagrams/svg';
import SectionNav from '@/components/SectionNav';
import { useHashScroll } from '@/hooks/useHashScroll';
import { ViewQuiz, ThirdAngleSymbol } from '@/components/drawing/ProjectionExplorer';

const ProjectionExplorer = lazy(() => import('@/components/drawing/ProjectionExplorer'));

const SECTIONS = [
  { id: 'explorer', label: '3D → 2D explorer' },
  { id: 'practice', label: 'Practice' },
  { id: 'lines', label: 'Line types' },
  { id: 'projection', label: 'Projection' },
  { id: 'dimensioning', label: 'Dimensioning' },
  { id: 'sections', label: 'Sections' },
  { id: 'scale', label: 'Scale' },
  { id: 'pictorial', label: 'Pictorial' },
  { id: 'assembly', label: 'Assembly vs component' },
  { id: 'development', label: 'Developments' },
  { id: 'cad', label: 'CAD' },
];

export default function Drawing() {
  useHashScroll();
  return (
    <div>
      <PageHeader title="Technical Drawing Visual Guide" kicker="AS 1100 conventions, projection and developments" icon={<PenTool className="text-emerald-600" />}>
        Engineering drawings communicate exact shape, size and requirements. This guide follows the principles of AS 1100 (Technical drawing). Simplified examples are labelled as such — they illustrate conventions but are not complete, formally compliant production drawings.
      </PageHeader>
      <SectionNav items={SECTIONS} />
      <div className="space-y-8">
        <section id="explorer" className="scroll-mt-28">
          <Suspense fallback={<div className="h-[480px] animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />}>
            <ProjectionExplorer />
          </Suspense>
        </section>
        <section id="practice" className="scroll-mt-28"><ViewQuiz /></section>
        <section id="lines" className="scroll-mt-28"><SectionTitle>Line types and their uses</SectionTitle><LineTypes /></section>
        <section id="projection" className="scroll-mt-28"><SectionTitle>Orthogonal projection: third angle and first angle</SectionTitle><ProjectionCompare /></section>
        <section id="dimensioning" className="scroll-mt-28"><SectionTitle>Dimensioning</SectionTitle><Dimensioning /></section>
        <section id="sections" className="scroll-mt-28"><SectionTitle>Sectional views</SectionTitle><Sections /></section>
        <section id="scale" className="scroll-mt-28"><SectionTitle>Scale</SectionTitle><ScaleTool /></section>
        <section id="pictorial" className="scroll-mt-28"><SectionTitle>Pictorial drawing: isometric, oblique and perspective</SectionTitle><Pictorial /></section>
        <section id="assembly" className="scroll-mt-28"><SectionTitle>Assembly and component drawings</SectionTitle><AssemblyVsComponent /></section>
        <section id="development" className="scroll-mt-28"><SectionTitle>Developments (pattern drawing)</SectionTitle><Developments /></section>
        <section id="cad" className="scroll-mt-28"><SectionTitle>CAD and drawing interpretation</SectionTitle><CadInterpretation /></section>
      </div>
    </div>
  );
}

function LineTypes() {
  const lines = [
    { name: 'Continuous thick', use: 'Visible outlines and edges', props: { strokeWidth: 2.6 } },
    { name: 'Continuous thin', use: 'Dimension, projection and leader lines; hatching; imaginary intersections', props: { strokeWidth: 1 } },
    { name: 'Dashed thin', use: 'Hidden outlines and edges', props: { strokeWidth: 1, strokeDasharray: '8 4' } },
    { name: 'Chain thin (long dash – short dash)', use: 'Centre lines, axes of symmetry, pitch circles', props: { strokeWidth: 1, strokeDasharray: '18 4 3 4' } },
    { name: 'Chain thin, thick at ends and changes of direction', use: 'Cutting planes for sections', props: { strokeWidth: 1, strokeDasharray: '18 4 3 4' }, thickEnds: true },
    { name: 'Chain thin double-dashed', use: 'Adjacent parts, alternative and extreme positions of moving parts', props: { strokeWidth: 1, strokeDasharray: '18 4 3 4 3 4' } },
    { name: 'Continuous thin freehand / zigzag', use: 'Limits of partial or interrupted views (breaks)', props: { strokeWidth: 1 }, zig: true },
  ];
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead><tr><th className="w-64">Line</th><th>Type</th><th>Typical use</th></tr></thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.name}>
                <td>
                  <svg viewBox="0 0 220 20" width={220} height={20} aria-hidden>
                    {l.zig ? (
                      <path d="M 4 10 L 90 10 L 98 2 L 106 18 L 114 10 L 216 10" stroke={COL.ink} fill="none" {...l.props} />
                    ) : (
                      <line x1={4} x2={216} y1={10} y2={10} stroke={COL.ink} {...l.props} />
                    )}
                    {l.thickEnds && (
                      <>
                        <line x1={4} x2={24} y1={10} y2={10} stroke={COL.ink} strokeWidth={2.6} />
                        <line x1={196} x2={216} y1={10} y2={10} stroke={COL.ink} strokeWidth={2.6} />
                      </>
                    )}
                  </svg>
                </td>
                <td className="font-semibold">{l.name}</td>
                <td>{l.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-500">Thick lines are typically about twice the width of thin lines. When lines coincide, priority is: visible outline → hidden line → cutting plane → centre line.</p>
    </Card>
  );
}

function ProjectionCompare() {
  return (
    <Grid cols={2}>
      <Card title="Third-angle projection (standard Australian practice)" actions={<ThirdAngleSymbol />}>
        <svg viewBox="0 0 300 230" className="diagram" aria-label="Third-angle layout">
          <rect x={40} y={10} width={100} height={60} fill="none" stroke={COL.ink} strokeWidth={2} />
          <text x={90} y={44} fontSize={11} textAnchor="middle" fill={COL.ink}>TOP</text>
          <rect x={40} y={90} width={100} height={80} fill="none" stroke={COL.ink} strokeWidth={2} />
          <text x={90} y={134} fontSize={11} textAnchor="middle" fill={COL.ink}>FRONT</text>
          <rect x={160} y={90} width={60} height={80} fill="none" stroke={COL.ink} strokeWidth={2} />
          <text x={190} y={134} fontSize={11} textAnchor="middle" fill={COL.ink}>RIGHT</text>
          {[40, 140].map((x) => <line key={x} x1={x} x2={x} y1={70} y2={90} stroke={COL.muted} strokeDasharray="2 2" />)}
          {[90, 170].map((y) => <line key={y} x1={140} x2={160} y1={y} y2={y} stroke={COL.muted} strokeDasharray="2 2" />)}
          <text x={150} y={210} fontSize={10.5} textAnchor="middle" fill={COL.muted}>Each view is placed on the side from which it is seen</text>
        </svg>
      </Card>
      <Card title="First-angle projection (also permitted; common in Europe)" actions={<ThirdAngleSymbol first />}>
        <svg viewBox="0 0 300 230" className="diagram" aria-label="First-angle layout">
          <rect x={40} y={10} width={100} height={80} fill="none" stroke={COL.ink} strokeWidth={2} />
          <text x={90} y={54} fontSize={11} textAnchor="middle" fill={COL.ink}>FRONT</text>
          <rect x={40} y={110} width={100} height={60} fill="none" stroke={COL.ink} strokeWidth={2} />
          <text x={90} y={144} fontSize={11} textAnchor="middle" fill={COL.ink}>TOP (below)</text>
          <rect x={160} y={10} width={60} height={80} fill="none" stroke={COL.ink} strokeWidth={2} />
          <text x={190} y={54} fontSize={11} textAnchor="middle" fill={COL.ink}>LEFT</text>
          <text x={150} y={210} fontSize={10.5} textAnchor="middle" fill={COL.muted}>Each view is placed on the OPPOSITE side to where it is seen</text>
        </svg>
      </Card>
      <Callout kind="warn" className="lg:col-span-2">Always show the projection symbol in the title block. Mixing up first- and third-angle layouts produces mirror-image (wrong) views — a common exam error.</Callout>
    </Grid>
  );
}

function Dimensioning() {
  const [bad, setBad] = useState(false);
  return (
    <Card actions={<Toggle checked={bad} onChange={setBad} label="Show common errors" />}>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <svg viewBox="0 0 460 300" className="diagram" role="img" aria-label="Dimensioned plate with a hole">
          <path d="M 80 60 L 320 60 Q 360 60 360 100 L 360 220 L 80 220 Z" fill="none" stroke={COL.ink} strokeWidth={2.4} />
          <circle cx={260} cy={140} r={30} fill="none" stroke={COL.ink} strokeWidth={2.4} />
          <line x1={220} x2={300} y1={140} y2={140} stroke={COL.ink} strokeWidth={0.8} strokeDasharray="12 3 2 3" />
          <line x1={260} x2={260} y1={100} y2={180} stroke={COL.ink} strokeWidth={0.8} strokeDasharray="12 3 2 3" />
          {/* width */}
          <line x1={80} x2={80} y1={224} y2={262} stroke={COL.ink} strokeWidth={0.8} />
          <line x1={360} x2={360} y1={224} y2={262} stroke={COL.ink} strokeWidth={0.8} />
          <Arrow x1={220} y1={254} x2={81} y2={254} color={COL.ink} w={0.8} head={7} />
          <Arrow x1={220} y1={254} x2={359} y2={254} color={COL.ink} w={0.8} head={7} />
          <text x={220} y={249} fontSize={12} textAnchor="middle" fill={COL.ink}>140</text>
          {/* height */}
          <line x1={76} x2={40} y1={60} y2={60} stroke={COL.ink} strokeWidth={0.8} />
          <line x1={76} x2={40} y1={220} y2={220} stroke={COL.ink} strokeWidth={0.8} />
          <Arrow x1={48} y1={140} x2={48} y2={61} color={COL.ink} w={0.8} head={7} />
          <Arrow x1={48} y1={140} x2={48} y2={219} color={COL.ink} w={0.8} head={7} />
          <text x={42} y={144} fontSize={12} textAnchor="end" fill={COL.ink}>80</text>
          {/* hole dia */}
          <line x1={281} y1={119} x2={330} y2={70} stroke={COL.ink} strokeWidth={0.8} />
          <line x1={330} y1={70} x2={380} y2={70} stroke={COL.ink} strokeWidth={0.8} />
          <text x={384} y={74} fontSize={12} fill={COL.ink}>⌀30</text>
          <text x={384} y={98} fontSize={12} fill={COL.ink}>R20</text>
          {/* hole position */}
          <line x1={260} x2={260} y1={184} y2={290} stroke={COL.ink} strokeWidth={0.8} strokeDasharray="12 3 2 3" />
          <Arrow x1={170} y1={282} x2={81} y2={282} color={COL.ink} w={0.8} head={7} />
          <Arrow x1={170} y1={282} x2={259} y2={282} color={COL.ink} w={0.8} head={7} />
          <line x1={80} x2={80} y1={262} y2={290} stroke={COL.ink} strokeWidth={0.8} />
          <text x={170} y={277} fontSize={12} textAnchor="middle" fill={COL.ink}>90</text>
          {bad && (
            <g>
              <text x={200} y={100} fontSize={12} fill="#dc2626">55</text>
              <line x1={196} x2={196} y1={60} y2={140} stroke="#dc2626" strokeWidth={1.5} />
              <circle cx={200} cy={96} r={18} fill="none" stroke="#dc2626" strokeWidth={1.5} />
              <text x={90} y={50} fontSize={11} fill="#dc2626">“140 mm” and units repeated ✗</text>
              <path d="M 255 140 L 260 110" stroke="#dc2626" strokeWidth={1.5} />
            </g>
          )}
        </svg>
        <div className="space-y-2">
          <KeyPoints items={['Dimensions in millimetres — the unit is stated once in the title block, not after each number.', 'Thin dimension lines with filled arrowheads; projection lines start with a small gap from the outline and extend just past the dimension line.', 'Each feature dimensioned once only; no redundant (duplicate) dimensions.', 'Dimension to visible outlines, never to hidden lines.', 'Use ⌀ for diameters, R for radii; locate holes from a datum edge to their centre lines.', 'Text readable from the bottom (unidirectional) or bottom and right (aligned) — be consistent.']} />
          {bad && <Callout kind="warn">Errors shown in red: dimensioning to a hidden/centre position inside the part, a duplicate dimension, units after every number.</Callout>}
        </div>
      </div>
    </Card>
  );
}

function Sections() {
  return (
    <Card>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <svg viewBox="0 0 520 260" className="diagram" role="img" aria-label="Flanged bush with sectional view">
          <defs>
            <pattern id="hatch" width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={7} stroke={COL.ink} strokeWidth={0.8} />
            </pattern>
          </defs>
          <text x={130} y={18} fontSize={11} textAnchor="middle" fontWeight={600} fill={COL.ink}>SIDE VIEW</text>
          <circle cx={130} cy={130} r={90} fill="none" stroke={COL.ink} strokeWidth={2.2} />
          <circle cx={130} cy={130} r={50} fill="none" stroke={COL.ink} strokeWidth={2.2} />
          <circle cx={130} cy={130} r={28} fill="none" stroke={COL.ink} strokeWidth={2.2} />
          <line x1={130} x2={130} y1={20} y2={240} stroke={COL.ink} strokeWidth={0.8} strokeDasharray="14 3 2 3" />
          <line x1={130} x2={130} y1={20} y2={36} stroke={COL.ink} strokeWidth={2.6} />
          <line x1={130} x2={130} y1={224} y2={240} stroke={COL.ink} strokeWidth={2.6} />
          <Arrow x1={130} y1={28} x2={156} y2={28} color={COL.ink} w={1.5} head={7} />
          <Arrow x1={130} y1={232} x2={156} y2={232} color={COL.ink} w={1.5} head={7} />
          <text x={162} y={32} fontSize={12} fontWeight={700} fill={COL.ink}>A</text>
          <text x={162} y={236} fontSize={12} fontWeight={700} fill={COL.ink}>A</text>
          <text x={390} y={18} fontSize={11} textAnchor="middle" fontWeight={600} fill={COL.ink}>SECTION A–A</text>
          {/* flange + hub, cut surfaces hatched; bore (empty) not hatched */}
          <path d="M 330 40 L 360 40 L 360 80 L 450 80 L 450 102 L 330 102 Z" fill="url(#hatch)" stroke={COL.ink} strokeWidth={2.2} />
          <path d="M 330 158 L 450 158 L 450 180 L 360 180 L 360 220 L 330 220 Z" fill="url(#hatch)" stroke={COL.ink} strokeWidth={2.2} />
          <line x1={330} x2={450} y1={102} y2={102} stroke={COL.ink} strokeWidth={2.2} />
          <line x1={330} x2={450} y1={158} y2={158} stroke={COL.ink} strokeWidth={2.2} />
          <line x1={320} x2={460} y1={130} y2={130} stroke={COL.ink} strokeWidth={0.8} strokeDasharray="14 3 2 3" />
          <text x={390} y={248} fontSize={10.5} textAnchor="middle" fill={COL.muted}>bore (hollow) is not hatched; hatching at 45°</text>
        </svg>
        <KeyPoints items={['The cutting plane is shown in the adjacent view by a thin chain line, thick at the ends, with arrows showing viewing direction and letters (A–A).', 'Cut material is hatched with thin lines, usually at 45°; different parts in an assembly are hatched in different directions or spacings.', 'Hidden detail is normally omitted in sectional views.', 'Not sectioned when cut lengthways: shafts, pins, bolts, nuts, rivets, keys, ribs, webs and spokes.', 'Half sections (symmetric parts) show the outside and inside in one view.']} />
      </div>
    </Card>
  );
}

function ScaleTool() {
  const [len, setLen] = useState(2400);
  const [scale, setScale] = useState('1:20');
  const [a, b] = scale.split(':').map(Number);
  const drawn = (len * a) / b;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <Slider label="Real length" value={len} min={10} max={10000} step={10} unit="mm" onChange={setLen} />
          <Tabs size="sm" value={scale} onChange={setScale} tabs={['5:1', '2:1', '1:1', '1:2', '1:5', '1:10', '1:20', '1:50', '1:100', '1:200'].map((s) => ({ id: s, label: s }))} />
          <p className="text-sm">At {scale}, a real length of {len} mm is drawn as <strong>{sig(drawn, 4)} mm</strong>.</p>
          <p className="text-xs text-ink-500">Scale = drawing size : actual size. Preferred scales are multiples of 1, 2 and 5 of ten. Dimensions on the drawing always show the REAL size, not the measured drawn length.</p>
        </div>
        <svg viewBox="0 0 320 80" className="diagram" aria-label="Scaled line">
          <line x1={10} x2={10 + Math.min(300, drawn)} y1={40} y2={40} stroke={COL.ink} strokeWidth={3} />
          {drawn > 300 && <text x={160} y={70} fontSize={10.5} textAnchor="middle" fill="#dc2626">too long for this panel — choose a smaller scale</text>}
          <text x={10} y={28} fontSize={10.5} fill={COL.muted}>drawn length (1 px ≈ 1 mm)</text>
        </svg>
      </div>
    </Card>
  );
}

function Pictorial() {
  const box = (P: (x: number, y: number, z: number) => [number, number], fillScale = 1) => {
    const f = (pts: [number, number, number][], c: string) => <polygon points={pts.map((p) => P(...p).join(',')).join(' ')} fill={c} stroke={COL.ink} strokeWidth={1.4} opacity={fillScale} />;
    return (
      <g>
        {f([[0, 0, 1], [2, 0, 1], [2, 1, 1], [0, 1, 1]], '#cbd5e1')}
        {f([[2, 0, 0], [2, 0, 1], [2, 1, 1], [2, 1, 0]], '#94a3b8')}
        {f([[0, 1, 0], [2, 1, 0], [2, 1, 1], [0, 1, 1]], '#e2e8f0')}
      </g>
    );
  };
  const c30 = Math.cos(Math.PI / 6);
  const iso = (x: number, y: number, z: number): [number, number] => [80 + (x - z) * c30 * 40, 110 - y * 40 + (x + z) * 20];
  const obl = (x: number, y: number, z: number): [number, number] => [40 + x * 40 + (1 - z) * 0.5 * 40 * Math.cos(Math.PI / 4), 110 - y * 40 - (1 - z) * 0.5 * 40 * Math.sin(Math.PI / 4)];
  const per = (x: number, y: number, z: number): [number, number] => {
    const d = 5 + (1 - z) * 1.6;
    return [100 + ((x - 1) * 40 * 5) / d + 30, 110 - ((y - 0.2) * 40 * 5) / d];
  };
  return (
    <Grid cols={3}>
      <Card title="Isometric">
        <svg viewBox="0 0 200 160" className="diagram" aria-label="Isometric block">{box(iso)}</svg>
        <KeyPoints items={['Receding axes at 30° to horizontal; verticals vertical.', 'All three axes at full scale (isometric drawing).', 'Most common for HSC freehand pictorials.']} />
      </Card>
      <Card title="Oblique (cabinet)">
        <svg viewBox="0 0 200 160" className="diagram" aria-label="Oblique block">{box(obl)}</svg>
        <KeyPoints items={['Front face drawn true shape; depth at 45° (or 30°).', 'Cabinet oblique: depth drawn at half scale to look realistic.', 'Good for objects with circular front features.']} />
      </Card>
      <Card title="Perspective (two-point, illustrative)">
        <svg viewBox="0 0 200 160" className="diagram" aria-label="Perspective block">{box(per)}</svg>
        <KeyPoints items={['Parallel edges converge to vanishing points.', 'Most realistic; not measurable — used for presentation.']} />
      </Card>
    </Grid>
  );
}

function AssemblyVsComponent() {
  return (
    <Grid cols={2}>
      <Card title="Assembly drawing">
        <KeyPoints items={['Shows how parts fit together and their relative positions.', 'Item balloons linked to a parts list (item, description, material, quantity).', 'Only overall and assembly dimensions; sectioned to show internal fits.', 'Example: a clevis pin joint — see the Civil Structures communication tab.']} />
      </Card>
      <Card title="Component (detail) drawing">
        <KeyPoints items={['Defines ONE part completely for manufacture: all dimensions, tolerances, material, finish and quantity.', 'Usually orthogonal views plus sections as needed.', 'Title block: part name and number, scale, projection, material, drawn/checked.']} />
      </Card>
    </Grid>
  );
}

function Developments() {
  const [tab, setTab] = useState<'transition' | 'cylinder'>('transition');
  return (
    <Card>
      <Tabs value={tab} onChange={setTab} className="mb-3" tabs={[{ id: 'transition', label: 'Square-to-round transition piece' }, { id: 'cylinder', label: 'Truncated cylinder' }]} />
      {tab === 'transition' ? <SquareToRound /> : <Cylinder />}
    </Card>
  );
}

function fit(pts: { x: number; y: number }[], W: number, H: number, pad = 20) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const s = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1));
  return {
    X: (x: number) => pad + (x - minX) * s + (W - 2 * pad - (maxX - minX) * s) / 2,
    Y: (y: number) => H - pad - (y - minY) * s - (H - 2 * pad - (maxY - minY) * s) / 2,
    s,
  };
}

function SquareToRound() {
  const [S, setS] = useState(200);
  const [D, setD] = useState(120);
  const [Hh, setH] = useState(150);
  const d = useMemo(() => developSquareToRound(S, D, Hh, 12), [S, D, Hh]);
  const W = 560;
  const Hs = 340;
  const f = fit(d.outline, W, Hs);
  const planS = 1.6 * (100 / Math.max(S, D));
  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      <div className="space-y-3">
        <Slider label="Square side S" value={S} min={80} max={300} step={5} unit="mm" onChange={setS} />
        <Slider label="Circle diameter D" value={D} min={40} max={Math.min(S - 10, 280)} step={5} unit="mm" onChange={setD} />
        <Slider label="Height H" value={Hh} min={40} max={300} step={5} unit="mm" onChange={setH} />
        <svg viewBox="0 0 300 150" className="diagram" aria-label="Plan and elevation of the transition piece">
          <text x={75} y={12} fontSize={10} textAnchor="middle" fill={COL.ink}>PLAN</text>
          <rect x={75 - (S / 2) * planS} y={75 - (S / 2) * planS} width={S * planS} height={S * planS} fill="none" stroke={COL.ink} strokeWidth={1.5} />
          <circle cx={75} cy={75} r={(D / 2) * planS} fill="none" stroke={COL.ink} strokeWidth={1.5} />
          {d.plan.circle.map((p, i) => {
            const k = d.plan.corners[Math.floor(((i * 30) % 360) / 90) % 4];
            return <line key={i} x1={75 + p.x * planS} y1={75 - p.y * planS} x2={75 + k.x * planS} y2={75 - k.y * planS} stroke={COL.muted} strokeWidth={0.6} />;
          })}
          <text x={225} y={12} fontSize={10} textAnchor="middle" fill={COL.ink}>ELEVATION</text>
          <path d={`M ${225 - (S / 2) * planS * 0.6} ${140} L ${225 + (S / 2) * planS * 0.6} 140 L ${225 + (D / 2) * planS * 0.6} ${140 - Hh * planS * 0.6} L ${225 - (D / 2) * planS * 0.6} ${140 - Hh * planS * 0.6} Z`} fill="none" stroke={COL.ink} strokeWidth={1.5} />
        </svg>
        <div className="overflow-x-auto">
          <table className="tbl text-xs">
            <thead><tr><th>Line</th><th>Plan length</th><th>True length</th></tr></thead>
            <tbody>
              {d.trueLengths.map((t) => <tr key={t.to}><td>{t.from}–{t.to}</td><td className="font-mono">{fixed(t.plan, 1)}</td><td className="font-mono">{fixed(t.length, 1)}</td></tr>)}
              <tr><td>Seam</td><td className="font-mono">{fixed((S - D) / 2, 1)}</td><td className="font-mono">{fixed(d.seamLength, 1)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <svg viewBox={`0 0 ${W} ${Hs}`} className="diagram rounded-lg border border-ink-200 dark:border-ink-800" role="img" aria-label="Flat pattern development of the transition piece">
          <polygon points={d.outline.map((p) => `${f.X(p.x)},${f.Y(p.y)}`).join(' ')} fill="#a7f3d0" fillOpacity={0.35} stroke={COL.ink} strokeWidth={2} />
          {d.foldLines.map(([a, b], i) => <line key={i} x1={f.X(a.x)} y1={f.Y(a.y)} x2={f.X(b.x)} y2={f.Y(b.y)} stroke={COL.muted} strokeWidth={0.8} strokeDasharray="4 3" />)}
          {d.labels.map((l, i) => <text key={i} x={f.X(l.p.x)} y={f.Y(l.p.y) + (l.text.startsWith('C') ? -6 : 14)} fontSize={10} textAnchor="middle" fill={COL.ink}>{l.text}</text>)}
        </svg>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="emerald">Bottom edge = {fixed(d.developedBottomLength, 1)} mm (= 4S)</Badge>
          <Badge>Top edge ≈ {fixed(d.developedTopLength, 1)} mm (πD = {fixed(Math.PI * D, 1)})</Badge>
        </div>
        <p className="mt-2 text-xs text-ink-500">Method (triangulation): divide the circle into 12; join each corner K to the circle points of its quadrant; find each line’s true length √(plan length² + H²); lay the triangles out flat in order from the seam. Fold lines dashed. The circular edge is approximated by 12 chords (add more divisions for accuracy). Add seam allowances before cutting.</p>
      </div>
    </div>
  );
}

function Cylinder() {
  const [D, setD] = useState(80);
  const [h0, setH0] = useState(60);
  const [cut, setCut] = useState(30);
  const pts = useMemo(() => developTruncatedCylinder(D, h0, cut, 24), [D, h0, cut]);
  const all = [...pts, { x: 0, y: 0 }, { x: Math.PI * D, y: 0 }];
  const f = fit(all, 560, 240);
  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      <div className="space-y-3">
        <Slider label="Diameter D" value={D} min={30} max={150} unit="mm" onChange={setD} />
        <Slider label="Shortest height" value={h0} min={10} max={150} unit="mm" onChange={setH0} />
        <Slider label="Cut angle" value={cut} min={0} max={60} unit="°" onChange={setCut} />
        <p className="text-xs text-ink-500">Stretch-out length = πD = {fixed(Math.PI * D, 1)} mm. Height at each of 24 divisions is projected across from the elevation; the cut edge becomes a sine-shaped curve.</p>
      </div>
      <svg viewBox="0 0 560 240" className="diagram rounded-lg border border-ink-200 dark:border-ink-800" aria-label="Development of a truncated cylinder">
        <polygon points={[`${f.X(0)},${f.Y(0)}`, ...pts.map((p) => `${f.X(p.x)},${f.Y(p.y)}`), `${f.X(Math.PI * D)},${f.Y(0)}`].join(' ')} fill="#bae6fd" fillOpacity={0.4} stroke={COL.ink} strokeWidth={2} />
        {pts.map((p, i) => <line key={i} x1={f.X(p.x)} x2={f.X(p.x)} y1={f.Y(0)} y2={f.Y(p.y)} stroke={COL.muted} strokeWidth={0.6} strokeDasharray="3 3" />)}
      </svg>
    </div>
  );
}

function CadInterpretation() {
  return (
    <Grid cols={2}>
      <Card title="CAD applications">
        <KeyPoints items={['2D drafting to AS 1100 with layers, standard symbols and title-block templates.', '3D solid and surface modelling; automatic generation of orthogonal views, sections and isometrics from the model.', 'Assemblies with interference checking; exploded views and parts lists.', 'Analysis: finite-element stress analysis, CFD, motion and tolerance studies.', 'Output to manufacturing (CNC, 3D printing) and sharing through cloud collaboration and version control.']} />
      </Card>
      <Card title="Interpreting a drawing — checklist">
        <KeyPoints items={['Read the title block: projection symbol, scale, units, material.', 'Find the front view and relate the others to it using alignment.', 'Identify hidden detail (dashed) and features through centre lines.', 'Locate cutting planes and match each section to its label.', 'Check dimensions against datums; identify tolerances and surface finish notes.']} />
      </Card>
    </Grid>
  );
}
