import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { Card, Tabs, KeyPoints, Toggle } from '../ui';

type Lattice = 'bcc' | 'fcc' | 'hcp';
const INFO: Record<Lattice, { name: string; metals: string; apf: string; points: string[] }> = {
  bcc: { name: 'Body-centred cubic (BCC)', metals: 'α-iron (ferrite), chromium, tungsten', apf: '0.68', points: ['8 corner atoms + 1 at the centre (2 atoms per cell).', 'No truly close-packed planes → slip is harder: strong, but ductility drops at low temperature (ductile-to-brittle transition in ferritic steels).', 'Small interstitial gaps — carbon solubility in ferrite is very low.'] },
  fcc: { name: 'Face-centred cubic (FCC)', metals: 'Aluminium, copper, nickel, γ-iron (austenite), austenitic stainless steel', apf: '0.74 (close-packed)', points: ['8 corners + 6 face centres (4 atoms per cell).', 'Many close-packed slip planes → very ductile and tough even at cryogenic temperatures; easily drawn into wire.', 'Larger interstitial sites — austenite dissolves much more carbon than ferrite (key to heat treatment).'] },
  hcp: { name: 'Hexagonal close-packed (HCP)', metals: 'Titanium (α), magnesium, zinc', apf: '0.74 (close-packed)', points: ['Close-packed layers stacked ABAB.', 'Few slip systems at room temperature → less ductile, harder to form cold than FCC metals.', 'Titanium alloys combine HCP α with BCC β phases to balance strength and formability.'] },
};

function atoms(l: Lattice): [number, number, number][] {
  const a: [number, number, number][] = [];
  if (l === 'hcp') {
    for (const y of [0, 1.63]) {
      a.push([0, y, 0]);
      for (let i = 0; i < 6; i++) a.push([Math.cos((i * Math.PI) / 3), y, Math.sin((i * Math.PI) / 3)]);
    }
    for (let i = 0; i < 3; i++) {
      const t = (i * 2 * Math.PI) / 3 + Math.PI / 6;
      a.push([0.577 * Math.cos(t), 0.815, 0.577 * Math.sin(t)]);
    }
    return a;
  }
  for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) a.push([x - 0.5, y - 0.5, z - 0.5]);
  if (l === 'bcc') a.push([0, 0, 0]);
  if (l === 'fcc') a.push([0, 0, -0.5], [0, 0, 0.5], [-0.5, 0, 0], [0.5, 0, 0], [0, -0.5, 0], [0, 0.5, 0]);
  return a;
}

export default function CrystalViewer() {
  const [l, setL] = useState<Lattice>('fcc');
  const [hard, setHard] = useState(false);
  const pts = useMemo(() => atoms(l), [l]);
  const r = hard ? (l === 'bcc' ? 0.433 : l === 'fcc' ? 0.354 : 0.5) : 0.12;
  const edges: [number, number, number][][] =
    l === 'hcp'
      ? [0, 1.63].flatMap((y) => Array.from({ length: 6 }, (_, i) => [[Math.cos((i * Math.PI) / 3), y, Math.sin((i * Math.PI) / 3)], [Math.cos(((i + 1) * Math.PI) / 3), y, Math.sin(((i + 1) * Math.PI) / 3)]] as [number, number, number][]))
          .concat(Array.from({ length: 6 }, (_, i) => [[Math.cos((i * Math.PI) / 3), 0, Math.sin((i * Math.PI) / 3)], [Math.cos((i * Math.PI) / 3), 1.63, Math.sin((i * Math.PI) / 3)]] as [number, number, number][]))
      : (() => {
          const e: [number, number, number][][] = [];
          const c = [-0.5, 0.5];
          for (const y of c) for (const z of c) e.push([[-0.5, y, z], [0.5, y, z]]);
          for (const x of c) for (const z of c) e.push([[x, -0.5, z], [x, 0.5, z]]);
          for (const x of c) for (const y of c) e.push([[x, y, -0.5], [x, y, 0.5]]);
          return e;
        })();
  const info = INFO[l];
  return (
    <Card title="Crystal structures (3D unit cells)" subtitle="Drag to rotate. Structure explains why metals differ in ductility and how heat treatment works.">
      <Tabs value={l} onChange={setL} className="mb-3" tabs={[{ id: 'bcc', label: 'BCC' }, { id: 'fcc', label: 'FCC' }, { id: 'hcp', label: 'HCP' }]} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[320px] overflow-hidden rounded-lg border border-ink-200 bg-gradient-to-b from-ink-50 to-white dark:border-ink-800 dark:from-ink-900 dark:to-ink-950">
          <Canvas camera={{ position: [2.4, 1.8, 2.8], fov: 40 }} dpr={[1, 2]}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 5, 4]} intensity={1.1} />
            <group position={[0, l === 'hcp' ? -0.8 : 0, 0]}>
              {pts.map((p, i) => (
                <mesh key={i} position={p}>
                  <sphereGeometry args={[r, 24, 24]} />
                  <meshStandardMaterial color={l === 'hcp' && i >= 14 ? '#f59e0b' : (l === 'bcc' && i === 8) || (l === 'fcc' && i >= 8) ? '#10b981' : '#0ea5e9'} transparent opacity={hard ? 0.85 : 1} />
                </mesh>
              ))}
              {edges.map((e, i) => <Line key={i} points={e} color="#64748b" lineWidth={1.5} />)}
            </group>
            <OrbitControls enablePan={false} />
          </Canvas>
        </div>
        <div className="space-y-2 text-sm">
          <div className="font-semibold">{info.name}</div>
          <p><span className="font-medium">Examples: </span>{info.metals}</p>
          <p><span className="font-medium">Atomic packing factor: </span>{info.apf}</p>
          <KeyPoints items={info.points} />
          <Toggle checked={hard} onChange={setHard} label="Show atoms touching (hard-sphere model)" />
        </div>
      </div>
    </Card>
  );
}
