import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function ReportsPage() {
  const [report, setReport] = useState(null);
  const [debts, setDebts] = useState([]);
  const [cards, setCards] = useState([]);
  useEffect(() => {
    api.get('/reports/monthly').then((response) => setReport(response.data));
    api.get('/reports/debts').then((response) => setDebts(response.data));
    api.get('/reports/cards').then((response) => setCards(response.data));
  }, []);

  async function exportCsv(type) {
    const response = await api.get(`/reports/export/${type}`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>Relatorios</h1>
          <p>Resumo mensal, dividas, fluxo de caixa e cartoes.</p>
        </div>
      </div>
      <article className="panel">
        <h2>Relatorio mensal</h2>
        <div className="export-row">
          <button onClick={() => exportCsv('incomes')}>Exportar receitas CSV</button>
          <button onClick={() => exportCsv('expenses')}>Exportar despesas CSV</button>
          <button onClick={() => exportCsv('debts')}>Exportar dividas CSV</button>
          <button onClick={() => exportCsv('cards')}>Exportar cartoes CSV</button>
          <button onClick={() => window.print()}>Gerar PDF pela impressao</button>
        </div>
        {report && (
          <div className="metric-grid small">
            <div><small>Receitas</small><strong>{money.format(report.summary.monthlyIncome)}</strong></div>
            <div><small>Despesas</small><strong>{money.format(report.summary.monthlyExpenses)}</strong></div>
            <div><small>Dividas</small><strong>{money.format(report.summary.totalDebts)}</strong></div>
            <div><small>Saldo previsto</small><strong>{money.format(report.summary.expectedMonthlyBalance)}</strong></div>
            <div><small>Saude financeira</small><strong>{report.health.score} / 100</strong></div>
          </div>
        )}
      </article>
      <article className="panel">
        <h2>Relatorio de dividas</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Divida</th><th>Credor</th><th>Valor</th><th>Juros</th><th>Status</th></tr></thead>
            <tbody>{debts.map((debt) => <tr key={debt.id}><td>{debt.debt_name}</td><td>{debt.creditor}</td><td>{money.format(debt.current_amount)}</td><td>{debt.monthly_interest_rate}%</td><td>{debt.status}</td></tr>)}</tbody>
          </table>
        </div>
      </article>
      <article className="panel">
        <h2>Relatorio de cartoes</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Cartao</th><th>Emissor</th><th>Limite</th><th>Usado</th><th>Fatura</th></tr></thead>
            <tbody>{cards.map((card) => <tr key={card.id}><td>{card.card_name}</td><td>{card.issuer}</td><td>{money.format(card.total_limit)}</td><td>{money.format(card.used_limit)}</td><td>{money.format(card.current_invoice_value)}</td></tr>)}</tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
