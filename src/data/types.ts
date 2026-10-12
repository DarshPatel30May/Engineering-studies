export type ModuleId = 'civil' | 'transport' | 'aero' | 'telecom';

export interface DotPoint {
  id: string;
  text: string;
  sub?: string[];
  /** Where in the site this is taught (route or route#anchor). */
  link?: string;
  /** Marks supporting content that is not a separate syllabus dot point. */
  note?: string;
}

export interface SyllabusGroup {
  id: string;
  heading: string;
  learnAbout: DotPoint[];
  learnTo: DotPoint[];
}

export interface Concept {
  id: string;
  term: string;
  /** Exam-ready definition (one sentence). */
  def: string;
  beginner: string;
  advanced?: string;
  example?: string;
  tab: string;
}

export interface TimelineEvent {
  year: string;
  title: string;
  text: string;
  tag: string;
}

export interface Misconception {
  wrong: string;
  right: string;
}

export interface ModuleData {
  id: ModuleId;
  number: number;
  name: string;
  short: string;
  type: 'Application module' | 'Focus module';
  accent: ModuleId;
  tagline: string;
  summary: string[];
  engineersDo: string[];
  categories: string[];
  needToUnderstand: string[];
  outcomes: string[];
  syllabus: SyllabusGroup[];
  concepts: Concept[];
  timeline: TimelineEvent[];
  societal: { heading: string; points: string[] }[];
  revision: {
    takeaways: string[];
    thirtySecond: string;
    formulas: string[];
    diagrams: { label: string; to: string }[];
    misconceptions: Misconception[];
  };
  conceptMap: { nodes: { id: string; label: string; group?: string; to?: string }[]; edges: [string, string, string?][] };
}
