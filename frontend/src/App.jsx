import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { useAuth } from './state/AuthContext.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { ResourcePage } from './pages/ResourcePage.jsx';
import { ActionPlanPage } from './pages/ActionPlanPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { CashFlowPage } from './pages/CashFlowPage.jsx';
import { CalendarPage } from './pages/CalendarPage.jsx';
import { SimulatorPage } from './pages/SimulatorPage.jsx';
import { PaymentsPage } from './pages/PaymentsPage.jsx';
import { AlertsPage } from './pages/AlertsPage.jsx';
import { EmergencyPage } from './pages/EmergencyPage.jsx';
import { SystemStatusPage } from './pages/SystemStatusPage.jsx';
import { resources } from './resources.js';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot">Carregando...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
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
        <Route path="alertas" element={<AlertsPage />} />
        <Route path="emergencia" element={<EmergencyPage />} />
        <Route path="status" element={<SystemStatusPage />} />
        <Route path="simulador" element={<SimulatorPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
