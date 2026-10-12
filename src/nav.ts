import {
  LayoutDashboard, Building2, Bus, Plane, RadioTower, Calculator, FlaskConical, Factory, PenTool, FileText,
  Sigma, ListChecks, GraduationCap, Layers, Network, Printer, Info, Wind, Cpu, Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  accent?: string;
}
export const NAV: { heading: string; items: NavItem[] }[] = [
  { heading: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    heading: 'HSC Modules',
    items: [
      { to: '/module/civil', label: 'Civil Structures', icon: Building2, accent: 'civil' },
      { to: '/module/transport', label: 'Personal & Public Transport', icon: Bus, accent: 'transport' },
      { to: '/module/aero', label: 'Aeronautical Engineering', icon: Plane, accent: 'aero' },
      { to: '/module/telecom', label: 'Telecommunications', icon: RadioTower, accent: 'telecom' },
    ],
  },
  {
    heading: 'Laboratories',
    items: [
      { to: '/mechanics-lab', label: 'Mechanics Laboratory', icon: Wrench },
      { to: '/aero-lab', label: 'Aeronautical Lab', icon: Wind },
      { to: '/telecom-lab', label: 'Telecommunications Lab', icon: Cpu },
      { to: '/materials', label: 'Materials Laboratory', icon: FlaskConical },
      { to: '/manufacturing', label: 'Manufacturing Processes', icon: Factory },
      { to: '/drawing', label: 'Technical Drawing', icon: PenTool },
    ],
  },
  {
    heading: 'Reference',
    items: [
      { to: '/formulas', label: 'Formula Centre', icon: Sigma },
      { to: '/reports', label: 'Engineering Reports', icon: FileText },
      { to: '/concept-maps', label: 'Concept Maps', icon: Network },
    ],
  },
  {
    heading: 'Practise & revise',
    items: [
      { to: '/solver', label: 'Step-by-step Solver', icon: Calculator },
      { to: '/practice', label: 'HSC Practice Centre', icon: GraduationCap },
      { to: '/flashcards', label: 'Flashcards', icon: Layers },
      { to: '/progress', label: 'Syllabus Checklist', icon: ListChecks },
      { to: '/revision-sheets', label: 'Printable Revision', icon: Printer },
      { to: '/about', label: 'Sources & Help', icon: Info },
    ],
  },
];
