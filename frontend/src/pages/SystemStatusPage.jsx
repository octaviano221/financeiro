import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, Server } from 'lucide-react';
import { api } from '../api/client.js';

export function SystemStatusPage() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get('/system/status').then((response) => setStatus(response.data)).catch(() => setStatus({ status: 'error', checks: { api: false, database: false, tables: {}, user: false } }));
  }, []);

  const tableEntries = Object.entries(status?.checks?.tables || {});

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>Status do Sistema</h1>
          <p>Verificacao rapida da API, banco, tabelas e autenticacao.</p>
        </div>
      </div>
      <article className={`panel system-hero ${status?.status === 'ok' ? 'ok' : 'attention'}`}>
        <Server size={34} />
        <div>
          <h2>{status?.status === 'ok' ? 'Tudo operacional' : 'Precisa de atencao'}</h2>
          <p>{status?.checked_at ? `Ultima verificacao: ${new Date(status.checked_at).toLocaleString('pt-BR')}` : 'Carregando verificacao...'}</p>
        </div>
      </article>
      <div className="status-check-grid">
        <StatusCard label="API" ok={status?.checks?.api} />
        <StatusCard label="Banco de dados" ok={status?.checks?.database} />
        <StatusCard label="Usuario autenticado" ok={status?.checks?.user} />
        <StatusCard label="Tabelas principais" ok={tableEntries.length > 0 && tableEntries.every(([, ok]) => ok)} />
      </div>
      <article className="panel">
        <h2>Tabelas</h2>
        <div className="table-status-list">
          {tableEntries.map(([name, ok]) => <StatusCard key={name} label={name} ok={ok} compact />)}
        </div>
      </article>
    </section>
  );
}

function StatusCard({ label, ok, compact = false }) {
  const Icon = ok ? CheckCircle2 : CircleAlert;
  return (
    <div className={compact ? 'status-card compact' : 'status-card'}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{ok ? 'OK' : 'Atenção'}</strong>
    </div>
  );
}
