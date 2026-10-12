import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Card, Slider, KeyPoints, Toggle, Badge } from '../ui';
import { usePrefs } from '@/lib/prefs';

/**
 * 3D control-surface explorer. Inputs deflect the surfaces; the aircraft then rotates about the
 * corresponding axis (attitude response is schematic, not a flight-dynamics simulation).
 */
export default function ControlSurfaces3D() {
  const [roll, setRoll] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [axes, setAxes] = useState(true);
  const { isDark } = usePrefs();
  const active = roll !== 0 ? 'roll' : pitch !== 0 ? 'pitch' : yaw !== 0 ? 'yaw' : null;
  return (
    <Card title="Aircraft control surfaces" subtitle="3D model — drag to orbit, scroll to zoom. Move the controls to deflect the surfaces.">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="h-[360px] overflow-hidden rounded-lg border border-ink-200 bg-gradient-to-b from-sky-100 to-white dark:border-ink-800 dark:from-sky-950 dark:to-ink-950">
          <Canvas camera={{ position: [6, 4, 8], fov: 40 }} dpr={[1, 2]}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 10, 6]} intensity={1.1} />
            <Aircraft roll={roll} pitch={pitch} yaw={yaw} axes={axes} dark={isDark} />
            <OrbitControls enablePan={false} minDistance={6} maxDistance={18} />
          </Canvas>
        </div>
        <div className="space-y-3">
          <Slider label="Control stick left/right → ailerons (roll)" value={roll} min={-1} max={1} step={0.05} onChange={setRoll} format={(v) => (v === 0 ? 'centre' : v > 0 ? `right ${Math.round(v * 100)}%` : `left ${Math.round(-v * 100)}%`)} />
          <Slider label="Control stick back/forward → elevator (pitch)" value={pitch} min={-1} max={1} step={0.05} onChange={setPitch} format={(v) => (v === 0 ? 'centre' : v > 0 ? `back ${Math.round(v * 100)}%` : `forward ${Math.round(-v * 100)}%`)} />
          <Slider label="Rudder pedals → rudder (yaw)" value={yaw} min={-1} max={1} step={0.05} onChange={setYaw} format={(v) => (v === 0 ? 'centre' : v > 0 ? `right ${Math.round(v * 100)}%` : `left ${Math.round(-v * 100)}%`)} />
          <Toggle checked={axes} onChange={setAxes} label="Show axes of rotation" />
          <button className="btn w-full text-xs" onClick={() => (setRoll(0), setPitch(0), setYaw(0))}>Centre all controls</button>
          {active && <Badge tone="aero">{{ roll: 'Roll about the longitudinal axis', pitch: 'Pitch about the lateral axis', yaw: 'Yaw about the normal (vertical) axis' }[active]}</Badge>}
          <KeyPoints
            items={[
              'Ailerons move in OPPOSITE directions: the down-going aileron increases lift on that wing, the up-going one reduces it → roll.',
              'Elevator up (stick back) pushes the tail down → nose pitches up.',
              'Rudder deflected right pushes the tail left → nose yaws right.',
              'All rotations are about the centre of gravity.',
            ]}
          />
        </div>
      </div>
    </Card>
  );
}

function Aircraft({ roll, pitch, yaw, axes, dark }: { roll: number; pitch: number; yaw: number; axes: boolean; dark: boolean }) {
  const body = useRef<THREE.Group>(null);
  // Body frame: x forward (nose), y up, z toward the RIGHT wing.
  const target = { r: roll * 0.5, p: pitch * 0.3, y: -yaw * 0.35 };
  useFrame((_, dt) => {
    const g = body.current;
    if (!g) return;
    const k = Math.min(1, dt * 2.5);
    g.rotation.x += (target.r - g.rotation.x) * k; // roll about longitudinal (x) axis
    g.rotation.z += (target.p - g.rotation.z) * k; // pitch about lateral (z) axis
    g.rotation.y += (target.y - g.rotation.y) * k; // yaw about normal (y) axis
  });
  const ail = roll * 0.45;
  const elev = -pitch * 0.45;
  const rud = yaw * 0.45;
  const skin = dark ? '#cbd5e1' : '#e2e8f0';
  const accent = '#0284c7';
  const surf = '#f59e0b';
  return (
    <group ref={body}>
      {/* Fuselage along x (nose at +x) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.22, 5, 24]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[2.75, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.35, 0.6, 24]} />
        <meshStandardMaterial color={accent} />
      </mesh>
      {/* Wings */}
      <mesh position={[0.4, 0, 0]}>
        <boxGeometry args={[1.0, 0.08, 6.4]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      {/* Ailerons (hinged at trailing edge x = −0.1), outboard */}
      {[1, -1].map((side) => (
        <group key={side} position={[-0.1, 0, side * 2.4]} rotation={[0, 0, -side * ail]}>
          <mesh position={[-0.18, 0, 0]}>
            <boxGeometry args={[0.36, 0.06, 1.4]} />
            <meshStandardMaterial color={surf} />
          </mesh>
        </group>
      ))}
      {/* Tailplane + elevator */}
      <mesh position={[-2.1, 0, 0]}>
        <boxGeometry args={[0.6, 0.06, 2.4]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <group position={[-2.4, 0, 0]} rotation={[0, 0, elev]}>
        <mesh position={[-0.15, 0, 0]}>
          <boxGeometry args={[0.3, 0.05, 2.3]} />
          <meshStandardMaterial color={surf} />
        </mesh>
      </group>
      {/* Fin + rudder */}
      <mesh position={[-2.05, 0.55, 0]}>
        <boxGeometry args={[0.7, 1.0, 0.06]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <group position={[-2.4, 0.55, 0]} rotation={[0, rud, 0]}>
        <mesh position={[-0.15, 0, 0]}>
          <boxGeometry args={[0.3, 0.95, 0.05]} />
          <meshStandardMaterial color={surf} />
        </mesh>
      </group>
      {axes && (
        <group>
          <Line points={[[-3.5, 0, 0], [3.8, 0, 0]]} color="#dc2626" lineWidth={2} />
          <Line points={[[0, 0, -4], [0, 0, 4]]} color="#16a34a" lineWidth={2} />
          <Line points={[[0, -2, 0], [0, 2, 0]]} color="#2563eb" lineWidth={2} />
          <Html position={[3.9, 0, 0]} center style={{ fontSize: 11, color: '#dc2626', whiteSpace: 'nowrap', pointerEvents: 'none' }}>longitudinal (roll)</Html>
          <Html position={[0, 0, 4.2]} center style={{ fontSize: 11, color: '#16a34a', whiteSpace: 'nowrap', pointerEvents: 'none' }}>lateral (pitch)</Html>
          <Html position={[0, 2.2, 0]} center style={{ fontSize: 11, color: '#2563eb', whiteSpace: 'nowrap', pointerEvents: 'none' }}>normal (yaw)</Html>
        </group>
      )}
    </group>
  );
}
