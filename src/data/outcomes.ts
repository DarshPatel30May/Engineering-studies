/** HSC course outcomes — Engineering Studies Stage 6 Syllabus (2011, amended). */
export const OUTCOMES: Record<string, string> = {
  'H1.1': 'describes the scope of engineering and critically analyses current innovations',
  'H1.2': 'differentiates between the properties and structure of materials and justifies the selection of materials in engineering applications',
  'H2.1': 'determines suitable properties, uses and applications of materials, components and processes in engineering',
  'H2.2': 'analyses and synthesises engineering applications in specific fields and reports on the importance of these to society',
  'H3.1': 'demonstrates proficiency in the use of mathematical, scientific and graphical methods to analyse and solve problems of engineering practice',
  'H3.2': 'uses appropriate written, oral and presentation skills in the preparation of detailed engineering reports',
  'H3.3': 'develops and uses specialised techniques in the application of graphics as a communication tool',
  'H4.1': 'investigates the extent of technological change in engineering',
  'H4.2': 'applies knowledge of history and technological change to engineering-based problems',
  'H4.3': 'applies understanding of social, environmental and cultural implications of technological change in engineering to the analysis of specific engineering problems',
  'H5.1': 'works individually and in teams to solve specific engineering problems and prepare engineering reports',
  'H5.2': 'selects and uses appropriate management and planning skills related to engineering',
  'H6.1': 'demonstrates skills in research and problem-solving related to engineering',
  'H6.2': 'demonstrates skills in analysis, synthesis and experimentation related to engineering',
};

export const SYLLABUS_NOTE =
  'Dot points are condensed from the NESA Engineering Studies Stage 6 Syllabus (2011, amended), which applies to the 2026 HSC. Wording is abridged; always check the official syllabus document on the NESA website for the exact text.';

export const EXAM_SPEC = {
  totalMarks: 100,
  time: '3 hours plus 5 minutes reading time',
  sections: [
    { name: 'Section I', marks: 20, desc: 'Objective-response (multiple-choice) questions' },
    { name: 'Section II', marks: 80, desc: 'Short-answer questions, some with parts, covering all HSC modules' },
  ],
};
