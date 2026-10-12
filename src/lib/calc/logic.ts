/** Digital logic: gates, circuit evaluation and truth tables. */
export type GateType = 'AND' | 'OR' | 'NAND' | 'NOR' | 'NOT' | 'XOR' | 'XNOR';

export const GATE_INFO: Record<GateType, { inputs: number; expr: string; desc: string; hsc: boolean }> = {
  AND: { inputs: 2, expr: 'Q = A · B', desc: 'Output is 1 only when ALL inputs are 1.', hsc: true },
  OR: { inputs: 2, expr: 'Q = A + B', desc: 'Output is 1 when ANY input is 1.', hsc: true },
  NAND: { inputs: 2, expr: 'Q = \\overline{A · B}', desc: 'NOT-AND: output is 0 only when ALL inputs are 1. A universal gate.', hsc: true },
  NOR: { inputs: 2, expr: 'Q = \\overline{A + B}', desc: 'NOT-OR: output is 1 only when ALL inputs are 0. A universal gate.', hsc: true },
  NOT: { inputs: 1, expr: 'Q = \\overline{A}', desc: 'Inverter: output is the opposite of the input.', hsc: true },
  XOR: { inputs: 2, expr: 'Q = A \\oplus B', desc: 'Exclusive-OR: output is 1 when the inputs differ. (Extension.)', hsc: false },
  XNOR: { inputs: 2, expr: 'Q = \\overline{A \\oplus B}', desc: 'Exclusive-NOR: output is 1 when the inputs are equal. (Extension.)', hsc: false },
};

export function gate(type: GateType, a: boolean, b = false): boolean {
  switch (type) {
    case 'AND':
      return a && b;
    case 'OR':
      return a || b;
    case 'NAND':
      return !(a && b);
    case 'NOR':
      return !(a || b);
    case 'NOT':
      return !a;
    case 'XOR':
      return a !== b;
    case 'XNOR':
      return a === b;
  }
}

/** A gate node in a combinational circuit. Inputs reference circuit inputs ("A", "B", "C") or other gate ids. */
export interface GateNode {
  id: string;
  type: GateType;
  in: string[];
}
export interface Circuit {
  inputs: string[];
  gates: GateNode[];
  output: string;
}

/** Evaluate a combinational circuit. Throws on missing references or feedback loops. */
export function evaluate(c: Circuit, values: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = { ...values };
  const byId = new Map(c.gates.map((g) => [g.id, g]));
  const visiting = new Set<string>();
  const val = (id: string): boolean => {
    if (id in out) return out[id];
    const g = byId.get(id);
    if (!g) throw new Error(`Unconnected input: ${id}`);
    if (visiting.has(id)) throw new Error('Feedback loop detected — only combinational circuits are supported.');
    visiting.add(id);
    const ins = g.in.map(val);
    visiting.delete(id);
    const r = gate(g.type, ins[0], ins[1]);
    out[id] = r;
    return r;
  };
  for (const g of c.gates) val(g.id);
  return out;
}

export function truthTable(c: Circuit): { inputs: boolean[]; output: boolean; nodes: Record<string, boolean> }[] {
  const n = c.inputs.length;
  const rows = [];
  for (let k = 0; k < 2 ** n; k++) {
    const vals: Record<string, boolean> = {};
    c.inputs.forEach((name, i) => (vals[name] = Boolean((k >> (n - 1 - i)) & 1)));
    const nodes = evaluate(c, vals);
    rows.push({ inputs: c.inputs.map((x) => vals[x]), output: nodes[c.output], nodes });
  }
  return rows;
}

/** Depth (layer) of each gate for drawing: inputs are layer 0. */
export function layers(c: Circuit): Record<string, number> {
  const d: Record<string, number> = {};
  c.inputs.forEach((i) => (d[i] = 0));
  const byId = new Map(c.gates.map((g) => [g.id, g]));
  const depth = (id: string, seen = new Set<string>()): number => {
    if (id in d) return d[id];
    const g = byId.get(id);
    if (!g || seen.has(id)) return 0;
    seen.add(id);
    const v = 1 + Math.max(0, ...g.in.map((x) => depth(x, seen)));
    d[id] = v;
    return v;
  };
  c.gates.forEach((g) => depth(g.id));
  return d;
}
