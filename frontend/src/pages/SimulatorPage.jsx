import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../state/ToastContext.jsx';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function SimulatorPage() {
  const [form, setForm] = useState({ current_amount: '', down_payment: '', installments: 12, monthly_interest_rate: '', current_scenario_total: '' });
  const [result, setResult] = useState(null);
  const { showToast } = useToast();

  async function submit(event) {
    event.preventDefault();
    const response = await api.post('/tools/renegotiation/simulate', form);
    setResult(response.data);
    showToast('Simulacao calculada.');
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>Simulador de Renegociacao</h1>
          <p>Compare entrada, juros, parcelas e custo final antes de renegociar.</p>
        </div>
      </div>

      <form className="form-panel" onSubmit={submit}>
        <div className="form-grid">
          <label><span>Valor atual da divida</span><input type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} required /></label>
          <label><span>Entrada</span><input type="number" value={form.down_payment} onChange={(e) => setForm({ ...form, down_payment: e.target.value })} /></label>
          <label><span>Quantidade de parcelas</span><input type="number" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} required /></label>
          <label><span>Juros proposto ao mes (%)</span><input type="number" value={form.monthly_interest_rate} onChange={(e) => setForm({ ...form, monthly_interest_rate: e.target.value })} /></label>
          <label><span>Total do cenario atual</span><input type="number" value={form.current_scenario_total} onChange={(e) => setForm({ ...form, current_scenario_total: e.target.value })} /></label>
        </div>
        <button type="submit"><Calculator size={16} /> Simular</button>
      </form>

      {result && (
        <article className="panel result-card">
          <h2>Resultado</h2>
          <div className="metric-grid small">
            <div><small>Valor da parcela</small><strong>{money.format(result.installment_value)}</strong></div>
            <div><small>Total final</small><strong>{money.format(result.total_final)}</strong></div>
            <div><small>Economia estimada</small><strong>{money.format(result.economy)}</strong></div>
          </div>
          <p className={result.improves ? 'success-text' : 'danger-text'}>{result.message}</p>
        </article>
      )}
    </section>
  );
}
