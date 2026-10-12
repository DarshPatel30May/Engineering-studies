import { useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { PageHeader, Card, SectionTitle, KeyPoints, Callout, Grid, Badge, cx } from '@/components/ui';
import SectionNav from '@/components/SectionNav';
import { useHashScroll } from '@/hooks/useHashScroll';
import { useStored } from '@/lib/storage';

const STRUCTURE = [
  { id: 'title', t: 'Title page & contents', d: 'Title, author(s), date, table of contents and list of figures.', tip: 'Number every section, figure and table.' },
  { id: 'intro', t: 'Introduction & problem definition', d: 'State the engineering problem, its purpose, constraints (cost, safety, standards, environment) and the scope of the report.', tip: 'One clear sentence: “This report evaluates … in order to …”.' },
  { id: 'research', t: 'Background research', d: 'History and current practice, societal and environmental context, relevant standards — from reliable sources.', tip: 'Summarise and relate to your problem; don’t copy.' },
  { id: 'analysis', t: 'Analysis', d: 'Engineering mechanics, calculations, testing results and graphs. Show formulas, substitutions, units and answers.', tip: 'Every calculation should lead to a conclusion (“so the FoS of 2.8 is adequate”).' },
  { id: 'materials', t: 'Materials and processes', d: 'Compare candidate materials and manufacturing processes using properties (with units) and structure–property reasoning.', tip: 'Link each property to the requirement it meets.' },
  { id: 'alternatives', t: 'Alternative concepts', d: 'Present at least two or three feasible solutions with sketches.', tip: 'Freehand pictorials or CAD renders help the reader.' },
  { id: 'evaluation', t: 'Evaluation & decision', d: 'Evaluate alternatives against weighted criteria (decision matrix); discuss trade-offs.', tip: 'Explain WHY the weights were chosen.' },
  { id: 'drawings', t: 'Technical drawings', d: 'Orthogonal, sectional, pictorial or assembly drawings to AS 1100 and/or CAD output.', tip: 'Include a title block, scale and projection symbol.' },
  { id: 'recommendations', t: 'Recommendations', d: 'State the preferred solution and what should be done next (testing, prototypes, further investigation).', tip: 'Be specific and justified.' },
  { id: 'conclusion', t: 'Conclusion', d: 'Brief summary of findings answering the problem stated in the introduction. No new information.', tip: 'Mirror the introduction.' },
  { id: 'refs', t: 'References & appendices', d: 'Consistent referencing of all sources; appendices for raw data, extra calculations, meeting records and Gantt charts.', tip: 'Avoid unreliable websites; prefer standards, manufacturers, universities and professional bodies.' },
];

interface Matrix {
  criteria: { name: string; w: number }[];
  options: { name: string; scores: number[] }[];
}

const DEFAULT_MATRIX: Matrix = {
  criteria: [
    { name: 'Strength-to-weight', w: 5 },
    { name: 'Corrosion resistance', w: 3 },
    { name: 'Cost', w: 4 },
    { name: 'Ease of manufacture', w: 3 },
    { name: 'Recyclability', w: 2 },
  ],
  options: [
    { name: 'Hi-tensile steel frame', scores: [3, 2, 5, 5, 5] },
    { name: '6061-T6 aluminium frame', scores: [4, 4, 4, 4, 4] },
    { name: 'CFRP monocoque frame', scores: [5, 5, 1, 2, 1] },
  ],
};

export default function Reports() {
  useHashScroll();
  const [open, setOpen] = useState<string>('intro');
  return (
    <div>
      <PageHeader title="Engineering Report Guide" kicker="Purpose, structure and HSC requirements" icon={<FileText className="text-emerald-600" />}>
        An Engineering Report communicates the analysis and justification behind an engineering decision. It is how engineers persuade clients, managers and regulators — clearly, accurately and with evidence.
      </PageHeader>
      <SectionNav items={[{ id: 'requirement', label: 'HSC requirement' }, { id: 'structure', label: 'Structure' }, { id: 'matrix', label: 'Decision matrix' }, { id: 'template', label: 'Materials template' }, { id: 'sample', label: 'Sample justification' }, { id: 'errors', label: 'Common errors' }, { id: 'collab', label: 'Collaboration' }]} />
      <div className="space-y-8">
        <section id="requirement" className="scroll-mt-28">
          <Callout kind="exam" title="HSC course requirement">
            In the HSC course, students are required to complete <strong>one Engineering Report from either of the application modules</strong> (Civil Structures or Personal and Public Transport) <strong>and one from either of the focus modules</strong> (Aeronautical Engineering or Telecommunications Engineering). Reports may be completed individually or as part of a team. Engineering Reports also form part of school-based assessment — NESA’s assessment requirements specify that a task including an Engineering Report contributes to the HSC school-based mark (check your school’s assessment schedule for the exact weighting).{' '}
            <a className="underline" href="https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011/assessment-and-reporting" target="_blank" rel="noreferrer">NESA assessment and reporting</a>.
          </Callout>
          <p className="mt-2 text-xs text-ink-500">The Preliminary course has its own, different Engineering Report requirements; they are not covered here.</p>
        </section>
        <section id="structure" className="scroll-mt-28">
          <SectionTitle sub="Click a section to see what it needs">Report structure</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
            <ol className="space-y-1">
              {STRUCTURE.map((s, i) => (
                <li key={s.id}>
                  <button onClick={() => setOpen(s.id)} className={cx('flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition', open === s.id ? 'border-emerald-400 bg-emerald-50 font-semibold dark:border-emerald-700 dark:bg-emerald-950/40' : 'border-ink-200 bg-white hover:bg-ink-50 dark:border-ink-800 dark:bg-ink-900 dark:hover:bg-ink-800')} style={{ marginLeft: i > 0 && i < STRUCTURE.length - 1 ? 12 : 0 }}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">{i + 1}</span>
                    {s.t}
                  </button>
                </li>
              ))}
            </ol>
            {(() => {
              const s = STRUCTURE.find((x) => x.id === open)!;
              return (
                <Card title={s.t} className="self-start">
                  <p className="prose-eng">{s.d}</p>
                  <Callout kind="tip" className="mt-3">{s.tip}</Callout>
                </Card>
              );
            })()}
          </div>
        </section>
        <section id="matrix" className="scroll-mt-28">
          <SectionTitle sub="Editable — your matrix is saved in this browser">Engineering decision matrix</SectionTitle>
          <DecisionMatrix />
        </section>
        <section id="template" className="scroll-mt-28">
          <SectionTitle>Materials comparison template</SectionTitle>
          <Card>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Requirement</th><th>Property & unit</th><th>Material A</th><th>Material B</th><th>Material C</th><th>Source</th></tr></thead>
                <tbody>
                  {[['Carry the load safely', 'Yield strength (MPa)'], ['Light weight', 'Density (kg/m³) / specific strength'], ['Stiffness (limit deflection)', 'Young’s modulus (GPa)'], ['Durability outdoors', 'Corrosion resistance (qualitative)'], ['Manufacturability', 'Suitable processes'], ['Cost & sustainability', '$/kg, recyclability, embodied energy']].map((r) => (
                    <tr key={r[0]}><td className="font-semibold">{r[0]}</td><td>{r[1]}</td><td className="text-ink-300">…</td><td className="text-ink-300">…</td><td className="text-ink-300">…</td><td className="text-ink-300">…</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-ink-500">State the grade and condition of each material (e.g. “6061-T6”) because properties change with heat treatment. Cite data sources.</p>
          </Card>
        </section>
        <section id="sample" className="scroll-mt-28">
          <SectionTitle>Sample paragraph: engineering justification</SectionTitle>
          <Card>
            <blockquote className="border-l-4 border-emerald-500 pl-4 text-[15px] leading-relaxed text-ink-800 dark:text-ink-200">
              “6061-T6 aluminium alloy is recommended for the bicycle frame. Its specific strength (≈ 115 kN·m/kg) is higher than that of high-tensile steel tubing, so the frame can be about 35% lighter while the calculated maximum bending stress of 96 MPa still gives a factor of safety of 2.9 against the 276 MPa proof stress. The protective oxide film resists corrosion without painting, and 6xxx alloys are readily extruded and TIG-welded, although the heat-affected zones must be re-aged to restore strength. Carbon-fibre composite would be lighter again, but its cost, impact-damage risk and poor recyclability outweigh this advantage for a commuter bicycle.”
            </blockquote>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Clear recommendation', 'Quantified evidence with units', 'Links property → requirement', 'Considers processing', 'Acknowledges trade-offs', 'Rejects alternatives with reasons'].map((t) => <Badge key={t} tone="emerald">{t}</Badge>)}
            </div>
            <p className="mt-2 text-xs text-ink-500">Illustrative numbers: the stress value is an example result from a design calculation; the proof stress is a typical minimum for 6061-T6.</p>
          </Card>
        </section>
        <section id="errors" className="scroll-mt-28">
          <SectionTitle>Common report-writing errors</SectionTitle>
          <Grid cols={2}>
            <Card title="Content">
              <KeyPoints items={['Describing materials without linking properties to the requirement.', 'Calculations without units, substitutions or a conclusion.', 'No alternatives considered, or a decision matrix with unexplained weights.', 'History and society sections that are generic and not related to the product.', 'Recommendations that do not follow from the evidence.']} />
            </Card>
            <Card title="Communication">
              <KeyPoints items={['Drawings without title blocks, scale, projection symbol or correct line types.', 'Unlabelled graphs and figures; figures not referred to in the text.', 'Copied text and missing references; reliance on unreliable websites.', 'Informal language and first-person narrative (“I think…”).', 'Inconsistent numbering, headings and significant figures.']} />
            </Card>
          </Grid>
        </section>
        <section id="collab" className="scroll-mt-28">
          <SectionTitle>Collaborative work practices</SectionTitle>
          <Grid cols={3}>
            <Card title="Plan"><KeyPoints items={['Define the problem and deliverables together.', 'Allocate roles by strengths (research, calculations, CAD, editing).', 'Build a Gantt chart with milestones.']} /></Card>
            <Card title="Work"><KeyPoints items={['Shared, version-controlled files and a consistent template.', 'Short regular meetings with minutes and action items.', 'Peer-check each other’s calculations and drawings.']} /></Card>
            <Card title="Reflect"><KeyPoints items={['Keep a log of individual contributions.', 'Resolve conflicts with evidence and agreed criteria.', 'Evaluate the team process at the end.']} /></Card>
          </Grid>
        </section>
      </div>
    </div>
  );
}

function DecisionMatrix() {
  const [m, setM] = useStored<Matrix>('decision-matrix', DEFAULT_MATRIX);
  const totals = m.options.map((o) => o.scores.reduce((s, sc, i) => s + sc * (m.criteria[i]?.w ?? 0), 0));
  const maxPossible = m.criteria.reduce((s, c) => s + c.w * 5, 0);
  const best = totals.indexOf(Math.max(...totals));
  const clamp = (v: number) => Math.max(0, Math.min(5, Math.round(v)));
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Criterion</th>
              <th className="w-20">Weight (0–5)</th>
              {m.options.map((o, j) => (
                <th key={j}>
                  <div className="flex items-center gap-1">
                    <input className="input py-1 text-xs normal-case" value={o.name} onChange={(e) => setM({ ...m, options: m.options.map((x, k) => (k === j ? { ...x, name: e.target.value } : x)) })} aria-label={`Option ${j + 1} name`} />
                    <button className="btn btn-ghost px-1" onClick={() => setM({ ...m, options: m.options.filter((_, k) => k !== j) })} disabled={m.options.length <= 2} aria-label="Remove option"><Trash2 size={13} /></button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.criteria.map((c, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-1">
                    <input className="input py-1 text-sm" value={c.name} onChange={(e) => setM({ ...m, criteria: m.criteria.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} aria-label={`Criterion ${i + 1}`} />
                    <button className="btn btn-ghost px-1" onClick={() => setM({ criteria: m.criteria.filter((_, k) => k !== i), options: m.options.map((o) => ({ ...o, scores: o.scores.filter((_, k) => k !== i) })) })} disabled={m.criteria.length <= 1} aria-label="Remove criterion"><Trash2 size={13} /></button>
                  </div>
                </td>
                <td><input type="number" min={0} max={5} className="input py-1" value={c.w} onChange={(e) => setM({ ...m, criteria: m.criteria.map((x, k) => (k === i ? { ...x, w: clamp(Number(e.target.value)) } : x)) })} aria-label={`Weight for ${c.name}`} /></td>
                {m.options.map((o, j) => (
                  <td key={j}>
                    <input type="number" min={0} max={5} className="input py-1" value={o.scores[i] ?? 0} onChange={(e) => setM({ ...m, options: m.options.map((x, k) => (k === j ? { ...x, scores: x.scores.map((s, q) => (q === i ? clamp(Number(e.target.value)) : s)) } : x)) })} aria-label={`Score for ${o.name} on ${c.name}`} />
                    <div className="mt-0.5 text-right text-[10px] text-ink-400">× {c.w} = {(o.scores[i] ?? 0) * c.w}</div>
                  </td>
                ))}
              </tr>
            ))}
            <tr className="font-semibold">
              <td>Weighted total</td>
              <td className="text-xs text-ink-500">max {maxPossible}</td>
              {totals.map((t, j) => (
                <td key={j} className={cx(j === best && 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200')}>
                  {t} {j === best && <Badge tone="emerald">preferred</Badge>}
                  <div className="mt-1 h-2 rounded bg-ink-100 dark:bg-ink-800"><div className="h-2 rounded bg-emerald-500" style={{ width: `${(t / Math.max(1, maxPossible)) * 100}%` }} /></div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn text-xs" disabled={m.criteria.length >= 10} onClick={() => setM({ criteria: [...m.criteria, { name: 'New criterion', w: 3 }], options: m.options.map((o) => ({ ...o, scores: [...o.scores, 3] })) })}><Plus size={13} /> Criterion</button>
        <button className="btn text-xs" disabled={m.options.length >= 5} onClick={() => setM({ ...m, options: [...m.options, { name: 'New option', scores: m.criteria.map(() => 3) }] })}><Plus size={13} /> Option</button>
        <button className="btn text-xs" onClick={() => setM(DEFAULT_MATRIX)}>Reset example</button>
      </div>
      <p className="mt-2 text-xs text-ink-500">Scores 0–5 (5 = best for that criterion; for cost, 5 = cheapest). Weighted total = Σ(weight × score). A matrix supports — but does not replace — engineering judgement: always explain the weights and check the sensitivity of the result.</p>
    </Card>
  );
}
