interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
}
export default function Header({ theme, toggleTheme }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#calculator" aria-label="CoolTaxTool home">
          <span className="brand-symbol" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            cooltax<span className="brand-light">tool</span>
            <span className="brand-period">.</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a className="header-active" href="#calculator">
            Calculator
          </a>
          <a href="#guides">How it works</a>
          <a href="https://github.com/wozniakpawel/www.cooltaxtool.com">
            Open source <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <button
          className="theme-toggle"
          aria-label="Dark mode"
          aria-pressed={theme === 'dark'}
          onClick={toggleTheme}
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          <span className="theme-label">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
        </button>
      </div>
    </header>
  );
}
