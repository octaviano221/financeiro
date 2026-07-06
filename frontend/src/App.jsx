import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { useAuth } from './state/AuthContext.jsx';
import { resources } from './resources.js';

const AuthPage = lazy(() => import('./pages/AuthPage.jsx').then((module) => ({ default: module.AuthPage })));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx').then((module) => ({ default: module.Dashboard })));
const ResourcePage = lazy(() => import('./pages/ResourcePage.jsx').then((module) => ({ default: module.ResourcePage })));
const ActionPlanPage = lazy(() => import('./pages/ActionPlanPage.jsx').then((module) => ({ default: module.ActionPlanPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx').then((module) => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx').then((module) => ({ default: module.SettingsPage })));
const CashFlowPage = lazy(() => import('./pages/CashFlowPage.jsx').then((module) => ({ default: module.CashFlowPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx').then((module) => ({ default: module.CalendarPage })));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage.jsx').then((module) => ({ default: module.SimulatorPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage.jsx').then((module) => ({ default: module.PaymentsPage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage.jsx').then((module) => ({ default: module.AlertsPage })));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage.jsx').then((module) => ({ default: module.EmergencyPage })));
const SystemStatusPage = lazy(() => import('./pages/SystemStatusPage.jsx').then((module) => ({ default: module.SystemStatusPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.jsx').then((module) => ({ default: module.OnboardingPage })));
const MonthlyExpensesPage = lazy(() => import('./pages/MonthlyExpensesPage.jsx').then((module) => ({ default: module.MonthlyExpensesPage })));

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot">Carregando...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<div className="boot">Carregando...</div>}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          {resources.map((resource) => (
            <Route key={resource.path} path={resource.path} element={<ResourcePage resource={resource} />} />
          ))}
          <Route path="fluxo-de-caixa" element={<CashFlowPage />} />
          <Route path="plano-de-acao" element={<ActionPlanPage />} />
          <Route path="pagamentos" element={<PaymentsPage />} />
          <Route path="gastos-mensais" element={<MonthlyExpensesPage />} />
          <Route path="alertas" element={<AlertsPage />} />
          <Route path="emergencia" element={<EmergencyPage />} />
          <Route path="status" element={<SystemStatusPage />} />
          <Route path="primeiros-passos" element={<OnboardingPage />} />
          <Route path="simulador" element={<SimulatorPage />} />
          <Route path="calendario" element={<CalendarPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
