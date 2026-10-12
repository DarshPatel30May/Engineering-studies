import { MODULES } from '@/data/modules';
import { FORMULAS } from '@/data/formulas';
import { MATERIALS, COMPARISONS } from '@/data/materials';
import { PROCESSES } from '@/data/processes';
import { NAV } from '@/nav';

export interface SearchEntry {
  title: string;
  text: string;
  type: string;
  to: string;
  accent?: string;
}

let INDEX: SearchEntry[] | null = null;

export function buildIndex(): SearchEntry[] {
  if (INDEX) return INDEX;
  const e: SearchEntry[] = [];
  for (const g of NAV) for (const it of g.items) e.push({ title: it.label, text: g.heading, type: 'Page', to: it.to, accent: it.accent });
  for (const m of MODULES) {
    e.push({ title: m.name, text: m.summary.join(' '), type: m.type, to: `/module/${m.id}`, accent: m.id });
    for (const c of m.concepts)
      e.push({ title: c.term, text: `${c.def} ${c.beginner} ${c.advanced ?? ''}`, type: `${m.short} concept`, to: `/module/${m.id}/concepts#${c.id}`, accent: m.id });
    for (const g of m.syllabus)
      for (const d of [...g.learnAbout, ...g.learnTo])
        e.push({ title: d.text, text: `${g.heading} ${(d.sub ?? []).join(' ')}`, type: `${m.short} syllabus`, to: d.link ?? `/module/${m.id}/syllabus`, accent: m.id });
    for (const t of m.timeline) e.push({ title: `${t.title} (${t.year})`, text: t.text, type: `${m.short} history`, to: `/module/${m.id}/history`, accent: m.id });
    for (const x of m.revision.misconceptions) e.push({ title: x.wrong, text: x.right, type: `${m.short} misconception`, to: `/module/${m.id}/revision`, accent: m.id });
  }
  for (const f of FORMULAS) e.push({ title: f.name, text: `${f.meaning} ${f.vars.map((v) => v.name).join(' ')}`, type: 'Formula', to: `/formulas?f=${f.id}` });
  for (const m of MATERIALS) e.push({ title: m.name, text: `${m.category} ${m.structure} ${m.apps.join(' ')}`, type: 'Material', to: `/materials?m=${m.id}` });
  for (const c of COMPARISONS) e.push({ title: c.title, text: c.verdict, type: 'Comparison', to: `/materials?c=${c.id}` });
  for (const p of PROCESSES) e.push({ title: p.name, text: `${p.family} ${p.effect} ${p.apps.join(' ')}`, type: 'Process', to: `/manufacturing?p=${p.id}` });
  INDEX = e;
  return e;
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '');

export function search(q: string, limit = 30): SearchEntry[] {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored: { e: SearchEntry; s: number }[] = [];
  for (const e of buildIndex()) {
    const title = norm(e.title);
    const text = norm(e.text);
    let s = 0;
    let all = true;
    for (const t of terms) {
      if (title.startsWith(t)) s += 12;
      else if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(title)) s += 8;
      else if (title.includes(t)) s += 5;
      else if (text.includes(t)) s += 1.5;
      else all = false;
    }
    if (!all) continue;
    if (e.type === 'Page' || e.type.endsWith('module')) s += 2;
    scored.push({ e, s });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.e);
}
