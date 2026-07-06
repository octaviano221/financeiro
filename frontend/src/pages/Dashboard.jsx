import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Banknote, CalendarDays, CreditCard, HandCoins, HeartPulse, Landmark, Plus, Receipt, ShieldAlert, ShoppingCart, Target, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client.js';
import { QuickCreateModal } from '../components/QuickCreateModal.jsx';
import { resources } from '../resources.js';
import { useConfirm } from '../state/ConfirmContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const colors = ['#2563eb', '#16a34a', '#f97316', '#dc2626', '#7c3aed'];

export function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [health, setHealth] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState('');
  const [upcoming, setUpcoming] = useState([]);
  const [nextMonth, setNextMonth] = useState(null);
  const [quickResource, setQuickResource] = useState(null);
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setError('');
    const [summaryRes, chartsRes, alertsRes, healthRes, upcomingRes, nextMonthRes] = await Promise.allSettled([
      api.get('/dashboard/summary'),
      api.get('/dashboard/charts'),
      api.get('/dashboard/alerts'),
      api.get('/dashboard/financial-health'),
      api.get('/system/upcoming'),
      api.get('/system/next-month-payables')
    ]);

    if (summaryRes.status === 'fulfilled') {
      setSummary(summaryRes.value.data);
    } else {
      setError('Nao foi possivel carregar o resumo financeiro. Confira se as tabelas do banco foram criadas e se as variaveis DB_* estao corretas.');
      setSummary({
        totalBankBalance: 0,
        totalDebts: 0,
        totalOverdraftUsed: 0,
        totalCardOpen: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        upcomingBills: 0,
        overdueBills: 0,
        incomeCommitmentPercent: 0,
        expectedMonthlyBalance: 0
      });
    }

    setCharts(chartsRes.status === 'fulfilled' ? chartsRes.value.data : { cashFlow: [], debts: [], expensesByCategory: [] });
    setAlerts(alertsRes.status === 'fulfilled' ? alertsRes.value.data : []);
    setHealth(healthRes.status === 'fulfilled' ? healthRes.value.data : { score: 0, classification: 'atencao', message: 'Saude financeira indisponivel enquanto o banco nao responde.' });
    setUpcoming(upcomingRes.status === 'fulfilled' ? upcomingRes.value.data : []);
    setNextMonth(nextMonthRes.status === 'fulfilled' ? nextMonthRes.value.data : null);
  }

  async function seedDemo() {
    try {
      setLoadingDemo(true);
      await api.post('/demo/seed');
      showToast('Dados demo adicionados.');
      await loadDashboard();
    } catch (err) {
      showToast(err.response?.data?.message || 'Nao foi possivel carregar a demo.', 'error');
    } finally {
      setLoadingDemo(false);
    }
  }

  async function clearFinancialData() {
    const ok = await confirm({
      title: 'Limpar dados financeiros',
      message: 'Isso remove bancos, receitas, despesas, dividas, cartoes, metas, pagamentos e alertas desta conta. Seu login continua ativo.',
      confirmText: 'Limpar dados'
    });
    if (!ok) return;
    try {
      await api.delete('/demo/clear');
      showToast('Dados financeiros removidos.');
      await loadDashboard();
    } catch (err) {
      showToast(err.response?.data?.message || 'Nao foi possivel limpar os dados.', 'error');
    }
  }

  if (!summary) return <div className="page">Carregando dashboard...</div>;

  const cards = [
    ['Saldo em Bancos', summary.totalBankBalance, Landmark, 'positive'],
    ['Total de Dividas', summary.totalDebts, Receipt, 'danger'],
    ['Cheque Especial', summary.totalOverdraftUsed, ShieldAlert, 'warning'],
    ['Cartao de Credito', summary.totalCardOpen, CreditCard, 'purple'],
    ['Receitas do Mes', summary.monthlyIncome, TrendingUp, 'positive'],
    ['Despesas do Mes', summary.monthlyExpenses, TrendingDown, 'danger']
  ];
  const statusCards = [
    ['Contas a Vencer', summary.upcomingBills, CalendarDays, 'purple'],
    ['Contas Vencidas', summary.overdueBills, Receipt, 'danger'],
    ['Renda Comprometida', `${summary.incomeCommitmentPercent}%`, HandCoins, 'warning'],
    ['Saldo Previsto', summary.expectedMonthlyBalance, Banknote, summary.expectedMonthlyBalance >= 0 ? 'positive' : 'danger'],
    ['Saude Financeira', `${health.score} / 100`, HeartPulse, 'positive']
  ];
  const hasFinancialData = [
    summary.totalBankBalance,
    summary.totalDebts,
    summary.totalOverdraftUsed,
    summary.totalCardOpen,
    summary.monthlyIncome,
    summary.monthlyExpenses,
    summary.upcomingBills,
    summary.overdueBills
  ].some((value) => Number(value) > 0);
  const hasCashFlowChart = (charts?.cashFlow || []).length > 0;
  const hasDebtChart = (charts?.debts || []).length > 0;
  const hasCategoryChart = (charts?.expensesByCategory || []).length > 0;
  const debtPriorityData = buildDebtPriorityData(charts?.debts || []);
  const planSteps = buildPlanSteps(summary);
  const expenseResource = resources.find((resource) => resource.endpoint === 'expenses');
  const quickResources = [
    resources.find((resource) => resource.endpoint === 'incomes'),
    resources.find((resource) => resource.endpoint === 'expenses'),
    resources.find((resource) => resource.endpoint === 'debts'),
    resources.find((resource) => resource.endpoint === 'credit-cards'),
    resources.find((resource) => resource.endpoint === 'bank-accounts')
  ].filter(Boolean);

  return (
    <section className="page dashboard-page">
      <div className="page-title">
        <div>
          <h1>Dashboard</h1>
          <p>Visao geral da sua vida financeira</p>
        </div>
        <div className="dashboard-actions">
          <button className="month-button">Mes atual: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} <CalendarDays size={16} /></button>
          <Link to="/receitas" className="primary-action"><Plus size={16} /> Acao rapida</Link>
          {hasFinancialData && <button className="danger-soft-action" onClick={clearFinancialData}><Trash2 size={16} /> Limpar demo/dados</button>}
        </div>
      </div>

      {error && (
        <article className="panel dashboard-error">
          <strong>Dashboard parcialmente indisponivel</strong>
          <p>{error}</p>
          <button onClick={loadDashboard}>Tentar novamente</button>
        </article>
      )}

      {!hasFinancialData && (
        <article className="panel onboarding-panel">
          <div>
            <h2>Comece preenchendo sua vida financeira real</h2>
            <p>Seu cadastro foi criado. Agora adicione bancos, receitas, despesas e dividas para o painel calcular tudo de verdade.</p>
          </div>
          <div className="onboarding-actions">
            <Link to="/primeiros-passos"><Target size={16} /> Guia completo</Link>
            <Link to="/receitas"><Plus size={16} /> Primeira receita</Link>
            <Link to="/despesas"><Plus size={16} /> Primeira despesa</Link>
            <Link to="/bancos"><Landmark size={16} /> Primeiro banco</Link>
            <button onClick={seedDemo} disabled={loadingDemo}>{loadingDemo ? 'Carregando...' : 'Carregar demo'}</button>
          </div>
        </article>
      )}

      <div className="metric-grid dashboard-metrics">
        {cards.map(([label, value, Icon, tone]) => (
          <article className="metric-card" key={label}>
            <span className={tone}><Icon size={20} /></span>
            <small>{label}</small>
            <strong>{typeof value === 'number' ? money.format(value) : value}</strong>
            <em className="neutral">{hasFinancialData ? 'Atualizado com seus dados' : 'Sem dados cadastrados'}</em>
          </article>
        ))}
      </div>

      <div className="dashboard-board">
        <div className="dashboard-main">
        <article className="panel">
          <div className="panel-head"><h2>Entradas x Saidas</h2><span>Ultimos 5 meses</span></div>
          {hasCashFlowChart ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts?.cashFlow || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => money.format(value)} />
                <Bar dataKey="entradas" fill="#16a34a" />
                <Bar dataKey="saidas" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyPanel text="Cadastre receitas e despesas para gerar este grafico." />}
        </article>

        <article className="panel">
          <div className="panel-head"><h2>Evolucao das Dividas</h2><span>Ultimos 5 meses</span></div>
          {hasDebtChart ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={charts.debts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => money.format(value)} />
                <Line type="monotone" dataKey="valor" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyPanel text="Cadastre dividas para acompanhar a evolucao." />}
        </article>

        <div className="status-strip">
          {statusCards.map(([label, value, Icon, tone]) => (
            <div className="status-item" key={label}>
              <span className={tone}><Icon size={20} /></span>
              <small>{label}</small>
              <strong>{typeof value === 'number' && label !== 'Contas a Vencer' && label !== 'Contas Vencidas' ? money.format(value) : value}</strong>
            </div>
          ))}
        </div>

        <article className="panel">
          <div className="panel-head"><h2>Gastos por Categoria</h2><span>Mes atual</span></div>
          {hasCategoryChart ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={charts.expensesByCategory} dataKey="value" nameKey="name" outerRadius={85}>
                  {charts.expensesByCategory.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => money.format(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyPanel text="Cadastre despesas com categoria para visualizar seus gastos." />}
        </article>

        <article className="panel">
          <div className="panel-head"><h2>Proximos vencimentos</h2><Link to="/despesas">Ver calendario</Link></div>
          {upcoming.length ? (
            <div className="due-list">
              {upcoming.map((item) => {
                const date = new Date(`${String(item.due_date).slice(0, 10)}T00:00:00`);
                return (
                  <div key={`${item.type}-${item.id}`}>
                    <b>{date.toLocaleDateString('pt-BR', { day: '2-digit' })}<small>{date.toLocaleDateString('pt-BR', { month: 'short' })}</small></b>
                    <span>{item.description}</span>
                    <strong>{money.format(item.amount)}</strong>
                    <Link to="/pagamentos" className="pay-shortcut">Pagar</Link>
                  </div>
                );
              })}
            </div>
          ) : <EmptyPanel text="Cadastre despesas, faturas ou dividas com vencimento para listar aqui." compact />}
        </article>

        <article className="panel next-month-card">
          <div className="panel-head">
            <h2>Gastos do proximo mes</h2>
            {expenseResource && <button onClick={() => setQuickResource(expenseResource)}><Plus size={15} /> Adicionar gasto</button>}
          </div>
          <div className="next-month-total">
            <span><ShoppingCart size={22} /></span>
            <div>
              <small>{nextMonth?.label || 'Proximo mes'}</small>
              <strong>{money.format(nextMonth?.total || 0)}</strong>
              <em>{nextMonth?.count || 0} conta(s) previstas</em>
            </div>
          </div>
          {nextMonth?.items?.length ? (
            <div className="month-payable-list">
              {nextMonth.items.slice(0, 6).map((item) => {
                const date = new Date(`${String(item.due_date).slice(0, 10)}T00:00:00`);
                return (
                  <div key={`${item.type}-${item.id}-${item.due_date}`}>
                    <span>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                    <b>{item.description}<small>{item.category}{item.recurring ? ' - mensal' : ''}</small></b>
                    <strong>{money.format(item.amount)}</strong>
                  </div>
                );
              })}
            </div>
          ) : <EmptyPanel text="Cadastre gastos como mercado, aluguel e internet para prever o proximo mes." compact />}
        </article>

        <article className="panel">
          <div className="panel-head"><h2>Dividas por prioridade</h2></div>
          {debtPriorityData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={debtPriorityData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86}>
                  {debtPriorityData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyPanel text="Cadastre dividas para calcular prioridades." />}
        </article>
        </div>

        <aside className="dashboard-side">
        <article className="panel">
          <div className="panel-head"><h2>Alertas importantes</h2><Link to="/despesas">Ver todos</Link></div>
          <div className="alert-list">
            {alerts.length === 0 && <p>Nenhum alerta critico no momento.</p>}
            {alerts.map((alert, index) => (
              <div className={`alert ${alert.severity}`} key={`${alert.title}-${index}`}>
                <AlertTriangle size={18} />
                <div><strong>{alert.title}</strong><span>{alert.message}</span></div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel action-card">
          <div className="panel-head"><h2>Plano de acao recomendado</h2><Link to="/plano-de-acao">Ver plano completo</Link></div>
          <p>{hasFinancialData ? 'Com base na sua situacao financeira, recomendamos:' : 'Cadastre seus dados para gerar recomendacoes personalizadas.'}</p>
          <ol>
            {planSteps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}
          </ol>
          <Link to="/plano-de-acao" className="full-action">Ver plano detalhado</Link>
        </article>
        </aside>
      </div>

      <div className="quick-action-bar">
        <strong>Acoes rapidas</strong>
        {quickResources.map((resource) => (
          <button key={resource.endpoint} onClick={() => setQuickResource(resource)}>
            {resource.endpoint === 'credit-cards' ? <CreditCard size={16} /> : resource.endpoint === 'bank-accounts' ? <Landmark size={16} /> : <Plus size={16} />}
            {resource.action}
          </button>
        ))}
        <Link to="/plano-de-acao"><Target size={16} /> Criar Plano</Link>
      </div>

      {quickResource && (
        <QuickCreateModal
          resource={quickResource}
          onClose={() => setQuickResource(null)}
          onSaved={async () => {
            setQuickResource(null);
            await loadDashboard();
          }}
        />
      )}
    </section>
  );
}

function EmptyPanel({ text, compact = false }) {
  return <div className={compact ? 'empty-panel compact-empty' : 'empty-panel'}>{text}</div>;
}

function buildDebtPriorityData(debts) {
  if (!debts.length) return [];
  const total = debts.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  if (!total) return [];
  return debts.map((item) => ({ name: item.name, value: item.valor }));
}

function buildPlanSteps(summary) {
  const steps = [];
  if (Number(summary.totalOverdraftUsed) > 0) steps.push('Regularizar o cheque especial');
  if (Number(summary.totalCardOpen) > 0) steps.push('Organizar o pagamento da fatura do cartao');
  if (Number(summary.overdueBills) > 0) steps.push('Priorizar contas vencidas');
  if (Number(summary.totalDebts) > 0) steps.push('Gerar plano de acao para reduzir dividas');
  if (Number(summary.monthlyIncome) === 0) steps.push('Cadastrar sua primeira receita mensal');
  if (Number(summary.monthlyExpenses) === 0) steps.push('Cadastrar despesas fixas do mes');
  return steps.slice(0, 5);
}
