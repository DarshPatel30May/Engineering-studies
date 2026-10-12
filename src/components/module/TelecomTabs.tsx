import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { AnalogueDigital, AMFM, ModDemod, SpectrumExplorer, FibreOptic, TransmissionMedia, ComponentExplorer, Satellites, TVDisplays, CellularDiagram } from '../telecom/TelecomVisuals';
import { LogicSimulator } from '../telecom/Logic';
import { MaterialMini } from '../materials/MaterialCard';
import { MaterialChart } from '../materials/MaterialChart';
import { Card, Callout, KeyPoints, Grid } from '../ui';
import { Sec, ReportReminder, ScopeTab } from './Common';

const NetworkFlow = lazy(() => import('../telecom/NetworkFlow'));
export function NetworkFlowLazy() {
  return (
    <Suspense fallback={<Card title="Telecommunications network flow"><div className="h-[380px] animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800" /></Card>}>
      <NetworkFlow />
    </Suspense>
  );
}

export const telecomFeatures = [
  { label: 'Analogue vs digital', to: '/telecom-lab#signals' },
  { label: 'AM vs FM waveforms', to: '/telecom-lab#modulation' },
  { label: 'Modulation & demodulation', to: '/telecom-lab#modulation' },
  { label: 'EM spectrum explorer', to: '/telecom-lab#spectrum' },
  { label: 'Optical fibre propagation', to: '/telecom-lab#fibre' },
  { label: 'Transmission media comparison', to: '/telecom-lab#media' },
  { label: 'LED, laser diode & transistor explorer', to: '/telecom-lab#components' },
  { label: 'Logic gate simulator', to: '/telecom-lab#logic' },
  { label: 'Interactive truth tables', to: '/telecom-lab#logic' },
  { label: 'Satellite diagram', to: '/telecom-lab#satellites' },
  { label: 'GEO vs LEO comparison', to: '/telecom-lab#satellites' },
  { label: 'Network flow diagram', to: '/telecom-lab#network' },
];

export const TELECOM_SCOPE = [
  { title: 'Nature and range of work', points: ['Design and planning of mobile, fixed, broadcast, satellite and data networks.', 'Radio-frequency engineering: antennas, coverage, spectrum planning.', 'Network operations, cybersecurity and reliability.', 'Electronics and hardware design; software-defined networking.', 'Installation, testing and maintenance of infrastructure (fibre, towers, data centres).'] },
  { title: 'Current projects and innovations', points: ['5G and future 6G mobile networks; mm-wave small cells.', 'National Broadband Network upgrades from copper to fibre.', 'LEO satellite broadband constellations for regional Australia.', 'Internet of Things (smart meters, agriculture sensors).', 'Undersea cable systems and data centres.'] },
  { title: 'Health and safety', points: ['Working at heights on towers and poles; confined spaces (pits).', 'Electrical hazards; asbestos in some old telecommunications pits.', 'Laser safety with optical fibre (invisible infrared light).', 'Radiofrequency electromagnetic energy (EME) exposure kept below ARPANSA limits; EME reports for mobile base stations.'] },
  { title: 'Training and careers', points: ['Bachelor of Engineering (Electrical/Telecommunications/Electronic), accredited by Engineers Australia.', 'Technician and cabling trades (registered cablers).', 'Careers with network carriers, equipment makers, broadcasters, defence, government (ACMA) and consulting.', 'Lifelong learning — the technology changes rapidly.'] },
  { title: 'Ethics and legal responsibilities', points: ['Privacy and data security of communications (Telecommunications Act; interception laws).', 'Spectrum licensing and technical standards regulated by the ACMA.', 'Reliable access to emergency services (000/112) and network resilience in disasters.', 'Equitable access — the digital divide between cities and remote communities.'] },
  { title: 'Engineers as managers & the community', points: ['Manage large rollouts (budgets, contractors, schedules, community consultation).', 'Siting towers: visual amenity and community concerns about EME.', 'Balancing cost, coverage, capacity and reliability.', 'E-waste management and energy efficiency of networks.'] },
];

export function TelecomScope() {
  return (
    <div className="space-y-4">
      <ScopeTab items={TELECOM_SCOPE} />
      <Callout kind="exam">Link each responsibility to a concrete example — e.g. ARPANSA EME limits for a new 5G tower, privacy of customer data, or restoring networks after bushfires.</Callout>
    </div>
  );
}

export function TelecomElectricity() {
  return (
    <div className="space-y-8">
      <Callout kind="info">The Telecommunications Engineering syllabus has no separate engineering-mechanics category; its technical core is engineering electricity/electronics, covered here.</Callout>
      <Sec id="signals" title="Analogue and digital systems">
        <AnalogueDigital />
      </Sec>
      <Sec id="modulation" title="Modulation and demodulation">
        <AMFM />
        <ModDemod />
      </Sec>
      <Sec id="radio" title="Radio transmission and digital radio">
        <Grid cols={3}>
          <Card title="AM radio"><KeyPoints items={['MF band (526.5–1606.5 kHz in Australia).', 'Ground wave follows the Earth’s surface; long range, night-time skywave.', 'Simple receivers; susceptible to electrical noise.']} /></Card>
          <Card title="FM radio"><KeyPoints items={['VHF band 87.5–108 MHz; line-of-sight coverage.', 'Higher fidelity (wider bandwidth) and better noise immunity.', 'Stereo multiplexing.']} /></Card>
          <Card title="Digital radio (DAB+)"><KeyPoints items={['Audio digitised and compressed; several stations multiplexed on one block (VHF Band III).', 'OFDM resists multipath interference; station names, song info and images.', 'Signal fails abruptly at the edge of coverage (“cliff effect”).']} /></Card>
        </Grid>
        <SpectrumExplorer />
      </Sec>
      <Sec id="tv" title="Television: transmission and display">
        <Grid cols={2}>
          <Card title="Analogue vs digital TV transmission">
            <KeyPoints items={['Analogue TV: one programme per 7 MHz channel; picture degraded gradually by noise (snow, ghosting).', 'Digital TV (DVB-T in Australia): video compressed (MPEG) and multiplexed — several SD/HD programmes per channel.', 'Error correction gives a perfect picture until the signal is too weak (cliff effect).', 'Analogue switch-off (completed 2013) freed spectrum for 4G — the “digital dividend”.']} />
          </Card>
          <Card title="Cathode-ray television (historical)">
            <KeyPoints items={['Electron beam scanned the screen in lines (625-line PAL in Australia), refreshing 50 fields per second.', 'Colour from red, green and blue phosphors; shadow mask aligned each beam.', 'Bulky, high-voltage tubes replaced by flat panels in the 2000s.']} />
          </Card>
        </Grid>
        <TVDisplays />
      </Sec>
      <Sec id="telephony" title="Telephony: fixed and mobile">
        <Grid cols={2}>
          <Card title="Fixed telephony">
            <KeyPoints items={['Originally analogue voice on copper twisted pairs to a manual, then automatic, exchange.', 'Digital exchanges convert speech to 64 kbit/s PCM and route it by time-division switching.', 'Today voice is carried as IP packets (VoIP) over the NBN: fibre to the premises, node or curb, HFC, fixed wireless or satellite.']} />
          </Card>
          <Card title="Mobile telephony generations">
            <KeyPoints items={['1G (AMPS, 1987 in Australia): analogue FM voice.', '2G GSM (1993): digital voice, SMS, encryption.', '3G: mobile data; 4G LTE: all-IP high-speed data; 5G: higher speed, lower latency, massive IoT.', 'Each generation uses more spectrum, smarter modulation and smaller cells.']} />
          </Card>
        </Grid>
        <Card title="Cellular coverage and handover"><CellularDiagram /></Card>
        <NetworkFlowLazy />
      </Sec>
      <Sec id="media" title="Transmission media">
        <TransmissionMedia />
        <FibreOptic />
      </Sec>
      <Sec id="satellites" title="Satellite communication and GPS">
        <Satellites />
      </Sec>
      <Sec id="logic" title="Digital logic">
        <LogicSimulator />
      </Sec>
    </div>
  );
}

export function TelecomMaterials() {
  return (
    <div className="space-y-8">
      <Sec id="testing" title="Specialised testing">
        <Card>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Test</th><th>Instrument & method</th><th>Purpose</th></tr></thead>
              <tbody>
                {[
                  ['Voltage', 'Multimeter (voltmeter) connected in PARALLEL across the component', 'Check supply levels, signal levels, faults'],
                  ['Current', 'Ammeter in SERIES (circuit broken) or clamp meter around one conductor', 'Check loads, find short circuits'],
                  ['Resistance / continuity', 'Ohmmeter on a de-energised circuit; beep for continuity', 'Find open circuits and broken conductors'],
                  ['Insulation resistance', 'Insulation resistance tester (“megger”) applies a high DC voltage (e.g. 500 V); reads MΩ', 'Detect damaged or damp cable insulation'],
                  ['Signal strength', 'Field-strength / spectrum analyser, mobile signal meters (dBm); TV signal meter', 'Coverage surveys, antenna alignment'],
                  ['Optical loss / faults', 'Optical power meter and light source; OTDR (optical time-domain reflectometer)', 'Measure fibre attenuation; locate breaks and bad splices'],
                  ['Cable certification', 'Cable tester for Ethernet categories (crosstalk, return loss)', 'Confirm data cabling performance'],
                ].map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i === 0 ? 'font-semibold' : ''}>{c}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </Card>
      </Sec>
      <Sec id="copper" title="Copper and its alloys">
        <div className="grid gap-3 md:grid-cols-3">
          {['copper-etp', 'cube', 'brass'].map((id) => <MaterialMini key={id} id={id} />)}
        </div>
        <Card title="Structure–property relationships">
          <KeyPoints items={['Pure copper is FCC with a “sea” of free electrons → excellent conductivity and ductility (drawn into fine wire).', 'Any alloying atom or cold work scatters electrons → conductivity falls, strength rises. Engineers trade conductivity for strength.', 'ETP copper (≈ 100% IACS) for conductors; brass (≈ 28% IACS) for machined connectors; Cu-Be (≈ 20–25% IACS) for springy contacts after age hardening.']} />
          <MaterialChart ids={['copper-etp', 'brass', 'cube', 'aluminium-pure']} defaultMetric="strength" />
        </Card>
      </Sec>
      <Sec id="semis" title="Semiconductors">
        <ComponentExplorer />
        <div className="grid gap-3 md:grid-cols-2">
          <MaterialMini id="silicon" />
          <MaterialMini id="compound-semis" />
        </div>
      </Sec>
      <Sec id="polymers" title="Polymers as insulators">
        <div className="grid gap-3 md:grid-cols-3">
          {['pvc', 'pe', 'ptfe'].map((id) => <MaterialMini key={id} id={id} />)}
        </div>
        <Callout kind="info">Polymers insulate because their electrons are held in covalent bonds — there are no free electrons. Selection depends on dielectric properties (PTFE and PE for high-frequency coaxial cable), flame behaviour (PVC is self-extinguishing; low-smoke zero-halogen sheaths in tunnels and buildings), flexibility and UV resistance.</Callout>
      </Sec>
      <Sec id="fibre" title="Fibre-optics: materials, construction and types">
        <Grid cols={2}>
          <MaterialMini id="silica-fibre" />
          <Card title="Optical fibre construction">
            <svg viewBox="0 0 320 140" className="diagram" role="img" aria-label="Optical fibre cross-section">
              {[{ r: 62, c: '#334155', t: 'jacket' }, { r: 48, c: '#f59e0b', t: 'strength members / buffer' }, { r: 34, c: '#cbd5e1', t: 'cladding (125 µm)' }, { r: 12, c: '#7c3aed', t: 'core (8–62.5 µm)' }].map((l, i) => (
                <g key={l.t}>
                  <circle cx={80} cy={70} r={l.r} fill={l.c} opacity={0.7} />
                  <line x1={80 + l.r * 0.7} y1={70 - l.r * 0.7} x2={170} y2={20 + i * 30} stroke="var(--diagram-ink)" strokeWidth={0.8} />
                  <text x={174} y={24 + i * 30} fontSize={11} fill="var(--diagram-ink)">{l.t}</text>
                </g>
              ))}
            </svg>
            <KeyPoints items={['Core and cladding are both ultra-pure silica glass; the core is doped to raise its refractive index slightly.', 'Plastic optical fibre (PMMA) is cheaper and more flexible but has much higher loss — short links only.', 'Applications: NBN, mobile backhaul, undersea cables, data centres, medical endoscopes and sensors.']} />
            <Link to="/telecom-lab#fibre" className="btn mt-2 text-xs">Propagation simulator →</Link>
          </Card>
        </Grid>
      </Sec>
    </div>
  );
}

export function TelecomCommunication() {
  return (
    <div className="space-y-8">
      <Sec id="drawings" title="Pictorial and technical drawings, graphical design">
        <Grid cols={2}>
          <Card title="Drawings in telecommunications">
            <KeyPoints items={['Pictorial and orthogonal drawings of components (connector housings, antenna brackets, equipment racks).', 'Block diagrams show signal flow (transmitter → channel → receiver).', 'Circuit schematics use standard symbols; logic diagrams use gate symbols.', 'Network diagrams and site plans for tower installations.']} />
            <Link to="/drawing" className="btn mt-3 text-xs">Technical Drawing guide →</Link>
          </Card>
          <Card title="CAD and computer-assisted problem solving">
            <KeyPoints items={['Electronic CAD (schematic capture and PCB layout) with circuit simulation before building.', 'Radio-coverage prediction software models signal strength over terrain.', 'Spreadsheets and scripts calculate link budgets, bit rates and fibre loss.', 'This site’s logic simulator, spectrum explorer and fibre model are examples of computer-assisted analysis.']} />
          </Card>
        </Grid>
        <ReportReminder module="Telecommunications Engineering" />
        <Callout kind="tip">Report idea: evaluate options (FTTP, fixed wireless, LEO satellite) for connecting a remote NSW community, using a decision matrix and transmission-media comparison.</Callout>
      </Sec>
    </div>
  );
}
