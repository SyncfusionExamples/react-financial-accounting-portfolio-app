import { useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { SidebarComponent } from '@syncfusion/ej2-react-navigations';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { toggleSidebar, toggleTheme } from './features/ui/uiSlice';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Accounting from './pages/Accounting';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import './App.css';
import './components/components.css';

// Icon names come from the Syncfusion "e-icons" font (@syncfusion/ej2-icons).
// Verify each name exists in the icon font — invalid names render as blank boxes.
const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'e-icons e-home' },
  { path: '/portfolio', label: 'Portfolio', icon: 'e-icons e-chart' },
  { path: '/accounting', label: 'Accounting', icon: 'e-icons e-notes' },
  { path: '/transactions', label: 'Transactions', icon: 'e-icons e-swap-arrow' },
  { path: '/analytics', label: 'Analytics', icon: 'e-icons e-chart-2d-line' },
] as const;

export default function App() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const location = useLocation();

  // Toggle the design-token root class so CSS variables and
  // Syncfusion's dark scheme flags switch together.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const sidebarRef = useRef<SidebarComponent>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Keep the ej2 sidebar's open state in sync with Redux. The isOpen prop
  // only sets the initial state; later changes must go through show()/hide().
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar || !sidebar.element) return;
    if (sidebarOpen && !sidebar.isOpen) {
      sidebar.show();
    } else if (!sidebarOpen && sidebar.isOpen) {
      sidebar.hide();
    }
  }, [sidebarOpen]);

  // Syncfusion charts size themselves at mount and only re-measure on window
  // resize events. The sidebar pushes content via an animated margin (no
  // resize event fires), and charts mount late once API data arrives. Watch
  // the content area for size changes and broadcast a resize so charts stay
  // in sync with their container.
  useEffect(() => {
    const main = mainRef.current;
    if (!main || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
    observer.observe(main);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="app-shell">
      <SidebarComponent
        ref={sidebarRef}
        width="240px"
        type="Push"
        isOpen={sidebarOpen}
        enableDock
        dockSize="56px"
      >
        <div className="sidebar-brand">
          <span className="brand-mark">FP</span>
          <span className="brand-name">FinPortfolio</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <i className={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <ButtonComponent
            cssClass="e-flat theme-toggle"
            onClick={() => dispatch(toggleSidebar())}
          >
            <i className="e-icons e-pan" aria-hidden="true" />
            <span>Collapse</span>
          </ButtonComponent>
        </div>
      </SidebarComponent>
      <div className="app-main" ref={mainRef}>
        <header className="app-header">
          <ButtonComponent
            cssClass="e-flat e-primary menu-btn"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Toggle navigation"
          >
            <i className="e-icons e-menu" aria-hidden="true" />
          </ButtonComponent>
          <div className="header-spacer" />
          <ThemeToggle />
        </header>
        <main className="app-content" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);
  return (
    <ButtonComponent
      cssClass="e-flat theme-toggle"
      onClick={() => dispatch(toggleTheme())}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <i
        className={theme === 'dark' ? 'e-icons e-brightness' : 'e-icons e-moon'}
        aria-hidden="true"
      />
    </ButtonComponent>
  );
}
