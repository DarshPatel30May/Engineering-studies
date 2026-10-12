import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlow, Background, Controls, MarkerType, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network } from 'lucide-react';
import { MODULES, MODULE_MAP } from '@/data/modules';
import type { ModuleId } from '@/data/types';
import { usePrefs } from '@/lib/prefs';
import { PageHeader, Tabs, Badge } from '@/components/ui';
import { ACCENT_HEX } from '@/components/ui';

const GROUP_COL: Record<string, string> = { mech: '#0ea5e9', mat: '#f59e0b', elec: '#8b5cf6', hist: '#10b981', comm: '#64748b', root: '' };

export default function ConceptMaps() {
  const [id, setId] = useState<ModuleId>('civil');
  const { isDark } = usePrefs();
  const nav = useNavigate();
  const m = MODULE_MAP[id];
  const { nodes, edges } = useMemo(() => {
    const map = m.conceptMap;
    // Radial tree layout: BFS from the root (edges treated as undirected) gives each node a depth;
    // each subtree gets an angular sector proportional to its number of leaves.
    const root = map.nodes[0].id;
    const adj = new Map<string, string[]>(map.nodes.map((n) => [n.id, []]));
    for (const [a, b] of map.edges) {
      adj.get(a)?.push(b);
      adj.get(b)?.push(a);
    }
    const kids = new Map<string, string[]>();
    const depth: Record<string, number> = { [root]: 0 };
    const queue = [root];
    while (queue.length) {
      const u = queue.shift()!;
      kids.set(u, []);
      for (const v of adj.get(u) ?? []) {
        if (depth[v] === undefined) {
          depth[v] = depth[u] + 1;
          kids.get(u)!.push(v);
          queue.push(v);
        }
      }
    }
    const leaves = (u: string): number => {
      const k = kids.get(u) ?? [];
      return k.length ? k.reduce((s, v) => s + leaves(v), 0) : 1;
    };
    const pos: Record<string, { x: number; y: number }> = {};
    const place = (u: string, a0: number, a1: number) => {
      const r = (depth[u] ?? 0) * 210;
      const a = (a0 + a1) / 2;
      pos[u] = { x: Math.cos(a) * r * 1.25, y: Math.sin(a) * r };
      let start = a0;
      const total = leaves(u);
      for (const v of kids.get(u) ?? []) {
        const span = ((a1 - a0) * leaves(v)) / total;
        place(v, start, start + span);
        start += span;
      }
    };
    place(root, -Math.PI / 2, (3 * Math.PI) / 2);
    // Any node not connected to the root goes on a row underneath.
    map.nodes.filter((n) => !pos[n.id]).forEach((n, i) => (pos[n.id] = { x: -400 + i * 190, y: 900 }));
    const accent = ACCENT_HEX[id];
    const nodes: Node[] = map.nodes.map((n) => ({
      id: n.id,
      position: pos[n.id],
      data: { label: n.label },
      style: {
        borderRadius: 12,
        padding: 8,
        width: n.group === 'root' ? 190 : 160,
        fontSize: n.group === 'root' ? 16 : 13,
        fontWeight: n.group === 'root' ? 700 : 500,
        color: n.group === 'root' ? '#fff' : isDark ? '#e6ecee' : '#161b1e',
        background: n.group === 'root' ? accent : isDark ? '#161b1e' : '#fff',
        border: `2px solid ${n.group === 'root' ? accent : GROUP_COL[n.group ?? 'mech'] ?? '#94a3b8'}`,
        cursor: n.to ? 'pointer' : 'default',
      },
    }));
    const edges: Edge[] = map.edges.map(([a, b, label], i) => ({ id: `e${i}`, source: a, target: b, label, type: 'straight', style: { stroke: isDark ? '#64748b' : '#94a3b8' }, markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#64748b' : '#94a3b8' }, labelStyle: { fontSize: 10, fill: isDark ? '#9aa8ae' : '#4d5a60' }, labelBgStyle: { fill: isDark ? '#0d1113' : '#f6f8f8' } }));
    return { nodes, edges };
  }, [m, id, isDark]);
  return (
    <div>
      <PageHeader title="Engineering Concept Maps" kicker="See how the ideas connect" icon={<Network className="text-emerald-600" />}>
        Each map links the module’s mechanics, materials, history and communication ideas. Click a node with a coloured border to open its study page. Drag to pan; scroll to zoom.
      </PageHeader>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Tabs value={id} onChange={setId} tabs={MODULES.map((x) => ({ id: x.id, label: x.name }))} />
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Badge tone="blue">Mechanics / electronics</Badge>
          <Badge tone="amber">Materials</Badge>
          <Badge tone="emerald">History & society</Badge>
        </div>
      </div>
      <div className="h-[70vh] min-h-[480px] overflow-hidden rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
        <ReactFlow key={id} nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.08 }} nodesConnectable={false} className="concept-map" onNodeClick={(_, n) => { const to = m.conceptMap.nodes.find((x) => x.id === n.id)?.to; if (to) nav(to); }} colorMode={isDark ? 'dark' : 'light'}>
          <Background gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
