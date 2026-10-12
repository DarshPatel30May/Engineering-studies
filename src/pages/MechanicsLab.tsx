import { Wrench } from 'lucide-react';
import { PageHeader, SectionTitle, Callout, Badge } from '@/components/ui';
import SectionNav from '@/components/SectionNav';
import { useHashScroll } from '@/hooks/useHashScroll';
import BeamCalculator from '@/components/mechanics/BeamCalculator';
import TrussSolver from '@/components/mechanics/TrussSolver';
import { ForceResolution, EquilibriumSolver } from '@/components/mechanics/Forces';
import { StressCalculator, StressStrainExplorer, FoSCalculator } from '@/components/mechanics/StressStrain';
import { MachineSim, FrictionSim } from '@/components/mechanics/TransportSims';
import { FluidPressure } from '@/components/mechanics/Fluids';

const SECTIONS = [
  { id: 'resolution', label: 'A · Force resolution' },
  { id: 'equilibrium', label: 'B · Equilibrium' },
  { id: 'beam', label: 'C · Beam calculator' },
  { id: 'truss', label: 'D · Truss analysis' },
  { id: 'stress', label: 'E · Stress & strain' },
  { id: 'machines', label: 'F · Mechanical efficiency' },
  { id: 'friction', label: 'G · Friction' },
  { id: 'fluids', label: 'H · Fluid pressure' },
];

export default function MechanicsLab() {
  useHashScroll();
  return (
    <div>
      <PageHeader title="Mechanics Laboratory" kicker="Interactive problem-solving workspace" icon={<Wrench className="text-emerald-600" />}>
        Every solver here uses the same tested numerical routines: full precision is kept until the final display, invalid inputs are rejected with a reason, and sign conventions and assumptions are stated beside each tool.
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="emerald">Numerical solver</Badge>
        <span className="text-xs text-ink-500">computes exact answers from your inputs</span>
        <Badge tone="amber">Conceptual demonstration</Badge>
        <span className="text-xs text-ink-500">illustrates behaviour; not design data</span>
      </div>
      <SectionNav items={SECTIONS} />

      <section id="resolution" className="scroll-mt-28">
        <SectionTitle sub="Any force can be replaced by perpendicular components.">A · Force resolution <Badge tone="emerald">Numerical</Badge></SectionTitle>
        <ForceResolution />
      </section>
      <section id="equilibrium" className="scroll-mt-28">
        <SectionTitle sub="Static equilibrium: ΣFx = 0, ΣFy = 0 (and ΣM = 0 for non-concurrent forces).">B · Equilibrium solver <Badge tone="emerald">Numerical</Badge></SectionTitle>
        <EquilibriumSolver />
      </section>
      <section id="beam" className="scroll-mt-28">
        <SectionTitle sub="Supports, loads, reactions, FBD, equilibrium equations, SFD, BMD and final answers.">C · Beam calculator <Badge tone="emerald">Numerical</Badge></SectionTitle>
        <BeamCalculator />
      </section>
      <section id="truss" className="scroll-mt-28">
        <SectionTitle sub="Joint-by-joint working with tension-positive sign convention; method of sections verified against joints.">D · Truss analysis <Badge tone="emerald">Numerical</Badge></SectionTitle>
        <TrussSolver />
      </section>
      <section id="stress" className="scroll-mt-28 space-y-4">
        <SectionTitle sub="Tensile, compressive and shear stress; strain; stress–strain behaviour; factor of safety.">E · Stress and strain <Badge tone="emerald">Numerical</Badge> <Badge tone="amber">Curves: conceptual</Badge></SectionTitle>
        <StressCalculator />
        <StressStrainExplorer />
        <FoSCalculator />
      </section>
      <section id="machines" className="scroll-mt-28">
        <SectionTitle sub="Mechanical advantage, velocity ratio and efficiency.">F · Mechanical efficiency <Badge tone="emerald">Numerical</Badge></SectionTitle>
        <MachineSim />
      </section>
      <section id="friction" className="scroll-mt-28">
        <SectionTitle sub="Normal force, coefficient of friction, limiting friction and the angle of repose.">G · Friction simulator <Badge tone="emerald">Numerical</Badge></SectionTitle>
        <FrictionSim />
      </section>
      <section id="fluids" className="scroll-mt-28">
        <SectionTitle sub="Valid hydrostatic and dynamic pressure relationships, and Pascal’s principle.">H · Fluid pressure <Badge tone="emerald">Numerical</Badge></SectionTitle>
        <FluidPressure />
      </section>
      <Callout kind="info" className="mt-8">
        Limits: the beam solver handles statically determinate beams (pin + roller) with point loads; the truss solver handles statically determinate pin-jointed plane trusses. Indeterminate or unstable structures are detected and explained rather than solved incorrectly.
      </Callout>
    </div>
  );
}
