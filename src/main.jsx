import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { AiPanel } from './components/AiPanel';
import { Dashboard } from './pages/Dashboard';
import { CashFlow } from './pages/CashFlow';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { Rules } from './pages/Rules';
import { Settings } from './pages/Settings';
import { Budget } from './pages/Budget';
import { Recurring } from './pages/Recurring';
import { Accounts } from './pages/Accounts';

function AppRoutes() {
  const { aiOpen, setAiOpen } = useApp();
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/accounts" element={<Accounts/>}/>
          <Route path="/cash-flow" element={<CashFlow/>}/>
          <Route path="/transactions" element={<Transactions/>}/>
          <Route path="/reports" element={<Reports/>}/>
          <Route path="/budget" element={<Budget/>}/>
          <Route path="/recurring" element={<Recurring/>}/>
          <Route path="/rules" element={<Rules/>}/>
          <Route path="/settings" element={<Settings/>}/>
          <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </Layout>
      {aiOpen && <AiPanel onClose={() => setAiOpen(false)}/>}
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <AppRoutes/>
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>
);
