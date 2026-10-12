import type { DiagramKey } from '@/data/questions';
import { Arrow, PinSupport, RollerSupport, Label, COL, DimH, Hatch } from '../diagrams/svg';

export default function QuestionDiagram({ k }: { k: DiagramKey }) {
  const box = (children: React.ReactNode, w = 520, h = 200, label = 'Question diagram') => (
    <svg viewBox={`0 0 ${w} ${h}`} className="diagram mx-auto max-w-xl rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950" role="img" aria-label={label}>
      {children}
    </svg>
  );
  switch (k) {
    case 'beam-6m':
    case 'beam-8m': {
      const L = k === 'beam-6m' ? 6 : 8;
      const loads = k === 'beam-6m' ? [{ x: 2, P: 18 }] : [{ x: 2, P: 10 }, { x: 5, P: 20 }];
      const sx = (x: number) => 50 + (x / L) * 420;
      return box(
        <>
          <rect x={50} y={80} width={420} height={10} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={1.6} />
          <PinSupport x={50} y={90} label="A" />
          <RollerSupport x={470} y={90} label="B" />
          {loads.map((l) => (
            <g key={l.x}>
              <Arrow x1={sx(l.x)} y1={20} x2={sx(l.x)} y2={78} color={COL.load} w={2.4} />
              <Label x={sx(l.x)} y={16} color={COL.load} weight={700}>{l.P} kN</Label>
            </g>
          ))}
          {[0, ...loads.map((l) => l.x), L].slice(0, -1).map((x, i, arr) => {
            const next = i + 1 < arr.length ? arr[i + 1] : L;
            return <DimH key={i} x1={sx(x)} x2={sx(next)} y={170} label={`${next - x} m`} ext={10} />;
          })}
        </>,
        520,
        190,
        'Simply supported beam',
      );
    }
    case 'truss-triangle':
      return box(
        <>
          <line x1={80} y1={150} x2={440} y2={150} stroke={COL.ink} strokeWidth={3} />
          <line x1={80} y1={150} x2={260} y2={40} stroke={COL.ink} strokeWidth={3} />
          <line x1={440} y1={150} x2={260} y2={40} stroke={COL.ink} strokeWidth={3} />
          {[[80, 150], [440, 150], [260, 40]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={5} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={2} />)}
          <PinSupport x={80} y={156} s={11} />
          <RollerSupport x={440} y={156} s={11} />
          <Arrow x1={260} y1={0} x2={260} y2={33} color={COL.load} w={2.4} />
          <text x={66} y={146} fontSize={13} fontWeight={700} fill={COL.ink}>A</text>
          <text x={448} y={146} fontSize={13} fontWeight={700} fill={COL.ink}>B</text>
          <text x={270} y={44} fontSize={13} fontWeight={700} fill={COL.ink}>C</text>
        </>,
        520,
        195,
        'Triangular pin-jointed truss',
      );
    case 'sfd-read': {
      const sx = (x: number) => 50 + (x / 8) * 420;
      const sy = (v: number) => 100 - v * 3.2;
      return box(
        <>
          <line x1={50} x2={470} y1={100} y2={100} stroke={COL.muted} />
          <polyline points={`${sx(0)},${sy(0)} ${sx(0)},${sy(15)} ${sx(2)},${sy(15)} ${sx(2)},${sy(5)} ${sx(5)},${sy(5)} ${sx(5)},${sy(-15)} ${sx(8)},${sy(-15)} ${sx(8)},${sy(0)}`} fill="#0ea5e9" fillOpacity={0.15} stroke="#0ea5e9" strokeWidth={2.2} />
          {[0, 2, 5, 8].map((x) => <text key={x} x={sx(x)} y={175} fontSize={11} textAnchor="middle" fill={COL.ink}>{x} m</text>)}
          <text x={sx(1)} y={sy(15) - 6} fontSize={11} textAnchor="middle" fill={COL.ink}>+15</text>
          <text x={sx(3.5)} y={sy(5) - 6} fontSize={11} textAnchor="middle" fill={COL.ink}>+5</text>
          <text x={sx(6.5)} y={sy(-15) + 16} fontSize={11} textAnchor="middle" fill={COL.ink}>−15</text>
          <text x={52} y={16} fontSize={11} fill={COL.ink}>Shear force (kN)</text>
        </>,
        520,
        185,
        'Shear force diagram',
      );
    }
    case 'stress-strain':
      return box(
        <>
          <line x1={50} x2={480} y1={170} y2={170} stroke={COL.ink} />
          <line x1={50} x2={50} y1={10} y2={170} stroke={COL.ink} />
          <path d="M 50 170 L 80 70 L 90 74 L 150 74 C 220 40, 320 30, 360 32 C 400 34, 430 60, 450 90" fill="none" stroke="#0ea5e9" strokeWidth={2.4} />
          {[['P', 80, 70], ['Q', 150, 74], ['R', 360, 32], ['S', 450, 90]].map(([t, x, y]) => (
            <g key={t as string}><circle cx={x as number} cy={y as number} r={4} fill={COL.load} /><text x={(x as number) + 6} y={(y as number) - 6} fontSize={12} fontWeight={700} fill={COL.ink}>{t}</text></g>
          ))}
          <text x={265} y={190} fontSize={11} textAnchor="middle" fill={COL.ink}>Strain</text>
          <text x={16} y={90} fontSize={11} fill={COL.ink} transform="rotate(-90 16 90)">Stress</text>
        </>,
        520,
        200,
        'Stress–strain curve with points P, Q, R, S',
      );
    case 'logic-nand-not':
      return box(
        <>
          <text x={40} y={66} fontSize={13} fontWeight={700} fill={COL.ink}>A</text>
          <text x={40} y={126} fontSize={13} fontWeight={700} fill={COL.ink}>B</text>
          <line x1={58} x2={160} y1={62} y2={62} stroke={COL.ink} strokeWidth={2} />
          <line x1={58} x2={160} y1={122} y2={122} stroke={COL.ink} strokeWidth={2} />
          <path d="M 160 52 L 200 52 A 40 40 0 0 1 200 132 L 160 132 Z" fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={2} />
          <circle cx={246} cy={92} r={6} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={2} />
          <line x1={252} x2={300} y1={92} y2={92} stroke={COL.ink} strokeWidth={2} />
          <path d="M 300 70 L 350 92 L 300 114 Z" fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={2} />
          <circle cx={356} cy={92} r={6} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={2} />
          <line x1={362} x2={440} y1={92} y2={92} stroke={COL.ink} strokeWidth={2} />
          <text x={448} y={96} fontSize={13} fontWeight={700} fill={COL.ink}>Q</text>
        </>,
        520,
        180,
        'NAND gate followed by NOT gate',
      );
    case 'logic-nor':
      return box(
        <>
          <text x={60} y={66} fontSize={13} fontWeight={700} fill={COL.ink}>A = 0</text>
          <text x={60} y={126} fontSize={13} fontWeight={700} fill={COL.ink}>B = 1</text>
          <line x1={110} x2={200} y1={62} y2={62} stroke={COL.ink} strokeWidth={2} />
          <line x1={110} x2={200} y1={122} y2={122} stroke={COL.ink} strokeWidth={2} />
          <path d="M 190 52 Q 210 92 190 132 Q 260 132 300 92 Q 260 52 190 52 Z" fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={2} />
          <circle cx={306} cy={92} r={6} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={2} />
          <line x1={312} x2={400} y1={92} y2={92} stroke={COL.ink} strokeWidth={2} />
          <text x={408} y={96} fontSize={13} fontWeight={700} fill={COL.ink}>Q = ?</text>
        </>,
        520,
        180,
        'NOR gate',
      );
    case 'am-fm': {
      const wave = (y0: number, f: (t: number) => number) => Array.from({ length: 401 }, (_, i) => `${40 + i * 1.1},${y0 - f(i / 400) * 26}`).join(' ');
      return box(
        <>
          <text x={10} y={48} fontSize={12} fontWeight={700} fill={COL.ink}>X</text>
          <polyline points={wave(50, (t) => (1 + 0.6 * Math.sin(2 * Math.PI * 2 * t)) / 1.6 * Math.sin(2 * Math.PI * 30 * t))} fill="none" stroke={COL.telecom} strokeWidth={1.6} />
          <text x={10} y={138} fontSize={12} fontWeight={700} fill={COL.ink}>Y</text>
          <polyline points={wave(140, (t) => Math.sin(2 * Math.PI * 30 * t + 4 * Math.sin(2 * Math.PI * 2 * t)))} fill="none" stroke="#10b981" strokeWidth={1.6} />
        </>,
        520,
        180,
        'Two modulated waveforms X and Y',
      );
    }
    case 'incline':
      return box(
        <>
          <polygon points="60,170 440,170 440,40" fill={COL.muted} opacity={0.15} stroke={COL.ink} />
          <Hatch x={50} y={170} w={400} />
          <g transform="translate(260 110) rotate(-18.9)">
            <rect x={-30} y={-36} width={60} height={36} fill="#0ea5e9" opacity={0.35} stroke="#0284c7" />
          </g>
          <path d="M 120 170 A 60 60 0 0 0 117 151" fill="none" stroke={COL.ink} />
          <text x={128} y={162} fontSize={12} fill={COL.ink}>θ</text>
        </>,
        520,
        190,
        'Block on an inclined plane',
      );
    case 'pulley-4':
      return box(
        <>
          <rect x={160} y={10} width={200} height={8} fill={COL.ink} />
          <circle cx={230} cy={40} r={18} fill="none" stroke={COL.ink} strokeWidth={2} />
          <circle cx={290} cy={40} r={18} fill="none" stroke={COL.ink} strokeWidth={2} />
          <circle cx={230} cy={130} r={18} fill="none" stroke={COL.ink} strokeWidth={2} />
          <circle cx={290} cy={130} r={18} fill="none" stroke={COL.ink} strokeWidth={2} />
          {[212, 248, 272, 308].map((x) => <line key={x} x1={x} x2={x} y1={40} y2={130} stroke={COL.tension} strokeWidth={2} />)}
          <line x1={326} x2={326} y1={40} y2={175} stroke={COL.tension} strokeWidth={2} />
          <Arrow x1={326} y1={150} x2={326} y2={180} color={COL.reaction} w={2.2} />
          <rect x={235} y={150} width={50} height={30} fill={COL.load} opacity={0.35} stroke={COL.load} />
          <line x1={260} x2={260} y1={130} y2={150} stroke={COL.ink} />
          <text x={336} y={176} fontSize={11} fill={COL.reaction}>effort</text>
        </>,
        520,
        190,
        'Pulley block',
      );
    case 'four-forces':
      return box(
        <>
          <ellipse cx={260} cy={100} rx={120} ry={16} fill="#bae6fd" stroke={COL.aero} />
          <Arrow x1={260} y1={100} x2={260} y2={30} color={COL.reaction} w={2.4} />
          <Arrow x1={260} y1={100} x2={260} y2={170} color={COL.ink} w={2.4} />
          <Arrow x1={380} y1={100} x2={460} y2={100} color={COL.load} w={2.4} />
          <Arrow x1={140} y1={100} x2={60} y2={100} color={COL.compression} w={2.4} />
          <text x={266} y={34} fontSize={12} fill={COL.ink}>L</text>
          <text x={266} y={172} fontSize={12} fill={COL.ink}>W</text>
          <text x={450} y={92} fontSize={12} fill={COL.ink}>T</text>
          <text x={64} y={92} fontSize={12} fill={COL.ink}>D</text>
        </>,
        520,
        190,
        'Four forces on an aircraft',
      );
    case 'venturi':
      return box(
        <>
          <path d="M 30 50 L 180 50 L 250 80 L 300 80 L 380 50 L 490 50" fill="none" stroke={COL.ink} strokeWidth={2} />
          <path d="M 30 150 L 180 150 L 250 120 L 300 120 L 380 150 L 490 150" fill="none" stroke={COL.ink} strokeWidth={2} />
          <Arrow x1={40} y1={100} x2={120} y2={100} color="#0ea5e9" w={2} />
          <text x={100} y={180} fontSize={12} textAnchor="middle" fill={COL.ink}>inlet</text>
          <text x={275} y={180} fontSize={12} textAnchor="middle" fill={COL.ink}>throat</text>
        </>,
        520,
        190,
        'Venturi tube',
      );
    case 'fibre':
      return box(
        <>
          <rect x={30} y={50} width={460} height={100} fill="#e0e7ff" />
          <rect x={30} y={75} width={460} height={50} fill="#a5b4fc" />
          <polyline points="30,100 110,75 210,125 310,75 410,125 490,93" fill="none" stroke="#dc2626" strokeWidth={2} />
          <text x={500} y={70} fontSize={11} textAnchor="end" fill={COL.ink}>cladding</text>
          <text x={500} y={104} fontSize={11} textAnchor="end" fill={COL.ink}>core</text>
        </>,
        520,
        190,
        'Light in an optical fibre',
      );
    case 'truss-zero':
    default:
      return null;
  }
}
