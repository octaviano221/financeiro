import { query } from '../config/db.js';
import { daysBetween, roundMoney, toNumber } from '../utils/money.js';

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

function daysRemainingInMonth() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(1, end.getDate() - now.getDate() + 1);
}

export async function getFinancialSnapshot(userId) {
  const { start, end } = currentMonthRange();
  const [banks, cards, debts, incomes, expenses, goals] = await Promise.all([
    query('SELECT * FROM bank_accounts WHERE user_id = :userId', { userId }),
    query('SELECT * FROM credit_cards WHERE user_id = :userId', { userId }),
    query('SELECT * FROM debts WHERE user_id = :userId', { userId }),
    query('SELECT * FROM incomes WHERE user_id = :userId AND received_date BETWEEN :start AND :end', { userId, start, end }),
    query('SELECT * FROM expenses WHERE user_id = :userId AND due_date BETWEEN :start AND :end', { userId, start, end }),
    query('SELECT * FROM financial_goals WHERE user_id = :userId', { userId })
  ]);

  const totalBankBalance = banks.reduce((sum, item) => sum + toNumber(item.current_balance), 0);
  const totalOverdraftUsed = banks.reduce((sum, item) => sum + toNumber(item.overdraft_used), 0);
  const totalCardOpen = cards.reduce((sum, item) => sum + toNumber(item.current_invoice_value), 0);
  const totalCardLimit = cards.reduce((sum, item) => sum + toNumber(item.total_limit), 0);
  const totalDebts = debts.filter((item) => item.status !== 'quitada').reduce((sum, item) => sum + toNumber(item.current_amount), 0);
  const totalLoans = debts.filter((item) => ['emprestimo_pessoal', 'financiamento'].includes(item.debt_type)).reduce((sum, item) => sum + toNumber(item.current_amount), 0);
  const monthlyIncome = incomes.filter((item) => item.status !== 'cancelado').reduce((sum, item) => sum + toNumber(item.amount), 0);
  const receivedIncome = incomes.filter((item) => item.status === 'recebido').reduce((sum, item) => sum + toNumber(item.amount), 0);
  const pendingIncome = incomes.filter((item) => item.status !== 'recebido' && item.status !== 'cancelado').reduce((sum, item) => sum + toNumber(item.amount), 0);
  const monthlyExpenses = expenses.filter((item) => item.status !== 'cancelado').reduce((sum, item) => sum + toNumber(item.amount), 0);
  const paidExpenses = expenses.filter((item) => item.status === 'pago').reduce((sum, item) => sum + toNumber(item.amount), 0);
  const openExpenses = expenses.filter((item) => item.status === 'aberto' || item.status === 'vencido').reduce((sum, item) => sum + toNumber(item.amount), 0);
  const overdueExpenses = expenses.filter((item) => item.status === 'vencido' || (item.status === 'aberto' && new Date(item.due_date) < new Date()));
  const upcomingExpenses = expenses.filter((item) => item.status === 'aberto' && new Date(item.due_date) >= new Date());
  const debtInstallments = debts.filter((item) => item.status !== 'quitada').reduce((sum, item) => sum + toNumber(item.installment_value), 0);
  const commitment = monthlyIncome > 0 ? ((monthlyExpenses + debtInstallments + totalCardOpen) / monthlyIncome) * 100 : 0;
  const cardUsage = totalCardLimit > 0 ? (cards.reduce((sum, item) => sum + toNumber(item.used_limit), 0) / totalCardLimit) * 100 : 0;
  const expectedMonthlyBalance = monthlyIncome - monthlyExpenses - debtInstallments - totalCardOpen;
  const projectedCashBalance = expectedMonthlyBalance;
  const essentialOutflow = openExpenses + debtInstallments + totalCardOpen;
  const freeToSpend = Math.max(0, projectedCashBalance);
  const daysLeft = daysRemainingInMonth();

  const score = calculateHealthScore({ totalOverdraftUsed, overdueExpenses, cardUsage, commitment, monthlyIncome, monthlyExpenses, debts, goals });
  const alerts = buildAlerts({ banks, cards, debts, monthlyIncome, monthlyExpenses, totalCardOpen, commitment, overdueExpenses, upcomingExpenses });

  return {
    banks,
    cards,
    debts,
    incomes,
    expenses,
    goals,
    summary: {
      totalBankBalance: roundMoney(totalBankBalance),
      totalDebts: roundMoney(totalDebts),
      totalOverdraftUsed: roundMoney(totalOverdraftUsed),
      totalCardOpen: roundMoney(totalCardOpen),
      totalLoans: roundMoney(totalLoans),
      overdueBills: overdueExpenses.length,
      upcomingBills: upcomingExpenses.length,
      monthlyIncome: roundMoney(monthlyIncome),
      receivedIncome: roundMoney(receivedIncome),
      pendingIncome: roundMoney(pendingIncome),
      monthlyExpenses: roundMoney(monthlyExpenses),
      paidExpenses: roundMoney(paidExpenses),
      openExpenses: roundMoney(openExpenses),
      debtInstallments: roundMoney(debtInstallments),
      expectedMonthlyBalance: roundMoney(expectedMonthlyBalance),
      projectedCashBalance: roundMoney(projectedCashBalance),
      essentialOutflow: roundMoney(essentialOutflow),
      freeToSpend: roundMoney(freeToSpend),
      dailySafeSpend: roundMoney(freeToSpend / daysLeft),
      daysRemainingInMonth: daysLeft,
      incomeCommitmentPercent: roundMoney(commitment),
      riskLevel: score.score <= 30 ? 'critico' : score.score <= 50 ? 'atencao' : score.score <= 70 ? 'regular' : score.score <= 85 ? 'bom' : 'excelente'
    },
    health: score,
    alerts
  };
}

function calculateHealthScore({ totalOverdraftUsed, overdueExpenses, cardUsage, commitment, monthlyIncome, monthlyExpenses, debts, goals }) {
  let score = 100;
  if (totalOverdraftUsed > 0) score -= 18;
  if (overdueExpenses.length > 0) score -= Math.min(20, overdueExpenses.length * 5);
  if (cardUsage > 80) score -= 15;
  if (commitment > 70) score -= 22;
  else if (commitment > 50) score -= 12;
  if (debts.some((item) => toNumber(item.monthly_interest_rate) >= 8 && item.status !== 'quitada')) score -= 10;
  if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) score -= 15;
  if (!goals.some((goal) => goal.goal_name?.toLowerCase().includes('reserva') && toNumber(goal.current_amount) > 0)) score -= 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const classification = score <= 30 ? 'critico' : score <= 50 ? 'atencao' : score <= 70 ? 'regular' : score <= 85 ? 'bom' : 'excelente';
  const message = {
    critico: 'A situacao exige acao imediata: reduza juros caros, renegocie vencidos e proteja contas essenciais.',
    atencao: 'Ha sinais importantes de risco. Priorize dividas caras e reduza gastos nao essenciais.',
    regular: 'O controle existe, mas ainda ha espaco para melhorar comprometimento e reserva.',
    bom: 'A organizacao financeira esta positiva. Mantenha acompanhamento e metas ativas.',
    excelente: 'Saude financeira muito boa. Continue acompanhando fluxo de caixa e metas.'
  }[classification];

  return { score, classification, message };
}

function buildAlerts({ banks, cards, debts, monthlyIncome, monthlyExpenses, totalCardOpen, commitment, overdueExpenses }) {
  const alerts = [];
  banks.filter((bank) => toNumber(bank.overdraft_used) > 0).forEach((bank) => {
    alerts.push({
      title: 'Cheque especial em uso',
      message: `${bank.bank_name} possui R$ ${toNumber(bank.overdraft_used).toFixed(2)} em cheque especial usado.`,
      severity: 'alta'
    });
  });
  cards.filter((card) => toNumber(card.used_limit) / Math.max(1, toNumber(card.total_limit)) >= 0.8).forEach((card) => {
    alerts.push({
      title: 'Cartao acima de 80% do limite',
      message: `${card.card_name} esta com limite muito comprometido.`,
      severity: 'media'
    });
  });
  if (monthlyIncome > 0 && totalCardOpen / monthlyIncome > 0.4) {
    alerts.push({ title: 'Fatura alta', message: 'O cartao representa mais de 40% da renda mensal.', severity: 'alta' });
  }
  if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) {
    alerts.push({ title: 'Despesa maior que receita', message: 'Existe risco de faltar saldo no mes atual.', severity: 'urgente' });
  }
  if (commitment > 70) {
    alerts.push({ title: 'Renda muito comprometida', message: 'O comprometimento da renda esta acima de 70%.', severity: 'urgente' });
  }
  overdueExpenses.forEach((expense) => {
    alerts.push({
      title: 'Conta vencida',
      message: `${expense.description} esta vencida ha ${daysBetween(expense.due_date)} dia(s).`,
      severity: 'alta'
    });
  });
  debts.filter((debt) => debt.status === 'atrasada').forEach((debt) => {
    alerts.push({ title: 'Divida atrasada', message: `${debt.debt_name} deve ser renegociada ou priorizada.`, severity: 'alta' });
  });
  return alerts.slice(0, 12);
}

export function buildCharts(snapshot) {
  const incomeByMonth = new Map();
  const expenseByMonth = new Map();
  snapshot.incomes.forEach((item) => incomeByMonth.set(String(item.received_date).slice(0, 7), (incomeByMonth.get(String(item.received_date).slice(0, 7)) || 0) + toNumber(item.amount)));
  snapshot.expenses.forEach((item) => expenseByMonth.set(String(item.due_date).slice(0, 7), (expenseByMonth.get(String(item.due_date).slice(0, 7)) || 0) + toNumber(item.amount)));
  const months = [...new Set([...incomeByMonth.keys(), ...expenseByMonth.keys()])].sort();

  const categoryTotals = snapshot.expenses.reduce((acc, item) => {
    const key = item.category_id ? `Categoria ${item.category_id}` : 'Sem categoria';
    acc[key] = (acc[key] || 0) + toNumber(item.amount);
    return acc;
  }, {});

  return {
    cashFlow: months.map((month) => ({ month, entradas: roundMoney(incomeByMonth.get(month) || 0), saidas: roundMoney(expenseByMonth.get(month) || 0) })),
    debts: snapshot.debts.map((debt) => ({ name: debt.debt_name, valor: roundMoney(debt.current_amount), juros: toNumber(debt.monthly_interest_rate) })),
    expensesByCategory: Object.entries(categoryTotals).map(([name, value]) => ({ name, value: roundMoney(value) }))
  };
}
