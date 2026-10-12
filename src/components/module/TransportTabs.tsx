import { Link } from 'react-router-dom';
import { MachineSim, FrictionSim, EnergyViz, WEPCalc } from '../mechanics/TransportSims';
import { HeatTreatment, HardnessImpact, ColdWorkAnneal, GlassComparison, PolymerStructures, MotorAnimation, MotorTypes, CircuitVisualiser, PowerDistribution, CruiseControl, MaterialSelection } from '../transport/TransportVisuals';
import { MaterialMini } from '../materials/MaterialCard';
import { MaterialChart } from '../materials/MaterialChart';
import { PROCESSES } from '@/data/processes';
import { Card, Callout, KeyPoints, Grid, M } from '../ui';
import { Sec, ReportReminder } from './Common';

export const transportFeatures = [
  { label: 'Mechanical advantage simulator', to: '/mechanics-lab#machines' },
  { label: 'Velocity ratio & efficiency', to: '/mechanics-lab#machines' },
  { label: 'Friction force diagram', to: '/mechanics-lab#friction' },
  { label: 'Coefficient of friction / repose', to: '/module/transport/mechanics#friction' },
  { label: 'Work, energy & power calculator', to: '/module/transport/mechanics#energy' },
  { label: 'Kinetic vs potential energy', to: '/module/transport/mechanics#energy' },
  { label: 'Heat-treatment diagram', to: '/module/transport/materials#ferrous' },
  { label: 'Manufacturing process explorer', to: '/manufacturing' },
  { label: 'Electric motor animation', to: '/module/transport/electricity#motors' },
  { label: 'Materials selection comparison', to: '/module/transport/materials#selection' },
  { label: 'Electrical circuit visualiser', to: '/module/transport/electricity#circuits' },
];

export function TransportMechanics() {
  return (
    <div className="space-y-8">
      <Sec id="machines" title="Simple machines in transport" sub="Prerequisite (Preliminary course) — applied to gear trains, chain drives, brake levers and hoists.">
        <MachineSim />
        <Card title="Bicycle drive train example">
          <div className="grid gap-4 md:grid-cols-2">
            <KeyPoints items={['Pedal crank radius and chainring/sprocket teeth together set the overall ratio.', 'For combined stages, MULTIPLY the velocity ratios of each stage.', 'A small rear sprocket (high gear) moves the bike further per pedal turn but needs more force.']} />
            <M block>{'\\text{Gear ratio (speed)} = \\dfrac{N_{\\text{chainring}}}{N_{\\text{sprocket}}} = \\dfrac{48}{16} = 3 \\ \\text{wheel turns per crank turn}'}</M>
          </div>
        </Card>
      </Sec>
      <Sec id="friction" title="Static friction" sub="Coefficient of friction, normal force, frictional force, angle of static friction and angle of repose.">
        <FrictionSim />
        <Grid cols={2}>
          <Card title="Angle of static friction">
            <svg viewBox="0 0 320 180" className="diagram" role="img" aria-label="Resultant reaction at angle of friction">
              <line x1={20} x2={300} y1={150} y2={150} stroke="var(--diagram-ink)" />
              <rect x={120} y={100} width={80} height={50} fill="#fb923c" opacity={0.3} stroke="#ea580c" />
              <line x1={160} y1={150} x2={160} y2={30} stroke="#059669" strokeWidth={2} />
              <line x1={160} y1={150} x2={100} y2={150} stroke="#dc2626" strokeWidth={2} />
              <line x1={160} y1={150} x2={100} y2={30} stroke="#2563eb" strokeWidth={2.5} />
              <path d="M 160 90 A 60 60 0 0 0 137 95" fill="none" stroke="var(--diagram-ink)" />
              <text x={140} y={84} fontSize={12} fill="var(--diagram-ink)">φ</text>
              <text x={166} y={40} fontSize={11} fill="#059669">N</text>
              <text x={96} y={166} fontSize={11} fill="#dc2626">F = μN</text>
              <text x={60} y={30} fontSize={11} fill="#2563eb">R (resultant)</text>
            </svg>
            <M block>{'\\tan\\phi = \\dfrac{F}{N} = \\mu'}</M>
          </Card>
          <Card title="Friction in transport">
            <KeyPoints items={['Tyre–road friction provides traction, braking and cornering force; wet or icy roads lower μ.', 'Brake pads/shoes rely on friction to convert kinetic energy to heat — materials must keep μ stable when hot.', 'Unwanted friction (bearings, gears) wastes energy — reduced with lubrication, rolling-element bearings.', 'ABS keeps tyres near peak static friction instead of skidding (lower kinetic friction) so the driver can still steer.', 'Rail adhesion is low (steel on steel) — sanding improves grip on wet rails.']} />
          </Card>
        </Grid>
      </Sec>
      <Sec id="energy" title="Work, energy and power" sub="Force × distance = work (J); energy is the capacity to do work; power is the rate (W).">
        <EnergyViz />
        <WEPCalc />
        <Callout kind="warn" title="Keep them distinct">
          <ul>
            <li><strong>Force</strong> (N) — a push or pull.</li>
            <li><strong>Work / energy</strong> (J = N·m) — force acting through a distance; stored as kinetic or potential energy.</li>
            <li><strong>Power</strong> (W = J/s) — how quickly work is done. A 100 kW motor can deliver 100 kJ every second.</li>
            <li><strong>Efficiency</strong> = useful energy (or power) out ÷ energy (or power) in.</li>
          </ul>
        </Callout>
      </Sec>
    </div>
  );
}

export function TransportMaterials() {
  const ferrousProcs = ['forging', 'rolling', 'sand-casting', 'extrusion-metal', 'powder-forming', 'welding'];
  const polyProcs = ['polymer-extrusion', 'injection-moulding', 'blow-moulding'];
  return (
    <div className="space-y-8">
      <Sec id="testing" title="Testing of materials: hardness and impact">
        <HardnessImpact />
        <Card title="Interpreting results">
          <KeyPoints items={['Higher hardness → better wear resistance (gears, cams, brake discs) but usually lower toughness.', 'Impact energy compares toughness — e.g. checking that a steel for a rail wagon coupling stays tough in cold weather.', 'Hardness traverses across a case-hardened gear show the depth of the hard case.', 'Results depend on test conditions (load, indenter, temperature, notch) — always compare like with like.']} />
        </Card>
      </Sec>
      <Sec id="ferrous" title="Ferrous metals: structure, heat treatment and forming">
        <HeatTreatment />
        <Card title="Manufacturing processes for ferrous components" subtitle="Each process changes the grain structure and therefore the properties">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {PROCESSES.filter((p) => ferrousProcs.includes(p.id)).map((p) => (
              <div key={p.id} className="rounded-lg border border-ink-200 p-3 text-sm dark:border-ink-700">
                <div className="font-semibold">{p.name}</div>
                <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">{p.effect}</p>
                <Link to={`/manufacturing?p=${p.id}`} className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">Animated explainer →</Link>
              </div>
            ))}
          </div>
        </Card>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {['mild-steel', 'medium-carbon-steel', 'stainless-304', 'cast-iron'].map((id) => <MaterialMini key={id} id={id} />)}
        </div>
      </Sec>
      <Sec id="nonferrous" title="Non-ferrous metals: alloys, annealing and solid-solution strengthening">
        <ColdWorkAnneal />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {['aluminium-pure', 'al-si-mg', 'brass', 'copper-etp'].map((id) => <MaterialMini key={id} id={id} />)}
        </div>
      </Sec>
      <Sec id="glass" title="Ceramics and glasses">
        <GlassComparison />
        <Grid cols={2}>
          <MaterialMini id="alumina" />
          <Card title="Ceramics as insulators in transport">
            <KeyPoints items={['Spark-plug insulators (alumina) withstand high voltage, heat and thermal shock.', 'Porcelain and glass insulators support overhead traction wires.', 'Ceramic brake discs (carbon-ceramic) on high-performance cars resist fade at high temperature.', 'Ionic/covalent bonding locks electrons in place → electrical insulation; strong bonds → high melting point.']} />
          </Card>
        </Grid>
      </Sec>
      <Sec id="polymers" title="Polymers: thermosoftening polymers and engineering textiles">
        <PolymerStructures />
        <Card title="Polymer processing" subtitle="Each process orients chains and controls wall thickness and finish">
          <div className="grid gap-3 md:grid-cols-3">
            {PROCESSES.filter((p) => polyProcs.includes(p.id)).map((p) => (
              <div key={p.id} className="rounded-lg border border-ink-200 p-3 text-sm dark:border-ink-700">
                <div className="font-semibold">{p.name}</div>
                <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">{p.effect}</p>
                <p className="mt-1 text-xs"><span className="font-medium">Transport uses: </span>{p.apps.join('; ')}</p>
                <Link to={`/manufacturing?p=${p.id}`} className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">Animated explainer →</Link>
              </div>
            ))}
          </div>
        </Card>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {['pp', 'pc', 'nylon', 'seatbelt-webbing'].map((id) => <MaterialMini key={id} id={id} />)}
        </div>
      </Sec>
      <Sec id="selection" title="Materials selection">
        <MaterialSelection />
        <Card>
          <MaterialChart ids={['mild-steel', 'medium-carbon-steel', 'stainless-304', 'al-si-mg', 'cfrp', 'gfrp', 'pp', 'pc', 'nylon']} defaultMetric="specStrength" />
        </Card>
      </Sec>
    </div>
  );
}

export function TransportElectricity() {
  return (
    <div className="space-y-8">
      <Sec id="distribution" title="Power generation and distribution for transport">
        <Card>
          <PowerDistribution />
        </Card>
      </Sec>
      <Sec id="circuits" title="Electrical energy, power and simple circuits">
        <CircuitVisualiser />
        <Grid cols={3}>
          <Card title="Ohm’s law">
            <M block>{'V = IR'}</M>
            <p className="text-xs text-ink-500">Current through a resistor is proportional to the voltage across it (constant temperature).</p>
          </Card>
          <Card title="Electrical power">
            <M block>{'P = VI = I^2R = \\dfrac{V^2}{R}'}</M>
            <p className="text-xs text-ink-500">Rate of energy conversion, in watts.</p>
          </Card>
          <Card title="Electrical energy">
            <M block>{'E = Pt'}</M>
            <p className="text-xs text-ink-500">Joules (W × s) or kW·h (kW × h). 1 kW·h = 3.6 MJ.</p>
          </Card>
        </Grid>
      </Sec>
      <Sec id="motors" title="Electric motors in transport">
        <MotorAnimation />
        <Card title="Motor types and applications">
          <MotorTypes />
        </Card>
        <Card title="Mechanical vs electrical drive systems">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Internal-combustion (mechanical) drive</th>
                  <th>Electric drive</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Energy source', 'Chemical energy in fuel, burnt on board', 'Battery, overhead wire or third rail'],
                  ['Efficiency (tank/battery to wheel)', 'Roughly 20–35% (much lost as heat)', 'Roughly 80–90%'],
                  ['Torque', 'Narrow useful speed range — needs a multi-speed gearbox', 'Full torque from zero speed — single reduction gear'],
                  ['Braking energy', 'Lost as heat in friction brakes', 'Partly recovered by regenerative braking'],
                  ['Local emissions', 'CO₂, NOₓ, particulates at the exhaust', 'None at point of use (depends on generation)'],
                  ['Maintenance', 'Many moving parts, oil and filters', 'Few moving parts; battery life a factor'],
                ].map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, i) => (
                      <td key={i} className={i === 0 ? 'font-semibold' : ''}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Sec>
      <Sec id="control" title="Control technology">
        <CruiseControl />
        <Grid cols={2}>
          <Card title="Motor speed control">
            <KeyPoints items={['DC motors: pulse-width modulation (PWM) switches the supply on and off rapidly; the average voltage sets the speed.', 'AC traction motors: variable-voltage, variable-frequency (VVVF) inverters set the rotating-field speed.', 'Older trams used series resistors (wasting energy as heat) — replaced by electronic chopper and inverter control.']} />
          </Card>
          <Card title="Electrical safety in transport">
            <KeyPoints items={['High-voltage systems (EVs ≈ 400–800 V DC; trains 1500 V DC) are insulated, colour-coded (orange cabling in EVs) and interlocked.', 'Earthing/bonding of rail structures; isolation procedures before maintenance.', 'Fuses and circuit breakers protect against overcurrent; residual-current devices detect leakage.', 'Battery management systems prevent overcharge and thermal runaway.']} />
          </Card>
        </Grid>
      </Sec>
    </div>
  );
}

export function TransportCommunication() {
  return (
    <div className="space-y-8">
      <Sec id="sketching" title="Freehand sketching and orthogonal drawings">
        <Grid cols={2}>
          <Card title="Freehand engineering sketches">
            <KeyPoints items={['Quick isometric or oblique sketches capture design ideas for components such as brake levers or brackets.', 'Use construction lines and proportion, then darken outlines; add notes and approximate dimensions.', 'Exploded sketches show how parts assemble (e.g. a bicycle hub).']} />
          </Card>
          <Card title="Sectional views (AS 1100)">
            <KeyPoints items={['A cutting plane (thin chain line, thick at ends and changes of direction, with arrows and letters) shows where the section is taken.', 'Cut surfaces are hatched with thin lines at 45°; hidden detail is normally omitted in sections.', 'Shafts, bolts, pins, ribs and spokes are not hatched when cut longitudinally.', 'Half sections suit symmetrical parts such as wheels and pulleys.']} />
            <Link to="/drawing#sections" className="btn mt-3 text-xs">Sectional view examples →</Link>
          </Card>
        </Grid>
      </Sec>
      <Sec id="dimensioning" title="Dimensioning and CAD">
        <Grid cols={2}>
          <Card title="Dimensioning">
            <KeyPoints items={['Dimensions in millimetres; do not repeat dimensions; do not dimension to hidden lines.', 'Thin dimension and projection lines with a small gap from the outline; arrowheads filled.', 'Diameters ⌀, radii R; datum (baseline) dimensioning avoids accumulated tolerances.']} />
            <Link to="/drawing#dimensioning" className="btn mt-3 text-xs">Dimensioning guide →</Link>
          </Card>
          <Card title="CAD and collaborative practice">
            <KeyPoints items={['3D CAD models produce orthogonal drawings automatically and allow finite-element stress analysis and motion simulation.', 'Vehicle teams share models through product-lifecycle management systems with version control.', 'Rapid prototyping (3D printing) checks fit and ergonomics before tooling.']} />
          </Card>
        </Grid>
        <ReportReminder module="Personal and Public Transport" />
        <Callout kind="tip">Report idea: compare the materials and manufacture of a steel and an aluminium bicycle frame, or evaluate an electric bus fleet for your local council.</Callout>
      </Sec>
    </div>
  );
}
