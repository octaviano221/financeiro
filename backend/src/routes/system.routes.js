import { Router } from 'express';
import { authRequired } from '../middlewares/auth.js';
import { query } from '../config/db.js';
import { getFinancialSnapshot } from '../services/dashboardService.js';
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

export default router;
