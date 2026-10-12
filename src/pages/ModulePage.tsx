import { useNavigate, useParams, Link } from 'react-router-dom';
import { Building2, Bus, Plane, RadioTower, Printer } from 'lucide-react';
import { MODULE_MAP, isModuleId } from '@/data/modules';
import type { ModuleId } from '@/data/types';
import { useHashScroll } from '@/hooks/useHashScroll';
import { Badge, cx } from '@/components/ui';
import { OverviewTab, SyllabusTab, ConceptsTab, HistoryTab, RevisionTab, useSyllabusProgress, moduleProgress } from '@/components/module/Common';
import { CivilMechanics, CivilMaterials, CivilCommunication, civilFeatures } from '@/components/module/CivilTabs';
import { TransportMechanics, TransportMaterials, TransportElectricity, TransportCommunication, transportFeatures } from '@/components/module/TransportTabs';
import { AeroScope, AeroMechanics, AeroMaterials, AeroCommunication, aeroFeatures } from '@/components/module/AeroTabs';
import { TelecomScope, TelecomElectricity, TelecomMaterials, TelecomCommunication, telecomFeatures } from '@/components/module/TelecomTabs';
import NotFound from './NotFound';

type TabDef = { id: string; label: string; letter: string; el: () => JSX.Element };

const ICONS: Record<ModuleId, typeof Building2> = { civil: Building2, transport: Bus, aero: Plane, telecom: RadioTower };

function tabsFor(id: ModuleId): TabDef[] {
  const m = MODULE_MAP[id];
  const common = {
    overview: { id: 'overview', label: 'Overview', el: () => <OverviewTab m={m} features={{ civil: civilFeatures, transport: transportFeatures, aero: aeroFeatures, telecom: telecomFeatures }[id]} /> },
    syllabus: { id: 'syllabus', label: 'Syllabus', el: () => <SyllabusTab m={m} /> },
    concepts: { id: 'concepts', label: 'Major concepts', el: () => <ConceptsTab m={m} /> },
    history: { id: 'history', label: 'History & society', el: () => <HistoryTab m={m} /> },
    revision: { id: 'revision', label: 'Quick revision', el: () => <RevisionTab m={m} /> },
  };
  const list: Omit<TabDef, 'letter'>[] = (() => {
    switch (id) {
      case 'civil':
        return [common.overview, common.syllabus, common.concepts, { id: 'mechanics', label: 'Engineering mechanics', el: CivilMechanics }, { id: 'materials', label: 'Engineering materials', el: CivilMaterials }, common.history, { id: 'communication', label: 'Engineering communication', el: CivilCommunication }, common.revision];
      case 'transport':
        return [common.overview, common.syllabus, common.concepts, { id: 'mechanics', label: 'Engineering mechanics', el: TransportMechanics }, { id: 'materials', label: 'Engineering materials', el: TransportMaterials }, { id: 'electricity', label: 'Electricity & electronics', el: TransportElectricity }, common.history, { id: 'communication', label: 'Engineering communication', el: TransportCommunication }, common.revision];
      case 'aero':
        return [common.overview, common.syllabus, common.concepts, { id: 'scope', label: 'Scope of the profession', el: AeroScope }, { id: 'mechanics', label: 'Mechanics & hydraulics', el: AeroMechanics }, { id: 'materials', label: 'Engineering materials', el: AeroMaterials }, common.history, { id: 'communication', label: 'Engineering communication', el: AeroCommunication }, common.revision];
      case 'telecom':
        return [common.overview, common.syllabus, common.concepts, { id: 'scope', label: 'Scope of the profession', el: TelecomScope }, { id: 'electricity', label: 'Electricity & electronics', el: TelecomElectricity }, { id: 'materials', label: 'Engineering materials', el: TelecomMaterials }, common.history, { id: 'communication', label: 'Engineering communication', el: TelecomCommunication }, common.revision];
    }
  })();
  return list.map((t, i) => ({ ...t, letter: String.fromCharCode(65 + i) }));
}

const BAND: Record<ModuleId, string> = {
  civil: 'from-civil/15 via-civil/5 border-civil/30',
  transport: 'from-transport/15 via-transport/5 border-transport/30',
  aero: 'from-aero/15 via-aero/5 border-aero/30',
  telecom: 'from-telecom/15 via-telecom/5 border-telecom/30',
};
const TEXT: Record<ModuleId, string> = {
  civil: 'text-civil dark:text-civil-light',
  transport: 'text-transport dark:text-transport-light',
  aero: 'text-aero dark:text-aero-light',
  telecom: 'text-telecom dark:text-telecom-light',
};
const ACTIVE: Record<ModuleId, string> = {
  civil: 'border-civil text-civil dark:text-civil-light',
  transport: 'border-transport text-transport dark:text-transport-light',
  aero: 'border-aero text-aero dark:text-aero-light',
  telecom: 'border-telecom text-telecom dark:text-telecom-light',
};

export default function ModulePage() {
  const { id, tab } = useParams();
  const nav = useNavigate();
  useHashScroll([id, tab]);
  const [done] = useSyllabusProgress();
  if (!isModuleId(id)) return <NotFound />;
  const m = MODULE_MAP[id];
  const tabs = tabsFor(id);
  const current = tabs.find((t) => t.id === tab) ?? tabs[0];
  const Icon = ICONS[id];
  const p = moduleProgress(m, done);
  const Body = current.el;
  return (
    <div>
      <header className={cx('mb-4 overflow-hidden rounded-2xl border bg-gradient-to-r to-transparent p-5', BAND[id])}>
        <div className="flex flex-wrap items-start gap-4">
          <div className={cx('flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-ink-900', TEXT[id])}>
            <Icon size={30} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cx('text-xs font-bold uppercase tracking-[0.14em]', TEXT[id])}>HSC Module {m.number}</span>
              <Badge tone={id}>{m.type}</Badge>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-ink-900 sm:text-3xl dark:text-white">{m.name}</h1>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{m.tagline}</p>
          </div>
          <div className="w-full sm:w-56">
            <div className="flex justify-between text-xs text-ink-500"><span>Syllabus checklist</span><span>{p.pct}%</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/70 dark:bg-ink-800">
              <div className={cx('h-full rounded-full', { civil: 'bg-civil', transport: 'bg-transport', aero: 'bg-aero', telecom: 'bg-telecom' }[id])} style={{ width: `${p.pct}%` }} />
            </div>
            <Link to={`/revision-sheets?m=${id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink-600 hover:underline dark:text-ink-300"><Printer size={13} /> Printable revision sheet</Link>
          </div>
        </div>
      </header>
      <nav className="no-print sticky top-14 z-10 -mx-3 mb-6 overflow-x-auto border-b border-ink-200 bg-ink-50/95 px-3 backdrop-blur dark:border-ink-800 dark:bg-ink-950/95 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" aria-label="Module sections">
        <ul className="flex gap-1 whitespace-nowrap">
          {tabs.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => nav(`/module/${id}/${t.id}`)}
                aria-current={t.id === current.id ? 'page' : undefined}
                className={cx('flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition', t.id === current.id ? ACTIVE[id] : 'border-transparent text-ink-500 hover:text-ink-800 dark:hover:text-ink-200')}
              >
                <span className="font-mono text-[10px] opacity-70">{t.letter}</span>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <Body />
      <div className="no-print mt-10 flex justify-between border-t border-ink-200 pt-4 text-sm dark:border-ink-800">
        {(() => {
          const i = tabs.indexOf(current);
          return (
            <>
              {i > 0 ? <Link className="btn" to={`/module/${id}/${tabs[i - 1].id}`}>← {tabs[i - 1].label}</Link> : <span />}
              {i < tabs.length - 1 ? <Link className="btn btn-primary" to={`/module/${id}/${tabs[i + 1].id}`}>{tabs[i + 1].label} →</Link> : <Link className="btn btn-primary" to="/practice">HSC practice →</Link>}
            </>
          );
        })()}
      </div>
    </div>
  );
}
