import { useEffect, useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { api } from '../api/client.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function EmergencyPage() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    Promise.allSettled([api.get('/dashboard/summary'), api.get('/dashboard/alerts')]).then(([summaryRes, alertsRes]) => {
      setSummary(summaryRes.status === 'fulfilled' ? summaryRes.value.data : null);
      setAlerts(alertsRes.status === 'fulfilled' ? alertsRes.value.data : []);
    });
  }, []);

  const active = useMemo(() => {
    if (!summary) return false;
    return Number(summary.totalOverdraftUsed) > 0 || Number(summary.overdueBills) > 0 || Number(summary.expectedMonthlyBalance) < 0 || Number(summary.incomeCommitmentPercent) >= 70;
  }, [summary]);

  const actions = [
    'Parar temporariamente novas compras no cartao.',
    'Pagar primeiro contas essenciais: moradia, energia, agua e alimentacao.',
    'Renegociar contas vencidas antes de assumir novas parcelas.',
    'Separar um valor minimo de sobrevivencia do mes.',
    'Cortar despesas nao essenciais por 30 dias.',
    'Gerar plano de acao e acompanhar semanalmente.'
  ];

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>Modo Emergencia</h1>
          <p>Um plano rapido para meses de risco financeiro.</p>
        </div>
      </div>
      <article className={`panel emergency-hero ${active ? 'active' : ''}`}>
        <ShieldAlert size={34} />
        <div>
          <h2>{active ? 'Modo emergencia ativado' : 'Sem emergencia detectada'}</h2>
          <p>{active ? 'Existem sinais de risco. Siga as prioridades abaixo antes de novos compromissos.' : 'Continue acompanhando seu fluxo de caixa e mantenha os dados atualizados.'}</p>
        </div>
      </article>
      {summary && (
        <div className="metric-grid small">
          <div><small>Saldo previsto</small><strong>{money.format(summary.expectedMonthlyBalance)}</strong></div>
          <div><small>Cheque especial</small><strong>{money.format(summary.totalOverdraftUsed)}</strong></div>
          <div><small>Contas vencidas</small><strong>{summary.overdueBills}</strong></div>
          <div><small>Renda comprometida</small><strong>{summary.incomeCommitmentPercent}%</strong></div>
        </div>
      )}
      <article className="panel action-card">
        <h2>Acoes por prioridade</h2>
        <ol>{actions.map((action, index) => <li key={action}><span>{index + 1}</span>{action}</li>)}</ol>
      </article>
      <article className="panel">
        <h2>Alertas ligados ao risco</h2>
        <div className="alert-list">
          {alerts.map((alert, index) => <div className={`alert ${alert.severity}`} key={`${alert.title}-${index}`}><ShieldAlert size={18} /><div><strong>{alert.title}</strong><span>{alert.message}</span></div></div>)}
          {alerts.length === 0 && <p>Nenhum alerta critico no momento.</p>}
        </div>
      </article>
    </section>
  );
}
