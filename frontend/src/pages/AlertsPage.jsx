import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api } from '../api/client.js';

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('todos');

  useEffect(() => {
    api.get('/dashboard/alerts').then((response) => setAlerts(response.data)).catch(() => setAlerts([]));
  }, []);

  const filtered = useMemo(() => filter === 'todos' ? alerts : alerts.filter((alert) => alert.severity === filter), [alerts, filter]);

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>Central de Alertas</h1>
          <p>Acompanhe riscos, contas vencidas, faturas altas e prioridades.</p>
        </div>
        <div className="segmented">
          {['todos', 'urgente', 'alta', 'media'].map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}
        </div>
      </div>
      <div className="alert-center">
        {filtered.map((alert, index) => (
          <article className={`panel alert-card ${alert.severity}`} key={`${alert.title}-${index}`}>
            <AlertTriangle size={22} />
            <div>
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <article className="panel"><p>Nenhum alerta neste filtro.</p></article>}
      </div>
    </section>
  );
}
