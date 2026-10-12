import { useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, type Edge, type Node, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { usePrefs } from '@/lib/prefs';
import { Card, Tabs } from '../ui';

const INFO: Record<string, string> = {
  phoneA: 'Smartphone: converts voice to a digital signal (microphone → ADC → speech codec), then modulates it onto a radio carrier.',
  tower: 'Base station (cell tower): radio link to phones in its cell; handover to neighbouring cells as users move.',
  backhaul: 'Backhaul: optical fibre (or point-to-point microwave in remote areas) carries traffic from towers to the core network.',
  core: 'Mobile core network: authenticates users, routes calls and data, manages mobility and billing.',
  internet: 'Internet / IP backbone: high-capacity fibre networks, including undersea cables linking Australia to the world.',
  exchange: 'Exchange / NBN point of interconnect: connects fixed-line services to the network.',
  access: 'Access network: fibre to the premises, or fibre to a node then copper twisted pair, or HFC coaxial cable.',
  phoneB: 'Fixed phone or home router: demodulates and decodes the signal back to sound or data.',
  sat: 'Satellite link: used where there is no terrestrial coverage — remote communities, ships and aircraft.',
  dish: 'Satellite dish / terminal at a remote home or station.',
};

export default function NetworkFlow() {
  const { isDark } = usePrefs();
  const [route, setRoute] = useState<'mobile' | 'satellite'>('mobile');
  const [sel, setSel] = useState<string>('tower');
  const nodes: Node[] = useMemo(() => {
    const n = (id: string, label: string, x: number, y: number): Node => ({
      id,
      position: { x, y },
      data: { label },
      style: {
        borderRadius: 10,
        border: `1.5px solid ${sel === id ? '#7c3aed' : isDark ? '#3c464b' : '#d6dcde'}`,
        background: sel === id ? (isDark ? '#2e1065' : '#f5f3ff') : isDark ? '#161b1e' : '#fff',
        color: isDark ? '#e6ecee' : '#161b1e',
        fontSize: 12,
        width: 150,
        padding: 8,
      },
    });
    return [
      n('phoneA', '📱 Mobile phone', 0, 120),
      n('tower', '📡 Base station', 200, 120),
      n('backhaul', '〰 Fibre / microwave backhaul', 400, 40),
      n('core', '🖧 Mobile core network', 620, 120),
      n('internet', '🌐 Internet & IP backbone', 840, 40),
      n('exchange', '🏢 Exchange / NBN POI', 840, 200),
      n('access', '🔌 FTTP / FTTN / HFC access', 1040, 200),
      n('phoneB', '☎ Home phone / router', 1240, 200),
      n('sat', '🛰 Satellite (GEO or LEO)', 400, 280),
      n('dish', '📶 Remote satellite dish', 200, 300),
    ];
  }, [sel, isDark]);
  const edges: Edge[] = useMemo(() => {
    const active = route === 'mobile' ? ['phoneA-tower', 'tower-backhaul', 'backhaul-core', 'core-internet', 'core-exchange', 'exchange-access', 'access-phoneB'] : ['dish-sat', 'sat-core', 'core-exchange', 'exchange-access', 'access-phoneB', 'core-internet'];
    const e = (a: string, b: string, label?: string): Edge => {
      const id = `${a}-${b}`;
      const on = active.includes(id);
      return { id, source: a, target: b, label, animated: on, style: { stroke: on ? '#7c3aed' : '#94a3b8', strokeWidth: on ? 2.5 : 1.2, opacity: on ? 1 : 0.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: on ? '#7c3aed' : '#94a3b8' }, labelStyle: { fontSize: 10, fill: isDark ? '#9aa8ae' : '#4d5a60' }, labelBgStyle: { fill: isDark ? '#0d1113' : '#fff' } };
    };
    return [
      e('phoneA', 'tower', 'radio (4G/5G)'),
      e('tower', 'backhaul'),
      e('backhaul', 'core'),
      e('core', 'internet', 'IP packets'),
      e('core', 'exchange'),
      e('exchange', 'access'),
      e('access', 'phoneB'),
      e('dish', 'sat', 'microwave uplink'),
      e('sat', 'core', 'downlink to gateway'),
    ];
  }, [route, isDark]);
  return (
    <Card title="Telecommunications network flow" subtitle="Click any element to learn its role. Animated links show the active path.">
      <Tabs value={route} onChange={setRoute} className="mb-3" tabs={[{ id: 'mobile', label: 'Mobile call to a home phone' }, { id: 'satellite', label: 'Remote satellite user' }]} />
      <div className="h-[380px] overflow-hidden rounded-lg border border-ink-200 dark:border-ink-800">
        <ReactFlow nodes={nodes} edges={edges} fitView onNodeClick={(_, n) => setSel(n.id)} nodesDraggable={false} nodesConnectable={false} proOptions={{ hideAttribution: true }} colorMode={isDark ? 'dark' : 'light'}>
          <Background gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/60 p-3 text-sm dark:border-violet-900 dark:bg-violet-950/30">{INFO[sel]}</div>
    </Card>
  );
}
