# HSC Engineering Studies 2026 — Visual Study Guide

An interactive study site for the **NSW HSC Engineering Studies** course (NESA Stage 6 Syllabus, 2011, as amended). It covers the four HSC modules:

| Module | Type | Accent |
| --- | --- | --- |
| Civil Structures | Application module | forest green |
| Personal and Public Transport | Application module | orange |
| Aeronautical Engineering | Focus module | sky blue |
| Telecommunications Engineering | Focus module | violet |

Everything runs in the browser. There are no accounts, no servers and no AI services. Progress is saved in the browser's `localStorage`.

## Features

- **Module pages** follow the same structure (A–H): Overview, Syllabus checklist, Major concepts, Mechanics / Electricity, Materials, History and society, Communication, Quick revision. The focus modules also have a "Scope of the profession" tab.
- **Mechanics Laboratory**: force resolution, equilibrium, a simply supported beam calculator with SFD/BMD, a truss solver (method of joints and method of sections, tension positive), a stress–strain explorer, stress and factor-of-safety calculators, machines (MA, VR, efficiency), friction and fluid pressure.
- **Aeronautical and Telecommunications labs**: the four forces of flight, aerofoil flow (Joukowski potential flow), Bernoulli/venturi, propulsion, Pitot-static instruments, 3D control surfaces, modulation, the spectrum, fibre optics, a logic-gate simulator, satellites and network flow.
- **Materials Laboratory**: 50 materials, each with structure, properties, uses, processing and limitations, plus 10 side-by-side comparisons, property charts, crystal structures and microstructures.
- **Manufacturing process explorer**: 16 animated processes.
- **Technical drawing guide**: a 3D→2D orthographic explorer whose views are generated exactly from the model (hidden lines included), AS 1100 conventions, sections, dimensioning, a developments tool and view-matching practice.
- **Formula Centre**: 38 formulas with KaTeX notation, variables, SI units, worked examples, calculators and common mistakes, plus a unit converter.
- **Engineering report guide**: report structure, a decision-matrix tool, a materials template, a model paragraph and common errors.
- **Step-by-step solver**: 13 problem types. Every set of numbers is solved by deterministic algorithms, and the solver gives hints, explains common errors and shows the full working.
- **HSC Practice Centre**: 60 multiple-choice questions with an explanation for every option, 16 short-answer questions (2–8 marks) with transparent indicative criteria, and 20 calculation questions marked within a stated tolerance. It also has diagram questions, adaptive difficulty, progress tracking, weak-area analysis and links to official NESA past papers.
- **Revision tools**: flashcards (Leitner boxes), concept maps (React Flow), a syllabus checklist with JSON export, and printable revision sheets (print, or save as PDF).
- **Display options**: Beginner/Advanced explanations, Visual-only mode, dark/light themes, a responsive layout and Ctrl K search.

## Getting started

Requires **Node.js 18 or later** (20 LTS recommended).

```bash
npm install       # install dependencies
npm run dev       # development server at http://localhost:5173
npm test          # unit tests for solvers, calculators and data integrity (Vitest)
npm run typecheck # TypeScript check only
npm run build     # type-check, then build static files into dist/
npm run preview   # serve the production build locally
```

## Deployment

`npm run build` produces a fully static `dist/` folder. The app uses hash routing (`/#/module/civil`) and relative asset paths (`base: './'`), so it works from any folder on any static host without rewrite rules.

- **GitHub Pages**: build, then publish `dist/` (for example with the `actions/upload-pages-artifact` and `actions/deploy-pages` actions, or by pushing `dist/` to a `gh-pages` branch).
- **Netlify / Cloudflare Pages / Vercel**: build command `npm run build`, publish directory `dist`.
- **School web server or USB drive**: copy the contents of `dist/` and open `index.html` through a web server. Some browsers block module scripts from `file://`.

## Project structure

```
src/
  data/            syllabus, modules, formulas, materials, processes, questions, problem templates (typed TS)
  lib/calc/        pure calculation modules (statics, truss, fluids, electric, telecom, units, projection, aero…) + tests
  lib/             storage (localStorage hooks), preferences, search index
  components/      UI kit, diagrams, mechanics/aero/telecom/materials/drawing visualisations, module tabs
  pages/           routed pages (lazy-loaded)
```

Calculations live in `src/lib/calc`. Each one is a pure function covered by `*.test.ts`. Content lives in `src/data` as typed TypeScript, so to add a question, material or formula you only edit data and never touch component code.

## Sign conventions and assumptions

Upward and rightward forces are positive. Anticlockwise moments are positive. Truss tension is positive. Sagging bending moment is positive. Simulations use simplified teaching models (rigid pin-jointed trusses, linear-elastic materials, ideal fluids, the ISA atmosphere) and state their assumptions where results are shown.

## Sources and disclaimer

- NESA, *Engineering Studies Stage 6 Syllabus* (2011): https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011
- NESA, assessment and reporting / HSC exam specifications: https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011/assessment-and-reporting
- NESA, Engineering Studies HSC exam papers: https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/engineering-studies

Syllabus dot points are condensed and paraphrased, so check the official syllabus for exact wording. "Formulae sheet" tags are indicative only: check the data sheet supplied with the current exam. Practice questions are original. No NESA exam questions are reproduced. Material properties are typical published ranges, not design values. This is an independent study aid and is not produced or endorsed by NESA.
