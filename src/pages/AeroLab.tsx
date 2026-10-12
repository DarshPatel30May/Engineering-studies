import { Wind } from 'lucide-react';
import { PageHeader, SectionTitle } from '@/components/ui';
import SectionNav from '@/components/SectionNav';
import { useHashScroll } from '@/hooks/useHashScroll';
import { FourForces, AirfoilViz, BernoulliVenturi, PropulsionExplorer, PitotAltimeter, AircraftStructure, AircraftHydraulics } from '@/components/aero/AeroVisuals';
import { ControlSurfacesLazy } from '@/components/module/AeroTabs';
import { FluidPressure } from '@/components/mechanics/Fluids';
import { MaterialChart } from '@/components/materials/MaterialChart';
import { Card } from '@/components/ui';

const S = [
  { id: 'forces', label: 'Four forces' },
  { id: 'airfoil', label: 'Aerofoil' },
  { id: 'bernoulli', label: 'Bernoulli & Venturi' },
  { id: 'controls', label: 'Control surfaces' },
  { id: 'propulsion', label: 'Propulsion' },
  { id: 'pitot', label: 'Pitot & altimeter' },
  { id: 'structure', label: 'Structures' },
  { id: 'materials', label: 'Materials' },
  { id: 'hydraulics', label: 'Hydraulics' },
];

export default function AeroLab() {
  useHashScroll();
  return (
    <div>
      <PageHeader title="Aeronautical Visualisation Laboratory" kicker="Module 3 interactive tools" accent="aero" icon={<Wind className="text-aero" />}>
        Explore flight forces, aerofoil flow, fluid principles, propulsion and airframe structures. Simplified models are labelled as conceptual — they illustrate principles and do not predict real aircraft performance.
      </PageHeader>
      <SectionNav items={S} />
      <div className="space-y-8">
        <section id="forces" className="scroll-mt-28"><SectionTitle>Four forces of flight</SectionTitle><FourForces /></section>
        <section id="airfoil" className="scroll-mt-28"><SectionTitle>Aerofoil visualisation</SectionTitle><AirfoilViz /></section>
        <section id="bernoulli" className="scroll-mt-28"><SectionTitle>Bernoulli principle and Venturi effect</SectionTitle><BernoulliVenturi /></section>
        <section id="controls" className="scroll-mt-28"><SectionTitle>Control surface explorer</SectionTitle><ControlSurfacesLazy /></section>
        <section id="propulsion" className="scroll-mt-28"><SectionTitle>Propulsion comparison</SectionTitle><PropulsionExplorer /></section>
        <section id="pitot" className="scroll-mt-28"><SectionTitle>Pitot tube and altimeter</SectionTitle><PitotAltimeter /></section>
        <section id="structure" className="scroll-mt-28"><SectionTitle>Aircraft structural components</SectionTitle><AircraftStructure /></section>
        <section id="materials" className="scroll-mt-28">
          <SectionTitle>Aircraft materials comparison</SectionTitle>
          <Card><MaterialChart ids={['al-cu-2024', 'al-7075', 'al-si-mg', 'titanium-64', 'cfrp', 'gfrp', 'aramid', 'glare', 'mild-steel']} defaultMetric="specStrength" /></Card>
        </section>
        <section id="hydraulics" className="scroll-mt-28 space-y-4"><SectionTitle>Hydraulic pressure calculator</SectionTitle><AircraftHydraulics /><FluidPressure initial="pascal" /></section>
      </div>
    </div>
  );
}
