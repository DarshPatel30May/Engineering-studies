import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import { MATERIALS } from '@/data/materials';
import { sig } from '@/lib/calc/format';
import { usePrefs } from '@/lib/prefs';
import { Tabs, Callout } from '../ui';

type Metric = 'density' | 'E' | 'strength' | 'specStrength' | 'specStiffness';

const METRICS: { id: Metric; label: string; unit: string }[] = [
  { id: 'density', label: 'Density', unit: 'kg/m³' },
  { id: 'E', label: 'Young’s modulus', unit: 'GPa' },
  { id: 'strength', label: 'Strength', unit: 'MPa' },
  { id: 'specStrength', label: 'Strength / density', unit: 'kN·m/kg' },
  { id: 'specStiffness', label: 'Stiffness / density', unit: 'MN·m/kg' },
];

/**
 * Single-metric comparison bar chart (one hue — magnitude, not identity), with hover tooltip and
 * a table view. Values are the representative chart values stored with each material.
 */
export function MaterialChart({ ids, title, defaultMetric = 'strength' }: { ids: string[]; title?: string; defaultMetric?: Metric }) {
  const [metric, setMetric] = useState<Metric>(defaultMetric);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const { isDark } = usePrefs();
  const data = useMemo(
    () =>
      ids
        .map((id) => MATERIALS.find((m) => m.id === id))
        .filter((m): m is NonNullable<typeof m> => !!m && !!m.chart)
        .map((m) => {
          const c = m.chart!;
          const v: Record<Metric, number | undefined> = {
            density: c.density,
            E: c.E,
            strength: c.strength,
            specStrength: c.strength !== undefined ? (c.strength * 1e6) / c.density / 1000 : undefined,
            specStiffness: c.E !== undefined ? (c.E * 1e9) / c.density / 1e6 : undefined,
          };
          return { name: shortName(m.name), full: m.name, kind: c.strengthKind ?? 'UTS', value: v[metric] };
        })
        .filter((d) => d.value !== undefined)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
    [ids, metric],
  );
  const meta = METRICS.find((m) => m.id === metric)!;
  const ink = isDark ? '#c9d3d7' : '#3c464b';
  const grid = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.08)';
  const bar = isDark ? '#34d399' : '#059669';
  return (
    <div>
      {title && <h4 className="mb-2 text-sm font-semibold">{title}</h4>}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs size="sm" value={metric} onChange={setMetric} tabs={METRICS.map((m) => ({ id: m.id, label: m.label }))} />
        <Tabs size="sm" value={view} onChange={setView} tabs={[{ id: 'chart', label: 'Chart' }, { id: 'table', label: 'Table' }]} />
      </div>
      {view === 'chart' ? (
        <div style={{ height: Math.max(180, data.length * 34 + 40) }} role="img" aria-label={`${meta.label} comparison bar chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke={grid} />
              <XAxis type="number" tick={{ fill: ink, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fill: ink, fontSize: 11.5 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                contentStyle={{ background: isDark ? '#161b1e' : '#fff', border: `1px solid ${isDark ? '#3c464b' : '#d6dcde'}`, borderRadius: 8, fontSize: 12, color: ink }}
                formatter={(v: unknown, _n: unknown, p: { payload?: { kind?: string } }) => [`${sig(Number(v), 3)} ${meta.unit}${metric === 'strength' ? ` (${p.payload?.kind})` : ''}`, meta.label]}
                labelFormatter={(_l: unknown, p: readonly { payload?: { full?: string } }[]) => p?.[0]?.payload?.full ?? ''}
              />
              <Bar dataKey="value" fill={bar} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="value" position="right" formatter={(v: unknown) => sig(Number(v), 3)} style={{ fill: ink, fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Material</th>
                <th>
                  {meta.label} ({meta.unit})
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.full}>
                  <td>{d.full}</td>
                  <td className="font-mono tabular-nums">
                    {sig(d.value!, 3)}
                    {metric === 'strength' && <span className="ml-1 text-xs text-ink-500">({d.kind})</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Callout kind="info" className="mt-3">
        Representative values for the stated grade/condition (see each material card). “Strength” is UTS for metals and composites, compressive strength for concrete and brick, and flexural strength for glass — compare like with like. Not for design.
      </Callout>
    </div>
  );
}

function shortName(n: string) {
  return n
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace('Aluminium', 'Al')
    .replace('-reinforced polymer', ' FRP')
    .trim()
    .slice(0, 28);
}
