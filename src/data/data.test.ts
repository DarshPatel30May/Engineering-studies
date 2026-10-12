import { describe, it, expect } from 'vitest';
import { TEMPLATES } from './problems';
import { FORMULAS } from './formulas';
import { QUESTIONS } from './questions';
import { MATERIALS } from './materials';
import { MODULES } from './modules';
import { approxEqual } from '@/lib/calc/format';

describe('problem templates', () => {
  it('beam seed 0 reproduces the 6 m / 18 kN / 2 m worked example', () => {
    const p = TEMPLATES.find((t) => t.id === 'beam')!.generate(0);
    const nums = p.steps.filter((s) => s.kind === 'number').map((s) => (s as { answer: number }).answer);
    expect(nums).toContain(6); // R_B
    expect(nums).toContain(12); // R_A
  });
  it('every template generates valid, finite answers whose traps differ from the answer', () => {
    for (const t of TEMPLATES) {
      for (let seed = 0; seed < 60; seed++) {
        const p = t.generate(seed);
        expect(p.steps.length).toBeGreaterThan(0);
        for (const s of p.steps) {
          if (s.kind === 'number') {
            expect(Number.isFinite(s.answer)).toBe(true);
            for (const tr of s.traps ?? []) expect(approxEqual(tr.value, s.answer, 0.011), `${t.id} seed ${seed}: ${s.prompt}`).toBe(false);
          } else {
            expect(s.answer).toBeGreaterThanOrEqual(0);
            expect(s.answer).toBeLessThan(s.options.length);
          }
        }
      }
    }
  });
});

describe('formula calculators', () => {
  it('each solver round-trips with the others', () => {
    for (const f of FORMULAS) {
      for (const [target, solver] of Object.entries(f.solve)) {
        const vals: Record<string, number> = {};
        solver.needs.forEach((k, i) => (vals[k] = 2 - i * 0.27));
        if (solver.check?.(vals)) continue;
        vals[target] = solver.fn(vals);
        expect(Number.isFinite(vals[target]), `${f.id}.${target}`).toBe(true);
        const known = new Set([...solver.needs, target]);
        for (const [t2, s2] of Object.entries(f.solve)) {
          if (t2 === target || !solver.needs.includes(t2) || !s2.needs.every((n) => known.has(n))) continue;
          expect(approxEqual(s2.fn(vals), vals[t2], 1e-9), `${f.id}: ${target} → ${t2}`).toBe(true);
        }
      }
    }
  });
  it('formula ids referenced by modules exist', () => {
    const ids = new Set(FORMULAS.map((f) => f.id));
    for (const m of MODULES) for (const id of m.revision.formulas) expect(ids.has(id), id).toBe(true);
  });
});

describe('content integrity', () => {
  it('questions are well formed and unique', () => {
    const ids = new Set<string>();
    for (const q of QUESTIONS) {
      expect(ids.has(q.id), q.id).toBe(false);
      ids.add(q.id);
      if (q.kind === 'mcq') {
        expect(q.answer).toBeLessThan(q.options.length);
        expect(q.options.every((o) => o.why.length > 5)).toBe(true);
      }
      if (q.kind === 'calc') for (const p of q.parts) expect(Number.isFinite(p.answer)).toBe(true);
    }
    for (const m of ['civil', 'transport', 'aero', 'telecom'])
      expect(QUESTIONS.filter((q) => q.module === m && q.kind === 'mcq').length).toBeGreaterThanOrEqual(12);
  });
  it('every material has all required fields', () => {
    for (const m of MATERIALS) {
      expect(m.structure && m.why && m.degradation, m.id).toBeTruthy();
      for (const k of ['props', 'strengths', 'limits', 'apps', 'processes', 'testing', 'modules'] as const) expect(m[k].length, `${m.id}.${k}`).toBeGreaterThan(0);
    }
  });
  it('syllabus dot point ids are unique', () => {
    const ids = new Set<string>();
    for (const m of MODULES) for (const g of m.syllabus) for (const d of [...g.learnAbout, ...g.learnTo]) {
      expect(ids.has(d.id), d.id).toBe(false);
      ids.add(d.id);
    }
  });
});
