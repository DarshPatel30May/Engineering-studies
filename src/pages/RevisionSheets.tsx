import { useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { MODULES } from '@/data/modules';
import { FORMULA_MAP } from '@/data/formulas';
import { PageHeader, M, MathText, Tabs, cx } from '@/components/ui';

export default function RevisionSheets() {
  const [params, setParams] = useSearchParams();
  const sel = params.get('m') ?? 'all';
  const list = MODULES.filter((m) => sel === 'all' || m.id === sel);
  return (
    <div>
      <div className="no-print">
        <PageHeader title="Printable Revision Sheets" kicker="Print or save as PDF" icon={<Printer className="text-emerald-600" />}>
          Condensed one-module summaries: 30-second summary, takeaways, formulas, definitions and misconceptions. Use your browser’s Print dialog and choose “Save as PDF” to create a PDF.
        </PageHeader>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Tabs value={sel} onChange={(v) => setParams({ m: v })} tabs={[{ id: 'all', label: 'All modules' }, ...MODULES.map((m) => ({ id: m.id, label: m.short }))]} />
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={15} /> Print / Save as PDF</button>
        </div>
      </div>
      <div className="space-y-6">
        {list.map((m, i) => (
          <article key={m.id} className={cx('card card-pad', i > 0 && 'print-break')}>
            <header className="mb-3 border-b border-ink-200 pb-2 dark:border-ink-700">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">HSC Engineering Studies · Module {m.number} · {m.type}</div>
              <h2 className="text-xl font-bold">{m.name}</h2>
            </header>
            <p className="mb-3 text-sm"><strong>30-second summary: </strong><MathText text={m.revision.thirtySecond} /></p>
            <div className="grid gap-4 md:grid-cols-2">
              <section>
                <h3 className="mb-1 text-sm font-bold">Key takeaways</h3>
                <ol className="ml-4 list-decimal space-y-0.5 text-[13px]">{m.revision.takeaways.map((t) => <li key={t}><MathText text={t} /></li>)}</ol>
              </section>
              <section>
                <h3 className="mb-1 text-sm font-bold">Formulas</h3>
                <ul className="space-y-0.5 text-[13px]">{m.revision.formulas.map((id) => FORMULA_MAP[id] && <li key={id} className="flex flex-wrap items-center justify-between gap-x-3 border-b border-ink-100 py-1.5 dark:border-ink-800"><span>{FORMULA_MAP[id].name}</span><M className="ml-auto">{FORMULA_MAP[id].latex}</M></li>)}</ul>
              </section>
              <section>
                <h3 className="mb-1 text-sm font-bold">Definitions</h3>
                <dl className="space-y-0.5 text-[12.5px]">{m.concepts.slice(0, 14).map((c) => <div key={c.id}><dt className="inline font-semibold">{c.term}: </dt><dd className="inline"><MathText text={c.def} /></dd></div>)}</dl>
              </section>
              <section>
                <h3 className="mb-1 text-sm font-bold">Misconceptions</h3>
                <ul className="space-y-1 text-[12.5px]">{m.revision.misconceptions.map((x) => <li key={x.wrong}>✗ <MathText text={x.wrong} /><br />✓ <MathText text={x.right} /></li>)}</ul>
                <h3 className="mb-1 mt-3 text-sm font-bold">Timeline highlights</h3>
                <ul className="space-y-0.5 text-[12.5px]">{m.timeline.slice(0, 8).map((t) => <li key={t.title}><strong>{t.year}</strong> — {t.title}</li>)}</ul>
              </section>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
