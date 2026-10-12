import { useNavigate, useLocation } from 'react-router-dom';
import { cx } from './ui';

/** Sticky in-page jump links. Uses the router so links work with HashRouter. */
export default function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const nav = useNavigate();
  const { pathname, hash } = useLocation();
  return (
    <nav className="no-print sticky top-14 z-10 -mx-3 mb-5 overflow-x-auto border-b border-ink-200 bg-ink-50/90 px-3 py-2 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" aria-label="On this page">
      <ul className="flex gap-1.5 whitespace-nowrap">
        {items.map((it) => (
          <li key={it.id}>
            <button
              onClick={() => {
                nav(`${pathname}#${it.id}`, { replace: true });
                document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={cx(
                'rounded-full border px-3 py-1 text-xs font-medium transition',
                hash === `#${it.id}` ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300',
              )}
            >
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
