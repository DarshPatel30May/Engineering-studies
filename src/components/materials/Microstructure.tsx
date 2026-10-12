import { memo } from 'react';
import type { Material } from '@/data/materials';
import { rng } from '@/data/problems';

type Kind = NonNullable<Material['micro']>;

/** Schematic microstructure / structure icons (not to scale). Deterministic so they don't flicker. */
export const Microstructure = memo(function Microstructure({ kind, size = 80 }: { kind: Kind; size?: number }) {
  const r = rng(kind.length * 97 + kind.charCodeAt(0));
  const ink = 'var(--diagram-ink)';
  const content = (() => {
    switch (kind) {
      case 'bcc':
      case 'fcc':
      case 'hcp':
      case 'diamond': {
        const atoms: [number, number, number][] = [];
        const P = (x: number, y: number, z: number): [number, number, number] => [22 + x * 46 + z * 22, 78 - y * 46 - z * 18, z];
        for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) atoms.push(P(x, y, z));
        if (kind === 'bcc') atoms.push(P(0.5, 0.5, 0.5));
        if (kind === 'fcc' || kind === 'diamond') {
          atoms.push(P(0.5, 0.5, 0), P(0.5, 0.5, 1), P(0, 0.5, 0.5), P(1, 0.5, 0.5), P(0.5, 0, 0.5), P(0.5, 1, 0.5));
        }
        if (kind === 'diamond') atoms.push(P(0.25, 0.25, 0.25), P(0.75, 0.75, 0.25), P(0.75, 0.25, 0.75), P(0.25, 0.75, 0.75));
        if (kind === 'hcp') {
          const hex = (y: number, z0: number) => Array.from({ length: 6 }, (_, i) => [50 + 30 * Math.cos((i * Math.PI) / 3), y + 10 * Math.sin((i * Math.PI) / 3), z0] as [number, number, number]);
          return (
            <g>
              {[25, 75].map((y) => (
                <ellipse key={y} cx={50} cy={y} rx={30} ry={10} fill="none" stroke={ink} strokeOpacity={0.4} />
              ))}
              {[...hex(25, 1), ...hex(75, 0), [50, 25, 1] as [number, number, number], [50, 75, 0] as [number, number, number], [42, 50, 0.5] as [number, number, number], [60, 46, 0.5] as [number, number, number], [52, 56, 0.5] as [number, number, number]].map((a, i) => (
                <circle key={i} cx={a[0]} cy={a[1]} r={6} fill="#0ea5e9" fillOpacity={0.4 + a[2] * 0.4} stroke={ink} strokeWidth={0.6} />
              ))}
            </g>
          );
        }
        const edges: [number, number][] = [];
        return (
          <g>
            <path d={`M${P(0, 0, 0)} L${P(1, 0, 0)} L${P(1, 1, 0)} L${P(0, 1, 0)} Z M${P(0, 0, 1)} L${P(1, 0, 1)} L${P(1, 1, 1)} L${P(0, 1, 1)} Z M${P(0, 0, 0)} L${P(0, 0, 1)} M${P(1, 0, 0)} L${P(1, 0, 1)} M${P(1, 1, 0)} L${P(1, 1, 1)} M${P(0, 1, 0)} L${P(0, 1, 1)}`.replace(/(\d+\.?\d*),(\d+\.?\d*),\d+/g, '$1,$2')} fill="none" stroke={ink} strokeOpacity={0.45} strokeWidth={0.8} />
            {edges.length === 0 &&
              atoms
                .sort((a, b) => b[2] - a[2])
                .map((a, i) => <circle key={i} cx={a[0]} cy={a[1]} r={kind === 'diamond' && i >= 14 ? 4 : 6} fill={kind === 'diamond' ? '#8b5cf6' : '#0ea5e9'} fillOpacity={0.5 + (1 - a[2]) * 0.35} stroke={ink} strokeWidth={0.6} />)}
          </g>
        );
      }
      case 'grain':
      case 'pearlite':
      case 'precipitate':
      case 'graphite': {
        // Voronoi-like grains from a jittered grid (drawn as polygons)
        const pts: [number, number][] = [];
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) pts.push([12 + i * 25 + (r() - 0.5) * 14, 12 + j * 25 + (r() - 0.5) * 14]);
        const cells = pts.map((c, k) => {
          const poly: string[] = [];
          for (let a = 0; a < 12; a++) {
            const th = (a / 12) * Math.PI * 2;
            let rad = 30;
            for (const [m, o] of pts.entries()) {
              if (m === k) continue;
              const dx = o[0] - c[0];
              const dy = o[1] - c[1];
              const proj = dx * Math.cos(th) + dy * Math.sin(th);
              if (proj > 0) rad = Math.min(rad, (dx * dx + dy * dy) / (2 * proj));
            }
            poly.push(`${c[0] + rad * Math.cos(th)},${c[1] + rad * Math.sin(th)}`);
          }
          return poly.join(' ');
        });
        return (
          <g>
            {cells.map((p, i) => (
              <polygon key={i} points={p} fill={kind === 'pearlite' && i % 3 === 0 ? 'url(#lam)' : '#94a3b8'} fillOpacity={kind === 'pearlite' && i % 3 === 0 ? 1 : 0.18 + (i % 4) * 0.05} stroke={ink} strokeWidth={0.8} />
            ))}
            {kind === 'precipitate' &&
              Array.from({ length: 70 }, (_, i) => <circle key={i} cx={4 + r() * 92} cy={4 + r() * 92} r={0.9 + r() * 0.8} fill="#7c3aed" />)}
            {kind === 'graphite' &&
              Array.from({ length: 16 }, (_, i) => {
                const x = 8 + r() * 84;
                const y = 8 + r() * 84;
                const a = r() * Math.PI;
                const L = 8 + r() * 10;
                return <path key={i} d={`M${x - L * Math.cos(a)},${y - L * Math.sin(a)} Q${x + 3},${y - 3} ${x + L * Math.cos(a)},${y + L * Math.sin(a)}`} stroke="#111827" strokeWidth={2} fill="none" strokeLinecap="round" />;
              })}
          </g>
        );
      }
      case 'amorphous':
        return (
          <g>
            {Array.from({ length: 34 }, (_, i) => {
              const x = 8 + r() * 84;
              const y = 8 + r() * 84;
              return (
                <g key={i}>
                  <line x1={x} y1={y} x2={x + (r() - 0.5) * 22} y2={y + (r() - 0.5) * 22} stroke={ink} strokeOpacity={0.4} />
                  <circle cx={x} cy={y} r={3.2} fill="#0ea5e9" fillOpacity={0.6} />
                </g>
              );
            })}
          </g>
        );
      case 'linear':
      case 'crosslinked':
      case 'elastomer': {
        const chains = Array.from({ length: 6 }, (_, c) => {
          let x = 4;
          let y = 12 + c * 15;
          const pts = [`${x},${y}`];
          for (let k = 0; k < 14; k++) {
            x += 6.6;
            y += (r() - 0.5) * (kind === 'elastomer' ? 16 : 7);
            pts.push(`${x},${y}`);
          }
          return pts.join(' ');
        });
        const links = kind === 'linear' ? 0 : kind === 'crosslinked' ? 16 : 5;
        return (
          <g>
            {chains.map((p, i) => (
              <polyline key={i} points={p} fill="none" stroke={['#0ea5e9', '#8b5cf6', '#10b981'][i % 3]} strokeWidth={2} strokeLinejoin="round" />
            ))}
            {Array.from({ length: links }, (_, i) => {
              const x = 10 + r() * 80;
              const c = Math.floor(r() * 5);
              return <line key={i} x1={x} x2={x} y1={12 + c * 15} y2={27 + c * 15} stroke="#dc2626" strokeWidth={1.8} />;
            })}
          </g>
        );
      }
      case 'fibre':
        return (
          <g>
            <rect x={0} y={0} width={100} height={100} fill="#f59e0b" fillOpacity={0.15} />
            {Array.from({ length: 9 }, (_, i) => (
              <line key={i} x1={2} x2={98} y1={8 + i * 10.5} y2={8 + i * 10.5} stroke="#334155" strokeWidth={3.2} strokeLinecap="round" />
            ))}
          </g>
        );
      case 'laminate':
        return (
          <g>
            {Array.from({ length: 7 }, (_, i) => (
              <rect key={i} x={4} y={8 + i * 12.5} width={92} height={10} fill={i % 2 ? '#f59e0b' : '#94a3b8'} fillOpacity={i % 2 ? 0.35 : 0.6} stroke={ink} strokeWidth={0.5} />
            ))}
          </g>
        );
      case 'concrete':
        return (
          <g>
            <rect x={0} y={0} width={100} height={100} fill="#94a3b8" fillOpacity={0.25} />
            {Array.from({ length: 22 }, (_, i) => {
              const x = 6 + r() * 88;
              const y = 6 + r() * 88;
              const s = 3 + r() * 9;
              return <polygon key={i} points={`${x - s},${y} ${x - s * 0.3},${y - s} ${x + s},${y - s * 0.4} ${x + s * 0.6},${y + s} ${x - s * 0.5},${y + s * 0.8}`} fill="#78716c" fillOpacity={0.55} stroke={ink} strokeWidth={0.4} />;
            })}
          </g>
        );
    }
  })();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0 rounded-md border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-950" aria-hidden>
      <defs>
        <pattern id="lam" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width={4} height={4} fill="#cbd5e1" />
          <line x1={0} y1={0} x2={0} y2={4} stroke="#334155" strokeWidth={1.4} />
        </pattern>
      </defs>
      {content}
    </svg>
  );
});
