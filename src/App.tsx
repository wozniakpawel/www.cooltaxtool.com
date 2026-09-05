import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { UserMenu, defaultInputs } from './components/UserMenu';
import Overview from './components/dashboard/Overview';
import Guide from './components/dashboard/Guide';
import Header from './components/Header';
import Footer from './components/Footer';
import type { TaxInputs } from './types/tax';
const Explorer = lazy(() => import('./components/dashboard/Explorer'));
const Compare = lazy(() => import('./components/dashboard/Compare'));
const PayePlanner = lazy(() => import('./components/PayePlanner'));
const initialTheme = () => {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* optional preference */
  }
  return 'light';
};
type View = 'overview' | 'explorer' | 'compare' | 'paye';
const views: { key: View; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '◫' },
  { key: 'explorer', label: 'Income explorer', icon: '⌁' },
  { key: 'compare', label: 'Compare scenarios', icon: '⇄' },
  { key: 'paye', label: 'PAYE planner', icon: '▦' },
];
function App() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [view, setView] = useState<View>('overview');
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* preference is optional */
    }
  }, [theme]);
  const updateInputs = useCallback((values: TaxInputs) => setInputs(values), []);
  return (
    <>
      <a className="skip-link" href="#results">
        Skip to results
      </a>
      <Header
        theme={theme}
        toggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />
      <main className="site-shell" id="calculator">
        <div className="page-intro">
          <div>
            <div className="intro-kicker">
              <span className="status-dot" /> FREE UK TAX CALCULATOR
            </div>
            <h1>
              Big decisions.
              <br className="mobile-break" /> Clearer numbers<span className="title-dot">.</span>
            </h1>
            <p>Know what you earn. See what you keep. Make a plan for what’s next.</p>
          </div>
          <div className="year-stamp">
            <span>BUILT FOR YOUR TAX YEAR</span>
            <strong>{inputs.taxYear}</strong>
            <small>
              6 April {inputs.taxYear.slice(0, 4)} – 5 April{' '}
              {Number(inputs.taxYear.slice(0, 4)) + 1}
            </small>
          </div>
        </div>
        <a className="mobile-results-link" href="#results">
          Jump to your results ↓
        </a>
        <div className="calculator-layout">
          <UserMenu onUserInputsChange={updateInputs} />
          <div className="results-column" id="results" tabIndex={-1}>
            <nav className="workspace-tabs" aria-label="Calculator views">
              {views.map((v) => (
                <button
                  key={v.key}
                  aria-pressed={view === v.key}
                  className={view === v.key ? 'active' : ''}
                  onClick={() => setView(v.key)}
                >
                  <span aria-hidden="true">{v.icon}</span>
                  {v.label}
                </button>
              ))}
            </nav>
            {(inputs.taxYear === '2022/23' || inputs.taxYear === '2023/24') && (
              <p className="notice warning">
                {inputs.taxYear} NI changed during the year. Annual estimates assume even pay; see
                the assumptions below.
              </p>
            )}
            <Suspense
              fallback={
                <div className="surface loading-state" role="status">
                  Loading your calculator…
                </div>
              }
            >
              {view === 'overview' && (
                <Overview inputs={inputs} onCompare={() => setView('compare')} />
              )}
              {view === 'explorer' && <Explorer inputs={inputs} theme={theme} />}
              {view === 'compare' && <Compare inputs={inputs} />}
              {view === 'paye' && (
                <div className="view-enter">
                  <div className="view-heading">
                    <div>
                      <span className="eyebrow">PLAN A CHANGING YEAR</span>
                      <h2>Your pay, month by month.</h2>
                      <p>Explore bonus payments, pay rises and payroll deductions.</p>
                    </div>
                  </div>
                  <PayePlanner inputs={inputs} theme={theme} />
                </div>
              )}
            </Suspense>
            <Guide inputs={inputs} />
          </div>
        </div>
        <div className="trust-strip">
          <span>◇ No accounts or tracking</span>
          <span>↗ Official tax sources</span>
          <span>⌘ Free & open source</span>
          <span>✓ Calculations run in your browser</span>
        </div>
      </main>
      <Footer />
    </>
  );
}
export default App;
