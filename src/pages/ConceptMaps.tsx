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
    // Layout: root in the centre, first-level children on an inner ring, others placed beyond their parent.
    const children = new Map<string, string[]>();
    for (const [a, b] of map.edges) {
      if (!children.has(a)) children.set(a, []);
      children.get(a)!.push(b);
    }
    const pos: Record<string, { x: number; y: number }> = { [map.nodes[0].id]: { x: 0, y: 0 } };
    const first = children.get(map.nodes[0].id) ?? [];
    first.forEach((c, i) => {
      const a = (i / first.length) * Math.PI * 2 - Math.PI / 2;
      pos[c] = { x: Math.cos(a) * 300, y: Math.sin(a) * 220 };
    });
    let ring = 1;
    let pending = map.nodes.filter((n) => !pos[n.id]).map((n) => n.id);
    let guard = 0;
    while (pending.length && guard++ < 10) {
      ring++;
      for (const nid of pending) {
        const parent = map.edges.find(([a, b]) => b === nid && pos[a])?.[0];
        if (!parent) continue;
        const siblings = (children.get(parent) ?? []).filter((x) => !first.includes(x) || parent !== map.nodes[0].id);
        const k = siblings.indexOf(nid);
        const p = pos[parent];
        const ang = Math.atan2(p.y, p.x) + (k - (siblings.length - 1) / 2) * 0.5;
        pos[nid] = { x: p.x + Math.cos(ang) * 240, y: p.y + Math.sin(ang) * 170 };
      }
      pending = pending.filter((x) => !pos[x]);
    }
    pending.forEach((nid, i) => (pos[nid] = { x: -500 + i * 180, y: 420 }));
    const accent = ACCENT_HEX[id];
    const nodes: Node[] = map.nodes.map((n) => ({
      id: n.id,
      position: pos[n.id],
      data: { label: n.label },
      style: {
        borderRadius: 12,
        padding: 8,
        width: n.group === 'root' ? 190 : 160,
        fontSize: n.group === 'root' ? 14 : 12,
        fontWeight: n.group === 'root' ? 700 : 500,
        color: n.group === 'root' ? '#fff' : isDark ? '#e6ecee' : '#161b1e',
        background: n.group === 'root' ? accent : isDark ? '#161b1e' : '#fff',
        border: `2px solid ${n.group === 'root' ? accent : GROUP_COL[n.group ?? 'mech'] ?? '#94a3b8'}`,
        cursor: n.to ? 'pointer' : 'default',
      },
    }));
    const edges: Edge[] = map.edges.map(([a, b, label], i) => ({ id: `e${i}`, source: a, target: b, label, style: { stroke: isDark ? '#64748b' : '#94a3b8' }, markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#64748b' : '#94a3b8' }, labelStyle: { fontSize: 10, fill: isDark ? '#9aa8ae' : '#4d5a60' }, labelBgStyle: { fill: isDark ? '#0d1113' : '#f6f8f8' } }));
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
        <ReactFlow key={id} nodes={nodes} edges={edges} fitView nodesConnectable={false} onNodeClick={(_, n) => { const to = m.conceptMap.nodes.find((x) => x.id === n.id)?.to; if (to) nav(to); }} proOptions={{ hideAttribution: true }} colorMode={isDark ? 'dark' : 'light'}>
          <Background gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
