import { useEffect, useMemo, useRef, useState } from 'react';
import { sig, fixed } from '@/lib/calc/format';
import { wavelength, criticalAngle, numericalAperture, acceptanceAngle, orbitalPeriod, bentPipeDelay, GEO_ALTITUDE_KM, EARTH_R, amBandwidth, fmCarson, levels, bitRate, ledWavelengthNm } from '@/lib/calc/telecom';
import { zenerRegulator, transistorSwitch } from '@/lib/calc/electric';
import { rng } from '@/data/problems';
import { Arrow, Label, COL } from '../diagrams/svg';
import { Card, Slider, Stat, M, Tabs, Callout, Badge, KeyPoints, Toggle, cx } from '../ui';

const TAU = Math.PI * 2;

function Plot({ fn, W = 600, H = 110, color = COL.telecom, tMax = 1, label, children, n = 600, yMax = 1.3 }: { fn: (t: number) => number; W?: number; H?: number; color?: string; tMax?: number; label?: string; children?: React.ReactNode; n?: number; yMax?: number }) {
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = (i / n) * tMax;
    return `${(i / n) * (W - 20) + 10},${H / 2 - (fn(t) / yMax) * (H / 2 - 8)}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diagram" aria-label={label}>
      <line x1={10} x2={W - 10} y1={H / 2} y2={H / 2} stroke={COL.muted} strokeOpacity={0.4} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} />
      {children}
      {label && <text x={12} y={14} fontSize={11} fontWeight={600} fill={COL.ink}>{label}</text>}
    </svg>
  );
}

// ───────────────────────── Analogue vs digital ─────────────────────────
export function AnalogueDigital() {
  const [samples, setSamples] = useState(16);
  const [bits, setBits] = useState(3);
  const [noise, setNoise] = useState(0.15);
  const msg = (t: number) => 0.8 * Math.sin(TAU * t) + 0.2 * Math.sin(TAU * 3 * t);
  const L = levels(bits);
  const q = (v: number) => {
    const step = 2 / (L - 1);
    return Math.max(-1, Math.min(1, Math.round((v + 1) / step) * step - 1));
  };
  const W = 600;
  const H = 150;
  const X = (t: number) => 10 + t * (W - 20);
  const Y = (v: number) => H / 2 - v * (H / 2 - 10);
  const sampleTimes = Array.from({ length: samples }, (_, i) => (i + 0.5) / samples);
  const r = useMemo(() => rng(42), []);
  const noiseArr = useMemo(() => Array.from({ length: 400 }, () => (r() - 0.5) * 2), [r]);
  // digital bit stream of the first sample codes
  const bitsStream = sampleTimes.slice(0, 6).flatMap((t) => {
    const code = Math.round(((q(msg(t)) + 1) / 2) * (L - 1));
    return code.toString(2).padStart(bits, '0').split('').map(Number);
  });
  const errors = bitsStream.filter((b, i) => {
    const rx = (b ? 1 : -1) + noise * 2.2 * noiseArr[i * 7 % 400];
    return (rx > 0 ? 1 : 0) !== b;
  }).length;
  return (
    <Card title="Analogue versus digital signals" subtitle="Sampling, quantisation and the effect of noise">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Analogue signal sampled and quantised">
            {Array.from({ length: L }, (_, i) => -1 + (i * 2) / (L - 1)).map((v) => (
              <line key={v} x1={10} x2={W - 10} y1={Y(v)} y2={Y(v)} stroke={COL.muted} strokeOpacity={0.15} />
            ))}
            <polyline points={Array.from({ length: 301 }, (_, i) => `${X(i / 300)},${Y(msg(i / 300))}`).join(' ')} fill="none" stroke="#0ea5e9" strokeWidth={2} />
            <polyline
              points={sampleTimes.flatMap((t, i) => {
                const t0 = i / samples;
                const t1 = (i + 1) / samples;
                const v = q(msg(t));
                return [`${X(t0)},${Y(v)}`, `${X(t1)},${Y(v)}`];
              }).join(' ')}
              fill="none"
              stroke={COL.telecom}
              strokeWidth={2}
            />
            {sampleTimes.map((t) => (
              <g key={t}>
                <line x1={X(t)} x2={X(t)} y1={Y(0)} y2={Y(msg(t))} stroke="#f59e0b" strokeWidth={1} />
                <circle cx={X(t)} cy={Y(msg(t))} r={2.5} fill="#f59e0b" />
              </g>
            ))}
            <text x={14} y={14} fontSize={11} fill={COL.ink}>blue: analogue · amber: samples · violet: quantised to {L} levels</text>
          </svg>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Plot fn={(t) => msg(t) + noise * noiseArr[Math.floor(t * 399)]} label="Analogue + noise (noise stays in the signal)" color="#0ea5e9" />
            </div>
            <div>
              <Plot fn={(t) => { const i = Math.min(bitsStream.length - 1, Math.floor(t * bitsStream.length)); return (bitsStream[i] ? 0.8 : -0.8) + noise * noiseArr[Math.floor(t * 399)]; }} label="Digital + noise" color={COL.telecom} />
              <Plot fn={(t) => { const i = Math.min(bitsStream.length - 1, Math.floor(t * bitsStream.length)); const rx = (bitsStream[i] ? 1 : -1) + noise * 2.2 * noiseArr[i * 7 % 400]; return rx > 0 ? 0.8 : -0.8; }} label="Regenerated (decision threshold at 0)" color="#10b981" H={80} />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <Slider label="Samples per period" value={samples} min={4} max={40} onChange={setSamples} />
          <Slider label="Bits per sample" value={bits} min={1} max={8} onChange={setBits} />
          <Slider label="Channel noise" value={noise} min={0} max={0.8} step={0.01} onChange={setNoise} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Quantisation levels" value={L} sub={`2^${bits}`} />
            <Stat label="Bit errors (shown bits)" value={`${errors}/${bitsStream.length}`} tone={errors ? 'red' : 'emerald'} />
          </div>
          <M block>{`\\text{bit rate} = f_s \\times n = ${samples}f \\times ${bits}`}</M>
          <p className="text-xs text-ink-500">Example: telephone speech 8 kHz × 8 bits = 64 kbit/s; CD audio 44.1 kHz × 16 bits × 2 channels = {fixed(bitRate(44100, 16, 2) / 1e6, 2)} Mbit/s. Sample faster than twice the highest signal frequency (Nyquist) to avoid aliasing.</p>
          <KeyPoints items={['Analogue noise accumulates and is amplified with the signal.', 'Digital repeaters only decide “0 or 1”, so moderate noise is removed completely.', 'Heavy noise causes bit errors — then error-correcting codes help.']} />
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────── AM vs FM ─────────────────────────
export function AMFM() {
  const [m, setM] = useState(0.6);
  const [beta, setBeta] = useState(5);
  const fc = 20;
  const fmsg = 2;
  const msg = (t: number) => Math.sin(TAU * fmsg * t);
  return (
    <Card title="AM versus FM" subtitle="Same message, two ways of impressing it on the carrier (time axis compressed for clarity)">
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-1">
          <Plot fn={msg} label="Message (audio) signal" color="#0ea5e9" H={80} />
          <Plot fn={(t) => Math.sin(TAU * fc * t)} label="Carrier (high frequency)" color={COL.muted} H={80} n={900} />
          <Plot fn={(t) => ((1 + m * msg(t)) * Math.sin(TAU * fc * t)) / (1 + Math.max(m, 0.01))} label="AM: amplitude follows the message" color={COL.telecom} n={1200} yMax={1.1}>
            <polyline points={Array.from({ length: 201 }, (_, i) => `${(i / 200) * 580 + 10},${55 - ((1 + m * msg(i / 200)) / (1 + Math.max(m, 0.01)) / 1.1) * 47}`).join(' ')} fill="none" stroke="#f59e0b" strokeDasharray="4 3" />
          </Plot>
          <Plot fn={(t) => Math.sin(TAU * fc * t + beta * Math.sin(TAU * fmsg * t) * 0.5)} label="FM: frequency follows the message, amplitude constant" color="#10b981" n={1500} />
          {m > 1 && <Callout kind="warn">Over-modulation (m &gt; 1): the envelope crosses zero and the message is distorted when demodulated.</Callout>}
        </div>
        <div className="space-y-3">
          <Slider label="AM modulation index m" value={m} min={0} max={1.4} step={0.05} onChange={setM} />
          <Slider label="FM modulation index β" value={beta} min={0} max={10} step={0.5} onChange={setBeta} />
          <div className="overflow-x-auto">
            <table className="tbl text-xs">
              <thead>
                <tr><th></th><th>AM</th><th>FM</th></tr>
              </thead>
              <tbody>
                <tr><td>Varies</td><td>Amplitude</td><td>Frequency</td></tr>
                <tr><td>Bandwidth (5 kHz audio)</td><td>{amBandwidth(5)} kHz</td><td>≈ {fmCarson(75, 15)} kHz*</td></tr>
                <tr><td>Noise</td><td>Poor (noise adds to amplitude)</td><td>Good (limiter removes amplitude noise)</td></tr>
                <tr><td>Range</td><td>Long (MF ground wave, night skywave)</td><td>Line of sight (VHF)</td></tr>
                <tr><td>Australian band</td><td>526.5–1606.5 kHz</td><td>87.5–108 MHz</td></tr>
                <tr><td>Receiver</td><td>Simple envelope detector</td><td>Discriminator / PLL</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-ink-500">*FM broadcast: Δf = 75 kHz, audio to 15 kHz → Carson’s rule 2(Δf + f_m) = 180 kHz (channels spaced 200 kHz). AM: BW = 2f_m.</p>
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────── Modulation / demodulation pipeline ─────────────────────────
export function ModDemod() {
  const [scheme, setScheme] = useState<'am' | 'fm'>('am');
  const [noise, setNoise] = useState(0.25);
  const [phase, setPhase] = useState(0);
  const [run, setRun] = useState(true);
  const raf = useRef<number>();
  useEffect(() => {
    if (!run) return;
    let last = performance.now();
    const tick = (t: number) => {
      setPhase((p) => (p + (t - last) / 6000) % 1);
      last = t;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current!);
  }, [run]);
  const r = useMemo(() => rng(7), []);
  const nArr = useMemo(() => Array.from({ length: 3000 }, () => r() - 0.5), [r]);
  const fc = 30;
  const msg = (t: number) => Math.sin(TAU * 2 * (t + phase));
  const tx = (t: number) => (scheme === 'am' ? (1 + 0.7 * msg(t)) * Math.sin(TAU * fc * t) / 1.7 : Math.sin(TAU * fc * t + 3 * Math.sin(TAU * 2 * (t + phase)) * 0.4));
  const wrap = (x: number) => ((x % 1) + 1) % 1;
  const nz = (t: number) => noise * 1.4 * nArr[Math.floor(wrap(t + phase) * 2999)];
  const rxSig = (t: number) => tx(t) + nz(t);
  // AM envelope detector: rectify then moving average over ~1 carrier period
  const amOut = (t: number) => {
    let s = 0;
    const N = 24;
    for (let k = 0; k < N; k++) s += Math.max(0, rxSig(t - (k / N) / fc));
    return ((s / N) * Math.PI * 1.7 - 1) / 0.7;
  };
  // FM: limiter removes amplitude noise; recovered message is the instantaneous frequency (shown with residual phase noise)
  const fmOut = (t: number) => msg(t) + noise * 0.15 * nArr[Math.floor(wrap(t + phase) * 2999)];
  const stages = [
    { t: 'Message', f: msg, c: '#0ea5e9' },
    { t: scheme === 'am' ? 'Modulator → AM signal' : 'Modulator → FM signal', f: tx, c: COL.telecom },
    { t: 'Channel: received signal + noise', f: rxSig, c: '#f59e0b' },
    { t: scheme === 'am' ? 'Envelope detector (diode + low-pass filter)' : 'Limiter + frequency discriminator', f: scheme === 'am' ? amOut : fmOut, c: '#10b981' },
  ];
  return (
    <Card title="Modulation and demodulation" subtitle="Transmitter → channel → receiver (conceptual simulation)">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Tabs value={scheme} onChange={setScheme} tabs={[{ id: 'am', label: 'AM' }, { id: 'fm', label: 'FM' }]} />
        <div className="min-w-[200px] flex-1"><Slider label="Channel noise" value={noise} min={0} max={0.8} step={0.01} onChange={setNoise} /></div>
        <Toggle checked={run} onChange={setRun} label="Animate" />
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {stages.map((s, i) => (
          <div key={i} className="relative rounded-lg border border-ink-200 p-1 dark:border-ink-800">
            <Plot fn={s.f} label={`${i + 1}. ${s.t}`} color={s.c} n={i === 0 || i === 3 ? 300 : 1400} yMax={i === 3 ? 1.6 : 1.3} H={100} />
            {i < 3 && <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-ink-400 lg:block">{i % 2 === 0 ? '→' : ''}</span>}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-500">With noise, the AM output carries the noise through to the audio; the FM receiver’s limiter strips amplitude noise, so the recovered message is much cleaner — the main reason FM sounds better. (Illustrative signal-level simulation.)</p>
    </Card>
  );
}

// ───────────────────────── Electromagnetic spectrum ─────────────────────────
const BANDS = [
  { n: 'LF', lo: 3e4, hi: 3e5, c: '#64748b' },
  { n: 'MF', lo: 3e5, hi: 3e6, c: '#0ea5e9' },
  { n: 'HF', lo: 3e6, hi: 3e7, c: '#06b6d4' },
  { n: 'VHF', lo: 3e7, hi: 3e8, c: '#10b981' },
  { n: 'UHF', lo: 3e8, hi: 3e9, c: '#84cc16' },
  { n: 'SHF (microwave)', lo: 3e9, hi: 3e10, c: '#eab308' },
  { n: 'EHF (mm-wave)', lo: 3e10, hi: 3e11, c: '#f97316' },
  { n: 'Infrared', lo: 3e11, hi: 4.3e14, c: '#ef4444' },
  { n: 'Visible', lo: 4.3e14, hi: 7.5e14, c: 'url(#vis)' },
];
const USES = [
  { n: 'AM radio (Australia)', f: 1e6, r: '526.5–1606.5 kHz' },
  { n: 'Shortwave radio', f: 1e7, r: '3–30 MHz' },
  { n: 'FM radio', f: 98e6, r: '87.5–108 MHz' },
  { n: 'DAB+ digital radio', f: 200e6, r: '≈ 174–230 MHz (Band III)' },
  { n: 'Digital TV (UHF)', f: 600e6, r: '≈ 520–694 MHz' },
  { n: '4G mobile (700 MHz)', f: 7.5e8, r: '703–803 MHz' },
  { n: 'GPS L1', f: 1.57542e9, r: '1575.42 MHz' },
  { n: 'Wi-Fi 2.4 GHz', f: 2.44e9, r: '2.4–2.4835 GHz' },
  { n: '5G mid-band', f: 3.5e9, r: '≈ 3.4–3.7 GHz' },
  { n: 'Wi-Fi 5 GHz', f: 5.5e9, r: '≈ 5.15–5.85 GHz' },
  { n: 'Satellite TV (Ku band)', f: 12e9, r: '≈ 10.7–12.75 GHz downlink' },
  { n: '5G mm-wave', f: 26e9, r: '≈ 24.25–27.5 GHz' },
  { n: 'Fibre optic (1550 nm)', f: 1.934e14, r: '≈ 193 THz' },
  { n: 'TV remote (IR LED)', f: 3.19e14, r: '≈ 940 nm' },
];

export function SpectrumExplorer() {
  const [logf, setLogf] = useState(8);
  const f = 10 ** logf;
  const lam = wavelength(f);
  const band = BANDS.find((b) => f >= b.lo && f < b.hi);
  const W = 640;
  const X = (lf: number) => 10 + ((lf - 4.5) / (15 - 4.5)) * (W - 20);
  const fmtF = (v: number) => (v >= 1e12 ? `${sig(v / 1e12, 3)} THz` : v >= 1e9 ? `${sig(v / 1e9, 3)} GHz` : v >= 1e6 ? `${sig(v / 1e6, 3)} MHz` : `${sig(v / 1e3, 3)} kHz`);
  const fmtL = (v: number) => (v >= 1 ? `${sig(v, 3)} m` : v >= 1e-3 ? `${sig(v * 1000, 3)} mm` : v >= 1e-6 ? `${sig(v * 1e6, 3)} µm` : `${sig(v * 1e9, 3)} nm`);
  return (
    <Card title="Electromagnetic spectrum explorer" subtitle="Frequency (log scale) — all EM waves travel at c = 3.00 × 10⁸ m/s in free space">
      <svg viewBox={`0 0 ${W} 150`} className="diagram" role="img" aria-label="Electromagnetic spectrum bands with telecommunications uses">
        <defs>
          <linearGradient id="vis" x1="0" x2="1">
            <stop offset="0" stopColor="#ef4444" />
            <stop offset="0.5" stopColor="#22c55e" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {BANDS.map((b) => (
          <g key={b.n}>
            <rect x={X(Math.log10(b.lo))} y={40} width={X(Math.log10(b.hi)) - X(Math.log10(b.lo))} height={30} fill={b.c} opacity={0.75} />
            <text x={(X(Math.log10(b.lo)) + X(Math.log10(b.hi))) / 2} y={60} fontSize={9.5} textAnchor="middle" fill="white" fontWeight={700}>{b.n.split(' ')[0]}</text>
          </g>
        ))}
        {USES.map((u, i) => (
          <g key={u.n}>
            <line x1={X(Math.log10(u.f))} x2={X(Math.log10(u.f))} y1={70} y2={84 + (i % 3) * 18} stroke={COL.ink} strokeOpacity={0.5} />
            <text x={X(Math.log10(u.f))} y={94 + (i % 3) * 18} fontSize={8.5} textAnchor="middle" fill={COL.ink}>{u.n.split(' (')[0]}</text>
          </g>
        ))}
        <line x1={X(logf)} x2={X(logf)} y1={30} y2={76} stroke={COL.compression} strokeWidth={3} />
        {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((l) => (
          <text key={l} x={X(l)} y={26} fontSize={9} textAnchor="middle" fill={COL.muted}>10^{l}</text>
        ))}
      </svg>
      <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <Slider label="Frequency" value={logf} min={4.5} max={14.8} step={0.01} onChange={setLogf} format={() => fmtF(f)} />
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Frequency" value={fmtF(f)} />
            <Stat label="Wavelength λ = c/f" value={fmtL(lam)} tone="blue" />
            <Stat label="Band" value={<span className="text-sm">{band?.n ?? '—'}</span>} />
          </div>
          <KeyPoints items={['Lower frequencies diffract around obstacles and travel further (AM ground wave); higher frequencies need line of sight but carry more bandwidth.', 'Antenna size scales with wavelength (a quarter-wave FM antenna ≈ 0.75 m).', 'Microwaves suit point-to-point links and satellites; infrared carries data in optical fibre.']} />
        </div>
        <div className="overflow-x-auto">
          <table className="tbl text-xs">
            <thead><tr><th>Application</th><th>Frequency</th></tr></thead>
            <tbody>
              {USES.map((u) => (
                <tr key={u.n} className={cx(Math.abs(Math.log10(u.f) - logf) < 0.25 && 'bg-violet-50 dark:bg-violet-950/40')}>
                  <td><button className="text-left hover:underline" onClick={() => setLogf(Math.log10(u.f))}>{u.n}</button></td>
                  <td>{u.r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────── Optical fibre ─────────────────────────
export function FibreOptic() {
  const [type, setType] = useState<'step' | 'graded' | 'single'>('step');
  const [n1, setN1] = useState(1.48);
  const [n2, setN2] = useState(1.46);
  const [launch, setLaunch] = useState(8);
  const valid = n1 > n2;
  const tc = valid ? criticalAngle(n1, n2) : 90;
  const NA = valid ? numericalAperture(n1, n2) : 0;
  const acc = valid ? acceptanceAngle(n1, n2) : 0;
  // refraction at entry (air → core): sin(launch) = n1 sin(θr)
  const thR = (Math.asin(Math.sin((launch * Math.PI) / 180) / n1) * 180) / Math.PI;
  const incidence = 90 - thR; // at core-cladding boundary, from the normal
  const guided = valid && incidence >= tc;
  const W = 640;
  const coreTop = type === 'single' ? 112 : 80;
  const coreBot = type === 'single' ? 128 : 160;
  const mid = (coreTop + coreBot) / 2;
  const half = (coreBot - coreTop) / 2;
  const path = (() => {
    if (type === 'single') return `M 40 ${mid} L ${W - 20} ${mid}`;
    if (type === 'graded') {
      const amp = Math.min(half * 0.9, (launch / 15) * half);
      return Array.from({ length: 201 }, (_, i) => `${i ? 'L' : 'M'} ${40 + (i / 200) * (W - 60)} ${mid - amp * Math.sin((i / 200) * TAU * 3)}`).join(' ');
    }
    const slope = Math.tan((thR * Math.PI) / 180); // dy/dx inside the core
    const xEnd = W - 20;
    const pts: string[] = [`M 40 ${mid}`];
    let x = 40;
    let y = mid;
    let dir = -1; // −1 = heading up the screen, +1 = down
    for (let guard = 0; guard < 400 && x < xEnd; guard++) {
      if (slope < 1e-4) {
        pts.push(`L ${xEnd} ${y}`);
        break;
      }
      const target = dir < 0 ? coreTop : coreBot;
      const dxHit = Math.abs(target - y) / slope;
      if (x + dxHit >= xEnd) {
        pts.push(`L ${xEnd} ${y + dir * (xEnd - x) * slope}`);
        break;
      }
      x += dxHit;
      y = target;
      pts.push(`L ${x} ${y}`);
      if (!guided) {
        // refracts out of the core into the cladding and is lost
        pts.push(`L ${Math.min(xEnd, x + 60)} ${y + dir * 55}`);
        break;
      }
      dir = -dir;
    }
    return pts.join(' ');
  })();
  return (
    <Card title="Optical fibre signal propagation" subtitle="Total internal reflection at the core–cladding boundary">
      <Tabs size="sm" value={type} onChange={setType} className="mb-3" tabs={[{ id: 'step', label: 'Step-index multimode' }, { id: 'graded', label: 'Graded-index multimode' }, { id: 'single', label: 'Single-mode' }]} />
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <svg viewBox={`0 0 ${W} 240`} className="diagram" role="img" aria-label="Light ray in an optical fibre">
          <rect x={40} y={50} width={W - 60} height={140} fill="#e0e7ff" opacity={0.6} />
          {type === 'graded' ? (
            Array.from({ length: 10 }, (_, i) => <rect key={i} x={40} y={coreTop + i * 8} width={W - 60} height={8} fill="#a5b4fc" opacity={0.15 + (1 - Math.abs(i - 4.5) / 5) * 0.5} />)
          ) : (
            <rect x={40} y={coreTop} width={W - 60} height={coreBot - coreTop} fill="#a5b4fc" opacity={0.7} />
          )}
          <rect x={40} y={40} width={W - 60} height={10} fill={COL.muted} opacity={0.4} />
          <rect x={40} y={190} width={W - 60} height={10} fill={COL.muted} opacity={0.4} />
          <text x={W - 26} y={64} fontSize={10.5} textAnchor="end" fill={COL.ink}>cladding n₂ = {n2}</text>
          <text x={W - 26} y={mid + 4} fontSize={10.5} textAnchor="end" fill={COL.ink}>core n₁ = {n1}</text>
          <text x={W - 26} y={38} fontSize={10.5} textAnchor="end" fill={COL.muted}>polymer buffer / jacket</text>
          <Arrow x1={4} y1={mid + 30 * Math.tan((launch * Math.PI) / 180)} x2={40} y2={mid} color="#dc2626" w={2} />
          <path d={path} fill="none" stroke="#dc2626" strokeWidth={2.2} />
          {type === 'step' && <text x={48} y={228} fontSize={10.5} fill={guided ? '#059669' : '#dc2626'}>{guided ? `Incidence at boundary ${fixed(incidence, 1)}° ≥ critical ${fixed(tc, 1)}° → totally internally reflected` : `Incidence ${fixed(incidence, 1)}° < critical ${fixed(tc, 1)}° → ray refracts into the cladding and is lost`}</text>}
          {type === 'graded' && <text x={48} y={228} fontSize={10.5} fill={COL.ink}>Refractive index falls gradually from the axis: rays curve back smoothly, so different paths arrive closer together (less modal dispersion)</text>}
          {type === 'single' && <text x={48} y={228} fontSize={10.5} fill={COL.ink}>Core ≈ 8–10 µm: only one mode propagates → no modal dispersion; laser source at 1310/1550 nm</text>}
        </svg>
        <div className="space-y-3">
          <Slider label="Launch angle in air" value={launch} min={0} max={30} step={0.5} unit="°" onChange={setLaunch} />
          <Slider label="Core index n₁" value={n1} min={1.44} max={1.52} step={0.005} onChange={setN1} />
          <Slider label="Cladding index n₂" value={n2} min={1.40} max={1.5} step={0.005} onChange={setN2} />
          {!valid ? (
            <Callout kind="warn">The core must have a HIGHER refractive index than the cladding, otherwise total internal reflection cannot occur.</Callout>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Critical angle" value={fixed(tc, 1)} unit="°" />
              <Stat label="NA" value={fixed(NA, 3)} />
              <Stat label="Acceptance" value={`±${fixed(acc, 1)}`} unit="°" tone="blue" />
            </div>
          )}
          <M block>{'\\sin\\theta_c = \\frac{n_2}{n_1} \\qquad \\text{NA} = \\sqrt{n_1^2 - n_2^2}'}</M>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="tbl text-xs">
          <thead><tr><th>Fibre</th><th>Core</th><th>Source</th><th>Dispersion</th><th>Use</th></tr></thead>
          <tbody>
            <tr><td className="font-semibold">Step-index multimode</td><td>50–62.5 µm (larger in plastic fibre)</td><td>LED / VCSEL</td><td>High modal dispersion</td><td>Short links</td></tr>
            <tr><td className="font-semibold">Graded-index multimode</td><td>50 or 62.5 µm</td><td>VCSEL</td><td>Reduced modal dispersion</td><td>LANs, data centres</td></tr>
            <tr><td className="font-semibold">Single-mode</td><td>≈ 8–10 µm</td><td>Laser diode</td><td>No modal dispersion</td><td>Long-haul, undersea, NBN backbone</td></tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ───────────────────────── Transmission media ─────────────────────────
export function TransmissionMedia() {
  const rows = [
    ['Twisted-pair copper', 'Electrical signal on twisted copper pairs; twisting cancels interference', 'Cheap, existing telephone network, easy to install', 'Limited bandwidth over distance; attenuation; EMI and crosstalk', 'Phone lines, Ethernet (Cat 6), VDSL/FTTN last metres'],
    ['Coaxial cable', 'Central conductor + shield separated by a dielectric (e.g. PTFE/PE)', 'Higher bandwidth than twisted pair; shielded', 'Bulkier; still attenuates at high frequency', 'TV antenna leads, HFC cable broadband'],
    ['Optical fibre', 'Light (≈ 1310/1550 nm IR) guided by total internal reflection', 'Enormous bandwidth, very low loss, immune to EMI, secure, light', 'Specialist splicing; fragile glass; more costly terminal equipment', 'Backbone, undersea cables, FTTP'],
    ['Radio (wireless)', 'Electromagnetic waves broadcast from antennas', 'Mobility, broadcast to many receivers, no cabling', 'Shared, licensed spectrum; interference; security', 'Broadcast radio/TV, mobile phones, Wi-Fi'],
    ['Microwave links', 'Narrow beams between dish antennas (line of sight)', 'High capacity without cables over rugged terrain', 'Needs line of sight and towers every ~50 km; rain fade at high frequency', 'Mobile backhaul, remote links'],
    ['Satellite', 'Microwave up/down links via an orbiting relay', 'Covers remote areas, oceans and disaster zones', 'Latency (GEO ≈ 0.24 s); expensive; weather effects', 'Rural broadband, TV, maritime'],
    ['Infrared (free space)', 'Modulated IR light, short range, line of sight', 'Cheap, no licence, cannot pass through walls (private)', 'Very short range; blocked easily', 'Remote controls, some short data links'],
  ];
  return (
    <Card title="Transmission media comparison">
      <div className="overflow-x-auto">
        <table className="tbl text-sm">
          <thead><tr><th>Medium</th><th>How it carries information</th><th>Advantages</th><th>Disadvantages</th><th>Typical uses</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]}>{r.map((c, i) => <td key={i} className={cx(i === 0 && 'font-semibold')}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ───────────────────────── Components: LED, laser diode, transistor, Zener ─────────────────────────
export function ComponentExplorer() {
  const [c, setC] = useState<'led' | 'laser' | 'transistor' | 'zener'>('led');
  return (
    <Card title="Semiconductor component explorer" subtitle="Interactive operating characteristics (idealised models)">
      <Tabs value={c} onChange={setC} className="mb-3" tabs={[{ id: 'led', label: 'LED' }, { id: 'laser', label: 'Laser diode' }, { id: 'transistor', label: 'Transistor switch' }, { id: 'zener', label: 'Zener regulator' }]} />
      {c === 'led' && <LEDDemo />}
      {c === 'laser' && <LaserDemo />}
      {c === 'transistor' && <TransistorDemo />}
      {c === 'zener' && <ZenerDemo />}
    </Card>
  );
}

const LED_MATS = [
  { id: 'gaas', n: 'GaAs (infrared)', eg: 1.42, col: '#7f1d1d' },
  { id: 'red', n: 'AlGaInP (red)', eg: 1.97, col: '#ef4444' },
  { id: 'green', n: 'InGaN (green)', eg: 2.36, col: '#22c55e' },
  { id: 'blue', n: 'InGaN (blue)', eg: 2.7, col: '#3b82f6' },
];

function LEDDemo() {
  const [m, setM] = useState('red');
  const [V, setV] = useState(2.0);
  const mat = LED_MATS.find((x) => x.id === m)!;
  const Vf = mat.eg * 0.95;
  const I = V < Vf - 0.25 ? 0 : 20 * Math.max(0, Math.exp((V - Vf) / 0.08) - Math.exp(-0.25 / 0.08)) / Math.exp(0.1 / 0.08);
  const Icap = Math.min(I, 60);
  const lam = ledWavelengthNm(mat.eg);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <svg viewBox="0 0 320 200" className="diagram" role="img" aria-label="LED glowing according to forward current">
        <circle cx={160} cy={80} r={46} fill={mat.col} opacity={0.15 + Math.min(0.8, Icap / 40)} />
        <path d="M 130 60 L 130 110 L 190 110 L 190 60 Q 160 20 130 60 Z" fill={mat.col} opacity={0.7} stroke={COL.ink} />
        <line x1={145} x2={145} y1={110} y2={170} stroke={COL.ink} strokeWidth={2} />
        <line x1={175} x2={175} y1={110} y2={160} stroke={COL.ink} strokeWidth={2} />
        <text x={145} y={186} fontSize={10.5} textAnchor="middle" fill={COL.ink}>anode +</text>
        <text x={185} y={176} fontSize={10.5} fill={COL.ink}>cathode −</text>
        <text x={160} y={14} fontSize={11} textAnchor="middle" fill={COL.ink}>electrons + holes recombine at the p–n junction → photons</text>
      </svg>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {LED_MATS.map((x) => (
            <button key={x.id} className={cx('chip', m === x.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-950' : 'border-ink-200 dark:border-ink-700')} onClick={() => setM(x.id)}>{x.n}</button>
          ))}
        </div>
        <Slider label="Forward voltage" value={V} min={0} max={3.4} step={0.01} unit="V" onChange={setV} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Band gap" value={mat.eg} unit="eV" />
          <Stat label="λ ≈ 1240/E_g" value={fixed(lam, 0)} unit="nm" tone="blue" />
          <Stat label="Current" value={I > 60 ? '> 60' : fixed(I, 1)} unit="mA" tone={I > 30 ? 'red' : 'ink'} sub={I > 30 ? 'needs a series resistor!' : undefined} />
        </div>
        <p className="text-xs text-ink-500">Current rises steeply once the forward voltage reaches about the band-gap voltage — always use a series resistor. LED light is incoherent with a fairly broad spectrum (tens of nm), suitable for short multimode fibre links, remotes and displays.</p>
      </div>
    </div>
  );
}

function LaserDemo() {
  const [I, setI] = useState(25);
  const Ith = 15;
  const P = I < Ith ? 0.02 * I : 0.3 + 0.35 * (I - Ith);
  const lasing = I >= Ith;
  const W = 320;
  const H = 180;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Laser diode output power versus current">
        <line x1={40} x2={W - 10} y1={H - 30} y2={H - 30} stroke={COL.ink} />
        <line x1={40} x2={40} y1={10} y2={H - 30} stroke={COL.ink} />
        <polyline points={Array.from({ length: 61 }, (_, i) => { const c = i * 0.75; const p = c < Ith ? 0.02 * c : 0.3 + 0.35 * (c - Ith); return `${40 + c * 5.8},${H - 30 - p * 11}`; }).join(' ')} fill="none" stroke="#dc2626" strokeWidth={2.2} />
        <line x1={40 + Ith * 5.8} x2={40 + Ith * 5.8} y1={10} y2={H - 30} stroke={COL.muted} strokeDasharray="4 3" />
        <text x={40 + Ith * 5.8 + 4} y={22} fontSize={10} fill={COL.muted}>threshold current</text>
        <circle cx={40 + I * 5.8} cy={H - 30 - P * 11} r={5} fill="#f59e0b" />
        <text x={W / 2} y={H - 10} fontSize={10.5} textAnchor="middle" fill={COL.muted}>drive current (mA)</text>
        <text x={44} y={14} fontSize={10.5} fill={COL.muted}>optical power</text>
      </svg>
      <div className="space-y-3">
        <Slider label="Drive current" value={I} min={0} max={45} unit="mA" onChange={setI} />
        <Badge tone={lasing ? 'red' : 'ink'}>{lasing ? 'Lasing: stimulated emission — coherent, narrow spectrum' : 'Below threshold: weak spontaneous emission (LED-like)'}</Badge>
        <KeyPoints items={['Mirrored (cleaved) facets form an optical cavity; above the threshold current, stimulated emission dominates.', 'Output is coherent, intense and very narrow in wavelength → low chromatic dispersion for long single-mode fibre links.', 'Can be switched at multi-gigabit rates; needs temperature control for stable wavelength.']} />
      </div>
    </div>
  );
}

function TransistorDemo() {
  const [Vin, setVin] = useState(3);
  const [beta, setBeta] = useState(100);
  const r = transistorSwitch(5, 220, Vin, 10000, beta);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <svg viewBox="0 0 320 220" className="diagram" role="img" aria-label="NPN transistor switching an LED">
        <text x={240} y={20} fontSize={11} fill={COL.ink}>+5 V</text>
        <line x1={230} x2={230} y1={26} y2={50} stroke={COL.ink} strokeWidth={2} />
        <rect x={222} y={50} width={16} height={34} fill="none" stroke={COL.ink} />
        <text x={244} y={72} fontSize={10.5} fill={COL.ink}>220 Ω</text>
        <circle cx={230} cy={104} r={12} fill={r.Ic > 0.001 ? '#ef4444' : 'none'} opacity={Math.min(1, 0.2 + r.Ic * 60)} stroke={COL.ink} />
        <text x={248} y={108} fontSize={10.5} fill={COL.ink}>LED</text>
        <line x1={230} x2={230} y1={84} y2={92} stroke={COL.ink} strokeWidth={2} />
        <line x1={230} x2={230} y1={116} y2={140} stroke={COL.ink} strokeWidth={2} />
        <circle cx={220} cy={160} r={22} fill="none" stroke={COL.ink} />
        <line x1={210} x2={210} y1={146} y2={174} stroke={COL.ink} strokeWidth={3} />
        <line x1={210} y1={152} x2={230} y2={140} stroke={COL.ink} strokeWidth={2} />
        <line x1={210} y1={168} x2={230} y2={182} stroke={COL.ink} strokeWidth={2} />
        <Arrow x1={220} y1={175} x2={229} y2={181} color={COL.ink} w={2} head={6} />
        <line x1={230} x2={230} y1={182} y2={205} stroke={COL.ink} strokeWidth={2} />
        <text x={236} y={214} fontSize={10.5} fill={COL.ink}>0 V</text>
        <line x1={120} x2={210} y1={160} y2={160} stroke={COL.ink} strokeWidth={2} />
        <rect x={140} y={152} width={34} height={16} fill="none" stroke={COL.ink} />
        <text x={157} y={146} fontSize={10.5} textAnchor="middle" fill={COL.ink}>10 kΩ</text>
        <text x={100} y={164} fontSize={11} textAnchor="end" fill={COL.ink}>V_in = {Vin} V</text>
        <text x={196} y={140} fontSize={10.5} textAnchor="end" fill={COL.ink}>C</text>
        <text x={198} y={168} fontSize={10.5} textAnchor="end" fill={COL.ink}>B</text>
        <text x={196} y={194} fontSize={10.5} textAnchor="end" fill={COL.ink}>E</text>
      </svg>
      <div className="space-y-3">
        <Slider label="Input (base) voltage" value={Vin} min={0} max={5} step={0.05} unit="V" onChange={setVin} />
        <Slider label="Current gain β (h_FE)" value={beta} min={20} max={300} step={10} onChange={setBeta} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="I_B" value={fixed(r.Ib * 1e6, 0)} unit="µA" />
          <Stat label="I_C" value={fixed(r.Ic * 1000, 2)} unit="mA" tone="blue" />
          <Stat label="State" value={<span className="text-sm">{r.off ? 'OFF (cut-off)' : r.saturated ? 'ON (saturated)' : 'Active (amplifying)'}</span>} />
        </div>
        <p className="text-xs text-ink-500">Model: V_BE = 0.7 V, V_CE(sat) = 0.2 V, LED forward drop ignored. A small base current controls a collector current up to β times larger — the basis of amplifiers and of digital logic (transistors as switches).</p>
      </div>
    </div>
  );
}

function ZenerDemo() {
  const [Vin, setVin] = useState(12);
  const [RL, setRL] = useState(1000);
  const r = zenerRegulator(Vin, 5.1, 220, RL);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <svg viewBox="0 0 320 170" className="diagram" role="img" aria-label="Zener diode shunt regulator">
          <text x={10} y={40} fontSize={11} fill={COL.ink}>V_in {Vin} V</text>
          <line x1={20} x2={90} y1={50} y2={50} stroke={COL.ink} strokeWidth={2} />
          <rect x={90} y={42} width={44} height={16} fill="none" stroke={COL.ink} />
          <text x={112} y={36} fontSize={10.5} textAnchor="middle" fill={COL.ink}>220 Ω</text>
          <line x1={134} x2={280} y1={50} y2={50} stroke={COL.ink} strokeWidth={2} />
          <line x1={170} x2={170} y1={50} y2={84} stroke={COL.ink} strokeWidth={2} />
          <polygon points="160,104 180,104 170,86" fill="none" stroke={COL.ink} strokeWidth={1.6} />
          <path d="M 158 84 L 160 86 L 180 86 L 182 88" fill="none" stroke={COL.ink} strokeWidth={1.6} />
          <line x1={170} x2={170} y1={104} y2={140} stroke={COL.ink} strokeWidth={2} />
          <text x={186} y={100} fontSize={10.5} fill={COL.ink}>Zener 5.1 V</text>
          <line x1={250} x2={250} y1={50} y2={70} stroke={COL.ink} strokeWidth={2} />
          <rect x={242} y={70} width={16} height={44} fill="none" stroke={COL.ink} />
          <text x={264} y={96} fontSize={10.5} fill={COL.ink}>R_L</text>
          <line x1={250} x2={250} y1={114} y2={140} stroke={COL.ink} strokeWidth={2} />
          <line x1={20} x2={280} y1={140} y2={140} stroke={COL.ink} strokeWidth={2} />
          <text x={290} y={54} fontSize={11} fontWeight={700} fill={COL.telecom}>{fixed(r.Vout, 2)} V</text>
        </svg>
        <svg viewBox="0 0 320 120" className="diagram" aria-label="Output voltage versus input voltage">
          <line x1={30} x2={310} y1={100} y2={100} stroke={COL.ink} />
          <line x1={30} x2={30} y1={10} y2={100} stroke={COL.ink} />
          <polyline points={Array.from({ length: 61 }, (_, i) => { const vi = i * 0.4; const o = zenerRegulator(vi, 5.1, 220, RL).Vout; return `${30 + vi * 11.5},${100 - o * 12}`; }).join(' ')} fill="none" stroke={COL.telecom} strokeWidth={2} />
          <circle cx={30 + Vin * 11.5} cy={100 - r.Vout * 12} r={4} fill="#f59e0b" />
          <text x={170} y={116} fontSize={10} textAnchor="middle" fill={COL.muted}>V_in (V)</text>
          <text x={34} y={18} fontSize={10} fill={COL.muted}>V_out — flat once the Zener conducts</text>
        </svg>
      </div>
      <div className="space-y-3">
        <Slider label="Input voltage" value={Vin} min={0} max={24} step={0.1} unit="V" onChange={setVin} />
        <Slider label="Load resistance" value={RL} min={100} max={5000} step={50} unit="Ω" onChange={setRL} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="V_out" value={fixed(r.Vout, 2)} unit="V" tone="blue" />
          <Stat label="I_Z" value={fixed(r.Iz * 1000, 1)} unit="mA" />
          <Stat label="I_L" value={fixed(r.IL * 1000, 1)} unit="mA" />
        </div>
        <Badge tone={r.regulating ? 'emerald' : 'amber'}>{r.regulating ? 'Regulating: Zener in reverse breakdown' : 'Not regulating: input too low (Zener off)'}</Badge>
        <p className="text-xs text-ink-500">Reverse-biased Zener holds V_Z almost constant; extra current flows through the Zener instead of the load. Ideal Zener assumed (no dynamic resistance; check power rating P = V_Z I_Z in practice).</p>
      </div>
    </div>
  );
}

// ───────────────────────── Satellites ─────────────────────────
export function Satellites() {
  const [mode, setMode] = useState<'orbits' | 'gps'>('orbits');
  return (
    <Card title="Satellite communication" subtitle="Geostationary vs low-Earth orbit, and how GPS works">
      <Tabs value={mode} onChange={setMode} className="mb-3" tabs={[{ id: 'orbits', label: 'GEO vs LEO (to scale)' }, { id: 'gps', label: 'GPS trilateration' }]} />
      {mode === 'orbits' ? <Orbits /> : <GPS />}
    </Card>
  );
}

function Orbits() {
  const [leo, setLeo] = useState(550);
  const [t, setT] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      setT((x) => x + (now - last) / 1000);
      last = now;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current!);
  }, []);
  const Re = 28;
  const s = Re / EARTH_R;
  const rGeo = (EARTH_R + GEO_ALTITUDE_KM) * s;
  const rLeo = (EARTH_R + leo) * s;
  const Tleo = orbitalPeriod(leo);
  const Tgeo = orbitalPeriod(GEO_ALTITUDE_KM + 6378.137 - EARTH_R);
  const k = 2 * Math.PI / 16; // one simulated day = 16 s
  const earthAng = t * k;
  const geoAng = t * k * (86164 / Tgeo);
  const leoAng = t * k * (86164 / Tleo);
  const cx = 260;
  const cy = 220;
  const gs = { x: cx + Re * Math.cos(earthAng + 0.5), y: cy - Re * Math.sin(earthAng + 0.5) };
  const geo = { x: cx + rGeo * Math.cos(geoAng + 0.5), y: cy - rGeo * Math.sin(geoAng + 0.5) };
  const leoP = { x: cx + rLeo * Math.cos(leoAng), y: cy - rLeo * Math.sin(leoAng) };
  const visible = Math.cos(leoAng - (earthAng + 0.5)) > Re / rLeo;
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <svg viewBox="0 0 520 440" className="diagram" role="img" aria-label="Earth with geostationary and low Earth orbits drawn to scale">
        <circle cx={cx} cy={cy} r={rGeo} fill="none" stroke={COL.telecom} strokeDasharray="5 5" />
        <circle cx={cx} cy={cy} r={rLeo} fill="none" stroke="#10b981" strokeDasharray="3 3" />
        <circle cx={cx} cy={cy} r={Re} fill="#3b82f6" />
        <path d={`M ${cx - 20} ${cy - 6} q 10 -14 22 -4 q 8 10 -4 18 q -12 4 -18 -14`} fill="#22c55e" opacity={0.8} transform={`rotate(${(-earthAng * 180) / Math.PI} ${cx} ${cy})`} />
        <circle cx={gs.x} cy={gs.y} r={3.5} fill="#f59e0b" />
        <line x1={gs.x} y1={gs.y} x2={geo.x} y2={geo.y} stroke={COL.telecom} strokeOpacity={0.6} />
        {visible && <line x1={gs.x} y1={gs.y} x2={leoP.x} y2={leoP.y} stroke="#10b981" strokeWidth={1.8} />}
        <rect x={geo.x - 6} y={geo.y - 4} width={12} height={8} fill={COL.telecom} />
        <rect x={leoP.x - 4} y={leoP.y - 3} width={8} height={6} fill="#10b981" />
        <text x={cx} y={cy - rGeo - 8} fontSize={11} textAnchor="middle" fill={COL.telecom}>GEO ≈ 35 786 km above the equator</text>
        <text x={14} y={430} fontSize={10.5} fill={COL.muted}>Drawn to scale: the GEO satellite stays above the ground station; LEO satellites pass in minutes.</text>
      </svg>
      <div className="space-y-3">
        <Slider label="LEO altitude" value={leo} min={300} max={2000} step={10} unit="km" onChange={setLeo} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="LEO period" value={fixed(Tleo / 60, 1)} unit="min" />
          <Stat label="GEO period" value={fixed(Tgeo / 3600, 2)} unit="h" sub="one sidereal day" />
          <Stat label="LEO delay (overhead)" value={fixed(bentPipeDelay(leo) * 1000, 1)} unit="ms" tone="emerald" sub="ground → sat → ground" />
          <Stat label="GEO delay (overhead)" value={fixed(bentPipeDelay(GEO_ALTITUDE_KM) * 1000, 0)} unit="ms" tone="red" />
        </div>
        <Badge tone={visible ? 'emerald' : 'ink'}>{visible ? 'LEO satellite in view of the ground station' : 'LEO satellite below the horizon — hand over to the next satellite'}</Badge>
        <div className="overflow-x-auto">
          <table className="tbl text-xs">
            <thead><tr><th></th><th>GEO</th><th>LEO</th></tr></thead>
            <tbody>
              <tr><td>Altitude</td><td>35 786 km</td><td>≈ 160–2000 km</td></tr>
              <tr><td>Coverage</td><td>≈ ⅓ of Earth per satellite</td><td>Small footprint — needs a constellation</td></tr>
              <tr><td>Antenna</td><td>Fixed dish</td><td>Tracking / phased array</td></tr>
              <tr><td>Uses</td><td>TV broadcast, older satellite broadband</td><td>Low-latency broadband, sat phones, Earth observation</td></tr>
            </tbody>
          </table>
        </div>
        <M block>{'T = 2\\pi\\sqrt{\\dfrac{r^3}{GM}}\\quad (\\text{extension})'}</M>
      </div>
    </div>
  );
}

function GPS() {
  const [rx, setRx] = useState(260);
  const [ry, setRy] = useState(250);
  const sats = [
    { x: 120, y: 60 },
    { x: 400, y: 80 },
    { x: 280, y: 400 },
  ];
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <svg viewBox="0 0 520 440" className="diagram" role="img" aria-label="Two-dimensional trilateration">
        {sats.map((s, i) => {
          const d = Math.hypot(s.x - rx, s.y - ry);
          return (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r={d} fill="none" stroke={['#0ea5e9', '#8b5cf6', '#10b981'][i]} strokeWidth={1.6} />
              <rect x={s.x - 8} y={s.y - 6} width={16} height={12} fill={['#0ea5e9', '#8b5cf6', '#10b981'][i]} />
              <line x1={s.x} y1={s.y} x2={rx} y2={ry} stroke={COL.muted} strokeDasharray="3 3" />
              <Label x={(s.x + rx) / 2} y={(s.y + ry) / 2} size={10.5} bg>d{i + 1} = c·t{i + 1}</Label>
            </g>
          );
        })}
        <circle cx={rx} cy={ry} r={6} fill="#dc2626" />
        <text x={rx + 8} y={ry - 8} fontSize={11} fill="#dc2626">receiver</text>
      </svg>
      <div className="space-y-3">
        <Slider label="Receiver x" value={rx} min={60} max={460} onChange={setRx} />
        <Slider label="Receiver y" value={ry} min={60} max={400} onChange={setRy} />
        <KeyPoints items={['Each GPS satellite (≈ 20 200 km, medium Earth orbit) broadcasts its position and a precise atomic-clock time.', 'The receiver measures signal travel time t and calculates distance d = c × t to each satellite.', 'Each distance defines a sphere (a circle in this 2D view); the spheres intersect at the receiver’s position.', 'The receiver’s cheap clock is inaccurate, so a FOURTH satellite is needed to solve for the clock error (x, y, z and time).', 'A 1 µs timing error ≈ 300 m position error — hence relativity corrections and very accurate clocks.']} />
      </div>
    </div>
  );
}

// ───────────────────────── Television displays ─────────────────────────
export function TVDisplays() {
  const [d, setD] = useState<'crt' | 'lcd' | 'plasma' | 'led' | '3d'>('lcd');
  const info = {
    crt: { t: 'Cathode-ray tube (CRT)', how: 'An electron gun fires a beam that magnetic deflection coils scan across the screen line by line; phosphor dots glow red, green or blue where struck (colour CRTs use three guns and a shadow mask).', pros: ['Excellent contrast and response', 'Wide viewing angle'], cons: ['Very heavy and deep', 'High voltage, high power', 'Lead-glass e-waste'] },
    lcd: { t: 'LCD (liquid crystal display)', how: 'A white backlight (now LEDs) passes through a polariser, a layer of liquid crystals, colour filters and a second polariser. A voltage across each sub-pixel twists/untwists the crystals to control how much light passes.', pros: ['Thin, light, low power', 'No burn-in, long life'], cons: ['Needs a backlight — blacks are not fully black', 'Narrower viewing angles (older panels)'] },
    plasma: { t: 'Plasma display', how: 'Each sub-pixel is a tiny cell of noble gas; a voltage ionises the gas into plasma, which emits UV that excites red, green or blue phosphor.', pros: ['Good contrast and motion', 'Wide viewing angles'], cons: ['Heavy, power hungry', 'Burn-in', 'Largely discontinued'] },
    led: { t: 'LED-based displays (LED-backlit LCD, OLED, micro-LED)', how: '“LED TV” usually means an LCD with an LED backlight (sometimes with local dimming). In OLED and micro-LED displays every sub-pixel is itself a light-emitting diode, so pixels switch off completely for true black.', pros: ['OLED: perfect blacks, very thin, flexible', 'Low power for dark images'], cons: ['OLED: possible image retention, lower peak brightness', 'Cost'] },
    '3d': { t: 'Three-dimensional display concepts', how: 'Stereoscopic 3D sends a slightly different image to each eye. Passive systems use polarised images and polarised glasses; active systems use LCD shutter glasses synchronised with alternating frames; autostereoscopic screens use lenticular lenses or parallax barriers (no glasses).', pros: ['Depth perception for entertainment, design and medical imaging'], cons: ['Glasses, reduced brightness, eye strain', 'Viewing position limits for glasses-free screens'] },
  }[d];
  return (
    <Card title="Television display technology" subtitle="How each technology makes a coloured pixel">
      <Tabs size="sm" value={d} onChange={setD} className="mb-3" tabs={[{ id: 'crt', label: 'CRT' }, { id: 'lcd', label: 'LCD' }, { id: 'plasma', label: 'Plasma' }, { id: 'led', label: 'LED / OLED' }, { id: '3d', label: '3D' }]} />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <svg viewBox="0 0 520 190" className="diagram" role="img" aria-label={info.t}>
          {d === 'crt' && (
            <g>
              <path d="M 40 80 L 140 80 L 380 20 L 380 170 L 140 110 L 40 110 Z" fill="#e2e8f0" stroke={COL.ink} />
              <rect x={40} y={86} width={30} height={18} fill="#64748b" />
              <text x={55} y={130} fontSize={10} textAnchor="middle" fill={COL.ink}>electron gun</text>
              <rect x={150} y={70} width={24} height={50} fill="#f59e0b" opacity={0.5} />
              <text x={162} y={140} fontSize={10} textAnchor="middle" fill={COL.ink}>deflection coils</text>
              <line x1={70} y1={95} x2={378} y2={50} stroke="#ef4444" strokeWidth={1.6} className="flow-dash" />
              {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={392} cy={28 + i * 12} r={4} fill={['#ef4444', '#22c55e', '#3b82f6'][i % 3]} />)}
              <text x={420} y={100} fontSize={10} fill={COL.ink}>phosphor dots</text>
            </g>
          )}
          {d === 'lcd' && (
            <g>
              {[{ x: 40, t: 'LED backlight', c: '#fef9c3' }, { x: 120, t: 'polariser', c: '#cbd5e1' }, { x: 200, t: 'liquid crystal', c: '#c4b5fd' }, { x: 280, t: 'colour filters', c: 'url(#rgb)' }, { x: 360, t: 'polariser', c: '#cbd5e1' }].map((l) => (
                <g key={l.x}>
                  <rect x={l.x} y={30} width={40} height={120} fill={l.c} stroke={COL.ink} />
                  <text x={l.x + 20} y={170} fontSize={9.5} textAnchor="middle" fill={COL.ink}>{l.t}</text>
                </g>
              ))}
              <defs><linearGradient id="rgb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ef4444" /><stop offset="0.33" stopColor="#ef4444" /><stop offset="0.33" stopColor="#22c55e" /><stop offset="0.66" stopColor="#22c55e" /><stop offset="0.66" stopColor="#3b82f6" /><stop offset="1" stopColor="#3b82f6" /></linearGradient></defs>
              {[60, 90, 120].map((y) => <Arrow key={y} x1={80} y1={y} x2={470} y2={y} color="#f59e0b" w={1.4} head={6} />)}
              <text x={470} y={40} fontSize={10} textAnchor="end" fill={COL.ink}>to viewer →</text>
            </g>
          )}
          {d === 'plasma' && (
            <g>
              {['#ef4444', '#22c55e', '#3b82f6'].map((c, i) => (
                <g key={c}>
                  <rect x={120 + i * 100} y={40} width={80} height={100} rx={6} fill={c} opacity={0.25} stroke={COL.ink} />
                  <circle cx={160 + i * 100} cy={90} r={14} fill="#c4b5fd" opacity={0.8} />
                  <text x={160 + i * 100} y={95} fontSize={10} textAnchor="middle" fill={COL.ink}>UV</text>
                </g>
              ))}
              <rect x={110} y={30} width={300} height={6} fill="#94a3b8" />
              <rect x={110} y={144} width={300} height={6} fill="#94a3b8" />
              <text x={260} y={172} fontSize={10.5} textAnchor="middle" fill={COL.ink}>gas cells between electrodes; UV excites the coloured phosphor coating</text>
            </g>
          )}
          {d === 'led' && (
            <g>
              {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={60 + (i % 6) * 34} cy={50 + Math.floor(i / 6) * 34} r={12} fill={['#ef4444', '#22c55e', '#3b82f6'][i % 3]} opacity={i === 7 || i === 8 ? 0.08 : 0.85} />)}
              <text x={145} y={170} fontSize={10.5} textAnchor="middle" fill={COL.ink}>OLED: each sub-pixel emits (dark pixels fully off)</text>
              <rect x={320} y={40} width={160} height={100} fill="#1e293b" />
              {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={340 + (i % 4) * 40} cy={60 + Math.floor(i / 4) * 30} r={6} fill="#fef08a" opacity={0.9} />)}
              <text x={400} y={170} fontSize={10.5} textAnchor="middle" fill={COL.ink}>LED backlight array behind an LCD</text>
            </g>
          )}
          {d === '3d' && (
            <g>
              <rect x={40} y={40} width={160} height={110} fill="#e2e8f0" stroke={COL.ink} />
              <text x={120} y={100} fontSize={11} textAnchor="middle" fill={COL.ink}>left + right images</text>
              <ellipse cx={380} cy={70} rx={16} ry={10} fill="none" stroke={COL.ink} />
              <ellipse cx={380} cy={120} rx={16} ry={10} fill="none" stroke={COL.ink} />
              <line x1={200} y1={80} x2={364} y2={70} stroke="#ef4444" />
              <line x1={200} y1={110} x2={364} y2={120} stroke="#3b82f6" />
              <text x={410} y={74} fontSize={10.5} fill="#ef4444">left eye</text>
              <text x={410} y={124} fontSize={10.5} fill="#3b82f6">right eye</text>
              <text x={290} y={170} fontSize={10.5} textAnchor="middle" fill={COL.ink}>glasses or lenses route a different image to each eye → depth</text>
            </g>
          )}
        </svg>
        <div className="space-y-2 text-sm">
          <div className="font-semibold">{info.t}</div>
          <p>{info.how}</p>
          <div className="grid grid-cols-2 gap-2">
            <div><div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Advantages</div><KeyPoints items={info.pros} /></div>
            <div><div className="text-xs font-semibold text-red-700 dark:text-red-400">Disadvantages</div><KeyPoints items={info.cons} /></div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────── Cellular network ─────────────────────────
export function CellularDiagram() {
  const [x, setX] = useState(0.3);
  const cells: { cx: number; cy: number; f: number }[] = [];
  const R = 46;
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 6; col++) {
      const cx = 60 + col * R * 1.5;
      const cy = 50 + row * R * Math.sqrt(3) + (col % 2 ? (R * Math.sqrt(3)) / 2 : 0);
      cells.push({ cx, cy, f: (col * 2 + row * 3) % 3 });
    }
  const px = 60 + x * 380;
  const py = 150;
  const nearest = cells.reduce((b, c) => (Math.hypot(c.cx - px, c.cy - py) < Math.hypot(b.cx - px, b.cy - py) ? c : b), cells[0]);
  const hex = (cx: number, cy: number) => Array.from({ length: 6 }, (_, i) => `${cx + R * Math.cos((i * Math.PI) / 3)},${cy + R * Math.sin((i * Math.PI) / 3)}`).join(' ');
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <svg viewBox="0 0 520 330" className="diagram" role="img" aria-label="Cellular network with frequency re-use and handover">
        {cells.map((c, i) => (
          <g key={i}>
            <polygon points={hex(c.cx, c.cy)} fill={['#c4b5fd', '#99f6e4', '#fde68a'][c.f]} opacity={c === nearest ? 0.9 : 0.45} stroke="white" strokeWidth={2} />
            <text x={c.cx} y={c.cy + 4} fontSize={9} textAnchor="middle" fill={COL.ink}>f{c.f + 1}</text>
          </g>
        ))}
        <line x1={nearest.cx} y1={nearest.cy} x2={px} y2={py} stroke={COL.telecom} strokeWidth={2} />
        <circle cx={nearest.cx} cy={nearest.cy} r={4} fill={COL.ink} />
        <rect x={px - 5} y={py - 8} width={10} height={16} rx={2} fill="#dc2626" />
        <text x={14} y={322} fontSize={10.5} fill={COL.muted}>Neighbouring cells use different frequency groups (f1–f3); distant cells re-use them.</text>
      </svg>
      <div className="space-y-3">
        <Slider label="Move the phone" value={x} min={0} max={1} step={0.005} onChange={setX} />
        <KeyPoints items={['Each cell is served by a base station (tower). The phone connects to the strongest signal.', 'Handover: as you move, the network transfers the call to the next base station without dropping it.', 'Frequency re-use lets limited spectrum serve millions of users; smaller cells → more capacity.', 'Base stations connect via fibre or microwave backhaul to the core network and the internet/telephone network.']} />
      </div>
    </div>
  );
}
