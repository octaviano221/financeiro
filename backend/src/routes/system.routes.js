import { Router } from 'express';
import { authRequired } from '../middlewares/auth.js';
import { query } from '../config/db.js';
import { getFinancialSnapshot } from '../services/dashboardService.js';
import { ensureDefaultCategories } from '../services/categoryDefaultsService.js';
import { roundMoney, toNumber } from '../utils/money.js';

const router = Router();

router.get('/status', authRequired, async (req, res, next) => {
  try {
    const checks = {
      api: true,
      database: false,
      tables: {},
      user: Boolean(req.user?.id)
    };
    await query('SELECT 1 AS ok');
    checks.database = true;
    const tables = ['users', 'bank_accounts', 'credit_cards', 'debts', 'incomes', 'expenses', 'payments', 'user_settings'];
    for (const table of tables) {
      try {
        await query(`SELECT COUNT(*) AS total FROM ${table}`);
        checks.tables[table] = true;
      } catch {
        checks.tables[table] = false;
      }
    }
    res.json({
      status: Object.values(checks.tables).every(Boolean) && checks.database ? 'ok' : 'attention',
      version: '1.0.0',
      checked_at: new Date().toISOString(),
      checks
    });
  } catch (error) {
    next(error);
  }
});

router.get('/upcoming', authRequired, async (req, res, next) => {
  try {
    const days = Number(req.query.days || 30);
    const rows = await query(
      `SELECT 'expense' AS type, id, description, amount, due_date AS due_date, status
       FROM expenses
       WHERE user_id = :userId AND status IN ('aberto','vencido') AND due_date <= DATE_ADD(CURDATE(), INTERVAL :days DAY)
       UNION ALL
       SELECT 'debt' AS type, id, debt_name AS description, installment_value AS amount, due_date AS due_date, status
       FROM debts
       WHERE user_id = :userId AND status <> 'quitada' AND due_date IS NOT NULL AND due_date <= DATE_ADD(CURDATE(), INTERVAL :days DAY)
       UNION ALL
       SELECT 'card' AS type, id, card_name AS description, current_invoice_value AS amount, STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(CURDATE()), '-', due_day), '%Y-%m-%d') AS due_date, status
       FROM credit_cards
       WHERE user_id = :userId AND status <> 'paga' AND current_invoice_value > 0
       ORDER BY due_date ASC
       LIMIT 8`,
      { userId: req.user.id, days }
    );

    res.json(rows.map((item) => ({
      ...item,
      amount: roundMoney(toNumber(item.amount))
    })));
  } catch (error) {
    next(error);
  }
});

router.get('/next-month-payables', authRequired, async (req, res, next) => {
  try {
    const { start, end, year, month } = nextMonthRange();
    const [expenses, debts, cards] = await Promise.all([
      query(
        `SELECT e.id, e.description, e.amount, e.due_date, e.is_recurring, e.recurrence_type, e.status, c.name AS category_name
         FROM expenses e
         LEFT JOIN categories c ON c.id = e.category_id AND c.user_id = e.user_id
         WHERE e.user_id = :userId
           AND e.status <> 'cancelado'
           AND (
             e.due_date BETWEEN :start AND :end
             OR (e.is_recurring = TRUE AND e.recurrence_type = 'mensal' AND e.due_date <= :end)
           )`,
        { userId: req.user.id, start, end }
      ),
      query(
        `SELECT id, debt_name AS description, installment_value AS amount, due_date, status
         FROM debts
         WHERE user_id = :userId AND status <> 'quitada' AND due_date BETWEEN :start AND :end`,
        { userId: req.user.id, start, end }
      ),
      query(
        `SELECT id, card_name AS description, current_invoice_value AS amount, due_day, status
         FROM credit_cards
         WHERE user_id = :userId AND status <> 'paga' AND current_invoice_value > 0`,
        { userId: req.user.id }
      )
    ]);

    const expenseItems = expenses.map((expense) => ({
      type: 'expense',
      id: expense.id,
      description: expense.description,
      category: expense.category_name || 'Despesa',
      amount: roundMoney(toNumber(expense.amount)),
      due_date: expense.is_recurring ? dateForDay(year, month, dayOfMonth(expense.due_date)) : String(expense.due_date).slice(0, 10),
      recurring: Boolean(expense.is_recurring),
      status: expense.status
    }));
    const debtItems = debts.map((debt) => ({
      type: 'debt',
      id: debt.id,
      description: debt.description,
      category: 'Divida',
      amount: roundMoney(toNumber(debt.amount)),
      due_date: String(debt.due_date).slice(0, 10),
      recurring: false,
      status: debt.status
    }));
    const cardItems = cards.map((card) => ({
      type: 'card',
      id: card.id,
      description: card.description,
      category: 'Cartao',
      amount: roundMoney(toNumber(card.amount)),
      due_date: dateForDay(year, month, Number(card.due_day || 1)),
      recurring: true,
      status: card.status
    }));

    const items = [...expenseItems, ...debtItems, ...cardItems]
      .filter((item) => item.amount > 0)
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      total: roundMoney(total),
      count: items.length,
      items: items.slice(0, 12)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/monthly-expenses', authRequired, async (req, res, next) => {
  try {
    const current = monthRange(0);
    const nextMonth = monthRange(1);
    const [currentRows, nextRows] = await Promise.all([
      listMonthExpenses(req.user.id, current),
      listMonthExpenses(req.user.id, nextMonth)
    ]);

    const currentItems = currentRows.map((item) => formatMonthlyExpense(item, current));
    const nextItems = nextRows.map((item) => formatMonthlyExpense(item, nextMonth));

    res.json({
      current: buildMonthlyExpenseSummary(current, currentItems),
      next: buildMonthlyExpenseSummary(nextMonth, nextItems)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/default-categories/ensure', authRequired, async (req, res, next) => {
  try {
    res.json(await ensureDefaultCategories(req.user.id));
  } catch (error) {
    next(error);
  }
});

router.post('/monthly-expenses/:id/duplicate-next-month', authRequired, async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM expenses WHERE id = :id AND user_id = :userId', { id: req.params.id, userId: req.user.id });
    const expense = rows[0];
    if (!expense) return res.status(404).json({ message: 'Gasto nao encontrado' });

    const next = monthRange(1);
    const dueDate = dateForDay(next.year, next.month, dayOfMonth(expense.due_date));
    const result = await query(
      `INSERT INTO expenses (user_id, description, amount, due_date, category_id, bank_account_id, is_recurring, recurrence_type, status, notes)
       VALUES (:userId, :description, :amount, :dueDate, :categoryId, :bankAccountId, FALSE, NULL, 'aberto', :notes)`,
      {
        userId: req.user.id,
        description: expense.description,
        amount: roundMoney(toNumber(expense.amount)),
        dueDate,
        categoryId: expense.category_id || null,
        bankAccountId: expense.bank_account_id || null,
        notes: expense.notes || null
      }
    );
    const created = await query('SELECT * FROM expenses WHERE id = :id AND user_id = :userId', { id: result.insertId, userId: req.user.id });
    res.status(201).json(created[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/onboarding', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rows = await query(
      `SELECT
        (SELECT COUNT(*) FROM bank_accounts WHERE user_id = :userId) AS banks,
        (SELECT COUNT(*) FROM incomes WHERE user_id = :userId) AS incomes,
        (SELECT COUNT(*) FROM expenses WHERE user_id = :userId) AS expenses,
        (SELECT COUNT(*) FROM debts WHERE user_id = :userId) AS debts,
        (SELECT COUNT(*) FROM credit_cards WHERE user_id = :userId) AS cards`,
      { userId }
    );
    const counts = rows[0];
    const steps = [
      { id: 'bank', title: 'Cadastrar primeiro banco', path: '/bancos', done: Number(counts.banks) > 0 },
      { id: 'income', title: 'Cadastrar primeira receita', path: '/receitas', done: Number(counts.incomes) > 0 },
      { id: 'expense', title: 'Cadastrar primeira despesa', path: '/despesas', done: Number(counts.expenses) > 0 },
      { id: 'debt', title: 'Cadastrar primeira divida', path: '/dividas', done: Number(counts.debts) > 0 },
      { id: 'card', title: 'Cadastrar cartao de credito', path: '/cartoes', done: Number(counts.cards) > 0 }
    ];
    const completed = steps.filter((step) => step.done).length;
    res.json({ completed, total: steps.length, progress: Math.round((completed / steps.length) * 100), steps });
  } catch (error) {
    next(error);
  }
});

export default router;

async function listMonthExpenses(userId, range) {
  return query(
    `SELECT e.id, e.description, e.amount, e.due_date, e.payment_date, e.is_recurring, e.recurrence_type, e.status, c.name AS category_name
     FROM expenses e
     LEFT JOIN categories c ON c.id = e.category_id AND c.user_id = e.user_id
     WHERE e.user_id = :userId
       AND e.status <> 'cancelado'
       AND (
         e.due_date BETWEEN :start AND :end
         OR (e.is_recurring = TRUE AND e.recurrence_type = 'mensal' AND e.due_date <= :end)
       )
     ORDER BY e.due_date ASC, e.created_at DESC`,
    { userId, start: range.start, end: range.end }
  );
}

function formatMonthlyExpense(item, range) {
  const type = classifyExpense(item);
  return {
    id: item.id,
    description: item.description,
    amount: roundMoney(toNumber(item.amount)),
    due_date: item.is_recurring ? dateForDay(range.year, range.month, dayOfMonth(item.due_date)) : String(item.due_date).slice(0, 10),
    payment_date: item.payment_date ? String(item.payment_date).slice(0, 10) : null,
    category: item.category_name || 'Sem categoria',
    type,
    type_label: { fixed: 'Fixo', variable: 'Variavel', extra: 'Extra' }[type],
    recurring: Boolean(item.is_recurring),
    status: item.status
  };
}

function classifyExpense(item) {
  if (item.is_recurring && item.recurrence_type === 'mensal') return 'fixed';
  const text = `${item.category_name || ''} ${item.description || ''}`.toLowerCase();
  if (['mercado', 'alimentacao', 'combustivel', 'transporte', 'farmacia', 'saude', 'manutencao'].some((word) => text.includes(word))) return 'variable';
  return 'extra';
}

function buildMonthlyExpenseSummary(range, items) {
  const byType = {
    fixed: summarizeType(items, 'fixed'),
    variable: summarizeType(items, 'variable'),
    extra: summarizeType(items, 'extra')
  };
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const paid = items.filter((item) => item.status === 'pago').reduce((sum, item) => sum + item.amount, 0);
  const open = total - paid;
  return {
    month: range.key,
    label: new Date(range.year, range.month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    total: roundMoney(total),
    paid: roundMoney(paid),
    open: roundMoney(open),
    count: items.length,
    byType,
    items
  };
}

function summarizeType(items, type) {
  const filtered = items.filter((item) => item.type === type);
  return {
    total: roundMoney(filtered.reduce((sum, item) => sum + item.amount, 0)),
    count: filtered.length,
    items: filtered
  };
}

function nextMonthRange() {
  return monthRange(1);
}

function monthRange(offset) {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { start, end, year, month, key: `${year}-${String(month + 1).padStart(2, '0')}` };
}

function dayOfMonth(value) {
  const day = Number(String(value).slice(8, 10));
  return Number.isFinite(day) && day > 0 ? day : 1;
}

function dateForDay(year, month, day) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(Math.max(1, day), lastDay)).toISOString().slice(0, 10);
}
