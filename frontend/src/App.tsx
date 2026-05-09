import { Route, Routes } from 'react-router-dom';
import { AiPanel } from './pages/AiPanel.js';
import { Dashboard } from './pages/Dashboard.js';
import { MemoPage } from './pages/MemoPage.js';
import { OpportunityDetailPage } from './pages/OpportunityDetailPage.js';
import { PortfolioPage } from './pages/PortfolioPage.js';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-11 max-w-[1120px] items-center justify-between px-4">
          <a href="/" className="font-display text-sm tracking-tight text-zinc-900">
            CreditKit
          </a>
          <nav className="hidden items-center gap-6 text-xs text-zinc-500 md:flex">
            <a href="#highlights" className="transition-colors hover:text-zinc-900">
              Highlights
            </a>
            <a href="#analysis" className="transition-colors hover:text-zinc-900">
              Analysis
            </a>
            <a href="#monitoring" className="transition-colors hover:text-zinc-900">
              Monitoring
            </a>
            <a href="#ai" className="transition-colors hover:text-zinc-900">
              AI
            </a>
          </nav>
          <div className="rounded-full bg-[#0071e3] px-3 py-1 text-[11px] font-medium text-white">
            Get Demo
          </div>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="/opportunities/:id/memo" element={<MemoPage />} />
          <Route path="/ai" element={<AiPanel />} />
        </Routes>
      </main>
      <footer className="border-t border-zinc-200 bg-zinc-50 py-8 text-center text-xs text-zinc-500">
        CreditKit research prototype. For educational analysis workflows only.
      </footer>
    </div>
  );
}
