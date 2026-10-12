import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { MODELS, bounds, projectView, isometricFaces, type VoxelModel, type ViewName, type Seg2 } from '@/lib/calc/projection';
import { usePrefs } from '@/lib/prefs';
import { Card, Select, Toggle, Callout, Badge, cx } from '../ui';
import { COL } from '../diagrams/svg';
import { rng } from '@/data/problems';

const CAMS: Record<string, [number, number, number]> = {
  front: [0, 0, 14],
  top: [0, 14, 0.001],
  right: [14, 0, 0],
  iso: [9, 8, 9],
};

function CameraRig({ view, centre }: { view: string; centre: THREE.Vector3 }) {
  const { camera } = useThree();
  const ctrl = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  useEffect(() => {
    const [x, y, z] = CAMS[view];
    camera.position.set(centre.x + x, centre.y + y, centre.z + z);
    camera.lookAt(centre);
    ctrl.current?.target.copy(centre);
    ctrl.current?.update();
  }, [view, camera, centre]);
  return <OrbitControls ref={ctrl} enablePan={false} />;
}

function VoxelMesh({ model, dark }: { model: VoxelModel; dark: boolean }) {
  return (
    <group>
      {model.voxels.map(([x, y, z], i) => (
        <mesh key={i} position={[x + 0.5, y + 0.5, z + 0.5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={dark ? '#64748b' : '#cbd5e1'} />
          <Edges color={dark ? '#e2e8f0' : '#334155'} threshold={15} />
        </mesh>
      ))}
    </group>
  );
}

export function OrthoView({ segs, w, h, unit, label, dims, scale = 22 }: { segs: Seg2[]; w: [number, number]; h: [number, number]; unit: number; label: string; dims?: { horiz?: boolean; vert?: boolean }; scale?: number }) {
  const pad = 26;
  const W = (w[1] - w[0]) * scale + pad * 2;
  const H = (h[1] - h[0]) * scale + pad * 2;
  const X = (u: number) => pad + (u - w[0]) * scale;
  const Y = (v: number) => pad + (h[1] - v) * scale;
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} className="diagram" style={{ maxWidth: W * 1.4 }} aria-label={label}>
      {segs.filter((s) => s.hidden).map((s, i) => <line key={'h' + i} x1={X(s.x1)} y1={Y(s.y1)} x2={X(s.x2)} y2={Y(s.y2)} stroke={COL.ink} strokeWidth={1} strokeDasharray="5 3" />)}
      {segs.filter((s) => !s.hidden).map((s, i) => <line key={'v' + i} x1={X(s.x1)} y1={Y(s.y1)} x2={X(s.x2)} y2={Y(s.y2)} stroke={COL.ink} strokeWidth={2.2} strokeLinecap="square" />)}
      {dims?.horiz && (
        <g stroke={COL.muted} fill={COL.muted} fontSize={9}>
          <line x1={X(w[0])} x2={X(w[1])} y1={H - 6} y2={H - 6} strokeWidth={0.7} />
          <text x={(X(w[0]) + X(w[1])) / 2} y={H - 9} textAnchor="middle" stroke="none">{(w[1] - w[0]) * unit}</text>
        </g>
      )}
      {dims?.vert && (
        <g stroke={COL.muted} fill={COL.muted} fontSize={9}>
          <line x1={W - 8} x2={W - 8} y1={Y(h[0])} y2={Y(h[1])} strokeWidth={0.7} />
          <text x={W - 11} y={(Y(h[0]) + Y(h[1])) / 2} textAnchor="end" stroke="none">{(h[1] - h[0]) * unit}</text>
        </g>
      )}
      <text x={W / 2} y={H + 10} fontSize={10} textAnchor="middle" fill={COL.ink} fontWeight={600}>{label}</text>
    </svg>
  );
}

export function IsoView({ model, size = 220 }: { model: VoxelModel; size?: number }) {
  const faces = useMemo(() => isometricFaces(model, 20), [model]);
  const xs = faces.flatMap((f) => f.pts.map((p) => p[0]));
  const ys = faces.flatMap((f) => f.pts.map((p) => p[1]));
  const minX = Math.min(...xs) - 10;
  const minY = Math.min(...ys) - 10;
  const W = Math.max(...xs) - minX + 10;
  const H = Math.max(...ys) - minY + 10;
  const shade = { top: '#e2e8f0', left: '#94a3b8', right: '#cbd5e1' };
  return (
    <svg viewBox={`${minX} ${minY} ${W} ${H}`} className="diagram" style={{ maxWidth: size }} aria-label="Isometric view">
      {faces.map((f, i) => <polygon key={i} points={f.pts.map((p) => p.join(',')).join(' ')} fill={shade[f.shade]} stroke={shade[f.shade]} strokeWidth={0.6} />)}
    </svg>
  );
}

export default function ProjectionExplorer() {
  const [id, setId] = useState(MODELS[0].id);
  const [cam, setCam] = useState('iso');
  const [hidden, setHidden] = useState(true);
  const { isDark } = usePrefs();
  const model = MODELS.find((m) => m.id === id)!;
  const b = bounds(model);
  const centre = useMemo(() => new THREE.Vector3((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (b.minZ + b.maxZ) / 2), [b.minX, b.maxX, b.minY, b.maxY, b.minZ, b.maxZ]);
  const views = useMemo(() => {
    const f = (v: ViewName) => projectView(model, v).filter((s) => hidden || !s.hidden);
    return { front: f('front'), top: f('top'), right: f('right') };
  }, [model, hidden]);
  const hasHidden = useMemo(() => (['front', 'top', 'right'] as ViewName[]).some((v) => projectView(model, v).some((s) => s.hidden)), [model]);
  return (
    <Card title="3D → 2D Drawing Explorer" subtitle="Rotate the object, then compare it with its third-angle orthogonal views (generated exactly from the 3D geometry, including hidden detail)">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Select label="Object" value={id} onChange={setId} options={MODELS.map((m) => ({ value: m.id, label: m.name }))} />
        <div className="flex flex-wrap gap-1">
          {Object.keys(CAMS).map((k) => (
            <button key={k} className={cx('btn text-xs capitalize', cam === k && 'btn-primary')} onClick={() => setCam(k)}>
              Look from {k === 'iso' ? 'isometric' : k}
            </button>
          ))}
        </div>
        <Toggle checked={hidden} onChange={setHidden} label="Show hidden detail" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div>
          <div className="h-[340px] overflow-hidden rounded-lg border border-ink-200 bg-gradient-to-b from-ink-50 to-white dark:border-ink-800 dark:from-ink-900 dark:to-ink-950">
            <Canvas orthographic camera={{ zoom: 38, position: [9, 8, 9], near: 0.1, far: 100 }} dpr={[1, 2]}>
              <ambientLight intensity={0.75} />
              <directionalLight position={[6, 10, 8]} intensity={0.9} />
              <VoxelMesh model={model} dark={isDark} />
              <CameraRig view={cam} centre={centre} />
              <axesHelper args={[1.5]} position={[b.minX - 0.6, b.minY, b.maxZ + 0.6]} />
            </Canvas>
          </div>
          <p className="mt-1 text-xs text-ink-500">Front = the face toward +z (towards you in “Look from front”). Axes: red x, green y, blue z. Each cube = {model.unit} mm.</p>
          <div className="mt-3 flex items-center gap-3">
            <IsoView model={model} size={200} />
            <p className="text-xs text-ink-500">Isometric pictorial: receding edges at 30° to the horizontal; vertical edges stay vertical; all three axes drawn at true scale (isometric drawing, not projection).</p>
          </div>
        </div>
        <div className="rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-950">
          <div className="mb-1 flex items-center justify-between">
            <Badge tone="emerald">Third-angle projection</Badge>
            <ThirdAngleSymbol />
          </div>
          <div className="grid grid-cols-[auto_auto] items-end justify-start gap-x-6 gap-y-2">
            <OrthoView segs={views.top} w={[b.minX, b.maxX]} h={[-b.maxZ, -b.minZ]} unit={model.unit} label="TOP VIEW (plan)" dims={{ horiz: false }} />
            <div />
            <OrthoView segs={views.front} w={[b.minX, b.maxX]} h={[b.minY, b.maxY]} unit={model.unit} label="FRONT VIEW (elevation)" dims={{ horiz: true, vert: false }} />
            <OrthoView segs={views.right} w={[-b.maxZ, -b.minZ]} h={[b.minY, b.maxY]} unit={model.unit} label="RIGHT SIDE VIEW" dims={{ horiz: true, vert: true }} />
          </div>
          {!hasHidden && hidden && <p className="mt-2 text-xs text-ink-500">This object has no hidden edges in these three views.</p>}
        </div>
      </div>
      <Callout kind="info" className="mt-3">
        In third-angle projection (standard Australian practice) the top view is drawn ABOVE the front view and the right view to the RIGHT of it — each view sits on the side it is seen from. Views line up: widths align vertically between top and front; heights align horizontally between front and side. Visible outlines are thick continuous lines; hidden edges are thin dashed lines. Simplified: overall dimensions only (mm); not a fully dimensioned AS 1100 drawing.
      </Callout>
    </Card>
  );
}

/** Projection symbol: truncated cone (small end to the right) and its end view. Third angle: end view on the right. */
export function ThirdAngleSymbol({ first = false }: { first?: boolean }) {
  return (
    <svg width={64} height={26} viewBox="0 0 64 26" aria-label={first ? 'First-angle projection symbol' : 'Third-angle projection symbol'}>
      <g fill="none" stroke={COL.ink} strokeWidth={1.2}>
        {first ? (
          <>
            <circle cx={12} cy={13} r={9} />
            <circle cx={12} cy={13} r={4} />
            <path d="M 30 3 L 56 8 L 56 18 L 30 23 Z" />
          </>
        ) : (
          <>
            <path d="M 4 3 L 30 8 L 30 18 L 4 23 Z" />
            <circle cx={50} cy={13} r={9} />
            <circle cx={50} cy={13} r={4} />
          </>
        )}
      </g>
    </svg>
  );
}

// ───────────────────────── Practice: identify the view ─────────────────────────
export function ViewQuiz() {
  const [seed, setSeed] = useState(1);
  const [pick, setPick] = useState<number | null>(null);
  const q = useMemo(() => {
    const r = rng(seed * 31 + 7);
    const model = MODELS[Math.floor(r() * MODELS.length)];
    const views: ViewName[] = ['front', 'top', 'right'];
    const target = views[Math.floor(r() * 3)];
    const b = bounds(model);
    const ranges: Record<ViewName, { w: [number, number]; h: [number, number] }> = {
      front: { w: [b.minX, b.maxX], h: [b.minY, b.maxY] },
      top: { w: [b.minX, b.maxX], h: [-b.maxZ, -b.minZ] },
      right: { w: [-b.maxZ, -b.minZ], h: [b.minY, b.maxY] },
    };
    const key = (s: Seg2[]) => s.map((x) => `${x.hidden ? 'h' : 'v'}${Math.min(x.x1, x.x2)},${Math.min(x.y1, x.y2)},${Math.max(x.x1, x.x2)},${Math.max(x.y1, x.y2)}`).sort().join('|');
    const opts: { segs: Seg2[]; w: [number, number]; h: [number, number]; correct: boolean; why: string }[] = views.map((v) => ({ segs: projectView(model, v), ...ranges[v], correct: v === target, why: v === target ? 'Correct.' : `This is the ${v} view.` }));
    // Mirrored distractor (wrong-angle projection / flipped view)
    const t = ranges[target];
    const mirror = projectView(model, target).map((s) => ({ ...s, x1: t.w[0] + t.w[1] - s.x1, x2: t.w[0] + t.w[1] - s.x2 }));
    if (key(mirror) !== key(opts.find((o) => o.correct)!.segs)) opts.push({ segs: mirror, ...t, correct: false, why: 'This is a mirror image — it is what you would get by placing the view on the wrong side (first-angle confusion) or by reflecting it.' });
    // de-duplicate identical drawings
    const seen = new Set<string>();
    const uniq = opts.filter((o) => {
      const k = key(o.segs) + o.w.join() + o.h.join();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const order = uniq.map((o) => ({ o, k: r() })).sort((a, b2) => a.k - b2.k).map((x) => x.o);
    return { model, target, opts: order };
  }, [seed]);
  const chosen = pick !== null ? q.opts[pick] : null;
  return (
    <Card title="Practice: identify the correct view" subtitle="Third-angle projection. Hidden edges are dashed.">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div>
          <IsoView model={q.model} />
          <p className="mt-2 text-sm">Which drawing is the <strong className="uppercase">{q.target}</strong> view of this {q.model.name.toLowerCase()}? (The front faces you in the bottom-left of the pictorial.)</p>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {q.opts.map((o, i) => (
              <button
                key={i}
                onClick={() => setPick(i)}
                disabled={pick !== null}
                className={cx('rounded-lg border-2 p-2 transition', pick === null ? 'border-ink-200 hover:border-emerald-400 dark:border-ink-700' : o.correct ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : pick === i ? 'border-red-500 bg-red-50 dark:bg-red-950/40' : 'border-ink-200 opacity-60 dark:border-ink-700')}
              >
                <OrthoView segs={o.segs} w={o.w} h={o.h} unit={q.model.unit} label={String.fromCharCode(65 + i)} scale={16} />
              </button>
            ))}
          </div>
          {chosen && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge tone={chosen.correct ? 'emerald' : 'red'}>{chosen.correct ? 'Correct!' : 'Not quite'}</Badge>
              <span className="text-sm">{chosen.why}</span>
              <button className="btn btn-primary text-xs" onClick={() => (setSeed((s) => s + 1), setPick(null))}>Next question</button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
