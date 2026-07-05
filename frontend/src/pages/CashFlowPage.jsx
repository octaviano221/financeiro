import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function CashFlowPage() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/tools/cash-flow', { params: { period } }).then((response) => setData(response.data));
  }, [period]);

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>Fluxo de Caixa</h1>
          <p>Compare entradas, saidas, realizado, previsto e saldo futuro.</p>
        </div>
        <select className="period-select" value={period} onChange={(event) => setPeriod(event.target.value)}>
          <option value="today">Hoje</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
          <option value="year">Ano</option>
        </select>
      </div>

      {data && (
        <>
          <div className="metric-grid small">
            <div><small>Entradas previstas</small><strong>{money.format(data.totals.entradasPrevistas)}</strong></div>
            <div><small>Entradas realizadas</small><strong>{money.format(data.totals.entradasRealizadas)}</strong></div>
            <div><small>Saidas previstas</small><strong>{money.format(data.totals.saidasPrevistas)}</strong></div>
            <div><small>Saidas realizadas</small><strong>{money.format(data.totals.saidasRealizadas)}</strong></div>
            <div><small>Saldo projetado</small><strong>{money.format(data.totals.saldo)}</strong></div>
          </div>

          <article className="panel">
            <h2>Previsto x realizado</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => money.format(value)} />
                <Bar dataKey="entradasPrevistas" fill="#86efac" />
                <Bar dataKey="entradasRealizadas" fill="#16a34a" />
                <Bar dataKey="saidasPrevistas" fill="#fdba74" />
                <Bar dataKey="saidasRealizadas" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="panel">
            <h2>Alertas de caixa</h2>
            <div className="alert-list">
              {data.alerts.length === 0 && <p>Nenhum saldo negativo projetado no periodo.</p>}
              {data.alerts.map((alert) => <div className="alert alta" key={alert}><AlertTriangle size={18} /><span>{alert}</span></div>)}
            </div>
          </article>
        </>
      )}
    </section>
  );
}
