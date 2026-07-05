import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../api/client.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function PaymentsPage() {
  const [banks, setBanks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [cards, setCards] = useState([]);
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ target_type: 'expense', target_id: '', amount: '', bank_account_id: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [bankRes, expenseRes, debtRes, cardRes, paymentRes] = await Promise.all([
      api.get('/bank-accounts'),
      api.get('/expenses'),
      api.get('/debts'),
      api.get('/credit-cards'),
      api.get('/payments')
    ]);
    setBanks(bankRes.data);
    setExpenses(expenseRes.data);
    setDebts(debtRes.data);
    setCards(cardRes.data);
    setPayments(paymentRes.data);
  }

  const targets = useMemo(() => {
    if (form.target_type === 'expense') return expenses.filter((item) => item.status !== 'pago').map((item) => ({ id: item.id, label: item.description, amount: item.amount }));
    if (form.target_type === 'debt') return debts.filter((item) => item.status !== 'quitada').map((item) => ({ id: item.id, label: item.debt_name, amount: item.current_amount }));
    return cards.filter((item) => item.status !== 'paga').map((item) => ({ id: item.id, label: item.card_name, amount: item.current_invoice_value }));
  }, [form.target_type, expenses, debts, cards]);

  function selectTarget(targetId) {
    const target = targets.find((item) => String(item.id) === String(targetId));
    setForm({ ...form, target_id: targetId, amount: target?.amount || '' });
  }

  async function submit(event) {
    event.preventDefault();
    await api.post('/payments/register', form);
    setMessage('Pagamento registrado com sucesso.');
    setForm({ ...form, target_id: '', amount: '', notes: '' });
    await load();
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>Registrar Pagamento</h1>
          <p>Baixe despesas, dividas e faturas, atualizando o saldo da conta escolhida.</p>
        </div>
      </div>

      <form className="form-panel" onSubmit={submit}>
        <div className="form-grid">
          <label><span>Tipo</span><select value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value, target_id: '', amount: '' })}><option value="expense">Despesa</option><option value="debt">Divida</option><option value="card">Fatura de cartao</option></select></label>
          <label><span>Registro</span><select value={form.target_id} onChange={(e) => selectTarget(e.target.value)} required><option value="">Selecione</option>{targets.map((item) => <option key={item.id} value={item.id}>{item.label} - {money.format(item.amount)}</option>)}</select></label>
          <label><span>Valor pago</span><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
          <label><span>Conta usada</span><select value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}><option value="">Nao descontar saldo</option>{banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.bank_name} - {money.format(bank.current_balance)}</option>)}</select></label>
          <label><span>Data do pagamento</span><input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></label>
          <label className="span-2"><span>Observacoes</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
        <button type="submit"><CheckCircle2 size={16} /> Registrar pagamento</button>
        {message && <p className="success-text">{message}</p>}
      </form>

      <article className="panel">
        <h2>Historico de pagamentos</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Registro</th><th>Valor</th><th>Observacoes</th></tr></thead>
            <tbody>{payments.map((payment) => <tr key={payment.id}><td>{String(payment.payment_date).slice(0, 10)}</td><td>{payment.target_type}</td><td>{payment.target_id}</td><td>{money.format(payment.amount)}</td><td>{payment.notes || '-'}</td></tr>)}</tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
