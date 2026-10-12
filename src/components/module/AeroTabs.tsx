import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { FourForces, AirfoilViz, BernoulliVenturi, PropulsionExplorer, PitotAltimeter, AircraftStructure, AircraftHydraulics } from '../aero/AeroVisuals';
import { NDTExplorer, AgeHardening, AeroCorrosion, CompositeLayup, AlAlloyTable } from '../aero/AeroMaterials';
import { FluidPressure } from '../mechanics/Fluids';
import { MaterialChart } from '../materials/MaterialChart';
import { MaterialMini } from '../materials/MaterialCard';
import { Card, Callout, KeyPoints, Grid, M } from '../ui';
import { Sec, ReportReminder, ScopeTab } from './Common';

const ControlSurfaces3D = lazy(() => import('../aero/ControlSurfaces3D'));

export const aeroFeatures = [
  { label: 'Four forces of flight', to: '/aero-lab#forces' },
  { label: 'Aerofoil & angle of attack', to: '/aero-lab#airfoil' },
  { label: 'Bernoulli demonstration', to: '/aero-lab#bernoulli' },
  { label: 'Venturi effect', to: '/aero-lab#bernoulli' },
  { label: 'Control surface explorer (3D)', to: '/aero-lab#controls' },
  { label: 'Propulsion comparison', to: '/aero-lab#propulsion' },
  { label: 'Pitot tube & altimeter', to: '/aero-lab#pitot' },
  { label: 'Structural components viewer', to: '/aero-lab#structure' },
  { label: 'Aircraft materials comparison', to: '/module/aero/materials#compare' },
  { label: 'Hydraulic pressure calculator', to: '/aero-lab#hydraulics' },
];

export function ControlSurfacesLazy() {
  return (
    <Suspense fallback={<Card title="Aircraft control surfaces"><div className="h-[360px] animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800" /></Card>}>
      <ControlSurfaces3D />
    </Suspense>
  );
}

export const AERO_SCOPE = [
  { title: 'Nature and range of work', points: ['Design of airframes, systems, engines and avionics integration.', 'Testing: wind tunnels, structural fatigue rigs, ground and flight tests.', 'Manufacturing engineering and quality assurance.', 'Maintenance engineering: inspection programs, repairs, modifications and reliability analysis.', 'Certification and airworthiness — demonstrating compliance with regulations.'] },
  { title: 'Current projects and innovations', points: ['Composite airframes and automated fibre placement.', 'Sustainable aviation fuels, hybrid-electric and hydrogen propulsion research.', 'Uncrewed aerial systems (drones) for agriculture, mapping and defence.', 'Additive manufacturing (3D-printed titanium parts).', 'Hypersonic research (scramjets) and Australia’s growing space industry.'] },
  { title: 'Health and safety', points: ['Work Health and Safety (WHS) duties: hazardous chemicals (sealants, solvents, fuels), composite dust, noise, working at height, confined fuel tanks.', 'Radiation safety for radiographic NDT.', 'Human-factors programs to reduce maintenance error.', 'A safety culture that encourages reporting of incidents and errors.'] },
  { title: 'Training and careers', points: ['Bachelor of Engineering (Aerospace/Aeronautical) — typically four years, accredited by Engineers Australia.', 'Licensed Aircraft Maintenance Engineers (LAMEs) qualify through trade training and CASA licensing.', 'Continuing professional development; chartered status (CPEng).', 'Employers: airlines, defence (RAAF, defence industry), manufacturers and MRO organisations, regulators, research and space companies.'] },
  { title: 'Ethics and legal responsibilities', points: ['Public safety is paramount (Engineers Australia Code of Ethics: integrity, competence, leadership, sustainability).', 'CASA regulates civil aviation safety and airworthiness in Australia; engineers certify work and keep legal records.', 'The ATSB investigates accidents to improve safety (not to assign blame).', 'Engineers must resist commercial or schedule pressure that compromises safety, and report defects.'] },
  { title: 'Engineers as managers & the community', points: ['Manage projects, budgets, schedules, risk and multidisciplinary teams.', 'Balance cost, performance, safety and environmental impact.', 'Community relations: aircraft noise and curfews, emissions, airport development, regional connectivity.'] },
];

export function AeroScope() {
  return (
    <div className="space-y-4">
      <ScopeTab items={AERO_SCOPE} />
      <Callout kind="exam">Scope-of-profession questions often ask you to “describe” or “evaluate” a responsibility. Use a specific example (e.g. maintenance sign-off, an ATSB investigation, a composite manufacturing hazard) and explain its consequence.</Callout>
    </div>
  );
}

export function AeroMechanics() {
  return (
    <div className="space-y-8">
      <Sec id="forces" title="Fundamental flight mechanics" sub="Lift, weight, thrust, drag; lift/drag ratio; angle of attack; stability and control.">
        <FourForces />
        <AirfoilViz />
        <ControlSurfacesLazy />
        <Grid cols={2}>
          <Card title="Stability">
            <KeyPoints items={['Longitudinal (pitch) stability: the tailplane and a centre of gravity ahead of the aerodynamic centre return the nose to its trimmed attitude.', 'Lateral (roll) stability: wing dihedral — a dropped wing meets the sideslip at a higher angle of attack and rises.', 'Directional (yaw) stability: the fin acts like a weathervane.', 'Stability is a trade-off with manoeuvrability; fly-by-wire fighters can be designed unstable.']} />
          </Card>
          <Card title="Lift-to-drag ratio">
            <M block>{'\\frac{L}{D} \\quad\\text{and in level flight}\\quad T = D = \\frac{W}{L/D}'}</M>
            <KeyPoints items={['A higher L/D means less thrust (and fuel) for the same weight.', 'Gliders reach L/D of 40–60; airliners about 15–20 in cruise.', 'Winglets reduce induced drag from wingtip vortices.']} />
          </Card>
        </Grid>
      </Sec>
      <Sec id="fluids" title="Fluid mechanics: Bernoulli, Pascal, static and dynamic pressure">
        <BernoulliVenturi />
        <PitotAltimeter />
      </Sec>
      <Sec id="hydraulics" title="Hydraulic systems">
        <AircraftHydraulics />
        <FluidPressure initial="pascal" />
      </Sec>
      <Sec id="structures" title="Aircraft structures and bending stress">
        <AircraftStructure />
        <Callout kind="info">A wing behaves like a cantilever beam: lift bends it upward, so the upper skin and spar caps are in compression and the lower ones in tension. Bending stress σ = My/I is greatest at the wing root and in the outer fibres — which is why spar caps are thickest at the root. <Link to="/module/civil/mechanics#bending-stress" className="underline">Bending stress visualiser →</Link></Callout>
      </Sec>
      <Sec id="propulsion" title="Propulsion systems">
        <PropulsionExplorer />
      </Sec>
    </div>
  );
}

export function AeroMaterials() {
  return (
    <div className="space-y-8">
      <Sec id="ndt" title="Specialised testing of aircraft materials">
        <NDTExplorer />
      </Sec>
      <Sec id="aluminium" title="Aluminium and its alloys">
        <AgeHardening />
        <Card><AlAlloyTable /></Card>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {['al-si', 'al-si-mg', 'al-cu-2024', 'al-7075'].map((id) => <MaterialMini key={id} id={id} />)}
        </div>
      </Sec>
      <Sec id="polymers" title="Thermosetting polymers">
        <div className="grid gap-3 md:grid-cols-3">
          {['epoxy', 'phenolic', 'polyester-resin'].map((id) => <MaterialMini key={id} id={id} />)}
        </div>
      </Sec>
      <Sec id="composites" title="Composites: GFRP, CFRP, aramid and FML">
        <CompositeLayup />
        <Card title="Manufacturing processes for aircraft composites">
          <KeyPoints items={['Hand lay-up — simple, cheap tooling, lower fibre fraction (fairings, light aircraft, prototypes).', 'Vacuum lay-up (vacuum bagging) — atmospheric pressure consolidates the laminate: higher fibre fraction, fewer voids (control surfaces, panels).', 'Compression moulding — heated matched moulds cure prepregs or SMC under pressure (interior panels, brackets).', 'Autoclave cure of prepregs — heat + pressure for primary structure.']} />
          <Link to="/manufacturing" className="btn mt-3 text-xs">Animated process explorer →</Link>
        </Card>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {['gfrp', 'cfrp', 'aramid', 'glare'].map((id) => <MaterialMini key={id} id={id} />)}
        </div>
      </Sec>
      <Sec id="corrosion" title="Corrosion: pitting, crevice and stress corrosion">
        <AeroCorrosion />
      </Sec>
      <Sec id="compare" title="Aircraft materials comparison">
        <Card>
          <MaterialChart ids={['al-cu-2024', 'al-7075', 'al-si-mg', 'titanium-64', 'cfrp', 'gfrp', 'aramid', 'glare', 'mild-steel']} defaultMetric="specStrength" />
        </Card>
      </Sec>
    </div>
  );
}

export function AeroCommunication() {
  return (
    <div className="space-y-8">
      <Sec id="drawings" title="Orthogonal, pictorial and scaled drawings of aircraft components">
        <Grid cols={2}>
          <Card title="Applying AS 1100 to aircraft parts">
            <KeyPoints items={['Third-angle orthogonal views of brackets, fittings and ribs with full dimensioning.', 'Scaled drawings: e.g. a 1:50 general-arrangement drawing of an aircraft or 2:1 detail of a small fitting — always state the scale.', 'Pictorial (isometric) drawings help explain assemblies and maintenance procedures.', 'Sections reveal internal features such as lightening holes and flanges.']} />
            <Link to="/drawing" className="btn mt-3 text-xs">3D → 2D Drawing Explorer →</Link>
          </Card>
          <Card title="Developments (transition pieces)">
            <KeyPoints items={['Sheet-metal ducts (engine intakes, air-conditioning ducts) often join a square or rectangular opening to a round one.', 'The surface is triangulated; the TRUE LENGTH of each line is found (√(plan² + height²)) and the triangles are laid out flat in sequence.', 'Add allowances for seams and joints.']} />
            <Link to="/drawing#development" className="btn mt-3 text-xs">Interactive square-to-round development →</Link>
          </Card>
        </Grid>
      </Sec>
      <Sec id="cad" title="CAD, 3D representation and reports">
        <Card>
          <KeyPoints items={['3D CAD models define the whole aircraft digitally (digital mock-up) — interference checks before manufacture.', 'CFD (computational fluid dynamics) and FEA simulate airflow and structural stress.', 'Model-based definition carries dimensions and tolerances in the 3D model.', 'Graphical mechanics (force polygons) can check force systems on fittings.']} />
        </Card>
        <ReportReminder module="Aeronautical Engineering" />
      </Sec>
    </div>
  );
}
