import type { ModuleId } from './types';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'hsc';
export type DiagramKey =
  | 'beam-6m'
  | 'beam-8m'
  | 'truss-triangle'
  | 'truss-zero'
  | 'sfd-read'
  | 'stress-strain'
  | 'logic-nand-not'
  | 'logic-nor'
  | 'am-fm'
  | 'incline'
  | 'pulley-4'
  | 'four-forces'
  | 'venturi'
  | 'fibre';

interface Base {
  id: string;
  module: ModuleId;
  topic: string;
  difficulty: Difficulty;
  diagram?: DiagramKey;
}

export interface MCQ extends Base {
  kind: 'mcq';
  stem: string;
  options: { text: string; why: string }[];
  answer: number;
}

export interface ShortQ extends Base {
  kind: 'short';
  marks: number;
  stem: string;
  /** Indicative marking criteria, highest band first. */
  criteria: { marks: string; text: string }[];
  /** Checklist of features a strong answer includes (student self-assessment). */
  features: string[];
  sample: string;
}

export interface CalcPart {
  label: string;
  answer: number;
  unit: string;
  /** Relative tolerance (default 1%). */
  tol?: number;
  working: string[];
  /** Typical wrong answers and the reason. */
  traps?: { value: number; msg: string }[];
}

export interface CalcQ extends Base {
  kind: 'calc';
  marks: number;
  stem: string;
  parts: CalcPart[];
}

export type Question = MCQ | ShortQ | CalcQ;

const mcq = (q: Omit<MCQ, 'kind'>): MCQ => ({ kind: 'mcq', ...q });
const short = (q: Omit<ShortQ, 'kind'>): ShortQ => ({ kind: 'short', ...q });
const calc = (q: Omit<CalcQ, 'kind'>): CalcQ => ({ kind: 'calc', ...q });

export const QUESTIONS: Question[] = [
  // ════════════════ CIVIL STRUCTURES — MCQ ════════════════
  mcq({
    id: 'cs-mc1', module: 'civil', topic: 'Beams', difficulty: 'easy', diagram: 'beam-6m',
    stem: 'The simply supported beam shown is 6.0 m long and carries an 18 kN point load 2.0 m from support A. What is the reaction at A?',
    options: [
      { text: '6 kN', why: 'This is R_B. The support NEARER the load carries more of it.' },
      { text: '9 kN', why: 'This assumes the load is shared equally, which only happens when it is at mid-span.' },
      { text: '12 kN', why: 'Correct. ΣM_B = 0: R_A × 6 = 18 × 4, so R_A = 12 kN.' },
      { text: '18 kN', why: 'The two reactions must share the load: R_A + R_B = 18 kN.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'cs-mc2', module: 'civil', topic: 'Beams', difficulty: 'easy',
    stem: 'For a simply supported beam carrying point loads only, the maximum bending moment occurs:',
    options: [
      { text: 'at the supports', why: 'Bending moment is zero at simple (pin/roller) supports at the ends of a beam.' },
      { text: 'where the shear force changes sign', why: 'Correct. dM/dx = V, so M is a maximum where V passes through zero — under one of the point loads.' },
      { text: 'always at mid-span', why: 'Only for symmetric loading. With an off-centre load the maximum is under the load.' },
      { text: 'where the shear force is greatest', why: 'Maximum shear usually occurs near the supports, where M is small.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'cs-mc3', module: 'civil', topic: 'Trusses', difficulty: 'easy', diagram: 'truss-triangle',
    stem: 'The pin-jointed truss shown carries a vertical load at the apex C and is supported by a pin at A and roller at B. Member AB is in:',
    options: [
      { text: 'tension', why: 'Correct. The inclined members push outward on A and B; the bottom tie AB holds them together, so it is pulled (tension).' },
      { text: 'compression', why: 'The inclined rafters AC and BC are in compression; AB resists their outward thrust.' },
      { text: 'zero force', why: 'AB carries the horizontal component of the rafter forces, so it is not a zero-force member.' },
      { text: 'bending', why: 'Pin-jointed truss members loaded at the joints carry only axial force.' },
    ],
    answer: 0,
  }),
  mcq({
    id: 'cs-mc4', module: 'civil', topic: 'Stress & strain', difficulty: 'medium',
    stem: 'Proof stress is used instead of yield stress when:',
    options: [
      { text: 'the material is brittle', why: 'Brittle materials fracture with little plastic strain; their design is usually based on UTS.' },
      { text: 'the material has no distinct yield point, such as an aluminium alloy', why: 'Correct. A line parallel to the elastic slope is drawn from 0.2% strain; its intersection with the curve is the 0.2% proof stress.' },
      { text: 'the load is applied in compression', why: 'Proof stress is defined from the tensile stress–strain curve, regardless of service loading.' },
      { text: 'a factor of safety is not required', why: 'Proof stress is a material property; the factor of safety is applied separately.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'cs-mc5', module: 'civil', topic: 'Stress & strain', difficulty: 'medium',
    stem: 'After the ultimate tensile strength is reached in a tensile test, engineering stress falls. Which statement is correct?',
    options: [
      { text: 'The material has started to weaken chemically.', why: 'No chemical change occurs; the fall is geometric.' },
      { text: 'True stress also falls.', why: 'True stress, based on the actual necked area, keeps rising until fracture.' },
      { text: 'Engineering stress uses the original area, which no longer reflects the shrinking neck.', why: 'Correct. Load falls as the neck thins, but the actual (true) stress in the neck continues to increase.' },
      { text: 'Hooke’s law is now obeyed.', why: 'Hooke’s law applies only in the elastic region.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'cs-mc6', module: 'civil', topic: 'Stress & strain', difficulty: 'easy',
    stem: 'A steel with a yield stress of 300 MPa is used at a working stress of 120 MPa. The factor of safety based on yield is:',
    options: [
      { text: '0.4', why: 'This is the inverse ratio. FoS = limit ÷ working.' },
      { text: '2.5', why: 'Correct. 300 ÷ 120 = 2.5.' },
      { text: '180', why: 'Subtracting stresses gives a margin in MPa, not a factor of safety.' },
      { text: '3.6', why: 'Arithmetic slip — check 300/120.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'cs-mc7', module: 'civil', topic: 'Units', difficulty: 'easy',
    stem: 'An area of 250 mm² expressed in m² is:',
    options: [
      { text: '0.25 m²', why: 'This divides by 1000 — the LENGTH conversion. Area needs (1000)².' },
      { text: '2.5 × 10⁻⁴ m²', why: 'Correct. 1 m² = 10⁶ mm², so 250 ÷ 10⁶ = 2.5 × 10⁻⁴ m².' },
      { text: '2.5 × 10⁻² m²', why: 'Divided by 10⁴ (cm² conversion) instead of 10⁶.' },
      { text: '250 000 m²', why: 'Multiplied instead of divided.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'cs-mc8', module: 'civil', topic: 'Composites', difficulty: 'medium',
    stem: 'Which statement correctly describes PRE-tensioned concrete?',
    options: [
      { text: 'Tendons are placed in ducts and stressed after the concrete has hardened.', why: 'That describes POST-tensioning.' },
      { text: 'Tendons are stressed before the concrete is cast; the force is transferred to the concrete by bond when they are released.', why: 'Correct. Typical for factory-made girders and planks.' },
      { text: 'Steel bars are placed in the compression zone to resist crushing.', why: 'Reinforcement is placed mainly in tension zones; prestressing pre-compresses the concrete.' },
      { text: 'The concrete is heated before casting to reduce shrinkage.', why: 'Not a prestressing method.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'cs-mc9', module: 'civil', topic: 'Corrosion', difficulty: 'medium',
    stem: '“Concrete cancer” causes spalling of the concrete cover mainly because:',
    options: [
      { text: 'concrete dissolves in rainwater', why: 'Concrete is largely insoluble; spalling is driven by the steel.' },
      { text: 'corrosion products of the reinforcement occupy a larger volume than the original steel', why: 'Correct. Expanding rust generates tensile stress in the cover, cracking and spalling it.' },
      { text: 'steel expands more than concrete when heated', why: 'Steel and concrete have similar coefficients of thermal expansion — one reason they work well together.' },
      { text: 'the steel becomes brittle and shatters', why: 'Corrosion reduces bar area; it does not shatter the steel.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'cs-mc10', module: 'civil', topic: 'Crack theory', difficulty: 'medium',
    stem: 'Drilling a small hole at the tip of a crack in a steel plate slows crack growth because it:',
    options: [
      { text: 'removes the corroded material', why: 'The purpose is mechanical, not removing corrosion.' },
      { text: 'increases the crack-tip radius, reducing the stress concentration', why: 'Correct. A sharp tip concentrates stress; a rounded hole lowers the peak stress.' },
      { text: 'increases the second moment of area of the plate', why: 'A hole slightly REDUCES section properties.' },
      { text: 'relieves residual stresses through heating', why: 'Drilling does not heat-treat the plate.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'cs-mc11', module: 'civil', topic: 'Trusses', difficulty: 'hard',
    stem: 'A plane truss has 7 joints and 11 members, with a pin at one end and a roller at the other. The truss is:',
    options: [
      { text: 'a mechanism (unstable)', why: 'Unstable if m + r < 2j. Here m + r = 11 + 3 = 14.' },
      { text: 'statically determinate (if well triangulated)', why: 'Correct. m + r = 14 = 2j = 14.' },
      { text: 'statically indeterminate', why: 'That needs m + r > 2j.' },
      { text: 'impossible to classify without the loads', why: 'Determinacy depends on geometry and supports, not loads.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'cs-mc12', module: 'civil', topic: 'Beams', difficulty: 'medium', diagram: 'sfd-read',
    stem: 'The shear-force diagram shown is for a simply supported beam with two point loads. Where is the bending moment greatest?',
    options: [
      { text: 'x = 0 m', why: 'Moment is zero at a simple end support.' },
      { text: 'x = 2 m', why: 'The shear force is still positive after x = 2 m, so M is still increasing.' },
      { text: 'x = 5 m', why: 'Correct. The SFD crosses zero (changes sign) at x = 5 m.' },
      { text: 'x = 8 m', why: 'Moment returns to zero at the right support.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'cs-mc13', module: 'civil', topic: 'Beams', difficulty: 'easy',
    stem: 'In a simply supported beam bending under downward loads (sagging), the stress at the neutral axis is:',
    options: [
      { text: 'maximum tensile', why: 'Maximum tension occurs at the bottom (outer) fibre.' },
      { text: 'maximum compressive', why: 'Maximum compression occurs at the top (outer) fibre.' },
      { text: 'zero', why: 'Correct. σ = My/I and y = 0 at the neutral axis.' },
      { text: 'equal to the average stress F/A', why: 'Bending stress is not an average axial stress.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'cs-mc14', module: 'civil', topic: 'Materials testing', difficulty: 'easy',
    stem: 'A slump test on fresh concrete measures its:',
    options: [
      { text: 'compressive strength', why: 'Compressive strength is measured by crushing hardened cylinders (usually at 28 days).' },
      { text: 'workability (consistency)', why: 'Correct. The cone is lifted and the drop of the concrete indicates how easily it can be placed.' },
      { text: 'chloride content', why: 'Measured chemically, not with a slump cone.' },
      { text: 'reinforcement cover', why: 'Measured with a cover meter on hardened concrete.' },
    ],
    answer: 1,
  }),
  // ════════════════ TRANSPORT — MCQ ════════════════
  mcq({
    id: 'pt-mc1', module: 'transport', topic: 'Friction', difficulty: 'easy',
    stem: 'A crate presses on a level floor with a normal force of 500 N. μ_s = 0.4. The maximum static friction force is:',
    options: [
      { text: '0.0008 N', why: 'μ is multiplied, not divided.' },
      { text: '125 N', why: 'That is 500 ÷ 4. Use F = μN.' },
      { text: '200 N', why: 'Correct. F = 0.4 × 500 = 200 N.' },
      { text: '500 N', why: 'That is the normal force itself.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'pt-mc2', module: 'transport', topic: 'Friction', difficulty: 'medium',
    stem: 'A block just starts to slide when a plank is tilted to 30°. The coefficient of static friction is approximately:',
    options: [
      { text: '0.50', why: 'That is sin 30°. At impending slip mg sin θ = μ mg cos θ → μ = tan θ.' },
      { text: '0.58', why: 'Correct. μ = tan 30° ≈ 0.577 (angle of repose = angle of friction).' },
      { text: '0.87', why: 'That is cos 30°.' },
      { text: '1.73', why: 'That is tan 60°.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc3', module: 'transport', topic: 'Machines', difficulty: 'easy',
    stem: 'A machine has VR = 4 and MA = 3. Its efficiency is:',
    options: [
      { text: '133%', why: 'Efficiency cannot exceed 100% — the ratio is inverted.' },
      { text: '75%', why: 'Correct. η = MA/VR = 3/4 = 0.75.' },
      { text: '12%', why: 'MA × VR has no physical meaning here.' },
      { text: '25%', why: 'That is the fraction LOST (1 − 0.75).' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc4', module: 'transport', topic: 'Energy', difficulty: 'easy',
    stem: 'If a car’s speed doubles, its kinetic energy:',
    options: [
      { text: 'doubles', why: 'E_k ∝ v², not v.' },
      { text: 'quadruples', why: 'Correct. (2v)² = 4v².' },
      { text: 'halves', why: 'Energy increases with speed.' },
      { text: 'is unchanged', why: 'Kinetic energy depends on speed.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc5', module: 'transport', topic: 'Heat treatment', difficulty: 'easy',
    stem: 'Normalising differs from full annealing of steel because in normalising the steel is:',
    options: [
      { text: 'cooled in still air', why: 'Correct. Faster cooling than furnace cooling gives finer pearlite and grains.' },
      { text: 'quenched in water', why: 'That is hardening.' },
      { text: 'heated only to 200 °C', why: 'That is a low-temperature temper, below the critical range.' },
      { text: 'cooled slowly in the furnace', why: 'That is annealing.' },
    ],
    answer: 0,
  }),
  mcq({
    id: 'pt-mc6', module: 'transport', topic: 'Heat treatment', difficulty: 'medium',
    stem: 'A medium-carbon steel gear has been hardened by water quenching and is now too brittle. The appropriate treatment is:',
    options: [
      { text: 'normalising', why: 'Would remove the martensite and most of the hardness.' },
      { text: 'tempering at a moderate temperature', why: 'Correct. Reheating below A₁ produces tempered martensite: some hardness lost, toughness gained.' },
      { text: 'a second, faster quench', why: 'Would increase brittleness and cracking risk.' },
      { text: 'cold working', why: 'Cold working further reduces ductility.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc7', module: 'transport', topic: 'Glass', difficulty: 'easy',
    stem: 'Windscreens are made from laminated glass rather than toughened glass mainly because laminated glass:',
    options: [
      { text: 'is cheaper and lighter', why: 'It is heavier and more expensive.' },
      { text: 'stays bonded to the PVB interlayer when broken, maintaining visibility and preventing ejection', why: 'Correct. Toughened glass shatters completely into dice.' },
      { text: 'cannot crack', why: 'It cracks, but the fragments are held in place.' },
      { text: 'has surface compression from rapid quenching', why: 'That describes toughened glass.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc8', module: 'transport', topic: 'Polymers', difficulty: 'medium',
    stem: 'Thermosoftening polymers can be remoulded because:',
    options: [
      { text: 'their chains are joined by strong covalent cross-links', why: 'That describes thermosets, which cannot be remelted.' },
      { text: 'weak secondary (van der Waals) forces between chains are overcome by heating', why: 'Correct. Chains can slide past each other when hot and re-bond on cooling.' },
      { text: 'they contain metallic bonds', why: 'Polymers have covalent chains, not metallic bonding.' },
      { text: 'they are crystalline ceramics', why: 'They are polymers.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc9', module: 'transport', topic: 'Testing', difficulty: 'easy',
    stem: 'A Charpy test is used to measure:',
    options: [
      { text: 'hardness', why: 'Hardness is measured by indentation (Brinell, Vickers, Rockwell).' },
      { text: 'the energy absorbed by a notched specimen under impact (toughness)', why: 'Correct. Energy = mg(h₁ − h₂) from the pendulum heights.' },
      { text: 'Young’s modulus', why: 'Measured from the elastic slope of a tensile test.' },
      { text: 'fatigue life', why: 'Needs cyclic loading tests.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc10', module: 'transport', topic: 'Electricity', difficulty: 'easy',
    stem: 'Regenerative braking in an electric train converts:',
    options: [
      { text: 'heat into kinetic energy', why: 'Braking removes kinetic energy.' },
      { text: 'kinetic energy into electrical energy using the motor as a generator', why: 'Correct. Energy is returned to the supply or stored.' },
      { text: 'electrical energy into potential energy', why: 'Not the braking function.' },
      { text: 'kinetic energy into heat in the brake discs', why: 'That is friction braking.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc11', module: 'transport', topic: 'Energy', difficulty: 'easy',
    stem: 'A motor does 1500 J of work in 3.0 s. Its power output is:',
    options: [
      { text: '4500 W', why: 'Multiplied instead of dividing.' },
      { text: '500 W', why: 'Correct. P = W/t = 1500/3.' },
      { text: '1500 W', why: 'Ignores time.' },
      { text: '0.002 W', why: 'Inverted.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc12', module: 'transport', topic: 'Non-ferrous', difficulty: 'medium',
    stem: 'Brass is stronger than pure copper mainly because:',
    options: [
      { text: 'zinc atoms in solid solution distort the lattice and hinder dislocation movement', why: 'Correct. Solid-solution strengthening.' },
      { text: 'it is quenched to form martensite', why: 'Martensite forms in steels, not brass.' },
      { text: 'it contains carbon', why: 'Brass is a copper–zinc alloy.' },
      { text: 'zinc increases conductivity', why: 'Zinc reduces conductivity.' },
    ],
    answer: 0,
  }),
  mcq({
    id: 'pt-mc13', module: 'transport', topic: 'Forming', difficulty: 'medium',
    stem: 'Compared with annealed sheet, cold-rolled steel sheet is:',
    options: [
      { text: 'softer and more ductile', why: 'Opposite — that is the effect of annealing.' },
      { text: 'harder and stronger but less ductile, with elongated grains', why: 'Correct. Strain (work) hardening.' },
      { text: 'unchanged except in thickness', why: 'Cold work changes properties significantly.' },
      { text: 'martensitic', why: 'Martensite needs quenching.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc14', module: 'transport', topic: 'Friction', difficulty: 'hard', diagram: 'incline',
    stem: 'A block rests on a 20° incline with μ_s = 0.5. Which statement is correct?',
    options: [
      { text: 'It slides because there is a component of weight down the slope.', why: 'Friction can balance that component up to μN.' },
      { text: 'It stays at rest because tan 20° (≈ 0.36) is less than μ_s.', why: 'Correct. The slope is below the angle of repose (tan⁻¹ 0.5 ≈ 26.6°).' },
      { text: 'It stays at rest and friction equals μN.', why: 'Friction equals mg sin θ, which is less than the limiting μN.' },
      { text: 'Friction acts down the slope.', why: 'Friction opposes the tendency to slide down, so it acts up the slope.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'pt-mc15', module: 'transport', topic: 'Machines', difficulty: 'easy', diagram: 'pulley-4',
    stem: 'The pulley block shown has four rope segments supporting the lower (moving) block. Its velocity ratio is:',
    options: [
      { text: '1', why: 'That is a single fixed pulley.' },
      { text: '2', why: 'Count the supporting segments of the moving block.' },
      { text: '4', why: 'Correct. Each metre the load rises, all four segments shorten by 1 m, so the effort moves 4 m.' },
      { text: '8', why: 'Count rope segments, not pulley wheels × 2.' },
    ],
    answer: 2,
  }),
  // ════════════════ AERONAUTICAL — MCQ ════════════════
  mcq({
    id: 'ae-mc1', module: 'aero', topic: 'Flight mechanics', difficulty: 'easy', diagram: 'four-forces',
    stem: 'In steady, straight and level flight at constant speed:',
    options: [
      { text: 'lift > weight and thrust > drag', why: 'That would cause climbing and acceleration.' },
      { text: 'lift = weight and thrust = drag', why: 'Correct. Zero net force means constant velocity (Newton’s first law).' },
      { text: 'thrust = weight', why: 'Thrust balances drag, not weight (except in a vertical climb).' },
      { text: 'lift = drag', why: 'Lift and drag are perpendicular.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'ae-mc2', module: 'aero', topic: 'Flight mechanics', difficulty: 'medium',
    stem: 'An aerodynamic stall occurs when:',
    options: [
      { text: 'the engine stops', why: 'An engine failure is not an aerodynamic stall.' },
      { text: 'the critical angle of attack is exceeded and flow separates from the upper surface', why: 'Correct. It can occur at any airspeed.' },
      { text: 'airspeed exceeds the speed of sound', why: 'Transonic effects are different.' },
      { text: 'lift equals weight', why: 'That is normal level flight.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'ae-mc3', module: 'aero', topic: 'Control surfaces', difficulty: 'easy',
    stem: 'Ailerons control the aircraft about its:',
    options: [
      { text: 'longitudinal axis (roll)', why: 'Correct. They deflect in opposite directions to change lift on each wing.' },
      { text: 'lateral axis (pitch)', why: 'Pitch is controlled by the elevator.' },
      { text: 'normal axis (yaw)', why: 'Yaw is controlled by the rudder.' },
      { text: 'centre of pressure only', why: 'Not an axis of rotation.' },
    ],
    answer: 0,
  }),
  mcq({
    id: 'ae-mc4', module: 'aero', topic: 'Fluid mechanics', difficulty: 'medium',
    stem: 'A pitot tube facing directly into the airflow measures:',
    options: [
      { text: 'static pressure', why: 'Static pressure is sensed by flush static ports.' },
      { text: 'total (stagnation) pressure', why: 'Correct. Air is brought to rest in the tube: static + dynamic pressure.' },
      { text: 'dynamic pressure only', why: 'Dynamic pressure = total − static, worked out by the instrument.' },
      { text: 'altitude', why: 'The altimeter uses static pressure.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'ae-mc5', module: 'aero', topic: 'Fluid mechanics', difficulty: 'easy', diagram: 'venturi',
    stem: 'In the Venturi tube shown, compared with the wide inlet, the throat has:',
    options: [
      { text: 'higher speed and higher pressure', why: 'Bernoulli: faster flow has lower static pressure.' },
      { text: 'higher speed and lower pressure', why: 'Correct. Continuity raises the speed; Bernoulli lowers the static pressure.' },
      { text: 'lower speed and lower pressure', why: 'The smaller area forces the fluid to speed up.' },
      { text: 'the same speed and pressure', why: 'Area change causes speed and pressure changes.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'ae-mc6', module: 'aero', topic: 'Hydraulics', difficulty: 'medium',
    stem: 'A hydraulic actuator’s output piston has 20 times the area of the input piston. A 100 N input force produces an output force of:',
    options: [
      { text: '5 N', why: 'Inverted area ratio.' },
      { text: '100 N', why: 'Pressure is equal, not force.' },
      { text: '2000 N', why: 'Correct. F₂ = F₁ × A₂/A₁ = 100 × 20.' },
      { text: '40 000 N', why: 'Squared the area ratio — that applies to DIAMETER ratios only.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'ae-mc7', module: 'aero', topic: 'NDT', difficulty: 'medium',
    stem: 'The most suitable test for a suspected surface crack in an aluminium-alloy wing fitting is:',
    options: [
      { text: 'magnetic particle', why: 'Aluminium is not ferromagnetic.' },
      { text: 'dye penetrant', why: 'Correct. Works on any non-porous material for surface-breaking defects.' },
      { text: 'Charpy impact test', why: 'Destructive and does not find defects in a part.' },
      { text: 'Brinell hardness test', why: 'Measures hardness, not cracks.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'ae-mc8', module: 'aero', topic: 'Aluminium alloys', difficulty: 'hard',
    stem: 'The correct sequence for age (precipitation) hardening an Al–Cu alloy is:',
    options: [
      { text: 'quench → solution treat → age', why: 'Solution treatment must come first.' },
      { text: 'solution treat → quench → age', why: 'Correct. Dissolve Cu, trap it in supersaturated solution, then let fine precipitates form.' },
      { text: 'age → anneal → quench', why: 'Annealing would soften the alloy.' },
      { text: 'cold work → normalise → temper', why: 'These are steel processes.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'ae-mc9', module: 'aero', topic: 'Propulsion', difficulty: 'medium',
    stem: 'High-bypass turbofans are more fuel-efficient than turbojets at subsonic airliner speeds mainly because they:',
    options: [
      { text: 'burn fuel at higher temperature', why: 'Not the main reason.' },
      { text: 'accelerate a large mass of air by a small amount, improving propulsive efficiency', why: 'Correct. Less kinetic energy is wasted in the exhaust jet.' },
      { text: 'have no compressor', why: 'They have fan and compressor stages.' },
      { text: 'use supersonic combustion', why: 'That is a scramjet.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'ae-mc10', module: 'aero', topic: 'Propulsion', difficulty: 'easy',
    stem: 'Which engine has no moving parts and burns fuel in a supersonic airflow?',
    options: [
      { text: 'Turboprop', why: 'Has a gas-turbine core and propeller.' },
      { text: 'Ramjet', why: 'Has no moving parts but slows the air to subsonic for combustion.' },
      { text: 'Scramjet', why: 'Correct. Supersonic-combustion ramjet.' },
      { text: 'Piston engine', why: 'Many moving parts.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'ae-mc11', module: 'aero', topic: 'Corrosion', difficulty: 'medium',
    stem: 'Crevice corrosion in aircraft is most likely to occur:',
    options: [
      { text: 'on smooth, well-drained upper surfaces', why: 'Free surfaces stay aerated.' },
      { text: 'in lap joints and under fastener heads where moisture is trapped', why: 'Correct. Oxygen-depleted crevices become anodic.' },
      { text: 'only in titanium parts', why: 'Titanium is highly resistant.' },
      { text: 'only during flight at high altitude', why: 'Most corrosion occurs on the ground in humid/salty conditions.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'ae-mc12', module: 'aero', topic: 'Structures', difficulty: 'easy',
    stem: 'In semi-monocoque construction:',
    options: [
      { text: 'the skin carries no load', why: 'That is a truss (frame) structure covered with fabric.' },
      { text: 'the skin, frames, stringers and longerons share the loads', why: 'Correct. Thin skin is stabilised by internal members.' },
      { text: 'there are no internal members', why: 'That is pure monocoque.' },
      { text: 'only timber is used', why: 'Modern semi-monocoque structures are aluminium or composite.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'ae-mc13', module: 'aero', topic: 'Composites', difficulty: 'medium',
    stem: 'GLARE fibre-metal laminate is used for fuselage skins mainly because:',
    options: [
      { text: 'it is much cheaper than aluminium', why: 'It is more expensive.' },
      { text: 'glass-fibre layers bridge cracks in the aluminium layers, slowing fatigue crack growth', why: 'Correct. Excellent fatigue and impact resistance at lower weight.' },
      { text: 'it is fully transparent', why: 'It is not transparent.' },
      { text: 'it conducts electricity better than copper', why: 'It does not.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'ae-mc14', module: 'aero', topic: 'Flight mechanics', difficulty: 'hard',
    stem: 'An aircraft weighing 750 kN cruises in steady level flight with a lift-to-drag ratio of 15. The thrust required is:',
    options: [
      { text: '11 250 kN', why: 'Multiplied instead of divided.' },
      { text: '50 kN', why: 'Correct. L = W = 750 kN; D = L/15 = 50 kN; T = D.' },
      { text: '750 kN', why: 'That is the lift.' },
      { text: '15 kN', why: 'L/D is a ratio, not a force.' },
    ],
    answer: 1,
  }),
  // ════════════════ TELECOMMUNICATIONS — MCQ ════════════════
  mcq({
    id: 'te-mc1', module: 'telecom', topic: 'Logic', difficulty: 'easy',
    stem: 'The output of a two-input NAND gate is 0 when:',
    options: [
      { text: 'both inputs are 0', why: 'NAND gives 1 here.' },
      { text: 'either input is 0', why: 'Any 0 input makes NAND output 1.' },
      { text: 'both inputs are 1', why: 'Correct. NAND = NOT(A AND B).' },
      { text: 'the inputs are different', why: 'That describes XOR → 1.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'te-mc2', module: 'telecom', topic: 'Logic', difficulty: 'easy', diagram: 'logic-nor',
    stem: 'For the NOR gate shown with A = 0 and B = 1, the output Q is:',
    options: [
      { text: '0', why: 'Correct. NOR is 1 only when ALL inputs are 0.' },
      { text: '1', why: 'That is the OR output.' },
      { text: 'undefined', why: 'Logic gates always give a defined output for valid inputs.' },
      { text: 'equal to A', why: 'Coincidence for this row only — not the rule.' },
    ],
    answer: 0,
  }),
  mcq({
    id: 'te-mc3', module: 'telecom', topic: 'Logic', difficulty: 'medium', diagram: 'logic-nand-not',
    stem: 'The circuit shown feeds a NAND gate into a NOT gate. The whole circuit behaves as:',
    options: [
      { text: 'an OR gate', why: 'Check the row A = 1, B = 0: NAND = 1, NOT → 0.' },
      { text: 'an AND gate', why: 'Correct. Inverting a NAND output gives NOT(NOT(A·B)) = A·B.' },
      { text: 'a NOR gate', why: 'A NOR gives 1 only for 0,0.' },
      { text: 'a NAND gate', why: 'The NOT inverts the NAND output.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'te-mc4', module: 'telecom', topic: 'Modulation', difficulty: 'easy', diagram: 'am-fm',
    stem: 'In frequency modulation (FM):',
    options: [
      { text: 'the amplitude of the carrier varies with the message', why: 'That is AM.' },
      { text: 'the carrier frequency varies with the message while amplitude is constant', why: 'Correct.' },
      { text: 'the message is sent as light pulses', why: 'That describes optical transmission.' },
      { text: 'no carrier is used', why: 'FM modulates a carrier.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'te-mc5', module: 'telecom', topic: 'Modulation', difficulty: 'medium',
    stem: 'An AM transmitter is modulated by audio up to 5 kHz. The bandwidth required is:',
    options: [
      { text: '2.5 kHz', why: 'Halved instead of doubled.' },
      { text: '5 kHz', why: 'Each sideband is 5 kHz wide.' },
      { text: '10 kHz', why: 'Correct. Upper and lower sidebands: BW = 2 f_m.' },
      { text: '200 kHz', why: 'Typical of FM broadcast channel spacing.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'te-mc6', module: 'telecom', topic: 'Satellites', difficulty: 'easy',
    stem: 'A geostationary satellite:',
    options: [
      { text: 'orbits about 550 km up and crosses the sky in minutes', why: 'That describes LEO.' },
      { text: 'orbits about 35 786 km above the equator with a period of one sidereal day', why: 'Correct. It appears fixed relative to the ground.' },
      { text: 'orbits directly above Australia', why: 'Geostationary orbit must be above the equator.' },
      { text: 'has negligible signal delay', why: 'Ground–satellite–ground delay is about 0.24 s.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'te-mc7', module: 'telecom', topic: 'Spectrum', difficulty: 'medium',
    stem: 'The wavelength of a 100 MHz FM radio signal in free space is approximately:',
    options: [
      { text: '3 mm', why: 'That is 100 GHz.' },
      { text: '0.33 m', why: 'That would be about 900 MHz.' },
      { text: '3 m', why: 'Correct. λ = c/f = 3×10⁸ / 1×10⁸.' },
      { text: '300 m', why: 'That is about 1 MHz (AM band).' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'te-mc8', module: 'telecom', topic: 'Fibre optics', difficulty: 'easy', diagram: 'fibre',
    stem: 'Light is guided along an optical fibre by total internal reflection because:',
    options: [
      { text: 'the cladding has a higher refractive index than the core', why: 'It is the other way round.' },
      { text: 'the core has a higher refractive index than the cladding and rays strike the boundary above the critical angle', why: 'Correct.' },
      { text: 'the cladding is a silver mirror', why: 'Cladding is glass of slightly lower index.' },
      { text: 'the polymer buffer absorbs stray light', why: 'The buffer protects; it does not guide.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'te-mc9', module: 'telecom', topic: 'Fibre optics', difficulty: 'medium',
    stem: 'Single-mode fibre is preferred for long-distance links because it:',
    options: [
      { text: 'has a large core that accepts light easily from LEDs', why: 'That describes multimode.' },
      { text: 'eliminates modal dispersion, allowing high bandwidth over long distances', why: 'Correct. Only one propagation path exists.' },
      { text: 'is made of copper', why: 'It is glass.' },
      { text: 'is easier to splice than multimode', why: 'The tiny core makes alignment harder.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'te-mc10', module: 'telecom', topic: 'Semiconductors', difficulty: 'easy',
    stem: 'A Zener diode is mainly used to:',
    options: [
      { text: 'amplify signals', why: 'Transistors amplify.' },
      { text: 'emit coherent light', why: 'Laser diodes do this.' },
      { text: 'regulate voltage by conducting at its reverse breakdown voltage', why: 'Correct.' },
      { text: 'store charge', why: 'Capacitors store charge.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'te-mc11', module: 'telecom', topic: 'Semiconductors', difficulty: 'medium',
    stem: 'Laser diodes are preferred over LEDs for long-haul fibre links because laser light is:',
    options: [
      { text: 'coherent, high-power and very narrow in spectrum', why: 'Correct. Narrow spectrum reduces chromatic dispersion.' },
      { text: 'white light', why: 'Fibre systems use infrared.' },
      { text: 'cheaper to produce', why: 'Lasers cost more than LEDs.' },
      { text: 'emitted in all directions', why: 'LEDs emit broadly; lasers are directional.' },
    ],
    answer: 0,
  }),
  mcq({
    id: 'te-mc12', module: 'telecom', topic: 'Copper alloys', difficulty: 'medium',
    stem: 'Copper–beryllium is chosen for connector contact springs because it:',
    options: [
      { text: 'has the highest conductivity of any copper alloy', why: 'ETP copper conducts far better.' },
      { text: 'can be age-hardened to very high strength and has good fatigue/spring properties while still conducting', why: 'Correct.' },
      { text: 'is the cheapest copper alloy', why: 'It is expensive.' },
      { text: 'is a thermosetting polymer', why: 'It is a metal alloy.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'te-mc13', module: 'telecom', topic: 'Analogue & digital', difficulty: 'easy',
    stem: 'An analogue signal is quantised using 8 bits per sample. The number of quantisation levels is:',
    options: [
      { text: '8', why: 'That is the number of bits.' },
      { text: '16', why: 'That is 2⁴.' },
      { text: '64', why: 'That is 2⁶.' },
      { text: '256', why: 'Correct. 2⁸ = 256.' },
    ],
    answer: 3,
  }),
  mcq({
    id: 'te-mc14', module: 'telecom', topic: 'Television', difficulty: 'medium',
    stem: 'Which display technology needs a separate backlight?',
    options: [
      { text: 'OLED', why: 'Each OLED pixel emits its own light.' },
      { text: 'Plasma', why: 'Each cell emits via phosphors.' },
      { text: 'LCD', why: 'Correct. Liquid crystals only modulate light from a backlight (now usually LEDs).' },
      { text: 'CRT', why: 'Phosphors glow when struck by the electron beam.' },
    ],
    answer: 2,
  }),
  mcq({
    id: 'te-mc15', module: 'telecom', topic: 'Satellites', difficulty: 'medium',
    stem: 'A GPS receiver needs signals from at least four satellites to fix a 3D position because:',
    options: [
      { text: 'each satellite only transmits one coordinate', why: 'Each satellite transmits its position and time.' },
      { text: 'three ranges fix position, and a fourth solves the receiver’s clock error', why: 'Correct. Four unknowns: x, y, z and clock offset.' },
      { text: 'satellites are geostationary', why: 'GPS satellites are in medium Earth orbit.' },
      { text: 'it uses AM modulation', why: 'Irrelevant to the geometry.' },
    ],
    answer: 1,
  }),
  mcq({
    id: 'te-mc16', module: 'telecom', topic: 'Analogue & digital', difficulty: 'easy',
    stem: 'A key advantage of digital over analogue transmission is that:',
    options: [
      { text: 'digital needs no bandwidth', why: 'All signals need bandwidth.' },
      { text: 'digital signals can be regenerated at repeaters, removing accumulated noise', why: 'Correct.' },
      { text: 'digital signals cannot be encrypted', why: 'Digital signals are easily encrypted.' },
      { text: 'digital reception degrades gradually', why: 'Digital tends to fail abruptly (cliff effect).' },
    ],
    answer: 1,
  }),

  // ════════════════ SHORT ANSWER ════════════════
  short({
    id: 'cs-sa1', module: 'civil', topic: 'Composites', difficulty: 'easy', marks: 3,
    stem: 'Explain why steel reinforcement is placed near the bottom of a simply supported reinforced-concrete beam.',
    criteria: [
      { marks: '3', text: 'Explains that sagging puts the bottom in tension, that concrete is weak in tension, and that steel carries the tensile stress (bonded to the concrete).' },
      { marks: '2', text: 'Identifies that the bottom is in tension and that steel is strong in tension.' },
      { marks: '1', text: 'Provides some relevant information.' },
    ],
    features: ['Bottom fibres in tension under sagging bending', 'Concrete has low tensile strength (≈ 10% of compressive)', 'Steel has high tensile strength', 'Bond transfers stress between steel and concrete'],
    sample: 'Under downward loads a simply supported beam sags, so the bottom fibres are in tension and the top in compression. Concrete is strong in compression but weak in tension, so it would crack and fail at the bottom. Steel bars bonded to the concrete in the tension zone carry the tensile stress, while the concrete above the neutral axis carries the compression.',
  }),
  short({
    id: 'cs-sa2', module: 'civil', topic: 'Composites', difficulty: 'medium', marks: 4,
    stem: 'Describe the process of post-tensioning a concrete slab and outline ONE advantage over conventional reinforced concrete.',
    criteria: [
      { marks: '4', text: 'Correct sequence (ducts placed, concrete cast and cured, tendons stressed with jacks, anchored, ducts grouted) AND a valid advantage with reason.' },
      { marks: '3', text: 'Mostly correct sequence and an advantage.' },
      { marks: '2', text: 'Some correct steps OR an advantage.' },
      { marks: '1', text: 'Some relevant information.' },
    ],
    features: ['Ducts/sheaths and tendons placed before casting', 'Concrete hardens to required strength', 'Tendons stressed with hydraulic jacks AFTER hardening', 'Tendons anchored at ends; ducts grouted', 'Advantage: thinner slabs/longer spans/less cracking'],
    sample: 'Plastic or steel ducts containing high-tensile strands are positioned (often draped) in the formwork and the slab is cast. Once the concrete has gained sufficient strength, hydraulic jacks tension the strands, which are locked off at anchorages and the ducts are grouted. The pre-compression counteracts tension from service loads, so post-tensioned slabs can span further with thinner sections and less cracking than conventionally reinforced slabs.',
  }),
  short({
    id: 'cs-sa3', module: 'civil', topic: 'Environment', difficulty: 'hsc', marks: 6,
    stem: 'Critically examine the environmental implications of the materials used in modern civil structures. Refer to at least TWO materials.',
    criteria: [
      { marks: '5–6', text: 'Makes informed judgements about environmental impacts (embodied energy/CO₂, resource extraction, waste, recyclability) of at least two materials, with specific examples and mitigation strategies.' },
      { marks: '3–4', text: 'Describes environmental impacts of two materials with some judgement.' },
      { marks: '2', text: 'Outlines some environmental impacts.' },
      { marks: '1', text: 'Provides some relevant information.' },
    ],
    features: ['Cement: CO₂ from calcination and kiln fuel', 'Mitigation: fly ash/slag, geopolymer, recycled aggregate', 'Steel: energy intensive but highly recyclable', 'Timber: renewable, stores carbon; sustainable forestry needed', 'Quarrying/landscape impacts', 'A judgement (e.g. which strategy is most effective and why)'],
    sample: 'Concrete is the most-used construction material and its cement binder has a large carbon footprint: calcining limestone releases CO₂ and kilns burn fossil fuel. Replacing part of the cement with fly ash or slag, or using geopolymer concrete, substantially reduces emissions while maintaining durability, so specifying blended cements is a high-impact, low-cost improvement. Steel is energy-intensive to make, but structural steel can be recycled repeatedly without loss of properties, so design for disassembly greatly improves its life-cycle impact. Engineered timber (CLT, glulam) is renewable and stores carbon, but only if sourced from certified plantations and protected from decay. Overall, the greatest gains come from reducing cement content and maximising reuse and recycling.',
  }),
  short({
    id: 'cs-sa4', module: 'civil', topic: 'Stress & strain', difficulty: 'easy', marks: 2,
    stem: 'Distinguish between yield stress and 0.2% proof stress.',
    criteria: [
      { marks: '2', text: 'Defines yield stress as the stress at which plastic deformation begins AND proof stress as the stress causing 0.2% permanent strain, used when no distinct yield point exists.' },
      { marks: '1', text: 'Defines one correctly.' },
    ],
    features: ['Yield: onset of plastic (permanent) deformation', 'Proof stress: 0.2% offset method', 'Used for materials without a distinct yield point (e.g. aluminium)'],
    sample: 'Yield stress is the stress at which a material begins to deform plastically, clearly visible in mild steel. Proof stress is used when there is no distinct yield point: it is the stress that produces a permanent strain of 0.2%, found by drawing a line parallel to the elastic region from 0.2% strain.',
  }),
  short({
    id: 'pt-sa1', module: 'transport', topic: 'Heat treatment', difficulty: 'medium', marks: 3,
    stem: 'Explain how tempering changes the microstructure and properties of a quenched medium-carbon steel.',
    criteria: [
      { marks: '3', text: 'Links reheating below the lower critical temperature to martensite transforming to tempered martensite (fine carbides, stress relief) AND states reduced hardness/brittleness with increased toughness.' },
      { marks: '2', text: 'States tempering increases toughness and reduces brittleness with some microstructural reference.' },
      { marks: '1', text: 'Some relevant information.' },
    ],
    features: ['Reheat below A₁ (≈ 150–650 °C)', 'Martensite → tempered martensite / fine carbide precipitation', 'Internal stresses relieved', 'Hardness decreases slightly; toughness increases'],
    sample: 'Quenched steel consists of hard, brittle martensite with high internal stresses. Tempering reheats it below the lower critical temperature, allowing carbon to precipitate as fine carbides and relieving the lattice strain. The resulting tempered martensite is slightly less hard but much tougher, so the part resists impact without cracking.',
  }),
  short({
    id: 'pt-sa2', module: 'transport', topic: 'Glass', difficulty: 'medium', marks: 4,
    stem: 'Compare laminated glass and toughened glass for use in a bus.',
    criteria: [
      { marks: '4', text: 'Describes the structure/processing of both AND compares fracture behaviour and appropriate locations (windscreen vs side/rear windows), with reasons.' },
      { marks: '3', text: 'Describes both and makes a comparison.' },
      { marks: '2', text: 'Describes one type or gives limited comparison.' },
      { marks: '1', text: 'Some relevant information.' },
    ],
    features: ['Laminated: glass + PVB interlayer', 'Laminated: fragments held, penetration resistance → windscreen', 'Toughened: heated ≈ 620 °C then air-quenched; surface compression', 'Toughened: stronger, breaks into small blunt pieces → side windows/emergency exits', 'Toughened cannot be cut after processing'],
    sample: 'Laminated glass bonds two glass sheets to a PVB interlayer; when struck it cracks but the fragments stay attached, keeping visibility and preventing occupant ejection, so it is used for the windscreen. Toughened glass is heated and rapidly air-quenched so its surfaces are in compression, making it several times stronger; when it fails it breaks into small blunt pieces, which suits side windows and emergency-exit windows that may need to be broken. Laminated glass is heavier and dearer, while toughened glass cannot be cut once processed.',
  }),
  short({
    id: 'pt-sa3', module: 'transport', topic: 'Control', difficulty: 'hard', marks: 5,
    stem: 'Describe how a closed-loop control system maintains a constant speed in a car with cruise control.',
    criteria: [
      { marks: '5', text: 'Identifies set-point, sensor, comparator (error), controller and actuator, explains feedback reducing error on a hill, and contrasts with open-loop.' },
      { marks: '3–4', text: 'Describes feedback with most elements.' },
      { marks: '1–2', text: 'Outlines that speed is measured and adjusted.' },
    ],
    features: ['Set-point speed chosen by driver', 'Sensor measures actual speed (wheel-speed sensor)', 'Comparator calculates error', 'Controller adjusts throttle / motor current (actuator)', 'Continuous feedback loop', 'Example: uphill → speed falls → more power'],
    sample: 'The driver sets a desired speed (set-point). A wheel-speed sensor continuously measures the actual speed and the controller compares the two to find the error. If the car slows on a hill, the error is positive and the controller signals the actuator — the throttle or, in an EV, the motor inverter — to increase power until the error returns to zero; downhill it reduces power or applies regenerative braking. Because the output is measured and fed back, the system corrects disturbances automatically, unlike open-loop control.',
  }),
  short({
    id: 'pt-sa4', module: 'transport', topic: 'Society & environment', difficulty: 'hsc', marks: 8,
    stem: 'Analyse the impact of electric vehicles on society and the environment in Australia.',
    criteria: [
      { marks: '7–8', text: 'Comprehensive analysis of social, environmental and economic impacts with relationships and implications drawn (grid mix, battery materials, infrastructure, equity, urban air quality), supported by specific examples and engineering reasoning.' },
      { marks: '5–6', text: 'Thorough description of several impacts with some analysis.' },
      { marks: '3–4', text: 'Describes some impacts.' },
      { marks: '1–2', text: 'Some relevant information.' },
    ],
    features: ['Zero tailpipe emissions → urban air quality, health', 'Life-cycle CO₂ depends on grid electricity mix', 'Battery materials: lithium/cobalt mining, recycling', 'Charging infrastructure; range in regional areas', 'Higher efficiency of electric motors; regenerative braking', 'Cost and equity (purchase price, access to home charging)', 'Effect on fuel-excise road funding and jobs', 'Judgement/implications linking the points'],
    sample: 'Electric vehicles convert stored electrical energy to motion far more efficiently than combustion engines and recover energy by regenerative braking, eliminating tailpipe emissions and improving urban air quality and health. However, their life-cycle greenhouse benefit depends on how the electricity is generated: as Australia’s grid gains renewables, the advantage grows. Batteries need lithium, nickel and other minerals — an economic opportunity for Australian mining but with environmental impacts, so battery recycling is essential. Socially, high purchase prices and limited charging in regional areas create equity issues, and declining fuel-excise revenue challenges road funding. Overall, EVs reduce environmental impact most when combined with renewable generation, recycling and investment in charging infrastructure.',
  }),
  short({
    id: 'ae-sa1', module: 'aero', topic: 'Lift', difficulty: 'medium', marks: 3,
    stem: 'Explain how an aerofoil generates lift.',
    criteria: [
      { marks: '3', text: 'Explains that the wing’s shape and angle of attack turn airflow downward (reaction force upward) AND that faster flow over the upper surface has lower pressure (Bernoulli), giving a net upward pressure force.' },
      { marks: '2', text: 'Explains one mechanism correctly.' },
      { marks: '1', text: 'Some relevant information.' },
    ],
    features: ['Camber and angle of attack deflect air downward (downwash)', 'Newton’s third law: air pushes wing up', 'Air speeds up over the upper surface → lower static pressure (Bernoulli)', 'Pressure difference × wing area = lift', 'Does NOT use “equal transit time”'],
    sample: 'An aerofoil’s camber and angle of attack turn the oncoming air downward; by Newton’s third law the air exerts an upward reaction on the wing. The same flow pattern means air over the upper surface travels faster and, by Bernoulli’s principle, has lower static pressure than the air below. The pressure difference acting over the wing area produces lift.',
  }),
  short({
    id: 'ae-sa2', module: 'aero', topic: 'NDT', difficulty: 'easy', marks: 4,
    stem: 'Describe how dye-penetrant testing detects cracks in an aircraft component, and state ONE limitation.',
    criteria: [
      { marks: '4', text: 'Correct sequence (clean, apply penetrant, dwell, remove excess, apply developer, inspect — often under UV) AND a valid limitation.' },
      { marks: '3', text: 'Mostly correct sequence and limitation.' },
      { marks: '2', text: 'Some steps or a limitation.' },
      { marks: '1', text: 'Some relevant information.' },
    ],
    features: ['Clean/degrease surface', 'Apply penetrant; capillary action draws it into cracks (dwell time)', 'Remove excess from surface', 'Apply developer which draws penetrant out', 'Inspect (visible or fluorescent under UV)', 'Limitation: surface-breaking defects only / not porous materials'],
    sample: 'The surface is cleaned, then a coloured or fluorescent penetrant is applied and left so capillary action draws it into any surface-breaking cracks. Excess penetrant is wiped off and a white developer is applied, which draws penetrant back out of the cracks so they show as bright lines (under UV light for fluorescent dyes). It only detects defects open to the surface and cannot be used on porous materials.',
  }),
  short({
    id: 'ae-sa3', module: 'aero', topic: 'Aluminium alloys', difficulty: 'hard', marks: 5,
    stem: 'Explain the age-hardening of an aluminium–copper alloy with reference to its microstructure and properties.',
    criteria: [
      { marks: '5', text: 'Explains solution treatment (Cu dissolves), quenching (supersaturated solid solution), ageing (fine coherent precipitates), and how precipitates block dislocations increasing strength; mentions over-ageing.' },
      { marks: '3–4', text: 'Describes the three stages with some reference to microstructure.' },
      { marks: '1–2', text: 'Outlines that heat treatment increases strength.' },
    ],
    features: ['Solution treatment ≈ 500 °C: Cu dissolves into α-Al', 'Quench: supersaturated solid solution', 'Ageing (natural or artificial): fine precipitates form', 'Precipitates impede dislocation movement → higher strength/hardness', 'Over-ageing coarsens precipitates → strength falls'],
    sample: 'The alloy is first solution treated at about 500 °C so the copper dissolves completely in the aluminium. Rapid quenching traps the copper in a supersaturated solid solution. During ageing at room temperature or a low elevated temperature, extremely fine copper-rich precipitates form throughout the grains. These precipitates distort the lattice and obstruct dislocation movement, greatly raising strength and hardness (e.g. 2024-T3). If aged too long or too hot, the precipitates coarsen and strength falls (over-ageing).',
  }),
  short({
    id: 'ae-sa4', module: 'aero', topic: 'Scope of profession', difficulty: 'hsc', marks: 6,
    stem: 'Evaluate the ethical and legal responsibilities of aeronautical engineers involved in aircraft maintenance.',
    criteria: [
      { marks: '5–6', text: 'Makes a judgement about the importance of ethical and legal responsibilities, supported by specific examples (CASA regulations, certification, Engineers Australia Code of Ethics, whistleblowing, cost vs safety pressures, accident investigation).' },
      { marks: '3–4', text: 'Describes several responsibilities with some evaluation.' },
      { marks: '1–2', text: 'Outlines some responsibilities.' },
    ],
    features: ['Public safety as the paramount duty', 'Legal: CASA airworthiness regulations, licences and sign-offs', 'Accurate records and certification of work', 'Resisting commercial pressure to defer maintenance', 'Reporting defects/incidents (ATSB); whistleblowing', 'Engineers Australia Code of Ethics', 'Judgement/evaluation'],
    sample: 'Aeronautical engineers who certify maintenance hold legal responsibility under CASA regulations: they must perform and sign off work to approved data and keep accurate records, and falsifying them is a criminal offence. Ethically, the Engineers Australia Code of Ethics requires them to put public safety first, practise competently and act with integrity, even when airlines face cost and schedule pressure to defer repairs. Incidents such as fatigue and corrosion failures show that small lapses can be catastrophic, so reporting defects and supporting investigations by the ATSB is essential. Overall these responsibilities are vital because public trust in aviation depends on engineers refusing to compromise safety.',
  }),
  short({
    id: 'te-sa1', module: 'telecom', topic: 'Analogue & digital', difficulty: 'easy', marks: 2,
    stem: 'Outline ONE advantage of digital transmission compared with analogue transmission.',
    criteria: [
      { marks: '2', text: 'States an advantage AND explains why (e.g. regeneration removes noise because the receiver only has to distinguish two levels).' },
      { marks: '1', text: 'States an advantage.' },
    ],
    features: ['Noise immunity / regeneration', 'Error detection and correction', 'Compression and encryption', 'Multiplexing more channels'],
    sample: 'Digital signals can be regenerated at repeaters: because the receiver only has to decide between two levels, noise picked up along the link is removed rather than amplified, so quality does not degrade with distance.',
  }),
  short({
    id: 'te-sa2', module: 'telecom', topic: 'Fibre optics', difficulty: 'medium', marks: 3,
    stem: 'Explain how light is transmitted along a step-index optical fibre.',
    criteria: [
      { marks: '3', text: 'Refers to core with higher refractive index than cladding, light striking the boundary at greater than the critical angle, and total internal reflection guiding it along the fibre.' },
      { marks: '2', text: 'Mentions total internal reflection with partial explanation.' },
      { marks: '1', text: 'Some relevant information.' },
    ],
    features: ['Core n₁ > cladding n₂', 'Light enters within the acceptance angle', 'Angle of incidence at boundary > critical angle', 'Total internal reflection repeatedly along fibre'],
    sample: 'The glass core has a slightly higher refractive index than the surrounding cladding. Light launched within the acceptance angle strikes the core–cladding boundary at more than the critical angle, so it is totally internally reflected. Repeated reflections guide the light along the core with very little loss.',
  }),
  short({
    id: 'te-sa3', module: 'telecom', topic: 'Satellites', difficulty: 'hard', marks: 4,
    stem: 'Compare geostationary and low-Earth-orbit satellites for providing internet to remote Australian communities.',
    criteria: [
      { marks: '4', text: 'Compares orbit altitude, latency, coverage, number of satellites and ground equipment for both, with implications for internet use.' },
      { marks: '3', text: 'Compares several features.' },
      { marks: '2', text: 'Describes features of one or makes a limited comparison.' },
      { marks: '1', text: 'Some relevant information.' },
    ],
    features: ['GEO ≈ 35 786 km, fixed position, fixed dish', 'GEO latency ≈ 0.24 s one-way → poor for video calls/gaming', 'Few GEO satellites cover large areas', 'LEO ≈ 500–1200 km, low latency', 'LEO needs large constellations and tracking (phased-array) terminals', 'Cost/capacity/weather considerations'],
    sample: 'Geostationary satellites orbit 35 786 km above the equator, so one satellite covers a huge area and a simple fixed dish can be used; however the signal path gives about a quarter-second one-way delay, which makes video calls and online gaming poor. Low-Earth-orbit satellites orbit only a few hundred to about a thousand kilometres up, giving latency similar to terrestrial broadband, but each moves across the sky quickly, so hundreds or thousands of satellites and tracking user terminals are needed. LEO therefore suits interactive internet in remote communities, while GEO remains cost-effective for broadcasting.',
  }),
  short({
    id: 'te-sa4', module: 'telecom', topic: 'Television', difficulty: 'hsc', marks: 5,
    stem: 'Describe the change from analogue to digital television in Australia and its effects on society.',
    criteria: [
      { marks: '5', text: 'Describes the technical change (analogue → digital compression/multiplexing, set-top boxes, switchover by 2013) and several effects (more channels, HD, spectrum freed for mobile broadband, e-waste of CRTs, reception cliff effect).' },
      { marks: '3–4', text: 'Describes the change and some effects.' },
      { marks: '1–2', text: 'Outlines some relevant information.' },
    ],
    features: ['Analogue: one programme per channel; ghosting/snow', 'Digital: compression and multiplexing of several channels', 'Switchover completed 2013 (simulcast from 2001)', 'More channels, HD, EPG, better picture', 'Spectrum (“digital dividend”) re-used for 4G', 'E-waste from discarded CRT TVs; cost of new equipment'],
    sample: 'Analogue television sent one programme per channel and suffered snow and ghosting. Digital transmission compresses video and multiplexes several programmes in the same bandwidth, allowing extra channels, high-definition pictures and electronic programme guides. After simulcasting from 2001, analogue was switched off by 2013, which required viewers to buy set-top boxes or new TVs and created large volumes of CRT e-waste. The freed spectrum was re-allocated to 4G mobile broadband, improving mobile internet across Australia.',
  }),

  // ════════════════ CALCULATIONS ════════════════
  calc({
    id: 'cs-c1', module: 'civil', topic: 'Beams', difficulty: 'medium', marks: 4, diagram: 'beam-8m',
    stem: 'A simply supported beam of span 8.0 m carries a 10 kN point load 2.0 m from A and a 20 kN point load 5.0 m from A.',
    parts: [
      { label: 'Reaction at B', answer: 15, unit: 'kN', working: ['\\Sigma M_A = 0: R_B(8) = 10(2) + 20(5) = 120', 'R_B = 15\\ \\text{kN}'] },
      { label: 'Reaction at A', answer: 15, unit: 'kN', working: ['R_A = 30 - 15 = 15\\ \\text{kN}'] },
      { label: 'Maximum bending moment', answer: 45, unit: 'kN·m', working: ['M_{2} = 15(2) = 30\\ \\text{kN·m}', 'M_{5} = 15(5) - 10(3) = 45\\ \\text{kN·m}', 'V changes sign at x = 5 m, so M_{\\max} = 45\\ \\text{kN·m}'], traps: [{ value: 30, msg: 'That is the moment under the 10 kN load; the shear force changes sign under the 20 kN load.' }, { value: 60, msg: 'Check the moment of the 10 kN load about x = 5 m (lever arm 3 m).' }] },
    ],
  }),
  calc({
    id: 'cs-c2', module: 'civil', topic: 'Bending stress', difficulty: 'medium', marks: 3,
    stem: 'A symmetric steel beam 300 mm deep is subjected to a maximum bending moment of 45 kN·m. Its second moment of area is 120 × 10⁶ mm⁴. Calculate the maximum bending stress.',
    parts: [
      { label: 'Maximum bending stress', answer: 56.25, unit: 'MPa', working: ['y_{\\max} = 300/2 = 150\\ \\text{mm}', 'M = 45 \\times 10^6\\ \\text{N·mm}', '\\sigma = \\dfrac{45\\times10^6 \\times 150}{120 \\times 10^6} = 56.25\\ \\text{MPa}'], traps: [{ value: 112.5, msg: 'You used the full depth (300 mm). y is measured from the neutral axis — use 150 mm.' }] },
    ],
  }),
  calc({
    id: 'cs-c3', module: 'civil', topic: 'Trusses', difficulty: 'medium', marks: 4, diagram: 'truss-triangle',
    stem: 'A symmetric triangular truss has a span AB of 8.0 m and an apex C 3.0 m above AB. A 24 kN vertical load acts at C. A is a pin and B a roller. Use tension-positive values.',
    parts: [
      { label: 'Reaction at A (vertical)', answer: 12, unit: 'kN', working: ['\\text{Symmetric: } R_A = R_B = 24/2 = 12\\ \\text{kN}'] },
      { label: 'Force in AC (negative = compression)', answer: -20, unit: 'kN', working: ['\\sin\\theta = 3/5 = 0.6,\\ \\cos\\theta = 0.8', '\\text{Joint A: } \\Sigma F_y: 12 + F_{AC}(0.6) = 0', 'F_{AC} = -20\\ \\text{kN (compression)}'], traps: [{ value: 20, msg: 'Magnitude correct, but AC pushes on the joint — it is in COMPRESSION (negative).' }, { value: -15, msg: 'Use sin θ = 3/5 (the member length is 5 m).' }] },
      { label: 'Force in AB', answer: 16, unit: 'kN', working: ['\\Sigma F_x: F_{AB} + F_{AC}(0.8) = 0', 'F_{AB} = 16\\ \\text{kN (tension)}'], traps: [{ value: -16, msg: 'AB is the tie — it is in tension (positive).' }] },
    ],
  }),
  calc({
    id: 'cs-c4', module: 'civil', topic: 'Stress & strain', difficulty: 'easy', marks: 4,
    stem: 'A 16 mm diameter steel rod, 1.5 m long, carries an axial tensile load of 30 kN. E = 200 GPa.',
    parts: [
      { label: 'Stress', answer: 149.21, unit: 'MPa', working: ['A = \\pi(16)^2/4 = 201.06\\ \\text{mm}^2', '\\sigma = 30\\,000/201.06 = 149.2\\ \\text{MPa}'], traps: [{ value: 37.3, msg: 'You used πd² without dividing by 4 (or used d as radius).' }] },
      { label: 'Strain', answer: 7.4604e-4, unit: '', tol: 0.01, working: ['\\varepsilon = \\sigma/E = 149.2/200\\,000 = 7.46\\times10^{-4}'] },
      { label: 'Extension', answer: 1.1191, unit: 'mm', working: ['\\Delta L = \\varepsilon L = 7.46\\times10^{-4} \\times 1500 = 1.12\\ \\text{mm}'], traps: [{ value: 0.0011191, msg: 'Multiply by the length in mm (1500 mm) to get mm.' }] },
    ],
  }),
  calc({
    id: 'cs-c5', module: 'civil', topic: 'Factor of safety', difficulty: 'hard', marks: 3,
    stem: 'A round steel tie must carry 60 kN. The steel has a yield stress of 250 MPa and a factor of safety of 2.0 (based on yield) is required. Find the minimum diameter.',
    parts: [
      { label: 'Working stress', answer: 125, unit: 'MPa', working: ['\\sigma_w = 250/2 = 125\\ \\text{MPa}'] },
      { label: 'Minimum diameter', answer: 24.72, unit: 'mm', working: ['A = 60\\,000/125 = 480\\ \\text{mm}^2', 'd = \\sqrt{4 \\times 480/\\pi} = 24.7\\ \\text{mm}'], traps: [{ value: 12.36, msg: 'That is the radius — double it.' }, { value: 17.48, msg: 'You used the yield stress without the factor of safety.' }] },
    ],
  }),
  calc({
    id: 'pt-c1', module: 'transport', topic: 'Friction', difficulty: 'hard', marks: 4, diagram: 'incline',
    stem: 'A 50 kg crate rests on a 25° ramp. μ_s = 0.30. Take g = 9.81 m/s².',
    parts: [
      { label: 'Normal reaction', answer: 444.55, unit: 'N', working: ['N = mg\\cos 25^\\circ = 50(9.81)(0.9063) = 444.6\\ \\text{N}'], traps: [{ value: 490.5, msg: 'On a slope N = mg cos θ, not mg.' }] },
      { label: 'Maximum friction', answer: 133.36, unit: 'N', working: ['F_{\\max} = 0.30 \\times 444.6 = 133.4\\ \\text{N}'] },
      { label: 'Net force down the slope (0 if it does not slide)', answer: 73.93, unit: 'N', working: ['mg\\sin 25^\\circ = 207.3\\ \\text{N} > 133.4\\ \\text{N} \\Rightarrow \\text{slides}', 'F_{net} = 207.3 - 133.4 = 73.9\\ \\text{N}'] },
    ],
  }),
  calc({
    id: 'pt-c2', module: 'transport', topic: 'Energy', difficulty: 'medium', marks: 3,
    stem: 'A 1400 kg car travelling at 72 km/h brakes uniformly to rest over 40 m.',
    parts: [
      { label: 'Initial kinetic energy', answer: 280000, unit: 'J', working: ['v = 72/3.6 = 20\\ \\text{m/s}', 'E_k = \\tfrac12(1400)(20)^2 = 280\\,000\\ \\text{J}'], traps: [{ value: 3628800, msg: 'Convert km/h to m/s (÷ 3.6) before squaring.' }] },
      { label: 'Average braking force', answer: 7000, unit: 'N', working: ['W = Fs \\Rightarrow F = 280\\,000/40 = 7000\\ \\text{N}'] },
    ],
  }),
  calc({
    id: 'pt-c3', module: 'transport', topic: 'Power', difficulty: 'medium', marks: 3,
    stem: 'A 12 t bus climbs a hill, gaining 30 m in height in 60 s. Ignore losses.',
    parts: [
      { label: 'Gain in potential energy', answer: 3531600, unit: 'J', working: ['E_p = 12\\,000(9.81)(30) = 3.53\\times10^6\\ \\text{J}'] },
      { label: 'Power required', answer: 58860, unit: 'W', working: ['P = 3.5316\\times10^6/60 = 58\\,860\\ \\text{W} \\approx 58.9\\ \\text{kW}'] },
    ],
  }),
  calc({
    id: 'pt-c4', module: 'transport', topic: 'Machines', difficulty: 'easy', marks: 2,
    stem: 'A hoist with VR = 5 lifts a 1200 N load with an effort of 300 N.',
    parts: [
      { label: 'Mechanical advantage', answer: 4, unit: '', working: ['MA = 1200/300 = 4'] },
      { label: 'Efficiency', answer: 80, unit: '%', working: ['\\eta = 4/5 \\times 100 = 80\\%'], traps: [{ value: 125, msg: 'Inverted: η = MA/VR.' }] },
    ],
  }),
  calc({
    id: 'pt-c5', module: 'transport', topic: 'Electricity', difficulty: 'easy', marks: 2,
    stem: 'A light-rail vehicle draws 250 A from a 600 V DC supply for 90 s while accelerating.',
    parts: [
      { label: 'Electrical power', answer: 150, unit: 'kW', working: ['P = VI = 600 \\times 250 = 150\\,000\\ \\text{W}'] },
      { label: 'Energy used', answer: 13.5, unit: 'MJ', working: ['E = Pt = 150\\,000 \\times 90 = 13.5 \\times 10^6\\ \\text{J}'] },
    ],
  }),
  calc({
    id: 'ae-c1', module: 'aero', topic: 'Hydraulics', difficulty: 'medium', marks: 3,
    stem: 'In an aircraft brake system, a 150 N force acts on a 15 mm diameter master piston. The slave piston is 45 mm in diameter.',
    parts: [
      { label: 'System pressure', answer: 0.84883, unit: 'MPa', working: ['A_1 = \\pi(15)^2/4 = 176.7\\ \\text{mm}^2', 'p = 150/176.7 = 0.849\\ \\text{MPa}'] },
      { label: 'Force at slave piston', answer: 1350, unit: 'N', working: ['F_2 = 150 \\times (45/15)^2 = 1350\\ \\text{N}'], traps: [{ value: 450, msg: 'Use the AREA ratio — the diameter ratio squared.' }] },
    ],
  }),
  calc({
    id: 'ae-c2', module: 'aero', topic: 'Pitot tube', difficulty: 'medium', marks: 2,
    stem: 'A pitot-static system at sea level (ρ = 1.225 kg/m³) measures a difference between total and static pressure of 2.45 kPa. Find the airspeed.',
    parts: [{ label: 'Airspeed', answer: 63.246, unit: 'm/s', working: ['v = \\sqrt{2(2450)/1.225} = \\sqrt{4000} = 63.2\\ \\text{m/s}'], traps: [{ value: 44.72, msg: 'Include the factor of 2: v = √(2Δp/ρ).' }] }],
  }),
  calc({
    id: 'ae-c3', module: 'aero', topic: 'Bernoulli', difficulty: 'medium', marks: 2,
    stem: 'Air (ρ = 1.225 kg/m³) flows at 50 m/s under a wing and 70 m/s over it. Assuming Bernoulli applies, find the pressure difference.',
    parts: [{ label: 'Pressure difference', answer: 1470, unit: 'Pa', working: ['\\Delta p = \\tfrac12(1.225)(70^2 - 50^2) = 1470\\ \\text{Pa}'], traps: [{ value: 245, msg: 'Square each speed before subtracting: 70² − 50² ≠ (70 − 50)².' }] }],
  }),
  calc({
    id: 'ae-c4', module: 'aero', topic: 'Hydrostatic pressure', difficulty: 'easy', marks: 2,
    stem: 'Find the gauge pressure at the bottom of a fuel tank containing 1.8 m depth of fuel (ρ = 800 kg/m³).',
    parts: [{ label: 'Pressure', answer: 14126.4, unit: 'Pa', working: ['p = \\rho g h = 800(9.81)(1.8) = 14\\,126\\ \\text{Pa}'] }],
  }),
  calc({
    id: 'ae-c5', module: 'aero', topic: 'Flight mechanics', difficulty: 'easy', marks: 2,
    stem: 'A light aircraft weighing 12 kN flies straight and level at constant speed with L/D = 10.',
    parts: [
      { label: 'Lift', answer: 12, unit: 'kN', working: ['L = W = 12\\ \\text{kN}'] },
      { label: 'Thrust', answer: 1.2, unit: 'kN', working: ['T = D = L/(L/D) = 12/10 = 1.2\\ \\text{kN}'] },
    ],
  }),
  calc({
    id: 'te-c1', module: 'telecom', topic: 'Spectrum', difficulty: 'easy', marks: 1,
    stem: 'Find the free-space wavelength of a 2.4 GHz Wi-Fi signal (c = 3.00 × 10⁸ m/s).',
    parts: [{ label: 'Wavelength', answer: 0.125, unit: 'm', working: ['\\lambda = 3.00\\times10^8 / 2.4\\times10^9 = 0.125\\ \\text{m}'] }],
  }),
  calc({
    id: 'te-c2', module: 'telecom', topic: 'Digital', difficulty: 'easy', marks: 2,
    stem: 'Telephone speech is sampled at 8 kHz with 8 bits per sample (one channel).',
    parts: [
      { label: 'Bit rate', answer: 64, unit: 'kbit/s', working: ['8000 \\times 8 = 64\\,000\\ \\text{bit/s}'] },
      { label: 'Quantisation levels', answer: 256, unit: '', working: ['2^8 = 256'] },
    ],
  }),
  calc({
    id: 'te-c3', module: 'telecom', topic: 'Semiconductors', difficulty: 'hard', marks: 3,
    stem: 'A 5.1 V Zener regulator is supplied from 12 V through a 220 Ω series resistor and feeds a 1.0 kΩ load.',
    parts: [
      { label: 'Current in series resistor', answer: 31.364, unit: 'mA', working: ['I_s = (12 - 5.1)/220 = 31.4\\ \\text{mA}'] },
      { label: 'Load current', answer: 5.1, unit: 'mA', working: ['I_L = 5.1/1000 = 5.1\\ \\text{mA}'] },
      { label: 'Zener current', answer: 26.264, unit: 'mA', working: ['I_Z = 31.4 - 5.1 = 26.3\\ \\text{mA}'] },
    ],
  }),
  calc({
    id: 'te-c4', module: 'telecom', topic: 'Fibre optics', difficulty: 'medium', marks: 2,
    stem: 'An optical fibre has core index 1.50 and cladding index 1.47. Calculate the critical angle at the core–cladding boundary.',
    parts: [{ label: 'Critical angle', answer: 78.52, unit: '°', working: ['\\theta_c = \\sin^{-1}(1.47/1.50) = 78.5^\\circ'] }],
  }),
  calc({
    id: 'te-c5', module: 'telecom', topic: 'Satellites', difficulty: 'medium', marks: 2,
    stem: 'Estimate the one-way propagation delay for a signal from a ground station up to a geostationary satellite (35 786 km) directly overhead and back down to a second ground station (c = 3.00 × 10⁸ m/s).',
    parts: [{ label: 'Delay', answer: 0.23857, unit: 's', working: ['t = 2 \\times 35\\,786\\,000 / 3.00\\times10^8 = 0.239\\ \\text{s}'], traps: [{ value: 0.1193, msg: 'The signal travels UP and DOWN — double the altitude.' }] }],
  }),
];

export const TOPICS_BY_MODULE = (m: ModuleId) => Array.from(new Set(QUESTIONS.filter((q) => q.module === m).map((q) => q.topic)));
