/** Shared SVG primitives for engineering diagrams. All coordinates in SVG user units. */
import type { ReactNode } from 'react';

export const COL = {
  load: '#d97706',
  reaction: '#059669',
  tension: '#2563eb',
  compression: '#dc2626',
  zero: '#94a3b8',
  ink: 'var(--diagram-ink)',
  muted: 'var(--diagram-muted)',
  civil: '#2e7d32',
  transport: '#ea580c',
  aero: '#0284c7',
  telecom: '#7c3aed',
  emerald: '#059669',
};

export function Arrow({ x1, y1, x2, y2, color = COL.ink, w = 2, head = 9, dashed, className }: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  w?: number;
  head?: number;
  dashed?: boolean;
  className?: string;
}) {
  const L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 0.5) return null;
  const ux = (x2 - x1) / L;
  const uy = (y2 - y1) / L;
  const h = Math.min(head, L * 0.6);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const px = -uy * h * 0.45;
  const py = ux * h * 0.45;
  return (
    <g className={className}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={w} strokeDasharray={dashed ? '5 4' : undefined} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`} fill={color} />
    </g>
  );
}

/** Pin support drawn with its apex at (x, y). */
export function PinSupport({ x, y, s = 14, label }: { x: number; y: number; s?: number; label?: string }) {
  return (
    <g>
      <polygon points={`${x},${y} ${x - s},${y + s * 1.3} ${x + s},${y + s * 1.3}`} fill="none" stroke={COL.ink} strokeWidth={1.6} />
      <circle cx={x} cy={y} r={2.5} fill={COL.ink} />
      <Hatch x={x - s - 4} y={y + s * 1.3} w={2 * s + 8} />
      {label && (
        <text x={x} y={y + s * 1.3 + 18} textAnchor="middle" fontSize={12} fontWeight={600} fill={COL.ink}>
          {label}
        </text>
      )}
    </g>
  );
}

export function RollerSupport({ x, y, s = 14, label }: { x: number; y: number; s?: number; label?: string }) {
  const r = 3.5;
  return (
    <g>
      <polygon points={`${x},${y} ${x - s},${y + s * 1.05} ${x + s},${y + s * 1.05}`} fill="none" stroke={COL.ink} strokeWidth={1.6} />
      <circle cx={x} cy={y} r={2.5} fill={COL.ink} />
      {[-s * 0.6, 0, s * 0.6].map((dx) => (
        <circle key={dx} cx={x + dx} cy={y + s * 1.05 + r} r={r} fill="none" stroke={COL.ink} strokeWidth={1.3} />
      ))}
      <Hatch x={x - s - 4} y={y + s * 1.05 + 2 * r} w={2 * s + 8} />
      {label && (
        <text x={x} y={y + s * 1.05 + 2 * r + 18} textAnchor="middle" fontSize={12} fontWeight={600} fill={COL.ink}>
          {label}
        </text>
      )}
    </g>
  );
}

export function Hatch({ x, y, w }: { x: number; y: number; w: number }) {
  const n = Math.max(3, Math.floor(w / 6));
  return (
    <g stroke={COL.muted} strokeWidth={1}>
      <line x1={x} y1={y} x2={x + w} y2={y} stroke={COL.ink} strokeWidth={1.4} />
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={x + (i * w) / n + 4} y1={y} x2={x + (i * w) / n} y2={y + 5} />
      ))}
    </g>
  );
}

/** Horizontal dimension line with arrowheads and centred label (AS 1100 style: thin lines). */
export function DimH({ x1, x2, y, label, ext = 0, color = COL.muted }: { x1: number; x2: number; y: number; label: string; ext?: number; color?: string }) {
  if (Math.abs(x2 - x1) < 2) return null;
  return (
    <g>
      {ext !== 0 && (
        <>
          <line x1={x1} y1={y - ext} x2={x1} y2={y + 4} stroke={color} strokeWidth={0.8} />
          <line x1={x2} y1={y - ext} x2={x2} y2={y + 4} stroke={color} strokeWidth={0.8} />
        </>
      )}
      <Arrow x1={(x1 + x2) / 2} y1={y} x2={x1} y2={y} color={color} w={0.9} head={6} />
      <Arrow x1={(x1 + x2) / 2} y1={y} x2={x2} y2={y} color={color} w={0.9} head={6} />
      <rect x={(x1 + x2) / 2 - label.length * 3.4 - 3} y={y - 9} width={label.length * 6.8 + 6} height={14} fill="var(--diagram-bg)" opacity={0.92} rx={2} />
      <text x={(x1 + x2) / 2} y={y + 2} textAnchor="middle" fontSize={11} fill={COL.ink}>
        {label}
      </text>
    </g>
  );
}

export function Label({ x, y, children, color = COL.ink, size = 12, anchor = 'middle', weight = 500, bg }: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  bg?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      fill={color}
      fontWeight={weight}
      style={bg ? { paintOrder: 'stroke', stroke: 'var(--diagram-bg)', strokeWidth: 4, strokeLinejoin: 'round' } : undefined}
    >
      {children}
    </text>
  );
}

/** Curved moment arrow (anticlockwise if ccw). */
export function MomentArrow({ cx, cy, r = 16, ccw = true, color = COL.ink }: { cx: number; cy: number; r?: number; ccw?: boolean; color?: string }) {
  const a0 = ccw ? -0.2 : Math.PI + 0.2;
  const a1 = ccw ? Math.PI * 1.3 : -Math.PI * 0.3;
  const p0 = { x: cx + r * Math.cos(a0), y: cy - r * Math.sin(a0) };
  const p1 = { x: cx + r * Math.cos(a1), y: cy - r * Math.sin(a1) };
  const tangent = ccw ? { x: Math.sin(a1), y: Math.cos(a1) } : { x: -Math.sin(a1), y: -Math.cos(a1) };
  return (
    <g>
      <path d={`M ${p0.x} ${p0.y} A ${r} ${r} 0 1 ${ccw ? 0 : 1} ${p1.x} ${p1.y}`} fill="none" stroke={color} strokeWidth={1.6} />
      <Arrow x1={p1.x - tangent.x * 6} y1={p1.y - tangent.y * 6} x2={p1.x + tangent.x * 2} y2={p1.y + tangent.y * 2} color={color} w={1.6} head={7} />
    </g>
  );
}
