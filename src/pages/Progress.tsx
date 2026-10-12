import { Link } from 'react-router-dom';
import { ListChecks, Download, RotateCcw, Bookmark } from 'lucide-react';
import { MODULES, MODULE_MAP } from '@/data/modules';
import { exportAll, resetAll, type Attempt } from '@/lib/storage';
import { useStored } from '@/lib/storage';
import { PageHeader, Card, Badge, cx } from '@/components/ui';
import { useSyllabusProgress, moduleProgress, useBookmarks } from '@/components/module/Common';
import { SYLLABUS_NOTE } from '@/data/outcomes';

export default function Progress() {
  const [done, setDone] = useSyllabusProgress();
  const [attempts] = useStored<Attempt[]>('attempts', []);
  const [bm] = useBookmarks();
  const download = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hsc-engineering-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div>
      <PageHeader title="Syllabus Progress Checklist" kicker="Track every dot point" icon={<ListChecks className="text-emerald-600" />}>
        Tick each dot point when you can explain it confidently without notes. {SYLLABUS_NOTE}
      </PageHeader>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {MODULES.map((m) => {
          const p = moduleProgress(m, done);
          return (
            <Link key={m.id} to={`/module/${m.id}/syllabus`} className="card card-pad block hover:shadow-md">
              <div className="flex items-center justify-between"><span className="font-semibold">{m.name}</span><Badge tone={m.id}>{p.pct}%</Badge></div>
              <div className="mt-2 h-2 rounded-full bg-ink-100 dark:bg-ink-800"><div className={cx('h-2 rounded-full', { civil: 'bg-civil', transport: 'bg-transport', aero: 'bg-aero', telecom: 'bg-telecom' }[m.id])} style={{ width: `${p.pct}%` }} /></div>
              <div className="mt-1 text-xs text-ink-500">{p.n} of {p.total} dot points</div>
            </Link>
          );
        })}
      </div>
      <div className="space-y-4">
        {MODULES.map((m) => (
          <Card key={m.id} title={m.name} subtitle={m.type}>
            {m.syllabus.map((g) => (
              <div key={g.id} className="mb-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">{g.heading}</div>
                <div className="grid gap-1 md:grid-cols-2">
                  {[...g.learnAbout, ...g.learnTo].map((d) => (
                    <label key={d.id} className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 text-sm hover:bg-ink-50 dark:hover:bg-ink-800/50">
                      <input type="checkbox" className="mt-1 accent-emerald-600" checked={!!done[d.id]} onChange={() => setDone((x) => ({ ...x, [d.id]: !x[d.id] }))} />
                      <span className={cx(done[d.id] && 'text-ink-400 line-through')}>{d.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card title="Bookmarked concepts" icon={<Bookmark size={18} />}>
          {bm.length === 0 ? (
            <p className="text-sm text-ink-500">Bookmark concepts from any module’s “Major concepts” tab.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {bm.map((k) => {
                const [mid, cid] = k.split(':');
                const m = MODULE_MAP[mid as keyof typeof MODULE_MAP];
                const c = m?.concepts.find((x) => x.id === cid);
                return c ? <li key={k}><Link className="text-emerald-700 hover:underline dark:text-emerald-400" to={`/module/${mid}/concepts#${cid}`}>{c.term}</Link> <span className="text-xs text-ink-500">({m.short})</span></li> : null;
              })}
            </ul>
          )}
        </Card>
        <Card title="Your data">
          <p className="text-sm text-ink-600 dark:text-ink-300">Progress ({attempts.length} practice attempts, checklist, flashcards, bookmarks and preferences) is stored only in this browser using localStorage. No account or server is used.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn" onClick={download}><Download size={14} /> Export progress (JSON)</button>
            <button className="btn border-red-300 text-red-700 dark:border-red-800 dark:text-red-300" onClick={() => confirm('Delete ALL saved progress on this device? This cannot be undone.') && resetAll()}><RotateCcw size={14} /> Reset everything</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
