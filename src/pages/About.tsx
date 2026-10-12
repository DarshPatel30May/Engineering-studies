import { Info, ExternalLink, ShieldCheck, Terminal, Accessibility, Database } from 'lucide-react';
import { PageHeader, Card, Callout } from '@/components/ui';
import { SYLLABUS_NOTE } from '@/data/outcomes';

const SOURCES = [
  { label: 'NESA — Engineering Studies Stage 6 Syllabus (2011)', href: 'https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011' },
  { label: 'NESA — Engineering Studies assessment and reporting (HSC exam specifications)', href: 'https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011/assessment-and-reporting' },
  { label: 'NESA — Engineering Studies HSC exam papers, marking guidelines and formula sheet', href: 'https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/engineering-studies' },
  { label: 'Standards Australia — AS 1100 Technical drawing (referenced for drawing conventions)', href: 'https://www.standards.org.au/' },
];

export default function About() {
  return (
    <div className="max-w-4xl">
      <PageHeader title="Sources, Assumptions & Help" kicker="About this site" icon={<Info className="text-emerald-600" />}>
        How the content was prepared, what to verify against official documents, and how to install, run and deploy the site.
      </PageHeader>
      <div className="space-y-4">
        <Card title="Official sources" icon={<ExternalLink size={18} />}>
          <ul className="space-y-1.5 text-sm">
            {SOURCES.map((s) => (
              <li key={s.href}><a className="text-emerald-700 hover:underline dark:text-emerald-400" href={s.href} target="_blank" rel="noreferrer">{s.label}</a></li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">Material properties are typical published ranges for common grades (e.g. AS/NZS structural steel grades, AA aluminium alloy designations, manufacturer datasheets). Real values depend on grade, processing and temperature — always use a supplier’s data for design.</p>
        </Card>
        <Card title="Accuracy and assumptions" icon={<ShieldCheck size={18} />}>
          <ul className="ml-4 list-disc space-y-1.5 text-sm text-ink-700 dark:text-ink-300">
            <li>{SYLLABUS_NOTE}</li>
            <li>Items marked as supporting content (for example, simple machines from the Preliminary course, or rocket propulsion as extension) help understanding but are not separate HSC dot points.</li>
            <li>“On the formula sheet” tags are indicative. Always check the formulae and data sheet published with the current HSC examination.</li>
            <li>Practice questions are original and written in the HSC style. No NESA examination questions are reproduced; use the official past papers linked above for genuine exam practice.</li>
            <li>Numerical answers are marked automatically with a stated tolerance (normally ±2%). Written answers are self-assessed against transparent, indicative criteria — they are not official marking guidelines.</li>
            <li>Sign conventions used throughout: upward and rightward forces positive, anticlockwise moments positive, tension positive in trusses, sagging bending moment positive.</li>
            <li>Simulations are simplified teaching models (e.g. ideal fluids, linear-elastic materials, pin-jointed trusses) and state their assumptions next to the result.</li>
          </ul>
        </Card>
        <Card title="Your data and privacy" icon={<Database size={18} />}>
          <p className="text-sm text-ink-700 dark:text-ink-300">There are no accounts, analytics or servers. Preferences, checklist ticks, bookmarks, flashcard boxes, decision matrices and practice attempts are saved only in your browser’s localStorage (keys beginning <code>hsc-eng:</code>). Export or reset them from the Syllabus Checklist page. Clearing site data removes them.</p>
        </Card>
        <Card title="Install, run and deploy" icon={<Terminal size={18} />}>
          <pre className="overflow-x-auto rounded-lg bg-ink-900 p-3 text-xs text-ink-100">{`# Requires Node.js 18+ (20 LTS recommended)
npm install        # install dependencies
npm run dev        # start the dev server at http://localhost:5173
npm test           # run the calculation and data unit tests
npm run build      # type-check and build static files into dist/
npm run preview    # preview the production build`}</pre>
          <p className="mt-2 text-sm text-ink-700 dark:text-ink-300">The build is fully static and uses hash-based routing (<code>/#/module/civil</code>) with relative asset paths, so <code>dist/</code> can be uploaded to any static host — GitHub Pages, Netlify, Vercel, Cloudflare Pages or a school web server — without server rewrite rules.</p>
        </Card>
        <Card title="Accessibility" icon={<Accessibility size={18} />}>
          <ul className="ml-4 list-disc space-y-1 text-sm text-ink-700 dark:text-ink-300">
            <li>Keyboard navigable; press <span className="kbd">Ctrl</span> <span className="kbd">K</span> or <span className="kbd">/</span> to search.</li>
            <li>Dark and light themes; Visual-only mode hides long text for visual learners; Beginner/Advanced explanations.</li>
            <li>Animations respect your operating system’s “reduce motion” setting where supported.</li>
            <li>Charts offer a table view; colours are paired with labels, never used alone.</li>
          </ul>
        </Card>
        <Callout kind="warn" title="Not an official NESA resource">
          This is an independent study aid. It is not produced or endorsed by NESA. NESA documents always take precedence.
        </Callout>
      </div>
    </div>
  );
}
