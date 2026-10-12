import { useState } from 'react';
import { Link } from 'react-router-dom';
import BeamCalculator from '../mechanics/BeamCalculator';
import TrussSolver from '../mechanics/TrussSolver';
import { StressStrainExplorer, FoSCalculator } from '../mechanics/StressStrain';
import { BendingStressViz, UDLConcept, LoadPathAnimation, PrestressDiagram, CorrosionCell, CrackDiagram } from '../civil/CivilVisuals';
import { MaterialChart } from '../materials/MaterialChart';
import { MaterialMini } from '../materials/MaterialCard';
import { Card, Callout, KeyPoints, Grid, Slider, Stat, M } from '../ui';
import { Arrow, Label, COL, PinSupport, RollerSupport, Hatch } from '../diagrams/svg';
import { Sec, ReportReminder } from './Common';
import { sig } from '@/lib/calc/format';

export const civilFeatures = [
  { label: 'Beam reaction calculator', to: '/mechanics-lab#beam' },
  { label: 'SFD & BMD simulator', to: '/mechanics-lab#beam' },
  { label: 'Interactive truss solver', to: '/mechanics-lab#truss' },
  { label: 'Stress–strain graph', to: '/mechanics-lab#stress' },
  { label: 'Factor of safety calculator', to: '/module/civil/mechanics#fos' },
  { label: 'Materials comparison', to: '/module/civil/materials#compare' },
  { label: 'Load path animation', to: '/module/civil/mechanics#loadpath' },
  { label: 'Bending stress visualiser', to: '/module/civil/mechanics#bending-stress' },
  { label: 'Pre/post-tensioning sequence', to: '/module/civil/materials#composites' },
];

export function CivilMechanics() {
  return (
    <div className="space-y-8">
      <Sec id="forces" title="Forces, loads and supports" sub="Prerequisite statics (Preliminary course) applied to civil structures.">
        <Grid cols={2}>
          <Card title="Loads on structures">
            <KeyPoints
              items={[
                '**Dead loads** are permanent: self-weight of slabs, beams, walls and fixed services.',
                '**Live (imposed) loads** vary: people, vehicles, furniture, stored goods.',
                '**Environmental loads**: wind, earthquake, snow, water and earth pressure, temperature effects.',
                'Applied loads are resisted by **reaction forces** at supports so that $\\Sigma F_x = 0$, $\\Sigma F_y = 0$ and $\\Sigma M = 0$.',
                'Resolve inclined forces into components: $F_x = F\\cos\\theta$, $F_y = F\\sin\\theta$.',
              ].map((s) => s.replace(/\*\*(.*?)\*\*/g, '$1'))}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/mechanics-lab#resolution" className="btn text-xs">Force resolution tool</Link>
              <Link to="/mechanics-lab#equilibrium" className="btn text-xs">Equilibrium solver</Link>
            </div>
          </Card>
          <Card title="Support types and their reactions">
            <SupportTypes />
          </Card>
        </Grid>
      </Sec>
      <Sec id="loadpath" title="Load paths" sub="Every load must travel through a continuous path of members to the foundations.">
        <LoadPathAnimation />
      </Sec>
      <Sec id="truss" title="Truss analysis" sub="Pin-jointed trusses: method of joints, method of sections and graphical solutions.">
        <Callout kind="exam">HSC questions typically ask for support reactions, then the force in one or two members, stating tension or compression. Always show the equilibrium equation you use and the sign convention.</Callout>
        <TrussSolver />
      </Sec>
      <Sec id="beams" title="Simply supported beams — point loads" sub="Reactions, shear force and bending moment diagrams (numerical, point loads only).">
        <BeamCalculator />
      </Sec>
      <Sec id="bending-stress" title="Bending stress, neutral axis and outer-fibre stress">
        <BendingStressViz />
      </Sec>
      <Sec id="udl" title="Uniformly distributed loads (descriptive)">
        <UDLConcept />
      </Sec>
      <Sec id="stress" title="Stress and strain" sub="Tensile, compressive and shear stress; engineering vs true stress; the stress–strain diagram.">
        <Grid cols={2}>
          <Card title="Key definitions">
            <div className="space-y-1 text-sm">
              <M block>{'\\sigma = \\dfrac{F}{A} \\qquad \\varepsilon = \\dfrac{\\Delta L}{L} \\qquad E = \\dfrac{\\sigma}{\\varepsilon}'}</M>
              <KeyPoints
                items={[
                  'Tensile stress stretches, compressive stress squashes, shear stress slides layers past each other ($\\tau = F/A$, area parallel to the force).',
                  'Engineering stress uses the original area $A_0$; true stress uses the actual area, so $\\sigma_{true} = \\sigma(1+\\varepsilon)$ up to necking.',
                  'Hooke’s law holds up to the limit of proportionality; E is the slope of that region.',
                  'Yield stress: onset of plastic deformation. Proof stress: stress for 0.2% permanent strain.',
                  'Toughness: energy absorbed to fracture = area under the curve.',
                ]}
              />
            </div>
          </Card>
          <Card title="Engineering applications">
            <KeyPoints
              items={[
                'Steel ties and cables are sized so working stress stays well below yield.',
                'Columns and concrete are checked in compression (and slender members for buckling).',
                'Bolts and pins in shear: double shear halves the stress.',
                'Ductile materials give visible warning (large deflection) before failure — preferred in structures.',
                'Stress concentrations at holes and notches raise local stress — the origin of many cracks.',
              ]}
            />
          </Card>
        </Grid>
        <StressStrainExplorer />
      </Sec>
      <Sec id="fos" title="Factor of safety and working stress">
        <FoSCalculator />
      </Sec>
    </div>
  );
}

function SupportTypes() {
  return (
    <svg viewBox="0 0 520 210" className="diagram" role="img" aria-label="Pin, roller and fixed supports with their reactions">
      {[
        { x: 90, t: 'Pin', r: 'Rx, Ry (2 unknowns)' },
        { x: 260, t: 'Roller', r: 'Ry only (1 unknown)' },
        { x: 430, t: 'Fixed', r: 'Rx, Ry, M (3 unknowns)' },
      ].map((s, i) => (
        <g key={s.t}>
          <rect x={s.x - 50} y={52} width={100} height={10} fill="var(--diagram-bg)" stroke={COL.ink} />
          {i === 0 && <PinSupport x={s.x} y={62} s={12} />}
          {i === 1 && <RollerSupport x={s.x} y={62} s={12} />}
          {i === 2 && (
            <>
              <rect x={s.x + 50} y={30} width={10} height={60} fill={COL.muted} opacity={0.5} />
              <Hatch x={s.x + 60} y={30} w={0} />
            </>
          )}
          <Arrow x1={(i === 2 ? s.x + 40 : s.x) - 0} y1={130} x2={(i === 2 ? s.x + 40 : s.x)} y2={(i === 2 ? 66 : 92)} color={COL.reaction} w={2} />
          {i !== 1 && <Arrow x1={(i === 2 ? s.x + 40 : s.x) - 50} y1={i === 2 ? 57 : 75} x2={(i === 2 ? s.x + 40 : s.x) - 14} y2={i === 2 ? 57 : 75} color={COL.reaction} w={2} />}
          {i === 2 && <path d={`M ${s.x + 26} 38 a 16 16 0 1 1 0 38`} fill="none" stroke={COL.reaction} strokeWidth={2} />}
          <Label x={s.x} y={20} weight={700}>{s.t}</Label>
          <Label x={s.x} y={160} size={11} color={COL.reaction}>{s.r}</Label>
        </g>
      ))}
      <text x={260} y={195} fontSize={11} textAnchor="middle" fill={COL.muted}>A pin + roller gives exactly 3 unknowns → statically determinate with ΣFx, ΣFy, ΣM</text>
    </svg>
  );
}

export function CivilMaterials() {
  return (
    <div className="space-y-8">
      <Sec id="testing" title="Testing of materials" sub="Specialised testing of engineering materials and systems, including X-ray and concrete testing.">
        <Grid cols={2}>
          <Card title="Concrete testing">
            <ConcreteTests />
          </Card>
          <Card title="X-ray (radiographic) testing">
            <XRayDiagram />
            <KeyPoints
              items={[
                'X-rays pass through the part; voids and cracks absorb less radiation, so more reaches the film/detector and they appear DARKER.',
                'Finds internal defects: porosity in welds and castings, voids in grouted post-tensioning ducts, bar positions in concrete.',
                'Limitations: radiation safety exclusion zones, access to both sides, cracks must be roughly parallel to the beam to show.',
              ]}
            />
          </Card>
        </Grid>
        <Card title="Other specialised tests on civil structures">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>What it finds</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Compression test of cylinders/cores', 'Concrete compressive strength (e.g. 28-day f′c)', 'Destructive'],
                  ['Slump test', 'Workability/consistency of fresh concrete', 'Quality control'],
                  ['Rebound (Schmidt) hammer', 'Surface hardness → estimated strength, uniformity', 'NDT'],
                  ['Ultrasonic pulse velocity', 'Internal cracking, voids, honeycombing', 'NDT'],
                  ['Cover meter / ground-penetrating radar', 'Location and cover of reinforcement', 'NDT'],
                  ['Half-cell potential', 'Probability of active reinforcement corrosion', 'NDT'],
                  ['Tensile test of reinforcing bar', 'Yield and tensile strength, ductility', 'Destructive'],
                  ['Load test of a structure', 'Deflection and behaviour under known proof loads', 'In-situ'],
                  ['Strain gauges / monitoring', 'Stress changes and fatigue in service', 'In-situ NDT'],
                ].map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, i) => (
                      <td key={i}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Sec>
      <Sec id="ceramics" title="Ceramics: glass, cement and brick" sub="Ionic/covalent bonding → hard, strong in compression, brittle in tension.">
        <div className="grid gap-3 md:grid-cols-3">
          {['glass', 'cement', 'brick'].map((id) => (
            <MaterialMini key={id} id={id} />
          ))}
        </div>
      </Sec>
      <Sec id="composites" title="Composites: concrete, timber, asphalt, laminates, geotextiles" sub="Two or more materials combined to get properties neither has alone.">
        <PrestressDiagram />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {['concrete', 'reinforced-concrete', 'prestressed-concrete', 'timber', 'asphalt', 'laminates', 'geotextile'].map((id) => (
            <MaterialMini key={id} id={id} />
          ))}
        </div>
      </Sec>
      <Sec id="cracks" title="Crack theory" sub="Crack formation and growth, failure due to cracking, prevention and repair.">
        <Card>
          <CrackDiagram />
        </Card>
        <Grid cols={3}>
          <Card title="Formation and growth">
            <KeyPoints items={['Cracks start at stress concentrations: holes, notches, sharp corners, weld defects, voids.', 'Concrete cracks from tension in bending, drying shrinkage, thermal movement and settlement.', 'Under repeated (fatigue) loading a crack grows a little each cycle until the remaining section fails.']} />
          </Card>
          <Card title="Failure due to cracking">
            <KeyPoints items={['Brittle fracture: rapid crack growth with little warning — more likely at low temperature, high loading rate and in brittle materials (King Street Bridge, Melbourne, 1962).', 'Cracks let water and chlorides reach steel, causing corrosion.', 'Loss of stiffness and load-carrying area.']} />
          </Card>
          <Card title="Prevention and repair">
            <KeyPoints items={['Prevention: reinforcement and prestressing, control/expansion joints, proper curing, avoiding sharp re-entrant corners, tough (ductile) materials.', 'Repair: crack-arrest holes in steel, welding/plating, epoxy injection or routing-and-sealing of concrete cracks, stitching bars, FRP wraps.', 'Inspection: visual, dye penetrant, ultrasonic testing.']} />
          </Card>
        </Grid>
      </Sec>
      <Sec id="corrosion" title="Corrosion mechanisms and prevention">
        <Grid cols={2}>
          <Card title="Corrosion of reinforcement (electrochemical cell)">
            <CorrosionCell />
          </Card>
          <Card title="Mechanisms and prevention">
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Mechanism</th>
                    <th>Civil example</th>
                    <th>Prevention</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Uniform (general) atmospheric corrosion', 'Rusting of exposed steel bridge members', 'Paint systems, hot-dip galvanising, weathering steel'],
                    ['Galvanic (bimetallic)', 'Steel bolts in aluminium or copper flashing on steel', 'Insulate dissimilar metals; compatible fasteners'],
                    ['Chloride-induced pitting of reinforcement', 'Marine structures, wharves, coastal car parks', 'Adequate cover, low-permeability concrete, sealers, cathodic protection'],
                    ['Carbonation', 'Older buildings with thin cover', 'Cover, dense concrete, coatings'],
                    ['Crevice corrosion', 'Under bolted plates, bearing seats', 'Seal joints, drainage, inspection'],
                    ['Stress corrosion of prestressing tendons', 'Ungrouted ducts', 'Full grouting, sheathing, monitoring'],
                  ].map((r) => (
                    <tr key={r[0]}>
                      {r.map((c, i) => (
                        <td key={i}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Grid>
      </Sec>
      <Sec id="recycling" title="Recyclability of materials">
        <Grid cols={2}>
          <Card title="Recycling routes">
            <div className="overflow-x-auto">
              <table className="tbl">
                <tbody>
                  {[
                    ['Structural steel', 'Highly recyclable through electric-arc furnaces with no loss of properties; bolted connections allow reuse.'],
                    ['Concrete', 'Crushed to recycled aggregate for road bases and new concrete; reinforcement recovered magnetically.'],
                    ['Asphalt', 'Reclaimed asphalt pavement (RAP) is milled and re-mixed into new asphalt.'],
                    ['Glass', 'Crushed glass can replace sand in asphalt, concrete and pipe bedding.'],
                    ['Timber', 'Reuse of beams, recycling into engineered products, or energy recovery (treated timber needs care).'],
                    ['Bricks', 'Cleaned and reused, or crushed for fill and landscaping.'],
                  ].map((r) => (
                    <tr key={r[0]}>
                      <td className="font-semibold">{r[0]}</td>
                      <td>{r[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Why it matters">
            <KeyPoints items={['Construction and demolition waste is one of Australia’s largest waste streams.', 'Recycling saves landfill, quarrying and the energy embodied in new materials.', 'Designing for disassembly (bolted steel, modular units) keeps materials at their highest value.', 'Composite and bonded materials (laminates, FRP) are harder to separate and recycle.']} />
          </Card>
        </Grid>
      </Sec>
      <Sec id="compare" title="Materials comparison viewer" sub="Concrete, timber, steel, ceramics and composites">
        <Card>
          <MaterialChart ids={['concrete', 'timber', 'mild-steel', 'brick', 'glass', 'cfrp', 'gfrp', 'al-si-mg']} />
        </Card>
        <Card title="Qualitative comparison for structures">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Tension</th>
                  <th>Compression</th>
                  <th>Durability issue</th>
                  <th>Typical use</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Concrete', 'Poor', 'Good', 'Cracking, reinforcement corrosion', 'Foundations, columns, slabs'],
                  ['Steel', 'Excellent', 'Excellent (buckling for slender members)', 'Corrosion, fire', 'Frames, trusses, bridges'],
                  ['Timber', 'Good along grain', 'Good along grain', 'Rot, termites, fire', 'Houses, roof trusses, mass timber'],
                  ['Brick (ceramic)', 'Very poor', 'Good', 'Salt attack, mortar erosion', 'Walls, arches'],
                  ['Glass (ceramic)', 'Poor (flaw-controlled)', 'Good', 'Impact, thermal stress', 'Façades, balustrades'],
                  ['FRP composites', 'Excellent along fibres', 'Moderate', 'UV, fire, cost', 'Strengthening wraps, footbridges'],
                ].map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, i) => (
                      <td key={i} className={i === 0 ? 'font-semibold' : ''}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Sec>
    </div>
  );
}

function ConcreteTests() {
  return (
    <div className="space-y-2">
      <svg viewBox="0 0 520 200" className="diagram" role="img" aria-label="Slump test and cylinder compression test">
        <text x={110} y={18} fontSize={12} textAnchor="middle" fontWeight={600} fill={COL.ink}>Slump test</text>
        <polygon points="60,170 160,170 135,50 85,50" fill="none" stroke={COL.muted} strokeDasharray="5 4" />
        <path d="M 40 170 Q 60 90 110 92 Q 160 90 180 170 Z" fill={COL.muted} opacity={0.45} stroke={COL.ink} />
        <line x1={190} x2={190} y1={50} y2={92} stroke={COL.load} />
        <Arrow x1={190} y1={70} x2={190} y2={52} color={COL.load} w={1.2} head={5} />
        <Arrow x1={190} y1={72} x2={190} y2={90} color={COL.load} w={1.2} head={5} />
        <text x={196} y={75} fontSize={10.5} fill={COL.load}>slump</text>
        <text x={110} y={190} fontSize={10.5} textAnchor="middle" fill={COL.muted}>cone (300 mm) lifted; drop = workability</text>
        <text x={380} y={18} fontSize={12} textAnchor="middle" fontWeight={600} fill={COL.ink}>Compression test</text>
        <rect x={340} y={60} width={80} height={110} fill={COL.muted} opacity={0.4} stroke={COL.ink} />
        <rect x={320} y={44} width={120} height={14} fill={COL.ink} opacity={0.7} />
        <rect x={320} y={172} width={120} height={14} fill={COL.ink} opacity={0.7} />
        <Arrow x1={380} y1={24} x2={380} y2={42} color={COL.load} w={2.4} />
        <path d="M 352 80 l 10 30 l -6 25 M 405 75 l -8 40 l 6 30" stroke={COL.compression} fill="none" strokeWidth={1.4} />
        <text x={380} y={198} fontSize={10.5} textAnchor="middle" fill={COL.muted}>cured cylinder crushed: f′c = F/A</text>
      </svg>
      <KeyPoints items={['Slump: fresh concrete — too wet (high slump) means lower strength and more shrinkage; too dry is hard to compact.', 'Cylinders (e.g. 100 × 200 mm) are cured and crushed, usually at 7 and 28 days, to confirm the specified strength grade.', 'Cores drilled from existing structures are tested the same way.']} />
    </div>
  );
}

function XRayDiagram() {
  return (
    <svg viewBox="0 0 520 170" className="diagram mb-2" role="img" aria-label="Radiographic testing">
      <circle cx={60} cy={85} r={18} fill={COL.load} opacity={0.6} />
      <text x={60} y={125} fontSize={11} textAnchor="middle" fill={COL.ink}>X-ray source</text>
      {[-50, -25, 0, 25, 50].map((d) => (
        <line key={d} x1={78} y1={85} x2={400} y2={85 + d * 1.4} stroke={COL.load} strokeOpacity={0.5} strokeDasharray="4 3" />
      ))}
      <rect x={220} y={30} width={70} height={110} fill={COL.muted} opacity={0.45} stroke={COL.ink} />
      <ellipse cx={255} cy={95} rx={9} ry={6} fill="var(--diagram-bg)" stroke={COL.ink} />
      <text x={255} y={22} fontSize={11} textAnchor="middle" fill={COL.ink}>weld / concrete</text>
      <rect x={400} y={10} width={16} height={150} fill="#e5e7eb" stroke={COL.ink} />
      <rect x={400} y={98} width={16} height={18} fill="#111827" />
      <text x={426} y={110} fontSize={11} fill={COL.ink}>dark spot = void</text>
      <text x={430} y={30} fontSize={11} fill={COL.ink}>film / detector</text>
    </svg>
  );
}

export function CivilCommunication() {
  return (
    <div className="space-y-8">
      <Sec id="as1100" title="AS 1100 orthogonal assembly drawings" sub="Assembly drawings show how parts fit together; component (detail) drawings define each part fully.">
        <Grid cols={2}>
          <Card title="Simplified assembly drawing — clevis pin joint (illustrative)">
            <ClevisAssembly />
          </Card>
          <Card title="Conventions to apply">
            <KeyPoints
              items={[
                'Third-angle projection is standard Australian practice — show the projection symbol in the title block.',
                'Sections: thin hatching at 45°, adjacent parts hatched in opposite directions or different spacing.',
                'Shafts, pins, bolts, nuts, rivets, keys and webs are NOT sectioned when cut along their length.',
                'Balloon (item) references link each part to the parts list (item, description, material, quantity).',
                'Overall dimensions only on assembly drawings; full dimensioning goes on component drawings. Units in mm.',
                'Title block: title, drawing number, scale, projection symbol, drawn by, date.',
              ]}
            />
            <Link to="/drawing" className="btn mt-3 text-xs">Open the Technical Drawing guide →</Link>
          </Card>
        </Grid>
      </Sec>
      <Sec id="pictorial" title="Freehand pictorial drawing">
        <Card>
          <KeyPoints items={['Start with a light isometric box (crate) at 30° to the horizontal enclosing the object.', 'Block in major features, then add details; darken final outlines with confident lines.', 'Use freehand sketches to communicate concepts quickly in design development and reports.']} />
          <Link to="/drawing#pictorial" className="btn mt-3 text-xs">See isometric examples in the 3D → 2D explorer</Link>
        </Card>
      </Sec>
      <Sec id="graphical" title="Graphical mechanics" sub="Solving force problems by drawing vectors to scale — a check on calculation.">
        <GraphicalJoint />
      </Sec>
      <Sec id="cad" title="CAD, collaboration and Engineering Reports">
        <Grid cols={2}>
          <Card title="CAD in civil engineering">
            <KeyPoints items={['2D drafting and 3D modelling of structures; BIM (building information modelling) links geometry with quantities, cost and scheduling.', 'Structural analysis software (frame and finite-element analysis) checks member forces and deflections.', 'Shared models let engineers, architects and builders detect clashes before construction.']} />
          </Card>
          <Card title="Collaborative work practices">
            <KeyPoints items={['Define roles, timelines and responsibilities (e.g. a Gantt chart).', 'Use shared, version-controlled files and meeting minutes.', 'Peer review calculations and drawings before issue.']} />
          </Card>
        </Grid>
        <ReportReminder module="Civil Structures" />
      </Sec>
    </div>
  );
}

function ClevisAssembly() {
  const hatch = (id: string, angle: number) => (
    <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
      <line x1={0} y1={0} x2={0} y2={6} stroke={COL.ink} strokeWidth={0.7} />
    </pattern>
  );
  return (
    <div>
      <svg viewBox="0 0 520 300" className="diagram" role="img" aria-label="Simplified sectioned assembly drawing of a clevis pin joint">
        <defs>
          {hatch('h45', 45)}
          {hatch('h135', 135)}
        </defs>
        <text x={150} y={16} fontSize={11} textAnchor="middle" fill={COL.ink} fontWeight={600}>FRONT VIEW — SECTION A-A</text>
        {/* clevis cheeks sectioned */}
        <rect x={60} y={50} width={30} height={150} fill="url(#h45)" stroke={COL.ink} strokeWidth={1.8} />
        <rect x={210} y={50} width={30} height={150} fill="url(#h45)" stroke={COL.ink} strokeWidth={1.8} />
        <rect x={60} y={200} width={180} height={30} fill="url(#h45)" stroke={COL.ink} strokeWidth={1.8} />
        {/* eye rod sectioned opposite hatch */}
        <rect x={100} y={60} width={100} height={110} fill="url(#h135)" stroke={COL.ink} strokeWidth={1.8} />
        {/* pin NOT sectioned */}
        <rect x={40} y={100} width={230} height={30} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={1.8} />
        <rect x={30} y={95} width={12} height={40} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={1.8} />
        <line x1={20} x2={290} y1={115} y2={115} stroke={COL.ink} strokeWidth={0.7} strokeDasharray="14 3 2 3" />
        {/* rod above */}
        <rect x={130} y={20} width={40} height={40} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={1.8} />
        {/* balloons */}
        {[
          { x: 40, y: 260, tx: 75, ty: 215, n: 1 },
          { x: 150, y: 270, tx: 150, ty: 150, n: 2 },
          { x: 300, y: 80, tx: 255, ty: 112, n: 3 },
        ].map((b) => (
          <g key={b.n}>
            <line x1={b.x} y1={b.y} x2={b.tx} y2={b.ty} stroke={COL.ink} strokeWidth={0.7} />
            <circle cx={b.tx} cy={b.ty} r={2} fill={COL.ink} />
            <circle cx={b.x} cy={b.y} r={11} fill="var(--diagram-bg)" stroke={COL.ink} />
            <text x={b.x} y={b.y + 4} fontSize={11} textAnchor="middle" fill={COL.ink}>{b.n}</text>
          </g>
        ))}
        {/* parts list */}
        <g fontSize={10} fill={COL.ink}>
          <rect x={330} y={150} width={180} height={90} fill="none" stroke={COL.ink} />
          {['ITEM  DESCRIPTION       QTY', '1     CLEVIS (MILD STEEL)  1', '2     EYE ROD (MILD STEEL) 1', '3     PIN Ø20 (STEEL)      1'].map((t, i) => (
            <text key={i} x={336} y={168 + i * 20} fontFamily="JetBrains Mono, monospace" fontSize={9}>{t}</text>
          ))}
          <rect x={330} y={245} width={180} height={45} fill="none" stroke={COL.ink} />
          <text x={336} y={262} fontSize={9.5}>CLEVIS PIN JOINT — ASSEMBLY</text>
          <text x={336} y={280} fontSize={9.5}>SCALE 1:2   UNITS mm</text>
          <g transform="translate(470 270)">
            <path d="M -14 -6 L 0 -10 L 0 10 L -14 6 Z" fill="none" stroke={COL.ink} />
            <circle cx={14} cy={0} r={8} fill="none" stroke={COL.ink} />
            <circle cx={14} cy={0} r={4} fill="none" stroke={COL.ink} />
          </g>
        </g>
      </svg>
      <p className="mt-1 text-xs text-ink-500">Illustrative only — simplified to show sectioning, the unsectioned pin, balloons, parts list and third-angle symbol. It is not a complete, fully dimensioned AS 1100 drawing.</p>
    </div>
  );
}

function GraphicalJoint() {
  const [P, setP] = useState(24);
  const [ang, setAng] = useState(37);
  const a = (ang * Math.PI) / 180;
  // Apex joint of a symmetric truss: two rafters at angle a to horizontal carry load P.
  const F = P / (2 * Math.sin(a)); // compression in each rafter
  const scale = Math.min(4, 190 / P, 180 / Math.max(1e-6, F * Math.cos(a))); // px per kN, fitted to the panel
  const ox = 360;
  const oy = 30;
  // Force (vector) diagram: load P down, then rafter forces closing the triangle.
  const p1 = { x: ox, y: oy };
  const p2 = { x: ox, y: oy + P * scale };
  const p3 = { x: ox + F * Math.cos(a) * scale, y: oy + (P / 2) * scale };
  return (
    <Card>
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <svg viewBox="0 0 560 260" className="diagram" role="img" aria-label="Space diagram and force diagram for a truss apex joint">
          <text x={130} y={18} fontSize={12} textAnchor="middle" fontWeight={600} fill={COL.ink}>Space diagram (Bow’s notation)</text>
          <line x1={30} y1={200} x2={130} y2={200 - 100 * Math.tan(a)} stroke={COL.compression} strokeWidth={4} />
          <line x1={230} y1={200} x2={130} y2={200 - 100 * Math.tan(a)} stroke={COL.compression} strokeWidth={4} />
          <line x1={30} y1={200} x2={230} y2={200} stroke={COL.tension} strokeWidth={4} />
          <Arrow x1={130} y1={200 - 100 * Math.tan(a) - 50} x2={130} y2={200 - 100 * Math.tan(a) - 6} color={COL.load} w={2.4} />
          <Label x={142} y={200 - 100 * Math.tan(a) - 30} anchor="start" color={COL.load} weight={700}>{P} kN</Label>
          <text x={100} y={200 - 100 * Math.tan(a) - 20} fontSize={14} fontWeight={700} fill={COL.ink}>A</text>
          <text x={155} y={200 - 100 * Math.tan(a) - 20} fontSize={14} fontWeight={700} fill={COL.ink}>B</text>
          <text x={128} y={190} fontSize={14} fontWeight={700} fill={COL.ink}>C</text>
          <text x={52} y={194} fontSize={11} fill={COL.ink}>{ang}°</text>
          <text x={340} y={18} fontSize={12} fontWeight={600} fill={COL.ink}>Force diagram (to scale)</text>
          <Arrow x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} color={COL.load} w={2.4} />
          <Arrow x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} color={COL.compression} w={2.4} />
          <Arrow x1={p3.x} y1={p3.y} x2={p1.x} y2={p1.y} color={COL.compression} w={2.4} />
          <text x={p1.x - 10} y={p1.y + 4} fontSize={12} fontWeight={700} fill={COL.ink}>a</text>
          <text x={p2.x - 10} y={p2.y + 4} fontSize={12} fontWeight={700} fill={COL.ink}>b</text>
          <text x={p3.x + 6} y={p3.y + 4} fontSize={12} fontWeight={700} fill={COL.ink}>c</text>
          <text x={340} y={250} fontSize={10.5} fill={COL.muted}>Scale: {sig(scale, 3)} px per kN</text>
        </svg>
        <div className="space-y-3">
          <Slider label="Apex load P" value={P} min={6} max={40} unit="kN" onChange={setP} />
          <Slider label="Rafter angle" value={ang} min={20} max={60} unit="°" onChange={setAng} />
          <Stat label="Measured length bc = ca" value={sig(F, 4)} unit="kN (C)" tone="red" />
          <M block>{`F = \\dfrac{P}{2\\sin\\theta} = \\dfrac{${P}}{2\\sin ${ang}^\\circ} = ${sig(F, 4)}\\ \\text{kN}`}</M>
          <p className="prose-only text-xs text-ink-500">Bow’s notation labels the SPACES between forces (A, B, C). Each force is named by the spaces either side (e.g. load AB). Draw ab to scale for the known load, then lines parallel to the members through a and b; they meet at c. Measured lengths give member forces — matching the calculation.</p>
        </div>
      </div>
      <Callout kind="exam" className="mt-3">Graphical methods are valid for trusses and concurrent forces — state your scale, draw accurately and measure carefully.</Callout>
    </Card>
  );
}
