import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlaskConical, Search } from 'lucide-react';
import { MATERIALS, MATERIAL_CATEGORIES, COMPARISONS } from '@/data/materials';
import { MaterialFull } from '@/components/materials/MaterialCard';
import { MaterialChart } from '@/components/materials/MaterialChart';
import { Microstructure } from '@/components/materials/Microstructure';
import { PageHeader, Card, SectionTitle, Badge, Callout, cx } from '@/components/ui';
import SectionNav from '@/components/SectionNav';
import { useHashScroll } from '@/hooks/useHashScroll';

const CrystalViewer = lazy(() => import('@/components/materials/CrystalViewer'));

const MICRO: { k: Parameters<typeof Microstructure>[0]['kind']; t: string; d: string }[] = [
  { k: 'grain', t: 'Equiaxed grains', d: 'Annealed or recrystallised metal: grains of similar size in all directions. Finer grains → stronger and tougher.' },
  { k: 'fibre', t: 'Elongated (cold-worked) grains / fibres', d: 'Rolling or drawing stretches grains; dislocations pile up → harder, less ductile. In composites, the lines are reinforcing fibres.' },
  { k: 'pearlite', t: 'Ferrite + pearlite (steel)', d: 'Slowly cooled carbon steel: soft ferrite grains and pearlite colonies (alternating ferrite and cementite lamellae).' },
  { k: 'graphite', t: 'Graphite flakes (grey cast iron)', d: 'Flakes act like internal cracks → brittle in tension, but give damping and machinability.' },
  { k: 'precipitate', t: 'Fine precipitates', d: 'Age-hardened aluminium alloys or tempered martensite: tiny particles block dislocation movement.' },
  { k: 'amorphous', t: 'Amorphous network (glass)', d: 'No long-range order or slip planes → hard, transparent, brittle.' },
  { k: 'linear', t: 'Linear polymer chains', d: 'Thermoplastics: weak forces between chains — soften on heating.' },
  { k: 'crosslinked', t: 'Cross-linked network', d: 'Thermosets: covalent cross-links → rigid, heat resistant, cannot be remelted.' },
  { k: 'elastomer', t: 'Lightly cross-linked coils', d: 'Elastomers: chains uncoil under load and spring back.' },
  { k: 'laminate', t: 'Laminate layers', d: 'Plywood, laminated glass, FML: layers bonded to combine properties.' },
  { k: 'concrete', t: 'Particulate composite', d: 'Concrete and asphalt: aggregate particles bound in a matrix.' },
];

export default function MaterialsLab() {
  useHashScroll();
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const sel = params.get('m') ?? 'mild-steel';
  const cmp = params.get('c') ?? COMPARISONS[0].id;
  const list = useMemo(() => MATERIALS.filter((m) => (cat === 'all' || m.category === cat) && (!q || (m.name + m.structure + m.apps.join(' ')).toLowerCase().includes(q.toLowerCase()))), [cat, q]);
  const material = MATERIALS.find((m) => m.id === sel) ?? MATERIALS[0];
  const comparison = COMPARISONS.find((c) => c.id === cmp) ?? COMPARISONS[0];
  useEffect(() => {
    if (params.get('c')) document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' });
  }, [params]);
  return (
    <div>
      <PageHeader title="Materials and Manufacturing Laboratory" kicker="Complete engineering materials library" icon={<FlaskConical className="text-emerald-600" />}>
        Every material lists its structure, properties (with grade and condition), strengths, limitations, applications, processes, testing, degradation and syllabus connections. Values are representative and vary with grade and processing — they are not design data.
      </PageHeader>
      <SectionNav items={[{ id: 'library', label: 'Library' }, { id: 'compare', label: 'Side-by-side comparisons' }, { id: 'charts', label: 'Property charts' }, { id: 'crystal', label: 'Crystal structures' }, { id: 'micro', label: 'Microstructures' }]} />
      <section id="library" className="scroll-mt-28">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {['all', ...MATERIAL_CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cx('chip', cat === c ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'border-ink-200 dark:border-ink-700')}>
              {c === 'all' ? 'All materials' : c} <span className="text-ink-400">{c === 'all' ? MATERIALS.length : MATERIALS.filter((m) => m.category === c).length}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
          <div className="space-y-2">
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-2.5 text-ink-400" />
              <input className="input pl-8" placeholder="Filter materials…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter materials" />
            </div>
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
              {list.map((m) => (
                <li key={m.id}>
                  <button onClick={() => setParams({ m: m.id }, { replace: true })} className={cx('flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition', m.id === material.id ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40' : 'border-transparent hover:bg-ink-100 dark:hover:bg-ink-800')}>
                    {m.micro && <Microstructure kind={m.micro} size={30} />}
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.name}</span>
                      <span className="block text-[11px] text-ink-500">{m.category}</span>
                    </span>
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="p-3 text-sm text-ink-500">No materials match.</li>}
            </ul>
          </div>
          <MaterialFull m={material} />
        </div>
      </section>
      <section id="compare" className="scroll-mt-28">
        <SectionTitle sub="Ten essential comparisons for HSC answers">Side-by-side comparisons</SectionTitle>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {COMPARISONS.map((c) => (
            <button key={c.id} onClick={() => setParams({ m: sel, c: c.id }, { replace: true })} className={cx('chip', c.id === comparison.id ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'border-ink-200 dark:border-ink-700')}>
              {c.title}
            </button>
          ))}
        </div>
        <Card title={comparison.title}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr><th className="w-1/5">Feature</th><th>{comparison.a}</th><th>{comparison.b}</th></tr>
              </thead>
              <tbody>
                {comparison.rows.map((r) => (
                  <tr key={r[0]}><td className="font-semibold">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout kind="tip" title="Verdict" className="mt-3">{comparison.verdict}</Callout>
        </Card>
      </section>
      <section id="charts" className="scroll-mt-28">
        <SectionTitle>Property charts</SectionTitle>
        <Card>
          <MaterialChart ids={MATERIALS.filter((m) => m.chart).map((m) => m.id)} defaultMetric="specStrength" />
        </Card>
      </section>
      <section id="crystal" className="scroll-mt-28">
        <SectionTitle>Crystal structures</SectionTitle>
        <Suspense fallback={<div className="h-[380px] animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />}>
          <CrystalViewer />
        </Suspense>
      </section>
      <section id="micro" className="scroll-mt-28">
        <SectionTitle sub="Schematic, not to scale">Microstructure and structure gallery</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MICRO.map((x) => (
            <div key={x.t} className="card card-pad flex gap-3">
              <Microstructure kind={x.k} size={88} />
              <div>
                <div className="text-sm font-semibold">{x.t}</div>
                <p className="text-xs text-ink-600 dark:text-ink-300">{x.d}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-500"><Badge>Structure → properties</Badge> Bonding (metallic, ionic/covalent, secondary) and structure (crystal type, grain size, phases, chain arrangement) explain almost every property difference in this library.</p>
      </section>
    </div>
  );
}
