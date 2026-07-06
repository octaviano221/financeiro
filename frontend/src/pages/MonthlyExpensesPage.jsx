import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, CircleDollarSign, CopyPlus, Plus, Receipt, Repeat2, ShoppingCart, WalletCards } from 'lucide-react';
import { api } from '../api/client.js';
import { QuickCreateModal } from '../components/QuickCreateModal.jsx';
import { resources } from '../resources.js';
import { useToast } from '../state/ToastContext.jsx';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const typeMeta = {
  fixed: { label: 'Fixos', icon: Repeat2, text: 'Aluguel, internet, escola, financiamento e contas mensais.' },
  variable: { label: 'Variaveis', icon: ShoppingCart, text: 'Mercado, combustivel, farmacia e gastos que mudam.' },
  extra: { label: 'Extras', icon: Receipt, text: 'Compras eventuais, manutencoes e imprevistos.' }
};

export function MonthlyExpensesPage() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('current');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [quickOpen, setQuickOpen] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const { showToast } = useToast();

  const expenseResource = useMemo(() => resources.find((resource) => resource.endpoint === 'expenses'), []);

  useEffect(() => {
    boot();
  }, []);

  async function boot() {
    await api.post('/system/default-categories/ensure').catch(() => {});
    await load();
  }

  async function load() {
    const response = await api.get('/system/monthly-expenses');
    setData(response.data);
  }

  async function markAsPaid(item) {
    try {
      setPayingId(item.id);
      await api.post('/payments/register', {
        target_type: 'expense',
        target_id: item.id,
        amount: item.amount,
        payment_date: new Date().toISOString().slice(0, 10),
        notes: 'Baixa realizada em Gastos Mensais'
      });
      showToast('Gasto marcado como pago.');
      await load();
    } catch (error) {
      showToast(error.response?.data?.message || 'Nao foi possivel marcar como pago.', 'error');
    } finally {
      setPayingId(null);
    }
  }

  async function duplicateNextMonth(item) {
    try {
      setDuplicatingId(item.id);
      await api.post(`/system/monthly-expenses/${item.id}/duplicate-next-month`);
      showToast('Gasto repetido para o mes que vem.');
      await load();
    } catch (error) {
      showToast(error.response?.data?.message || 'Nao foi possivel repetir o gasto.', 'error');
    } finally {
      setDuplicatingId(null);
    }
  }

  if (!data) return <section className="page">Carregando gastos mensais...</section>;

  const selected = data[period];
  const byTypeItems = type === 'all' ? selected.items : selected.byType[type].items;
  const visibleItems = status === 'all' ? byTypeItems : byTypeItems.filter((item) => item.status === status);

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>Gastos Mensais</h1>
          <p>Organize mercado, contas fixas, extras e saiba quanto precisa pagar agora e no mes que vem.</p>
        </div>
        <button onClick={() => setQuickOpen(true)}><Plus size={16} /> Adicionar gasto</button>
      </div>

      <div className="monthly-hero panel">
        <div>
          <span><CalendarDays size={18} /> Planejamento mensal</span>
          <h2>{selected.label}</h2>
          <p>{period === 'current' ? 'Acompanhe o que ainda falta pagar neste mes.' : 'Veja a previsao para se preparar antes do mes virar.'}</p>
        </div>
        <div className="monthly-total">
          <small>Total previsto</small>
          <strong>{money.format(selected.total)}</strong>
          <em>{selected.count} gasto(s) mapeados</em>
        </div>
      </div>

      <div className="segmented monthly-tabs">
        <button className={period === 'current' ? 'active' : ''} onClick={() => setPeriod('current')}>Mes atual</button>
        <button className={period === 'next' ? 'active' : ''} onClick={() => setPeriod('next')}>Mes que vem</button>
      </div>

      <div className="segmented monthly-tabs">
        <button className={status === 'all' ? 'active' : ''} onClick={() => setStatus('all')}>Todos</button>
        <button className={status === 'aberto' ? 'active' : ''} onClick={() => setStatus('aberto')}>Aberto</button>
        <button className={status === 'pago' ? 'active' : ''} onClick={() => setStatus('pago')}>Pago</button>
        <button className={status === 'vencido' ? 'active' : ''} onClick={() => setStatus('vencido')}>Vencido</button>
      </div>

      <div className="metric-grid monthly-summary">
        <article className="metric-card">
          <span className="danger"><CircleDollarSign size={20} /></span>
          <small>Total a pagar</small>
          <strong>{money.format(selected.total)}</strong>
          <em className="neutral">Previsto no periodo</em>
        </article>
        <article className="metric-card">
          <span className="positive"><CheckCircle2 size={20} /></span>
          <small>Ja pago</small>
          <strong>{money.format(selected.paid)}</strong>
          <em className="neutral">Baixado como pago</em>
        </article>
        <article className="metric-card">
          <span className="warning"><WalletCards size={20} /></span>
          <small>Falta pagar</small>
          <strong>{money.format(selected.open)}</strong>
          <em className="neutral">Aberto ou vencido</em>
        </article>
      </div>

      <div className="monthly-type-grid">
        {Object.entries(typeMeta).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <button className={type === key ? 'monthly-type-card active' : 'monthly-type-card'} key={key} onClick={() => setType(type === key ? 'all' : key)}>
              <Icon size={22} />
              <span>{meta.label}</span>
              <strong>{money.format(selected.byType[key].total)}</strong>
              <small>{selected.byType[key].count} item(ns)</small>
              <em>{meta.text}</em>
            </button>
          );
        })}
      </div>

      <article className="panel">
        <div className="panel-head">
          <h2>{type === 'all' ? 'Todos os gastos' : `Gastos ${typeMeta[type].label.toLowerCase()}`}</h2>
          <button className="secondary-inline" onClick={() => setType('all')}>Ver todos</button>
        </div>
        {visibleItems.length ? (
          <div className="monthly-expense-list">
            {visibleItems.map((item) => {
              const date = new Date(`${String(item.due_date).slice(0, 10)}T00:00:00`);
              return (
                <div key={`${item.id}-${item.type}-${item.due_date}`}>
                  <span>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  <b>{item.description}<small>{item.category} - {item.type_label}{item.recurring ? ' - mensal' : ''}</small></b>
                  <strong>{money.format(item.amount)}</strong>
                  <i className={`status-badge ${String(item.status).replaceAll('_', '-')}`}>{String(item.status).replaceAll('_', ' ')}</i>
                  {item.status !== 'pago' && (
                    <button className="pay-expense-button" onClick={() => markAsPaid(item)} disabled={payingId === item.id}>
                      <CheckCircle2 size={15} /> {payingId === item.id ? 'Baixando...' : 'Marcar pago'}
                    </button>
                  )}
                  <button className="repeat-expense-button" onClick={() => duplicateNextMonth(item)} disabled={duplicatingId === item.id}>
                    <CopyPlus size={15} /> {duplicatingId === item.id ? 'Repetindo...' : 'Mes que vem'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-panel compact-empty">Nenhum gasto encontrado. Adicione mercado, aluguel, internet ou outro gasto para calcular o mes.</div>
        )}
      </article>

      {quickOpen && expenseResource && (
        <QuickCreateModal
          resource={expenseResource}
          onClose={() => setQuickOpen(false)}
          onSaved={async () => {
            setQuickOpen(false);
            await load();
          }}
        />
      )}
    </section>
  );
}
