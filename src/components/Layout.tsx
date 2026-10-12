import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Search, Moon, Sun, Eye, GraduationCap, Cog } from 'lucide-react';
import { NAV } from '@/nav';
import { usePrefs } from '@/lib/prefs';
import { cx, Tabs } from './ui';

const SearchDialog = lazy(() => import('./SearchDialog'));

export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch(true);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      {/* Sidebar */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 w-72 transform border-r border-ink-200 bg-white transition-transform duration-200 dark:border-ink-800 dark:bg-ink-900 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center justify-between border-b border-ink-200 px-4 dark:border-ink-800">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo />
            <div className="leading-tight">
              <div className="text-sm font-bold text-ink-900 dark:text-white">HSC Engineering</div>
              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Studies 2026 · Visual Guide</div>
            </div>
          </NavLink>
          <button className="btn btn-ghost lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto px-3 py-3">
          {NAV.map((g) => (
            <div key={g.heading} className="mb-4">
              <div className="mb-1 px-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">{g.heading}</div>
              <ul className="space-y-0.5">
                {g.items.map((it) => (
                  <li key={it.to}>
                    <NavLink
                      to={it.to}
                      end={it.to === '/'}
                      className={({ isActive }) =>
                        cx(
                          'group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition',
                          isActive
                            ? 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white',
                        )
                      }
                    >
                      <span
                        className={cx(
                          'flex h-6 w-6 items-center justify-center rounded-md',
                          it.accent ? `${accentSoft(it.accent)}` : 'text-ink-400 group-hover:text-ink-600 dark:group-hover:text-ink-200',
                        )}
                      >
                        <it.icon size={15} />
                      </span>
                      {it.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="px-2 pb-6 text-[11px] leading-snug text-ink-400">
            Aligned to the NESA Engineering Studies Stage 6 Syllabus (2011, amended). Not an official NESA product.
          </p>
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-ink-200 bg-white/85 px-3 backdrop-blur dark:border-ink-800 dark:bg-ink-900/85 sm:px-5">
          <button className="btn btn-ghost lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <button
            onClick={() => setSearch(true)}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 text-left text-sm text-ink-400 transition hover:border-ink-300 dark:border-ink-700 dark:bg-ink-950 sm:max-w-md"
            aria-label="Search all content"
          >
            <Search size={15} />
            <span className="truncate">Search topics, formulas, materials…</span>
            <span className="ml-auto hidden sm:inline">
              <span className="kbd">Ctrl</span> <span className="kbd">K</span>
            </span>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <ModeControls />
          </div>
        </header>
        <main id="main" className="print-area mx-auto max-w-[1400px] px-3 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      {search && (
        <Suspense fallback={null}>
          <SearchDialog onClose={() => setSearch(false)} />
        </Suspense>
      )}
    </div>
  );
}

function ModeControls() {
  const { prefs, setPrefs, isDark } = usePrefs();
  const [menu, setMenu] = useState(false);
  return (
    <div className="relative flex items-center gap-1.5">
      <div className="hidden md:block">
        <Tabs
          size="sm"
          value={prefs.mode}
          onChange={(v) => setPrefs({ mode: v })}
          tabs={[
            { id: 'beginner', label: 'Beginner' },
            { id: 'advanced', label: 'Advanced' },
          ]}
        />
      </div>
      <button
        className={cx('btn btn-ghost hidden md:inline-flex', prefs.visualOnly && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300')}
        onClick={() => setPrefs({ visualOnly: !prefs.visualOnly })}
        aria-pressed={prefs.visualOnly}
        title="Visual-only revision mode: hides explanatory paragraphs"
      >
        <Eye size={16} />
        <span className="hidden xl:inline">Visual only</span>
      </button>
      <button className="btn btn-ghost" onClick={() => setPrefs({ theme: isDark ? 'light' : 'dark' })} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button className="btn btn-ghost md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Display options" aria-expanded={menu}>
        <Cog size={16} />
      </button>
      {menu && (
        <div className="absolute right-0 top-11 z-30 w-60 space-y-3 rounded-xl border border-ink-200 bg-white p-3 shadow-lg dark:border-ink-700 dark:bg-ink-900 md:hidden">
          <div>
            <div className="label flex items-center gap-1">
              <GraduationCap size={12} /> Explanation level
            </div>
            <Tabs
              size="sm"
              value={prefs.mode}
              onChange={(v) => setPrefs({ mode: v })}
              tabs={[
                { id: 'beginner', label: 'Beginner' },
                { id: 'advanced', label: 'Advanced' },
              ]}
            />
          </div>
          <button className={cx('btn w-full', prefs.visualOnly && 'btn-primary')} onClick={() => setPrefs({ visualOnly: !prefs.visualOnly })}>
            <Eye size={15} /> Visual-only mode {prefs.visualOnly ? 'on' : 'off'}
          </button>
        </div>
      )}
    </div>
  );
}

function accentSoft(a: string) {
  return (
    {
      civil: 'bg-green-100 text-civil dark:bg-green-950 dark:text-civil-light',
      transport: 'bg-orange-100 text-transport dark:bg-orange-950 dark:text-transport-light',
      aero: 'bg-sky-100 text-aero dark:bg-sky-950 dark:text-aero-light',
      telecom: 'bg-violet-100 text-telecom dark:bg-violet-950 dark:text-telecom-light',
    } as Record<string, string>
  )[a];
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" className="fill-emerald-900" />
      <path d="M10 46 L32 14 L54 46 Z M21 46 L32 30 L43 46" fill="none" stroke="#34d399" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="32" cy="14" r="4" fill="#ecfdf5" />
      <circle cx="10" cy="46" r="4" fill="#ecfdf5" />
      <circle cx="54" cy="46" r="4" fill="#ecfdf5" />
    </svg>
  );
}
