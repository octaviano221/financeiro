import { query } from '../config/db.js';
import { roundMoney, toNumber } from '../utils/money.js';

export function getPeriodRange(period = 'month', startDate, endDate) {
  const now = new Date();
  if (period === 'today') {
    const day = now.toISOString().slice(0, 10);
    return { start: day, end: day };
  }
  if (period === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }
  if (period === 'year') {
    return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` };
  }
  if (period === 'custom' && startDate && endDate) return { start: startDate, end: endDate };
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  };
}

export async function getCashFlow(userId, filters = {}) {
  const { start, end } = getPeriodRange(filters.period, filters.start, filters.end);
  const [incomes, expenses, cardTransactions, debts] = await Promise.all([
    query('SELECT id, description, amount, received_date AS date, status FROM incomes WHERE user_id = :userId AND received_date BETWEEN :start AND :end', { userId, start, end }),
    query('SELECT id, description, amount, due_date AS date, status FROM expenses WHERE user_id = :userId AND due_date BETWEEN :start AND :end', { userId, start, end }),
    query('SELECT id, description, amount, purchase_date AS date, status FROM card_transactions WHERE user_id = :userId AND purchase_date BETWEEN :start AND :end', { userId, start, end }),
    query('SELECT id, debt_name AS description, installment_value AS amount, due_date AS date, status FROM debts WHERE user_id = :userId AND due_date BETWEEN :start AND :end AND status <> "quitada"', { userId, start, end })
  ]);

  const days = new Map();
  function ensure(date) {
    if (!days.has(date)) days.set(date, { date, entradasPrevistas: 0, entradasRealizadas: 0, saidasPrevistas: 0, saidasRealizadas: 0, saldo: 0, events: [] });
    return days.get(date);
  }

  incomes.forEach((item) => {
    const day = ensure(String(item.date).slice(0, 10));
    const amount = toNumber(item.amount);
    if (item.status === 'recebido') day.entradasRealizadas += amount;
    else day.entradasPrevistas += amount;
    day.events.push({ type: 'receita', description: item.description, amount, status: item.status });
  });

  [...expenses, ...cardTransactions, ...debts].forEach((item) => {
    const day = ensure(String(item.date).slice(0, 10));
    const amount = toNumber(item.amount);
    if (['pago', 'paga'].includes(item.status)) day.saidasRealizadas += amount;
    else day.saidasPrevistas += amount;
    day.events.push({ type: 'saida', description: item.description, amount, status: item.status });
  });

  let runningBalance = 0;
  const daily = [...days.values()].sort((a, b) => a.date.localeCompare(b.date)).map((day) => {
    runningBalance += day.entradasPrevistas + day.entradasRealizadas - day.saidasPrevistas - day.saidasRealizadas;
    return {
      ...day,
      entradasPrevistas: roundMoney(day.entradasPrevistas),
      entradasRealizadas: roundMoney(day.entradasRealizadas),
      saidasPrevistas: roundMoney(day.saidasPrevistas),
      saidasRealizadas: roundMoney(day.saidasRealizadas),
      saldo: roundMoney(runningBalance)
    };
  });

  const totals = daily.reduce((acc, day) => ({
    entradasPrevistas: acc.entradasPrevistas + day.entradasPrevistas,
    entradasRealizadas: acc.entradasRealizadas + day.entradasRealizadas,
    saidasPrevistas: acc.saidasPrevistas + day.saidasPrevistas,
    saidasRealizadas: acc.saidasRealizadas + day.saidasRealizadas,
    saldo: day.saldo
  }), { entradasPrevistas: 0, entradasRealizadas: 0, saidasPrevistas: 0, saidasRealizadas: 0, saldo: 0 });

  return { range: { start, end }, totals, daily, alerts: daily.filter((day) => day.saldo < 0).map((day) => `Saldo negativo previsto em ${day.date}`) };
}

export async function getCalendarEvents(userId, filters = {}) {
  const { start, end } = getPeriodRange(filters.period || 'month', filters.start, filters.end);
  const cashFlow = await getCashFlow(userId, { period: 'custom', start, end });
  const events = cashFlow.daily.flatMap((day) => day.events.map((event) => ({ ...event, date: day.date })));
  return { range: { start, end }, events };
}

export function simulateRenegotiation(payload) {
  const debtAmount = toNumber(payload.current_amount);
  const downPayment = toNumber(payload.down_payment);
  const installments = Math.max(1, Number(payload.installments || 1));
  const monthlyRate = toNumber(payload.monthly_interest_rate) / 100;
  const principal = Math.max(0, debtAmount - downPayment);
  const installmentValue = monthlyRate > 0
    ? principal * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1)
    : principal / installments;
  const totalFinal = downPayment + installmentValue * installments;
  const currentScenarioTotal = toNumber(payload.current_scenario_total) || debtAmount;
  const economy = currentScenarioTotal - totalFinal;

  return {
    installment_value: roundMoney(installmentValue),
    total_final: roundMoney(totalFinal),
    economy: roundMoney(economy),
    improves: economy >= 0,
    message: economy >= 0
      ? 'A renegociacao melhora o custo total estimado.'
      : 'A renegociacao piora o custo total estimado. Avalie prazo, juros e entrada.'
  };
}
