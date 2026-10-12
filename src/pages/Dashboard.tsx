import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, Bus, Plane, RadioTower, ArrowRight, Clock, Target, Sparkles, type LucideIcon } from 'lucide-react';
import { MODULES } from '@/data/modules';
import { EXAM_SPEC } from '@/data/outcomes';
import { NAV } from '@/nav';
import type { ModuleId } from '@/data/types';
import { useSyllabusProgress, moduleProgress } from '@/components/module/Common';
import { useAttempts } from '@/pages/Practice';
import { Card, Badge, Stat, cx, ACCENT_HEX } from '@/components/ui';

const ICON: Record<ModuleId, LucideIcon> = { civil: Building2, transport: Bus, aero: Plane, telecom: RadioTower };
const BAR: Record<ModuleId, string> = { civil: 'bg-civil', transport: 'bg-transport', aero: 'bg-aero', telecom: 'bg-telecom' };

const TOOLS = NAV.filter((g) => g.heading !== 'Overview' && g.heading !== 'HSC Modules').flatMap((g) => g.items);
const TOOL_DESC: Record<string, string> = {
  '/mechanics-lab': 'Forces, equilibrium, beams with SFD/BMD, trusses, stress–strain, machines, friction, fluids.',
  '/aero-lab': 'Lift and drag, aerofoil flow, Bernoulli, propulsion, Pitot-static instruments.',
  '/telecom-lab': 'Modulation, spectrum, fibre optics, logic gates, satellites and networks.',
  '/materials': 'Searchable materials library with properties, uses and side-by-side comparisons.',
  '/manufacturing': 'Animated casting, forming, machining, joining and composite processes.',
  '/drawing': '3D→2D orthographic explorer, AS 1100 conventions and drawing practice.',
  '/formulas': 'Every formula with units, worked examples, calculators and a unit converter.',
  '/reports': 'Engineering report structure, decision matrix and a model paragraph.',
  '/concept-maps': 'Interactive maps linking the ideas in each module.',
  '/solver': 'Guided step-by-step solutions with hints, checks and fresh numbers.',
  '/practice': 'Exam-style MCQ, short-answer and calculation practice with feedback.',
  '/flashcards': 'Spaced-repetition definitions, misconceptions and formulas.',
  '/progress': 'Tick off every syllabus dot point and export your progress.',
  '/revision-sheets': 'Printable one-module summaries (save as PDF).',
  '/about': 'Sources, assumptions, installation and accessibility notes.',
};

export default function Dashboard() {
  const [done] = useSyllabusProgress();
  const [attempts] = useAttempts();
  const total = attempts.reduce((s, a) => s + a.max, 0);
  const got = attempts.reduce((s, a) => s + a.score, 0);
  const byModule = MODULES.map((m) => {
    const a = attempts.filter((x) => x.module === m.id);
    const mx = a.reduce((s, x) => s + x.max, 0);
    return { m, n: a.length, pct: mx ? Math.round((a.reduce((s, x) => s + x.score, 0) / mx) * 100) : null };
  });
  const weakest = byModule.filter((b) => b.pct !== null && b.n >= 3).sort((a, b) => a.pct! - b.pct!)[0];
  const allDots = MODULES.reduce((s, m) => s + moduleProgress(m, done).total, 0);
  const doneDots = MODULES.reduce((s, m) => s + moduleProgress(m, done).n, 0);
  return (
    <div>
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-ink-950 dark:to-sky-950/30 md:p-8">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1.3fr_1fr]">
          <div>
            <Badge tone="emerald">NSW HSC · Engineering Studies Stage 6 · 2026</Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 dark:text-white md:text-4xl">Learn engineering by <span className="text-emerald-600 dark:text-emerald-400">seeing it work</span>.</h1>
            <p className="mt-3 max-w-xl text-ink-600 dark:text-ink-300">All four HSC modules with interactive simulations, worked solutions, calculators and exam practice — built around the NESA Engineering Studies Stage 6 syllabus.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/module/civil" className="btn btn-primary">Start with Civil Structures <ArrowRight size={15} /></Link>
              <Link to="/practice" className="btn">Practise exam questions</Link>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m, i) => {
          const Icon = ICON[m.id];
          const p = moduleProgress(m, done);
          const st = byModule[i];
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link to={`/module/${m.id}`} className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="h-1.5" style={{ background: ACCENT_HEX[m.id] }} />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ background: ACCENT_HEX[m.id] }}><Icon size={20} /></span>
                    <Badge tone={m.id}>{m.type}</Badge>
                  </div>
                  <h2 className="mt-3 font-semibold text-ink-900 dark:text-white">{m.name}</h2>
                  <p className="mt-1 flex-1 text-sm text-ink-600 dark:text-ink-400">{m.tagline}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-ink-500"><span>Syllabus checklist</span><span>{p.pct}%</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-ink-100 dark:bg-ink-800"><div className={cx('h-1.5 rounded-full', BAR[m.id])} style={{ width: `${p.pct}%` }} /></div>
                    <div className="mt-2 text-xs text-ink-500">{st.n ? `Practice: ${st.pct}% over ${st.n} attempts` : 'No practice attempts yet'}</div>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium" style={{ color: ACCENT_HEX[m.id] }}>Open module <ArrowRight size={14} className="transition group-hover:translate-x-0.5" /></span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card title="Your progress" icon={<Target size={18} />}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Dot points ticked" value={`${doneDots}/${allDots}`} />
            <Stat label="Practice score" value={total ? `${Math.round((got / total) * 100)}%` : '—'} sub={`${attempts.length} attempts`} />
          </div>
          <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
            {weakest ? <>Suggested focus: <Link className="font-medium text-emerald-700 underline dark:text-emerald-400" to={`/module/${weakest.m.id}/revision`}>{weakest.m.name}</Link> ({weakest.pct}% in practice).</> : 'Complete a few practice questions to get a suggested focus area.'}
          </p>
          <Link to="/progress" className="mt-2 inline-block text-sm text-emerald-700 hover:underline dark:text-emerald-400">Open syllabus checklist →</Link>
        </Card>
        <Card title="The HSC examination" icon={<Clock size={18} />}>
          <ul className="space-y-1.5 text-sm">
            <li><strong>{EXAM_SPEC.totalMarks} marks</strong> · {EXAM_SPEC.time}</li>
            {EXAM_SPEC.sections.map((s) => <li key={s.name}><strong>{s.name}</strong> ({s.marks} marks): {s.desc}</li>)}
            <li className="text-ink-500">Check the NESA website for the current exam specifications and past papers.</li>
          </ul>
        </Card>
        <Card title="How to use this site" icon={<Sparkles size={18} />}>
          <ol className="ml-4 list-decimal space-y-1 text-sm text-ink-700 dark:text-ink-300">
            <li>Work through a module’s tabs A–H in order.</li>
            <li>Use the labs to <em>see</em> each idea, then the solver to <em>do</em> it.</li>
            <li>Practise exam questions and review your weak areas.</li>
            <li>Revise with flashcards and printable sheets.</li>
          </ol>
          <p className="mt-2 text-xs text-ink-500">Switch Beginner/Advanced, Visual-only and dark mode from the top bar. Press <span className="kbd">Ctrl</span> <span className="kbd">K</span> to search.</p>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Laboratories, tools and revision</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.to} to={t.to} className="card card-pad group flex gap-3 transition hover:shadow-md">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"><t.icon size={18} /></span>
            <span>
              <span className="font-medium text-ink-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">{t.label}</span>
              <span className="block text-sm text-ink-500">{TOOL_DESC[t.to]}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Decorative hero: truss bridge, aircraft, transmission tower and a bus, in module colours. */
function HeroArt() {
  return (
    <svg viewBox="0 0 360 220" className="w-full" aria-hidden>
      <g stroke={ACCENT_HEX.civil} strokeWidth={3} fill="none" strokeLinecap="round">
        <path d="M20 170 H340" />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${20 + i * 53.3} 170 L${46.7 + i * 53.3} 120 L${73.3 + i * 53.3} 170`} />)}
        <path d="M46.7 120 H313.3" />
      </g>
      <g fill={ACCENT_HEX.transport}>
        <motion.g initial={{ x: -90 }} animate={{ x: 300 }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}>
          <rect x={20} y={146} width={64} height={20} rx={4} />
          <rect x={26} y={150} width={10} height={7} fill="#fff" opacity={0.8} />
          <rect x={40} y={150} width={10} height={7} fill="#fff" opacity={0.8} />
          <rect x={54} y={150} width={10} height={7} fill="#fff" opacity={0.8} />
          <circle cx={34} cy={167} r={4} fill="#334155" />
          <circle cx={72} cy={167} r={4} fill="#334155" />
        </motion.g>
      </g>
      <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} fill={ACCENT_HEX.aero}>
        <path d="M150 52 L232 46 Q244 46 244 52 Q244 58 232 58 L150 56 Z" />
        <path d="M196 52 L178 22 L188 22 L214 52 Z" />
        <path d="M196 54 L182 82 L192 82 L214 54 Z" opacity={0.8} />
        <path d="M152 54 L144 36 L152 36 L162 54 Z" />
      </motion.g>
      <g stroke={ACCENT_HEX.telecom} strokeWidth={2.5} fill="none">
        <path d="M310 110 L322 20 L334 110 M314 80 H330 M317 55 H327" />
        {[1, 2, 3].map((i) => (
          <motion.path key={i} d={`M${322 - i * 10} ${20 - i * 6} Q322 ${12 - i * 10} ${322 + i * 10} ${20 - i * 6}`} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} />
        ))}
      </g>
    </svg>
  );
}
