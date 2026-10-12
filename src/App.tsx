import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ModulePage = lazy(() => import('./pages/ModulePage'));
const MechanicsLab = lazy(() => import('./pages/MechanicsLab'));
const AeroLab = lazy(() => import('./pages/AeroLab'));
const TelecomLab = lazy(() => import('./pages/TelecomLab'));
const MaterialsLab = lazy(() => import('./pages/MaterialsLab'));
const Manufacturing = lazy(() => import('./pages/Manufacturing'));
const Drawing = lazy(() => import('./pages/Drawing'));
const Formulas = lazy(() => import('./pages/Formulas'));
const Reports = lazy(() => import('./pages/Reports'));
const ConceptMaps = lazy(() => import('./pages/ConceptMaps'));
const Solver = lazy(() => import('./pages/Solver'));
const Practice = lazy(() => import('./pages/Practice'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const Progress = lazy(() => import('./pages/Progress'));
const RevisionSheets = lazy(() => import('./pages/RevisionSheets'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Suspense fallback={<div className="p-10 text-sm text-ink-500">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/module/:id" element={<ModulePage />} />
          <Route path="/module/:id/:tab" element={<ModulePage />} />
          <Route path="/mechanics-lab" element={<MechanicsLab />} />
          <Route path="/aero-lab" element={<AeroLab />} />
          <Route path="/telecom-lab" element={<TelecomLab />} />
          <Route path="/materials" element={<MaterialsLab />} />
          <Route path="/manufacturing" element={<Manufacturing />} />
          <Route path="/drawing" element={<Drawing />} />
          <Route path="/formulas" element={<Formulas />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/concept-maps" element={<ConceptMaps />} />
          <Route path="/solver" element={<Solver />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/revision-sheets" element={<RevisionSheets />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
