import { Link } from 'react-router-dom';
import { MATERIALS, type Material } from '@/data/materials';
import { MODULE_MAP } from '@/data/modules';
import { Badge, Card, KeyPoints, cx } from '../ui';
import { Microstructure } from './Microstructure';

export function MaterialMini({ id }: { id: string }) {
  const m = MATERIALS.find((x) => x.id === id);
  if (!m) return null;
  return (
    <article className="card card-pad flex flex-col">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h4 className="font-semibold text-ink-900 dark:text-white">{m.name}</h4>
        {m.micro && <Microstructure kind={m.micro} size={46} />}
      </div>
      <Badge className="mb-2 self-start">{m.category}</Badge>
      <p className="prose-only text-sm text-ink-600 dark:text-ink-300">{m.structure}</p>
      <p className="mt-2 text-sm">
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Why select it: </span>
        {m.why}
      </p>
      <ul className="mt-2 space-y-0.5 text-xs text-ink-600 dark:text-ink-400">
        {m.props.slice(0, 3).map((p) => (
          <li key={p.name}>
            <span className="font-medium text-ink-800 dark:text-ink-200">{p.name}:</span> {p.value}
          </li>
        ))}
      </ul>
      <Link to={`/materials?m=${m.id}`} className="mt-auto pt-3 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
        Full material profile →
      </Link>
    </article>
  );
}

export function MaterialFull({ m }: { m: Material }) {
  const rows: [string, string[] | string][] = [
    ['Strengths', m.strengths],
    ['Limitations', m.limits],
    ['Engineering applications', m.apps],
    ['Manufacturing processes', m.processes],
    ['Material testing', m.testing],
  ];
  return (
    <Card>
      <div className="flex flex-wrap items-start gap-4">
        {m.micro && (
          <div className="shrink-0">
            <Microstructure kind={m.micro} size={130} />
            <p className="mt-1 w-[130px] text-center text-[10.5px] text-ink-500">Schematic structure</p>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-ink-900 dark:text-white">{m.name}</h3>
            <Badge tone="emerald">{m.category}</Badge>
          </div>
          <p className="mt-2 text-sm text-ink-700 dark:text-ink-300">
            <span className="font-semibold">Structure & composition: </span>
            {m.structure}
          </p>
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            <span className="font-semibold">Why engineers select it: </span>
            {m.why}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="mb-1 text-sm font-semibold">Important mechanical / physical properties</h4>
          <table className="tbl">
            <tbody>
              {m.props.map((p) => (
                <tr key={p.name}>
                  <td className="w-2/5 font-medium">{p.name}</td>
                  <td>{p.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-ink-500">Representative values for the stated grade/condition; real values vary with grade, processing and temperature.</p>
        </div>
        <div className="space-y-3">
          {rows.map(([t, v]) => (
            <div key={t}>
              <h4 className="mb-1 text-sm font-semibold">{t}</h4>
              <KeyPoints items={v as string[]} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          <span className="font-semibold">Corrosion / degradation: </span>
          {m.degradation}
        </div>
        <div className="rounded-lg border border-ink-200 p-3 text-sm dark:border-ink-700">
          <span className="font-semibold">Syllabus module connections: </span>
          <span className="inline-flex flex-wrap gap-1.5">
            {m.modules.map((id) => (
              <Link key={id} to={`/module/${id}/materials`} className={cx('chip', `border-current`)}>
                <Badge tone={id}>{MODULE_MAP[id].name}</Badge>
              </Link>
            ))}
          </span>
        </div>
      </div>
    </Card>
  );
}
