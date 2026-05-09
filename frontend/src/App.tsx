import { NavLink, Route, Routes } from 'react-router-dom';
import { AiPanel } from './pages/AiPanel.js';
import { Dashboard } from './pages/Dashboard.js';
import { MemoPage } from './pages/MemoPage.js';
import { OpportunityDetailPage } from './pages/OpportunityDetailPage.js';
import { PortfolioPage } from './pages/PortfolioPage.js';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-ink-700 text-white' : 'text-ink-500 hover:text-mist'
  }`;

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-white">CreditKit</p>
            <p className="text-xs text-ink-500">Private &amp; infrastructure credit research</p>
          </div>
          <nav className="flex flex-wrap gap-1">
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/portfolio" className={linkClass}>
              Portfolio
            </NavLink>
            <NavLink to="/ai" className={linkClass}>
              AI Assist
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="/opportunities/:id/memo" element={<MemoPage />} />
          <Route path="/ai" element={<AiPanel />} />
        </Routes>
      </main>
      <footer className="border-t border-ink-700 py-6 text-center text-xs text-ink-500">
        CreditKit — research prototype. Not investment advice.
      </footer>
    </div>
  );
}
